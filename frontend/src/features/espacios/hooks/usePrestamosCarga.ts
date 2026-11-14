import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { PrestamoEspacioUI as PrestamoEspacio } from '../../../models';
import { prestamoService } from '../../prestamos/services/prestamoAPI';
import { prestamosPublicAPI } from '../../prestamos/services/prestamosPublicAPI';
import { showNotification } from '../../../context/ThemeContext';
import type { useAuth } from '../../../context/AuthContext';
import { isSpaceSupervisorRole } from '../../../context/spaceSupervisorRole';
import { getSessionCacheData, setSessionCacheData } from '../../../core/sessionCache';
import { useActualizacionEnVivo } from '../../../hooks/useActualizacionEnVivo';
import {
    PRESTAMOS_CHANGED_EVENT,
    PRESTAMOS_CHANGED_STORAGE_KEY
} from '../../prestamos/services/prestamosChanges';
import { PRESTAMOS_CACHE_KEY, PRESTAMOS_SYNC_INTERVAL_MS } from './prestamosEspaciosUtils';

type Sesion = ReturnType<typeof useAuth>;

/** Carga los préstamos y los mantiene sincronizados (al volver a la pestaña, por intervalo y por cambios externos). */
export function usePrestamosCarga({ user, areas, setPrestamos, setLoading }: {
    user: Sesion['user'];
    areas: Sesion['areas'];
    setPrestamos: Dispatch<SetStateAction<PrestamoEspacio[]>>;
    setLoading: Dispatch<SetStateAction<boolean>>;
}) {
    // Cargar datos iniciales
    useEffect(() => {
        loadData({ force: true });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Recargar cuando la página vuelve a ser visible (e.g., usuario regresa de otra pestaña)
    useEffect(() => {
        const reloadPrestamos = () => {
            void loadData({ force: true });
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                reloadPrestamos();
            }
        };

        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === PRESTAMOS_CHANGED_STORAGE_KEY) {
                reloadPrestamos();
            }
        };

        const syncInterval = window.setInterval(() => {
            if (document.visibilityState === 'visible') {
                reloadPrestamos();
            }
        }, PRESTAMOS_SYNC_INTERVAL_MS);

        window.addEventListener(PRESTAMOS_CHANGED_EVENT, reloadPrestamos);
        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('focus', reloadPrestamos);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.clearInterval(syncInterval);
            window.removeEventListener(PRESTAMOS_CHANGED_EVENT, reloadPrestamos);
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', reloadPrestamos);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Alguien más creó, aprobó o cambió un préstamo (o el espacio o el horario): se vuelve a leer sin spinner.
    useActualizacionEnVivo(
        ['prestamos-espacio', 'prestamos-espacio-publico', 'prestamos-recurso', 'prestamos-recurso-publico', 'espacios', 'horarios'],
        () => {
            void loadData({ force: true, silent: true });
        }
    );

    const loadData = async ({ force = false, silent = false }: { force?: boolean; silent?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const rolNombre = typeof user?.rol === 'string' ? user.rol : String(user?.rol?.nombre ?? 'sin-rol');
            const esSupervisorPorRol = isSpaceSupervisorRole(
                typeof user?.rol === 'string'
                    ? { nombre: user.rol }
                    : user?.rol
            );
            const esSupervisorPorEspacios = Boolean(areas?.length);
            const cacheKey = `${PRESTAMOS_CACHE_KEY}-${user?.id ?? 'anonimo'}-${rolNombre}-${esSupervisorPorRol || esSupervisorPorEspacios ? 'supervisa-espacios' : 'general'}`;
            const cachedPrestamos = force
                ? null
                : getSessionCacheData<PrestamoEspacio[]>(cacheKey, activeToken);

            // Reutilizar datos cargados en esta sesión si no se fuerza recarga.
            if (cachedPrestamos) {
                setPrestamos(cachedPrestamos);
                return;
            }

            if (!silent) setLoading(true);

            // Detectar si el rol supervisa espacios para usar el endpoint específico.
            const esSupervisor = esSupervisorPorRol || esSupervisorPorEspacios;

            // Cargar TODOS los préstamos: los de usuarios autenticados y las solicitudes públicas.
            // Si es supervisor, usar endpoint específico de prestamos de espacios permitidos
            const [prestamosResponse, publicosResponse] = await Promise.all([
                esSupervisor
                    ? prestamoService.listarPrestamosSupervisor()
                    : prestamoService.listarTodosPrestamosAdmin(),
                prestamosPublicAPI.listarParaAdministracion(),
            ]);

            // Transformar datos del backend al formato UI
            const prestamosUI: PrestamoEspacio[] = [
                ...prestamosResponse.prestamos,
                ...publicosResponse.prestamos,
            ].map(p => {
                const esPublico = Boolean(
                    p.usuario_id == null && (
                        p.solicitante_publico_identificacion ||
                        p.solicitante_publico_correo ||
                        p.solicitante_publico_nombre
                    )
                );

                return {
                    id: p.id ? `${esPublico ? 'public' : 'auth'}-${p.id}` : '',
                    solicitante: p.usuario_nombre || p.solicitante_publico_nombre || 'Usuario No Disponible',
                    email: p.usuario_correo || p.solicitante_publico_correo || '',
                    telefono: p.telefono || p.solicitante_publico_telefono || '',
                    espacio: p.espacio_nombre || `Espacio ${p.espacio_id}`,
                    espacio_id: p.espacio_id,
                    fecha: p.fecha,
                    horaInicio: p.hora_inicio.substring(0, 5), // HH:MM
                    horaFin: p.hora_fin.substring(0, 5), // HH:MM
                    motivo: p.motivo || '',
                    tipoEvento: p.tipo_actividad_nombre || 'Evento',
                    tipo_actividad_id: p.tipo_actividad_id,
                    asistentes: p.asistentes || 0,
                    recursosNecesarios: (p.recursos || [])
                        .filter(r => Boolean(r.recurso_nombre?.trim()))
                        .map(r => r.cantidad > 1
                            ? `${r.recurso_nombre} (x${r.cantidad})`
                            : r.recurso_nombre!.trim()),
                    recursos: (p.recursos || []).map(r => ({
                        recurso_id: r.recurso_id,
                        recurso_nombre: r.recurso_nombre,
                        cantidad: r.cantidad
                    })),
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
                    prestamo_padre_id: p.prestamo_padre_id ?? null,
                    periodo_id: p.periodo_id ?? null,
                    periodo_nombre: p.periodo_nombre ?? null
                };
            });

            setPrestamos(prestamosUI);
            setSessionCacheData(cacheKey, activeToken, prestamosUI);
        } catch (error) {
            showNotification({
                message: `Error al cargar préstamos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return { loadData };
}
