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
    const esDocente = user?.rol?.nombre === 'docente';
    const esEstudiante = user?.rol?.nombre === 'estudiante';

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

            // Determinar endpoint basado en el rol
            const endpoint = esEstudiante
                ? `/horario/mi-horario-estudiante/?usuario_id=${user.id}`
                : `/horario/mi-horario/?usuario_id=${user.id}`;

            const response = await apiClient.get<HorarioResponse>(endpoint);

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

    const handleDescargarPDF = async () => {
        if (!user?.id) return;

        showNotification('Preparando descarga...', 'info');

        try {
            const response = await fetch(`http://localhost:8000/horario/exportar-pdf/?usuario_id=${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/pdf',
                },
            });

            if (!response.ok) {
                throw new Error('Error al generar PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mi_horario.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('¡Horario descargado exitosamente en PDF!', 'success');
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            showNotification('Error al descargar el PDF', 'error');
        }
    };

    const handleDescargarExcel = async () => {
        if (!user?.id) return;

        showNotification('Preparando descarga...', 'info');

        try {
            const response = await fetch(`http://localhost:8000/horario/exportar-excel/?usuario_id=${user.id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                },
            });

            if (!response.ok) {
                throw new Error('Error al generar Excel');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `mi_horario.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('¡Horario descargado exitosamente en Excel!', 'success');
        } catch (error) {
            console.error('Error al descargar Excel:', error);
            showNotification('Error al descargar el Excel', 'error');
        }
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
