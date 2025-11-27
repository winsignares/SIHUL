import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../../hooks/database';
import type { ChecklistCierre, EstadoSalon, SalonEnriquecido } from '../../models';
import type { EspacioFisico, HorarioAcademico } from '../../hooks/models';
import { AlertCircle, DoorOpen, Users, Clock, Lock, XCircle } from 'lucide-react';

export function useSupervisorSalonHome() {
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [horarios, setHorarios] = useState<HorarioAcademico[]>([]);
    const [salonesFiltrados, setSalonesFiltrados] = useState<SalonEnriquecido[]>([]);

    // Filtros
    const [sedeSeleccionada, setSedeSeleccionada] = useState('');
    const [pisoSeleccionado, setPisoSeleccionado] = useState('');
    const [horaSeleccionada, setHoraSeleccionada] = useState('08:00');
    const [busquedaActiva, setBusquedaActiva] = useState(false);

    // Estados de salones (apertura y cierre)
    const [estadosSalones, setEstadosSalones] = useState<Map<number, EstadoSalon>>(new Map());

    // Modal de cierre
    const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
    const [salonParaCerrar, setSalonParaCerrar] = useState<SalonEnriquecido | null>(null);
    const [checklist, setChecklist] = useState<ChecklistCierre>({
        lucesApagadas: false,
        aireApagado: false,
        proyectorApagado: false,
        pupitresOrdenados: false,
        pizarraLimpia: false,
        ventanasCerradas: false,
        sinObjetosOlvidados: false,
        observaciones: ''
    });

    // Cargar datos
    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = () => {
        const espaciosDB = db.getEspacios();
        const horariosDB = db.getHorarios();
        setEspacios(espaciosDB);
        setHorarios(horariosDB);
    };

    // Obtener sedes y pisos únicos
    const sedes = useMemo(() => Array.from(new Set(espacios.map(e => e.sede))), [espacios]);
    const pisos = useMemo(() => sedeSeleccionada
        ? Array.from(new Set(espacios.filter(e => e.sede === sedeSeleccionada).map(e => e.piso)))
        : [], [espacios, sedeSeleccionada]);

    // Obtener hora actual (simulada)
    const obtenerHoraActual = useCallback(() => {
        return horaSeleccionada;
    }, [horaSeleccionada]);

    // Verificar si un salón tiene clase en la hora seleccionada
    const tieneClaseEnHora = useCallback((espacioId: string, hora: string) => {
        const horarioHoy = horarios.find(h => {
            if (h.espacioId !== espacioId) return false;

            const horaInicioNum = parseInt(h.horaInicio.split(':')[0]);
            const horaFinNum = parseInt(h.horaFin.split(':')[0]);
            const horaSelNum = parseInt(hora.split(':')[0]);

            return horaSelNum >= horaInicioNum && horaSelNum < horaFinNum;
        });

        return horarioHoy;
    }, [horarios]);

    // Verificar si la clase ya terminó (necesita cerrarse)
    const claseTerminada = useCallback((espacioId: string, hora: string) => {
        const horarioHoy = horarios.find(h => {
            if (h.espacioId !== espacioId) return false;
            const horaFinNum = parseInt(h.horaFin.split(':')[0]);
            const horaSelNum = parseInt(hora.split(':')[0]);
            return horaSelNum >= horaFinNum;
        });

        return horarioHoy;
    }, [horarios]);

    // Obtener información del grupo que ocupa el salón
    const obtenerInfoGrupo = useCallback((horario: HorarioAcademico | undefined) => {
        if (!horario) return null;

        // En HorarioAcademico, necesitamos buscar el grupo para obtener la materia
        const grupo = db.getGrupos().find(g => g.id === horario.grupoId);
        const asignatura = grupo ? db.getAsignaturas().find(a => a.id === grupo.asignaturaId) : null;

        return {
            grupo: grupo?.codigo || 'N/A',
            asignatura: asignatura?.nombre || 'N/A',
            docente: grupo?.docente || 'N/A',
            estudiantes: grupo?.cantidadEstudiantes || 0,
            horario: `${horario.horaInicio} - ${horario.horaFin}`,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin
        };
    }, []);

    // Determinar el estado del salón
    const obtenerEstadoSalon = useCallback((espacioId: number) => {
        const estado = estadosSalones.get(espacioId);
        const horaActual = obtenerHoraActual();
        const tieneClase = tieneClaseEnHora(espacioId.toString(), horaActual);
        const claseFinalizada = claseTerminada(espacioId.toString(), horaActual);

        if (estado?.cerrado) {
            return 'cerrado';
        } else if (estado?.abierto && tieneClase) {
            return 'en-clase';
        } else if (estado?.abierto && claseFinalizada) {
            return 'por-cerrar';
        } else if (estado?.abierto) {
            return 'abierto';
        } else if (tieneClase) {
            return 'por-abrir';
        } else {
            return 'sin-clase';
        }
    }, [estadosSalones, obtenerHoraActual, tieneClaseEnHora, claseTerminada]);

    // Función para buscar salones
    const buscarSalones = () => {
        if (!sedeSeleccionada || !pisoSeleccionado) {
            // Mostrar notificación: Por favor selecciona Sede y Piso
            return;
        }
        setBusquedaActiva(true);
        // Mostrar notificación: Búsqueda realizada
    };

    // Filtrar salones
    useEffect(() => {
        if (!busquedaActiva) {
            setSalonesFiltrados([]);
            return;
        }

        let resultado = [...espacios];

        // Filtro por sede
        if (sedeSeleccionada) {
            resultado = resultado.filter(e => e.sede === sedeSeleccionada);
        }

        // Filtro por piso
        if (pisoSeleccionado) {
            resultado = resultado.filter(e => e.piso === pisoSeleccionado);
        }

        // Solo mostrar aulas y laboratorios
        resultado = resultado.filter(e => e.tipo === 'aula' || e.tipo === 'laboratorio');

        // Agregar información de horario y estado
        const salonesConInfo = resultado.map(e => {
            const idNum = parseInt(e.id);
            const horario = tieneClaseEnHora(e.id, horaSeleccionada);
            const infoGrupo = obtenerInfoGrupo(horario);
            const estadoSalon = obtenerEstadoSalon(idNum);

            return {
                ...e,
                id: idNum,
                tieneClase: !!horario,
                infoGrupo,
                estadoSalon
            } as SalonEnriquecido;
        });

        // Ordenar: primero los que tienen clase
        salonesConInfo.sort((a, b) => {
            const prioridad: Record<string, number> = {
                'por-abrir': 1,
                'en-clase': 2,
                'por-cerrar': 3,
                'abierto': 4,
                'cerrado': 5,
                'sin-clase': 6
            };
            return prioridad[a.estadoSalon] - prioridad[b.estadoSalon];
        });

        setSalonesFiltrados(salonesConInfo);
    }, [sedeSeleccionada, pisoSeleccionado, horaSeleccionada, espacios, horarios, estadosSalones, busquedaActiva, tieneClaseEnHora, obtenerInfoGrupo, obtenerEstadoSalon]);

    // Abrir salón
    const abrirSalon = (espacioId: number) => {
        const nuevoEstado = new Map(estadosSalones);
        nuevoEstado.set(espacioId, {
            abierto: true,
            cerrado: false,
            horaApertura: obtenerHoraActual()
        });
        setEstadosSalones(nuevoEstado);

        // Mostrar notificación: Salón abierto
    };

    // Abrir modal de cierre
    const abrirModalCierre = (salon: SalonEnriquecido) => {
        setSalonParaCerrar(salon);
        setChecklist({
            lucesApagadas: false,
            aireApagado: false,
            proyectorApagado: false,
            pupitresOrdenados: false,
            pizarraLimpia: false,
            ventanasCerradas: false,
            sinObjetosOlvidados: false,
            observaciones: ''
        });
        setModalCierreAbierto(true);
    };

    // Cerrar salón con checklist
    const cerrarSalon = () => {
        if (!salonParaCerrar) return;

        const todoCompleto =
            checklist.lucesApagadas &&
            checklist.aireApagado &&
            checklist.proyectorApagado &&
            checklist.pupitresOrdenados &&
            checklist.pizarraLimpia &&
            checklist.ventanasCerradas &&
            checklist.sinObjetosOlvidados;

        if (!todoCompleto) {
            // Mostrar notificación: Checklist incompleto
            return;
        }

        const estadoActual = estadosSalones.get(salonParaCerrar.id);
        const nuevoEstado = new Map(estadosSalones);
        nuevoEstado.set(salonParaCerrar.id, {
            ...estadoActual!,
            abierto: false,
            cerrado: true,
            horaCierre: obtenerHoraActual(),
            checklistCierre: { ...checklist }
        });
        setEstadosSalones(nuevoEstado);

        // Mostrar notificación: Salón cerrado correctamente

        setModalCierreAbierto(false);
        setSalonParaCerrar(null);
    };

    // Estadísticas
    const estadisticas = useMemo(() => ({
        totalSalones: salonesFiltrados.length,
        salonesConClase: salonesFiltrados.filter(s => s.tieneClase).length,
        salonesAbiertos: salonesFiltrados.filter(s => s.estadoSalon === 'abierto' || s.estadoSalon === 'en-clase').length,
        salonesCerrados: salonesFiltrados.filter(s => s.estadoSalon === 'cerrado').length,
        salonesPorCerrar: salonesFiltrados.filter(s => s.estadoSalon === 'por-cerrar').length
    }), [salonesFiltrados]);

    // Configuración de badges por estado
    const getEstadoConfig = (estado: string) => {
        switch (estado) {
            case 'por-abrir':
                return {
                    label: 'Por Abrir',
                    className: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-300',
                    icon: AlertCircle
                };
            case 'abierto':
                return {
                    label: 'Abierto',
                    className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-300',
                    icon: DoorOpen
                };
            case 'en-clase':
                return {
                    label: 'En Clase',
                    className: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-300',
                    icon: Users
                };
            case 'por-cerrar':
                return {
                    label: 'Por Cerrar',
                    className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400 border-purple-300',
                    icon: Clock
                };
            case 'cerrado':
                return {
                    label: 'Cerrado',
                    className: 'bg-slate-100 text-slate-800 dark:bg-slate-950/30 dark:text-slate-400 border-slate-300',
                    icon: Lock
                };
            default:
                return {
                    label: 'Sin Clase',
                    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
                    icon: XCircle
                };
        }
    };

    return {
        sedes,
        pisos,
        sedeSeleccionada,
        setSedeSeleccionada,
        pisoSeleccionado,
        setPisoSeleccionado,
        horaSeleccionada,
        setHoraSeleccionada,
        busquedaActiva,
        setBusquedaActiva,
        salonesFiltrados,
        estadosSalones,
        modalCierreAbierto,
        setModalCierreAbierto,
        salonParaCerrar,
        checklist,
        setChecklist,
        buscarSalones,
        abrirSalon,
        abrirModalCierre,
        cerrarSalon,
        estadisticas,
        getEstadoConfig
    };
}
