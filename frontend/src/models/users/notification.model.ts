export interface NotificacionUsuario {
    id: string;
    tipo: 'solicitud' | 'mensaje' | 'alerta' | 'sistema' | 'exito' | 'error' | 'advertencia';
    titulo: string;
    descripcion: string;
    fecha: string;
    leida: boolean;
    eliminada: boolean;
    prioridad: 'alta' | 'media' | 'baja';
}
