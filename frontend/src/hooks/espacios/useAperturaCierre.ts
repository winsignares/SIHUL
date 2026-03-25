import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { aperturaCierreService, type EspacioConHorarios, type HorarioEspacio } from '../../services/espacios/espaciosAPI';
import { toast } from 'sonner';
import { getPageNumbers, getPageSlice, getTotalPages, normalizePage, PAGE_SIZE_DEFAULT } from '../gestionAcademica/paginacion';

export interface HorarioPendientePaginado {
    key: string;
    espacio: EspacioConHorarios;
    horario: HorarioEspacio;
}

/**
 * Hook para gestión de apertura y cierre de salones
 * TODA la lógica de negocio está en el backend
 * Este hook solo se encarga de llamar al servicio y manejar el estado de la UI
 * 
 * Ahora incluye:
 * - Lista de espacios agrupados con sus horarios
 * - Sistema de notificaciones basado en tiempo restante
 * - Auto-refresh cada 30 segundos
 */
export function useAperturaCierre() {
    const PAGE_SIZE = PAGE_SIZE_DEFAULT;
    const [espacios, setEspacios] = useState<EspacioConHorarios[]>([]);
    const [horaActual, setHoraActual] = useState<string>('');
    const [diaActual, setDiaActual] = useState<string>('');
    const [fechaActual, setFechaActual] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // Ref para controlar qué notificaciones ya se mostraron
    const notificacionesMostradas = useRef<Set<string>>(new Set());

    /**
     * Función para cargar datos desde el backend
     * El backend se encarga de:
     * - Obtener el usuario autenticado
     * - Consultar sus espacios permitidos
     * - Calcular tiempos restantes para cada espacio
     * - Filtrar horarios y préstamos pendientes
     * - Ordenar por urgencia (tiempo restante)
     */
    const cargarDatos = useCallback(async () => {
        try {
            setError(null);
            const data = await aperturaCierreService.getProximos();

            setEspacios(data.espacios || []);
            setHoraActual(data.horaActual);
            setDiaActual(data.diaActual);
            setFechaActual(data.fechaActual);

            // Procesar notificaciones basadas en tiempo restante
            procesarNotificaciones(data.espacios || []);
        } catch (err: any) {
            console.error('Error cargando datos de apertura/cierre:', err);
            const errorMsg = err?.message || 'Error al cargar los datos';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    /**
     * Procesa notificaciones basadas en el tiempo restante
     * Muestra notificaciones a:
     * - APERTURA: 15 min, 5 min, 1 min
     * - CIERRE: 10 min, 5 min, 1 min
     */
    const procesarNotificaciones = (espacios: EspacioConHorarios[]) => {
        espacios.forEach(espacio => {
            espacio.horarios?.forEach(horario => {
                const minutos = horario.minutosRestantes;
                const key = `${espacio.idEspacio}-${horario.proximaAccion}`;

                // Determinar si debemos notificar
                let debeNotificar = false;
                let mensaje = '';

                if (horario.proximaAccion === 'apertura') {
                    // Notificaciones para apertura
                    if (minutos === 15 && !notificacionesMostradas.current.has(`${key}-15`)) {
                        debeNotificar = true;
                        mensaje = `⏰ ${espacio.nombreEspacio} debe abrirse en 15 minutos`;
                        notificacionesMostradas.current.add(`${key}-15`);
                    } else if (minutos === 5 && !notificacionesMostradas.current.has(`${key}-5`)) {
                        debeNotificar = true;
                        mensaje = `⚠️ ${espacio.nombreEspacio} debe abrirse en 5 minutos`;
                        notificacionesMostradas.current.add(`${key}-5`);
                    } else if (minutos === 1 && !notificacionesMostradas.current.has(`${key}-1`)) {
                        debeNotificar = true;
                        mensaje = `🚨 ${espacio.nombreEspacio} debe abrirse en 1 minuto`;
                        notificacionesMostradas.current.add(`${key}-1`);
                    }
                } else {
                    // Notificaciones para cierre
                    if (minutos === 10 && !notificacionesMostradas.current.has(`${key}-10`)) {
                        debeNotificar = true;
                        mensaje = `⏰ ${espacio.nombreEspacio} debe cerrarse en 10 minutos`;
                        notificacionesMostradas.current.add(`${key}-10`);
                    } else if (minutos === 5 && !notificacionesMostradas.current.has(`${key}-5`)) {
                        debeNotificar = true;
                        mensaje = `⚠️ ${espacio.nombreEspacio} debe cerrarse en 5 minutos`;
                        notificacionesMostradas.current.add(`${key}-5`);
                    } else if (minutos === 1 && !notificacionesMostradas.current.has(`${key}-1`)) {
                        debeNotificar = true;
                        mensaje = `🚨 ${espacio.nombreEspacio} debe cerrarse en 1 minuto`;
                        notificacionesMostradas.current.add(`${key}-1`);
                    }
                }

                if (debeNotificar) {
                    toast.warning(mensaje, {
                        duration: 5000,
                        position: 'top-right'
                    });
                }
            });
        });
    };

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Auto-refresh cada 30 segundos (más frecuente para contador en tiempo real)
    useEffect(() => {
        const interval = setInterval(() => {
            cargarDatos();
        }, 30000);

        return () => clearInterval(interval);
    }, [cargarDatos]);

    /**
     * Función para refrescar manualmente
     */
    const refrescar = async () => {
        setLoading(true);
        await cargarDatos();
    };

    // Aplanar espacios/horarios para paginar una tarjeta por horario
    const horariosPendientes = useMemo<HorarioPendientePaginado[]>(() => {
        return espacios.flatMap((espacio) => {
            return (espacio.horarios || []).map((horario, index) => ({
                key: `${espacio.idEspacio}-${horario.horaInicio}-${horario.horaFin}-${index}`,
                espacio,
                horario
            }));
        });
    }, [espacios]);

    const totalHorariosPendientes = horariosPendientes.length;
    const totalPages = getTotalPages(totalHorariosPendientes, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages), [totalPages]);

    const horariosPaginados = useMemo(() => {
        return getPageSlice(horariosPendientes, currentPage, PAGE_SIZE);
    }, [horariosPendientes, currentPage]);

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
        espacios,
        horariosPaginados,
        totalHorariosPendientes,
        horaActual,
        diaActual,
        fechaActual,
        loading,
        error,
        refrescar,
        currentPage,
        totalPages,
        pageNumbers,
        pageSize: PAGE_SIZE,
        goToPage,
        goToNextPage,
        goToPrevPage
    };
}
