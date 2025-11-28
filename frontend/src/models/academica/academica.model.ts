export interface Sede {
    id: string;
    codigo: string;
    nombre: string;
    activa: boolean;
    fechaCreacion: string;
}

export interface Facultad {
    id: string;
    codigo: string;
    nombre: string;
    decano?: string;
    telefono?: string;
    email?: string;
    activa: boolean;
    fechaCreacion: string;
}

export interface Programa {
    id: string;
    codigo: string;
    nombre: string;
    facultadId: string;
    director?: string;
    emailContacto?: string;
    modalidad: 'presencial' | 'virtual' | 'distancia';
    nivel: 'pregrado' | 'posgrado' | 'tecnico' | 'tecnologico';
    creditos?: number;
    duracion?: string;
    semestres: number; // Número de semestres del programa
    activo: boolean;
    fechaCreacion: string;
}

export interface PeriodoAcademico {
    id: string;
    codigo: string;
    nombre: string;
    fechaInicio: string;
    fechaFin: string;
    activo: boolean;
    fechaCreacion: string;
}

export interface RecursoRequerido {
    tipo: string; // 'computador', 'proyector', 'software', 'laboratorio', etc.
    cantidad: number;
    especificaciones?: string; // Detalles específicos del recurso
}

export interface Asignatura {
    id: string;
    codigo: string;
    nombre: string;
    programaId: string;
    creditos: number;
    horasSemana: number;
    semestre: number;
    tipo: 'teorica' | 'practica' | 'teorico-practica';
    recursosRequeridos?: RecursoRequerido[]; // Recursos que necesita la asignatura
    activa: boolean;
    fechaCreacion: string;
}

export interface Grupo {
    id: string;
    codigo: string;
    nombre: string; // Nombre del grupo (ej: Grupo A, Grupo B)
    asignaturaId: string;
    programaId: string;
    periodoId: string;
    semestre: number; // Semestre al que pertenece el grupo
    docente?: string;
    cantidadEstudiantes: number;
    modalidad: 'presencial' | 'virtual' | 'hibrida';
    activo: boolean;
    fechaCreacion: string;
}

export interface HorarioAcademico {
    id: string;
    asignaturaId?: string;
    docenteId?: string;
    grupoId?: string;
    espacioId?: string;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
}
