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

export interface SubirDocumentoChatbotPayload {
    chatbot_id: number;
    sede: string;
    file: File;
}
