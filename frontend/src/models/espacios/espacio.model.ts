export interface RecursoConEstado {
    nombre: string;
    estado: 'Disponible' | 'Mantenimiento' | 'Perdido' | 'No Disponible';
}

export interface EspacioFisico {
    id: string;
    codigo: string;
    nombre: string;
    tipo: 'aula' | 'laboratorio' | 'auditorio' | 'sala' | 'otro';
    sede: string;
    piso?: string;
    capacidad: number;
    recursos: string[]; // Lista de recursos disponibles (para compatibilidad)
    recursosConEstado?: RecursoConEstado[]; // Lista de recursos con su estado individual
    descripcion?: string; // Descripción opcional del espacio
    estado: 'Disponible' | 'Mantenimiento' | 'No Disponible';
    fechaCreacion: string;
}

export interface EquipamientoEspacio {
    item: string;
    cantidad: number;
    estado: 'bueno' | 'regular' | 'malo';
}

export interface PrestamoEspacio {
    id: string;
    espacioId: string;
    solicitante: string;
    emailSolicitante: string;
    programaId: string;
    motivo: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado';
    aprobadoPor?: string;
    observaciones?: string;
    fechaSolicitud: string;
    fechaRespuesta?: string;
}
