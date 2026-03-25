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
    identificacionSolicitante?: string;
    es_recurrente?: boolean;
    frecuencia?: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'weekdays';
    intervalo?: number;
    dias_semana?: number[];
    fin_repeticion_tipo?: 'never' | 'until_date' | 'count';
    fin_repeticion_fecha?: string | null;
    fin_repeticion_ocurrencias?: number | null;
    serie_id?: string | null;
    es_ocurrencia_generada?: boolean;
    prestamo_padre_id?: number | null;
}

export interface StatsData {
    title: string;
    value: number;
    icon: any;
    color: string;
    bgColor: string;
    textColor: string;
}
