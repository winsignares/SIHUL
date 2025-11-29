import { useState, useEffect } from 'react';
import { showNotification } from '../../context/ThemeContext';
import { grupoService } from '../../services/grupos/gruposAPI';
import { programaService, type Programa } from '../../services/programas/programaAPI';
import { periodoService, type PeriodoAcademico } from '../../services/periodos/periodoAPI';
import type { Grupo } from '../../services/grupos/gruposAPI';

export interface GrupoAcademico {
    id?: number;
    nombre: string;
    programa_id: number;
    periodo_id: number;
    semestre: number;
    activo?: boolean;
}

export function useGrupos() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);
    const [grupos, setGrupos] = useState<GrupoAcademico[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);
    const [selectedProgramaFilter, setSelectedProgramaFilter] = useState<string>('all');
    const [selectedSemestreFilter, setSelectedSemestreFilter] = useState<string>('all');

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

    const loadGrupos = async () => {
        try {
            setLoading(true);
            const response = await grupoService.list();
            setGrupos(response.grupos);
        } catch (error) {
            showNotification({ 
                message: `Error al cargar grupos: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const loadProgramas = async () => {
        try {
            const response = await programaService.listarProgramas();
            setProgramas(response.programas);
        } catch (error) {
            showNotification({ 
                message: `Error al cargar programas: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
        }
    };

    const loadPeriodos = async () => {
        try {
            const response = await periodoService.listarPeriodos();
            setPeriodos(response.periodos);
        } catch (error) {
            showNotification({ 
                message: `Error al cargar periodos: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
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
            showNotification({ message: 'El nombre del grupo es obligatorio', type: 'error' });
            return;
        }
        if (!grupoForm.programa_id) {
            showNotification({ message: 'Debe seleccionar un programa', type: 'error' });
            return;
        }
        if (!grupoForm.periodo_id) {
            showNotification({ message: 'Debe seleccionar un periodo', type: 'error' });
            return;
        }
        if (!grupoForm.semestre || Number(grupoForm.semestre) < 1) {
            showNotification({ message: 'Debe especificar el semestre (mínimo 1)', type: 'error' });
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

            await loadGrupos();
            resetForm();
            setShowCreateGrupo(false);

            showNotification({ message: '✅ Grupo creado exitosamente', type: 'success' });
        } catch (error) {
            showNotification({ 
                message: `Error al crear grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
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
            showNotification({ message: 'El nombre del grupo es obligatorio', type: 'error' });
            return;
        }
        if (!grupoForm.programa_id) {
            showNotification({ message: 'Debe seleccionar un programa', type: 'error' });
            return;
        }
        if (!grupoForm.periodo_id) {
            showNotification({ message: 'Debe seleccionar un periodo', type: 'error' });
            return;
        }
        if (!grupoForm.semestre || Number(grupoForm.semestre) < 1) {
            showNotification({ message: 'Debe especificar el semestre (mínimo 1)', type: 'error' });
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

            await loadGrupos();
            setShowEditGrupo(false);
            setSelectedGrupo(null);
            resetForm();

            showNotification({ message: '✅ Grupo actualizado exitosamente', type: 'success' });
        } catch (error) {
            showNotification({ 
                message: `Error al actualizar grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
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

            await loadGrupos();
            setShowDeleteGrupo(false);
            setSelectedGrupo(null);

            showNotification({ message: '✅ Grupo eliminado exitosamente', type: 'success' });
        } catch (error) {
            showNotification({ 
                message: `Error al eliminar grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
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

            await loadGrupos();
            showNotification({ 
                message: grupo.activo ? '✅ Grupo inactivado correctamente' : '✅ Grupo activado correctamente', 
                type: 'success' 
            });
        } catch (error) {
            showNotification({ 
                message: `Error al cambiar estado del grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
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

    const filteredGrupos = grupos.filter(grupo => {
        const matchesSearch = grupo.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrograma = selectedProgramaFilter === 'all' || grupo.programa_id.toString() === selectedProgramaFilter;
        const matchesSemestre = selectedSemestreFilter === 'all' || grupo.semestre.toString() === selectedSemestreFilter;
        return matchesSearch && matchesPrograma && matchesSemestre;
    });

    const semestresDisponibles = Array.from(new Set(grupos.map(g => g.semestre).filter(s => s !== undefined))).sort((a, b) => a - b);

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
        semestresDisponibles
    };
}
