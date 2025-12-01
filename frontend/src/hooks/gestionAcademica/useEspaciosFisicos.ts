import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { espacioService, type EspacioFisico } from '../../services/espacios/espaciosAPI';
import { sedeService, type Sede } from '../../services/sedes/sedeAPI';
import { recursoService, type Recurso } from '../../services/recursos/recursoAPI';
import { tipoEspacioService, type TipoEspacio } from '../../services/espacios/tipoEspacioAPI';

export function useEspaciosFisicos() {
    const { notification, showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState<string>('all');
    const [filterSede, setFilterSede] = useState<string>('all');

    // Estados de datos
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [tiposEspacio, setTiposEspacio] = useState<TipoEspacio[]>([]);
    const [recursosDisponibles, setRecursosDisponibles] = useState<Recurso[]>([]);
    const [loading, setLoading] = useState(false);

    // Modales
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Formulario
    const [espacioForm, setEspacioForm] = useState({
        nombre: '',
        tipo_id: '',
        capacidad: '',
        sede_id: '',
        ubicacion: '',
        descripcion: '',
        estado: 'Disponible' as 'Disponible' | 'Mantenimiento' | 'No Disponible'
    });

    // Estado para recursos
    const [recursoSeleccionado, setRecursoSeleccionado] = useState('');
    const [recursosAgregados, setRecursosAgregados] = useState<Recurso[]>([]);
    const [mostrandoRecursos, setMostrandoRecursos] = useState(true);

    const [selectedEspacio, setSelectedEspacio] = useState<EspacioFisico | null>(null);

    // Cargar datos
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [espaciosRes, sedesRes, tiposRes, recursosRes] = await Promise.all([
                espacioService.list(),
                sedeService.listarSedes(),
                tipoEspacioService.listarTiposEspacio(),
                recursoService.listarRecursos()
            ]);

            const espaciosData = (espaciosRes as any).espacios || (Array.isArray(espaciosRes) ? espaciosRes : []);
            const sedesData = (sedesRes as any).sedes || (Array.isArray(sedesRes) ? sedesRes : []);
            const tiposData = (tiposRes as any).tipos_espacio || (Array.isArray(tiposRes) ? tiposRes : []);
            const recursosData = (recursosRes as any).recursos || (Array.isArray(recursosRes) ? recursosRes : []);

            setEspacios(espaciosData);
            setSedes(sedesData);
            setTiposEspacio(tiposData);
            setRecursosDisponibles(recursosData);
        } catch (error) {
            console.error('Error loading data:', error);
            showNotification('Error al cargar los datos', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadEspacios = async () => {
        try {
            const response = await espacioService.list();
            const data = (response as any).espacios || (Array.isArray(response) ? response : []);
            setEspacios(data);
        } catch (error) {
            console.error('Error loading espacios:', error);
        }
    };

    // ==================== CREAR ESPACIO ====================

    const handleCreateEspacio = async () => {
        // Validaciones
        if (!espacioForm.nombre.trim()) {
            showNotification('El nombre es obligatorio', 'error');
            return;
        }
        if (!espacioForm.tipo_id) {
            showNotification('Debe seleccionar un tipo', 'error');
            return;
        }
        if (!espacioForm.capacidad || Number(espacioForm.capacidad) < 1) {
            showNotification('La capacidad debe ser mayor a 0', 'error');
            return;
        }
        if (!espacioForm.sede_id) {
            showNotification('Debe seleccionar una sede', 'error');
            return;
        }
        if (!espacioForm.ubicacion.trim()) {
            showNotification('La ubicación es obligatoria', 'error');
            return;
        }

        try {
            // Preparar recursos para el payload
            const recursosPayload = recursosAgregados.map(r => ({
                id: r.id!,
                estado: 'disponible' // Estado por defecto al crear
            }));

            // 1. Crear el espacio con recursos
            await espacioService.create({
                nombre: espacioForm.nombre.trim(),
                tipo_id: Number(espacioForm.tipo_id),
                capacidad: Number(espacioForm.capacidad),
                sede_id: Number(espacioForm.sede_id),
                ubicacion: espacioForm.ubicacion.trim(),
                estado: 'Disponible',
                descripcion: espacioForm.descripcion,
                recursos: recursosPayload
            });

            // Actualizar lista
            await loadEspacios();

            // Limpiar y cerrar
            resetForm();
            setShowCreateDialog(false);

            // Notificación
            showNotification('✅ Registro guardado exitosamente', 'success');
        } catch (error) {
            console.error('Error creating espacio:', error);
            showNotification('Error al crear el espacio', 'error');
        }
    };

    // ==================== EDITAR ESPACIO ====================

    const openEditDialog = async (espacio: EspacioFisico) => {
        setSelectedEspacio(espacio);
        setEspacioForm({
            nombre: espacio.nombre || '',
            tipo_id: String(espacio.tipo_id || ''),
            capacidad: String(espacio.capacidad || ''),
            sede_id: String(espacio.sede_id || ''),
            ubicacion: espacio.ubicacion || '',
            descripcion: espacio.descripcion || '',
            estado: espacio.estado || 'Disponible'
        });

        // Cargar recursos del espacio (ya vienen en el objeto espacio desde el listado)
        if (espacio.recursos) {
            const mappedRecursos = espacio.recursos.map(r => ({
                id: r.id,
                nombre: r.nombre,
                descripcion: ''
            }));
            setRecursosAgregados(mappedRecursos);
            setMostrandoRecursos(mappedRecursos.length === 0);
        } else {
            setRecursosAgregados([]);
            setMostrandoRecursos(true);
        }

        setShowEditDialog(true);
    };

    const handleEditEspacio = async () => {
        if (!selectedEspacio) return;
        // Validaciones
        if (!espacioForm.nombre.trim()) {
            showNotification('El nombre es obligatorio', 'error');
            return;
        }
        if (!espacioForm.tipo_id) {
            showNotification('Debe seleccionar un tipo', 'error');
            return;
        }
        if (!espacioForm.capacidad || Number(espacioForm.capacidad) < 1) {
            showNotification('La capacidad debe ser mayor a 0', 'error');
            return;
        }
        if (!espacioForm.sede_id) {
            showNotification('Debe seleccionar una sede', 'error');
            return;
        }
        if (!espacioForm.ubicacion.trim()) {
            showNotification('La ubicación es obligatoria', 'error');
            return;
        }

        try {
            // Preparar recursos para el payload
            const recursosPayload = recursosAgregados.map(r => ({
                id: r.id!,
                estado: 'disponible'
            }));

            // 1. Actualizar espacio con recursos
            await espacioService.update({
                id: selectedEspacio.id!,
                nombre: espacioForm.nombre.trim(),
                tipo_id: Number(espacioForm.tipo_id),
                capacidad: Number(espacioForm.capacidad),
                sede_id: Number(espacioForm.sede_id),
                ubicacion: espacioForm.ubicacion.trim(),
                descripcion: espacioForm.descripcion.trim(),
                estado: espacioForm.estado,
                recursos: recursosPayload
            });

            // Actualizar lista
            await loadEspacios();

            // Cerrar y limpiar
            setShowEditDialog(false);
            setSelectedEspacio(null);
            resetForm();

            // Notificación
            showNotification('✅ Actualización exitosa', 'success');
        } catch (error) {
            console.error('Error updating espacio:', error);
            showNotification('Error al actualizar el espacio', 'error');
        }
    };

    // ==================== ELIMINAR ESPACIO ====================

    const openDeleteDialog = (espacio: EspacioFisico) => {
        setSelectedEspacio(espacio);
        setShowDeleteDialog(true);
    };

    const handleDeleteEspacio = async () => {
        if (!selectedEspacio) return;

        try {
            await espacioService.delete({ id: selectedEspacio.id! });

            // Actualizar lista
            await loadEspacios();

            // Cerrar
            setShowDeleteDialog(false);
            setSelectedEspacio(null);

            showNotification('✅ Espacio eliminado correctamente', 'success');
        } catch (error) {
            console.error('Error deleting espacio:', error);
            showNotification('Error al eliminar el espacio', 'error');
        }
    };

    // ==================== UTILIDADES ====================

    const resetForm = () => {
        setEspacioForm({
            nombre: '',
            tipo_id: '',
            capacidad: '',
            sede_id: '',
            ubicacion: '',
            descripcion: '',
            estado: 'Disponible'
        });
        setRecursosAgregados([]);
        setRecursoSeleccionado('');
        setMostrandoRecursos(true);
    };

    // ==================== FILTROS ====================

    const filteredEspacios = espacios.filter(espacio => {
        // Find sede name for search
        const sede = sedes.find(s => s.id === espacio.sede_id);
        const sedeNombre = sede ? sede.nombre : '';
        const tipoNombre = espacio.tipo_espacio?.nombre || '';

        const matchSearch =
            (espacio.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (sedeNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (tipoNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchTipo = filterTipo === 'all' || espacio.tipo_id.toString() === filterTipo;
        const matchSede = filterSede === 'all' || espacio.sede_id.toString() === filterSede;

        return matchSearch && matchTipo && matchSede;
    });

    // Badge de estado
    const getEstadoBadge = (estado: string) => {
        switch (estado) {
            case 'Disponible':
                return { className: "bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400", label: "Disponible" };
            case 'Mantenimiento':
                return { className: "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400", label: "Mantenimiento" };
            case 'No Disponible':
                return { className: "bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400", label: "No Disponible" };
            default:
                return { className: "variant='outline'", label: "Desconocido" };
        }
    };

    return {
        searchTerm, setSearchTerm,
        filterTipo, setFilterTipo,
        filterSede, setFilterSede,
        espacios,
        sedes,
        tiposEspacio,
        recursosDisponibles,
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showDeleteDialog, setShowDeleteDialog,
        espacioForm, setEspacioForm,
        recursoSeleccionado, setRecursoSeleccionado,
        recursosAgregados, setRecursosAgregados,
        mostrandoRecursos, setMostrandoRecursos,
        selectedEspacio, setSelectedEspacio,
        handleCreateEspacio,
        openEditDialog,
        handleEditEspacio,
        openDeleteDialog,
        handleDeleteEspacio,
        resetForm,
        filteredEspacios,
        getEstadoBadge,
        notification,
        showNotification,
        loadEspacios
    };
}
