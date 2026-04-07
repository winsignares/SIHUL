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
    const recursos = await apiClient.get<Recurso[]>('/recursos/');
    return { recursos };
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
    const actualizado = await apiClient.put<Recurso>(`/recursos/${recurso.id}/`, recurso);
    return { message: 'Recurso actualizado', id: actualizado.id ?? recurso.id };
  },

  /**
   * Elimina un recurso
   * @param id ID del recurso a eliminar
   */
  eliminarRecurso: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/recursos/${id}/`);
    return { message: 'Recurso eliminado' };
  }
};

/**
 * EspacioRecurso (Space-Resource relationship) related interfaces and services
 */
export interface EspacioRecurso {
  id?: number;
  espacio_id: number;
  recurso_id: number;
  estado: 'disponible' | 'no_disponible' | 'en_mantenimiento';
}

export interface EstadoRecurso extends EspacioRecurso {
  nombre: string;
}

const getEspacioRecursoByIds = async (espacio_id: number, recurso_id: number): Promise<EspacioRecurso> => {
  return apiClient.get(`/espacios-recursos/por-ids/${espacio_id}/${recurso_id}/`);
};

export const espacioRecursoService = {
  /**
   * Obtiene la lista de todas las relaciones espacio-recurso
   */
  listarEspacioRecursos: async (): Promise<{ espacio_recursos: EspacioRecurso[] }> => {
    const espacio_recursos = await apiClient.get<EspacioRecurso[]>('/espacios-recursos/');
    return { espacio_recursos };
  },

  /**
   * Obtiene una relación espacio-recurso por sus IDs
   * @param espacio_id ID del espacio
   * @param recurso_id ID del recurso
   */
  obtenerEspacioRecurso: async (espacio_id: number, recurso_id: number): Promise<EspacioRecurso> => {
    return getEspacioRecursoByIds(espacio_id, recurso_id);
  },

  /**
   * Crea una nueva relación espacio-recurso
   * @param espacioRecurso Datos de la relación a crear
   */
  crearEspacioRecurso: async (espacioRecurso: EspacioRecurso): Promise<{ message: string }> => {
    await apiClient.post('/espacios-recursos/', {
      espacio_id: espacioRecurso.espacio_id,
      recurso_id: espacioRecurso.recurso_id,
      estado: espacioRecurso.estado ?? 'disponible'
    });
    return { message: 'EspacioRecurso creado' };
  },

  /**
   * Actualiza una relación espacio-recurso existente
   * @param espacioRecurso Datos actualizados de la relación
   */
  actualizarEspacioRecurso: async (espacioRecurso: EspacioRecurso): Promise<{ message: string }> => {
    const actual = await getEspacioRecursoByIds(espacioRecurso.espacio_id, espacioRecurso.recurso_id);
    if (!actual.id) {
      throw new Error('No se pudo resolver el ID de EspacioRecurso para actualizar');
    }

    await apiClient.put(`/espacios-recursos/${actual.id}/`, {
      espacio_id: espacioRecurso.espacio_id,
      recurso_id: espacioRecurso.recurso_id,
      estado: espacioRecurso.estado
    });
    return { message: 'EspacioRecurso actualizado' };
  },

  /**
   * Elimina una relación espacio-recurso
   * @param espacio_id ID del espacio
   * @param recurso_id ID del recurso
   */
  eliminarEspacioRecurso: async (espacio_id: number, recurso_id: number): Promise<{ message: string }> => {
    const actual = await getEspacioRecursoByIds(espacio_id, recurso_id);
    if (!actual.id) {
      throw new Error('No se pudo resolver el ID de EspacioRecurso para eliminar');
    }

    await apiClient.delete(`/espacios-recursos/${actual.id}/`);
    return { message: 'EspacioRecurso eliminado' };
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