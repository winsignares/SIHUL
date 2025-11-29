import { useState, useEffect } from 'react';
import { showNotification } from '../../context/ThemeContext';
import { asignaturaService } from '../../services/asignaturas/asignaturaAPI';
import type { Asignatura } from '../../services/asignaturas/asignaturaAPI';
import { programaService } from '../../services/programas/programaAPI';
import type { Programa } from '../../services/programas/programaAPI';

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
    const [programas, setProgramas] = useState<Programa[]>([]);

    // Filtros
    const [selectedProgramaFilter, setSelectedProgramaFilter] = useState<string>('all');

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
        programaId: '',
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
            const [asignaturasRes, programasRes] = await Promise.all([
                asignaturaService.list(),
                programaService.listarProgramas()
            ]);
            setAsignaturas(asignaturasRes.asignaturas);
            setProgramas(programasRes.programas);
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

        if (!asignaturaForm.programaId) {
            showNotification({ message: 'El programa es obligatorio', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            await asignaturaService.create({
                codigo: asignaturaForm.codigo.trim(),
                nombre: asignaturaForm.nombre.trim(),
                creditos: Number(asignaturaForm.creditos),
                tipo: asignaturaForm.tipo,
                programa_id: Number(asignaturaForm.programaId),
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
            programaId: asignatura.programa_id ? asignatura.programa_id.toString() : '',
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

        if (!asignaturaForm.programaId) {
            showNotification({ message: 'El programa es obligatorio', type: 'error' });
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
                programa_id: Number(asignaturaForm.programaId),
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
            programaId: '',
            horas: ''
        });
    };

    const getProgramaNombre = (id?: number) => {
        if (!id) return 'Sin programa';
        const p = programas.find(p => p.id === id);
        return p ? p.nombre : 'Desconocido';
    };

    // ==================== FILTROS ====================

    const activeProgramas = programas.filter(p => p.activo);

    const filteredAsignaturas = asignaturas.filter(asignatura => {
        // Búsqueda por texto
        const matchSearch =
            asignatura.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase());

        // Filtro por programa
        const matchPrograma = selectedProgramaFilter === 'all' ||
            (asignatura.programa_id && asignatura.programa_id.toString() === selectedProgramaFilter);

        return matchSearch && matchPrograma;
    });

    return {
        searchTerm, setSearchTerm,
        loading,
        asignaturas,
        programas,
        activeProgramas,
        selectedProgramaFilter, setSelectedProgramaFilter,
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
        getProgramaNombre
    };
}
