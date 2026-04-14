import { apiClient } from '../../core/apiClient';

export interface Sede {
  id?: number;
  nombre: string;
  direccion?: string;
  seccional_id?: number | null;
  seccional_ciudad?: string | null;
  ciudad?: string;
  activa: boolean;
}

export interface Seccional {
  id: number;
  ciudad: string;
  activa: boolean;
}

interface SedeApi {
  id?: number;
  nombre: string;
  direccion?: string;
  seccional?: number | null;
  seccional_id?: number | null;
  seccional_ciudad?: string | null;
  ciudad?: string;
  activa: boolean;
}

interface SeccionalApi {
  id: number;
  ciudad: string;
  activa: boolean;
}

const toFrontendSede = (sede: SedeApi): Sede => ({
  id: sede.id,
  nombre: sede.nombre,
  direccion: sede.direccion,
  seccional_id: sede.seccional_id ?? sede.seccional ?? null,
  seccional_ciudad: sede.seccional_ciudad ?? sede.ciudad ?? null,
  // Compatibilidad con vistas antiguas que consumen `ciudad` como alias de seccional.
  ciudad: sede.ciudad ?? sede.seccional_ciudad ?? undefined,
  activa: sede.activa,
});

const toFrontendSeccional = (seccional: SeccionalApi): Seccional => ({
  id: seccional.id,
  ciudad: seccional.ciudad,
  activa: seccional.activa,
});

/**
 * Servicio para la gestión de sedes
 */
export const sedeService = {
  listarSeccionales: async (): Promise<{ seccionales: Seccional[] }> => {
    const response = await apiClient.get<SeccionalApi[] | { results: SeccionalApi[] }>('/seccionales/');
    const seccionalesRaw = Array.isArray(response) ? response : response.results;
    const seccionales = seccionalesRaw.map(toFrontendSeccional);
    return { seccionales };
  },

  /**
   * Obtiene la lista de todas las sedes
   */
  listarSedes: async (): Promise<{ sedes: Sede[] }> => {
    const response = await apiClient.get<SedeApi[] | { sedes: SedeApi[] }>('/sedes/');
    const sedesRaw = Array.isArray(response) ? response : response.sedes;
    const sedes = sedesRaw.map(toFrontendSede);
    return { sedes };
  },

  /**
   * Obtiene una sede por su ID
   * @param id ID de la sede
   */
  obtenerSede: async (id: number): Promise<Sede> => {
    const sede = await apiClient.get<SedeApi>(`/sedes/${id}/`);
    return toFrontendSede(sede);
  },

  /**
   * Crea una nueva sede
   * @param sede Datos de la sede a crear
   */
  crearSede: async (sede: Omit<Sede, 'id'>): Promise<{ message: string; id: number }> => {
    return apiClient.post('/sedes/', {
      nombre: sede.nombre,
      direccion: sede.direccion,
      seccional: sede.seccional_id,
      activa: sede.activa ?? true
    });
  },

  /**
   * Actualiza una sede existente
   * @param sede Datos de la sede a actualizar
   */
  actualizarSede: async (sede: Sede): Promise<{ message: string; id: number }> => {
    if (!sede.id) {
      throw new Error('Se requiere el ID de la sede para actualizar');
    }

    const actualizada = await apiClient.put<Sede>(`/sedes/${sede.id}/`, {
      nombre: sede.nombre,
      direccion: sede.direccion,
      seccional: sede.seccional_id,
      activa: sede.activa
    });

    return { message: 'Sede actualizada', id: actualizada.id ?? sede.id };
  },

  /**
   * Elimina una sede
   * @param id ID de la sede a eliminar
   */
  eliminarSede: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/sedes/${id}/`);
    return { message: 'Sede eliminada' };
  }
};