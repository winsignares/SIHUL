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
        const tipos_actividad = await apiClient.get<TipoActividad[]>('/prestamos/tipos-actividad/');
        return { tipos_actividad };
    },

    /**
     * Crea un nuevo tipo de actividad
     * @param data Datos del tipo de actividad
     */
    crearTipoActividad: async (data: Omit<TipoActividad, 'id'>): Promise<{ message: string; id: number }> => {
        const created = await apiClient.post<TipoActividad>('/prestamos/tipos-actividad/', data);
        return { message: 'Tipo de actividad creado', id: created.id ?? 0 };
    }
};
