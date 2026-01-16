import { useState, useEffect, useMemo } from 'react';
import type { PrestamoEspacioUI as PrestamoEspacio } from '../../models';
import { Clock, Check, X, TrendingUp } from 'lucide-react';
import { prestamoService } from '../../services/prestamos/prestamoAPI';
import { showNotification } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

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
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterFechaHora, setFilterFechaHora] = useState('todos');
    const [verSolicitudDialog, setVerSolicitudDialog] = useState<string | null>(null);
    const [comentariosAccion, setComentariosAccion] = useState('');
    const [prestamos, setPrestamos] = useState<PrestamoEspacio[]>([]);
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    // Cargar datos iniciales
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
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
                    fecha: p.fecha,
                    horaInicio: p.hora_inicio.substring(0, 5), // HH:MM
                    horaFin: p.hora_fin.substring(0, 5), // HH:MM
                    motivo: p.motivo || '',
                    tipoEvento: p.tipo_actividad_nombre || 'Evento',
                    asistentes: p.asistentes || 0,
                    recursosNecesarios: p.recursos?.map(r => r.recurso_nombre || '') || [],
                    estado: p.estado.toLowerCase() as 'pendiente' | 'aprobado' | 'rechazado',
                    fechaSolicitud: p.fecha + ' ' + p.hora_inicio,
                    comentariosAdmin: '', // No disponible en el backend actual
                    administradorNombre: p.administrador_nombre || undefined
                };
            });

            setPrestamos(prestamosUI);
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
            await loadData();

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
            await loadData();

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
        prestamos,
        filteredPrestamos,
        statsData,
        aprobarSolicitud,
        rechazarSolicitud,
        loading,
        reloadData: loadData
    };
}
