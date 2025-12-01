import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
            toast.error(`Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
        console.log('handleCreateAsignatura called', asignaturaForm);
        
        // Validaciones
        if (!asignaturaForm.codigo.trim()) {
            console.warn('Código vacío');
            toast.error('El código es obligatorio');
            return;
        }

        if (!asignaturaForm.nombre.trim()) {
            console.warn('Nombre vacío');
            toast.error('El nombre es obligatorio');
            return;
        }

        if (!asignaturaForm.creditos || Number(asignaturaForm.creditos) < 1) {
            console.warn('Créditos inválidos');
            toast.error('Los créditos deben ser mayor a 0');
            return;
        }

        try {
            setLoading(true);
            console.log('Enviando datos al servidor:', {
                codigo: asignaturaForm.codigo.trim(),
                nombre: asignaturaForm.nombre.trim(),
                creditos: Number(asignaturaForm.creditos),
                tipo: asignaturaForm.tipo,
                horas: Number(asignaturaForm.horas) || 0
            });
            
            await asignaturaService.create({
                codigo: asignaturaForm.codigo.trim(),
                nombre: asignaturaForm.nombre.trim(),
                creditos: Number(asignaturaForm.creditos),
                tipo: asignaturaForm.tipo,
                horas: Number(asignaturaForm.horas) || 0
            });

            console.log('Asignatura creada exitosamente');
            await loadAsignaturas();
            resetForm();
            setShowCreateDialog(false);

            toast.success('Asignatura registrada exitosamente');
        } catch (error) {
            console.error('Error al crear asignatura:', error);
            toast.error(`Error al crear asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
            horas: asignatura.horas ? asignatura.horas.toString() : '0'
        });

        setShowEditDialog(true);
    };

    const handleEditAsignatura = async () => {
        if (!selectedAsignatura || !selectedAsignatura.id) return;

        // Validaciones
        if (!asignaturaForm.codigo.trim()) {
            toast.error('El código es obligatorio');
            return;
        }

        if (!asignaturaForm.nombre.trim()) {
            toast.error('El nombre es obligatorio');
            return;
        }

        if (!asignaturaForm.creditos || Number(asignaturaForm.creditos) < 1) {
            toast.error('Los créditos deben ser mayor a 0');
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
                horas: Number(asignaturaForm.horas) || 0
            });

            await loadAsignaturas();
            setShowEditDialog(false);
            setSelectedAsignatura(null);
            resetForm();

            toast.info('Asignatura actualizada correctamente');
        } catch (error) {
            toast.error(`Error al actualizar asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

            toast.error('Asignatura eliminada correctamente');
        } catch (error) {
            toast.error(`Error al eliminar asignatura: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
            horas: ''
        });
    };

    // ==================== FILTROS ====================

    const filteredAsignaturas = asignaturas.filter(asignatura => {
        // Búsqueda por texto
        const matchSearch =
            asignatura.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase());

        return matchSearch;
    });

    return {
        searchTerm, setSearchTerm,
        loading,
        asignaturas,
        programas,
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
        filteredAsignaturas
    };
}
