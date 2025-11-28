import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { useNotification } from '../../share/notificationBanner';
import type { Facultad, Programa, Asignatura, EspacioFisico, Docente } from '../../models/index';

export interface AsignaturaHorario {
    id: string;
    asignaturaId: string;
    asignaturaNombre: string;
    dia: string;
    horaInicio: string;
    horaFin: string;
    docente: string;
    espacioId: string;
    espacioNombre: string;
}

export interface HorarioCompleto {
    id: string;
    grupoNombre: string; // ej: "1A", "1B"
    facultadId: string;
    programaId: string;
    semestre: number;
    periodo: string; // fijo "2025-1"
    asignaturas: AsignaturaHorario[];
    fechaCreacion: string;
}

export const PERIODO_FIJO = '2025-1';
export const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function useHorariosAcademicos() {
    const { notification, showNotification } = useNotification();

    // Estados de datos desde BD
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);

    // Filtros en cascada
    const [facultadSeleccionada, setFacultadSeleccionada] = useState<string>('');
    const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
    const [semestreSeleccionado, setSemestreSeleccionado] = useState<string>('');
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('');

    // Horarios
    const [horarios, setHorarios] = useState<HorarioCompleto[]>([]);
    const [horarioActual, setHorarioActual] = useState<HorarioCompleto | null>(null);

    // Modales
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showAddAsignaturaDialog, setShowAddAsignaturaDialog] = useState(false);

    // Estado para nueva asignatura
    const [nuevaAsignatura, setNuevaAsignatura] = useState({
        asignaturaId: '',
        dias: [] as string[],
        horaInicio: '',
        horaFin: '',
        docente: '',
        espacioId: ''
    });

    // Estado para nuevo horario
    const [nuevoHorarioForm, setNuevoHorarioForm] = useState({
        grupoNombre: '',
        facultadId: '',
        programaId: '',
        semestre: ''
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setFacultades(db.getFacultades());
        setProgramas(db.getProgramas());
        setAsignaturas(db.getAsignaturas());
        setEspacios(db.getEspacios());
        setDocentes(db.getDocentes());
        loadHorarios();
    };

    const loadHorarios = () => {
        const stored = localStorage.getItem('horariosCompletos');
        if (stored) {
            setHorarios(JSON.parse(stored));
        }
    };

    const saveHorarios = (newHorarios: HorarioCompleto[]) => {
        localStorage.setItem('horariosCompletos', JSON.stringify(newHorarios));
        setHorarios(newHorarios);
        window.dispatchEvent(new Event('horariosUpdated'));
    };

    // Generar grupos dinámicamente basados en el semestre seleccionado
    const generarGruposPorSemestre = (semestre: string): string[] => {
        if (!semestre) return [];
        const semestreNum = semestre;
        return [`${semestreNum}A`, `${semestreNum}B`, `${semestreNum}C`, `${semestreNum}D`];
    };

    const gruposDisponibles = generarGruposPorSemestre(semestreSeleccionado);
    const programasFiltrados = programas.filter(p => p.facultadId === facultadSeleccionada);
    const asignaturasFiltradas = asignaturas.filter(a => a.programaId === programaSeleccionado);
    const semestresDisponibles = [...new Set(asignaturasFiltradas.map(a => a.semestre))].sort((a, b) => a - b);
    const asignaturasDelSemestre = asignaturasFiltradas.filter(a => a.semestre === Number(semestreSeleccionado));

    const horarioAMostrar = horarios.find(h =>
        h.facultadId === facultadSeleccionada &&
        h.programaId === programaSeleccionado &&
        h.semestre === Number(semestreSeleccionado) &&
        h.grupoNombre === grupoSeleccionado
    );

    const mostrarHorario = !!(facultadSeleccionada && programaSeleccionado && semestreSeleccionado && grupoSeleccionado);

    const handleFacultadChange = (value: string) => {
        setFacultadSeleccionada(value);
        setProgramaSeleccionado('');
        setSemestreSeleccionado('');
        setGrupoSeleccionado('');
    };

    const handleProgramaChange = (value: string) => {
        setProgramaSeleccionado(value);
        setSemestreSeleccionado('');
        setGrupoSeleccionado('');
    };

    const handleSemestreChange = (value: string) => {
        setSemestreSeleccionado(value);
        setGrupoSeleccionado('');
    };

    const handleOpenCreateDialog = () => {
        setNuevoHorarioForm({
            grupoNombre: '',
            facultadId: '',
            programaId: '',
            semestre: ''
        });
        setShowCreateDialog(true);
    };

    const handleCreateHorario = () => {
        if (!nuevoHorarioForm.facultadId) {
            showNotification('Debe seleccionar una facultad', 'error');
            return;
        }
        if (!nuevoHorarioForm.programaId) {
            showNotification('Debe seleccionar un programa', 'error');
            return;
        }
        if (!nuevoHorarioForm.semestre) {
            showNotification('Debe seleccionar un semestre', 'error');
            return;
        }

        const gruposExistentes = horarios
            .filter(h =>
                h.facultadId === nuevoHorarioForm.facultadId &&
                h.programaId === nuevoHorarioForm.programaId &&
                h.semestre === Number(nuevoHorarioForm.semestre)
            )
            .map(h => h.grupoNombre);

        const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let nuevoGrupoNombre = '';

        for (let i = 0; i < letras.length; i++) {
            const grupoTemporal = `${nuevoHorarioForm.semestre}${letras[i]}`;
            if (!gruposExistentes.includes(grupoTemporal)) {
                nuevoGrupoNombre = grupoTemporal;
                break;
            }
        }

        if (!nuevoGrupoNombre) {
            showNotification('Se ha alcanzado el límite de grupos para este semestre', 'error');
            return;
        }

        const nuevoHorario: HorarioCompleto = {
            id: `horario-${Date.now()}`,
            grupoNombre: nuevoGrupoNombre,
            facultadId: nuevoHorarioForm.facultadId,
            programaId: nuevoHorarioForm.programaId,
            semestre: Number(nuevoHorarioForm.semestre),
            periodo: PERIODO_FIJO,
            asignaturas: [],
            fechaCreacion: new Date().toISOString()
        };

        const nuevosHorarios = [...horarios, nuevoHorario];
        saveHorarios(nuevosHorarios);
        setShowCreateDialog(false);

        showNotification(`✅ Horario creado: Grupo ${nuevoGrupoNombre}`, 'success');
    };

    const handleOpenDeleteDialog = () => {
        if (!horarioAMostrar) return;
        setHorarioActual(horarioAMostrar);
        setShowDeleteDialog(true);
    };

    const handleDeleteHorario = () => {
        if (!horarioActual) return;

        const nuevosHorarios = horarios.filter(h => h.id !== horarioActual.id);
        saveHorarios(nuevosHorarios);
        setShowDeleteDialog(false);
        setHorarioActual(null);

        showNotification('✅ Horario eliminado correctamente', 'success');
    };

    const handleOpenAddAsignatura = () => {
        if (!horarioAMostrar) return;
        setHorarioActual(horarioAMostrar);
        setNuevaAsignatura({
            asignaturaId: '',
            dias: [],
            horaInicio: '',
            horaFin: '',
            docente: '',
            espacioId: ''
        });
        setShowAddAsignaturaDialog(true);
    };

    const hayConflictoHorario = (inicio1: string, fin1: string, inicio2: string, fin2: string): boolean => {
        const i1 = parseInt(inicio1.replace(':', ''));
        const f1 = parseInt(fin1.replace(':', ''));
        const i2 = parseInt(inicio2.replace(':', ''));
        const f2 = parseInt(fin2.replace(':', ''));
        return i1 < f2 && f1 > i2;
    };

    const handleAddAsignatura = () => {
        if (!horarioActual) return;

        if (!nuevaAsignatura.asignaturaId) {
            showNotification('Debe seleccionar una asignatura', 'error');
            return;
        }
        if (nuevaAsignatura.dias.length === 0) {
            showNotification('Debe seleccionar al menos un día', 'error');
            return;
        }
        if (!nuevaAsignatura.horaInicio || !nuevaAsignatura.horaFin) {
            showNotification('Debe seleccionar hora de inicio y fin', 'error');
            return;
        }
        if (!nuevaAsignatura.docente.trim()) {
            showNotification('Debe ingresar el nombre del docente', 'error');
            return;
        }
        if (!nuevaAsignatura.espacioId) {
            showNotification('Debe seleccionar un espacio', 'error');
            return;
        }

        const [inicioH, inicioM] = nuevaAsignatura.horaInicio.split(':').map(Number);
        const [finH, finM] = nuevaAsignatura.horaFin.split(':').map(Number);
        const inicioMinutos = inicioH * 60 + inicioM;
        const finMinutos = finH * 60 + finM;

        if (finMinutos <= inicioMinutos && finH < 12) {
            // Es válido si cruza medianoche
        } else if (finMinutos <= inicioMinutos) {
            showNotification('La hora de fin debe ser posterior a la hora de inicio', 'error');
            return;
        }

        for (const dia of nuevaAsignatura.dias) {
            const conflictoGrupo = horarioActual.asignaturas.find(a =>
                a.dia === dia &&
                hayConflictoHorario(a.horaInicio, a.horaFin, nuevaAsignatura.horaInicio, nuevaAsignatura.horaFin)
            );

            if (conflictoGrupo) {
                showNotification(`Conflicto en ${dia}: El grupo ya tiene ${conflictoGrupo.asignaturaNombre} en este horario`, 'error');
                return;
            }

            const conflictoEspacio = horarios.some(h =>
                h.asignaturas.some(a =>
                    a.espacioId === nuevaAsignatura.espacioId &&
                    a.dia === dia &&
                    hayConflictoHorario(a.horaInicio, a.horaFin, nuevaAsignatura.horaInicio, nuevaAsignatura.horaFin)
                )
            );

            if (conflictoEspacio) {
                const espacio = espacios.find(e => e.id === nuevaAsignatura.espacioId);
                showNotification(`Conflicto en ${dia}: El espacio ${espacio?.nombre} ya está ocupado en este horario`, 'error');
                return;
            }
        }

        const asignatura = asignaturas.find(a => a.id === nuevaAsignatura.asignaturaId);
        const espacio = espacios.find(e => e.id === nuevaAsignatura.espacioId);

        const nuevasAsignaturas = nuevaAsignatura.dias.map(dia => ({
            id: `asig-horario-${Date.now()}-${dia}`,
            asignaturaId: nuevaAsignatura.asignaturaId,
            asignaturaNombre: asignatura?.nombre || '',
            dia: dia,
            horaInicio: nuevaAsignatura.horaInicio,
            horaFin: nuevaAsignatura.horaFin,
            docente: nuevaAsignatura.docente.trim(),
            espacioId: nuevaAsignatura.espacioId,
            espacioNombre: espacio?.nombre || ''
        }));

        const nuevosHorarios = horarios.map(h => {
            if (h.id === horarioActual.id) {
                return {
                    ...h,
                    asignaturas: [...h.asignaturas, ...nuevasAsignaturas]
                };
            }
            return h;
        });

        saveHorarios(nuevosHorarios);
        setShowAddAsignaturaDialog(false);

        showNotification(`✅ Asignatura agregada en ${nuevaAsignatura.dias.length} día(s)`, 'success');
    };

    const handleDeleteAsignatura = (asignaturaId: string) => {
        if (!horarioAMostrar) return;

        const nuevosHorarios = horarios.map(h => {
            if (h.id === horarioAMostrar.id) {
                return {
                    ...h,
                    asignaturas: h.asignaturas.filter(a => a.id !== asignaturaId)
                };
            }
            return h;
        });

        saveHorarios(nuevosHorarios);
        showNotification('✅ Asignatura eliminada del horario', 'success');
    };

    const generarFranjasHorarias = (asignaturas: AsignaturaHorario[]) => {
        if (asignaturas.length === 0) {
            const franjas: { inicio: number, texto: string }[] = [];
            for (let i = 6; i <= 21; i++) {
                franjas.push({
                    inicio: i,
                    texto: `${String(i).padStart(2, '0')}:00 - ${String(i + 1).padStart(2, '0')}:00`
                });
            }
            return franjas;
        }

        const horasSet = new Set<number>();

        asignaturas.forEach(asig => {
            const [horaInicioH] = asig.horaInicio.split(':').map(Number);
            const [horaFinH] = asig.horaFin.split(':').map(Number);

            horasSet.add(horaInicioH);

            let horaActual = horaInicioH + 1;
            const horaFinal = horaFinH;

            while (horaActual <= horaFinal) {
                horasSet.add(horaActual);
                horaActual++;
            }
        });

        const horasArray = Array.from(horasSet).sort((a, b) => a - b);

        const franjas: { inicio: number, texto: string }[] = [];
        for (let i = 0; i < horasArray.length - 1; i++) {
            const horaInicio = horasArray[i];
            const horaFin = horasArray[i + 1];

            franjas.push({
                inicio: horaInicio,
                texto: `${String(horaInicio).padStart(2, '0')}:00 - ${String(horaFin).padStart(2, '0')}:00`
            });
        }

        return franjas;
    };

    const asignaturaEnFranja = (asignatura: AsignaturaHorario, franja: { inicio: number, texto: string }): boolean => {
        const [asigHoraH] = asignatura.horaInicio.split(':').map(Number);
        return asigHoraH === franja.inicio;
    };

    const calcularFilasOcupadas = (asignatura: AsignaturaHorario, franjas: { inicio: number, texto: string }[]): number => {
        const [horaInicioH] = asignatura.horaInicio.split(':').map(Number);
        const [horaFinH] = asignatura.horaFin.split(':').map(Number);

        const duracionHoras = horaFinH - horaInicioH;
        return Math.max(1, duracionHoras);
    };

    const getHorarioGridData = () => {
        if (!horarioAMostrar) return null;

        const franjasHorarias = generarFranjasHorarias(horarioAMostrar.asignaturas);
        const celdasOcupadas = new Map<string, { asignatura: AsignaturaHorario, isStart: boolean }>();

        horarioAMostrar.asignaturas.forEach(asignatura => {
            const franjaInicio = franjasHorarias.findIndex(f => asignaturaEnFranja(asignatura, f));
            if (franjaInicio === -1) return;

            const filasOcupadas = calcularFilasOcupadas(asignatura, franjasHorarias);

            for (let i = 0; i < filasOcupadas && franjaInicio + i < franjasHorarias.length; i++) {
                const key = `${asignatura.dia}-${franjaInicio + i}`;
                celdasOcupadas.set(key, {
                    asignatura,
                    isStart: i === 0
                });
            }
        });

        return { franjasHorarias, celdasOcupadas };
    };

    return {
        facultades,
        programas,
        asignaturas,
        espacios,
        docentes,
        facultadSeleccionada, setFacultadSeleccionada,
        programaSeleccionado, setProgramaSeleccionado,
        semestreSeleccionado, setSemestreSeleccionado,
        grupoSeleccionado, setGrupoSeleccionado,
        horarios,
        horarioActual, setHorarioActual,
        showCreateDialog, setShowCreateDialog,
        showEditDialog, setShowEditDialog,
        showDeleteDialog, setShowDeleteDialog,
        showAddAsignaturaDialog, setShowAddAsignaturaDialog,
        nuevaAsignatura, setNuevaAsignatura,
        nuevoHorarioForm, setNuevoHorarioForm,
        gruposDisponibles,
        programasFiltrados,
        asignaturasFiltradas,
        semestresDisponibles,
        asignaturasDelSemestre,
        horarioAMostrar,
        mostrarHorario,
        handleFacultadChange,
        handleProgramaChange,
        handleSemestreChange,
        handleOpenCreateDialog,
        handleCreateHorario,
        handleOpenDeleteDialog,
        handleDeleteHorario,
        handleOpenAddAsignatura,
        handleAddAsignatura,
        handleDeleteAsignatura,
        getHorarioGridData,
        calcularFilasOcupadas, // Exported for use in component if needed, though getHorarioGridData handles most logic
        notification
    };
}
