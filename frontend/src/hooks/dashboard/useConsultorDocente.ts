import { useMemo } from 'react';
import { BookOpen, Clock, Users } from 'lucide-react';
import { useMiHorario } from '../horarios/useMiHorario';

export function useConsultorDocente() {
    const { horarios, loading } = useMiHorario();

    const stats = useMemo(() => {
        if (loading) {
            return [
                { label: 'Asignaturas', value: 'Cargando...', icon: BookOpen, color: 'blue' },
                { label: 'Horas Semanales', value: 'Cargando...', icon: Clock, color: 'green' },
                { label: 'Grupos', value: 'Cargando...', icon: Users, color: 'purple' }
            ];
        }

        const uniqueSubjects = new Set(horarios.map(h => h.asignatura)).size;
        const uniqueGroups = new Set(horarios.map(h => h.grupo)).size;

        const totalHours = horarios.reduce((acc, h) => {
            const start = parseInt(h.horaInicio.split(':')[0]);
            const end = parseInt(h.horaFin.split(':')[0]);
            return acc + (end - start);
        }, 0);

        return [
            { label: 'Asignaturas', value: `${uniqueSubjects} materias`, icon: BookOpen, color: 'blue' },
            { label: 'Horas Semanales', value: `${totalHours} horas`, icon: Clock, color: 'green' },
            { label: 'Grupos', value: `${uniqueGroups} grupos`, icon: Users, color: 'purple' }
        ];
    }, [horarios, loading]);

    return {
        stats,
        loading
    };
}
