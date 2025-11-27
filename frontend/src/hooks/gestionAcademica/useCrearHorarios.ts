import { useState, useEffect } from 'react';
import { db } from '../../hooks/database';
import { useNotification } from '../../share/notificationBanner';
import type { Facultad, Programa, EspacioFisico, Grupo, Asignatura, Docente, HorarioAcademico } from '../../models/academica';

export interface GrupoSinHorario {
    id: string;
    nombre: string;
    programaId: string;
    programaNombre: string;
    semestre: number;
    facultadId: string;
}

export interface HorarioDia {
    dia: string;
    horaInicio: string;
    horaFin: string;
}

export interface CrearHorariosHookProps {
    onHorarioCreado?: () => void;
}

export function useCrearHorarios({ onHorarioCreado }: CrearHorariosHookProps = {}) {
    const { notification, showNotification } = useNotification();

    // Estados principales
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);

    // Filtros
    const [filtroFacultad, setFiltroFacultad] = useState<string>('all');
    const [filtroPrograma, setFiltroPrograma] = useState<string>('all');
    const [filtroSemestre, setFiltroSemestre] = useState<string>('all');
    const [filtroGrupo, setFiltroGrupo] = useState<string>('all');

    // Estados de la UI
    const [vistaActual, setVistaActual] = useState<'lista' | 'asignar'>('lista');
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoSinHorario | null>(null);
    const [horariosAsignados, setHorariosAsignados] = useState<HorarioAcademico[]>([]);

    // Modal de asignar asignatura
    const [showModalAsignar, setShowModalAsignar] = useState(false);
    const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<string>('');
    const [docenteSeleccionado, setDocenteSeleccionado] = useState<string>('');
    const [espacioSeleccionado, setEspacioSeleccionado] = useState<string>('');
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [horasPorDia, setHorasPorDia] = useState<{ [key: string]: { inicio: string; fin: string } }>({});

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        setFacultades(db.getFacultades());
        setProgramas(db.getProgramas());
        setGrupos(db.getGrupos());
        setEspacios(db.getEspacios());
        setAsignaturas(db.getAsignaturas());
        setDocentes(db.getDocentes());
    };

    // Obtener grupos sin horario
    const obtenerGruposSinHorario = (): GrupoSinHorario[] => {
        const todosLosHorarios = db.getHorarios();
        const gruposConHorario = new Set(todosLosHorarios.map(h => (h as any).grupoId));

        return grupos
            .filter(grupo => !gruposConHorario.has(grupo.id))
            .map(grupo => {
                const programa = programas.find(p => p.id === grupo.programaId);
                const facultad = facultades.find(f => f.id === programa?.facultadId);
                return {
                    id: grupo.id,
                    nombre: grupo.nombre,
                    programaId: grupo.programaId,
                    programaNombre: programa?.nombre || 'N/A',
                    semestre: grupo.semestre,
                    facultadId: programa?.facultadId || ''
                };
            });
    };

    // Filtrar grupos sin horario
    const gruposSinHorarioFiltrados = obtenerGruposSinHorario().filter(grupo => {
        const matchFacultad = filtroFacultad === 'all' || grupo.facultadId === filtroFacultad;
        const matchPrograma = filtroPrograma === 'all' || grupo.programaId === filtroPrograma;
        const matchSemestre = filtroSemestre === 'all' || (grupo.semestre && grupo.semestre.toString() === filtroSemestre);
        const matchGrupo = filtroGrupo === 'all' || (grupo.nombre && grupo.nombre.toLowerCase().includes(filtroGrupo.toLowerCase()));

        return matchFacultad && matchPrograma && matchSemestre && matchGrupo;
    });

    const programasFiltrados = programas.filter(p =>
        filtroFacultad === 'all' || p.facultadId === filtroFacultad
    );

    const limpiarFiltros = () => {
        setFiltroFacultad('all');
        setFiltroPrograma('all');
        setFiltroSemestre('all');
        setFiltroGrupo('all');
    };

    const handleAsignarHorario = (grupo: GrupoSinHorario) => {
        setGrupoSeleccionado(grupo);
        setHorariosAsignados([]);
        setVistaActual('asignar');
    };

    const handleVolverALista = () => {
        setVistaActual('lista');
        setGrupoSeleccionado(null);
        setHorariosAsignados([]);
    };

    const handleAbrirModalAsignar = () => {
        setShowModalAsignar(true);
        setAsignaturaSeleccionada('');
        setDocenteSeleccionado('');
        setEspacioSeleccionado('');
        setDiasSeleccionados([]);
        setHorasPorDia({});
    };

    const handleToggleDia = (dia: string) => {
        if (diasSeleccionados.includes(dia)) {
            setDiasSeleccionados(diasSeleccionados.filter(d => d !== dia));
            const newHoras = { ...horasPorDia };
            delete newHoras[dia];
            setHorasPorDia(newHoras);
        } else {
            setDiasSeleccionados([...diasSeleccionados, dia]);
            setHorasPorDia({ ...horasPorDia, [dia]: { inicio: '07:00', fin: '09:00' } });
        }
    };

    const handleHoraChange = (dia: string, tipo: 'inicio' | 'fin', valor: string) => {
        setHorasPorDia({
            ...horasPorDia,
            [dia]: {
                ...horasPorDia[dia],
                [tipo]: valor
            }
        });
    };

    // Validar conflictos
    const validarConflictos = (): { valido: boolean; mensaje: string } => {
        if (!asignaturaSeleccionada || !docenteSeleccionado || !espacioSeleccionado) {
            return { valido: false, mensaje: 'Todos los campos son obligatorios' };
        }

        if (diasSeleccionados.length === 0) {
            return { valido: false, mensaje: 'Debe seleccionar al menos un día' };
        }

        // Validar que todas las horas estén completas
        for (const dia of diasSeleccionados) {
            const horas = horasPorDia[dia];
            if (!horas || !horas.inicio || !horas.fin) {
                return { valido: false, mensaje: `Debe completar los horarios para ${dia}` };
            }
            if (horas.inicio >= horas.fin) {
                return { valido: false, mensaje: `La hora de fin debe ser mayor que la hora de inicio en ${dia}` };
            }
        }

        // Validar conflictos de docente
        const todosLosHorarios = db.getHorarios();
        for (const dia of diasSeleccionados) {
            const horas = horasPorDia[dia];
            const conflictoDocente = todosLosHorarios.find(h =>
                (h as any).docenteId === docenteSeleccionado &&
                h.diaSemana === dia &&
                ((horas.inicio >= h.horaInicio && horas.inicio < h.horaFin) ||
                    (horas.fin > h.horaInicio && horas.fin <= h.horaFin) ||
                    (horas.inicio <= h.horaInicio && horas.fin >= h.horaFin))
            );

            if (conflictoDocente) {
                const docente = docentes.find(d => d.id === docenteSeleccionado);
                return {
                    valido: false,
                    mensaje: `El docente ${docente?.nombre || ''} ya tiene una clase el ${dia} de ${conflictoDocente.horaInicio} a ${conflictoDocente.horaFin}`
                };
            }

            // Validar conflictos de espacio
            const conflictoEspacio = todosLosHorarios.find(h =>
                h.espacioId === espacioSeleccionado &&
                h.diaSemana === dia &&
                ((horas.inicio >= h.horaInicio && horas.inicio < h.horaFin) ||
                    (horas.fin > h.horaInicio && horas.fin <= h.horaFin) ||
                    (horas.inicio <= h.horaInicio && horas.fin >= h.horaFin))
            );

            if (conflictoEspacio) {
                const espacio = espacios.find(e => e.id === espacioSeleccionado);
                return {
                    valido: false,
                    mensaje: `El espacio ${espacio?.nombre || ''} ya está ocupado el ${dia} de ${conflictoEspacio.horaInicio} a ${conflictoEspacio.horaFin}`
                };
            }
        }

        return { valido: true, mensaje: '' };
    };

    const handleGuardarAsignacion = () => {
        const validacion = validarConflictos();

        if (!validacion.valido) {
            showNotification(validacion.mensaje, 'error');
            return;
        }

        if (!grupoSeleccionado) return;

        const asignatura = asignaturas.find(a => a.id === asignaturaSeleccionada);
        const docente = docentes.find(d => d.id === docenteSeleccionado);
        const espacio = espacios.find(e => e.id === espacioSeleccionado);

        // Crear un horario por cada día seleccionado
        const nuevosHorarios: any[] = diasSeleccionados.map(dia => {
            const horas = horasPorDia[dia];
            return {
                id: `horario-${Date.now()}-${Math.random()}`,
                asignaturaId: asignaturaSeleccionada,
                docenteId: docenteSeleccionado,
                espacioId: espacioSeleccionado,
                diaSemana: dia.toLowerCase(),
                horaInicio: horas.inicio,
                horaFin: horas.fin,
                grupoId: grupoSeleccionado.id,
                periodoId: db.getPeriodoActivo()?.id || 'periodo-1',
                activo: true,
                fechaCreacion: new Date().toISOString(),
                // Campos extendidos para visualización
                asignatura: asignatura?.nombre || '',
                docente: docente?.nombre || '',
                grupo: grupoSeleccionado.nombre,
                programaId: grupoSeleccionado.programaId,
                semestre: grupoSeleccionado.semestre
            };
        });

        // Guardar en la base de datos
        nuevosHorarios.forEach(horario => {
            db.createHorario(horario);
        });

        // Actualizar vista local
        setHorariosAsignados([...horariosAsignados, ...nuevosHorarios]);

        showNotification(`Asignatura ${asignatura?.nombre || ''} asignada correctamente`, 'success');
        setShowModalAsignar(false);

        // Llamar a la función de callback si está definida
        if (onHorarioCreado) {
            onHorarioCreado();
        }
    };

    const handleEliminarHorarioAsignado = (horarioId: string) => {
        if (confirm('¿Está seguro de eliminar esta asignación?')) {
            const success = db.deleteHorario(horarioId);
            if (success) {
                setHorariosAsignados(horariosAsignados.filter(h => h.id !== horarioId));
                showNotification('Asignación eliminada correctamente', 'success');
            }
        }
    };

    // Generar horario visual tipo grid
    const generarHoras = () => {
        const horas = [];
        for (let h = 6; h <= 21; h++) {
            horas.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return horas;
    };

    const obtenerClaseEnHora = (dia: string, hora: string) => {
        return horariosAsignados.find(h => {
            const diaMatch = h.diaSemana.toLowerCase() === dia.toLowerCase();
            const horaActual = parseInt(hora.split(':')[0]);
            const horaInicio = parseInt(h.horaInicio.split(':')[0]);
            const horaFin = parseInt(h.horaFin.split(':')[0]);
            return diaMatch && horaActual >= horaInicio && horaActual < horaFin;
        });
    };

    const horas = generarHoras();

    return {
        facultades,
        programas,
        grupos,
        espacios,
        asignaturas,
        docentes,
        filtroFacultad, setFiltroFacultad,
        filtroPrograma, setFiltroPrograma,
        filtroSemestre, setFiltroSemestre,
        filtroGrupo, setFiltroGrupo,
        vistaActual, setVistaActual,
        grupoSeleccionado, setGrupoSeleccionado,
        horariosAsignados, setHorariosAsignados,
        showModalAsignar, setShowModalAsignar,
        asignaturaSeleccionada, setAsignaturaSeleccionada,
        docenteSeleccionado, setDocenteSeleccionado,
        espacioSeleccionado, setEspacioSeleccionado,
        diasSeleccionados, setDiasSeleccionados,
        horasPorDia, setHorasPorDia,
        handleAsignarHorario,
        handleVolverALista,
        handleAbrirModalAsignar,
        handleToggleDia,
        handleHoraChange,
        handleGuardarAsignacion,
        handleEliminarHorarioAsignado,
        limpiarFiltros,
        loadData,
        gruposSinHorarioFiltrados,
        programasFiltrados,
        diasSemana,
        semestres,
        horas,
        obtenerClaseEnHora,
        notification
    };
}
