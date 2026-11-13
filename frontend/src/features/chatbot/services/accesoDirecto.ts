import { apiClient } from '../../../core/apiClient';
import type { AnexoChatbot } from '../models/chatbot';
import type { EnviarPreguntaResponse } from './chatbotAPI';

/**
 * Acceso directo al servicio del chatbot (FastAPI) para quien ya inició sesión.
 *
 * Django entrega un token firmado de pocos minutos (`/chatbot/token/`) y las preguntas viajan directo al servicio, que
 * responde sin ocupar un proceso de Django mientras espera a la IA. Quién pregunta y con qué seccional se le responde
 * salen del token, no de lo que envía el navegador.
 *
 * Si el acceso directo no está disponible (sin clave configurada, ruta sin publicar o servicio caído) las funciones
 * devuelven `null` y quien llama sigue por Django como antes: activarlo es solo configuración del servidor.
 */

interface SesionDirecta {
    token: string;
    url: string;
    venceEn: number;
}

interface RespuestaToken {
    token: string;
    expira_en: number;
    url: string;
}

interface AnexoDirecto {
    id: number;
    nombre: string;
    tipo: string;
    tamano: number;
}

interface RespuestaDirecta {
    id: number | string;
    chat_id: string;
    respuesta: string;
    mensaje: string;
    fecha: string;
    usuario: string;
    error?: string | null;
    anexos?: AnexoDirecto[];
}

export interface PreguntaDirecta {
    agente_id: number;
    pregunta: string;
    pregunta_sugerida_id?: number;
    chat_id?: string;
}

/** El token se renueva un poco antes de que venza para no preguntar con uno a punto de caducar. */
const MARGEN_RENOVACION_MS = 30_000;
/** Tras un «no disponible» no se vuelve a pedir el token durante este tiempo. */
const ESPERA_SI_NO_DISPONIBLE_MS = 10 * 60_000;

let sesion: SesionDirecta | null = null;
let pendiente: Promise<SesionDirecta | null> | null = null;
let noDisponibleHasta = 0;

export function olvidarAccesoDirecto(): void {
    sesion = null;
    pendiente = null;
    noDisponibleHasta = 0;
}

async function pedirToken(): Promise<SesionDirecta | null> {
    try {
        const datos = await apiClient.post<RespuestaToken>('/chatbot/token/', {}, { suppressErrorLog: true });
        if (!datos?.token || !datos.url) return null;
        return { token: datos.token, url: datos.url.replace(/\/+$/, ''), venceEn: Date.now() + datos.expira_en * 1000 };
    } catch {
        // 503 = acceso directo sin configurar; 400 = usuario sin seccional; cualquier otro fallo: seguir por Django
        noDisponibleHasta = Date.now() + ESPERA_SI_NO_DISPONIBLE_MS;
        return null;
    }
}

async function obtenerSesion(forzar = false): Promise<SesionDirecta | null> {
    if (!forzar && Date.now() < noDisponibleHasta) return null;
    if (!forzar && sesion && sesion.venceEn - MARGEN_RENOVACION_MS > Date.now()) return sesion;
    if (!pendiente) {
        pendiente = pedirToken().then((nueva) => {
            sesion = nueva;
            return nueva;
        }).finally(() => {
            pendiente = null;
        });
    }
    return pendiente;
}

function errorDeLaRespuesta(estado: number, cuerpo: { detail?: unknown } | null): Error & { status: number } {
    const detalle = typeof cuerpo?.detail === 'string' ? cuerpo.detail : 'No se pudo procesar tu pregunta.';
    return Object.assign(new Error(detalle), { status: estado });
}

async function llamar(sesionActiva: SesionDirecta, datos: PreguntaDirecta): Promise<Response> {
    return fetch(`${sesionActiva.url}/preguntas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sesionActiva.token}` },
        body: JSON.stringify(datos),
    });
}

/** Enlaces de descarga firmados de los anexos de la respuesta (los firma Django). Si falla, la respuesta sale sin ellos. */
async function enlacesDeAnexos(anexos: AnexoDirecto[]): Promise<AnexoChatbot[]> {
    if (anexos.length === 0) return [];
    try {
        const respuesta = await apiClient.post<{ anexos: AnexoChatbot[] }>(
            '/chatbot/anexos/enlaces/', { ids: anexos.map((anexo) => anexo.id) }, { suppressErrorLog: true },
        );
        return respuesta.anexos ?? [];
    } catch {
        return [];
    }
}

/**
 * Envía la pregunta directo al servicio del chatbot. Devuelve `null` si el acceso directo no está disponible y hay
 * que usar la ruta de Django; lanza un error (con `status`) si el servicio rechazó la pregunta (límite de uso,
 * chatbot no disponible, etc.).
 */
export async function enviarPreguntaDirecta(datos: PreguntaDirecta): Promise<EnviarPreguntaResponse | null> {
    let sesionActiva = await obtenerSesion();
    if (!sesionActiva) return null;

    let respuesta: Response;
    try {
        respuesta = await llamar(sesionActiva, datos);
        if (respuesta.status === 401) {
            // El token venció o Django lo renovó: se pide uno nuevo y se reintenta una vez
            sesionActiva = await obtenerSesion(true);
            if (!sesionActiva) return null;
            respuesta = await llamar(sesionActiva, datos);
        }
    } catch {
        noDisponibleHasta = Date.now() + ESPERA_SI_NO_DISPONIBLE_MS;
        return null; // sin red hacia el servicio: no llegó a procesarse, se sigue por Django
    }

    const esJson = (respuesta.headers.get('content-type') ?? '').includes('application/json');
    if (!esJson || [502, 503, 504].includes(respuesta.status)) {
        // nginx sin la ruta publicada o servicio caído: la pregunta no llegó a procesarse
        noDisponibleHasta = Date.now() + ESPERA_SI_NO_DISPONIBLE_MS;
        return null;
    }

    const cuerpo = await respuesta.json().catch(() => null);
    if (!respuesta.ok) throw errorDeLaRespuesta(respuesta.status, cuerpo);

    const directa = cuerpo as RespuestaDirecta;
    return {
        // Como en la ruta de Django, un intercambio fallido lleva un id de texto («error-…») y no se guarda
        id: directa.id as number,
        chat_id: directa.chat_id,
        respuesta: directa.respuesta,
        mensaje: directa.mensaje,
        fecha: directa.fecha,
        usuario: directa.usuario,
        error: directa.error ?? null,
        anexos: await enlacesDeAnexos(directa.anexos ?? []),
    };
}
