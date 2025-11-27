export interface Espacio {
    id: string;
    nombre: string;
    tipo: string;
    capacidad: number;
    sede: string;
    edificio: string;
    estado: 'disponible' | 'ocupado' | 'mantenimiento';
    proximaClase?: string;
}

export interface HorarioOcupacion {
    espacioId: string;
    dia: string;
    horaInicio: number;
    horaFin: number;
    materia?: string;
    estado: 'ocupado' | 'mantenimiento' | 'disponible';
}
