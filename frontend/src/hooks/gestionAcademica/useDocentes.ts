import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { db } from '../../services/database';
import type { Facultad, Asignatura } from '../../models/models';

// Interfaz extendida para Docente
export interface DocenteExtendido {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
    especialidad?: string;
    facultades: string[]; // IDs de facultades
    asignaturas: string[]; // IDs de asignaturas
    estado: 'activo' | 'inactivo' | 'licencia';
    fechaCreacion: string;
}

export function useDocentes() {
    const { notification, showNotification } = useNotification();
    const [searchTerm, setSearchTerm] = useState('');

    // Estados de datos
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
    const [docentes, setDocentes] = useState<DocenteExtendido[]>([]);

    // Filtros
    const [selectedFacultad, setSelectedFacultad] = useState<string>('all');
    const [selectedEstado, setSelectedEstado] = useState<string>('all');

    // Modales
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showDetallesDialog, setShowDetallesDialog] = useState(false);

    // Formulario
    const [docenteForm, setDocenteForm] = useState({
        nombre: '',
        email: '',
        telefono: '',
        especialidad: '',
        estado: 'activo' as 'activo' | 'inactivo' | 'licencia'
    });

    // Facultades y asignaturas seleccionadas
    const [facultadesSeleccionadas, setFacultadesSeleccionadas] = useState<string[]>([]);
    const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<string[]>([]);
    const [facultadActual, setFacultadActual] = useState<string>('');
    const [asignaturaActual, setAsignaturaActual] = useState<string>('');

    const [selectedDocente, setSelectedDocente] = useState<DocenteExtendido | null>(null);

    // Cargar datos
    useEffect(() => {
        loadFacultades();
        loadAsignaturas();
        loadDocentes();
    }, []);

    const loadFacultades = () => {
        setFacultades(db.getFacultades());
    };

    const loadAsignaturas = () => {
        setAsignaturas(db.getAsignaturas());
    };

    const loadDocentes = () => {
        const docentesData = db.getDocentes();
        // Mapear los docentes de la DB a DocenteExtendido si es necesario,
        // o asumir que db.getDocentes() ya devuelve la estructura correcta.
        // Por ahora asumimos que db.getDocentes() devuelve algo compatible o lo adaptamos.
        // Si db.getDocentes() devuelve Docente[], y DocenteExtendido tiene campos extra,
        // aquí deberíamos asegurarnos de que coincidan.
        // Dado el código original, parece que db.getDocentes() devuelve lo que se espera.
        setDocentes(docentesData as unknown as DocenteExtendido[]);
    };

    // Obtener nombre de entidades
    const getFacultadNombre = (facultadId: string) => {
        const facultad = facultades.find(f => f.id === facultadId);
        return facultad?.nombre || 'Sin facultad';
    };

    const getAsignaturaNombre = (asignaturaId: string) => {
        const asignatura = asignaturas.find(a => a.id === asignaturaId);
        return asignatura?.nombre || 'Sin asignatura';
    };

    // Estados del docente
    const estadosDocente = [
        { value: 'activo', label: 'Activo', color: 'bg-green-100 text-green-800' },
        { value: 'inactivo', label: 'Inactivo', color: 'bg-red-100 text-red-800' },
        { value: 'licencia', label: 'En Licencia', color: 'bg-yellow-100 text-yellow-800' }
    ];

    const getEstadoColor = (estado: string) => {
        const estadoObj = estadosDocente.find(e => e.value === estado);
        return estadoObj?.color || 'bg-gray-100 text-gray-800';
    };

    const getEstadoLabel = (estado: string) => {
        const estadoObj = estadosDocente.find(e => e.value === estado);
        return estadoObj?.label || estado;
    };

    // ==================== FACULTADES ====================

    const agregarFacultad = () => {
        if (!facultadActual) {
            showNotification('Debe seleccionar una facultad', 'error');
            return;
        }

        if (facultadesSeleccionadas.includes(facultadActual)) {
            showNotification('Esta facultad ya ha sido agregada', 'warning');
            return;
        }

        setFacultadesSeleccionadas(prev => [...prev, facultadActual]);
        setFacultadActual('');
        showNotification('✅ Facultad agregada correctamente', 'success');
    };

    const eliminarFacultad = (facultadId: string) => {
        setFacultadesSeleccionadas(prev => prev.filter(f => f !== facultadId));
        showNotification('Facultad eliminada', 'info');
    };

    // ==================== ASIGNATURAS ====================

    const agregarAsignatura = () => {
        if (!asignaturaActual) {
            showNotification('Debe seleccionar una asignatura', 'error');
            return;
        }

        if (asignaturasSeleccionadas.includes(asignaturaActual)) {
            showNotification('Esta asignatura ya ha sido agregada', 'warning');
            return;
        }

        setAsignaturasSeleccionadas(prev => [...prev, asignaturaActual]);
        setAsignaturaActual('');
        showNotification('✅ Asignatura agregada correctamente', 'success');
    };

    const eliminarAsignatura = (asignaturaId: string) => {
        setAsignaturasSeleccionadas(prev => prev.filter(a => a !== asignaturaId));
        showNotification('Asignatura eliminada', 'info');
    };

    // ==================== CREAR DOCENTE ====================

    const handleCreateDocente = () => {
        // Validaciones
        if (!docenteForm.nombre.trim()) {
            showNotification('El nombre es obligatorio', 'error');
            return;
        }

        if (!docenteForm.email.trim()) {
            showNotification('El email es obligatorio', 'error');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(docenteForm.email)) {
            showNotification('El email no tiene un formato válido', 'error');
            return;
        }

        if (facultadesSeleccionadas.length === 0) {
            showNotification('Debe seleccionar al menos una facultad', 'error');
            return;
        }

        if (asignaturasSeleccionadas.length === 0) {
            showNotification('Debe seleccionar al menos una asignatura', 'error');
            return;
        }

        // Crear docente
        const newDocente: DocenteExtendido = {
            id: `DOC-${Date.now()}`,
            nombre: docenteForm.nombre.trim(),
            email: docenteForm.email.trim(),
            telefono: docenteForm.telefono.trim(),
            especialidad: docenteForm.especialidad.trim(),
            facultades: facultadesSeleccionadas,
            asignaturas: asignaturasSeleccionadas,
            estado: docenteForm.estado,
            fechaCreacion: new Date().toISOString()
        };

        db.createDocente(newDocente);

        // Actualizar lista
        loadDocentes();

        // Limpiar formulario
        resetForm();
        setShowCreateDialog(false);

        showNotification('✅ Docente registrado exitosamente', 'success');
    };

    // ==================== EDITAR DOCENTE ====================

    const openEditDialog = (docente: DocenteExtendido) => {
        setSelectedDocente(docente);
        setDocenteForm({
            nombre: docente.nombre,
            email: docente.email,
            telefono: docente.telefono || '',
            especialidad: docente.especialidad || '',
            estado: docente.estado
        });
        setFacultadesSeleccionadas(docente.facultades);
        setAsignaturasSeleccionadas(docente.asignaturas);
        setShowEditDialog(true);
    };

    const handleEditDocente = () => {
        if (!selectedDocente) return;

        // Validaciones
        if (!docenteForm.nombre.trim()) {
            showNotification('El nombre es obligatorio', 'error');
            return;
        }

        if (!docenteForm.email.trim()) {
            showNotification('El email es obligatorio', 'error');
            return;
        }

        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(docenteForm.email)) {
            showNotification('El email no tiene un formato válido', 'error');
            return;
        }

        if (facultadesSeleccionadas.length === 0) {
            showNotification('Debe seleccionar al menos una facultad', 'error');
            return;
        }

        if (asignaturasSeleccionadas.length === 0) {
            showNotification('Debe seleccionar al menos una asignatura', 'error');
            return;
        }

        // Actualizar docente
        const updatedDocente: DocenteExtendido = {
            ...selectedDocente,
            nombre: docenteForm.nombre.trim(),
            email: docenteForm.email.trim(),
            telefono: docenteForm.telefono.trim(),
            especialidad: docenteForm.especialidad.trim(),
            facultades: facultadesSeleccionadas,
            asignaturas: asignaturasSeleccionadas,
            estado: docenteForm.estado
        };

        db.updateDocente(selectedDocente.id, updatedDocente);

        // Actualizar lista
        loadDocentes();

        // Cerrar modal
        setShowEditDialog(false);
        resetForm();
        setSelectedDocente(null);

        showNotification('✅ Docente actualizado correctamente', 'success');
    };

    // ==================== ELIMINAR DOCENTE ====================

    const openDeleteDialog = (docente: DocenteExtendido) => {
        setSelectedDocente(docente);
        setShowDeleteDialog(true);
    };

    const handleDeleteDocente = () => {
        if (!selectedDocente) return;

        db.deleteDocente(selectedDocente.id);

        // Actualizar lista
        loadDocentes();

        // Cerrar modal
        setShowDeleteDialog(false);
        setSelectedDocente(null);

        showNotification('✅ Docente eliminado correctamente', 'success');
    };

    // ==================== VER DETALLES ====================

    const openDetallesDialog = (docente: DocenteExtendido) => {
        setSelectedDocente(docente);
        setShowDetallesDialog(true);
    };

    // ==================== UTILIDADES ====================

    const resetForm = () => {
        setDocenteForm({
            nombre: '',
            email: '',
            telefono: '',
            especialidad: '',
            estado: 'activo'
        });
        setFacultadesSeleccionadas([]);
        setAsignaturasSeleccionadas([]);
        setFacultadActual('');
        setAsignaturaActual('');
    };

    const openCreateDialog = () => {
        resetForm();
        setShowCreateDialog(true);
    };

    // ==================== FILTROS ====================

    const docentesFiltrados = docentes.filter(docente => {
        const matchSearch = docente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            docente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            docente.especialidad?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchFacultad = selectedFacultad === 'all' ||
            docente.facultades.includes(selectedFacultad);

        const matchEstado = selectedEstado === 'all' || docente.estado === selectedEstado;

        return matchSearch && matchFacultad && matchEstado;
    });

    return {
        searchTerm, setSearchTerm,
        facultades,
        asignaturas,
        docentes,
        selectedFacultad, setSelectedFacultad,
        selectedEstado, setSelectedEstado,
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showDeleteDialog, setShowDeleteDialog,
        showDetallesDialog, setShowDetallesDialog,
        docenteForm, setDocenteForm,
        facultadesSeleccionadas, setFacultadesSeleccionadas,
        asignaturasSeleccionadas, setAsignaturasSeleccionadas,
        facultadActual, setFacultadActual,
        asignaturaActual, setAsignaturaActual,
        selectedDocente, setSelectedDocente,
        getFacultadNombre,
        getAsignaturaNombre,
        getEstadoColor,
        getEstadoLabel,
        estadosDocente,
        agregarFacultad,
        eliminarFacultad,
        agregarAsignatura,
        eliminarAsignatura,
        handleCreateDocente,
        openEditDialog,
        handleEditDocente,
        openDeleteDialog,
        handleDeleteDocente,
        openDetallesDialog,
        resetForm,
        openCreateDialog,
        docentesFiltrados,
        notification,
        showNotification
    };
}
