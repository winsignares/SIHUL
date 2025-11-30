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
}

export interface EnviarPreguntaResponse {
    respuesta: string;
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
     */
    enviarPregunta: async (data: EnviarPreguntaRequest): Promise<EnviarPreguntaResponse> => {
        return apiClient.post('/chatbot/pregunta/', data);
    }
};
