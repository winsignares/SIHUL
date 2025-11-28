export interface PrestamoEspacioUI {
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

export interface StatsData {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
    textColor: string;
}
