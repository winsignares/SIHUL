import { useState, useEffect } from 'react';
import { showNotification } from '../../context/ThemeContext';
import { asignaturaService } from '../../services/asignaturas/asignaturaAPI';
import type { Asignatura } from '../../services/asignaturas/asignaturaAPI';
import { facultadService } from '../../services/facultades/facultadesAPI';
import type { Facultad } from '../../services/facultades/facultadesAPI';

export const tiposAsignatura = [
    { value: 'teórica', label: 'Teórica' },
    { value: 'práctica', label: 'Práctica' },
    { value: 'mixta', label: 'Mixta' }
];

export function useAsignaturas() {
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(false);

    // Estados de datos
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
    const [facultades, setFacultades] = useState<Facultad[]>([]);

    // Filtros
    const [selectedFacultadFilter, setSelectedFacultadFilter] = useState<string>('all');

    // Modales
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Formulario
    const [asignaturaForm, setAsignaturaForm] = useState({
        codigo: '',
        nombre: '',
        creditos: '',
        tipo: 'teórica' as 'teórica' | 'práctica' | 'mixta',
        facultadId: '',
        horas: ''
    });

    const [selectedAsignatura, setSelectedAsignatura] = useState<Asignatura | null>(null);

    // Cargar datos
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [asignaturasRes, facultadesRes] = await Promise.all([
                asignaturaService.list(),
                facultadService.list()
            ]);
            setAsignaturas(asignaturasRes.asignaturas);
            setFacultades(facultadesRes.facultades);
        } catch (error) {
            showNotification({
                message: `Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const loadAsignaturas = async () => {
        try {
            const response = await asignaturaService.list();
            setAsignaturas(response.asignaturas);
        } catch (error) {
            console.error("Error reloading asignaturas", error);
        }
    };

    // ==================== CREAR ASIGNATURA ====================

    const handleCreateAsignatura = async () => {
        // Validaciones
        if (!asignaturaForm.codigo.trim()) {
            showNotification({ message: 'El código es obligatorio', type: 'error' });
            return;
        }

        if (!asignaturaForm.nombre.trim()) {
            showNotification({ message: 'El nombre es obligatorio', type: 'error' });
            return;
        }

        if (!asignaturaForm.creditos || Number(asignaturaForm.creditos) < 1) {
            showNotification({ message: 'Los créditos deben ser mayor a 0', type: 'error' });
            return;
        }

        if (!asignaturaForm.facultadId) {
            showNotification({ message: 'La facultad es obligatoria', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            await asignaturaService.create({
                codigo: asignaturaForm.codigo.trim(),
                nombre: asignaturaForm.nombre.trim(),
                creditos: Number(asignaturaForm.creditos),
                tipo: asignaturaForm.tipo,
                facultad_id: Number(asignaturaForm.facultadId),
                horas: Number(asignaturaForm.horas) || 0
            });

            await loadAsignaturas();
            resetForm();
            setShowCreateDialog(false);

            showNotification({ message: '✅ Asignatura registrada exitosamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al crear asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // ==================== EDITAR ASIGNATURA ====================

    const openEditDialog = (asignatura: Asignatura) => {
        setSelectedAsignatura(asignatura);
        setAsignaturaForm({
            codigo: asignatura.codigo,
            nombre: asignatura.nombre,
            creditos: asignatura.creditos.toString(),
            tipo: asignatura.tipo || 'teórica',
            facultadId: asignatura.facultad_id ? asignatura.facultad_id.toString() : '',
            horas: asignatura.horas ? asignatura.horas.toString() : '0'
        });

        setShowEditDialog(true);
    };

    const handleEditAsignatura = async () => {
        if (!selectedAsignatura || !selectedAsignatura.id) return;

        // Validaciones
        if (!asignaturaForm.codigo.trim()) {
            showNotification({ message: 'El código es obligatorio', type: 'error' });
            return;
        }

        if (!asignaturaForm.nombre.trim()) {
            showNotification({ message: 'El nombre es obligatorio', type: 'error' });
            return;
        }

        if (!asignaturaForm.creditos || Number(asignaturaForm.creditos) < 1) {
            showNotification({ message: 'Los créditos deben ser mayor a 0', type: 'error' });
            return;
        }

        if (!asignaturaForm.facultadId) {
            showNotification({ message: 'La facultad es obligatoria', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            await asignaturaService.update({
                id: selectedAsignatura.id,
                codigo: asignaturaForm.codigo.trim(),
                nombre: asignaturaForm.nombre.trim(),
                creditos: Number(asignaturaForm.creditos),
                tipo: asignaturaForm.tipo,
                facultad_id: Number(asignaturaForm.facultadId),
                horas: Number(asignaturaForm.horas) || 0
            });

            await loadAsignaturas();
            setShowEditDialog(false);
            setSelectedAsignatura(null);
            resetForm();

            showNotification({ message: '✅ Asignatura actualizada correctamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al actualizar asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // ==================== ELIMINAR ASIGNATURA ====================

    const openDeleteDialog = (asignatura: Asignatura) => {
        setSelectedAsignatura(asignatura);
        setShowDeleteDialog(true);
    };

    const handleDeleteAsignatura = async () => {
        if (!selectedAsignatura || !selectedAsignatura.id) return;

        try {
            setLoading(true);
            await asignaturaService.delete({ id: selectedAsignatura.id });

            await loadAsignaturas();
            setShowDeleteDialog(false);
            setSelectedAsignatura(null);

            showNotification({ message: '✅ Asignatura eliminada correctamente', type: 'success' });
        } catch (error) {
            showNotification({
                message: `Error al eliminar asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // ==================== UTILIDADES ====================

    const resetForm = () => {
        setAsignaturaForm({
            codigo: '',
            nombre: '',
            creditos: '',
            tipo: 'teórica',
            facultadId: '',
            horas: ''
        });
    };

    const getFacultadNombre = (id?: number) => {
        if (!id) return 'Sin facultad';
        const f = facultades.find(f => f.id === id);
        return f ? f.nombre : 'Desconocida';
    };

    // ==================== FILTROS ====================

    const activeFacultades = facultades.filter(f => f.activa);

    const filteredAsignaturas = asignaturas.filter(asignatura => {
        // Búsqueda por texto
        const matchSearch =
            asignatura.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase());

        // Filtro por facultad
        const matchFacultad = selectedFacultadFilter === 'all' ||
            (asignatura.facultad_id && asignatura.facultad_id.toString() === selectedFacultadFilter);

        return matchSearch && matchFacultad;
    });

    return {
        searchTerm, setSearchTerm,
        loading,
        asignaturas,
        facultades,
        activeFacultades,
        selectedFacultadFilter, setSelectedFacultadFilter,
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showDeleteDialog, setShowDeleteDialog,
        asignaturaForm, setAsignaturaForm,
        selectedAsignatura, setSelectedAsignatura,
        handleCreateAsignatura,
        openEditDialog,
        handleEditAsignatura,
        openDeleteDialog,
        handleDeleteAsignatura,
        resetForm,
        filteredAsignaturas,
        getFacultadNombre
    };
}
