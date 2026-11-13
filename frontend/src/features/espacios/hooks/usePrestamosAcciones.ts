import type { Dispatch, SetStateAction } from 'react';
import type { PrestamoEspacioUI as PrestamoEspacio } from '../../../models';
import { prestamoService } from '../../prestamos/services/prestamoAPI';
import { prestamosPublicAPI } from '../../prestamos/services/prestamosPublicAPI';
import { showNotification } from '../../../context/ThemeContext';
import type { useAuth } from '../../../context/AuthContext';
import { getErrorMessage, normalizarEstado, parseUniqueId } from './prestamosEspaciosUtils';

type Sesion = ReturnType<typeof useAuth>;

/** Acciones sobre las solicitudes de préstamo: aprobar, rechazar, editar y eliminar. */
export function usePrestamosAcciones({
    user, loadData, setLoading, setVerSolicitudDialog, setComentariosAccion, setModoEdicion,
    setPrestamoEditando, prestamoEditando, verSolicitudDialog,
}: {
    user: Sesion['user'];
    loadData: (opciones?: { force?: boolean }) => Promise<void>;
    setLoading: Dispatch<SetStateAction<boolean>>;
    setVerSolicitudDialog: Dispatch<SetStateAction<string | null>>;
    setComentariosAccion: Dispatch<SetStateAction<string>>;
    setModoEdicion: Dispatch<SetStateAction<boolean>>;
    setPrestamoEditando: Dispatch<SetStateAction<PrestamoEspacio | null>>;
    prestamoEditando: PrestamoEspacio | null;
    verSolicitudDialog: string | null;
}) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const aprobarSolicitud = async (id: string, _comentarios: string) => {
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

            // Actualizar el estado y registrar el administrador que aprobó
            if (tipo === 'publico') {
                await prestamosPublicAPI.cambiarEstadoSolicitud(numericId, 'Aprobado', user.id);
            } else {
                // Obtener datos completos del préstamo desde el backend
                const prestamoCompleto = await prestamoService.obtenerPrestamo(numericId);

                // Actualizar préstamo autenticado
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            setVerSolicitudDialog(null);
            setComentariosAccion('');

            showNotification({
                message: '✅ Solicitud aprobada correctamente',
                type: 'success'
            });

            await loadData({ force: true });
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

            // Actualizar el estado y registrar el administrador que rechazó
            if (tipo === 'publico') {
                await prestamosPublicAPI.cambiarEstadoSolicitud(numericId, 'Rechazado', user.id);
            } else {
                // Obtener datos completos del préstamo desde el backend
                const prestamoCompleto = await prestamoService.obtenerPrestamo(numericId);

                // Actualizar préstamo autenticado
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
            setVerSolicitudDialog(null);
            setComentariosAccion('');

            showNotification({
                message: '✅ Solicitud rechazada correctamente',
                type: 'success'
            });

            await loadData({ force: true });
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

            const recursosPayload = (prestamoEditando.recursos || []).map((r) => ({
                recurso_id: r.recurso_id,
                cantidad: r.cantidad
            }));

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
                    recursos: recursosPayload,
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
                    recursos: recursosPayload,
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

            showNotification({
                message: '✅ Solicitud actualizada correctamente',
                type: 'success'
            });

            setVerSolicitudDialog(null);
            cancelarEdicion();
            await loadData({ force: true });
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

            if (verSolicitudDialog === id) {
                setVerSolicitudDialog(null);
            }
            cancelarEdicion();

            showNotification({
                message: '✅ Solicitud eliminada correctamente',
                type: 'success'
            });

            await loadData({ force: true });
        } catch (error) {
            showNotification({
                message: `Error al eliminar solicitud: ${getErrorMessage(error, 'Error desconocido')}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return { aprobarSolicitud, rechazarSolicitud, iniciarEdicion, cancelarEdicion, guardarEdicion, eliminarSolicitud };
}
