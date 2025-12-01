export interface HorarioDocente {
    dia: string;
    hora: string;
    asignatura: string;
    grupo: string;
    espacio: string;
    docente: string;
    facultad?: string;
    docente_id?: number;
}

export interface HorarioPrograma {
    grupo: string;
    dia: string;
    hora: string;
    asignatura: string;
    docente: string;
    espacio: string;
    programa?: string;
    semestre?: number;
}

export interface DisponibilidadEspacio {
    nombre: string;
    tipo: string;
    horasDisponibles: number;
    horasOcupadas: number;
    porcentajeOcupacion: number;
}

export interface CapacidadUtilizada {
    tipo: string;
    capacidadTotal: number;
    capacidadUsada: number;
    porcentaje: number;
}

export interface ReporteDisponible {
    id: string;
    nombre: string;
    icon: any;
    color: string;
    descripcion: string;
}
