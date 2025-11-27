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
}

export interface Mensaje {
    id: string;
    tipo: 'user' | 'bot';
    texto: string;
    timestamp: Date;
    leido?: boolean;
}

export interface MensajeChat {
    id: string;
    remitenteId: string;
    destinatarioId: string;
    mensaje: string;
    leido: boolean;
    fecha: string;
}
