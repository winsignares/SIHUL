import { apiClient } from '../../core/apiClient';

export interface Seccional {
  id: number;
  ciudad: string;
  activa?: boolean;
}

type RespuestaSeccionales = Seccional[] | { results?: Seccional[]; seccionales?: Seccional[] };

export const seccionalService = {
  /**
   * Seccionales que la persona puede asignar: el administrador global ve todas; quien administra una seccional,
   * solo la suya.
   */
  listar: async (): Promise<Seccional[]> => {
    const respuesta = await apiClient.get<RespuestaSeccionales>('/seccionales/');
    if (Array.isArray(respuesta)) return respuesta;
    return respuesta.results ?? respuesta.seccionales ?? [];
  },
};
