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
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

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
    // Si no hay horarios cargados, mostrar mensaje y no llamar al backend
    if (!horarios || horarios.length === 0) {
        showNotification('No hay horarios registrados', 'error');
        setNotification({ message: 'No hay horarios registrados', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        return;
    }

    if (!user?.id) {
        showNotification('Usuario no identificado', 'error');
        return;
    }

    showNotification('Preparando descarga...', 'info');

    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const url = `${apiUrl}/horario/exportar-pdf-usuario/?usuario_id=${user.id}`;

        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al generar PDF');
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `mi_horario.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);

        showNotification('¡Horario descargado exitosamente en PDF!', 'success');
    } catch (error) {
        console.error('Error al descargar PDF:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al descargar el PDF';
        showNotification(errorMessage, 'error');
    }
};

const handleDescargarExcel = async () => {
    // Si no hay horarios cargados, mostrar mensaje y no llamar al backend
    if (!horarios || horarios.length === 0) {
        showNotification('No hay horarios registrados', 'error');
        setNotification({ message: 'No hay horarios registrados', type: 'error' });
        setTimeout(() => setNotification(null), 3000);
        return;
    }

    if (!user?.id) {
        showNotification('Usuario no identificado', 'error');
        return;
    }

    showNotification('Preparando descarga...', 'info');

    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const url = `${apiUrl}/horario/exportar-excel-usuario/?usuario_id=${user.id}`;

        const response = await fetch(url, { method: 'GET' });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Error al generar Excel');
        }

        const blob = await response.blob();
        const objectUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = objectUrl;
        a.download = `mi_horario.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(objectUrl);
        document.body.removeChild(a);

        showNotification('¡Horario descargado exitosamente en Excel!', 'success');
    } catch (error) {
        console.error('Error al descargar Excel:', error);
        const errorMessage = error instanceof Error ? error.message : 'Error al descargar el Excel';
        showNotification(errorMessage, 'error');
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
        loading,
        notification
    };
}
