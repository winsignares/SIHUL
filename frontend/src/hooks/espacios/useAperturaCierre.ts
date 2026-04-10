import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { aperturaCierreService, espacioService, type EspacioConHorarios, type HorarioEspacio, type TipoEspacio } from '../../services/espacios/espaciosAPI';
import { espacioRecursoService, type EstadoRecurso, type EspacioRecurso } from '../../services/recursos/recursoAPI';
import { toast } from 'sonner';
import {
  getPageNumbers,
  getPageSlice,
  getTargetPageForNextWindow,
  getTargetPageForPrevWindow,
  getTotalPages,
  hasNextPageWindow,
  hasPrevPageWindow,
  normalizePage,
  PAGE_SIZE_DEFAULT
} from '../gestionAcademica/paginacion';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const APERTURA_CIERRE_CACHE_KEY = 'espacios-apertura-cierre';
const APERTURA_CIERRE_CATALOGOS_CACHE_KEY = 'espacios-apertura-cierre-catalogos';

export interface HorarioPendientePaginado {
    key: string;
    espacio: EspacioConHorarios;
    horario: HorarioEspacio;
}

interface HorarioNormalizado extends HorarioEspacio {
    inicioMin: number;
    finMin: number;
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
    const [estaAbiertoPorEspacioId, setEstaAbiertoPorEspacioId] = useState<Record<number, boolean>>({});
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

    const horaAMinutos = useCallback((hora: string): number => {
        const [h, m] = hora.split(':').map((part) => parseInt(part, 10));
        if (Number.isNaN(h) || Number.isNaN(m)) return 0;
        return (h * 60) + m;
    }, []);

    const minutosASegundosRestantes = useCallback((deltaMinutos: number) => {
        const totalSegundos = Math.max(0, Math.floor(deltaMinutos * 60));
        return {
            minutos: Math.floor(totalSegundos / 60),
            segundos: totalSegundos % 60,
            totalSegundos,
        };
    }, []);

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
                    estaAbiertoPorEspacioId: Record<number, boolean>;
                }>(APERTURA_CIERRE_CATALOGOS_CACHE_KEY, activeToken);

            if (cachedData) {
                setTiposEspacioDisponibles(cachedData.tiposEspacioDisponibles);
                setTipoEspacioPorId(cachedData.tipoEspacioPorId);
                setEstaAbiertoPorEspacioId(cachedData.estaAbiertoPorEspacioId || {});
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
            const aperturaPorEspacioId: Record<number, boolean> = {};
            (espaciosResponse.espacios || []).forEach((espacio) => {
                if (!espacio.id) return;
                tipoPorEspacioId[espacio.id] = espacio.tipo_espacio?.nombre || tipoNombrePorTipoId[espacio.tipo_id] || 'Sin tipo';
                aperturaPorEspacioId[espacio.id] = espacio.esta_abierto !== false;
            });

            setTiposEspacioDisponibles(tipos);
            setTipoEspacioPorId(tipoPorEspacioId);
            setEstaAbiertoPorEspacioId(aperturaPorEspacioId);
            setSessionCacheData(APERTURA_CIERRE_CATALOGOS_CACHE_KEY, activeToken, {
                tiposEspacioDisponibles: tipos,
                tipoEspacioPorId: tipoPorEspacioId,
                estaAbiertoPorEspacioId: aperturaPorEspacioId
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

            const estadoApertura = estaAbiertoPorEspacioId[espacio.idEspacio] === false ? 'cerrado' : 'abierto';
            const matchesEstado = filterEstado === 'todos'
                || estadoApertura === filterEstado.toLowerCase();

            const matchesSede = filterSede === 'todas' || espacio.sede === filterSede;

            const matchesTipo = filterTipo === 'todos'
                || (tipoEspacioPorId[espacio.idEspacio] || '').toLowerCase() === filterTipo.toLowerCase();

            return matchesSearch && matchesEstado && matchesSede && matchesTipo;
        });
    }, [espacios, searchTerm, filterEstado, filterSede, filterTipo, tipoEspacioPorId, estaAbiertoPorEspacioId]);

    // Reglas de negocio UI: una sola tarjeta por espacio.
    // - Abrir: solo si esta cerrado y faltan <= 15 min para una clase proxima.
    // - Cerrar: solo si esta abierto, no hay clase en curso y pasaron >= 10 min desde la clase anterior.
    //           Si existe una clase siguiente, desaparece al llegar a (inicio siguiente - 15 min).
    const obtenerPendientePorEspacio = useCallback((espacio: EspacioConHorarios): HorarioPendientePaginado | null => {
        const estaAbierto = estaAbiertoPorEspacioId[espacio.idEspacio] !== false;
        const ahoraMin = horaAMinutos(horaActual);

        const horariosNormalizados: HorarioNormalizado[] = (espacio.horarios || [])
            .map((horario) => ({
                ...horario,
                inicioMin: horaAMinutos(horario.horaInicio),
                finMin: horaAMinutos(horario.horaFin),
            }))
            .filter((horario) => horario.finMin > horario.inicioMin)
            .sort((a, b) => a.inicioMin - b.inicioMin);

        if (horariosNormalizados.length === 0) return null;

        const claseEnCurso = horariosNormalizados.find((horario) => horario.inicioMin <= ahoraMin && ahoraMin < horario.finMin);
        const proximaClase = horariosNormalizados.find((horario) => horario.inicioMin > ahoraMin);

        let claseAnterior: HorarioNormalizado | null = null;
        for (const horario of horariosNormalizados) {
            if (horario.finMin <= ahoraMin) {
                claseAnterior = horario;
            }
        }

        if (!estaAbierto) {
            if (!proximaClase) return null;

            const inicioVentanaApertura = proximaClase.inicioMin - 15;
            const dentroVentanaApertura = ahoraMin >= inicioVentanaApertura && ahoraMin < proximaClase.inicioMin;
            if (!dentroVentanaApertura) return null;

            const deltaApertura = proximaClase.inicioMin - ahoraMin;
            const t = minutosASegundosRestantes(deltaApertura);

            return {
                key: `${espacio.idEspacio}-apertura-${proximaClase.horaInicio}-${proximaClase.horaFin}`,
                espacio,
                horario: {
                    ...proximaClase,
                    proximaAccion: 'apertura',
                    minutosRestantes: t.minutos,
                    segundosRestantes: t.segundos,
                    tiempoRestanteTotal: t.totalSegundos,
                },
            };
        }

        if (claseEnCurso) return null;
        if (!claseAnterior) return null;

        const inicioVentanaCierre = claseAnterior.finMin + 10;
        const finVentanaCierre = proximaClase ? (proximaClase.inicioMin - 15) : Number.POSITIVE_INFINITY;
        const dentroVentanaCierre = ahoraMin >= inicioVentanaCierre && ahoraMin < finVentanaCierre;
        if (!dentroVentanaCierre) return null;

        return {
            key: `${espacio.idEspacio}-cierre-${claseAnterior.horaInicio}-${claseAnterior.horaFin}`,
            espacio,
            horario: {
                ...claseAnterior,
                proximaAccion: 'cierre',
                minutosRestantes: 0,
                segundosRestantes: 0,
                tiempoRestanteTotal: 0,
            },
        };
    }, [estaAbiertoPorEspacioId, horaAMinutos, horaActual, minutosASegundosRestantes]);

    // Construir la lista final: una tarjeta por espacio como maximo.
    const horariosPendientes = useMemo<HorarioPendientePaginado[]>(() => {
        return espaciosFiltrados
            .map((espacio) => obtenerPendientePorEspacio(espacio))
            .filter((item): item is HorarioPendientePaginado => item !== null)
            .sort((a, b) => a.horario.tiempoRestanteTotal - b.horario.tiempoRestanteTotal);
    }, [espaciosFiltrados, obtenerPendientePorEspacio]);

    const salonesPorAbrir = useMemo(
        () => horariosPendientes.filter((item) => item.horario.proximaAccion === 'apertura').length,
        [horariosPendientes]
    );

    const salonesPorCerrar = useMemo(
        () => horariosPendientes.filter((item) => item.horario.proximaAccion === 'cierre').length,
        [horariosPendientes]
    );

    const totalAccionesBackend = useMemo(
        () => espaciosFiltrados.reduce((acc, espacio) => acc + (espacio.horarios?.length || 0), 0),
        [espaciosFiltrados]
    );

    const diagnosticoPendientes = useMemo(() => {
        if (horariosPendientes.length > 0) {
            return null;
        }

        if (totalAccionesBackend === 0) {
            return 'No hay acciones pendientes reportadas por el backend para hoy.';
        }

        return `El backend reporta ${totalAccionesBackend} accion(es), pero ninguna cae en la ventana operativa actual (abrir: 15 min antes si esta cerrado; cerrar: desde +10 min despues del fin y hasta 15 min antes de la siguiente clase).`;
    }, [horariosPendientes.length, totalAccionesBackend]);

    const totalHorariosPendientes = horariosPendientes.length;
    const totalPages = getTotalPages(totalHorariosPendientes, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages, currentPage), [totalPages, currentPage]);

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

    const goToPrevPageWindow = () => {
        const target = getTargetPageForPrevWindow(currentPage, totalPages);
        if (target != null) goToPage(target);
    };

    const goToNextPageWindow = () => {
        const target = getTargetPageForNextWindow(currentPage, totalPages);
        if (target != null) goToPage(target);
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
            await espacioService.cambiarApertura(espacioId, true);
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
            await espacioService.cambiarApertura(espacioId, false);
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
        estaAbiertoPorEspacioId,
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
        salonesPorAbrir,
        salonesPorCerrar,
        totalAccionesBackend,
        diagnosticoPendientes,
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
        hasPrevPageWindow: hasPrevPageWindow(currentPage, totalPages),
        hasNextPageWindow: hasNextPageWindow(currentPage, totalPages),
        goToPrevPageWindow,
        goToNextPageWindow,
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
