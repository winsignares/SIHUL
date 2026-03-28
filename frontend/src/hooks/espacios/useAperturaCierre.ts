import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { aperturaCierreService, espacioService, type EspacioConHorarios, type HorarioEspacio, type TipoEspacio } from '../../services/espacios/espaciosAPI';
import { espacioRecursoService, type EstadoRecurso, type EspacioRecurso } from '../../services/recursos/recursoAPI';
import { toast } from 'sonner';
import { getPageNumbers, getPageSlice, getTotalPages, normalizePage, PAGE_SIZE_DEFAULT } from '../gestionAcademica/paginacion';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const APERTURA_CIERRE_CACHE_KEY = 'espacios-apertura-cierre';
const APERTURA_CIERRE_CATALOGOS_CACHE_KEY = 'espacios-apertura-cierre-catalogos';

export interface HorarioPendientePaginado {
    key: string;
    espacio: EspacioConHorarios;
    horario: HorarioEspacio;
}

export interface RecursoCierrePendiente extends EstadoRecurso {
    estadoOriginal: EspacioRecurso['estado'];
}

interface ResultadoAccion {
    ok: boolean;
    message?: string;
    status?: number;
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
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [filterTipo, setFilterTipo] = useState<string>('todos');
    const [filterEstado, setFilterEstado] = useState<string>('todos');
    const [filterSede, setFilterSede] = useState<string>('todas');
    const [tiposEspacioDisponibles, setTiposEspacioDisponibles] = useState<TipoEspacio[]>([]);
    const [tipoEspacioPorId, setTipoEspacioPorId] = useState<Record<number, string>>({});
    const [horaActual, setHoraActual] = useState<string>('');
    const [diaActual, setDiaActual] = useState<string>('');
    const [fechaActual, setFechaActual] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [modalRecursosAbierto, setModalRecursosAbierto] = useState<boolean>(false);
    const [espacioEnRevision, setEspacioEnRevision] = useState<{ id: number; nombre: string } | null>(null);
    const [recursosPendientes, setRecursosPendientes] = useState<RecursoCierrePendiente[]>([]);
    const [cargandoRecursos, setCargandoRecursos] = useState<boolean>(false);
    const [guardandoRecursos, setGuardandoRecursos] = useState<boolean>(false);

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
    const cargarDatos = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
        try {
            setError(null);
            const activeToken = localStorage.getItem('auth_token');
            const cachedData = force
                ? null
                : getSessionCacheData<{
                    espacios: EspacioConHorarios[];
                    horaActual: string;
                    diaActual: string;
                    fechaActual: string;
                }>(APERTURA_CIERRE_CACHE_KEY, activeToken);

            if (cachedData) {
                setEspacios(cachedData.espacios);
                setHoraActual(cachedData.horaActual);
                setDiaActual(cachedData.diaActual);
                setFechaActual(cachedData.fechaActual);
                procesarNotificaciones(cachedData.espacios);
                return;
            }

            const data = await aperturaCierreService.getProximos();

            setEspacios(data.espacios || []);
            setHoraActual(data.horaActual);
            setDiaActual(data.diaActual);
            setFechaActual(data.fechaActual);
            setSessionCacheData(APERTURA_CIERRE_CACHE_KEY, activeToken, {
                espacios: data.espacios || [],
                horaActual: data.horaActual,
                diaActual: data.diaActual,
                fechaActual: data.fechaActual
            });

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

    const cargarCatalogosEspacios = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedData = force
                ? null
                : getSessionCacheData<{
                    tiposEspacioDisponibles: TipoEspacio[];
                    tipoEspacioPorId: Record<number, string>;
                }>(APERTURA_CIERRE_CATALOGOS_CACHE_KEY, activeToken);

            if (cachedData) {
                setTiposEspacioDisponibles(cachedData.tiposEspacioDisponibles);
                setTipoEspacioPorId(cachedData.tipoEspacioPorId);
                return;
            }

            const [espaciosResponse, tiposResponse] = await Promise.all([
                espacioService.list(),
                espacioService.listTipos()
            ]);

            const tipos = tiposResponse.tipos_espacio || [];
            const tipoNombrePorTipoId: Record<number, string> = {};
            tipos.forEach((tipo) => {
                tipoNombrePorTipoId[tipo.id] = tipo.nombre;
            });

            const tipoPorEspacioId: Record<number, string> = {};
            (espaciosResponse.espacios || []).forEach((espacio) => {
                if (!espacio.id) return;
                tipoPorEspacioId[espacio.id] = espacio.tipo_espacio?.nombre || tipoNombrePorTipoId[espacio.tipo_id] || 'Sin tipo';
            });

            setTiposEspacioDisponibles(tipos);
            setTipoEspacioPorId(tipoPorEspacioId);
            setSessionCacheData(APERTURA_CIERRE_CATALOGOS_CACHE_KEY, activeToken, {
                tiposEspacioDisponibles: tipos,
                tipoEspacioPorId: tipoPorEspacioId
            });
        } catch (error) {
            console.error('Error cargando catalogos de espacios:', error);
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

    useEffect(() => {
        cargarCatalogosEspacios();
    }, [cargarCatalogosEspacios]);

    // Auto-refresh cada 30 segundos (más frecuente para contador en tiempo real)
    useEffect(() => {
        const interval = setInterval(() => {
            cargarDatos({ force: true });
        }, 30000);

        return () => clearInterval(interval);
    }, [cargarDatos]);

    /**
     * Función para refrescar manualmente
     */
    const refrescar = async () => {
        setLoading(true);
        await Promise.all([
            cargarDatos({ force: true }),
            cargarCatalogosEspacios({ force: true })
        ]);
    };

    const tiposUso = useMemo(() => {
        return tiposEspacioDisponibles.map((tipo) => tipo.nombre);
    }, [tiposEspacioDisponibles]);

    const sedes = useMemo(() => {
        const sedesUnicas = new Set<string>();
        espacios.forEach((espacio) => {
            if (espacio.sede) {
                sedesUnicas.add(espacio.sede);
            }
        });
        return Array.from(sedesUnicas);
    }, [espacios]);

    const espaciosFiltrados = useMemo(() => {
        return espacios.filter((espacio) => {
            const q = searchTerm.trim().toLowerCase();
            const matchesSearch = q === ''
                || espacio.nombreEspacio.toLowerCase().includes(q)
                || espacio.sede.toLowerCase().includes(q)
                || (espacio.piso || '').toLowerCase().includes(q);

            const matchesEstado = filterEstado === 'todos'
                || espacio.estadoActual.toLowerCase() === filterEstado.toLowerCase();

            const matchesSede = filterSede === 'todas' || espacio.sede === filterSede;

            const matchesTipo = filterTipo === 'todos'
                || (tipoEspacioPorId[espacio.idEspacio] || '').toLowerCase() === filterTipo.toLowerCase();

            return matchesSearch && matchesEstado && matchesSede && matchesTipo;
        });
    }, [espacios, searchTerm, filterEstado, filterSede, filterTipo, tipoEspacioPorId]);

    // Aplanar espacios/horarios para paginar una tarjeta por horario
    const horariosPendientes = useMemo<HorarioPendientePaginado[]>(() => {
        return espaciosFiltrados.flatMap((espacio) => {
            return (espacio.horarios || []).map((horario, index) => ({
                key: `${espacio.idEspacio}-${horario.horaInicio}-${horario.horaFin}-${index}`,
                espacio,
                horario
            }));
        });
    }, [espaciosFiltrados]);

    const totalHorariosPendientes = horariosPendientes.length;
    const totalPages = getTotalPages(totalHorariosPendientes, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages), [totalPages]);

    const horariosPaginados = useMemo(() => {
        return getPageSlice(horariosPendientes, currentPage, PAGE_SIZE);
    }, [horariosPendientes, currentPage]);

    useEffect(() => {
        setCurrentPage((prev) => normalizePage(prev, totalPages));
    }, [totalPages]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterTipo, filterEstado, filterSede]);

    const goToPage = (page: number) => {
        setCurrentPage(normalizePage(page, totalPages));
    };

    const goToNextPage = () => {
        goToPage(currentPage + 1);
    };

    const goToPrevPage = () => {
        goToPage(currentPage - 1);
    };

    const abrirPopupRevisionRecursos = useCallback(async (espacioId: number) => {
        setCargandoRecursos(true);
        try {
            const espacio = espacios.find((item) => item.idEspacio === espacioId);
            const { recursos } = await espacioRecursoService.listarPorEspacio(espacioId);

            setEspacioEnRevision({
                id: espacioId,
                nombre: espacio?.nombreEspacio || `Espacio #${espacioId}`
            });
            setRecursosPendientes(
                recursos.map((recurso) => ({
                    ...recurso,
                    estadoOriginal: recurso.estado
                }))
            );
            setModalRecursosAbierto(true);
        } catch (err: any) {
            const message = err?.message || 'No fue posible cargar recursos del espacio';
            toast.error(message);
            setEspacioEnRevision({ id: espacioId, nombre: `Espacio #${espacioId}` });
            setRecursosPendientes([]);
            setModalRecursosAbierto(true);
        } finally {
            setCargandoRecursos(false);
        }
    }, [espacios]);

    const actualizarEstadoRecurso = useCallback((recursoId: number, estado: EspacioRecurso['estado']) => {
        setRecursosPendientes((prev) => prev.map((item) => (
            item.recurso_id === recursoId ? { ...item, estado } : item
        )));
    }, []);

    const cerrarPopupRecursos = useCallback(() => {
        setModalRecursosAbierto(false);
        setEspacioEnRevision(null);
        setRecursosPendientes([]);
    }, []);

    const confirmarRevisionRecursos = useCallback(async (): Promise<ResultadoAccion> => {
        if (!espacioEnRevision) {
            cerrarPopupRecursos();
            return { ok: true as const };
        }

        setGuardandoRecursos(true);
        try {
            const cambios = recursosPendientes.filter((item) => item.estado !== item.estadoOriginal);

            if (cambios.length > 0) {
                await Promise.all(cambios.map((item) => espacioRecursoService.actualizarEspacioRecurso({
                    espacio_id: item.espacio_id,
                    recurso_id: item.recurso_id,
                    estado: item.estado
                })));
            }

            toast.success('Revision de recursos registrada');
            cerrarPopupRecursos();
            await refrescar();
            return { ok: true as const };
        } catch (err: any) {
            const message = err?.message || 'No fue posible guardar cambios de recursos';
            toast.error(message);
            return { ok: false as const, message };
        } finally {
            setGuardandoRecursos(false);
        }
    }, [cerrarPopupRecursos, espacioEnRevision, recursosPendientes, refrescar]);

    const abrirSalon = async (espacioId: number): Promise<ResultadoAccion> => {
        try {
            await espacioService.cambiarEstado(espacioId, 'No Disponible');
            await refrescar();
            return { ok: true as const };
        } catch (err: any) {
            const message = err?.message || 'Error al actualizar estado del salon';
            toast.error(message);
            return { ok: false as const, message };
        }
    };

    const cerrarSalon = async (espacioId: number): Promise<ResultadoAccion> => {
        try {
            await espacioService.cambiarEstado(espacioId, 'Disponible');
            await abrirPopupRevisionRecursos(espacioId);
            return { ok: true as const };
        } catch (err: any) {
            const message = err?.message || 'Error al actualizar estado del salon';
            if (err?.status === 400) {
                toast.error(message);
                return { ok: false as const, message, status: 400 as const };
            }

            toast.error(message);
            return { ok: false as const, message };
        }
    };

    return {
        espacios,
        espaciosFiltrados,
        sedes,
        tiposUso,
        searchTerm,
        setSearchTerm,
        filterTipo,
        setFilterTipo,
        filterEstado,
        setFilterEstado,
        filterSede,
        setFilterSede,
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
        goToPrevPage,
        abrirSalon,
        cerrarSalon,
        modalRecursosAbierto,
        setModalRecursosAbierto,
        espacioEnRevision,
        recursosPendientes,
        cargandoRecursos,
        guardandoRecursos,
        actualizarEstadoRecurso,
        cerrarPopupRecursos,
        confirmarRevisionRecursos
    };
}
