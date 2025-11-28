import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';

export interface ResultadosBusqueda {
  espacios: any[];
  usuarios: any[];
  horarios: any[];
  prestamos: any[];
}

export const busquedaService = {
  async buscar(query: string, tipo?: string): Promise<ResultadosBusqueda> {
    let url = `${ENDPOINTS.BUSQUEDA.GLOBAL}?q=${encodeURIComponent(query)}`;
    if (tipo) {
      url += `&tipo=${tipo}`;
    }
    
    const response = await apiClient.get<{ resultados: ResultadosBusqueda }>(url);
    return response.resultados;
  },
};
