import { apiClient } from '../../core/apiClient';

export interface TipoEspacio {
    id?: number;
    nombre: string;
    descripcion?: string;
}

/**
 * Servicio para la gestión de tipos de espacio
 */
export const tipoEspacioService = {
    /**
     * Obtiene la lista de todos los tipos de espacio
     */
    listarTiposEspacio: async (): Promise<{ tipos_espacio: TipoEspacio[] }> => {
        return apiClient.get('/espacios/tipos/list/');
    },

    /**
     * Obtiene un tipo de espacio por su ID
     * @param id ID del tipo de espacio
     */
    obtenerTipoEspacio: async (id: number): Promise<TipoEspacio> => {
        return apiClient.get(`/espacios/tipos/${id}/`);
    }
};
