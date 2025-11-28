export interface Prestamo {
    id: string;
    solicitante: string;
    email: string;
    telefono: string;
    espacio: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    motivo: string;
    tipoEvento: string;
    asistentes: number;
    recursosNecesarios: string[];
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    fechaSolicitud: string;
    comentariosAdmin?: string;
}
