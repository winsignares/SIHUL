import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../share/notificationBanner';
import { horarioService, horarioFusionadoService } from '../../services/horarios/horariosAPI';
import { facultadService, type Facultad } from '../../services/facultades/facultadesAPI';
import { programaService, type Programa } from '../../services/programas/programaAPI';
import { espacioService, type EspacioFisico } from '../../services/espacios/espaciosAPI';
import { grupoService, type Grupo } from '../../services/grupos/gruposAPI';
import { useAuth } from '../../context/AuthContext';

export interface HorarioExtendido {
    id: number;
    grupo_id: number;
    grupo_nombre: string;
    programa_id: number;
    programa_nombre: string;
    semestre: number;
    asignatura_id: number;
    asignatura_nombre: string;
    docente_id: number | null;
    docente_nombre: string;
    espacio_id: number;
    espacio_nombre: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes: number | null;
}

export interface GrupoAgrupado {
    programaId: number;
    grupo: string;
    semestre: number;
    horarios: HorarioExtendido[];
}

export interface HorarioFusionadoExtendido {
    id: number;
    grupo1_id: number;
    grupo2_id: number;
    grupo3_id: number | null;
    grupo1_nombre: string;
    grupo2_nombre: string;
    grupo3_nombre: string | null;
    asignatura_id: number;
    asignatura_nombre: string;
    docente_id: number | null;
    docente_nombre: string;
    espacio_id: number;
    espacio_nombre: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes: number | null;
    comentario: string | null;
}

export function useCentroHorarios() {
    const { user, role } = useAuth();
    const { notification, showNotification } = useNotification();
    const [searchParams] = useSearchParams();
    const modeParam = searchParams.get('mode');
    const initialMode = modeParam === 'consulta' ? 'consulta' : (modeParam === 'modificacion' ? 'modificacion' : 'crear');
    const [activeTab, setActiveTab] = useState<'consulta' | 'crear' | 'modificacion' | 'fusionados'>(initialMode as any);
    const [loading, setLoading] = useState(false);
    const [horarios, setHorarios] = useState<HorarioExtendido[]>([]);
    const [horariosFusionados, setHorariosFusionados] = useState<HorarioFusionadoExtendido[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);

    // Filtros
    const [filtroFacultad, setFiltroFacultad] = useState<string>('all');
    const [filtroPrograma, setFiltroPrograma] = useState<string>('all');
    const [filtroGrupo, setFiltroGrupo] = useState<string>('all');
    const [filtroSemestre, setFiltroSemestre] = useState<string>('all');

    // Filtros para horarios fusionados
    const [filtroFusionadoDia, setFiltroFusionadoDia] = useState<string>('all');
    const [filtroFusionadoAsignatura, setFiltroFusionadoAsignatura] = useState<string>('all');
    const [filtroFusionadoDocente, setFiltroFusionadoDocente] = useState<string>('all');
    const [filtroFusionadoEspacio, setFiltroFusionadoEspacio] = useState<string>('all');

    // Modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [horarioEditar, setHorarioEditar] = useState<HorarioExtendido | null>(null);

    // Modal de detalles - ahora maneja un grupo completo
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [grupoDetalles, setGrupoDetalles] = useState<GrupoAgrupado | null>(null);

    // Estados para selección múltiple
    const [horariosSeleccionados, setHorariosSeleccionados] = useState<Set<number>>(new Set());
    const [seleccionarTodos, setSeleccionarTodos] = useState(false);

    // Estado para acordeón de grupos expandidos
    const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(new Set());

    // Estados para modal de confirmación de eliminación de grupo
    const [showDeleteGrupoModal, setShowDeleteGrupoModal] = useState(false);
    const [grupoAEliminar, setGrupoAEliminar] = useState<GrupoAgrupado | null>(null);
    const [eliminandoGrupo, setEliminandoGrupo] = useState(false);
    const [progresoEliminacion, setProgresoEliminacion] = useState(0);

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    useEffect(() => {
        loadData();
    }, [user, role]);

    // Si cambian los query params, sincronizar la pestaña activa
    useEffect(() => {
        const mode = searchParams.get('mode');
        if (mode === 'crear' || mode === 'modificacion' || mode === 'consulta') {
            setActiveTab(mode as any);
        } else {
            setActiveTab('crear');
        }
    }, [searchParams]);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Cargar horarios extendidos
            const horariosResponse = await horarioService.listExtendidos();
            setHorarios(horariosResponse.horarios);

            // Cargar horarios fusionados
            const fusionadosResponse = await horarioFusionadoService.list();
            const fusionadosConInfo: HorarioFusionadoExtendido[] = await Promise.all(
                fusionadosResponse.horarios_fusionados.map(async (hf): Promise<HorarioFusionadoExtendido> => {
                    // Obtener información de los grupos
                    const [grupo1, grupo2, grupo3] = await Promise.all([
                        grupoService.get(hf.grupo1_id),
                        grupoService.get(hf.grupo2_id),
                        hf.grupo3_id ? grupoService.get(hf.grupo3_id) : Promise.resolve(null)
                    ]);

                    // Buscar información adicional de horarios
                    const horario1 = horariosResponse.horarios.find(h => h.grupo_id === hf.grupo1_id && h.asignatura_id === hf.asignatura_id);
                    
                    return {
                        id: hf.id as number,
                        grupo1_id: hf.grupo1_id,
                        grupo2_id: hf.grupo2_id,
                        grupo3_id: hf.grupo3_id ?? null,
                        grupo1_nombre: grupo1.nombre,
                        grupo2_nombre: grupo2.nombre,
                        grupo3_nombre: grupo3?.nombre || null,
                        asignatura_id: hf.asignatura_id,
                        asignatura_nombre: horario1?.asignatura_nombre || 'N/A',
                        docente_id: horario1?.docente_id ?? null,
                        docente_nombre: horario1?.docente_nombre || 'N/A',
                        espacio_id: horario1?.espacio_id ?? hf.espacio_id,
                        espacio_nombre: horario1?.espacio_nombre || 'N/A',
                        dia_semana: hf.dia_semana,
                        hora_inicio: hf.hora_inicio,
                        hora_fin: hf.hora_fin,
                        cantidad_estudiantes: hf.cantidad_estudiantes ?? null,
                        comentario: hf.comentario ?? null
                    };
                })
            );
            setHorariosFusionados(fusionadosConInfo);

            // Cargar grupos
            const gruposResponse = await grupoService.list();
            setGrupos(gruposResponse.grupos);

            // Cargar facultades
            const facultadesResponse = await facultadService.list();
            let allFacultades = facultadesResponse.facultades;
            
            // Filtrar facultades si es planeacion_facultad
            if (role?.nombre === 'planeacion_facultad' && user?.facultad) {
                const userFacultadId = user.facultad.id.toString();
                allFacultades = allFacultades.filter(f => f.id.toString() === userFacultadId);
                setFiltroFacultad(userFacultadId);
            }
            setFacultades(allFacultades);

            // Cargar programas
            const programasResponse = await programaService.listarProgramas();
            setProgramas(programasResponse.programas);

            // Cargar espacios
            const espaciosResponse = await espacioService.list();
            setEspacios(espaciosResponse.espacios);
            
        } catch (error) {
            showNotification(
                `Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    // Generar horas para el grid semanal
    const generarHoras = () => {
        const horas = [];
        for (let h = 6; h <= 21; h++) {
            horas.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return horas;
    };

    // Obtener clase en una hora específica
    const obtenerClaseEnHora = (dia: string, hora: string, horariosGrupo: HorarioExtendido[]) => {
        return horariosGrupo.find(h => {
            const diaMatch = h.dia_semana.toLowerCase() === dia.toLowerCase();

            // Convertir horas a números para comparación
            const horaActual = parseInt(hora.split(':')[0]);
            const horaInicio = parseInt(h.hora_inicio.split(':')[0]);
            const horaFin = parseInt(h.hora_fin.split(':')[0]);

            // Verificar si la hora actual está dentro del rango de la clase
            return diaMatch && horaActual >= horaInicio && horaActual < horaFin;
        });
    };

    // Agrupar horarios por programa + grupo + semestre
    const agruparHorarios = (horariosArray: HorarioExtendido[]): GrupoAgrupado[] => {
        const grupos = new Map<string, GrupoAgrupado>();

        horariosArray.forEach(horario => {
            const key = `${horario.programa_id}-${horario.grupo_nombre}-${horario.semestre}`;

            if (!grupos.has(key)) {
                grupos.set(key, {
                    programaId: horario.programa_id,
                    grupo: horario.grupo_nombre,
                    semestre: horario.semestre,
                    horarios: []
                });
            }

            grupos.get(key)!.horarios.push(horario);
        });

        return Array.from(grupos.values());
    };

    // Filtrar horarios
    const horariosFiltrados = horarios.filter(horario => {
        const programa = programas.find(p => p.id === horario.programa_id);

        const matchFacultad = filtroFacultad === 'all' || programa?.facultad_id === parseInt(filtroFacultad);
        const matchPrograma = filtroPrograma === 'all' || horario.programa_id === parseInt(filtroPrograma);
        const matchGrupo = filtroGrupo === 'all' || horario.grupo_nombre === filtroGrupo;
        const matchSemestre = filtroSemestre === 'all' || horario.semestre?.toString() === filtroSemestre;

        return matchFacultad && matchPrograma && matchGrupo && matchSemestre;
    });

    // Obtener grupos agrupados después de filtrar
    const gruposAgrupados = agruparHorarios(horariosFiltrados);

    // Obtener listas únicas para filtros
    const gruposUnicos = [...new Set(horarios.map(h => h.grupo_nombre).filter(Boolean))].sort();
    const semestresUnicos = [...new Set(horarios.map(h => h.semestre).filter(Boolean))].sort((a, b) => a - b);
    const programasFiltrados = programas.filter(p =>
        filtroFacultad === 'all' || p.facultad_id === parseInt(filtroFacultad)
    );

    // Listas únicas para filtros de horarios fusionados
    const diasFusionadosUnicos = [...new Set(horariosFusionados.map(h => h.dia_semana))].sort();
    const asignaturasFusionadasUnicas = [...new Set(horariosFusionados.map(h => h.asignatura_nombre))].sort();
    const docentesFusionadosUnicos = [...new Set(horariosFusionados.map(h => h.docente_nombre))].sort();
    const espaciosFusionadosUnicos = [...new Set(horariosFusionados.map(h => h.espacio_nombre))].sort();

    // Filtrar horarios fusionados
    const horariosFusionadosFiltrados = horariosFusionados.filter(hf => {
        const matchDia = filtroFusionadoDia === 'all' || hf.dia_semana.toLowerCase() === filtroFusionadoDia.toLowerCase();
        const matchAsignatura = filtroFusionadoAsignatura === 'all' || hf.asignatura_nombre === filtroFusionadoAsignatura;
        const matchDocente = filtroFusionadoDocente === 'all' || hf.docente_nombre === filtroFusionadoDocente;
        const matchEspacio = filtroFusionadoEspacio === 'all' || hf.espacio_nombre === filtroFusionadoEspacio;

        return matchDia && matchAsignatura && matchDocente && matchEspacio;
    });

    // Handlers
    const handleVerDetalles = (grupo: GrupoAgrupado) => {
        setGrupoDetalles(grupo);
        setShowDetallesModal(true);
    };

    const handleEditar = (horario: HorarioExtendido) => {
        setHorarioEditar({ ...horario });
        setShowEditModal(true);
    };

    // Validar conflictos de horario al editar
    const validarConflictosEdicion = (horarioEditado: HorarioExtendido): { valido: boolean; mensaje: string } => {
        // Validar que las horas sean válidas
        if (horarioEditado.hora_inicio >= horarioEditado.hora_fin) {
            return { valido: false, mensaje: 'La hora de fin debe ser mayor que la hora de inicio' };
        }

        // Validar conflictos de docente (si hay docente asignado)
        if (horarioEditado.docente_id) {
            const horariosDocenteSuperpuestos = horarios.filter(h =>
                h.id !== horarioEditado.id && // Excluir el horario que se está editando
                h.docente_id === horarioEditado.docente_id &&
                h.dia_semana === horarioEditado.dia_semana &&
                (
                    // El inicio del horario editado está dentro de un horario existente (sin incluir el límite final)
                    (horarioEditado.hora_inicio >= h.hora_inicio && horarioEditado.hora_inicio < h.hora_fin) ||
                    // El fin del horario editado está dentro de un horario existente (sin incluir el límite inicial)
                    (horarioEditado.hora_fin > h.hora_inicio && horarioEditado.hora_fin <= h.hora_fin) ||
                    // El horario editado envuelve completamente un horario existente
                    (horarioEditado.hora_inicio < h.hora_inicio && horarioEditado.hora_fin > h.hora_fin)
                )
            );

            if (horariosDocenteSuperpuestos.length > 0) {
                // Verificar si hay algún horario que NO sea exactamente la misma clase
                const conflictoReal = horariosDocenteSuperpuestos.find(h =>
                    // Es un conflicto si NO coinciden asignatura, hora inicio o hora fin
                    h.asignatura_id !== horarioEditado.asignatura_id ||
                    h.hora_inicio !== horarioEditado.hora_inicio ||
                    h.hora_fin !== horarioEditado.hora_fin
                );

                if (conflictoReal) {
                    // No es la misma clase, hay un conflicto real de docente
                    const diaNombre = dias.find(d => d.toLowerCase() === horarioEditado.dia_semana.toLowerCase()) || horarioEditado.dia_semana;
                    return {
                        valido: false,
                        mensaje: `El docente ${horarioEditado.docente_nombre} ya tiene una clase el ${diaNombre} de ${conflictoReal.hora_inicio} a ${conflictoReal.hora_fin}`
                    };
                }
                // Si todos los horarios son la misma clase, permitir (el docente puede dar la misma clase a múltiples grupos)
            }
        }

        // Validar conflictos de espacio y capacidad compartida
        const horariosSuperpuestos = horarios.filter(h =>
            h.id !== horarioEditado.id && // Excluir el horario que se está editando
            h.espacio_id === horarioEditado.espacio_id &&
            h.dia_semana === horarioEditado.dia_semana &&
            (
                // El inicio del horario editado está dentro de un horario existente (sin incluir el límite final)
                (horarioEditado.hora_inicio >= h.hora_inicio && horarioEditado.hora_inicio < h.hora_fin) ||
                // El fin del horario editado está dentro de un horario existente (sin incluir el límite inicial)
                (horarioEditado.hora_fin > h.hora_inicio && horarioEditado.hora_fin <= h.hora_fin) ||
                // El horario editado envuelve completamente un horario existente
                (horarioEditado.hora_inicio < h.hora_inicio && horarioEditado.hora_fin > h.hora_fin)
            )
        );

        if (horariosSuperpuestos.length > 0) {
            // Verificar si comparten EXACTAMENTE la misma asignatura, docente, hora_inicio y hora_fin
            const horarioCompartible = horariosSuperpuestos.find(h =>
                h.asignatura_id === horarioEditado.asignatura_id &&
                h.docente_id === horarioEditado.docente_id &&
                h.hora_inicio === horarioEditado.hora_inicio &&
                h.hora_fin === horarioEditado.hora_fin
            );

            if (horarioCompartible) {
                // Es la misma clase, verificar capacidad total del espacio
                const espacioActual = espacios.find(e => e.id === horarioEditado.espacio_id);
                if (espacioActual) {
                    // Sumar todos los estudiantes de horarios que comparten exactamente el mismo horario
                    const totalEstudiantesExistentes = horariosSuperpuestos
                        .filter(h =>
                            h.asignatura_id === horarioEditado.asignatura_id &&
                            h.docente_id === horarioEditado.docente_id &&
                            h.hora_inicio === horarioEditado.hora_inicio &&
                            h.hora_fin === horarioEditado.hora_fin
                        )
                        .reduce((sum, h) => sum + (h.cantidad_estudiantes || 0), 0);

                    const totalEstudiantes = totalEstudiantesExistentes + (horarioEditado.cantidad_estudiantes || 0);

                    if (totalEstudiantes > espacioActual.capacidad) {
                        const gruposCompartiendo = horariosSuperpuestos
                            .filter(h =>
                                h.asignatura_id === horarioEditado.asignatura_id &&
                                h.docente_id === horarioEditado.docente_id &&
                                h.hora_inicio === horarioEditado.hora_inicio &&
                                h.hora_fin === horarioEditado.hora_fin
                            )
                            .map(h => h.grupo_nombre)
                            .join(', ');

                        const diaNombre = dias.find(d => d.toLowerCase() === horarioEditado.dia_semana.toLowerCase()) || horarioEditado.dia_semana;
                        return {
                            valido: false,
                            mensaje: `El espacio ${espacioActual.nombre} no tiene capacidad suficiente. Ya hay ${totalEstudiantesExistentes} estudiantes del grupo(s) ${gruposCompartiendo} en esta clase. Total: ${totalEstudiantes}/${espacioActual.capacidad}`
                        };
                    }
                    // Si la capacidad es suficiente, permitir compartir el espacio
                }
            } else {
                // No es la misma clase (diferente asignatura, docente u horario), hay conflicto
                const conflicto = horariosSuperpuestos[0];
                const diaNombre = dias.find(d => d.toLowerCase() === horarioEditado.dia_semana.toLowerCase()) || horarioEditado.dia_semana;
                return {
                    valido: false,
                    mensaje: `El espacio ${horarioEditado.espacio_nombre} ya está ocupado el ${diaNombre} de ${conflicto.hora_inicio} a ${conflicto.hora_fin} por el grupo ${conflicto.grupo_nombre}`
                };
            }
        }

        return { valido: true, mensaje: '' };
    };

    const handleGuardarEdicion = async () => {
        if (!horarioEditar) return;

        // Validar conflictos antes de guardar
        const validacion = validarConflictosEdicion(horarioEditar);
        if (!validacion.valido) {
            showNotification(validacion.mensaje, 'error');
            return;
        }

        try {
            setLoading(true);
            await horarioService.update({
                id: horarioEditar.id,
                grupo_id: horarioEditar.grupo_id,
                asignatura_id: horarioEditar.asignatura_id,
                docente_id: horarioEditar.docente_id,
                espacio_id: horarioEditar.espacio_id,
                dia_semana: horarioEditar.dia_semana,
                hora_inicio: horarioEditar.hora_inicio,
                hora_fin: horarioEditar.hora_fin,
                cantidad_estudiantes: horarioEditar.cantidad_estudiantes
            });
            
            showNotification('✅ Horario actualizado correctamente', 'success');
            await loadData();
            setShowEditModal(false);
            setHorarioEditar(null);
        } catch (error) {
            showNotification(
                `Error al actualizar el horario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async (id: number) => {
        if (confirm('¿Está seguro de eliminar este horario?')) {
            try {
                setLoading(true);
                await horarioService.delete({ id });
                showNotification('✅ Horario eliminado correctamente', 'success');
                await loadData();
            } catch (error) {
                showNotification(
                    `Error al eliminar el horario: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                    'error'
                );
            } finally {
                setLoading(false);
            }
        }
    };

    // Abrir modal de confirmación para eliminar grupo
    const handleAbrirModalEliminarGrupo = (grupo: GrupoAgrupado) => {
        setGrupoAEliminar(grupo);
        setShowDeleteGrupoModal(true);
        setProgresoEliminacion(0);
    };

    // Eliminar grupo completo con progreso
    const handleEliminarGrupoCompleto = async () => {
        if (!grupoAEliminar) return;

        try {
            setEliminandoGrupo(true);
            const totalClases = grupoAEliminar.horarios.length;
            let clasesEliminadas = 0;

            for (const horario of grupoAEliminar.horarios) {
                await horarioService.delete({ id: horario.id });
                clasesEliminadas++;
                setProgresoEliminacion(Math.round((clasesEliminadas / totalClases) * 100));
                
                // Pequeño delay para mostrar la animación
                await new Promise(resolve => setTimeout(resolve, 200));
            }

            showNotification(`✅ Grupo ${grupoAEliminar.grupo} eliminado correctamente (${totalClases} clases)`, 'success');
            
            // Esperar un momento antes de cerrar para mostrar el 100%
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setShowDeleteGrupoModal(false);
            setGrupoAEliminar(null);
            await loadData();
        } catch (error) {
            showNotification(
                `Error al eliminar el grupo: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setEliminandoGrupo(false);
            setProgresoEliminacion(0);
        }
    };

    const limpiarFiltros = () => {
        setFiltroFacultad('all');
        setFiltroPrograma('all');
        setFiltroGrupo('all');
        setFiltroSemestre('all');
    };

    const limpiarFiltrosFusionados = () => {
        setFiltroFusionadoDia('all');
        setFiltroFusionadoAsignatura('all');
        setFiltroFusionadoDocente('all');
        setFiltroFusionadoEspacio('all');
    };

    // Funciones para selección múltiple
    const toggleSeleccion = (id: number) => {
        const nuevaSeleccion = new Set(horariosSeleccionados);
        if (nuevaSeleccion.has(id)) {
            nuevaSeleccion.delete(id);
        } else {
            nuevaSeleccion.add(id);
        }
        setHorariosSeleccionados(nuevaSeleccion);
    };

    const toggleSeleccionarTodos = () => {
        if (seleccionarTodos) {
            setHorariosSeleccionados(new Set());
            setSeleccionarTodos(false);
        } else {
            const todosLosIds = new Set(horariosFiltrados.map(h => h.id));
            setHorariosSeleccionados(todosLosIds);
            setSeleccionarTodos(true);
        }
    };

    const eliminarSeleccionados = async () => {
        if (horariosSeleccionados.size === 0) {
            showNotification('No hay horarios seleccionados', 'error');
            return;
        }

        if (confirm(`¿Está seguro de eliminar ${horariosSeleccionados.size} horario(s)?`)) {
            try {
                setLoading(true);
                let eliminados = 0;
                
                for (const id of Array.from(horariosSeleccionados)) {
                    try {
                        await horarioService.delete({ id });
                        eliminados++;
                    } catch (error) {
                        console.error(`Error eliminando horario ${id}:`, error);
                    }
                }

                if (eliminados > 0) {
                    showNotification(`✅ ${eliminados} horario(s) eliminado(s) correctamente`, 'success');
                    await loadData();
                    setHorariosSeleccionados(new Set());
                    setSeleccionarTodos(false);
                } else {
                    showNotification('Error al eliminar los horarios', 'error');
                }
            } catch (error) {
                showNotification('Error al eliminar los horarios', 'error');
            } finally {
                setLoading(false);
            }
        }
    };

    const getNombrePrograma = (programaId: number) => {
        const programa = programas.find(p => p.id === programaId);
        return programa?.nombre || 'N/A';
    };

    const getNombreEspacio = (espacioId: number) => {
        const espacio = espacios.find(e => e.id === espacioId);
        return espacio?.nombre || 'N/A';
    };

    // Toggle para expandir/colapsar grupos en Modificación
    const toggleGrupoExpandido = (grupoKey: string) => {
        const nuevosExpandidos = new Set(gruposExpandidos);
        if (nuevosExpandidos.has(grupoKey)) {
            nuevosExpandidos.delete(grupoKey);
        } else {
            nuevosExpandidos.add(grupoKey);
        }
        setGruposExpandidos(nuevosExpandidos);
    };

    const handleDescargarPDF = async () => {
        showNotification('Preparando descarga...', 'info');

        try {
            // Usar horarios filtrados según los filtros aplicados
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/horario/exportar-pdf/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    horarios: horariosFiltrados
                })
            });

            if (!response.ok) {
                throw new Error('Error al generar PDF');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `horarios_centro.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('¡Horarios descargados exitosamente en PDF!', 'success');
        } catch (error) {
            console.error('Error al descargar PDF:', error);
            showNotification('Error al descargar el PDF', 'error');
        }
    };

    const handleDescargarExcel = async () => {
        showNotification('Preparando descarga...', 'info');

        try {
            // Usar horarios filtrados según los filtros aplicados
            const apiUrl = import.meta.env.VITE_API_URL;
            const response = await fetch(`${apiUrl}/horario/exportar-excel/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    horarios: horariosFiltrados
                })
            });

            if (!response.ok) {
                throw new Error('Error al generar Excel');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `horarios_centro.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            showNotification('¡Horarios descargados exitosamente en Excel!', 'success');
        } catch (error) {
            console.error('Error al descargar Excel:', error);
            showNotification('Error al descargar el Excel', 'error');
        }
    };

    return {
        activeTab, setActiveTab,
        loading,
        horarios,
        horariosFusionados,
        grupos,
        facultades,
        programas,
        espacios,
        filtroFacultad, setFiltroFacultad,
        filtroPrograma, setFiltroPrograma,
        filtroGrupo, setFiltroGrupo,
        filtroSemestre, setFiltroSemestre,
        showEditModal, setShowEditModal,
        horarioEditar, setHorarioEditar,
        showDetallesModal, setShowDetallesModal,
        grupoDetalles, setGrupoDetalles,
        horariosSeleccionados,
        seleccionarTodos,
        gruposExpandidos,
        loadData,
        generarHoras,
        obtenerClaseEnHora,
        agruparHorarios,
        horariosFiltrados,
        gruposAgrupados,
        gruposUnicos,
        semestresUnicos,
        programasFiltrados,
        handleVerDetalles,
        handleEditar,
        handleGuardarEdicion,
        handleEliminar,
        limpiarFiltros,
        toggleSeleccion,
        toggleSeleccionarTodos,
        eliminarSeleccionados,
        getNombrePrograma,
        getNombreEspacio,
        toggleGrupoExpandido,
        handleDescargarPDF,
        handleDescargarExcel,
        showDeleteGrupoModal, setShowDeleteGrupoModal,
        grupoAEliminar, setGrupoAEliminar,
        eliminandoGrupo,
        progresoEliminacion,
        handleAbrirModalEliminarGrupo,
        handleEliminarGrupoCompleto,
        dias,
        notification,
        // Filtros de horarios fusionados
        filtroFusionadoDia, setFiltroFusionadoDia,
        filtroFusionadoAsignatura, setFiltroFusionadoAsignatura,
        filtroFusionadoDocente, setFiltroFusionadoDocente,
        filtroFusionadoEspacio, setFiltroFusionadoEspacio,
        diasFusionadosUnicos,
        asignaturasFusionadasUnicas,
        docentesFusionadosUnicos,
        espaciosFusionadosUnicos,
        horariosFusionadosFiltrados,
        limpiarFiltrosFusionados
    };
}
