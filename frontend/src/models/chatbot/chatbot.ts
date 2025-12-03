import type { LucideIcon } from 'lucide-react';

export interface Asistente {
    id: string;
    nombre: string;
    subtitulo: string;
    descripcion: string;
    icon: LucideIcon;
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

export interface Mensaje {
    id: string | number;
    tipo: 'user' | 'bot';
    texto: string;
    timestamp: Date;
    leido?: boolean;
}

export interface ChatMessage {
    id: string;
    remitenteId: string;
    destinatarioId: string;
    mensaje: string;
    leido: boolean;
    fecha: string;
}
