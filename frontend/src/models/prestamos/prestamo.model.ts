export interface Prestamo {
    id: string;
    solicitante: string;
    email: string;
    telefono: string;
    espacio: string;
    espacio_id?: number;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    motivo: string;
    tipoEvento: string;
    tipo_actividad_id?: number;
    asistentes: number;
    recursosNecesarios: string[];
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    fechaSolicitud: string;
    comentariosAdmin?: string;
}
