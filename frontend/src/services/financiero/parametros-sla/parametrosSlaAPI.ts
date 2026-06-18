import { apiClient } from '../../../core/apiClient';
import type { PaginatedResponse, ParametroSLA } from '../../../models/financiero/core.models';
import { API_BASE } from '../core/shared';

export const parametrosSlaService = {
  listar: async (): Promise<ParametroSLA[]> => {
    const response = await apiClient.get<PaginatedResponse<ParametroSLA> | ParametroSLA[]>(`${API_BASE}/parametros-sla/`);
    return Array.isArray(response) ? response : response?.results || [];
  },

  getResumenProceso: async (): Promise<{ totalDias: number; todosHabiles: boolean; etapas: number }> => {
    const list = await parametrosSlaService.listar();
    const totalDias = list.reduce((acc, item) => acc + (Number(item.dias_maximos) || 0), 0);
    const todosHabiles = list.length > 0 ? list.every((item) => Boolean(item.aplica_dias_habiles)) : true;
    return { totalDias, todosHabiles, etapas: list.length };
  },
};
