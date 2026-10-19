import type { LucideIcon } from 'lucide-react';

export interface Asistente {
    id: string;
    nombre: string;
    subtitulo: string;
    descripcion: string;
    icon: LucideIcon;
    icono: string;
    color: string;
    bgGradient: string;
    ultimoMensaje: string;
    timestamp: string;
    online: boolean;
    mensajeBienvenida: string;
    prompt: string;
    preguntasRapidas: string[];
    chat_id?: string; // ID único de la conversación actual
}

/**
 * Anexo (documento de soporte: Word, PDF o Excel) que acompaña una respuesta del chatbot.
 * `url` es un enlace de descarga firmado que entrega el backend y caduca; `tipo` es el MIME.
 */
export interface AnexoChatbot {
    id: number;
    nombre: string;
    url: string;
    tipo: string;
    extension: string;
    tamano: number;
}

export interface Mensaje {
    id: string | number;
    tipo: 'user' | 'bot';
    texto: string;
    timestamp: Date;
    leido?: boolean;
    anexos?: AnexoChatbot[];
}

export interface ChatMessage {
    id: string;
    remitenteId: string;
    destinatarioId: string;
    mensaje: string;
    leido: boolean;
    fecha: string;
}
