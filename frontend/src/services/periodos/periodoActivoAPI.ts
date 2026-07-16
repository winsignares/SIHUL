import { apiClient } from '../../core/apiClient';

export interface PeriodoActivo {
  id: number;
  nombre: string;
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
}

const periodoActivoService = {
  /**
   * Obtiene el período académico activo actual
   */
  async getPeriodoActivo(): Promise<PeriodoActivo | null> {
    try {
      const response = await apiClient.get<PeriodoActivo>('/periodos/activo/');
      
      if (response && response.nombre) {
        return response;
      }
      
      return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error fetching active period:', error);
      return null;
    }
  }
};

export { periodoActivoService };
