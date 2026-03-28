import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { grupoService } from '../../services/grupos/gruposAPI';
import { programaService, type Programa } from '../../services/programas/programaAPI';
import { periodoService, type PeriodoAcademico } from '../../services/periodos/periodoAPI';
import type { Grupo } from '../../services/grupos/gruposAPI';
import { getPageNumbers, getPageSlice, getTotalPages, normalizePage, PAGE_SIZE_DEFAULT } from './paginacion';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const GRUPOS_CACHE_KEY = 'gestion-academica-grupos';
const GRUPOS_PROGRAMAS_CACHE_KEY = 'gestion-academica-grupos-programas';
const GRUPOS_PERIODOS_CACHE_KEY = 'gestion-academica-grupos-periodos';

export interface GrupoAcademico {
    id?: number;
    nombre: string;
    programa_id: number;
    periodo_id: number;
    semestre: number;
    activo?: boolean;
}

export function useGrupos() {
    const PAGE_SIZE = PAGE_SIZE_DEFAULT;
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [grupos, setGrupos] = useState<GrupoAcademico[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
    const [selectedProgramaFilter, setSelectedProgramaFilter] = useState<string>('all');
    const [selectedSemestreFilter, setSelectedSemestreFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);

    // Estados de modales
    const [showCreateGrupo, setShowCreateGrupo] = useState(false);
    const [showEditGrupo, setShowEditGrupo] = useState(false);
    const [showDeleteGrupo, setShowDeleteGrupo] = useState(false);

    // Estados de formularios
    const [grupoForm, setGrupoForm] = useState({
        nombre: '',
        programa_id: '',
        periodo_id: '',
        semestre: ''
    });

    // Estados de selección
    const [selectedGrupo, setSelectedGrupo] = useState<GrupoAcademico | null>(null);

    const loadGrupos = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedGrupos = force ? null : getSessionCacheData<GrupoAcademico[]>(GRUPOS_CACHE_KEY, activeToken);

            if (cachedGrupos) {
                setGrupos(cachedGrupos);
                return;
            }

            setLoading(true);
            const response = await grupoService.list();
            setGrupos(response.grupos);
            setSessionCacheData(GRUPOS_CACHE_KEY, activeToken, response.grupos);
        } catch (error) {
            toast.error(`Error al cargar grupos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const loadProgramas = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedProgramas = force ? null : getSessionCacheData<Programa[]>(GRUPOS_PROGRAMAS_CACHE_KEY, activeToken);

            if (cachedProgramas) {
                setProgramas(cachedProgramas);
                return;
            }

            const response = await programaService.listarProgramas();
            setProgramas(response.programas);
            setSessionCacheData(GRUPOS_PROGRAMAS_CACHE_KEY, activeToken, response.programas);
        } catch (error) {
            toast.error(`Error al cargar programas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    const loadPeriodos = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedPeriodos = force ? null : getSessionCacheData<PeriodoAcademico[]>(GRUPOS_PERIODOS_CACHE_KEY, activeToken);

            if (cachedPeriodos) {
                setPeriodos(cachedPeriodos);
                return;
            }

            const response = await periodoService.listarPeriodos();
            setPeriodos(response.periodos);
            setSessionCacheData(GRUPOS_PERIODOS_CACHE_KEY, activeToken, response.periodos);
        } catch (error) {
            toast.error(`Error al cargar periodos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        loadGrupos();
        loadProgramas();
        loadPeriodos();
    }, []);

    // ==================== HANDLERS ====================

    const handleCreateGrupo = async () => {
        if (!grupoForm.nombre.trim()) {
            toast.error('El nombre del grupo es obligatorio');
            return;
        }
        if (!grupoForm.programa_id) {
            toast.error('Debe seleccionar un programa');
            return;
        }
        if (!grupoForm.periodo_id) {
            toast.error('Debe seleccionar un periodo');
            return;
        }
        if (!grupoForm.semestre || Number(grupoForm.semestre) < 1) {
            toast.error('Debe especificar el semestre (mínimo 1)');
            return;
        }

        try {
            setLoading(true);
            await grupoService.create({
                nombre: grupoForm.nombre.trim(),
                programa_id: Number(grupoForm.programa_id),
                periodo_id: Number(grupoForm.periodo_id),
                semestre: Number(grupoForm.semestre),
                activo: true
            });

            await loadGrupos({ force: true });
            resetForm();
            setShowCreateGrupo(false);

            toast.success('Grupo creado exitosamente');
        } catch (error) {
            toast.error(`Error al crear grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const openEditGrupo = (grupo: GrupoAcademico) => {
        setSelectedGrupo(grupo);
        setGrupoForm({
            nombre: grupo.nombre,
            programa_id: grupo.programa_id.toString(),
            periodo_id: grupo.periodo_id.toString(),
            semestre: grupo.semestre.toString()
        });
        setShowEditGrupo(true);
    };

    const handleEditGrupo = async () => {
        if (!selectedGrupo || !selectedGrupo.id) return;

        if (!grupoForm.nombre.trim()) {
            toast.error('El nombre del grupo es obligatorio');
            return;
        }
        if (!grupoForm.programa_id) {
            toast.error('Debe seleccionar un programa');
            return;
        }
        if (!grupoForm.periodo_id) {
            toast.error('Debe seleccionar un periodo');
            return;
        }
        if (!grupoForm.semestre || Number(grupoForm.semestre) < 1) {
            toast.error('Debe especificar el semestre (mínimo 1)');
            return;
        }

        try {
            setLoading(true);
            await grupoService.update({
                id: selectedGrupo.id,
                nombre: grupoForm.nombre.trim(),
                programa_id: Number(grupoForm.programa_id),
                periodo_id: Number(grupoForm.periodo_id),
                semestre: Number(grupoForm.semestre)
            });

            await loadGrupos({ force: true });
            setShowEditGrupo(false);
            setSelectedGrupo(null);
            resetForm();

            toast.info('Grupo actualizado exitosamente');
        } catch (error) {
            toast.error(`Error al actualizar grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const openDeleteGrupo = (grupo: GrupoAcademico) => {
        setSelectedGrupo(grupo);
        setShowDeleteGrupo(true);
    };

    const handleDeleteGrupo = async () => {
        if (!selectedGrupo || !selectedGrupo.id) return;

        try {
            setLoading(true);
            await grupoService.delete({ id: selectedGrupo.id });

            await loadGrupos({ force: true });
            setShowDeleteGrupo(false);
            setSelectedGrupo(null);

            toast.error('Grupo eliminado exitosamente');
        } catch (error) {
            toast.error(`Error al eliminar grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const toggleGrupoActivo = async (grupo: GrupoAcademico) => {
        if (!grupo.id) return;

        try {
            setLoading(true);
            await grupoService.update({
                id: grupo.id,
                activo: !grupo.activo
            });

            await loadGrupos({ force: true });
            toast.warning(grupo.activo ? 'Grupo inactivado correctamente' : 'Grupo activado correctamente');
        } catch (error) {
            toast.error(`Error al cambiar estado del grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // ==================== UTILIDADES ====================

    const resetForm = () => {
        setGrupoForm({
            nombre: '',
            programa_id: '',
            periodo_id: '',
            semestre: ''
        });
    };

    // ==================== FILTROS ====================

    const filteredGrupos = useMemo(() => {
        return grupos.filter(grupo => {
            const matchesSearch = grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesPrograma = selectedProgramaFilter === 'all' || grupo.programa_id.toString() === selectedProgramaFilter;
            const matchesSemestre = selectedSemestreFilter === 'all' || grupo.semestre.toString() === selectedSemestreFilter;
            return matchesSearch && matchesPrograma && matchesSemestre;
        });
    }, [grupos, searchTerm, selectedProgramaFilter, selectedSemestreFilter]);

    const totalFilteredGrupos = filteredGrupos.length;
    const totalPages = getTotalPages(totalFilteredGrupos, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages), [totalPages]);

    const paginatedGrupos = useMemo(() => {
        return getPageSlice(filteredGrupos, currentPage, PAGE_SIZE);
    }, [filteredGrupos, currentPage, PAGE_SIZE]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedProgramaFilter, selectedSemestreFilter]);

    useEffect(() => {
        setCurrentPage((prev) => normalizePage(prev, totalPages));
    }, [totalPages]);

    const goToPage = (page: number) => {
        setCurrentPage(normalizePage(page, totalPages));
    };

    const goToNextPage = () => {
        goToPage(currentPage + 1);
    };

    const goToPrevPage = () => {
        goToPage(currentPage - 1);
    };

    const semestresDisponibles = Array.from(new Set(grupos.map(g => g.semestre).filter(s => s !== undefined))).sort((a, b) => a - b);

    // Obtener nombre del programa por ID
    const getProgramaNombre = (programaId: number): string => {
        const programa = programas.find(p => p.id === programaId);
        return programa?.nombre || 'Sin programa';
    };

    // Obtener nombre del periodo por ID
    const getPeriodoNombre = (periodoId: number): string => {
        const periodo = periodos.find(p => p.id === periodoId);
        return periodo?.nombre || 'Sin periodo';
    };

    // Obtener semestres disponibles filtrados por programa seleccionado
    const getSemestresDisponiblesPorPrograma = (): number[] => {
        if (selectedProgramaFilter === 'all') {
            // Si no hay programa seleccionado, mostrar todos los semestres
            return semestresDisponibles;
        }

        // Filtrar grupos por el programa seleccionado y obtener sus semestres únicos
        const gruposFiltrados = grupos.filter(g => g.programa_id.toString() === selectedProgramaFilter);
        const semestres = Array.from(new Set(gruposFiltrados.map(g => g.semestre).filter(s => s !== undefined))).sort((a, b) => a - b);
        return semestres;
    };

    return {
        searchTerm, setSearchTerm,
        loading,
        grupos,
        programas,
        periodos,
        selectedProgramaFilter, setSelectedProgramaFilter,
        selectedSemestreFilter, setSelectedSemestreFilter,
        showCreateGrupo, setShowCreateGrupo,
        showEditGrupo, setShowEditGrupo,
        showDeleteGrupo, setShowDeleteGrupo,
        grupoForm, setGrupoForm,
        selectedGrupo, setSelectedGrupo,
        handleCreateGrupo,
        openEditGrupo,
        handleEditGrupo,
        openDeleteGrupo,
        handleDeleteGrupo,
        toggleGrupoActivo,
        resetForm,
        filteredGrupos,
        paginatedGrupos,
        totalFilteredGrupos,
        currentPage,
        totalPages,
        pageNumbers,
        pageSize: PAGE_SIZE,
        goToPage,
        goToNextPage,
        goToPrevPage,
        semestresDisponibles,
        getProgramaNombre,
        getPeriodoNombre,
        getSemestresDisponiblesPorPrograma
    };
}
