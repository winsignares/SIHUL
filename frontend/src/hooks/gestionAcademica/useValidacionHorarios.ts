export interface HorarioValidable {
    id?: number;
    grupo_id: number;
    grupo_nombre?: string;
    asignatura_id: number;
    asignatura_nombre?: string;
    docente_id?: number | null;
    docente_nombre?: string;
    espacio_id: number;
    espacio_nombre?: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes?: number | null;
}

export interface GrupoConPeriodo {
    id?: number;
    periodo_id: number;
    nombre?: string;
}

export interface EspacioConCapacidad {
    id?: number;
    nombre: string;
    capacidad: number;
}

export interface ValidacionHorarioInput {
    horarioId?: number;
    grupoId: number;
    asignaturaId: number;
    docenteId?: number | null;
    espacioId: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    cantidadEstudiantes?: number | null;
    docenteNombre?: string;
    espacioNombre?: string;
}

export interface ValidacionHorarioResultado {
    valido: boolean;
    mensaje: string;
}

interface UseValidacionHorariosParams {
    horarios: HorarioValidable[];
    grupos: GrupoConPeriodo[];
    espacios: EspacioConCapacidad[];
}

const timeToMinutes = (time: string) => {
    const [horas = '0', minutos = '0'] = time.substring(0, 5).split(':');
    return parseInt(horas, 10) * 60 + parseInt(minutos, 10);
};

const haySolapamiento = (inicio1: string, fin1: string, inicio2: string, fin2: string) => {
    const inicio1Min = timeToMinutes(inicio1);
    const fin1Min = timeToMinutes(fin1);
    const inicio2Min = timeToMinutes(inicio2);
    const fin2Min = timeToMinutes(fin2);

    return (
        (inicio1Min >= inicio2Min && inicio1Min < fin2Min) ||
        (fin1Min > inicio2Min && fin1Min <= fin2Min) ||
        (inicio1Min < inicio2Min && fin1Min > fin2Min)
    );
};

export function useValidacionHorarios({ horarios, grupos, espacios }: UseValidacionHorariosParams) {
    const gruposPorId = new Map(
        grupos
            .filter(grupo => grupo.id !== undefined)
            .map(grupo => [grupo.id as number, grupo])
    );

    const obtenerPeriodoIdDeGrupo = (grupoId: number) => gruposPorId.get(grupoId)?.periodo_id ?? null;

    const validarConflictosHorario = (input: ValidacionHorarioInput): ValidacionHorarioResultado => {
        if (input.horaInicio >= input.horaFin) {
            return { valido: false, mensaje: 'La hora de fin debe ser mayor que la hora de inicio' };
        }

        const diaNormalizado = input.diaSemana.toLowerCase();
        const periodoId = obtenerPeriodoIdDeGrupo(input.grupoId);
        const mismoPeriodo = (grupoId: number) => periodoId === null || obtenerPeriodoIdDeGrupo(grupoId) === periodoId;

        const horariosDocenteSuperpuestos = input.docenteId
            ? horarios.filter(h => {
                if (h.id === input.horarioId) return false;
                if (h.docente_id !== input.docenteId) return false;
                if (h.dia_semana.toLowerCase() !== diaNormalizado) return false;
                if (!mismoPeriodo(h.grupo_id)) return false;

                return haySolapamiento(input.horaInicio, input.horaFin, h.hora_inicio, h.hora_fin);
            })
            : [];

        if (horariosDocenteSuperpuestos.length > 0) {
            const conflictoReal = horariosDocenteSuperpuestos.find(h =>
                h.asignatura_id !== input.asignaturaId ||
                h.hora_inicio !== input.horaInicio ||
                h.hora_fin !== input.horaFin
            );

            if (conflictoReal) {
                const docenteNombre = input.docenteNombre || 'el docente';
                return {
                    valido: false,
                    mensaje: `${docenteNombre} ya tiene una clase el ${input.diaSemana} de ${conflictoReal.hora_inicio} a ${conflictoReal.hora_fin} (${conflictoReal.asignatura_nombre})`
                };
            }
        }

        const horariosSuperpuestos = horarios.filter(h => {
            if (h.id === input.horarioId) return false;
            if (h.espacio_id !== input.espacioId) return false;
            if (h.dia_semana.toLowerCase() !== diaNormalizado) return false;
            if (!mismoPeriodo(h.grupo_id)) return false;

            return haySolapamiento(input.horaInicio, input.horaFin, h.hora_inicio, h.hora_fin);
        });

        if (horariosSuperpuestos.length === 0) {
            return { valido: true, mensaje: '' };
        }

        const horarioCompartible = horariosSuperpuestos.find(h =>
            h.asignatura_id === input.asignaturaId &&
            h.docente_id === input.docenteId &&
            h.hora_inicio === input.horaInicio &&
            h.hora_fin === input.horaFin
        );

        if (horarioCompartible) {
            const espacioActual = espacios.find(e => e.id === input.espacioId);
            if (espacioActual) {
                const horariosCompartidos = horariosSuperpuestos.filter(h =>
                    h.asignatura_id === input.asignaturaId &&
                    h.docente_id === input.docenteId &&
                    h.hora_inicio === input.horaInicio &&
                    h.hora_fin === input.horaFin
                );

                const totalEstudiantesExistentes = horariosCompartidos.reduce(
                    (sum, horario) => sum + (horario.cantidad_estudiantes || 0),
                    0
                );
                const totalEstudiantes = totalEstudiantesExistentes + (input.cantidadEstudiantes || 0);

                if (totalEstudiantes > espacioActual.capacidad) {
                    const gruposCompartiendo = horariosCompartidos
                        .map(h => h.grupo_nombre)
                        .filter(Boolean)
                        .join(', ');

                    return {
                        valido: false,
                        mensaje: `El espacio ${espacioActual.nombre} no tiene capacidad suficiente. Ya hay ${totalEstudiantesExistentes} estudiantes del grupo(s) ${gruposCompartiendo} en esta clase. Total: ${totalEstudiantes}/${espacioActual.capacidad}`
                    };
                }
            }

            return { valido: true, mensaje: '' };
        }

        const conflicto = horariosSuperpuestos[0];
        const espacioNombre = input.espacioNombre || espacios.find(e => e.id === input.espacioId)?.nombre || 'el espacio';

        return {
            valido: false,
            mensaje: `${espacioNombre} ya está ocupado el ${input.diaSemana} de ${conflicto.hora_inicio} a ${conflicto.hora_fin} por ${conflicto.grupo_nombre} (${conflicto.asignatura_nombre})`
        };
    };

    return {
        validarConflictosHorario,
    };
}