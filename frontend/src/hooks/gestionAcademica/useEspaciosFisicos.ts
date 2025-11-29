import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { espacioService, type EspacioFisico } from '../../services/espacios/espaciosAPI';
import { sedeService, type Sede } from '../../services/sedes/sedeAPI';

export function useEspaciosFisicos() {
    const { notification, showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState<string>('all');
    const [filterSede, setFilterSede] = useState<string>('all');

    // Estados de datos
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [loading, setLoading] = useState(false);

    // Modales
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    // Formulario
    const [espacioForm, setEspacioForm] = useState({
        codigo: '',
        nombre: '',
        tipo: '',
        capacidad: '',
        sede_id: '', // Store ID as string for Select compatibility
        piso: '',
        descripcion: '',
        estado: 'Disponible' as 'Disponible' | 'Mantenimiento' | 'No Disponible'
    });

    // Estado para recursos
    const [recursoSeleccionado, setRecursoSeleccionado] = useState('');
    const [recursosAgregados, setRecursosAgregados] = useState<string[]>([]);
    const [mostrandoRecursos, setMostrandoRecursos] = useState(true);

    const [selectedEspacio, setSelectedEspacio] = useState<EspacioFisico | null>(null);

    // Cargar datos
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [espaciosRes, sedesRes] = await Promise.all([
                espacioService.list(),
                sedeService.listarSedes()
            ]);

            const espaciosData = (espaciosRes as any).espacios || (Array.isArray(espaciosRes) ? espaciosRes : []);
            const sedesData = (sedesRes as any).sedes || (Array.isArray(sedesRes) ? sedesRes : []);

            setEspacios(espaciosData);
            setSedes(sedesData);
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

    // Tipos
    const tiposEspacio = ['Aula', 'Laboratorio', 'Auditorio', 'Sala', 'Cancha', 'Cubículo'];

    // Recursos disponibles
    const recursosDisponibles = [
        { nombre: 'Proyector', icon: '📽️' },
        { nombre: 'Micrófono', icon: '🎤' },
        { nombre: 'Sonido', icon: '🔊' },
        { nombre: 'Computadores', icon: '💻' },
        { nombre: 'Videoconferencia', icon: '📹' },
        { nombre: 'Pizarra Digital', icon: '📊' },
        { nombre: 'Aire Acondicionado', icon: '❄️' },
        { nombre: 'Sillas Adicionales', icon: '🪑' },
        { nombre: 'Mesas', icon: '🪑' },
        { nombre: 'Atril', icon: '📖' },
        { nombre: 'Pantalla Extra', icon: '🖥️' },
        { nombre: 'Internet', icon: '🌐' }
    ];

    // ==================== CREAR ESPACIO ====================

    const handleCreateEspacio = async () => {
        // Validaciones
        if (!espacioForm.codigo.trim()) {
            showNotification('El código es obligatorio', 'error');
            return;
        }
        if (!espacioForm.nombre.trim()) {
            showNotification('El nombre es obligatorio', 'error');
            return;
        }
        if (!espacioForm.tipo) {
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
        if (!espacioForm.piso.trim()) {
            showNotification('El piso es obligatorio', 'error');
            return;
        }

        try {
            await espacioService.create({
                codigo: espacioForm.codigo.trim(),
                nombre: espacioForm.nombre.trim(),
                tipo: espacioForm.tipo,
                capacidad: Number(espacioForm.capacidad),
                sede_id: Number(espacioForm.sede_id),
                piso: espacioForm.piso.trim(),
                recursos: recursosAgregados,
                estado: 'Disponible',
                descripcion: espacioForm.descripcion
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

    const openEditDialog = (espacio: EspacioFisico) => {
        setSelectedEspacio(espacio);
        setEspacioForm({
            codigo: espacio.codigo || '',
            nombre: espacio.nombre || '',
            tipo: espacio.tipo || '',
            capacidad: String(espacio.capacidad || ''),
            sede_id: String(espacio.sede_id || ''),
            piso: espacio.piso || '',
            descripcion: espacio.descripcion || '',
            estado: espacio.estado || 'Disponible'
        });
        setRecursosAgregados(espacio.recursos || []);
        // Si no hay recursos, mostrar el selector para agregar. Si hay, mostrar la lista.
        setMostrandoRecursos(!espacio.recursos || espacio.recursos.length === 0);
        setShowEditDialog(true);
    };

    const handleEditEspacio = async () => {
        if (!selectedEspacio) return;
        // Validaciones (mismas que crear)
        if (!espacioForm.codigo.trim()) {
            showNotification('El código es obligatorio', 'error');
            return;
        }
        if (!espacioForm.nombre.trim()) {
            showNotification('El nombre es obligatorio', 'error');
            return;
        }
        if (!espacioForm.tipo) {
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
        if (!espacioForm.piso.trim()) {
            showNotification('El piso es obligatorio', 'error');
            return;
        }

        try {
            await espacioService.update({
                id: selectedEspacio.id,
                codigo: espacioForm.codigo.trim(),
                nombre: espacioForm.nombre.trim(),
                tipo: espacioForm.tipo,
                capacidad: Number(espacioForm.capacidad),
                sede_id: Number(espacioForm.sede_id),
                piso: espacioForm.piso.trim(),
                recursos: recursosAgregados,
                descripcion: espacioForm.descripcion.trim(),
                estado: espacioForm.estado
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
            await espacioService.delete({ id: selectedEspacio.id });

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
            codigo: '',
            nombre: '',
            tipo: '',
            capacidad: '',
            sede_id: '',
            piso: '',
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

        const matchSearch =
            (espacio.codigo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (espacio.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (sedeNombre?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchTipo = filterTipo === 'all' || espacio.tipo === filterTipo;
        // Filter by sede_id if selected
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
        sedes, // Export sedes
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showDeleteDialog, setShowDeleteDialog,
        espacioForm, setEspacioForm,
        recursoSeleccionado, setRecursoSeleccionado,
        recursosAgregados, setRecursosAgregados,
        mostrandoRecursos, setMostrandoRecursos,
        selectedEspacio, setSelectedEspacio,
        tiposEspacio,
        recursosDisponibles,
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
