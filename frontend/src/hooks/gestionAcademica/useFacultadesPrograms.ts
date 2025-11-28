import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { showNotification } from '../../context/ThemeContext';
import type { Facultad, Programa } from '../../models/index';

export type TabOption = 'sedes' | 'facultades' | 'programas' | 'asignaturas' | 'docentes' | 'grupos' | 'fusion' | 'espacios' | 'recursos';

export function useFacultadesPrograms() {
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<TabOption>('sedes');

    // Estados de datos
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);

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

    const loadFacultades = () => {
        const data = db.getFacultades();
        setFacultades(data);
    };

    const loadProgramas = () => {
        const data = db.getProgramas();
        setProgramas(data);
    };

    // Función para recargar todos los datos
    const reloadAllData = () => {
        loadFacultades();
        loadProgramas();
        setReloadKey(prev => prev + 1); // Forzar recarga de componentes hijos
    };

    // ==================== FACULTADES ====================

    const handleCreateFacultad = () => {
        // Validación
        if (!facultadForm.nombre.trim()) {
            showNotification({ message: 'El nombre de la facultad es obligatorio', type: 'error' });
            return;
        }

        // Crear facultad
        db.createFacultad({
            codigo: `FAC-${Date.now().toString().slice(-4)}`,
            nombre: facultadForm.nombre.trim(),
            activa: true,
            fechaCreacion: new Date().toISOString()
        });

        // Actualizar lista
        loadFacultades();

        // Limpiar formulario y cerrar
        setFacultadForm({ nombre: '' });
        setShowCreateFacultad(false);

        // Mostrar notificación con animación
        showNotification({ message: '✅ Facultad registrada exitosamente', type: 'success' });
    };

    const handleEditFacultad = () => {
        if (!selectedFacultad) return;

        // Validación
        if (!facultadForm.nombre.trim()) {
            showNotification({ message: 'El nombre de la facultad es obligatorio', type: 'error' });
            return;
        }

        // Actualizar facultad
        db.updateFacultad(selectedFacultad.id, {
            nombre: facultadForm.nombre.trim()
        });

        // Actualizar lista
        loadFacultades();
        loadProgramas(); // Por si el nombre cambió en programas

        // Cerrar modal
        setShowEditFacultad(false);
        setSelectedFacultad(null);
        setFacultadForm({ nombre: '' });

        // Notificación
        showNotification({ message: '✅ Facultad actualizada correctamente', type: 'success' });
    };

    const handleDeleteFacultad = () => {
        if (!selectedFacultad) return;

        // Eliminar facultad (también elimina programas relacionados)
        db.deleteFacultad(selectedFacultad.id);

        // Actualizar listas
        loadFacultades();
        loadProgramas();

        // Cerrar modal
        setShowDeleteFacultad(false);
        setSelectedFacultad(null);

        // Notificación
        showNotification({ message: '✅ Facultad eliminada correctamente', type: 'success' });
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

    const toggleFacultadActiva = (facultad: Facultad) => {
        db.updateFacultad(facultad.id, {
            activa: !facultad.activa
        });
        loadFacultades();

        showNotification({ message: facultad.activa ? '✅ Facultad inactivada correctamente' : '✅ Facultad activada correctamente', type: 'success' });
    };

    // ==================== PROGRAMAS ====================

    const handleCreatePrograma = () => {
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

        // Crear programa (siempre activo)
        db.createPrograma({
            codigo: `PROG-${Date.now().toString().slice(-4)}`,
            nombre: programaForm.nombre.trim(),
            facultadId: programaForm.facultadId,
            modalidad: 'presencial',
            nivel: 'pregrado',
            semestres: Number(programaForm.semestres),
            activo: true, // Siempre activo al crear
            fechaCreacion: new Date().toISOString()
        });

        // Actualizar lista
        loadProgramas();

        // Limpiar y cerrar
        setProgramaForm({ nombre: '', facultadId: '', semestres: '' });
        setShowCreatePrograma(false);

        // Notificación
        showNotification({ message: '✅ Programa registrado exitosamente', type: 'success' });
    };

    const handleEditPrograma = () => {
        if (!selectedPrograma) return;

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

        // Actualizar programa
        db.updatePrograma(selectedPrograma.id, {
            nombre: programaForm.nombre.trim(),
            facultadId: programaForm.facultadId,
            semestres: Number(programaForm.semestres)
        });

        // Actualizar lista
        loadProgramas();

        // Cerrar modal
        setShowEditPrograma(false);
        setSelectedPrograma(null);
        setProgramaForm({ nombre: '', facultadId: '', semestres: '' });

        // Notificación
        showNotification({ message: '✅ Programa actualizado correctamente', type: 'success' });
    };

    const handleDeletePrograma = () => {
        if (!selectedPrograma) return;

        // Eliminar programa
        db.deletePrograma(selectedPrograma.id);

        // Actualizar lista
        loadProgramas();

        // Cerrar modal
        setShowDeletePrograma(false);
        setSelectedPrograma(null);

        // Notificación
        showNotification({ message: '✅ Programa eliminado correctamente', type: 'success' });
    };

    const openEditPrograma = (programa: Programa) => {
        setSelectedPrograma(programa);
        setProgramaForm({
            nombre: programa.nombre,
            facultadId: programa.facultadId,
            semestres: programa.semestres?.toString() || ''
        });
        setShowEditPrograma(true);
    };

    const openDeletePrograma = (programa: Programa) => {
        setSelectedPrograma(programa);
        setShowDeletePrograma(true);
    };

    const toggleProgramaActivo = (programa: Programa) => {
        db.updatePrograma(programa.id, {
            activo: !programa.activo
        });
        loadProgramas();

        showNotification({ message: programa.activo ? '✅ Programa inactivado correctamente' : '✅ Programa activado correctamente', type: 'success' });
    };

    // ==================== FILTROS ====================

    const filteredFacultades = facultades.filter(f =>
        f.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredProgramas = programas.filter(p => {
        const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchFacultad = selectedFacultadFilter === 'all' || p.facultadId === selectedFacultadFilter;
        return matchSearch && matchFacultad;
    });

    // Contar programas por facultad
    const getProgramasCount = (facultadId: string) => {
        return programas.filter(p => p.facultadId === facultadId).length;
    };

    // Obtener nombre de facultad
    const getFacultadNombre = (facultadId: string) => {
        const facultad = facultades.find(f => f.id === facultadId);
        return facultad?.nombre || 'Sin facultad';
    };

    return {
        searchTerm, setSearchTerm,
        activeTab, setActiveTab,
        facultades,
        programas,
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
        reloadAllData
    };
}
