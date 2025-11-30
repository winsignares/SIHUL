import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../share/notificationBanner';
import { apiClient } from '../../core/apiClient';

export interface HorarioExtendido {
    id: number;
    diaSemana: string;
    horaInicio: string;
    horaFin: string;
    asignatura: string;
    asignaturaId: number;
    docente: string;
    docenteId?: number;
    grupo: string;
    grupoId: number;
    espacio: string;
    espacioId: number;
    cantidadEstudiantes?: number;
    programa?: string;
    semestre?: number;
}

interface HorarioResponse {
    horarios: HorarioExtendido[];
}

export function useMiHorario() {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [horarios, setHorarios] = useState<HorarioExtendido[]>([]);
    const [loading, setLoading] = useState(true);

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const esDocente = user?.rol?.nombre === 'consultor_docente';
    const esEstudiante = user?.rol?.nombre === 'consultor_estudiante';

    useEffect(() => {
        if (user?.id) {
            loadData();
        } else {
            setLoading(false);
        }
    }, [user?.id]);

    const loadData = async () => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);

            // Llamar al endpoint con el ID del usuario
            const response = await apiClient.get<HorarioResponse>(`/horario/mi-horario/?usuario_id=${user.id}`);

            setHorarios(response.horarios || []);
        } catch (error) {
            console.error('Error cargando horario:', error);
            showNotification('Error al cargar el horario', 'error');
            setHorarios([]);
        } finally {
            setLoading(false);
        }
    };

    // Generar horas para el grid semanal
    const generarHoras = () => {
        const horas = [];
        for (let h = 6; h <= 21; h++) {
            horas.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return horas;
    };

    // Obtener clase en una hora específica
    const obtenerClaseEnHora = (dia: string, hora: string) => {
        return horarios.find(h => {
            const diaMatch = h.diaSemana.toLowerCase() === dia.toLowerCase();
            const horaActual = parseInt(hora.split(':')[0]);
            const horaInicio = parseInt(h.horaInicio.split(':')[0]);
            const horaFin = parseInt(h.horaFin.split(':')[0]);
            return diaMatch && horaActual >= horaInicio && horaActual < horaFin;
        });
    };

    const handleDescargarPDF = () => {
        showNotification('Descargando horario en PDF...', 'success');
        // Aquí iría la lógica real de descarga PDF
    };

    const handleDescargarExcel = () => {
        showNotification('Descargando horario en Excel...', 'success');
        // Aquí iría la lógica real de descarga Excel
    };

    const horas = generarHoras();

    return {
        horarios,
        diasSemana,
        esDocente,
        esEstudiante,
        horas,
        obtenerClaseEnHora,
        handleDescargarPDF,
        handleDescargarExcel,
        loading
    };
}
