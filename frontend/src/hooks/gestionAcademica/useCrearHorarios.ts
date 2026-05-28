import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { facultadService, type Facultad } from '../../services/facultades/facultadesAPI';
import { programaService, type Programa } from '../../services/programas/programaAPI';
import { espacioService, type EspacioFisico } from '../../services/espacios/espaciosAPI';
import { asignaturaService, asignaturaProgramaService, type Asignatura, type AsignaturaPrograma } from '../../services/asignaturas/asignaturaAPI';
import { userService, type Usuario } from '../../services/users/authService';
import { grupoService, type Grupo } from '../../services/grupos/gruposAPI';
import { horarioService, type HorarioExtendido } from '../../services/horarios/horariosAPI';
import { solicitudEspacioService } from '../../services/horarios/solicitudEspacioAPI';
import { useAuth } from '../../context/AuthContext';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';
import { useValidacionHorarios } from './useValidacionHorarios';
import type { HorarioValidable } from './useValidacionHorarios';

const CREAR_HORARIOS_CACHE_KEY = 'gestion-academica-crear-horarios';

export interface GrupoConInfo extends Grupo {
    programa_nombre?: string;
    facultad_id?: number;
}

export interface HorarioDia {
    dia: string;
    horaInicio: string;
    horaFin: string;
}

export interface CrearHorariosHookProps {
    onHorarioCreado?: () => void;
}

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    if (error && typeof error === 'object') {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
            return maybeMessage;
        }
    }

    return 'Error desconocido';
};

export function useCrearHorarios({ onHorarioCreado }: CrearHorariosHookProps = {}) {
    const { user, role } = useAuth();
    const { notification, showNotification } = useNotification();

    // Estados principales
    const [loading, setLoading] = useState(false);
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [grupos, setGrupos] = useState<GrupoConInfo[]>([]);
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
    const [asignaturasPrograma, setAsignaturasPrograma] = useState<AsignaturaPrograma[]>([]);
    const [docentes, setDocentes] = useState<Usuario[]>([]);
    const [todosLosHorarios, setTodosLosHorarios] = useState<HorarioExtendido[]>([]);

    // Filtros
    const [filtroFacultad, setFiltroFacultad] = useState<string>('all');
    const [filtroPrograma, setFiltroPrograma] = useState<number | string>('all');
    const [filtroSemestre, setFiltroSemestre] = useState<string>('all');
    const [filtroGrupo, setFiltroGrupo] = useState<string>('all');

    // Estados de la UI
    const [vistaActual, setVistaActual] = useState<'lista' | 'asignar'>('lista');
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoConInfo | null>(null);
    const [horariosAsignados, setHorariosAsignados] = useState<HorarioExtendido[]>([]);

    // Modal de asignar asignatura
    const [showModalAsignar, setShowModalAsignar] = useState(false);
    const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<number | ''>('');
    const [docenteSeleccionado, setDocenteSeleccionado] = useState<number | ''>('');
    const [espacioSeleccionado, setEspacioSeleccionado] = useState<number | ''>('');
    const [cantidadEstudiantes, setCantidadEstudiantes] = useState<number | ''>('');
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [horasPorDia, setHorasPorDia] = useState<{ [key: string]: { inicio: string; fin: string } }>({});

    const horariosValidables: HorarioValidable[] = todosLosHorarios
        .filter((h): h is HorarioExtendido & { espacio_id: number } => h.espacio_id != null)
        .map((h) => ({
            id: h.id,
            grupo_id: h.grupo_id,
            grupo_nombre: h.grupo_nombre,
            asignatura_id: h.asignatura_id,
            asignatura_nombre: h.asignatura_nombre,
            docente_id: h.docente_id,
            docente_nombre: h.docente_nombre,
            espacio_id: h.espacio_id,
            espacio_nombre: h.espacio_nombre,
            dia_semana: h.dia_semana,
            hora_inicio: h.hora_inicio,
            hora_fin: h.hora_fin,
            cantidad_estudiantes: h.cantidad_estudiantes,
        }));

    const { validarConflictosHorario } = useValidacionHorarios({
        horarios: horariosValidables,
        grupos,
        espacios,
    });

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const userScope = `${role?.nombre || 'no-role'}-${user?.id || 'no-user'}-${user?.facultad?.id || 'no-facultad'}`;
            const cacheKey = `${CREAR_HORARIOS_CACHE_KEY}-${userScope}`;
            const cachedData = force
                ? null
                : getSessionCacheData<{
                    facultades: Facultad[];
                    programas: Programa[];
                    grupos: GrupoConInfo[];
                    espacios: EspacioFisico[];
                    asignaturas: Asignatura[];
                    asignaturasPrograma: AsignaturaPrograma[];
                    docentes: Usuario[];
                    todosLosHorarios: HorarioExtendido[];
                    filtroFacultad?: string;
                }>(cacheKey, activeToken);

            if (cachedData) {
                setFacultades(cachedData.facultades);
                setProgramas(cachedData.programas);
                setGrupos(cachedData.grupos);
                setEspacios(cachedData.espacios);
                setAsignaturas(cachedData.asignaturas);
                setAsignaturasPrograma(cachedData.asignaturasPrograma);
                setDocentes(cachedData.docentes);
                setTodosLosHorarios(cachedData.todosLosHorarios);
                if (cachedData.filtroFacultad) {
                    setFiltroFacultad(cachedData.filtroFacultad);
                }
                return { todosHorarios: cachedData.todosLosHorarios };
            }

            setLoading(true);
            
            // Cargar horarios extendidos
            const horariosResponse = await horarioService.listExtendidos({ includePending: true });
            console.log('📋 Horarios cargados:', horariosResponse.horarios.slice(0, 2)); // Mostrar primeros 2
            
            // Si es planeacion_facultad, también cargar sus solicitudes pendientes
            let todosHorarios = horariosResponse.horarios;
            if (role?.nombre === 'planeacion_facultad' && user?.id) {
                try {
                    const solicitudesResponse = await solicitudEspacioService.list('pendiente');
                    // Filtrar solo las solicitudes del usuario actual
                    const misSolicitudes = solicitudesResponse.solicitudes.filter(
                        s => s.planificador_id === user.id
                    );
                    
                    // Convertir solicitudes a formato HorarioExtendido para mostrarlas en la cuadrícula
                    const solicitudesComoHorarios: HorarioExtendido[] = misSolicitudes.map(s => ({
                        id: s.id,
                        grupo_id: s.grupo_id,
                        grupo_nombre: s.grupo_nombre,
                        programa_id: 0, // No disponible en SolicitudEspacio
                        programa_nombre: '',
                        semestre: 0,
                        asignatura_id: s.asignatura_id,
                        asignatura_nombre: s.asignatura_nombre,
                        docente_id: s.docente_id,
                        docente_nombre: s.docente_nombre || 'Sin asignar',
                        espacio_id: s.espacio_solicitado_id,
                        espacio_nombre: s.espacio_solicitado_nombre,
                        dia_semana: s.dia_semana,
                        hora_inicio: s.hora_inicio,
                        hora_fin: s.hora_fin,
                        cantidad_estudiantes: s.cantidad_estudiantes,
                        estado: 'pendiente',
                        es_solicitud: true
                    }));
                    
                    // Combinar horarios aprobados con solicitudes pendientes
                    todosHorarios = [...horariosResponse.horarios, ...solicitudesComoHorarios];
                    console.log('📋 Solicitudes pendientes cargadas:', solicitudesComoHorarios.length);
                } catch (error) {
                    console.warn('Error al cargar solicitudes pendientes:', error);
                    // Continuar sin solicitudes si hay error
                }
            }
            
            setTodosLosHorarios(todosHorarios);

            // Cargar facultades
            const facultadesResponse = await facultadService.list();
            let allFacultades = facultadesResponse.facultades;
            
            // Filtrar por facultad si el usuario tiene rol de planeacion_facultad
            if (role?.nombre === 'planeacion_facultad' && user?.facultad) {
                const userFacultadId = user.facultad.id.toString();
                allFacultades = allFacultades.filter(f => f.id?.toString() === userFacultadId);
                setFiltroFacultad(userFacultadId);
            }
            setFacultades(allFacultades);

            // Cargar programas
            const programasResponse = await programaService.listarProgramas();
            setProgramas(programasResponse.programas);

            // Cargar grupos
            const gruposResponse = await grupoService.list();
            const gruposConInfo = gruposResponse.grupos.map(grupo => {
                const programa = programasResponse.programas.find(p => p.id === grupo.programa_id);
                return {
                    ...grupo,
                    programa_nombre: programa?.nombre,
                    facultad_id: programa?.facultad_id
                };
            });
            setGrupos(gruposConInfo);

            // Cargar espacios
            const espaciosResponse = await espacioService.list();
            setEspacios(espaciosResponse.espacios);

            // Cargar asignaturas
            const asignaturasResponse = await asignaturaService.list();
            setAsignaturas(asignaturasResponse.asignaturas);

            // Cargar relaciones asignatura-programa
            const asignaturasProgramaResponse = await asignaturaProgramaService.list();
            setAsignaturasPrograma(asignaturasProgramaResponse.asignaturas_programa);

            // Cargar docentes (usuarios con rol de docente)
            const usuariosResponse = await userService.listarDocentes();
            setDocentes(usuariosResponse.usuarios);

            setSessionCacheData(cacheKey, activeToken, {
                facultades: allFacultades,
                programas: programasResponse.programas,
                grupos: gruposConInfo,
                espacios: espaciosResponse.espacios,
                asignaturas: asignaturasResponse.asignaturas,
                asignaturasPrograma: asignaturasProgramaResponse.asignaturas_programa,
                docentes: usuariosResponse.usuarios,
                todosLosHorarios: todosHorarios,
                filtroFacultad: role?.nombre === 'planeacion_facultad' && user?.facultad
                    ? user.facultad.id.toString()
                    : undefined
            });

            return { todosHorarios };
            
        } catch (error) {
            showNotification(
                `Error al cargar datos: ${getErrorMessage(error)}`,
                'error'
            );
            return { todosHorarios: [] as HorarioExtendido[] };
        } finally {
            setLoading(false);
        }
    };

    // Obtener grupos sin horario (o con horarios incompletos)
    const obtenerGrupos = (): GrupoConInfo[] => {
        return grupos;
    };

    // Filtrar grupos
    const gruposSinHorarioFiltrados = obtenerGrupos().filter(grupo => {
        const matchFacultad = filtroFacultad === 'all' || grupo.facultad_id?.toString() === filtroFacultad;
        const matchPrograma = filtroPrograma === 'all' || grupo.programa_id?.toString() === filtroPrograma.toString();
        const matchSemestre = filtroSemestre === 'all' || (grupo.semestre && grupo.semestre.toString() === filtroSemestre);
        const matchGrupo = filtroGrupo === 'all' || (grupo.nombre && grupo.nombre.toLowerCase().includes(filtroGrupo.toLowerCase()));

        return matchFacultad && matchPrograma && matchSemestre && matchGrupo;
    });

    const programasFiltrados = programas.filter(p =>
        filtroFacultad === 'all' || p.facultad_id?.toString() === filtroFacultad
    );

    const limpiarFiltros = () => {
        setFiltroFacultad('all');
        setFiltroPrograma('all');
        setFiltroSemestre('all');
        setFiltroGrupo('all');
    };

    // Obtener asignaturas de un programa específico y semestre
    const getAsignaturasByProgramaYSemestre = (programaId: number, semestre: number): Asignatura[] => {
        // Obtener IDs de asignaturas que pertenecen al programa Y al semestre específico
        const asignaturaIdsDelProgramaYSemestre = asignaturasPrograma
            .filter(ap => ap.programa_id === programaId && ap.semestre === semestre)
            .map(ap => ap.asignatura_id);

        // Retornar las asignaturas completas que están en el programa y semestre
        return asignaturas.filter(a => a.id && asignaturaIdsDelProgramaYSemestre.includes(a.id));
    };

    // Filtrar espacios disponibles según capacidad requerida
    const getEspaciosDisponibles = (cantidadEstudiantes: number): EspacioFisico[] => {
        if (!cantidadEstudiantes || cantidadEstudiantes <= 0) {
            return espacios;
        }
        return espacios.filter(e => e.capacidad >= cantidadEstudiantes);
    };

    const handleAsignarHorario = async (grupo: GrupoConInfo) => {
        setGrupoSeleccionado(grupo);
        // Cargar horarios existentes del grupo (incluye solicitudes pendientes si es planeacion_facultad)
        const horariosDelGrupo = todosLosHorarios.filter(h => h.grupo_id === grupo.id);
        setHorariosAsignados(horariosDelGrupo);
        setVistaActual('asignar');
    };

    const handleVolverALista = () => {
        setVistaActual('lista');
        setGrupoSeleccionado(null);
        setHorariosAsignados([]);
        loadData(); // Recargar datos al volver
    };

    const handleAbrirModalAsignar = () => {
        setShowModalAsignar(true);
        setAsignaturaSeleccionada('');
        setDocenteSeleccionado('');
        setEspacioSeleccionado('');
        setCantidadEstudiantes('');
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
        if (!asignaturaSeleccionada || !espacioSeleccionado) {
            return { valido: false, mensaje: 'Asignatura y espacio son obligatorios' };
        }

        if (!cantidadEstudiantes || cantidadEstudiantes <= 0) {
            return { valido: false, mensaje: 'La cantidad de estudiantes es obligatoria y debe ser mayor a 0' };
        }

        // Validar que el espacio tenga capacidad suficiente
        const espacioSelec = espacios.find(e => e.id === espacioSeleccionado);
        if (espacioSelec && espacioSelec.capacidad < cantidadEstudiantes) {
            return { valido: false, mensaje: `El espacio ${espacioSelec.nombre} no tiene capacidad suficiente (capacidad: ${espacioSelec.capacidad}, estudiantes: ${cantidadEstudiantes})` };
        }

        if (diasSeleccionados.length === 0) {
            return { valido: false, mensaje: 'Debe seleccionar al menos un día' };
        }

        if (!grupoSeleccionado?.id) {
            return { valido: false, mensaje: 'Debe seleccionar un grupo válido' };
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

        for (const dia of diasSeleccionados) {
            const horas = horasPorDia[dia];
            const validacionDia = validarConflictosHorario({
                grupoId: grupoSeleccionado.id as number,
                asignaturaId: asignaturaSeleccionada as number,
                docenteId: docenteSeleccionado ? (docenteSeleccionado as number) : null,
                espacioId: espacioSeleccionado as number,
                diaSemana: dia.toLowerCase(),
                horaInicio: horas.inicio,
                horaFin: horas.fin,
                cantidadEstudiantes: cantidadEstudiantes as number,
            });

            if (!validacionDia.valido) {
                return validacionDia;
            }
        }

        return { valido: true, mensaje: '' };
    };

    const handleGuardarAsignacion = async () => {
        const validacion = validarConflictos();

        if (!validacion.valido) {
            showNotification(validacion.mensaje, 'error');
            return;
        }

        if (!grupoSeleccionado || !grupoSeleccionado.id) return;

        try {
            setLoading(true);
            const asignatura = asignaturas.find(a => a.id === asignaturaSeleccionada);

            // Crear un horario por cada día seleccionado
            for (const dia of diasSeleccionados) {
                const horas = horasPorDia[dia];
                
                await horarioService.create({
                    grupo_id: grupoSeleccionado.id,
                    asignatura_id: asignaturaSeleccionada as number,
                    docente_id: docenteSeleccionado ? (docenteSeleccionado as number) : null,
                    espacio_id: espacioSeleccionado as number,
                    dia_semana: dia.toLowerCase(),
                    hora_inicio: horas.inicio,
                    hora_fin: horas.fin,
                    cantidad_estudiantes: cantidadEstudiantes as number,
                    usuario_id: user?.id,
                    estado: role?.nombre === 'admin_planeacion' || role?.nombre === 'admin' ? 'aprobado' : 'pendiente'
                });

                // El HorarioFusionado se crea automáticamente en el backend mediante un signal
            }

            const mensaje = role?.nombre === 'admin_planeacion' || role?.nombre === 'admin'
              ? `✅ Espacio añadido exitosamente para ${asignatura?.nombre || 'la asignatura'}`
              : `✅ Se ha enviado su solicitud para ${asignatura?.nombre || 'la asignatura'}. Se le hará revisión en breve.`;
            showNotification(mensaje, 'success');
            setShowModalAsignar(false);

            // Recargar datos forzadamente y actualizar horarios del grupo
            const refreshed = await loadData({ force: true });
            if (grupoSeleccionado.id) {
                const horariosDelGrupo = refreshed.todosHorarios.filter(h => h.grupo_id === grupoSeleccionado.id);
                setHorariosAsignados(horariosDelGrupo);
            }

            // Llamar a la función de callback si está definida
            if (onHorarioCreado) {
                onHorarioCreado();
            }
        } catch (error) {
            showNotification(
                `Error al guardar horario: ${getErrorMessage(error)}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEliminarHorarioAsignado = async (horarioId: number) => {
        if (confirm('¿Está seguro de eliminar esta asignación?')) {
            try {
                setLoading(true);
                await horarioService.delete({ id: horarioId });
                
                setHorariosAsignados(horariosAsignados.filter(h => h.id !== horarioId));
                showNotification('✅ Asignación eliminada correctamente', 'success');
                
                // Recargar datos
                const refreshed = await loadData({ force: true });

                if (grupoSeleccionado?.id) {
                    const horariosDelGrupo = refreshed.todosHorarios.filter(h => h.grupo_id === grupoSeleccionado.id);
                    setHorariosAsignados(horariosDelGrupo);
                }
                
                if (onHorarioCreado) {
                    onHorarioCreado();
                }
            } catch (error) {
                showNotification(
                    `Error al eliminar horario: ${getErrorMessage(error)}`,
                    'error'
                );
            } finally {
                setLoading(false);
            }
        }
    };

    const handleMoverHorario = async (horarioId: number, nuevodia: string, nuevaHoraInicio: string) => {
        try {
            setLoading(true);
            
            // Obtener el horario a mover
            const horarioAMover = horariosAsignados.find(h => h.id === horarioId);
            if (!horarioAMover) {
                showNotification('Horario no encontrado', 'error');
                return;
            }
            if (horarioAMover.espacio_id == null) {
                showNotification('El horario no tiene espacio asignado', 'error');
                return;
            }

            // Calcular la hora de fin basada en la duración original
            const horaInicioOriginal = parseInt(horarioAMover.hora_inicio.split(':')[0]);
            const horaFinOriginal = parseInt(horarioAMover.hora_fin.split(':')[0]);
            const duracion = horaFinOriginal - horaInicioOriginal;
            
            const nuevaHoraFin = `${(parseInt(nuevaHoraInicio.split(':')[0]) + duracion).toString().padStart(2, '0')}:00`;

            const validacion = validarConflictosHorario({
                horarioId,
                grupoId: horarioAMover.grupo_id,
                asignaturaId: horarioAMover.asignatura_id,
                docenteId: horarioAMover.docente_id,
                espacioId: horarioAMover.espacio_id,
                diaSemana: nuevodia.toLowerCase(),
                horaInicio: nuevaHoraInicio,
                horaFin: nuevaHoraFin,
                cantidadEstudiantes: horarioAMover.cantidad_estudiantes,
                docenteNombre: horarioAMover.docente_nombre,
                espacioNombre: horarioAMover.espacio_nombre,
            });

            if (!validacion.valido) {
                showNotification(validacion.mensaje, 'error');
                return;
            }

            // Actualizar el horario
            await horarioService.update({
                id: horarioId,
                dia_semana: nuevodia.toLowerCase(),
                hora_inicio: nuevaHoraInicio,
                hora_fin: nuevaHoraFin
            });

            showNotification('✅ Horario actualizado correctamente', 'success');

            // Recargar datos (incluye solicitudes pendientes)
            const refreshed = await loadData({ force: true });
            
            if (grupoSeleccionado?.id) {
                const horariosDelGrupo = refreshed.todosHorarios.filter(h => h.grupo_id === grupoSeleccionado.id);
                setHorariosAsignados(horariosDelGrupo);
            }

            if (onHorarioCreado) {
                onHorarioCreado();
            }
        } catch (error) {
            showNotification(
                `Error al mover horario: ${getErrorMessage(error)}`,
                'error'
            );
        } finally {
            setLoading(false);
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
            const diaMatch = h.dia_semana.toLowerCase() === dia.toLowerCase();
            const horaActual = parseInt(hora.split(':')[0]);
            const horaInicio = parseInt(h.hora_inicio.split(':')[0]);
            const horaFin = parseInt(h.hora_fin.split(':')[0]);
            return diaMatch && horaActual >= horaInicio && horaActual < horaFin;
        });
    };

    const horas = generarHoras();

    return {
        loading,
        facultades,
        programas,
        grupos,
        espacios,
        asignaturas,
        asignaturasPrograma,
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
        cantidadEstudiantes, setCantidadEstudiantes,
        diasSeleccionados, setDiasSeleccionados,
        horasPorDia, setHorasPorDia,
        handleAsignarHorario,
        handleVolverALista,
        handleAbrirModalAsignar,
        handleToggleDia,
        handleHoraChange,
        handleGuardarAsignacion,
        handleEliminarHorarioAsignado,
        handleMoverHorario,
        limpiarFiltros,
        loadData,
        gruposSinHorarioFiltrados,
        programasFiltrados,
        getAsignaturasByProgramaYSemestre,
        getEspaciosDisponibles,
        diasSemana,
        semestres,
        horas,
        obtenerClaseEnHora,
        notification,
        user,
        role
    };
}
