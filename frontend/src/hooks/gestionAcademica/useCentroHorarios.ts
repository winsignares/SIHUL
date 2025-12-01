import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useNotification } from '../../share/notificationBanner';
import { horarioService } from '../../services/horarios/horariosAPI';
import { facultadService, type Facultad } from '../../services/facultades/facultadesAPI';
import { programaService, type Programa } from '../../services/programas/programaAPI';
import { espacioService, type EspacioFisico } from '../../services/espacios/espaciosAPI';
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

export function useCentroHorarios() {
    const { user, role } = useAuth();
    const { notification, showNotification } = useNotification();
    const [searchParams] = useSearchParams();
    const modeParam = searchParams.get('mode');
    const initialMode = modeParam === 'consulta' ? 'consulta' : (modeParam === 'modificacion' ? 'modificacion' : 'crear');
    const [activeTab, setActiveTab] = useState<'consulta' | 'crear' | 'modificacion'>(initialMode);
    const [loading, setLoading] = useState(false);
    const [horarios, setHorarios] = useState<HorarioExtendido[]>([]);
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);

    // Filtros
    const [filtroFacultad, setFiltroFacultad] = useState<string>('all');
    const [filtroPrograma, setFiltroPrograma] = useState<string>('all');
    const [filtroGrupo, setFiltroGrupo] = useState<string>('all');
    const [filtroSemestre, setFiltroSemestre] = useState<string>('all');

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

    const limpiarFiltros = () => {
        setFiltroFacultad('all');
        setFiltroPrograma('all');
        setFiltroGrupo('all');
        setFiltroSemestre('all');
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
            // Usar todos los horarios cargados
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/horario/exportar-pdf/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    horarios: horarios
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
            // Usar todos los horarios cargados
            const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const response = await fetch(`${apiUrl}/horario/exportar-excel/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    horarios: horarios
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
        dias,
        notification
    };
}
