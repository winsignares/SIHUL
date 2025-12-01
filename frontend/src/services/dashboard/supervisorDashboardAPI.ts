import { apiClient } from '../../core/apiClient';
import { espacioService, espacioPermitidoService } from '../espacios/espaciosAPI';

/**
 * Interfaz para las métricas del dashboard del supervisor general
 */
export interface SupervisorDashboardMetrics {
    espaciosTotales: number;
    espaciosDisponibles: number;
    espaciosOcupados: number;
    salonesAbiertos: number;
    porcentajeDisponibles: number;
    porcentajeOcupados: number;
}

/**
 * Interfaz para la disponibilidad de espacios
 */
export interface DisponibilidadEspacios {
    total: number;
    disponibles: number;
    ocupados: number;
    mantenimiento: number;
}

/**
 * Interfaz para métricas de recursos
 */
export interface MetricasRecursos {
    recursosTotales: number;
    recursosOperativos: number;
    recursosEnMantenimiento: number;
    porcentajeOperativos: number;
}

/**
 * Obtiene el ID del usuario autenticado desde el localStorage
 */
function getUserId(): number | null {
    try {
        // Intentar obtener de auth_user (ubicación principal)
        const authUserStr = localStorage.getItem('auth_user');
        if (authUserStr) {
            const authUser = JSON.parse(authUserStr);
            if (authUser?.id) {
                return authUser.id;
            }
        }

        // Fallback: intentar obtener de user (ubicación alternativa)
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            if (user?.id) {
                return user.id;
            }
        }

        return null;
    } catch (error) {
        console.error('Error al obtener user_id del localStorage:', error);
        return null;
    }
}

/**
 * Servicio para obtener métricas del dashboard del supervisor general
 */
export const supervisorDashboardService = {
    /**
     * Obtiene todas las métricas del dashboard del supervisor general
     * Consume los endpoints existentes para calcular valores reales
     * Solo obtiene los espacios permitidos del supervisor general autenticado
     */
    getMetricas: async (): Promise<SupervisorDashboardMetrics> => {
        try {
            // Obtener user_id
            const userId = getUserId();

            if (!userId) {
                throw new Error('Usuario no autenticado. No se puede obtener espacios permitidos.');
            }

            // Obtener lista de espacios permitidos para este usuario
            const espaciosResponse = await espacioPermitidoService.listByUsuario(userId);
            const espacios = espaciosResponse.espacios || [];

            // Contar espacios por estado
            const espaciosTotales = espacios.length;
            const espaciosDisponibles = espacios.filter(
                (e) => e.estado === 'Disponible'
            ).length;
            const espaciosMantenimiento = espacios.filter(
                (e) => e.estado === 'Mantenimiento'
            ).length;
            const espaciosNoDisponibles = espacios.filter(
                (e) => e.estado === 'No Disponible'
            ).length;

            // Los ocupados = Total - Disponibles - Mantenimiento - No disponibles
            const espaciosOcupados =
                espaciosTotales -
                espaciosDisponibles -
                espaciosMantenimiento -
                espaciosNoDisponibles;

            // Calcular porcentajes
            const porcentajeDisponibles =
                espaciosTotales > 0
                    ? Math.round((espaciosDisponibles / espaciosTotales) * 100)
                    : 0;
            const porcentajeOcupados =
                espaciosTotales > 0
                    ? Math.round((espaciosOcupados / espaciosTotales) * 100)
                    : 0;

            // Obtener salones abiertos (próximos a abrir/cerrar)
            let salonesAbiertos = 0;
            try {
                const aperturaCierreResponse =
                    await supervisorDashboardService.getAperturaCierre();
                // Contar aperturas pendientes como "salones en proceso de apertura"
                salonesAbiertos =
                    (aperturaCierreResponse.aperturasPendientes || []).length +
                    (aperturaCierreResponse.cierresPendientes || []).length;
            } catch (error) {
                console.warn(
                    'No se pudo obtener apertura/cierre:',
                    error
                );
                salonesAbiertos = 0;
            }

            return {
                espaciosTotales,
                espaciosDisponibles,
                espaciosOcupados,
                salonesAbiertos,
                porcentajeDisponibles,
                porcentajeOcupados
            };
        } catch (error) {
            console.error('Error al obtener métricas del dashboard:', error);
            throw error;
        }
    },

    /**
     * Obtiene información de apertura y cierre de salones
     */
    getAperturaCierre: async (): Promise<{
        aperturasPendientes: any[];
        cierresPendientes: any[];
        horaActual: string;
        diaActual: string;
        fechaActual: string;
    }> => {
        try {
            // Obtener user_id
            const userId = getUserId();

            // Llamar al endpoint
            const endpoint = userId
                ? `/espacios/apertura-cierre/proximos/?user_id=${userId}`
                : '/espacios/apertura-cierre/proximos/';

            return apiClient.get(endpoint);
        } catch (error) {
            console.error('Error al obtener apertura/cierre:', error);
            throw error;
        }
    },

    /**
     * Obtiene disponibilidad general de espacios
     * Solo para los espacios permitidos del supervisor
     */
    getDisponibilidad: async (): Promise<DisponibilidadEspacios> => {
        try {
            // Obtener user_id
            const userId = getUserId();

            if (!userId) {
                throw new Error('Usuario no autenticado');
            }

            // Obtener espacios permitidos
            const espaciosResponse = await espacioPermitidoService.listByUsuario(userId);
            const espacios = espaciosResponse.espacios || [];

            return {
                total: espacios.length,
                disponibles: espacios.filter(
                    (e) => e.estado === 'Disponible'
                ).length,
                ocupados: espacios.filter(
                    (e) => e.estado !== 'Disponible' && e.estado !== 'Mantenimiento'
                ).length,
                mantenimiento: espacios.filter(
                    (e) => e.estado === 'Mantenimiento'
                ).length
            };
        } catch (error) {
            console.error('Error al obtener disponibilidad:', error);
            throw error;
        }
    },

    /**
     * Obtiene métricas de recursos para el dashboard
     * Calcula recursos operativos y en mantenimiento
     * Solo para espacios permitidos del supervisor general
     */
    getMetricasRecursos: async (): Promise<MetricasRecursos> => {
        try {
            // Obtener user_id
            const userId = getUserId();

            if (!userId) {
                throw new Error('Usuario no autenticado');
            }

            // Obtener espacios permitidos del supervisor
            const espaciosResponse = await espacioPermitidoService.listByUsuario(userId);
            const espacios = espaciosResponse.espacios || [];

            // Para cada espacio, extraer los recursos y contar estados
            let recursosTotales = 0;
            let recursosOperativos = 0;
            let recursosEnMantenimiento = 0;

            // Iterar sobre los espacios y contar recursos por estado
            for (const espacio of espacios) {
                // Los recursos están incluidos en la respuesta de espacios permitidos
                const recursos = espacio.recursos || [];
                
                for (const recurso of recursos) {
                    recursosTotales++;
                    if (recurso.estado === 'disponible') {
                        recursosOperativos++;
                    } else if (recurso.estado === 'en_mantenimiento') {
                        recursosEnMantenimiento++;
                    }
                }
            }

            // Calcular porcentaje
            const porcentajeOperativos =
                recursosTotales > 0
                    ? Math.round((recursosOperativos / recursosTotales) * 100)
                    : 0;

            return {
                recursosTotales,
                recursosOperativos,
                recursosEnMantenimiento,
                porcentajeOperativos
            };
        } catch (error) {
            console.error('Error al obtener métricas de recursos:', error);
            throw error;
        }
    }
};
