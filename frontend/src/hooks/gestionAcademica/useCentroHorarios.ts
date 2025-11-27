import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { db } from '../../services/database';
import { useNotification } from '../../share/notificationBanner';
import type { HorarioAcademico, Facultad, Programa, EspacioFisico } from '../../models/academica';

export interface HorarioExtendido extends HorarioAcademico {
    asignatura: string;
    docente: string;
    grupo: string;
    programaId: string;
    semestre: number;
}

export interface GrupoAgrupado {
    programaId: string;
    grupo: string;
    semestre: number;
    horarios: HorarioExtendido[];
}

export function useCentroHorarios() {
    const { notification, showNotification } = useNotification();
    const [searchParams] = useSearchParams();
    const modeParam = searchParams.get('mode');
    const initialMode = modeParam === 'crear' ? 'crear' : (modeParam === 'modificacion' ? 'modificacion' : 'consulta');
    const [activeTab, setActiveTab] = useState<'consulta' | 'crear' | 'modificacion'>(initialMode);
    const [horarios, setHorarios] = useState<HorarioAcademico[]>([]);
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);

    // Filtros
    const [filtroFacultad, setFiltroFacultad] = useState<string>('all');
    const [filtroPrograma, setFiltroPrograma] = useState<string>('all');
    const [filtroGrupo, setFiltroGrupo] = useState<string>('all');
    const [filtroSemestre, setFiltroSemestre] = useState<string>('all');

    // Modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [horarioEditar, setHorarioEditar] = useState<HorarioAcademico | null>(null);

    // Modal de detalles - ahora maneja un grupo completo
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [grupoDetalles, setGrupoDetalles] = useState<GrupoAgrupado | null>(null);

    // Estados para selección múltiple
    const [horariosSeleccionados, setHorariosSeleccionados] = useState<Set<string>>(new Set());
    const [seleccionarTodos, setSeleccionarTodos] = useState(false);

    // Estado para acordeón de grupos expandidos
    const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(new Set());

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    useEffect(() => {
        loadData();
    }, []);

    // Si cambian los query params, sincronizar la pestaña activa
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'crear' || mode === 'modificacion' || mode === 'consulta') {
            setActiveTab(mode as any);
        } else {
            setActiveTab('consulta');
        }
    }, [searchParams]);

    const loadData = () => {
        setHorarios(db.getHorariosExtendidos());
        setFacultades(db.getFacultades());
        setProgramas(db.getProgramas());
        setEspacios(db.getEspacios());
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
    const obtenerClaseEnHora = (dia: string, hora: string, horariosGrupo: HorarioExtendido[]) => {
        return horariosGrupo.find(h => {
            const diaMatch = h.diaSemana.toLowerCase() === dia.toLowerCase();

            // Convertir horas a números para comparación
            const horaActual = parseInt(hora.split(':')[0]);
            const horaInicio = parseInt(h.horaInicio.split(':')[0]);
            const horaFin = parseInt(h.horaFin.split(':')[0]);

            // Verificar si la hora actual está dentro del rango de la clase
            return diaMatch && horaActual >= horaInicio && horaActual < horaFin;
        });
    };

    // Agrupar horarios por programa + grupo + semestre
    const agruparHorarios = (horariosArray: HorarioAcademico[]): GrupoAgrupado[] => {
        const grupos = new Map<string, GrupoAgrupado>();

        horariosArray.forEach(horario => {
            const h = horario as HorarioExtendido;
            const key = `${h.programaId}-${h.grupo}-${h.semestre}`;

            if (!grupos.has(key)) {
                grupos.set(key, {
                    programaId: h.programaId,
                    grupo: h.grupo,
                    semestre: h.semestre,
                    horarios: []
                });
            }

            grupos.get(key)!.horarios.push(h);
        });

        return Array.from(grupos.values());
    };

    // Filtrar horarios
    const horariosFiltrados = horarios.filter(horario => {
        const h = horario as HorarioExtendido;
        const programa = programas.find(p => p.id === h.programaId);

        const matchFacultad = filtroFacultad === 'all' || programa?.facultadId === filtroFacultad;
        const matchPrograma = filtroPrograma === 'all' || h.programaId === filtroPrograma;
        const matchGrupo = filtroGrupo === 'all' || h.grupo === filtroGrupo;
        const matchSemestre = filtroSemestre === 'all' || h.semestre?.toString() === filtroSemestre;

        return matchFacultad && matchPrograma && matchGrupo && matchSemestre;
    });

    // Obtener grupos agrupados después de filtrar
    const gruposAgrupados = agruparHorarios(horariosFiltrados);

    // Obtener listas únicas para filtros
    const gruposUnicos = [...new Set(horarios.map(h => (h as any).grupo).filter(Boolean))].sort();
    const semestresUnicos = [...new Set(horarios.map(h => (h as any).semestre).filter(Boolean))].sort((a, b) => a - b);
    const programasFiltrados = programas.filter(p =>
        filtroFacultad === 'all' || p.facultadId === filtroFacultad
    );

    // Handlers
    const handleVerDetalles = (grupo: GrupoAgrupado) => {
        setGrupoDetalles(grupo);
        setShowDetallesModal(true);
    };

    const handleEditar = (horario: HorarioAcademico) => {
        setHorarioEditar({ ...horario });
        setShowEditModal(true);
    };

    const handleGuardarEdicion = () => {
        if (!horarioEditar) return;

        const success = db.updateHorario(horarioEditar.id, horarioEditar);
        if (success) {
            showNotification('Horario actualizado correctamente', 'success');
            loadData();
            setShowEditModal(false);
            setHorarioEditar(null);
        } else {
            showNotification('Error al actualizar el horario', 'error');
        }
    };

    const handleEliminar = (id: string) => {
        if (confirm('¿Está seguro de eliminar este horario?')) {
            const success = db.deleteHorario(id);
            if (success) {
                showNotification('Horario eliminado correctamente', 'success');
                loadData();
            } else {
                showNotification('Error al eliminar el horario', 'error');
            }
        }
    };

    const limpiarFiltros = () => {
        setFiltroFacultad('all');
        setFiltroPrograma('all');
        setFiltroGrupo('all');
        setFiltroSemestre('all');
    };

    // Funciones para selección múltiple
    const toggleSeleccion = (id: string) => {
        const nuevaSeleccion = new Set(horariosSeleccionados);
        if (nuevaSeleccion.has(id)) {
            nuevaSeleccion.delete(id);
        } else {
            nuevaSeleccion.add(id);
        }
        setHorariosSeleccionados(nuevaSeleccion);
    };

    const toggleSeleccionarTodos = () => {
        if (seleccionarTodos) {
            setHorariosSeleccionados(new Set());
            setSeleccionarTodos(false);
        } else {
            const todosLosIds = new Set(horariosFiltrados.map(h => h.id));
            setHorariosSeleccionados(todosLosIds);
            setSeleccionarTodos(true);
        }
    };

    const eliminarSeleccionados = () => {
        if (horariosSeleccionados.size === 0) {
            showNotification('No hay horarios seleccionados', 'error');
            return;
        }

        if (confirm(`¿Está seguro de eliminar ${horariosSeleccionados.size} horario(s)?`)) {
            let eliminados = 0;
            horariosSeleccionados.forEach(id => {
                const success = db.deleteHorario(id);
                if (success) eliminados++;
            });

            if (eliminados > 0) {
                showNotification(`${eliminados} horario(s) eliminado(s) correctamente`, 'success');
                loadData();
                setHorariosSeleccionados(new Set());
                setSeleccionarTodos(false);
            } else {
                showNotification('Error al eliminar los horarios', 'error');
            }
        }
    };

    const getNombrePrograma = (programaId: string) => {
        const programa = programas.find(p => p.id === programaId);
        return programa?.nombre || 'N/A';
    };

    const getNombreEspacio = (espacioId: string) => {
        const espacio = espacios.find(e => e.id === espacioId);
        return espacio?.nombre || 'N/A';
    };

    // Toggle para expandir/colapsar grupos en Modificación
    const toggleGrupoExpandido = (grupoKey: string) => {
        const nuevosExpandidos = new Set(gruposExpandidos);
        if (nuevosExpandidos.has(grupoKey)) {
            nuevosExpandidos.delete(grupoKey);
        } else {
            nuevosExpandidos.add(grupoKey);
        }
        setGruposExpandidos(nuevosExpandidos);
    };

    return {
        activeTab, setActiveTab,
        horarios,
        facultades,
        programas,
        espacios,
        filtroFacultad, setFiltroFacultad,
        filtroPrograma, setFiltroPrograma,
        filtroGrupo, setFiltroGrupo,
        filtroSemestre, setFiltroSemestre,
        showEditModal, setShowEditModal,
        horarioEditar, setHorarioEditar,
        showDetallesModal, setShowDetallesModal,
        grupoDetalles, setGrupoDetalles,
        horariosSeleccionados,
        seleccionarTodos,
        gruposExpandidos,
        loadData,
        generarHoras,
        obtenerClaseEnHora,
        agruparHorarios,
        horariosFiltrados,
        gruposAgrupados,
        gruposUnicos,
        semestresUnicos,
        programasFiltrados,
        handleVerDetalles,
        handleEditar,
        handleGuardarEdicion,
        handleEliminar,
        limpiarFiltros,
        toggleSeleccion,
        toggleSeleccionarTodos,
        eliminarSeleccionados,
        getNombrePrograma,
        getNombreEspacio,
        toggleGrupoExpandido,
        dias,
        notification
    };
}
