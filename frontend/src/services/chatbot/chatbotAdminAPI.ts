import { apiClient } from '../../core/apiClient';
import type {
    ChatbotAgente,
    ChatbotAgentePayload,
    ChatbotDocumento,
    GuardarPreguntaRespuestaPayload,
    PreguntaRespuestaChatbot,
    SubirDocumentoChatbotPayload,
} from '../../models/chatbot/chatbotAdmin.model';

export type {
    ChatbotAgente,
    ChatbotAgentePayload,
    ChatbotDocumento,
    GuardarPreguntaRespuestaPayload,
    PreguntaRespuestaChatbot,
} from '../../models/chatbot/chatbotAdmin.model';

function formDataPreguntaRespuesta(data: GuardarPreguntaRespuestaPayload): FormData {
    const formData = new FormData();
    formData.append('agente', String(data.agente));
    if (data.sede) formData.append('sede', data.sede);
    formData.append('pregunta', data.pregunta);
    formData.append('respuesta', data.respuesta);
    formData.append('activo', String(data.activo));
    data.anexosNuevos.forEach((archivo) => formData.append('anexos', archivo));
    (data.anexosEliminar ?? []).forEach((id) => formData.append('anexos_eliminar', String(id)));
    return formData;
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

    subirDocumento: async (data: SubirDocumentoChatbotPayload): Promise<ChatbotDocumento> => {
        const formData = new FormData();
        formData.append('chatbot_id', String(data.chatbot_id));
        formData.append('sede', data.sede);
        formData.append('file', data.file);
        if (data.replace_document_id) {
            formData.append('replace_document_id', String(data.replace_document_id));
        }
        return apiClient.postFormData('/chatbot/admin/documentos/', formData);
    },

    cambiarPrioridadDocumento: (id: number, prioridad: number): Promise<ChatbotDocumento> =>
        apiClient.patch(`/chatbot/admin/documentos/${id}/prioridad/`, { prioridad }),

    eliminarDocumento: (id: number): Promise<unknown> =>
        apiClient.delete(`/chatbot/admin/documentos/${id}/`),

    /**
     * Preguntas-respuestas con anexos (documentos de soporte) por chatbot y sede
     */
    listarPreguntasRespuestas: async (params: { sede: string; agente?: number }): Promise<PreguntaRespuestaChatbot[]> => {
        const query = new URLSearchParams({ sede: params.sede });
        if (params.agente) query.append('agente', String(params.agente));
        const response = await apiClient.get<unknown>(`/chatbot/admin/preguntas-respuestas/?${query.toString()}`);
        return extraerLista<PreguntaRespuestaChatbot>(response);
    },

    crearPreguntaRespuesta: (data: GuardarPreguntaRespuestaPayload): Promise<PreguntaRespuestaChatbot> =>
        apiClient.postFormData('/chatbot/admin/preguntas-respuestas/', formDataPreguntaRespuesta(data)),

    actualizarPreguntaRespuesta: (id: number, data: GuardarPreguntaRespuestaPayload): Promise<PreguntaRespuestaChatbot> =>
        apiClient.patchFormData(`/chatbot/admin/preguntas-respuestas/${id}/`, formDataPreguntaRespuesta(data)),

    eliminarPreguntaRespuesta: (id: number): Promise<unknown> =>
        apiClient.delete(`/chatbot/admin/preguntas-respuestas/${id}/`),
};
