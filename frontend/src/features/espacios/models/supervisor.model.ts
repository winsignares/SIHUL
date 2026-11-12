export interface ChecklistCierre {
    lucesApagadas: boolean;
    aireApagado: boolean;
    proyectorApagado: boolean;
    pupitresOrdenados: boolean;
    pizarraLimpia: boolean;
    ventanasCerradas: boolean;
    sinObjetosOlvidados: boolean;
    observaciones: string;
}

export interface InfoGrupo {
    grupo: string;
    asignatura: string;
    docente: string;
    estudiantes: number;
    horario: string;
    horaInicio: string;
    horaFin: string;
}
