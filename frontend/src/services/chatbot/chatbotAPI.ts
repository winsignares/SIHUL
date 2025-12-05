import { apiClient } from '../../core/apiClient';

export interface AgenteAPI {
    id: number;
    nombre: string;
    subtitulo: string;
    descripcion: string;
    icono: string;
    color: string;
    bgGradient: string;
    activo: boolean;
    mensajeBienvenida: string;
    preguntasRapidas: string[];
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

export const chatbotAPI = {
    /**
     * Obtiene la lista de agentes activos
     */
    listarAgentes: async (): Promise<{ agentes: AgenteAPI[] }> => {
        return apiClient.get('/chatbot/agentes/');
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
        return apiClient.get('/chatbot/public/agentes/');
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
