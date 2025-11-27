import { consultorDocenteStats } from '../../services/dashboard.data';

export function useConsultorDocente() {
    return {
        stats: consultorDocenteStats
    };
}
