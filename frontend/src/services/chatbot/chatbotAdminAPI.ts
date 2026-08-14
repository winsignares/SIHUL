import { apiClient } from '../../core/apiClient';

export interface ChatbotAgente {
    id: number;
    nombre: string;
    subtitulo?: string | null;
    descripcion: string;
    icono?: string;
    color?: string;
    bg_gradient?: string;
    activo: boolean;
    endpoint_url?: string;
    mensaje_bienvenida: string;
    orden?: number;
}

export type ChatbotAgentePayload = Omit<ChatbotAgente, 'id'>;

export interface ChatbotDocumento {
    id: number;
    filename: string;
    chatbot_id: number | null;
    sede: string;
    created_at: string;
}

function extraerLista<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
        return response as T[];
    }
    if (response && typeof response === 'object') {
        const data = response as Record<string, unknown>;
        for (const key of ['results', 'data']) {
            if (Array.isArray(data[key])) {
                return data[key] as T[];
            }
        }
    }
    return [];
}

export const chatbotAdminAPI = {
    /**
     * Chatbots (Agentes): CRUD reutilizando el endpoint DRF existente
     */
    listarChatbots: async (): Promise<ChatbotAgente[]> => {
        const response = await apiClient.get<unknown>('/chatbot/agentes/');
        return extraerLista<ChatbotAgente>(response);
    },

    crearChatbot: (data: Partial<ChatbotAgentePayload>): Promise<ChatbotAgente> =>
        apiClient.post('/chatbot/agentes/', data),

    actualizarChatbot: (id: number, data: Partial<ChatbotAgentePayload>): Promise<ChatbotAgente> =>
        apiClient.patch(`/chatbot/agentes/${id}/`, data),

    eliminarChatbot: (id: number): Promise<unknown> =>
        apiClient.delete(`/chatbot/agentes/${id}/`),

    /**
     * Sedes válidas para asociar documentos (según el servicio RAG)
     */
    listarSedes: async (): Promise<string[]> => {
        const response = await apiClient.get<{ sedes?: string[] }>('/chatbot/admin/sedes/');
        return response?.sedes ?? [];
    },

    /**
     * Documentos del RAG por chatbot y/o sede
     */
    listarDocumentos: async (params: { chatbot_id?: number; sede?: string; limit?: number } = {}): Promise<ChatbotDocumento[]> => {
        const query = new URLSearchParams();
        if (params.chatbot_id) query.append('chatbot_id', String(params.chatbot_id));
        if (params.sede) query.append('sede', params.sede);
        if (params.limit) query.append('limit', String(params.limit));
        const qs = query.toString();
        const response = await apiClient.get<unknown>(`/chatbot/admin/documentos/${qs ? `?${qs}` : ''}`);
        return extraerLista<ChatbotDocumento>(response);
    },

    subirDocumento: async (data: { chatbot_id: number; sede: string; file: File }): Promise<ChatbotDocumento> => {
        const formData = new FormData();
        formData.append('chatbot_id', String(data.chatbot_id));
        formData.append('sede', data.sede);
        formData.append('file', data.file);
        return apiClient.postFormData('/chatbot/admin/documentos/', formData);
    },

    eliminarDocumento: (id: number): Promise<unknown> =>
        apiClient.delete(`/chatbot/admin/documentos/${id}/`),
};
