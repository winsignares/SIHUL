import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { facultadService, type Facultad } from '../../services/facultades/facultadesAPI';
import { programaService, type Programa } from '../../services/programas/programaAPI';
import { espacioService, type EspacioFisico } from '../../services/espacios/espaciosAPI';
import { asignaturaService, asignaturaProgramaService, type Asignatura, type AsignaturaPrograma } from '../../services/asignaturas/asignaturaAPI';
import { userService, type Usuario } from '../../services/users/authService';
import { grupoService, type Grupo } from '../../services/grupos/gruposAPI';
import { horarioService, type HorarioExtendido } from '../../services/horarios/horariosAPI';
import { useAuth } from '../../context/AuthContext';

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

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Cargar horarios extendidos
            const horariosResponse = await horarioService.listExtendidos();
            console.log('📋 Horarios cargados:', horariosResponse.horarios.slice(0, 2)); // Mostrar primeros 2
            setTodosLosHorarios(horariosResponse.horarios);

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
            const usuariosResponse = await userService.listarUsuarios();
            setDocentes(usuariosResponse.usuarios);
            
        } catch (error) {
            showNotification(
                `Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
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
        // Cargar horarios existentes del grupo
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

        // Normalizar horas para comparación (quitar segundos si existen)
        const normalizeTime = (time: string) => time.substring(0, 5); // "07:00:00" -> "07:00"

        // Convertir hora "HH:MM" a minutos desde medianoche para comparaciones numéricas
        const timeToMinutes = (time: string) => {
            const t = normalizeTime(time);
            const parts = t.split(':');
            const hh = parseInt(parts[0] || '0', 10);
            const mm = parseInt(parts[1] || '0', 10);
            return hh * 60 + mm;
        };

        // Validar conflictos de docente (si se seleccionó uno)
        if (docenteSeleccionado) {
            for (const dia of diasSeleccionados) {
                const horas = horasPorDia[dia];
                const diaLower = dia.toLowerCase();
                
                // Buscar horarios del docente con superposición
                const inicioNuevoMin = timeToMinutes(horas.inicio);
                const finNuevoMin = timeToMinutes(horas.fin);

                const horariosDocenteSuperpuestos = todosLosHorarios.filter(h => {
                    if (h.docente_id !== docenteSeleccionado || h.dia_semana !== diaLower) return false;
                    const inicioExistMin = timeToMinutes(h.hora_inicio);
                    const finExistMin = timeToMinutes(h.hora_fin);

                    // Comprobar superposición (intervalos [inicio, fin), fin exclusivo)
                    return (
                        (inicioNuevoMin >= inicioExistMin && inicioNuevoMin < finExistMin) ||
                        (finNuevoMin > inicioExistMin && finNuevoMin <= finExistMin) ||
                        (inicioNuevoMin < inicioExistMin && finNuevoMin > finExistMin)
                    );
                });

                if (horariosDocenteSuperpuestos.length > 0) {
                    // Verificar si hay algún horario que NO sea exactamente la misma clase
                    const conflictoReal = horariosDocenteSuperpuestos.find(h =>
                        // Es un conflicto si NO coinciden asignatura, hora inicio o hora fin
                        h.asignatura_id !== asignaturaSeleccionada ||
                        normalizeTime(h.hora_inicio) !== normalizeTime(horas.inicio) ||
                        normalizeTime(h.hora_fin) !== normalizeTime(horas.fin)
                    );

                    console.log('🔍 DEBUG - Verificación de misma clase:', {
                        asignaturaSeleccionadaNueva: asignaturaSeleccionada,
                        horasNuevas: horas,
                        horarioExistente: horariosDocenteSuperpuestos[0],
                        comparaciones: horariosDocenteSuperpuestos.map(h => ({
                            horario_id: h.id,
                            asignatura_coincide: h.asignatura_id === asignaturaSeleccionada,
                            hora_inicio_coincide: normalizeTime(h.hora_inicio) === normalizeTime(horas.inicio),
                            hora_fin_coincide: normalizeTime(h.hora_fin) === normalizeTime(horas.fin),
                            valores: {
                                asignatura_existente: h.asignatura_id,
                                asignatura_nueva: asignaturaSeleccionada,
                                hora_inicio_existente: h.hora_inicio,
                                hora_inicio_nueva: horas.inicio,
                                hora_fin_existente: h.hora_fin,
                                hora_fin_nueva: horas.fin
                            }
                        })),
                        esConflictoReal: conflictoReal !== undefined,
                        conflictoEncontrado: conflictoReal
                    });

                    if (conflictoReal) {
                        // No es la misma clase, hay un conflicto real de docente
                        const docente = docentes.find(d => d.id === docenteSeleccionado);
                        return {
                            valido: false,
                            mensaje: `El docente ${docente?.nombre || ''} ya tiene una clase el ${dia} de ${conflictoReal.hora_inicio} a ${conflictoReal.hora_fin}`
                        };
                    }
                    // Si todos los horarios son la misma clase, permitir (el docente puede dar la misma clase a múltiples grupos)
                }
            }
        }

        // Validar conflictos de espacio y capacidad compartida
        for (const dia of diasSeleccionados) {
            const horas = horasPorDia[dia];
            const diaLower = dia.toLowerCase();
            
            // Buscar todos los horarios que usan el mismo espacio y tienen superposición horaria
            const inicioNuevoMin = timeToMinutes(horas.inicio);
            const finNuevoMin = timeToMinutes(horas.fin);

            const horariosSuperpuestos = todosLosHorarios.filter(h => {
                if (h.espacio_id !== espacioSeleccionado || h.dia_semana !== diaLower) return false;
                const inicioExistMin = timeToMinutes(h.hora_inicio);
                const finExistMin = timeToMinutes(h.hora_fin);

                return (
                    (inicioNuevoMin >= inicioExistMin && inicioNuevoMin < finExistMin) ||
                    (finNuevoMin > inicioExistMin && finNuevoMin <= finExistMin) ||
                    (inicioNuevoMin < inicioExistMin && finNuevoMin > finExistMin)
                );
            });

            if (horariosSuperpuestos.length > 0) {
                // Verificar si comparten EXACTAMENTE la misma asignatura, docente, hora_inicio y hora_fin
                const horarioCompartible = horariosSuperpuestos.find(h =>
                    h.asignatura_id === asignaturaSeleccionada &&
                    h.docente_id === docenteSeleccionado &&
                    normalizeTime(h.hora_inicio) === normalizeTime(horas.inicio) &&
                    normalizeTime(h.hora_fin) === normalizeTime(horas.fin)
                );

                if (horarioCompartible) {
                    // Es la misma clase, verificar capacidad total del espacio
                    const espacioSelec = espacios.find(e => e.id === espacioSeleccionado);
                    if (espacioSelec) {
                        // Sumar todos los estudiantes de horarios que comparten exactamente el mismo horario
                        const horariosCompartidos = horariosSuperpuestos.filter(h =>
                            h.asignatura_id === asignaturaSeleccionada &&
                            h.docente_id === docenteSeleccionado &&
                            normalizeTime(h.hora_inicio) === normalizeTime(horas.inicio) &&
                            normalizeTime(h.hora_fin) === normalizeTime(horas.fin)
                        );

                        const totalEstudiantesExistentes = horariosCompartidos
                            .reduce((sum, h) => sum + (h.cantidad_estudiantes || 0), 0);

                        const totalEstudiantes = totalEstudiantesExistentes + (cantidadEstudiantes as number);

                        console.log('📊 DEBUG - Validación de capacidad compartida:', {
                            espacioNombre: espacioSelec.nombre,
                            capacidadEspacio: espacioSelec.capacidad,
                            cantidadEstudiantesNueva: cantidadEstudiantes,
                            horariosCompartidos: horariosCompartidos.map(h => ({
                                grupo: h.grupo_nombre,
                                cantidad_estudiantes: h.cantidad_estudiantes
                            })),
                            totalEstudiantesExistentes,
                            totalEstudiantes,
                            excedeLaCapacidad: totalEstudiantes > espacioSelec.capacidad
                        });

                        if (totalEstudiantes > espacioSelec.capacidad) {
                            const gruposCompartiendo = horariosSuperpuestos
                                .filter(h =>
                                    h.asignatura_id === asignaturaSeleccionada &&
                                    h.docente_id === docenteSeleccionado &&
                                    normalizeTime(h.hora_inicio) === normalizeTime(horas.inicio) &&
                                    normalizeTime(h.hora_fin) === normalizeTime(horas.fin)
                                )
                                .map(h => h.grupo_nombre)
                                .join(', ');

                            return {
                                valido: false,
                                mensaje: `El espacio ${espacioSelec.nombre} no tiene capacidad suficiente. Ya hay ${totalEstudiantesExistentes} estudiantes del grupo(s) ${gruposCompartiendo} en esta clase. Total: ${totalEstudiantes}/${espacioSelec.capacidad}`
                            };
                        }
                        // Si la capacidad es suficiente, permitir compartir el espacio
                    }
                } else {
                    // No es la misma clase (diferente asignatura, docente u horario), hay conflicto
                    const conflicto = horariosSuperpuestos[0];
                    const espacio = espacios.find(e => e.id === espacioSeleccionado);
                    return {
                        valido: false,
                        mensaje: `El espacio ${espacio?.nombre || ''} ya está ocupado el ${dia} de ${conflicto.hora_inicio} a ${conflicto.hora_fin} por el grupo ${conflicto.grupo_nombre}`
                    };
                }
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
                    cantidad_estudiantes: cantidadEstudiantes as number
                });
            }

            showNotification(`✅ Asignatura ${asignatura?.nombre || ''} asignada correctamente`, 'success');
            setShowModalAsignar(false);

            // Recargar datos
            await loadData();
            
            // Actualizar horarios del grupo
            if (grupoSeleccionado.id) {
                const horariosResponse = await horarioService.listExtendidos();
                const horariosDelGrupo = horariosResponse.horarios.filter(h => h.grupo_id === grupoSeleccionado.id);
                setHorariosAsignados(horariosDelGrupo);
            }

            // Llamar a la función de callback si está definida
            if (onHorarioCreado) {
                onHorarioCreado();
            }
        } catch (error) {
            showNotification(
                `Error al guardar horario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
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
                await loadData();
                
                if (onHorarioCreado) {
                    onHorarioCreado();
                }
            } catch (error) {
                showNotification(
                    `Error al eliminar horario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
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

            // Calcular la hora de fin basada en la duración original
            const horaInicioOriginal = parseInt(horarioAMover.hora_inicio.split(':')[0]);
            const horaFinOriginal = parseInt(horarioAMover.hora_fin.split(':')[0]);
            const duracion = horaFinOriginal - horaInicioOriginal;
            
            const nuevaHoraFin = `${(parseInt(nuevaHoraInicio.split(':')[0]) + duracion).toString().padStart(2, '0')}:00`;

            // Validar conflictos con la nueva posición
            const diaLower = nuevodia.toLowerCase();
            const normalizeTimeLocal = (time: string) => time.substring(0, 5);
            const timeToMinutesLocal = (time: string) => {
                const t = normalizeTimeLocal(time);
                const parts = t.split(':');
                const hh = parseInt(parts[0] || '0', 10);
                const mm = parseInt(parts[1] || '0', 10);
                return hh * 60 + mm;
            };

            // Calcular nuevos intervalos en minutos
            const nuevaInicioMin = timeToMinutesLocal(nuevaHoraInicio);
            const nuevaFinMin = timeToMinutesLocal(nuevaHoraFin);

            // Verificar conflictos de docente (numéricamente)
            if (horarioAMover.docente_id) {
                const horariosDocenteSuperpuestos = todosLosHorarios.filter(h => {
                    if (h.id === horarioId) return false;
                    if (h.docente_id !== horarioAMover.docente_id || h.dia_semana !== diaLower) return false;
                    const inicioExistMin = timeToMinutesLocal(h.hora_inicio);
                    const finExistMin = timeToMinutesLocal(h.hora_fin);

                    return (
                        (nuevaInicioMin >= inicioExistMin && nuevaInicioMin < finExistMin) ||
                        (nuevaFinMin > inicioExistMin && nuevaFinMin <= finExistMin) ||
                        (nuevaInicioMin < inicioExistMin && nuevaFinMin > finExistMin)
                    );
                });

                if (horariosDocenteSuperpuestos.length > 0) {
                    const conflicto = horariosDocenteSuperpuestos[0];
                    showNotification(
                        `El docente ya tiene una clase el ${nuevodia} de ${conflicto.hora_inicio} a ${conflicto.hora_fin}`,
                        'error'
                    );
                    return;
                }
            }

            // Verificar conflictos de espacio (numéricamente)
            const horariosEspacioSuperpuestos = todosLosHorarios.filter(h => {
                if (h.id === horarioId) return false;
                if (h.espacio_id !== horarioAMover.espacio_id || h.dia_semana !== diaLower) return false;
                const inicioExistMin = timeToMinutesLocal(h.hora_inicio);
                const finExistMin = timeToMinutesLocal(h.hora_fin);

                return (
                    (nuevaInicioMin >= inicioExistMin && nuevaInicioMin < finExistMin) ||
                    (nuevaFinMin > inicioExistMin && nuevaFinMin <= finExistMin) ||
                    (nuevaInicioMin < inicioExistMin && nuevaFinMin > finExistMin)
                );
            });

            if (horariosEspacioSuperpuestos.length > 0) {
                const conflicto = horariosEspacioSuperpuestos[0];
                showNotification(
                    `El espacio ya está ocupado el ${nuevodia} de ${conflicto.hora_inicio} a ${conflicto.hora_fin}`,
                    'error'
                );
                return;
            }

            // Actualizar el horario
            await horarioService.update({
                id: horarioId,
                dia_semana: diaLower,
                hora_inicio: nuevaHoraInicio,
                hora_fin: nuevaHoraFin
            });

            showNotification('✅ Horario actualizado correctamente', 'success');

            // Recargar datos
            await loadData();
            
            if (grupoSeleccionado?.id) {
                const horariosResponse = await horarioService.listExtendidos();
                const horariosDelGrupo = horariosResponse.horarios.filter(h => h.grupo_id === grupoSeleccionado.id);
                setHorariosAsignados(horariosDelGrupo);
            }

            if (onHorarioCreado) {
                onHorarioCreado();
            }
        } catch (error) {
            showNotification(
                `Error al mover horario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
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
        notification
    };
}
