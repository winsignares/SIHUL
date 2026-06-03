import { apiClient } from '../../core/apiClient';

const DEFAULT_BG_GRADIENT = 'from-blue-500 via-blue-600 to-indigo-600';

const iconAliasMap: Record<string, string> = {
    bookopen: 'BookOpen',
    book_open: 'BookOpen',
    dooropen: 'DoorOpen',
    door_open: 'DoorOpen',
    trophy: 'Trophy',
    headphoness: 'Headphones',
    headphones: 'Headphones',
    bot: 'Bot'
};

export interface AgenteAPI {
    id: number;
    nombre: string;
    subtitulo?: string | null;
    descripcion: string;
    icono?: string;
    color?: string;
    bgGradient?: string;
    bg_gradient?: string;
    activo?: boolean;
    mensajeBienvenida?: string;
    mensaje_bienvenida?: string;
    preguntasRapidas?: string[];
    preguntas?: unknown;
}

export interface PreguntaSugeridaAPI {
    id: number;
    agente: number | { id: number };
    pregunta: string;
    activo?: boolean;
    orden?: number;
    contador_uso?: number;
}

export interface EnviarPreguntaRequest {
    agente_id: number;
    pregunta: string;
    pregunta_sugerida_id?: number;
    chat_id?: string;
    id_usuario: number;           // OBLIGATORIO
    nombre_usuario: string;        // OBLIGATORIO
}

export interface MensajeAPI {
    id: number;
    tipo: 'user' | 'bot';
    texto: string;
    timestamp: string;
    leido: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: any;
}

export interface EnviarPreguntaResponse {
    id: number;
    chat_id: string;
    respuesta: string;
    mensaje: string;
    fecha: string;
    usuario: string;
    error?: string | null;
}

export interface MensajeHistorial {
    id: string | number;
    chat_id: string;
    tipo: 'user' | 'bot';
    texto: string;
    timestamp: string;
    leido: boolean;
    usuario: string;
}

export interface ObtenerHistorialResponse {
    mensajes: MensajeHistorial[];
    total: number;
}

export interface Conversacion {
    chat_id: string;
    agente_id: string;
    primer_mensaje: string;
    ultimo_mensaje: string;
    fecha_inicio: string;
    fecha_actualizacion: string;
    total_mensajes: number;
}

export interface ListarConversacionesResponse {
    conversaciones: Conversacion[];
    total: number;
}

function extraerListaResponse<T>(response: unknown, keys: string[]): T[] {
    if (Array.isArray(response)) {
        return response as T[];
    }

    if (!response || typeof response !== 'object') {
        return [];
    }

    const data = response as Record<string, unknown>;
    for (const key of keys) {
        const value = data[key];
        if (Array.isArray(value)) {
            return value as T[];
        }
    }

    return [];
}

function normalizarIcono(rawIcono?: string): string {
    if (!rawIcono) return 'Bot';

    const key = rawIcono.trim().toLowerCase().replace(/[^a-z0-9]+/g, '');
    return iconAliasMap[key] || rawIcono;
}

function convertirAPreguntasRapidas(rawPreguntas: unknown): string[] {
    if (!rawPreguntas) return [];

    if (Array.isArray(rawPreguntas)) {
        return rawPreguntas
            .map((item) => {
                if (typeof item === 'string') {
                    return item;
                }
                if (item && typeof item === 'object') {
                    const pregunta = (item as { pregunta?: unknown }).pregunta;
                    return typeof pregunta === 'string' ? pregunta : '';
                }
                return '';
            })
            .filter((pregunta): pregunta is string => Boolean(pregunta));
    }

    return [];
}

function normalizarAgenteAPI(
    agente: AgenteAPI,
    preguntasPorAgente?: Map<number, string[]>
): AgenteAPI {
    const preguntasDelBackend = preguntasPorAgente?.get(agente.id) || [];
    const preguntasDirectas = convertirAPreguntasRapidas(agente.preguntasRapidas ?? agente.preguntas);

    return {
        ...agente,
        subtitulo: agente.subtitulo ?? '',
        icono: normalizarIcono(agente.icono),
        color: agente.color ?? 'blue',
        bgGradient: agente.bgGradient ?? agente.bg_gradient ?? DEFAULT_BG_GRADIENT,
        activo: agente.activo ?? true,
        mensajeBienvenida: agente.mensajeBienvenida ?? agente.mensaje_bienvenida ?? '',
        preguntasRapidas: preguntasDirectas.length > 0 ? preguntasDirectas : preguntasDelBackend
    };
}

function agruparPreguntasSugeridas(preguntas: PreguntaSugeridaAPI[]): Map<number, string[]> {
    const agrupadas = new Map<number, string[]>();

    for (const pregunta of preguntas) {
        const agenteId = typeof pregunta.agente === 'number' ? pregunta.agente : pregunta.agente?.id;
        if (!agenteId || !pregunta.pregunta) {
            continue;
        }

        const existentes = agrupadas.get(agenteId) || [];
        existentes.push(pregunta.pregunta);
        agrupadas.set(agenteId, existentes);
    }

    return agrupadas;
}

export const chatbotAPI = {
    /**
     * Obtiene la lista de agentes activos
     */
    listarAgentes: async (): Promise<{ agentes: AgenteAPI[] }> => {
        const [agentesResponse, preguntasResponse] = await Promise.all([
            apiClient.get('/chatbot/agentes/'),
            apiClient.get('/chatbot/preguntas/')
        ]);

        const agentes = extraerListaResponse<AgenteAPI>(agentesResponse, ['agentes', 'results', 'data']);
        const preguntas = extraerListaResponse<PreguntaSugeridaAPI>(preguntasResponse, ['preguntas', 'results', 'data']);
        const preguntasPorAgente = agruparPreguntasSugeridas(preguntas);

        return {
            agentes: agentes.map((agente) => normalizarAgenteAPI(agente, preguntasPorAgente))
        };
    },

    /**
     * Envía una pregunta al agente y obtiene respuesta del RAG
     * Ahora también guarda la conversación en la base de datos
     */
    enviarPregunta: async (data: EnviarPreguntaRequest): Promise<EnviarPreguntaResponse> => {
        return apiClient.post('/chatbot/pregunta/', data);
    },

    /**
     * Obtiene el historial de conversación
     */
    obtenerHistorial: async (params: {
        chat_id?: string;
        agente_id?: string;
        id_usuario?: number;
    }): Promise<ObtenerHistorialResponse> => {
        const queryParams = new URLSearchParams();
        if (params.chat_id) queryParams.append('chat_id', params.chat_id);
        if (params.agente_id) queryParams.append('agente_id', params.agente_id);
        if (params.id_usuario) queryParams.append('id_usuario', params.id_usuario.toString());
        
        return apiClient.get(`/chatbot/historial/?${queryParams.toString()}`);
    },

    /**
     * Lista todas las conversaciones de un agente
     */
    listarConversaciones: async (params: {
        agente_id: string;
        id_usuario?: number;
    }): Promise<ListarConversacionesResponse> => {
        const queryParams = new URLSearchParams();
        queryParams.append('agente_id', params.agente_id);
        if (params.id_usuario) queryParams.append('id_usuario', params.id_usuario.toString());
        
        return apiClient.get(`/chatbot/conversaciones/?${queryParams.toString()}`);
    },

    // ========== ENDPOINTS PÚBLICOS (Sin autenticación, sin historial) ==========

    /**
     * Lista agentes para usuarios públicos
     */
    listarAgentesPublico: async (): Promise<{ agentes: AgenteAPI[] }> => {
        const response = await apiClient.get('/chatbot/public/agentes/');
        const agentes = extraerListaResponse<AgenteAPI>(response, ['agentes', 'results', 'data']);

        return {
            agentes: agentes.map((agente) => normalizarAgenteAPI(agente))
        };
    },

    /**
     * Envía pregunta sin guardar historial - Solo para usuarios públicos
     */
    enviarPreguntaPublico: async (data: {
        agente_id: number;
        pregunta: string;
        pregunta_sugerida_id?: number;
    }): Promise<{ chat_id: string; respuesta: string; timestamp: string }> => {
        return apiClient.post('/chatbot/public/pregunta/', data);
    }
};
