import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { facultadService, type Facultad } from '../../services/facultades/facultadesAPI';
import { programaService, type Programa } from '../../services/programas/programaAPI';
import { espacioService, type EspacioFisico } from '../../services/espacios/espaciosAPI';
import { asignaturaService, type Asignatura } from '../../services/asignaturas/asignaturaAPI';
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
    const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
    const [horasPorDia, setHorasPorDia] = useState<{ [key: string]: { inicio: string; fin: string } }>({});

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

    useEffect(() => {
        loadData();
    }, [user, role]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Cargar horarios extendidos
            const horariosResponse = await horarioService.listExtendidos();
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
        const matchPrograma = filtroPrograma === 'all' || grupo.programa_id === filtroPrograma;
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

        // Validar conflictos de docente (si se seleccionó uno)
        if (docenteSeleccionado) {
            for (const dia of diasSeleccionados) {
                const horas = horasPorDia[dia];
                const diaLower = dia.toLowerCase();
                
                const conflictoDocente = todosLosHorarios.find(h =>
                    h.docente_id === docenteSeleccionado &&
                    h.dia_semana === diaLower &&
                    ((horas.inicio >= h.hora_inicio && horas.inicio < h.hora_fin) ||
                        (horas.fin > h.hora_inicio && horas.fin <= h.hora_fin) ||
                        (horas.inicio <= h.hora_inicio && horas.fin >= h.hora_fin))
                );

                if (conflictoDocente) {
                    const docente = docentes.find(d => d.id === docenteSeleccionado);
                    return {
                        valido: false,
                        mensaje: `El docente ${docente?.nombre || ''} ya tiene una clase el ${dia} de ${conflictoDocente.hora_inicio} a ${conflictoDocente.hora_fin}`
                    };
                }
            }
        }

        // Validar conflictos de espacio
        for (const dia of diasSeleccionados) {
            const horas = horasPorDia[dia];
            const diaLower = dia.toLowerCase();
            
            const conflictoEspacio = todosLosHorarios.find(h =>
                h.espacio_id === espacioSeleccionado &&
                h.dia_semana === diaLower &&
                ((horas.inicio >= h.hora_inicio && horas.inicio < h.hora_fin) ||
                    (horas.fin > h.hora_inicio && horas.fin <= h.hora_fin) ||
                    (horas.inicio <= h.hora_inicio && horas.fin >= h.hora_fin))
            );

            if (conflictoEspacio) {
                const espacio = espacios.find(e => e.id === espacioSeleccionado);
                return {
                    valido: false,
                    mensaje: `El espacio ${espacio?.nombre || ''} ya está ocupado el ${dia} de ${conflictoEspacio.hora_inicio} a ${conflictoEspacio.hora_fin}`
                };
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
                    cantidad_estudiantes: null
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
