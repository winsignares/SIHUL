import { apiClient } from '../../core/apiClient';

/**
 * Recurso (Resource) related interfaces and services
 */
export interface Recurso {
  id?: number;
  nombre: string;
  descripcion?: string;
}

export const recursoService = {
  /**
   * Obtiene la lista de todos los recursos
   */
  listarRecursos: async (): Promise<{ recursos: Recurso[] }> => {
    return apiClient.get('/recursos/list/');
  },

  /**
   * Obtiene un recurso por su ID
   * @param id ID del recurso
   */
  obtenerRecurso: async (id: number): Promise<Recurso> => {
    return apiClient.get(`/recursos/${id}/`);
  },

  /**
   * Crea un nuevo recurso
   * @param recurso Datos del recurso a crear
   */
  crearRecurso: async (recurso: Omit<Recurso, 'id'>): Promise<{ message: string; id: number }> => {
    return apiClient.post('/recursos/', recurso);
  },

  /**
   * Actualiza un recurso existente
   * @param recurso Datos del recurso a actualizar
   */
  actualizarRecurso: async (recurso: Recurso): Promise<{ message: string; id: number }> => {
    if (!recurso.id) {
      throw new Error('Se requiere el ID del recurso para actualizar');
    }
    return apiClient.put('/recursos/update/', recurso);
  },

  /**
   * Elimina un recurso
   * @param id ID del recurso a eliminar
   */
  eliminarRecurso: async (id: number): Promise<{ message: string }> => {
    return apiClient.delete('/recursos/delete/', { id });
  }
};

/**
 * EspacioRecurso (Space-Resource relationship) related interfaces and services
 */
export interface EspacioRecurso {
  espacio_id: number;
  recurso_id: number;
  estado: 'disponible' | 'no_disponible' | 'en_mantenimiento';
}

export interface EstadoRecurso extends EspacioRecurso {
  nombre: string;
}

export const espacioRecursoService = {
  /**
   * Obtiene la lista de todas las relaciones espacio-recurso
   */
  listarEspacioRecursos: async (): Promise<{ espacio_recursos: EspacioRecurso[] }> => {
    return apiClient.get('/recursos/espacio-recurso/list/');
  },

  /**
   * Obtiene una relación espacio-recurso por sus IDs
   * @param espacio_id ID del espacio
   * @param recurso_id ID del recurso
   */
  obtenerEspacioRecurso: async (espacio_id: number, recurso_id: number): Promise<EspacioRecurso> => {
    return apiClient.get(`/recursos/espacio-recurso/${espacio_id}/${recurso_id}/`);
  },

  /**
   * Crea una nueva relación espacio-recurso
   * @param espacioRecurso Datos de la relación a crear
   */
  crearEspacioRecurso: async (espacioRecurso: EspacioRecurso): Promise<{ message: string }> => {
    return apiClient.post('/recursos/espacio-recurso/', {
      espacio_id: espacioRecurso.espacio_id,
      recurso_id: espacioRecurso.recurso_id,
      estado: espacioRecurso.estado ?? 'disponible'
    });
  },

  /**
   * Actualiza una relación espacio-recurso existente
   * @param espacioRecurso Datos actualizados de la relación
   */
  actualizarEspacioRecurso: async (espacioRecurso: EspacioRecurso): Promise<{ message: string }> => {
    return apiClient.put('/recursos/espacio-recurso/update/', {
      espacio_id: espacioRecurso.espacio_id,
      recurso_id: espacioRecurso.recurso_id,
      estado: espacioRecurso.estado
    });
  },

  /**
   * Elimina una relación espacio-recurso
   * @param espacio_id ID del espacio
   * @param recurso_id ID del recurso
   */
  eliminarEspacioRecurso: async (espacio_id: number, recurso_id: number): Promise<{ message: string }> => {
    return apiClient.delete('/recursos/espacio-recurso/delete/', {
      espacio_id,
      recurso_id
    });
  },

  /**
   * Obtiene recursos asociados a un espacio con nombre y estado actual.
   */
  listarPorEspacio: async (espacioId: number): Promise<{ recursos: EstadoRecurso[] }> => {
    const [relacionesResponse, recursosResponse] = await Promise.all([
      espacioRecursoService.listarEspacioRecursos(),
      recursoService.listarRecursos()
    ]);

    const nombrePorRecursoId = new Map<number, string>();
    (recursosResponse.recursos || []).forEach((recurso) => {
      if (recurso.id) {
        nombrePorRecursoId.set(recurso.id, recurso.nombre);
      }
    });

    const recursos = (relacionesResponse.espacio_recursos || [])
      .filter((item) => item.espacio_id === espacioId)
      .map((item) => ({
        ...item,
        nombre: nombrePorRecursoId.get(item.recurso_id) || `Recurso #${item.recurso_id}`
      }));

    return { recursos };
  }
};