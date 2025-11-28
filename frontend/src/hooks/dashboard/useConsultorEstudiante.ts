import { consultorEstudianteStats } from '../../services/dashboard.data';

export function useConsultorEstudiante() {
    return {
        stats: consultorEstudianteStats
    };
}
