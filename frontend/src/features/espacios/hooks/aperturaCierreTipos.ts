import type { EspacioConHorarios, HorarioEspacio } from '../services/espaciosAPI';
import type { EstadoRecurso, EspacioRecurso } from '../../../services/recursos/recursoAPI';

export const APERTURA_CIERRE_CACHE_KEY = 'espacios-apertura-cierre';
export const APERTURA_CIERRE_CATALOGOS_CACHE_KEY = 'espacios-apertura-cierre-catalogos';

export interface HorarioPendientePaginado {
    key: string;
    espacio: EspacioConHorarios;
    horario: HorarioEspacio;
}

export const HORARIO_CIERRE_SIN_USO: HorarioEspacio = {
    tipoUso: 'Clase',
    asignatura: 'Sin clase en curso',
    docente: 'No aplica',
    horaInicio: '00:00',
    horaFin: '00:00',
    proximaAccion: 'cierre',
    minutosRestantes: 0,
    segundosRestantes: 0,
    tiempoRestanteTotal: 0,
};

export interface HorarioNormalizado extends HorarioEspacio {
    inicioMin: number;
    finMin: number;
}

export interface RecursoCierrePendiente extends EstadoRecurso {
    estadoOriginal: EspacioRecurso['estado'];
}

export interface ResultadoAccion {
    ok: boolean;
    message?: string;
    status?: number;
}
