export type ChatbotTipo = 'normativo' | 'investigativo';

// Debe coincidir con Agente.TIPO_CHOICES (backend/chatbot/models.py) y los perfiles del
// servicio RAG (chatbot/app/core/profiles.py).
export const CHATBOT_TIPOS: { value: ChatbotTipo; label: string; descripcion: string }[] = [
    {
        value: 'normativo',
        label: 'Normativo',
        descripcion: 'Reglamentos, manuales y procedimientos: respuestas breves y cercanas, sin citar la fuente.',
    },
    {
        value: 'investigativo',
        label: 'Investigativo',
        descripcion: 'Monografías, tesis y artículos: tono académico, indica de qué documento procede cada dato y no hace inferencias.',
    },
];

export const MAX_INSTRUCCIONES_ADICIONALES = 2000;

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
    tipo?: ChatbotTipo;
    instrucciones_adicionales?: string;
}

export type ChatbotAgentePayload = Omit<ChatbotAgente, 'id'>;

export interface ChatbotDocumento {
    id: number;
    filename: string;
    chatbot_id: number | null;
    sede: string;
    created_at: string;
}

export interface SubirDocumentoChatbotPayload {
    chatbot_id: number;
    sede: string;
    file: File;
}
