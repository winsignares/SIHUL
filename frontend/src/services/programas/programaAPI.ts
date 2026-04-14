import { apiClient } from '../../core/apiClient';

export interface Programa {
  id?: number;
  nombre: string;
  facultad_id: number;
  semestres: number;
  activo: boolean;
}

interface ProgramaApi {
  id?: number;
  nombre: string;
  facultad: number;
  semestres: number;
  activo: boolean;
}

const toFrontendPrograma = (programa: ProgramaApi): Programa => ({
  id: programa.id,
  nombre: programa.nombre,
  facultad_id: programa.facultad,
  semestres: programa.semestres,
  activo: programa.activo,
});

/**
 * Servicio para la gestión de programas académicos
 */
export const programaService = {
  /**
   * Obtiene la lista de todos los programas académicos
   */
  listarProgramas: async (): Promise<{ programas: Programa[] }> => {
    const programasApi = await apiClient.get<ProgramaApi[]>('/programas/');
    const programas = programasApi.map(toFrontendPrograma);
    return { programas };
  },

  /**
   * Obtiene un programa académico por su ID
   * @param id ID del programa académico
   */
  obtenerPrograma: async (id: number): Promise<Programa> => {
    const programaApi = await apiClient.get<ProgramaApi>(`/programas/${id}/`);
    return toFrontendPrograma(programaApi);
  },

  /**
   * Crea un nuevo programa académico
   * @param programa Datos del programa a crear
   */
  crearPrograma: async (programa: Omit<Programa, 'id'>): Promise<{ message: string; id: number }> => {
    const creado = await apiClient.post<ProgramaApi>('/programas/', {
      nombre: programa.nombre,
      facultad: programa.facultad_id,
      semestres: programa.semestres,
      activo: programa.activo ?? true
    });
    return { message: 'Programa creado', id: creado.id ?? 0 };
  },

  /**
   * Actualiza un programa académico existente
   * @param programa Datos del programa a actualizar
   */
  actualizarPrograma: async (programa: Programa): Promise<{ message: string; id: number }> => {
    if (!programa.id) {
      throw new Error('Se requiere el ID del programa para actualizar');
    }

    const actualizado = await apiClient.put<ProgramaApi>(`/programas/${programa.id}/`, {
      nombre: programa.nombre,
      facultad: programa.facultad_id,
      semestres: programa.semestres,
      activo: programa.activo
    });
    return { message: 'Programa actualizado', id: actualizado.id ?? programa.id };
  },

  /**
   * Elimina un programa académico
   * @param id ID del programa a eliminar
   */
  eliminarPrograma: async (id: number): Promise<{ message: string }> => {
    await apiClient.delete(`/programas/${id}/`);
    return { message: 'Programa eliminado' };
  }
};