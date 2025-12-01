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
  async getPeriodoActivo(): Promise<PeriodoActivo> {
    try {
      // El apiClient.get() retorna directamente el JSON, no response.data
      const response = await apiClient.get<PeriodoActivo>('/periodos/activo/');
      
      if (response && response.nombre) {
        return response;
      }
      
      // Si no hay respuesta válida, usar fallback
      return {
        id: 0,
        nombre: '2025-1',
        fecha_inicio: '2025-01-01',
        fecha_fin: '2025-06-30',
        activo: true
      };
    } catch (error: any) {
      console.error('Error fetching active period:', error);
      // Retornar un período por defecto en caso de error
      return {
        id: 0,
        nombre: '2025-1',
        fecha_inicio: '2025-01-01',
        fecha_fin: '2025-06-30',
        activo: true
      };
    }
  }
};

export { periodoActivoService };
