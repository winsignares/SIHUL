import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Programa } from '../../services/programas/programaAPI';
import type { EspacioFisico } from '../../../espacios/services/espaciosAPI';
import type { Asignatura } from '../../services/asignaturas/asignaturaAPI';
import type { Usuario } from '../../../users/services/authService';
import type { PeriodoAcademico } from '../../services/periodos/periodoAPI';
import type { HorarioExtendido } from '../../../horarios/services/horariosAPI';
import type { GrupoConInfo } from './crearHorariosUtils';

interface Opciones {
    grupos: GrupoConInfo[];
    todosLosHorarios: HorarioExtendido[];
    programas: Programa[];
    asignaturas: Asignatura[];
    docentes: Usuario[];
    espacios: EspacioFisico[];
    periodos: PeriodoAcademico[];
}

/** Filtros de los grupos sin horario, listas disponibles para cada filtro y paginación de la tabla. */
export function useFiltrosCrearHorarios({ grupos, todosLosHorarios, programas, asignaturas, docentes, espacios, periodos }: Opciones) {
    // Filtros
    const [filtroFacultad, setFiltroFacultadState] = useState<string>('all');
    const [filtroPrograma, setFiltroProgramaState] = useState<number | string>('all');
    const [filtroSemestre, setFiltroSemestreState] = useState<string>('all');
    const [filtroGrupo, setFiltroGrupoState] = useState<string>('all');
    const [filtroPeriodo, setFiltroPeriodoState] = useState<string>('all');
    const [filtroAsignatura, setFiltroAsignaturaState] = useState<string>('all');
    const [filtroDocente, setFiltroDocenteState] = useState<string>('all');
    const [filtroEspacio, setFiltroEspacioState] = useState<string>('all');
    const [filtroDia, setFiltroDiaState] = useState<string>('all');

    // Stable setters wrapped in useCallback
    const setFiltroFacultad = useCallback((v: string) => setFiltroFacultadState(v), []);
    const setFiltroPrograma = useCallback((v: number | string) => setFiltroProgramaState(v), []);
    const setFiltroSemestre = useCallback((v: string) => setFiltroSemestreState(v), []);
    const setFiltroGrupo = useCallback((v: string) => setFiltroGrupoState(v), []);
    const setFiltroPeriodo = useCallback((v: string) => setFiltroPeriodoState(v), []);
    const setFiltroAsignatura = useCallback((v: string) => setFiltroAsignaturaState(v), []);
    const setFiltroDocente = useCallback((v: string) => setFiltroDocenteState(v), []);
    const setFiltroEspacio = useCallback((v: string) => setFiltroEspacioState(v), []);
    const setFiltroDia = useCallback((v: string) => setFiltroDiaState(v), []);

    // Filtrar grupos
    const gruposSinHorarioFiltrados = useMemo(() => grupos.filter(grupo => {
        const horariosDelGrupo = todosLosHorarios.filter(h => h.grupo_id === grupo.id);
        const matchFacultad = filtroFacultad === 'all' || grupo.facultad_id?.toString() === filtroFacultad;
        const matchPrograma = filtroPrograma === 'all' || grupo.programa_id?.toString() === filtroPrograma.toString();
        const matchSemestre = filtroSemestre === 'all' || (grupo.semestre && grupo.semestre.toString() === filtroSemestre);
        const matchGrupo = filtroGrupo === 'all' || grupo.nombre === filtroGrupo;
        const matchPeriodo = filtroPeriodo === 'all' || grupo.periodo_id?.toString() === filtroPeriodo;
        const matchAsignatura = filtroAsignatura === 'all' || horariosDelGrupo.some(h => h.asignatura_id?.toString() === filtroAsignatura);
        const matchDocente = filtroDocente === 'all'
            || horariosDelGrupo.some(h => filtroDocente === 'sin-asignar' ? h.docente_id == null : h.docente_id?.toString() === filtroDocente);
        const matchEspacio = filtroEspacio === 'all'
            || horariosDelGrupo.some(h => filtroEspacio === 'sin-espacio' ? h.espacio_id == null : h.espacio_id?.toString() === filtroEspacio);
        const matchDia = filtroDia === 'all' || horariosDelGrupo.some(h => h.dia_semana?.toLowerCase() === filtroDia.toLowerCase());

        return matchFacultad && matchPrograma && matchSemestre && matchGrupo && matchPeriodo && matchAsignatura && matchDocente && matchEspacio && matchDia;
    }), [grupos, todosLosHorarios, filtroFacultad, filtroPrograma, filtroSemestre, filtroGrupo, filtroPeriodo, filtroAsignatura, filtroDocente, filtroEspacio, filtroDia]);

    // Paginación para grupos sin horario
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 20;

    const totalPages = Math.ceil(gruposSinHorarioFiltrados.length / pageSize);
    const paginatedGrupos = gruposSinHorarioFiltrados.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const goToPage = useCallback((page: number) => setCurrentPage(page), []);
    const goToNextPage = useCallback(() => setCurrentPage(p => Math.min(p + 1, totalPages)), [totalPages]);
    const goToPrevPage = useCallback(() => setCurrentPage(p => Math.max(p - 1, 1)), []);

    // Resetear a página 1 cuando cambian los filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [filtroFacultad, filtroPrograma, filtroSemestre, filtroGrupo, filtroPeriodo, filtroAsignatura, filtroDocente, filtroEspacio, filtroDia]);

    const programasFiltrados = useMemo(() =>
        programas.filter(p => filtroFacultad === 'all' || p.facultad_id?.toString() === filtroFacultad),
        [programas, filtroFacultad]
    );

    const gruposFiltroDisponibles = useMemo(() => {
        const gruposFiltrados = grupos.filter(grupo => {
            const matchFacultad = filtroFacultad === 'all' || grupo.facultad_id?.toString() === filtroFacultad;
            const matchPrograma = filtroPrograma === 'all' || grupo.programa_id?.toString() === filtroPrograma.toString();
            const matchSemestre = filtroSemestre === 'all' || (grupo.semestre && grupo.semestre.toString() === filtroSemestre);
            const matchPeriodo = filtroPeriodo === 'all' || grupo.periodo_id?.toString() === filtroPeriodo;
            const horariosDelGrupo = todosLosHorarios.filter(h => h.grupo_id === grupo.id);
            const matchAsignatura = filtroAsignatura === 'all' || horariosDelGrupo.some(h => h.asignatura_id?.toString() === filtroAsignatura);
            const matchDocente = filtroDocente === 'all'
                || horariosDelGrupo.some(h => filtroDocente === 'sin-asignar' ? h.docente_id == null : h.docente_id?.toString() === filtroDocente);
            const matchEspacio = filtroEspacio === 'all'
                || horariosDelGrupo.some(h => filtroEspacio === 'sin-espacio' ? h.espacio_id == null : h.espacio_id?.toString() === filtroEspacio);
            const matchDia = filtroDia === 'all' || horariosDelGrupo.some(h => h.dia_semana?.toLowerCase() === filtroDia.toLowerCase());
            return matchFacultad && matchPrograma && matchSemestre && matchPeriodo && matchAsignatura && matchDocente && matchEspacio && matchDia;
        });

        return Array.from(new Set(gruposFiltrados.map(g => g.nombre).filter(Boolean))).sort();
    }, [grupos, todosLosHorarios, filtroFacultad, filtroPrograma, filtroSemestre, filtroPeriodo, filtroAsignatura, filtroDocente, filtroEspacio, filtroDia]);

    const periodosDisponibles = useMemo(() =>
        periodos
            .filter(periodo => periodo.id !== undefined && grupos.some(grupo => grupo.periodo_id === periodo.id))
            .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true })),
        [periodos, grupos]
    );

    const asignaturasFiltroDisponibles = useMemo(() =>
        asignaturas.filter(asignatura => asignatura.id !== undefined && todosLosHorarios.some(h => h.asignatura_id === asignatura.id)),
        [asignaturas, todosLosHorarios]
    );

    const docentesFiltroDisponibles = useMemo(() =>
        docentes
            .filter((docente): docente is Usuario & { id: number } => docente.id !== undefined)
            .filter(docente => todosLosHorarios.some(h => h.docente_id === docente.id)),
        [docentes, todosLosHorarios]
    );

    const espaciosFiltroDisponibles = useMemo(() =>
        espacios.filter(espacio => espacio.id !== undefined && todosLosHorarios.some(h => h.espacio_id === espacio.id)),
        [espacios, todosLosHorarios]
    );

    const diasFiltroDisponibles = useMemo(() =>
        Array.from(new Set(todosLosHorarios.map(h => h.dia_semana).filter(Boolean))).sort(),
        [todosLosHorarios]
    );

    // Resetear programa seleccionado si ya no está en la lista filtrada
    useEffect(() => {
        if (filtroPrograma !== 'all') {
            const programIdStr = filtroPrograma.toString();
            const stillValid = programasFiltrados.some(p => p.id?.toString() === programIdStr);
            if (!stillValid) {
                setFiltroProgramaState('all');
            }
        }
    }, [programasFiltrados, filtroPrograma]);

    const limpiarFiltros = useCallback(() => {
        setFiltroFacultadState('all');
        setFiltroProgramaState('all');
        setFiltroSemestreState('all');
        setFiltroGrupoState('all');
        setFiltroPeriodoState('all');
        setFiltroAsignaturaState('all');
        setFiltroDocenteState('all');
        setFiltroEspacioState('all');
        setFiltroDiaState('all');
    }, []);

    return {
        filtroFacultad, setFiltroFacultad,
        filtroPrograma, setFiltroPrograma,
        filtroSemestre, setFiltroSemestre,
        filtroGrupo, setFiltroGrupo,
        filtroPeriodo, setFiltroPeriodo,
        filtroAsignatura, setFiltroAsignatura,
        filtroDocente, setFiltroDocente,
        filtroEspacio, setFiltroEspacio,
        filtroDia, setFiltroDia,
        limpiarFiltros,
        gruposSinHorarioFiltrados,
        paginatedGrupos,
        programasFiltrados,
        gruposFiltroDisponibles,
        periodosDisponibles,
        asignaturasFiltroDisponibles,
        docentesFiltroDisponibles,
        espaciosFiltroDisponibles,
        diasFiltroDisponibles,
        currentPage,
        totalPages,
        pageSize,
        goToPage,
        goToNextPage,
        goToPrevPage,
    };
}
