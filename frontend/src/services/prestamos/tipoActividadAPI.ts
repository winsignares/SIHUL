import { apiClient } from '../../core/apiClient';

export interface TipoActividad {
    id: number;
    nombre: string;
    descripcion?: string;
}

/**
 * Servicio para la gestión de tipos de actividad
 */
export const tipoActividadService = {
    /**
     * Obtiene la lista de todos los tipos de actividad
     */
    listarTiposActividad: async (): Promise<{ tipos_actividad: TipoActividad[] }> => {
        return apiClient.get('/prestamos/tipos-actividad/');
    },

    /**
     * Crea un nuevo tipo de actividad
     * @param data Datos del tipo de actividad
     */
    crearTipoActividad: async (data: Omit<TipoActividad, 'id'>): Promise<{ message: string; id: number }> => {
        return apiClient.post('/prestamos/tipos-actividad/create/', data);
    }
};
