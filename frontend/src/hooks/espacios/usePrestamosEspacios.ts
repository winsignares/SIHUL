import { useState, useEffect, useMemo } from 'react';
import type { PrestamoEspacioUI as PrestamoEspacio } from '../../models';
import { Clock, Check, X, TrendingUp } from 'lucide-react';
import { prestamoService } from '../../services/prestamos/prestamoAPI';
import { prestamosPublicAPI } from '../../services/prestamos/prestamosPublicAPI';
import { showNotification } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getPageNumbers, getPageSlice, getTotalPages, normalizePage, PAGE_SIZE_DEFAULT } from '../gestionAcademica/paginacion';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const PRESTAMOS_CACHE_KEY = 'prestamos-espacios-admin';

const getErrorMessage = (error: unknown, fallback: string): string => {
    if (error && typeof error === 'object' && 'message' in error) {
        const msg = (error as { message?: unknown }).message;
        if (typeof msg === 'string' && msg.trim()) {
            return msg;
        }
    }
    if (error instanceof Error && error.message) {
        return error.message;
    }
    return fallback;
};

// Helper para extraer el ID numérico y el tipo de préstamo del ID único
const parseUniqueId = (uniqueId: string): { tipo: 'autenticado' | 'publico', id: number } | null => {
    const match = uniqueId.match(/^(auth|public)-(\d+)$/);
    if (!match) return null;
    
    return {
        tipo: match[1] === 'auth' ? 'autenticado' : 'publico',
        id: parseInt(match[2])
    };
};

export function usePrestamosEspacios() {
    const PAGE_SIZE = 5;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterFechaHora, setFilterFechaHora] = useState('todos');
    const [verSolicitudDialog, setVerSolicitudDialog] = useState<string | null>(null);
    const [comentariosAccion, setComentariosAccion] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [prestamoEditando, setPrestamoEditando] = useState<PrestamoEspacio | null>(null);
    const [prestamos, setPrestamos] = useState<PrestamoEspacio[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { user } = useAuth();

    const normalizarEstado = (estado: PrestamoEspacio['estado']) => {
        return estado.charAt(0).toUpperCase() + estado.slice(1);
    };

    // Cargar datos iniciales
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedPrestamos = force
                ? null
                : getSessionCacheData<PrestamoEspacio[]>(PRESTAMOS_CACHE_KEY, activeToken);

            // Reutilizar datos cargados en esta sesión si no se fuerza recarga.
            if (cachedPrestamos) {
                setPrestamos(cachedPrestamos);
                return;
            }

            setLoading(true);

            // Cargar TODOS los préstamos (autenticados + públicos) desde la API combinada
            const prestamosResponse = await prestamoService.listarTodosPrestamosAdmin();

            // Transformar datos del backend al formato UI
            const prestamosUI: PrestamoEspacio[] = prestamosResponse.prestamos.map(p => {
                return {
                    id: p.id?.toString() || '',
                    solicitante: p.usuario_nombre || 'Usuario No Disponible',
                    email: p.usuario_correo || '',
                    telefono: p.telefono || '',
                    espacio: p.espacio_nombre || `Espacio ${p.espacio_id}`,
                    espacio_id: p.espacio_id,
                    fecha: p.fecha,
                    horaInicio: p.hora_inicio.substring(0, 5), // HH:MM
                    horaFin: p.hora_fin.substring(0, 5), // HH:MM
                    motivo: p.motivo || '',
                    tipoEvento: p.tipo_actividad_nombre || 'Evento',
                    tipo_actividad_id: p.tipo_actividad_id,
                    asistentes: p.asistentes || 0,
                    recursosNecesarios: p.recursos?.map(r => r.recurso_nombre || '') || [],
                    estado: p.estado.toLowerCase() as 'pendiente' | 'aprobado' | 'rechazado',
                    fechaSolicitud: p.fecha + ' ' + p.hora_inicio,
                    comentariosAdmin: '', // No disponible en el backend actual
                    administradorNombre: p.administrador_nombre || undefined,
                    administrador_id: p.administrador_id ?? undefined,
                    identificacionSolicitante: p.solicitante_publico_identificacion || undefined,
                    es_recurrente: Boolean(p.es_recurrente),
                    frecuencia: p.frecuencia || 'none',
                    intervalo: p.intervalo || 1,
                    dias_semana: Array.isArray(p.dias_semana) ? p.dias_semana : [],
                    fin_repeticion_tipo: p.fin_repeticion_tipo || 'never',
                    fin_repeticion_fecha: p.fin_repeticion_fecha || null,
                    fin_repeticion_ocurrencias: p.fin_repeticion_ocurrencias ?? null,
                    serie_id: p.serie_id || null,
                    es_ocurrencia_generada: Boolean(p.es_ocurrencia_generada),
                    prestamo_padre_id: p.prestamo_padre_id ?? null
                };
            });

            setPrestamos(prestamosUI);
            setSessionCacheData(PRESTAMOS_CACHE_KEY, activeToken, prestamosUI);
        } catch (error) {
            showNotification({
                message: `Error al cargar préstamos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const aprobarSolicitud = async (id: string, comentarios: string) => {
        try {
            setLoading(true);

            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }

            // Extraer el ID numérico y el tipo de préstamo del ID único
            const parsed = parseUniqueId(id);
            if (!parsed) {
                throw new Error('ID de préstamo inválido');
            }

            const { tipo, id: numericId } = parsed;

            // Obtener datos completos del préstamo desde el backend
            let prestamoCompleto;
            if (tipo === 'publico') {
                // Usar endpoint de préstamos públicos
                const response = await fetch(`/api/prestamos/public/${numericId}/`);
                if (!response.ok) throw new Error('Error al obtener préstamo público');
                prestamoCompleto = await response.json();
            } else {
                // Usar endpoint de préstamos autenticados
                prestamoCompleto = await prestamoService.obtenerPrestamo(numericId);
            }

            // Actualizar el estado y registrar el administrador que aprobó
            if (tipo === 'publico') {
                // Actualizar préstamo público
                const response = await fetch(`/api/prestamos/public/update/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: numericId,
                        espacio_id: prestamoCompleto.espacio_id,
                        nombre_solicitante: prestamoCompleto.usuario_nombre,
                        correo_solicitante: prestamoCompleto.usuario_correo,
                        telefono_solicitante: prestamoCompleto.telefono,
                        administrador_id: user.id,
                        tipo_actividad_id: prestamoCompleto.tipo_actividad_id,
                        fecha: prestamoCompleto.fecha,
                        hora_inicio: prestamoCompleto.hora_inicio,
                        hora_fin: prestamoCompleto.hora_fin,
                        motivo: prestamoCompleto.motivo,
                        asistentes: prestamoCompleto.asistentes,
                        estado: 'Aprobado'
                    })
                });
                if (!response.ok) throw new Error('Error al actualizar préstamo público');
            } else {
                // Actualizar préstamo autenticado
                const updatePayload: any = {
                    id: numericId,
                    espacio_id: prestamoCompleto.espacio_id,
                    administrador_id: user.id,
                    tipo_actividad_id: prestamoCompleto.tipo_actividad_id,
                    fecha: prestamoCompleto.fecha,
                    hora_inicio: prestamoCompleto.hora_inicio,
                    hora_fin: prestamoCompleto.hora_fin,
                    motivo: prestamoCompleto.motivo,
                    asistentes: prestamoCompleto.asistentes,
                    telefono: prestamoCompleto.telefono,
                    estado: 'Aprobado'
                };
                
                // Solo incluir usuario_id si existe
                if (prestamoCompleto.usuario_id) {
                    updatePayload.usuario_id = prestamoCompleto.usuario_id;
                }
                
                await prestamoService.actualizarPrestamo(updatePayload);
            }

            // Recargar datos para obtener el estado actualizado
            await loadData({ force: true });

            setVerSolicitudDialog(null);
            setComentariosAccion('');

            showNotification({
                message: '✅ Solicitud aprobada correctamente',
                type: 'success'
            });
        } catch (error) {
            showNotification({
                message: `Error al aprobar solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const rechazarSolicitud = async (id: string, comentarios: string) => {
        if (!comentarios.trim()) {
            showNotification({
                message: 'Debe proporcionar un motivo de rechazo',
                type: 'error'
            });
            return;
        }

        try {
            setLoading(true);

            if (!user?.id) {
                throw new Error('Usuario no autenticado');
            }

            // Extraer el ID numérico y el tipo de préstamo del ID único
            const parsed = parseUniqueId(id);
            if (!parsed) {
                throw new Error('ID de préstamo inválido');
            }

            const { tipo, id: numericId } = parsed;

            // Obtener datos completos del préstamo desde el backend
            let prestamoCompleto;
            if (tipo === 'publico') {
                // Usar endpoint de préstamos públicos
                const response = await fetch(`/api/prestamos/public/${numericId}/`);
                if (!response.ok) throw new Error('Error al obtener préstamo público');
                prestamoCompleto = await response.json();
            } else {
                // Usar endpoint de préstamos autenticados
                prestamoCompleto = await prestamoService.obtenerPrestamo(numericId);
            }

            // Actualizar el estado y registrar el administrador que rechazó
            if (tipo === 'publico') {
                // Actualizar préstamo público
                const response = await fetch(`/api/prestamos/public/update/`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: numericId,
                        espacio_id: prestamoCompleto.espacio_id,
                        nombre_solicitante: prestamoCompleto.usuario_nombre,
                        correo_solicitante: prestamoCompleto.usuario_correo,
                        telefono_solicitante: prestamoCompleto.telefono,
                        administrador_id: user.id,
                        tipo_actividad_id: prestamoCompleto.tipo_actividad_id,
                        fecha: prestamoCompleto.fecha,
                        hora_inicio: prestamoCompleto.hora_inicio,
                        hora_fin: prestamoCompleto.hora_fin,
                        motivo: prestamoCompleto.motivo,
                        asistentes: prestamoCompleto.asistentes,
                        estado: 'Rechazado'
                    })
                });
                if (!response.ok) throw new Error('Error al actualizar préstamo público');
            } else {
                // Actualizar préstamo autenticado
                const updatePayload: any = {
                    id: numericId,
                    espacio_id: prestamoCompleto.espacio_id,
                    administrador_id: user.id,
                    tipo_actividad_id: prestamoCompleto.tipo_actividad_id,
                    fecha: prestamoCompleto.fecha,
                    hora_inicio: prestamoCompleto.hora_inicio,
                    hora_fin: prestamoCompleto.hora_fin,
                    motivo: prestamoCompleto.motivo,
                    asistentes: prestamoCompleto.asistentes,
                    telefono: prestamoCompleto.telefono,
                    estado: 'Rechazado'
                };
                
                // Solo incluir usuario_id si existe
                if (prestamoCompleto.usuario_id) {
                    updatePayload.usuario_id = prestamoCompleto.usuario_id;
                }
                
                await prestamoService.actualizarPrestamo(updatePayload);
            }

            // Recargar datos para obtener el estado actualizado
            await loadData({ force: true });

            setVerSolicitudDialog(null);
            setComentariosAccion('');

            showNotification({
                message: '✅ Solicitud rechazada correctamente',
                type: 'success'
            });
        } catch (error) {
            showNotification({
                message: `Error al rechazar solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const iniciarEdicion = (prestamo: PrestamoEspacio) => {
        setModoEdicion(true);
        setPrestamoEditando({ ...prestamo });
        setVerSolicitudDialog(prestamo.id);
    };

    const cancelarEdicion = () => {
        setModoEdicion(false);
        setPrestamoEditando(null);
    };

    const guardarEdicion = async () => {
        if (!prestamoEditando) return;

        try {
            setLoading(true);

            const parsed = parseUniqueId(prestamoEditando.id);
            if (!parsed) {
                throw new Error('ID de préstamo inválido');
            }

            const { tipo, id: numericId } = parsed;
            let espacioId = prestamoEditando.espacio_id;
            let tipoActividadId = prestamoEditando.tipo_actividad_id;

            // Recuperar IDs críticos cuando no vienen en el estado local del préstamo editando.
            if (!espacioId || !tipoActividadId) {
                if (tipo === 'publico') {
                    const detallePublico = await prestamosPublicAPI.obtenerSolicitud(numericId);
                    espacioId = detallePublico.espacio_id;
                    tipoActividadId = detallePublico.tipo_actividad_id;
                } else {
                    const detalleAuth = await prestamoService.obtenerPrestamo(numericId);
                    espacioId = detalleAuth.espacio_id;
                    tipoActividadId = detalleAuth.tipo_actividad_id;
                }
            }

            if (!espacioId || !tipoActividadId) {
                throw new Error('No fue posible resolver espacio y tipo de actividad para actualizar el préstamo');
            }

            if (prestamoEditando.horaFin <= prestamoEditando.horaInicio) {
                throw new Error('La hora fin debe ser mayor a la hora inicio');
            }

            if (prestamoEditando.es_recurrente) {
                if (!prestamoEditando.frecuencia || prestamoEditando.frecuencia === 'none') {
                    throw new Error('Debe seleccionar una frecuencia de repetición');
                }
                if ((prestamoEditando.intervalo || 0) < 1) {
                    throw new Error('El intervalo debe ser mayor o igual a 1');
                }
                if (prestamoEditando.frecuencia === 'weekly' && (!prestamoEditando.dias_semana || prestamoEditando.dias_semana.length < 1)) {
                    throw new Error('Seleccione al menos un día para repetición semanal');
                }
                if (prestamoEditando.fin_repeticion_tipo === 'until_date' && !prestamoEditando.fin_repeticion_fecha) {
                    throw new Error('Debe seleccionar fecha de fin de repetición');
                }
                if (
                    prestamoEditando.fin_repeticion_tipo === 'count' &&
                    (!prestamoEditando.fin_repeticion_ocurrencias || prestamoEditando.fin_repeticion_ocurrencias < 1)
                ) {
                    throw new Error('El número de repeticiones debe ser mayor que 0');
                }
            }

            const recurrencePayload = prestamoEditando.es_recurrente
                ? {
                    es_recurrente: true,
                    frecuencia: prestamoEditando.frecuencia,
                    intervalo: prestamoEditando.intervalo,
                    dias_semana: prestamoEditando.frecuencia === 'weekly' ? (prestamoEditando.dias_semana || []) : undefined,
                    fin_repeticion_tipo: prestamoEditando.fin_repeticion_tipo,
                    fin_repeticion_fecha: prestamoEditando.fin_repeticion_tipo === 'until_date' ? prestamoEditando.fin_repeticion_fecha : undefined,
                    fin_repeticion_ocurrencias: prestamoEditando.fin_repeticion_tipo === 'count' ? prestamoEditando.fin_repeticion_ocurrencias : undefined,
                  }
                : { es_recurrente: false };

            if (tipo === 'publico') {
                await prestamosPublicAPI.actualizarSolicitud({
                    id: numericId,
                    espacio_id: espacioId,
                    nombre_solicitante: prestamoEditando.solicitante,
                    correo_solicitante: prestamoEditando.email,
                    telefono_solicitante: prestamoEditando.telefono || '',
                    identificacion_solicitante: prestamoEditando.identificacionSolicitante,
                    administrador_id: prestamoEditando.administrador_id || null,
                    tipo_actividad_id: tipoActividadId,
                    fecha: prestamoEditando.fecha,
                    hora_inicio: `${prestamoEditando.horaInicio}:00`,
                    hora_fin: `${prestamoEditando.horaFin}:00`,
                    motivo: prestamoEditando.motivo,
                    asistentes: prestamoEditando.asistentes,
                    estado: normalizarEstado(prestamoEditando.estado) as 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido',
                    ...recurrencePayload
                });
            } else {
                const prestamoActual = await prestamoService.obtenerPrestamo(numericId);

                await prestamoService.actualizarPrestamo({
                    id: numericId,
                    espacio_id: espacioId,
                    usuario_id: prestamoActual.usuario_id,
                    administrador_id: prestamoActual.administrador_id || user?.id || null,
                    tipo_actividad_id: tipoActividadId,
                    fecha: prestamoEditando.fecha,
                    hora_inicio: `${prestamoEditando.horaInicio}:00`,
                    hora_fin: `${prestamoEditando.horaFin}:00`,
                    motivo: prestamoEditando.motivo,
                    asistentes: prestamoEditando.asistentes,
                    telefono: prestamoEditando.telefono || '',
                    estado: normalizarEstado(prestamoEditando.estado) as 'Pendiente' | 'Aprobado' | 'Rechazado' | 'Vencido',
                    ...recurrencePayload
                });
            }

            await loadData({ force: true });
            cancelarEdicion();
            showNotification({
                message: '✅ Solicitud actualizada correctamente',
                type: 'success'
            });
        } catch (error) {
            showNotification({
                message: `Error al actualizar solicitud: ${getErrorMessage(error, 'Error desconocido')}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const eliminarSolicitud = async (id: string) => {
        try {
            setLoading(true);

            const parsed = parseUniqueId(id);
            if (!parsed) {
                throw new Error('ID de préstamo inválido');
            }

            const { tipo, id: numericId } = parsed;

            if (tipo === 'publico') {
                await prestamosPublicAPI.eliminarSolicitud(numericId);
            } else {
                await prestamoService.eliminarPrestamo(numericId);
            }

            await loadData({ force: true });

            if (verSolicitudDialog === id) {
                setVerSolicitudDialog(null);
            }
            cancelarEdicion();

            showNotification({
                message: '✅ Solicitud eliminada correctamente',
                type: 'success'
            });
        } catch (error) {
            showNotification({
                message: `Error al eliminar solicitud: ${getErrorMessage(error, 'Error desconocido')}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredPrestamos = useMemo(() => {
        return prestamos.filter(p => {
            const matchesSearch = p.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.espacio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.tipoEvento.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;

            let matchesFechaHora = true;
            if (filterFechaHora !== 'todos') {
                const now = new Date();
                const prestamoFecha = new Date(p.fecha + ' ' + p.horaInicio);

                if (filterFechaHora === 'hoy') {
                    matchesFechaHora = prestamoFecha.toDateString() === now.toDateString();
                } else if (filterFechaHora === 'esta-semana') {
                    const inicioSemana = new Date(now);
                    inicioSemana.setDate(now.getDate() - now.getDay());
                    const finSemana = new Date(inicioSemana);
                    finSemana.setDate(inicioSemana.getDate() + 6);
                    matchesFechaHora = prestamoFecha >= inicioSemana && prestamoFecha <= finSemana;
                } else if (filterFechaHora === 'este-mes') {
                    matchesFechaHora = prestamoFecha.getMonth() === now.getMonth() && prestamoFecha.getFullYear() === now.getFullYear();
                } else if (filterFechaHora === 'proximos') {
                    matchesFechaHora = prestamoFecha >= now;
                } else if (filterFechaHora === 'pasados') {
                    matchesFechaHora = prestamoFecha < now;
                }
            }

            return matchesSearch && matchesEstado && matchesFechaHora;
        });
    }, [prestamos, searchTerm, filterEstado, filterFechaHora]);

    const statsData = useMemo(() => [
        {
            title: 'Pendientes',
            value: prestamos.filter(p => p.estado === 'pendiente').length,
            icon: Clock,
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
            textColor: 'text-yellow-600'
        },
        {
            title: 'Aprobadas',
            value: prestamos.filter(p => p.estado === 'aprobado').length,
            icon: Check,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
            textColor: 'text-green-600'
        },
        {
            title: 'Rechazadas',
            value: prestamos.filter(p => p.estado === 'rechazado').length,
            icon: X,
            color: 'from-red-500 to-rose-500',
            bgColor: 'bg-red-50 dark:bg-red-950/20',
            textColor: 'text-red-600'
        },
        {
            title: 'Total Solicitudes',
            value: prestamos.length,
            icon: TrendingUp,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
            textColor: 'text-blue-600'
        }
    ], [prestamos]);

    // ==================== PAGINACIÓN ====================

    const totalFilteredPrestamos = filteredPrestamos.length;
    const totalPages = getTotalPages(totalFilteredPrestamos, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages), [totalPages]);

    const paginatedPrestamos = useMemo(() => {
        return getPageSlice(filteredPrestamos, currentPage, PAGE_SIZE);
    }, [filteredPrestamos, currentPage, PAGE_SIZE]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterEstado, filterFechaHora]);

    useEffect(() => {
        setCurrentPage((prev) => normalizePage(prev, totalPages));
    }, [totalPages]);

    const goToPage = (page: number) => {
        setCurrentPage(normalizePage(page, totalPages));
    };

    const goToNextPage = () => {
        goToPage(currentPage + 1);
    };

    const goToPrevPage = () => {
        goToPage(currentPage - 1);
    };

    return {
        searchTerm,
        setSearchTerm,
        filterEstado,
        setFilterEstado,
        filterFechaHora,
        setFilterFechaHora,
        verSolicitudDialog,
        setVerSolicitudDialog,
        comentariosAccion,
        setComentariosAccion,
        modoEdicion,
        prestamoEditando,
        setPrestamoEditando,
        prestamos,
        filteredPrestamos,
        paginatedPrestamos,
        totalFilteredPrestamos,
        currentPage,
        totalPages,
        pageNumbers,
        pageSize: PAGE_SIZE,
        goToPage,
        goToNextPage,
        goToPrevPage,
        statsData,
        aprobarSolicitud,
        rechazarSolicitud,
        iniciarEdicion,
        cancelarEdicion,
        guardarEdicion,
        eliminarSolicitud,
        loading,
        reloadData: () => loadData({ force: true })
    };
}
