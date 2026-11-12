import {
    BookOpen,
    DoorOpen,
    Trophy,
    Headphones,
    Bot
} from 'lucide-react';
import type { Asistente } from '../../../../models/index';
import type { AgenteAPI } from '../../services/chatbotAPI';

export const ASISTENTES_VIRTUALES_CACHE_KEY = 'chatbot-asistentes-virtuales';
export type CachedAsistente = Omit<Asistente, 'icon' | 'icono'> & {
    icon?: unknown;
    icono?: string;
};

export const SECCIONALES_PUBLICAS_CHATBOT = [
    'Barranquilla',
    'Bogota',
    'Cali',
    'Cartagena',
    'Cucuta',
    'Pereira',
    'El Socorro',
    'Nacional',
    'Virtual',
];

// Mapeo de nombres de iconos a componentes de icono
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const iconMap: Record<string, any> = {
    'BookOpen': BookOpen,
    'DoorOpen': DoorOpen,
    'Trophy': Trophy,
    'Headphones': Headphones,
    'Bot': Bot
};

export const obtenerIcono = (icono?: string) => iconMap[icono || 'Bot'] || Bot;

export const rehidratarAsistente = (asistente: CachedAsistente): Asistente => {
    const icono = asistente.icono || (typeof asistente.icon === 'string' ? asistente.icon : 'Bot');

    return {
        ...asistente,
        icono,
        icon: obtenerIcono(icono)
    };
};

export const serializarAsistente = (asistente: Asistente): CachedAsistente => {
    const { icon, ...serializable } = asistente;
    void icon;
    return serializable;
};

export const normalizarAgentes = (response: unknown): AgenteAPI[] => {
    if (Array.isArray(response)) {
        return response as AgenteAPI[];
    }

    if (!response || typeof response !== 'object') {
        return [];
    }

    const data = response as {
        agentes?: unknown;
        results?: unknown;
        data?: unknown;
    };

    const candidatos = [data.agentes, data.results, data.data];
    for (const candidato of candidatos) {
        if (Array.isArray(candidato)) {
            return candidato as AgenteAPI[];
        }
    }

    return [];
};

// Función para convertir agente del API a formato UI
export const convertirAgenteAPI = (agenteAPI: AgenteAPI): Asistente => {
    return {
        id: agenteAPI.id.toString(),
        nombre: agenteAPI.nombre,
        subtitulo: agenteAPI.subtitulo || '',
        descripcion: agenteAPI.descripcion,
        icono: agenteAPI.icono || 'Bot',
        icon: obtenerIcono(agenteAPI.icono),
        color: agenteAPI.color || 'blue',
        bgGradient: agenteAPI.bgGradient || 'from-blue-500 via-blue-600 to-indigo-600',
        ultimoMensaje: '¿En qué puedo ayudarte?',
        timestamp: 'Ahora',
        online: true,
        mensajeBienvenida: agenteAPI.mensajeBienvenida || '',
        prompt: agenteAPI.id.toString(),
        preguntasRapidas: agenteAPI.preguntasRapidas || []
    };
};
