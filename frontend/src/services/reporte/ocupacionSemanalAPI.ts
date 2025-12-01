import { apiClient } from '../../core/apiClient';
import type { EspacioOcupacion } from '../../models/index';

export interface OcupacionSemanalResponse {
  semana_inicio: string;
  semana_fin: string;
  ocupacion: EspacioOcupacion[];
}

export interface TipoEspacioResponse {
  tipos_espacio: Array<{
    id: number;
    nombre: string;
    descripcion?: string;
  }>;
}

class OcupacionSemanalService {
  /**
   * Obtiene la ocupación semanal de espacios
   * @param tipoEspacioId - ID del tipo de espacio (opcional)
   * @param semanaOffset - Offset de semanas (0 = semana actual, 1 = próxima, -1 = pasada)
   */
  async getOcupacionSemanal(tipoEspacioId?: number, semanaOffset: number = 0): Promise<OcupacionSemanalResponse> {
    try {
      const params = new URLSearchParams();
      if (tipoEspacioId) {
        params.append('tipo_espacio_id', tipoEspacioId.toString());
      }
      params.append('semana_offset', semanaOffset.toString());

      const response = await apiClient.get(`/espacios/ocupacion/semanal/?${params.toString()}`);
      return response as OcupacionSemanalResponse;
    } catch (error) {
      console.error('Error fetching ocupación semanal:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los tipos de espacio para el filtro
   */
  async getTiposEspacio(): Promise<Array<{ id: number; nombre: string; descripcion?: string }>> {
    try {
      const response = await apiClient.get('/espacios/tipos/list/');
      if (response && typeof response === 'object' && 'tipos_espacio' in response) {
        return (response as TipoEspacioResponse).tipos_espacio;
      }
      return [];
    } catch (error) {
      console.error('Error fetching tipos de espacio:', error);
      return [];
    }
  }

  /**
   * Genera y descarga el PDF de ocupación semanal
   * @param tipoEspacioId - ID del tipo de espacio (opcional)
   * @param semanaOffset - Offset de semanas
   */
  async generarPDFOcupacion(tipoEspacioId?: number, semanaOffset: number = 0): Promise<void> {
    try {
      const payload = {
        tipo_espacio_id: tipoEspacioId || null,
        semana_offset: semanaOffset
      };

      const response = await fetch(`${import.meta.env.VITE_API_URL}/espacios/ocupacion/pdf/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      // Generar blob y descargar
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ocupacion-semanal-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  }
}

export const ocupacionSemanalService = new OcupacionSemanalService();
