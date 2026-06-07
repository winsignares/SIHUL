import { apiClient } from '../../../core/apiClient';
import type { DocumentoAdjunto, PaginatedResponse } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const documentosService = {
  getByFactura: async (facturaId: number): Promise<DocumentoAdjunto[]> => {
    const query = buildQueryString({ factura_id: facturaId });
    const endpoint = `${API_BASE}/documentos/${query ? `?${query}` : ''}`;
    const response = await apiClient.get<PaginatedResponse<DocumentoAdjunto> | DocumentoAdjunto[]>(endpoint);
    if (Array.isArray(response)) return response;
    return response.results || [];
  },

  upload: async (facturaId: number, file: File, tipoDocumento: string): Promise<DocumentoAdjunto> => {
    const formData = new FormData();
    const truncatedFileName = file.name.length > 100 ? file.name.substring(0, 100) : file.name;
    formData.append('factura', facturaId.toString());
    formData.append('nombre_archivo', truncatedFileName);
    formData.append('tipo_documento', tipoDocumento);
    formData.append('url_storage', truncatedFileName);
    formData.append('tamano_bytes', file.size.toString());
    if (file.type) formData.append('tipo_mime', file.type);
    formData.append('archivo', file);

    console.info(
      `[documentosService.upload] POST /financiero/documentos/ factura=${facturaId} tipo=${tipoDocumento} archivo=${file.name} (${file.size}B)`
    );
    try {
      const response = await apiClient.postFormData<DocumentoAdjunto>(`${API_BASE}/documentos/`, formData);
      console.info(`[documentosService.upload] ✅ Creado DocumentoAdjunto id=${response?.id} para factura ${facturaId}`);
      return response;
    } catch (err: unknown) {
      console.error(`[documentosService.upload] ❌ Error al subir "${tipoDocumento}" para factura ${facturaId}:`, err);
      throw err;
    }
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${API_BASE}/documentos/${id}/`);
  },
};
