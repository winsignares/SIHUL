export interface Notificacion {
    id: string;
    usuarioId: string;
    tipo: 'info' | 'advertencia' | 'error' | 'exito';
    titulo: string;
    mensaje: string;
    leida: boolean;
    fecha: string;
    accion?: {
        texto: string;
        url: string;
    };
}

export interface MensajeChat {
    id: string;
    remitenteId: string;
    destinatarioId: string;
    mensaje: string;
    leido: boolean;
    fecha: string;
}
