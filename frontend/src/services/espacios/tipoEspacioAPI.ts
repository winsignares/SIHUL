import { apiClient } from '../../core/apiClient';

export interface TipoEspacio {
    id?: number;
    nombre: string;
    descripcion?: string;
}

export interface CreateTipoEspacioPayload {
    nombre: string;
    descripcion?: string;
}

/**
 * Servicio para la gestión de tipos de espacio
 */
export const tipoEspacioService = {
    /**
     * Crea un nuevo tipo de espacio
     */
    crearTipoEspacio: async (payload: CreateTipoEspacioPayload): Promise<{ message: string; id: number }> => {
        const creado = await apiClient.post<TipoEspacio>('/tipos-espacio/', payload);
        return { message: 'Tipo de espacio creado', id: creado.id ?? 0 };
    },

    /**
     * Obtiene la lista de todos los tipos de espacio
     */
    listarTiposEspacio: async (): Promise<{ tipos_espacio: TipoEspacio[] }> => {
        const tipos_espacio = await apiClient.get<TipoEspacio[]>('/tipos-espacio/');
        return { tipos_espacio };
    },

    /**
     * Obtiene un tipo de espacio por su ID
     * @param id ID del tipo de espacio
     */
    obtenerTipoEspacio: async (id: number): Promise<TipoEspacio> => {
        return apiClient.get(`/tipos-espacio/${id}/`);
    }
};
