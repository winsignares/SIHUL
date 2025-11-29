import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { showNotification } from '../../context/ThemeContext';
import { facultadService } from '../../services/facultades/facultadesAPI';
import type { Facultad as FacultadAPI } from '../../services/facultades/facultadesAPI';
import { programaService } from '../../services/programas/programaAPI';
import type { Programa as ProgramaAPI } from '../../services/programas/programaAPI';

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
    const [loading, setLoading] = useState(false);

    // Estados de modales
    const [showCreateFacultad, setShowCreateFacultad] = useState(false);
    const [showEditFacultad, setShowEditFacultad] = useState(false);
    const [showDeleteFacultad, setShowDeleteFacultad] = useState(false);
    const [showCreatePrograma, setShowCreatePrograma] = useState(false);
    const [showEditPrograma, setShowEditPrograma] = useState(false);
    const [showDeletePrograma, setShowDeletePrograma] = useState(false);

    // Estados de formularios
    const [facultadForm, setFacultadForm] = useState({ nombre: '' });
    const [programaForm, setProgramaForm] = useState({
        nombre: '',
        facultadId: '',
        semestres: ''
    });

    // Estados de selección
    const [selectedFacultad, setSelectedFacultad] = useState<Facultad | null>(null);
    const [selectedPrograma, setSelectedPrograma] = useState<Programa | null>(null);
    const [selectedFacultadFilter, setSelectedFacultadFilter] = useState<string>('all');

    // Key para forzar recarga de componentes hijos
    const [reloadKey, setReloadKey] = useState(0);

    // Cargar datos
    useEffect(() => {
        loadFacultades();
        loadProgramas();
    }, []);

    // Recargar cuando cambie de pestaña
    useEffect(() => {
        loadFacultades();
        loadProgramas();
    }, [activeTab]);

    const loadFacultades = async () => {
        try {
            setLoading(true);
            const response = await facultadService.list();
            setFacultades(response.facultades);
        } catch (error) {
            showNotification({
                message: `Error al cargar facultades: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
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
            showNotification({
                message: `Error al cargar programas: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Función para recargar todos los datos
    const reloadAllData = () => {
        loadFacultades();
        loadProgramas();
        setReloadKey(prev => prev + 1); // Forzar recarga de componentes hijos
    };

    // ==================== FACULTADES ====================

    const handleCreateFacultad = async () => {
        // Validación
        if (!facultadForm.nombre.trim()) {
            showNotification({ message: 'El nombre de la facultad es obligatorio', type: 'error' });
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

            showNotification({ message: '✅ Facultad registrada exitosamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al crear facultad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditFacultad = async () => {
        if (!selectedFacultad || !selectedFacultad.id) return;

        // Validación
        if (!facultadForm.nombre.trim()) {
            showNotification({ message: 'El nombre de la facultad es obligatorio', type: 'error' });
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

            showNotification({ message: '✅ Facultad actualizada correctamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al actualizar facultad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
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

            showNotification({ message: '✅ Facultad eliminada correctamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al eliminar facultad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
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

            showNotification({ message: facultad.activa ? '✅ Facultad inactivada correctamente' : '✅ Facultad activada correctamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al cambiar estado de facultad: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // ==================== PROGRAMAS ====================

    const handleCreatePrograma = async () => {
        // Validaciones
        if (!programaForm.nombre.trim()) {
            showNotification({ message: 'El nombre del programa es obligatorio', type: 'error' });
            return;
        }

        if (!programaForm.facultadId) {
            showNotification({ message: 'Debe seleccionar una facultad', type: 'error' });
            return;
        }

        if (!programaForm.semestres || Number(programaForm.semestres) < 1) {
            showNotification({ message: 'Debe especificar el número de semestres (mínimo 1)', type: 'error' });
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

            showNotification({ message: '✅ Programa registrado exitosamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al crear programa: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleEditPrograma = async () => {
        if (!selectedPrograma || !selectedPrograma.id) return;

        // Validaciones
        if (!programaForm.nombre.trim()) {
            showNotification({ message: 'El nombre del programa es obligatorio', type: 'error' });
            return;
        }

        if (!programaForm.facultadId) {
            showNotification({ message: 'Debe seleccionar una facultad', type: 'error' });
            return;
        }

        if (!programaForm.semestres || Number(programaForm.semestres) < 1) {
            showNotification({ message: 'Debe especificar el número de semestres (mínimo 1)', type: 'error' });
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

            showNotification({ message: '✅ Programa actualizado correctamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al actualizar programa: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
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

            showNotification({ message: '✅ Programa eliminado correctamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al eliminar programa: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
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

            showNotification({ message: programa.activo ? '✅ Programa inactivado correctamente' : '✅ Programa activado correctamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al cambiar estado de programa: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
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

    return {
        searchTerm, setSearchTerm,
        activeTab, setActiveTab,
        facultades,
        programas,
        loading,
        showCreateFacultad, setShowCreateFacultad,
        showEditFacultad, setShowEditFacultad,
        showDeleteFacultad, setShowDeleteFacultad,
        showCreatePrograma, setShowCreatePrograma,
        showEditPrograma, setShowEditPrograma,
        showDeletePrograma, setShowDeletePrograma,
        facultadForm, setFacultadForm,
        programaForm, setProgramaForm,
        selectedFacultad, setSelectedFacultad,
        selectedPrograma, setSelectedPrograma,
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
        filteredFacultades,
        filteredProgramas,
        getProgramasCount,
        getFacultadNombre,
        reloadAllData,
        activeFacultades: facultades.filter(f => f.activa)
    };
}
