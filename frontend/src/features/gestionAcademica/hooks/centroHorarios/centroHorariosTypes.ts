export const CENTRO_HORARIOS_CACHE_KEY = 'gestion-academica-centro-horarios-v2';
export const ACADEMIC_CATALOG_UPDATED_EVENT = 'academic-catalog-updated';
export const ESPACIOS_UPDATED_EVENT = 'espacios-updated';
export const HORARIOS_UPDATED_EVENT = 'horariosUpdated';

export interface Docente {
    id: number;
    nombre: string;
    correo: string;
}

export interface HorarioExtendido {
    id: number;
    grupo_id: number;
    grupo_nombre: string;
    programa_id: number;
    programa_nombre: string;
    periodo_id?: number | null;
    periodo_nombre?: string | null;
    semestre: number;
    asignatura_id: number;
    asignatura_nombre: string;
    docente_id: number | null;
    docente_nombre: string;
    espacio_id: number | null;
    espacio_nombre: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    fecha_inicio?: string | null;
    fecha_fin?: string | null;
    cantidad_estudiantes: number | null;
}

export interface GrupoAgrupado {
    programaId: number;
    periodoId: number | null;
    grupo: string;
    semestre: number;
    horarios: HorarioExtendido[];
}

export interface HorarioFusionadoExtendido {
    id: number;
    grupo1_id: number;
    grupo2_id: number;
    grupo3_id: number | null;
    grupo1_nombre: string;
    grupo2_nombre: string;
    grupo3_nombre: string | null;
    periodo_id: number | null;
    periodo_nombre: string | null;
    asignatura_id: number;
    asignatura_nombre: string;
    docente_id: number | null;
    docente_nombre: string;
    espacio_id: number;
    espacio_nombre: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes: number | null;
    comentario: string | null;
}
