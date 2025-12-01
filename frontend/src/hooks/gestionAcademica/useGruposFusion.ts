import { useState } from 'react';
import { useNotification } from '../../share/notificationBanner';

export interface Grupo {
    id: string;
    codigo: string;
    programa: string;
    asignaturas: string[];
    estudiantes: number;
    estado: 'activo' | 'inactivo';
}

export interface GrupoFusionado {
    id: string;
    grupos: string[];
    asignaturaComun: string;
    espacioAsignado: string;
    estudiantesTotal: number;
    programas: string[];
}

export function useGruposFusion() {
    const { showNotification, notification } = useNotification();
    const [isFusionDialogOpen, setIsFusionDialogOpen] = useState(false);
    const [selectedGrupos, setSelectedGrupos] = useState<string[]>([]);
    const [asignaturaComun, setAsignaturaComun] = useState('');
    const [espacioAsignado, setEspacioAsignado] = useState('');

    const [grupos] = useState<Grupo[]>([
        { id: '1', codigo: 'INSI-A', programa: 'Ingeniería de Sistemas', asignaturas: ['Programación I', 'Cálculo I', 'Física I'], estudiantes: 35, estado: 'activo' },
        { id: '2', codigo: 'INSI-B', programa: 'Ingeniería de Sistemas', asignaturas: ['Programación I', 'Bases de Datos', 'Álgebra'], estudiantes: 32, estado: 'activo' },
        { id: '3', codigo: 'INCI-A', programa: 'Ingeniería Civil', asignaturas: ['Física I', 'Cálculo I', 'Estática'], estudiantes: 30, estado: 'activo' },
        { id: '4', codigo: 'ADEM-A', programa: 'Administración de Empresas', asignaturas: ['Matemáticas', 'Contabilidad', 'Marketing'], estudiantes: 28, estado: 'activo' },
        { id: '5', codigo: 'ADEM-B', programa: 'Administración de Empresas', asignaturas: ['Matemáticas', 'Economía', 'Estadística'], estudiantes: 25, estado: 'activo' }
    ]);

    const [gruposFusionados, setGruposFusionados] = useState<GrupoFusionado[]>([
        {
            id: 'f1',
            grupos: ['INSI-A', 'INCI-A'],
            asignaturaComun: 'Física I',
            espacioAsignado: 'Auditorio Central',
            estudiantesTotal: 65,
            programas: ['Ingeniería de Sistemas', 'Ingeniería Civil']
        }
    ]);

    const espacios = [
        { id: 'aud1', nombre: 'Auditorio Central', capacidad: 200 },
        { id: 'aud2', nombre: 'Auditorio Norte', capacidad: 150 },
        { id: 'lab1', nombre: 'Laboratorio 401', capacidad: 50 },
        { id: 'aula1', nombre: 'Aula Magna 501', capacidad: 100 }
    ];

    // Obtener asignaturas comunes entre grupos seleccionados
    const getAsignaturasComunes = () => {
        if (selectedGrupos.length < 2) return [];

        const gruposSeleccionados = grupos.filter(g => selectedGrupos.includes(g.id));
        const primerasAsignaturas = gruposSeleccionados[0].asignaturas;

        return primerasAsignaturas.filter(asignatura =>
            gruposSeleccionados.every(grupo => grupo.asignaturas.includes(asignatura))
        );
    };

    const asignaturasComunes = getAsignaturasComunes();

    // Calcular total de estudiantes
    const getTotalEstudiantes = () => {
        const gruposSeleccionados = grupos.filter(g => selectedGrupos.includes(g.id));
        return gruposSeleccionados.reduce((sum, g) => sum + g.estudiantes, 0);
    };

    const totalEstudiantes = getTotalEstudiantes();

    // Validar capacidad del espacio
    const validarCapacidad = () => {
        if (!espacioAsignado) return null;
        const espacio = espacios.find(e => e.id === espacioAsignado);
        if (!espacio) return null;

        return {
            suficiente: espacio.capacidad >= totalEstudiantes,
            capacidad: espacio.capacidad,
            diferencia: espacio.capacidad - totalEstudiantes
        };
    };

    const capacidadValidacion = validarCapacidad();

    // Validar conflictos de estado
    const validarEstadoGrupos = () => {
        const gruposSeleccionados = grupos.filter(g => selectedGrupos.includes(g.id));
        const todosActivos = gruposSeleccionados.every(g => g.estado === 'activo');
        const algunoInactivo = gruposSeleccionados.some(g => g.estado === 'inactivo');

        return { todosActivos, algunoInactivo };
    };

    const estadoValidacion = validarEstadoGrupos();

    const handleToggleGrupo = (grupoId: string) => {
        if (selectedGrupos.includes(grupoId)) {
            setSelectedGrupos(selectedGrupos.filter(id => id !== grupoId));
        } else {
            setSelectedGrupos([...selectedGrupos, grupoId]);
        }
        // Reset asignatura y espacio cuando cambian los grupos
        setAsignaturaComun('');
        setEspacioAsignado('');
    };

    const handleCrearFusion = () => {
        // Validaciones
        if (selectedGrupos.length < 2) {
            showNotification('Debe seleccionar al menos 2 grupos para fusionar', 'error');
            return;
        }

        if (!asignaturaComun) {
            showNotification('Debe seleccionar una asignatura común', 'error');
            return;
        }

        if (!espacioAsignado) {
            showNotification('Debe asignar un espacio físico', 'error');
            return;
        }

        if (capacidadValidacion && !capacidadValidacion.suficiente) {
            showNotification('El espacio seleccionado no tiene capacidad suficiente', 'error');
            return;
        }

        if (!estadoValidacion.todosActivos) {
            showNotification('No se pueden fusionar grupos inactivos', 'error');
            return;
        }

        // Crear fusión
        const gruposSeleccionados = grupos.filter(g => selectedGrupos.includes(g.id));
        const espacioSeleccionado = espacios.find(e => e.id === espacioAsignado);

        const nuevaFusion: GrupoFusionado = {
            id: `f${gruposFusionados.length + 1}`,
            grupos: gruposSeleccionados.map(g => g.codigo),
            asignaturaComun,
            espacioAsignado: espacioSeleccionado?.nombre || '',
            estudiantesTotal: totalEstudiantes,
            programas: [...new Set(gruposSeleccionados.map(g => g.programa))]
        };

        setGruposFusionados([...gruposFusionados, nuevaFusion]);
        showNotification('✅ Fusión de grupos creada exitosamente', 'success');

        // Reset
        setSelectedGrupos([]);
        setAsignaturaComun('');
        setEspacioAsignado('');
        setIsFusionDialogOpen(false);
    };

    const handleEliminarFusion = (fusionId: string) => {
        setGruposFusionados(gruposFusionados.filter(f => f.id !== fusionId));
        showNotification('Fusión eliminada exitosamente', 'success');
    };

    return {
        isFusionDialogOpen, setIsFusionDialogOpen,
        selectedGrupos, setSelectedGrupos,
        asignaturaComun, setAsignaturaComun,
        espacioAsignado, setEspacioAsignado,
        grupos,
        gruposFusionados,
        espacios,
        asignaturasComunes,
        totalEstudiantes,
        capacidadValidacion,
        estadoValidacion,
        handleToggleGrupo,
        handleCrearFusion,
        handleEliminarFusion,
        notification
    };
}
