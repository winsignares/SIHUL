import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../share/notificationBanner';
import { horarioService } from '../../services/horarios/horariosAPI';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const MI_HORARIO_CACHE_KEY = 'horarios-mi-horario';

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

export function useMiHorario() {
    const { user } = useAuth();
    const { showNotification } = useNotification();
    const [horarios, setHorarios] = useState<HorarioExtendido[]>([]);
    const [loading, setLoading] = useState(true);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
    const esDocente = user?.rol?.nombre === 'docente';
    const esEstudiante = user?.rol?.nombre === 'estudiante';

    useEffect(() => {
        if (user?.id) {
            loadData();
        } else {
            setLoading(false);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user?.id]);

    const loadData = async ({ force = false }: { force?: boolean } = {}) => {
        if (!user?.id) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const activeToken = localStorage.getItem('auth_token');
            const userScope = `${user.rol?.nombre || 'sin-rol'}-${user.id}`;
            const cacheKey = `${MI_HORARIO_CACHE_KEY}-${userScope}`;
            const cachedData = force
                ? null
                : getSessionCacheData<{ horarios: HorarioExtendido[] }>(cacheKey, activeToken);

            if (cachedData) {
                setHorarios(cachedData.horarios);
                return;
            }

            // Obtener horarios usando el servicio según el rol
            const response = esEstudiante
                ? await horarioService.miHorarioEstudiante(user.id)
                : await horarioService.miHorario(user.id);

            // Mapear horarios del servicio al formato local
            const horariosData: HorarioExtendido[] = (response.horarios || []).map(h => ({
                id: h.id,
                diaSemana: h.dia_semana,
                horaInicio: h.hora_inicio,
                horaFin: h.hora_fin,
                asignatura: h.asignatura_nombre,
                asignaturaId: h.asignatura_id,
                docente: h.docente_nombre,
                docenteId: h.docente_id ?? undefined,
                grupo: h.grupo_nombre,
                grupoId: h.grupo_id,
                espacio: h.espacio_nombre,
                espacioId: h.espacio_id ?? 0,
                cantidadEstudiantes: h.cantidad_estudiantes ?? undefined,
                programa: h.programa_nombre,
                semestre: h.semestre
            }));
            setHorarios(horariosData);
            setSessionCacheData(cacheKey, activeToken, {
                horarios: horariosData
            });
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
        const blob = await horarioService.exportarPdfUsuario(user.id);
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
        const blob = await horarioService.exportarExcelUsuario(user.id);
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
