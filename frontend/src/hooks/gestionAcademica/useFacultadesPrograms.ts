import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { toast } from 'sonner';
import { facultadService } from '../../services/facultades/facultadesAPI';
import type { Facultad as FacultadAPI } from '../../services/facultades/facultadesAPI';
import { programaService } from '../../services/programas/programaAPI';
import type { Programa as ProgramaAPI } from '../../services/programas/programaAPI';
import { asignaturaService, asignaturaProgramaService } from '../../services/asignaturas/asignaturaAPI';
import type { Asignatura, AsignaturaPrograma } from '../../services/asignaturas/asignaturaAPI';

// Mapear tipos de API a modelo del frontend
type Facultad = FacultadAPI;

// Interfaz adaptada para Programa del frontend (con camelCase)
interface Programa {
    id?: number;
    nombre: string;
    facultadId: number | null; // Puede ser null si no tiene facultad asignada
    semestres: number;
    activo: boolean;
}

export type TabOption = 'sedes' | 'facultades' | 'programas' | 'asignaturas' | 'docentes' | 'grupos' | 'fusion' | 'espacios' | 'recursos';

export function useFacultadesPrograms() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TabOption>('sedes');

    // Estados de datos
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
    const [asignaturasPrograma, setAsignaturasPrograma] = useState<AsignaturaPrograma[]>([]);
    const [loading, setLoading] = useState(false);

    // Estados de modales
    const [showCreateFacultad, setShowCreateFacultad] = useState(false);
    const [showEditFacultad, setShowEditFacultad] = useState(false);
    const [showDeleteFacultad, setShowDeleteFacultad] = useState(false);
    const [showCreatePrograma, setShowCreatePrograma] = useState(false);
    const [showEditPrograma, setShowEditPrograma] = useState(false);
    const [showDeletePrograma, setShowDeletePrograma] = useState(false);
    const [showAsignaturasModal, setShowAsignaturasModal] = useState(false);
    const [showAddAsignaturaModal, setShowAddAsignaturaModal] = useState(false);

    // Estados de formularios
    const [facultadForm, setFacultadForm] = useState({ nombre: '' });
    const [programaForm, setProgramaForm] = useState({
        nombre: '',
        facultadId: '',
        semestres: ''
    });
    const [asignaturaForm, setAsignaturaForm] = useState({
        asignaturaId: '',
        semestre: '',
        componente_formativo: 'profesional' as 'electiva' | 'optativa' | 'profesional' | 'humanística' | 'básica'
    });

    // Estados de selección
    const [selectedFacultad, setSelectedFacultad] = useState<Facultad | null>(null);
    const [selectedPrograma, setSelectedPrograma] = useState<Programa | null>(null);
    const [selectedProgramaForAsignaturas, setSelectedProgramaForAsignaturas] = useState<Programa | null>(null);
    const [selectedAsignaturaPrograma, setSelectedAsignaturaPrograma] = useState<AsignaturaPrograma | null>(null);
    const [selectedFacultadFilter, setSelectedFacultadFilter] = useState<string>('all');

    // Key para forzar recarga de componentes hijos
    const [reloadKey, setReloadKey] = useState(0);

    // Cargar datos
    useEffect(() => {
        loadFacultades();
        loadProgramas();
        loadAsignaturas();
    }, []);

    // Recargar cuando cambie de pestaña
    useEffect(() => {
        loadFacultades();
        loadProgramas();
        loadAsignaturas();
    }, [activeTab]);

    const loadFacultades = async () => {
        try {
            setLoading(true);
            const response = await facultadService.list();
            setFacultades(response.facultades);
        } catch (error) {
            toast.error(`Error al cargar facultades: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const loadProgramas = async () => {
        try {
            setLoading(true);
            const response = await programaService.listarProgramas();
            // Mapear facultad_id (snake_case) a facultadId (camelCase)
            // Filtrar programas sin facultad asignada
            const mappedProgramas = response.programas
                .filter(p => p.facultad_id !== null)
                .map(p => ({
                    id: p.id,
                    nombre: p.nombre,
                    facultadId: p.facultad_id,
                    semestres: p.semestres,
                    activo: p.activo
                }));
            setProgramas(mappedProgramas);
        } catch (error) {
            toast.error(`Error al cargar programas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const loadAsignaturas = async () => {
        try {
            const response = await asignaturaService.list();
            setAsignaturas(response.asignaturas);
        } catch (error) {
            toast.error(`Error al cargar asignaturas: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    const loadAsignaturasPrograma = async (programaId: number) => {
        try {
            setLoading(true);
            const response = await asignaturaProgramaService.list(programaId);
            setAsignaturasPrograma(response.asignaturas_programa);
        } catch (error) {
            toast.error(`Error al cargar asignaturas del programa: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Función para recargar todos los datos
    const reloadAllData = () => {
        loadFacultades();
        loadProgramas();
        loadAsignaturas();
        setReloadKey(prev => prev + 1); // Forzar recarga de componentes hijos
    };

    // ==================== ASIGNATURAS DEL PROGRAMA ====================

    const openAsignaturasModal = async (programa: Programa) => {
        setSelectedProgramaForAsignaturas(programa);
        if (programa.id) {
            await loadAsignaturasPrograma(programa.id);
        }
        setShowAsignaturasModal(true);
    };

    const openAddAsignaturaModal = () => {
        setAsignaturaForm({
            asignaturaId: '',
            semestre: '',
            componente_formativo: 'profesional'
        });
        setShowAddAsignaturaModal(true);
    };

    const handleAddAsignatura = async () => {
        if (!selectedProgramaForAsignaturas || !selectedProgramaForAsignaturas.id) return;

        // Validaciones
        if (!asignaturaForm.asignaturaId) {
            toast.error('Debe seleccionar una asignatura');
            return;
        }

        if (!asignaturaForm.semestre || Number(asignaturaForm.semestre) < 1) {
            toast.error('Debe especificar el semestre');
            return;
        }

        if (Number(asignaturaForm.semestre) > selectedProgramaForAsignaturas.semestres) {
            toast.error(`El semestre no puede ser mayor a ${selectedProgramaForAsignaturas.semestres}`);
            return;
        }

        try {
            setLoading(true);
            await asignaturaProgramaService.create({
                programa_id: selectedProgramaForAsignaturas.id,
                asignatura_id: Number(asignaturaForm.asignaturaId),
                semestre: Number(asignaturaForm.semestre),
                componente_formativo: asignaturaForm.componente_formativo
            });

            await loadAsignaturasPrograma(selectedProgramaForAsignaturas.id);
            setShowAddAsignaturaModal(false);
            setAsignaturaForm({
                asignaturaId: '',
                semestre: '',
                componente_formativo: 'profesional'
            });

            toast.success('Asignatura agregada al programa exitosamente');
        } catch (error) {
            toast.error(`Error al agregar asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleRemoveAsignatura = async (asignaturaPrograma: AsignaturaPrograma) => {
        if (!asignaturaPrograma.id || !selectedProgramaForAsignaturas?.id) return;

        if (!confirm(`¿Está seguro de eliminar ${asignaturaPrograma.asignatura_nombre} del programa?`)) {
            return;
        }

        try {
            setLoading(true);
            await asignaturaProgramaService.delete({ id: asignaturaPrograma.id });

            await loadAsignaturasPrograma(selectedProgramaForAsignaturas.id);

            toast.error('Asignatura eliminada del programa correctamente');
        } catch (error) {
            toast.error(`Error al eliminar asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateAsignaturaPrograma = async (asignaturaPrograma: AsignaturaPrograma, updates: Partial<AsignaturaPrograma>) => {
        if (!asignaturaPrograma.id || !selectedProgramaForAsignaturas?.id) return;

        try {
            setLoading(true);
            await asignaturaProgramaService.update({
                id: asignaturaPrograma.id,
                ...updates
            });

            await loadAsignaturasPrograma(selectedProgramaForAsignaturas.id);

            toast.info('Asignatura actualizada correctamente');
        } catch (error) {
            toast.error(`Error al actualizar asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // ==================== FACULTADES ====================

    const handleCreateFacultad = async () => {
        // Validación
        if (!facultadForm.nombre.trim()) {
            toast.error('El nombre de la facultad es obligatorio');
            return;
        }

        try {
            setLoading(true);
            await facultadService.create({
                nombre: facultadForm.nombre.trim(),
                activa: true
            });

            await loadFacultades();
            setFacultadForm({ nombre: '' });
            setShowCreateFacultad(false);

            toast.success('Facultad registrada exitosamente');
        } catch (error) {
            toast.error(`Error al crear facultad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditFacultad = async () => {
        if (!selectedFacultad || !selectedFacultad.id) return;

        // Validación
        if (!facultadForm.nombre.trim()) {
            toast.error('El nombre de la facultad es obligatorio');
            return;
        }

        try {
            setLoading(true);
            await facultadService.update({
                id: selectedFacultad.id,
                nombre: facultadForm.nombre.trim(),
                activa: selectedFacultad.activa
            });

            await loadFacultades();
            loadProgramas(); // Por si el nombre cambió en programas

            setShowEditFacultad(false);
            setSelectedFacultad(null);
            setFacultadForm({ nombre: '' });

            toast.info('Facultad actualizada correctamente');
        } catch (error) {
            toast.error(`Error al actualizar facultad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteFacultad = async () => {
        if (!selectedFacultad || !selectedFacultad.id) return;

        try {
            setLoading(true);
            await facultadService.delete({ id: selectedFacultad.id });

            await loadFacultades();
            loadProgramas();

            setShowDeleteFacultad(false);
            setSelectedFacultad(null);

            toast.error('Facultad eliminada correctamente');
        } catch (error) {
            toast.error(`Error al eliminar facultad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const openEditFacultad = (facultad: Facultad) => {
        setSelectedFacultad(facultad);
        setFacultadForm({ nombre: facultad.nombre });
        setShowEditFacultad(true);
    };

    const openDeleteFacultad = (facultad: Facultad) => {
        setSelectedFacultad(facultad);
        setShowDeleteFacultad(true);
    };

    const toggleFacultadActiva = async (facultad: Facultad) => {
        if (!facultad.id) return;

        try {
            setLoading(true);
            await facultadService.update({
                id: facultad.id,
                nombre: facultad.nombre,
                activa: !facultad.activa
            });

            await loadFacultades();

            toast.warning(facultad.activa ? 'Facultad inactivada correctamente' : 'Facultad activada correctamente');
        } catch (error) {
            toast.error(`Error al cambiar estado de facultad: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // ==================== PROGRAMAS ====================

    const handleCreatePrograma = async () => {
        // Validaciones
        if (!programaForm.nombre.trim()) {
            toast.error('El nombre del programa es obligatorio');
            return;
        }

        if (!programaForm.facultadId) {
            toast.error('Debe seleccionar una facultad');
            return;
        }

        if (!programaForm.semestres || Number(programaForm.semestres) < 1) {
            toast.error('Debe especificar el número de semestres (mínimo 1)');
            return;
        }

        try {
            setLoading(true);
            await programaService.crearPrograma({
                nombre: programaForm.nombre.trim(),
                facultad_id: Number(programaForm.facultadId),
                semestres: Number(programaForm.semestres),
                activo: true
            });

            await loadProgramas();
            setProgramaForm({ nombre: '', facultadId: '', semestres: '' });
            setShowCreatePrograma(false);

            toast.success('Programa registrado exitosamente');
        } catch (error) {
            toast.error(`Error al crear programa: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleEditPrograma = async () => {
        if (!selectedPrograma || !selectedPrograma.id) return;

        // Validaciones
        if (!programaForm.nombre.trim()) {
            toast.error('El nombre del programa es obligatorio');
            return;
        }

        if (!programaForm.facultadId) {
            toast.error('Debe seleccionar una facultad');
            return;
        }

        if (!programaForm.semestres || Number(programaForm.semestres) < 1) {
            toast.error('Debe especificar el número de semestres (mínimo 1)');
            return;
        }

        try {
            setLoading(true);
            await programaService.actualizarPrograma({
                id: selectedPrograma.id,
                nombre: programaForm.nombre.trim(),
                facultad_id: Number(programaForm.facultadId),
                semestres: Number(programaForm.semestres),
                activo: selectedPrograma.activo
            });

            await loadProgramas();
            setShowEditPrograma(false);
            setSelectedPrograma(null);
            setProgramaForm({ nombre: '', facultadId: '', semestres: '' });

            toast.info('Programa actualizado correctamente');
        } catch (error) {
            toast.error(`Error al actualizar programa: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const handleDeletePrograma = async () => {
        if (!selectedPrograma || !selectedPrograma.id) return;

        try {
            setLoading(true);
            await programaService.eliminarPrograma(selectedPrograma.id);

            await loadProgramas();
            setShowDeletePrograma(false);
            setSelectedPrograma(null);

            toast.error('Programa eliminado correctamente');
        } catch (error) {
            toast.error(`Error al eliminar programa: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const openEditPrograma = (programa: Programa) => {
        setSelectedPrograma(programa);
        setProgramaForm({
            nombre: programa.nombre,
            facultadId: programa.facultadId?.toString() || '',
            semestres: programa.semestres.toString()
        });
        setShowEditPrograma(true);
    };

    const openDeletePrograma = (programa: Programa) => {
        setSelectedPrograma(programa);
        setShowDeletePrograma(true);
    };

    const toggleProgramaActivo = async (programa: Programa) => {
        if (!programa.id) return;

        try {
            setLoading(true);
            await programaService.actualizarPrograma({
                id: programa.id,
                nombre: programa.nombre,
                facultad_id: Number(programa.facultadId),
                semestres: programa.semestres,
                activo: !programa.activo
            });

            await loadProgramas();

            toast.warning(programa.activo ? 'Programa inactivado correctamente' : 'Programa activado correctamente');
        } catch (error) {
            toast.error(`Error al cambiar estado de programa: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // ==================== FILTROS ====================

    const filteredFacultades = facultades.filter(f =>
        f.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredProgramas = programas.filter(p => {
        const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFacultad = selectedFacultadFilter === 'all' || p.facultadId?.toString() === selectedFacultadFilter;
        return matchSearch && matchFacultad;
    });

    // Contar programas por facultad
    const getProgramasCount = (facultadId: number | string) => {
        if (!facultadId) return 0;
        const idStr = facultadId.toString();
        return programas.filter(p => p.facultadId?.toString() === idStr).length;
    };

    // Obtener nombre de facultad
    const getFacultadNombre = (facultadId: number | string | null) => {
        if (!facultadId) return 'Sin facultad';
        const idStr = facultadId.toString();
        const facultad = facultades.find(f => f.id?.toString() === idStr);
        return facultad?.nombre || 'Sin facultad';
    };

    // Obtener asignaturas disponibles (que no estén ya asignadas al programa)
    const availableAsignaturas = asignaturas.filter(a => 
        !asignaturasPrograma.some(ap => ap.asignatura_id === a.id)
    );

    // Agrupar asignaturas por semestre
    const asignaturasBySemestre = asignaturasPrograma.reduce((acc, ap) => {
        const semestre = ap.semestre;
        if (!acc[semestre]) {
            acc[semestre] = [];
        }
        acc[semestre].push(ap);
        return acc;
    }, {} as Record<number, AsignaturaPrograma[]>);

    return {
        searchTerm, setSearchTerm,
        activeTab, setActiveTab,
        facultades,
        programas,
        asignaturas,
        asignaturasPrograma,
        loading,
        showCreateFacultad, setShowCreateFacultad,
        showEditFacultad, setShowEditFacultad,
        showDeleteFacultad, setShowDeleteFacultad,
        showCreatePrograma, setShowCreatePrograma,
        showEditPrograma, setShowEditPrograma,
        showDeletePrograma, setShowDeletePrograma,
        showAsignaturasModal, setShowAsignaturasModal,
        showAddAsignaturaModal, setShowAddAsignaturaModal,
        facultadForm, setFacultadForm,
        programaForm, setProgramaForm,
        asignaturaForm, setAsignaturaForm,
        selectedFacultad, setSelectedFacultad,
        selectedPrograma, setSelectedPrograma,
        selectedProgramaForAsignaturas, setSelectedProgramaForAsignaturas,
        selectedAsignaturaPrograma, setSelectedAsignaturaPrograma,
        selectedFacultadFilter, setSelectedFacultadFilter,
        reloadKey,
        handleCreateFacultad,
        handleEditFacultad,
        handleDeleteFacultad,
        openEditFacultad,
        openDeleteFacultad,
        toggleFacultadActiva,
        handleCreatePrograma,
        handleEditPrograma,
        handleDeletePrograma,
        openEditPrograma,
        openDeletePrograma,
        toggleProgramaActivo,
        openAsignaturasModal,
        openAddAsignaturaModal,
        handleAddAsignatura,
        handleRemoveAsignatura,
        handleUpdateAsignaturaPrograma,
        filteredFacultades,
        filteredProgramas,
        getProgramasCount,
        getFacultadNombre,
        reloadAllData,
        activeFacultades: facultades.filter(f => f.activa),
        availableAsignaturas,
        asignaturasBySemestre
    };
}
