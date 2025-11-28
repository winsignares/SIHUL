import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { db } from '../../services/database';
import type { EspacioFisico } from '../../models/models';
import { Badge } from '../../share/badge';

export function useEspaciosFisicos() {
    const { notification, showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState<string>('all');
    const [filterSede, setFilterSede] = useState<string>('all');

    // Estados de datos
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);

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
        sede: '',
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
        loadEspacios();
    }, []);

    const loadEspacios = () => {
        setEspacios(db.getEspacios());
    };

    // Tipos y Sedes
    const tiposEspacio = ['Aula', 'Laboratorio', 'Auditorio', 'Sala', 'Cancha', 'Cubículo'];
    const sedesDisponibles = ['Sede Norte', 'Sede Centro']; // Solo estas dos

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

    const handleCreateEspacio = () => {
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
        if (!espacioForm.sede) {
            showNotification('Debe seleccionar una sede', 'error');
            return;
        }
        if (!espacioForm.piso.trim()) {
            showNotification('El piso es obligatorio', 'error');
            return;
        }

        // Crear espacio
        const tipoValido: 'aula' | 'laboratorio' | 'auditorio' | 'sala' | 'otro' = tiposEspacio.includes(espacioForm.tipo) ? espacioForm.tipo as any : 'otro';
        db.createEspacio({
            codigo: espacioForm.codigo.trim(),
            nombre: espacioForm.nombre.trim(),
            tipo: tipoValido,
            capacidad: Number(espacioForm.capacidad),
            sede: espacioForm.sede,
            piso: espacioForm.piso.trim(),
            recursos: recursosAgregados,
            estado: 'Disponible', // Siempre disponible al crear
            fechaCreacion: new Date().toISOString()
        });

        // Actualizar lista
        loadEspacios();

        // Limpiar y cerrar
        resetForm();
        setShowCreateDialog(false);

        // Notificación
        showNotification('✅ Registro guardado exitosamente', 'success');
    };

    // ==================== EDITAR ESPACIO ====================

    const openEditDialog = (espacio: EspacioFisico) => {
        setSelectedEspacio(espacio);
        setEspacioForm({
            codigo: espacio.codigo,
            nombre: espacio.nombre,
            tipo: espacio.tipo,
            capacidad: espacio.capacidad.toString(),
            sede: espacio.sede,
            piso: espacio.piso || '',
            descripcion: espacio.descripcion || '',
            estado: espacio.estado
        });
        setRecursosAgregados(espacio.recursos || []);
        setMostrandoRecursos(false); // No mostrar selector al inicio en edición
        setShowEditDialog(true);
    };

    const handleEditEspacio = () => {
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
        if (!espacioForm.sede) {
            showNotification('Debe seleccionar una sede', 'error');
            return;
        }
        if (!espacioForm.piso.trim()) {
            showNotification('El piso es obligatorio', 'error');
            return;
        }

        // Actualizar
        const tipoValido: 'aula' | 'laboratorio' | 'auditorio' | 'sala' | 'otro' = tiposEspacio.includes(espacioForm.tipo) ? espacioForm.tipo as any : 'otro';
        db.updateEspacio(selectedEspacio.id, {
            codigo: espacioForm.codigo.trim(),
            nombre: espacioForm.nombre.trim(),
            tipo: tipoValido,
            capacidad: Number(espacioForm.capacidad),
            sede: espacioForm.sede,
            piso: espacioForm.piso.trim(),
            recursos: recursosAgregados,
            descripcion: espacioForm.descripcion.trim(),
            estado: espacioForm.estado
        });

        // Actualizar lista
        loadEspacios();

        // Cerrar y limpiar
        setShowEditDialog(false);
        setSelectedEspacio(null);
        resetForm();

        // Notificación
        showNotification('✅ Actualización exitosa', 'success');
    };

    // ==================== ELIMINAR ESPACIO ====================

    const openDeleteDialog = (espacio: EspacioFisico) => {
        setSelectedEspacio(espacio);
        setShowDeleteDialog(true);
    };

    const handleDeleteEspacio = () => {
        if (!selectedEspacio) return;

        // Eliminar
        db.deleteEspacio(selectedEspacio.id);

        // Actualizar lista
        loadEspacios();

        // Cerrar
        setShowDeleteDialog(false);
        setSelectedEspacio(null);

        showNotification('✅ Espacio eliminado correctamente', 'success');
    };

    // ==================== UTILIDADES ====================

    const resetForm = () => {
        setEspacioForm({
            codigo: '',
            nombre: '',
            tipo: '',
            capacidad: '',
            sede: '',
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
        const matchSearch =
            espacio.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            espacio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            espacio.sede.toLowerCase().includes(searchTerm.toLowerCase());

        const matchTipo = filterTipo === 'all' || espacio.tipo === filterTipo;
        const matchSede = filterSede === 'all' || espacio.sede === filterSede;

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
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showDeleteDialog, setShowDeleteDialog,
        espacioForm, setEspacioForm,
        recursoSeleccionado, setRecursoSeleccionado,
        recursosAgregados, setRecursosAgregados,
        mostrandoRecursos, setMostrandoRecursos,
        selectedEspacio, setSelectedEspacio,
        tiposEspacio,
        sedesDisponibles,
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
        loadEspacios,
        db
    };
}
