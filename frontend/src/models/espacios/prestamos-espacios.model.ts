export interface PrestamoEspacioUI {
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
    administradorNombre?: string;
    administrador_id?: number;
}

export interface StatsData {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
    textColor: string;
}
