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

export interface EstadoSalon {
    abierto: boolean;
    cerrado: boolean;
    horaApertura?: string;
    horaCierre?: string;
    checklistCierre?: ChecklistCierre;
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

export interface SalonEnriquecido {
    id: number;
    nombre: string;
    tipo: string;
    sede: string;
    piso: string;
    capacidad: number;
    codigo: string;
    tieneClase: boolean;
    infoGrupo: InfoGrupo | null;
    estadoSalon: string;
}
