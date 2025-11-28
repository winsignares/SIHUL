export interface AsignaturaHorario {
    id: string;
    asignaturaId: string;
    asignaturaNombre: string;
    dia: string;
    horaInicio: string;
    horaFin: string;
    docente: string;
    espacioId: string;
    espacioNombre: string;
}

export interface HorarioCompleto {
    id: string;
    grupoNombre: string; // ej: "1A", "1B"
    facultadId: string;
    programaId: string;
    semestre: number;
    periodo: string; // fijo "2025-1"
    asignaturas: AsignaturaHorario[];
    fechaCreacion: string;
}
