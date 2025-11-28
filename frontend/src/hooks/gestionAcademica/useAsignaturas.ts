import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import type { Asignatura, Facultad, Programa, RecursoRequerido } from '../../models/index';

// Lista de recursos disponibles
export const RECURSOS_DISPONIBLES = [
    'Computadores',
    'Proyector',
    'Micrófono',
    'Software Especializado',
    'Laboratorio',
    'Internet',
    'Pizarra Digital',
    'Aire Acondicionado',
    'Videoconferencia',
    'Equipos Audiovisuales'
];

export const tiposAsignatura = [
    { value: 'teorica', label: 'Teórica' },
    { value: 'practica', label: 'Práctica' },
    { value: 'teorico-practica', label: 'Teórico-Práctica' }
];

export function useAsignaturas() {
    const [searchTerm, setSearchTerm] = useState('');

    // Estados de datos
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);

    // Filtros
    const [selectedFacultad, setSelectedFacultad] = useState<string>('all');
    const [selectedPrograma, setSelectedPrograma] = useState<string>('all');
    const [selectedSemestre, setSelectedSemestre] = useState<string>('all');

    // Modales
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showRecursosDialog, setShowRecursosDialog] = useState(false);

    // Formulario
    const [asignaturaForm, setAsignaturaForm] = useState({
        codigo: '',
        nombre: '',
        programaId: '',
        creditos: '',
        horasSemana: '',
        semestre: '',
        tipo: 'teorica' as 'teorica' | 'practica' | 'teorico-practica'
    });

    // Recursos seleccionados
    const [recursosSeleccionados, setRecursosSeleccionados] = useState<string[]>([]);
    const [recursoActual, setRecursoActual] = useState<string>('');

    const [selectedAsignatura, setSelectedAsignatura] = useState<Asignatura | null>(null);

    // Cargar datos
    useEffect(() => {
        loadFacultades();
        loadProgramas();
        loadAsignaturas();
    }, []);

    const loadFacultades = () => {
        setFacultades(db.getFacultades());
    };

    const loadProgramas = () => {
        setProgramas(db.getProgramas());
    };

    const loadAsignaturas = () => {
        setAsignaturas(db.getAsignaturas());
    };

    // Obtener programas filtrados por facultad
    const getProgramasByFacultad = (facultadId: string): Programa[] => {
        if (facultadId === 'all') return programas;
        return programas.filter(p => p.facultadId === facultadId);
    };

    // Obtener nombre de entidades
    const getProgramaNombre = (programaId: string) => {
        const programa = programas.find(p => p.id === programaId);
        return programa?.nombre || 'Sin programa';
    };

    const getFacultadNombre = (programaId: string) => {
        const programa = programas.find(p => p.id === programaId);
        if (!programa) return 'Sin facultad';
        const facultad = facultades.find(f => f.id === programa.facultadId);
        return facultad?.nombre || 'Sin facultad';
    };

    // ==================== RECURSOS ====================

    const agregarRecurso = () => {
        if (!recursoActual) {
            // Mostrar notificación: Debe seleccionar un recurso
            return;
        }

        if (recursosSeleccionados.includes(recursoActual)) {
            // Mostrar notificación: Este recurso ya ha sido agregado
            return;
        }

        setRecursosSeleccionados(prev => [...prev, recursoActual]);
        setRecursoActual('');

        // Mostrar notificación: Recurso agregado correctamente
    };

    const eliminarRecurso = (recurso: string) => {
        setRecursosSeleccionados(prev => prev.filter(r => r !== recurso));
        // Mostrar notificación: Recurso eliminado
    };

    // ==================== CREAR ASIGNATURA ====================

    const handleCreateAsignatura = () => {
        // Validaciones
        if (!asignaturaForm.codigo.trim()) {
            // Mostrar notificación: El código es obligatorio
            return;
        }

        if (!asignaturaForm.nombre.trim()) {
            // Mostrar notificación: El nombre es obligatorio
            return;
        }

        if (!asignaturaForm.programaId) {
            // Mostrar notificación: Debe seleccionar un programa
            return;
        }

        if (!asignaturaForm.creditos || Number(asignaturaForm.creditos) < 1) {
            // Mostrar notificación: Los créditos deben ser mayor a 0
            return;
        }

        if (!asignaturaForm.horasSemana || Number(asignaturaForm.horasSemana) < 1) {
            // Mostrar notificación: Las horas semanales deben ser mayor a 0
            return;
        }

        if (!asignaturaForm.semestre || Number(asignaturaForm.semestre) < 1) {
            // Mostrar notificación: El semestre debe ser mayor a 0
            return;
        }

        // Crear recursos requeridos
        const recursosRequeridos: RecursoRequerido[] = recursosSeleccionados.map(r => ({
            tipo: r,
            cantidad: 1,
            especificaciones: ''
        }));

        // Crear asignatura
        db.createAsignatura({
            codigo: asignaturaForm.codigo.trim(),
            nombre: asignaturaForm.nombre.trim(),
            programaId: asignaturaForm.programaId,
            creditos: Number(asignaturaForm.creditos),
            horasSemana: Number(asignaturaForm.horasSemana),
            semestre: Number(asignaturaForm.semestre),
            tipo: asignaturaForm.tipo,
            recursosRequeridos: recursosRequeridos.length > 0 ? recursosRequeridos : undefined,
            activa: true,
            fechaCreacion: new Date().toISOString()
        });

        // Actualizar lista
        loadAsignaturas();

        // Limpiar y cerrar
        resetForm();
        setShowCreateDialog(false);

        // Notificación
        // Mostrar notificación: Asignatura registrada exitosamente
    };

    // ==================== EDITAR ASIGNATURA ====================

    const openEditDialog = (asignatura: Asignatura) => {
        setSelectedAsignatura(asignatura);
        setAsignaturaForm({
            codigo: asignatura.codigo,
            nombre: asignatura.nombre,
            programaId: asignatura.programaId,
            creditos: asignatura.creditos.toString(),
            horasSemana: asignatura.horasSemana.toString(),
            semestre: asignatura.semestre.toString(),
            tipo: asignatura.tipo
        });

        // Cargar recursos seleccionados
        const recursos = asignatura.recursosRequeridos?.map(r => r.tipo) || [];
        setRecursosSeleccionados(recursos);

        setShowEditDialog(true);
    };

    const handleEditAsignatura = () => {
        if (!selectedAsignatura) return;

        // Validaciones (mismas que crear)
        if (!asignaturaForm.codigo.trim()) {
            // Mostrar notificación: El código es obligatorio
            return;
        }

        if (!asignaturaForm.nombre.trim()) {
            // Mostrar notificación: El nombre es obligatorio
            return;
        }

        if (!asignaturaForm.programaId) {
            // Mostrar notificación: Debe seleccionar un programa
            return;
        }

        if (!asignaturaForm.creditos || Number(asignaturaForm.creditos) < 1) {
            // Mostrar notificación: Los créditos deben ser mayor a 0
            return;
        }

        if (!asignaturaForm.horasSemana || Number(asignaturaForm.horasSemana) < 1) {
            // Mostrar notificación: Las horas semanales deben ser mayor a 0
            return;
        }

        if (!asignaturaForm.semestre || Number(asignaturaForm.semestre) < 1) {
            // Mostrar notificación: El semestre debe ser mayor a 0
            return;
        }

        // Crear recursos requeridos
        const recursosRequeridos: RecursoRequerido[] = recursosSeleccionados.map(r => ({
            tipo: r,
            cantidad: 1,
            especificaciones: ''
        }));

        // Actualizar
        db.updateAsignatura(selectedAsignatura.id, {
            codigo: asignaturaForm.codigo.trim(),
            nombre: asignaturaForm.nombre.trim(),
            programaId: asignaturaForm.programaId,
            creditos: Number(asignaturaForm.creditos),
            horasSemana: Number(asignaturaForm.horasSemana),
            semestre: Number(asignaturaForm.semestre),
            tipo: asignaturaForm.tipo,
            recursosRequeridos: recursosRequeridos.length > 0 ? recursosRequeridos : undefined
        });

        // Actualizar lista
        loadAsignaturas();

        // Cerrar y limpiar
        setShowEditDialog(false);
        setSelectedAsignatura(null);
        resetForm();

        // Notificación
        // Mostrar notificación: Asignatura actualizada correctamente
    };

    // ==================== ELIMINAR ASIGNATURA ====================

    const openDeleteDialog = (asignatura: Asignatura) => {
        setSelectedAsignatura(asignatura);
        setShowDeleteDialog(true);
    };

    const handleDeleteAsignatura = () => {
        if (!selectedAsignatura) return;

        // Eliminar
        db.deleteAsignatura(selectedAsignatura.id);

        // Actualizar lista
        loadAsignaturas();

        // Cerrar
        setShowDeleteDialog(false);
        setSelectedAsignatura(null);

        // Notificación
        // Mostrar notificación: Asignatura eliminada correctamente
    };

    // ==================== UTILIDADES ====================

    const resetForm = () => {
        setAsignaturaForm({
            codigo: '',
            nombre: '',
            programaId: '',
            creditos: '',
            horasSemana: '',
            semestre: '',
            tipo: 'teorica'
        });
        setRecursosSeleccionados([]);
    };

    // ==================== FILTROS ====================

    const filteredAsignaturas = asignaturas.filter(asignatura => {
        // Búsqueda por texto
        const matchSearch =
            asignatura.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase());

        // Filtro por programa
        const matchPrograma = selectedPrograma === 'all' || asignatura.programaId === selectedPrograma;

        // Filtro por facultad (indirecto a través de programa)
        let matchFacultad = true;
        if (selectedFacultad !== 'all') {
            const programa = programas.find(p => p.id === asignatura.programaId);
            matchFacultad = programa?.facultadId === selectedFacultad;
        }

        // Filtro por semestre
        const matchSemestre = selectedSemestre === 'all' || asignatura.semestre.toString() === selectedSemestre;

        return matchSearch && matchPrograma && matchFacultad && matchSemestre;
    });

    // Obtener semestres del programa seleccionado
    const getSemestresDisponibles = () => {
        if (selectedPrograma === 'all') {
            // Si no hay programa seleccionado, mostrar todos los semestres de todas las asignaturas
            return Array.from(new Set(asignaturas.map(a => a.semestre))).sort((a, b) => a - b);
        }

        // Si hay un programa seleccionado, obtener su número de semestres
        const programa = programas.find(p => p.id === selectedPrograma);
        if (programa && programa.semestres) {
            // Retornar un array del 1 al número de semestres del programa
            return Array.from({ length: programa.semestres }, (_, i) => i + 1);
        }

        return [];
    };

    const semestresDisponibles = getSemestresDisponibles();

    return {
        searchTerm, setSearchTerm,
        facultades,
        programas,
        asignaturas,
        selectedFacultad, setSelectedFacultad,
        selectedPrograma, setSelectedPrograma,
        selectedSemestre, setSelectedSemestre,
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showDeleteDialog, setShowDeleteDialog,
        showRecursosDialog, setShowRecursosDialog,
        asignaturaForm, setAsignaturaForm,
        recursosSeleccionados, setRecursosSeleccionados,
        recursoActual, setRecursoActual,
        selectedAsignatura, setSelectedAsignatura,
        getProgramasByFacultad,
        getProgramaNombre,
        getFacultadNombre,
        agregarRecurso,
        eliminarRecurso,
        handleCreateAsignatura,
        openEditDialog,
        handleEditAsignatura,
        openDeleteDialog,
        handleDeleteAsignatura,
        resetForm,
        filteredAsignaturas,
        semestresDisponibles
    };
}
