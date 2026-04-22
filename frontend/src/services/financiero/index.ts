import { apiClient } from '../../core/apiClient';
import type {
  Factura,
  Proveedor,
  Departamento,
  ParametroSLA,
  CuentaContable,
  CentroCosto,
  DocumentoAdjunto,
  HistorialFactura,
  ComentarioFactura,
  CreateFacturaDTO,
  PaginatedResponse,
} from '../../models/financiero';

// apiClient ya incluye el prefijo /api en su base URL
const API_BASE = '/financiero';

// Helper para construir query strings
const buildQueryString = (params?: Record<string, any>): string => {
  if (!params || Object.keys(params).length === 0) return '';
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
};

// ============================================================
// FACTURAS
// ============================================================

export const facturasService = {
  // Obtener todas las facturas
  getAll: async (params?: any): Promise<PaginatedResponse<Factura>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/facturas/${query ? '?' + query : ''}`;
    const response = await apiClient.get<PaginatedResponse<Factura>>(endpoint);
    return response;
  },

  // Obtener factura por ID
  getById: async (id: number): Promise<Factura> => {
    const response = await apiClient.get<Factura>(`${API_BASE}/facturas/${id}/`);
    return response;
  },

  // Crear factura
  create: async (data: CreateFacturaDTO): Promise<Factura> => {
    const response = await apiClient.post<Factura>(`${API_BASE}/facturas/`, data);
    return response;
  },

  // Actualizar factura
  update: async (id: number, data: Partial<Factura>): Promise<Factura> => {
    const response = await apiClient.patch<Factura>(`${API_BASE}/facturas/${id}/`, data);
    return response;
  },

  // Radicar factura
  radicar: async (id: number): Promise<Factura> => {
    const response = await apiClient.post<Factura>(`${API_BASE}/facturas/${id}/radicar/`);
    return response;
  },

  // Causar factura
  causar: async (id: number): Promise<Factura> => {
    const response = await apiClient.post<Factura>(`${API_BASE}/facturas/${id}/causar/`);
    return response;
  },

  // Alistar factura
  alistar: async (id: number): Promise<Factura> => {
    const response = await apiClient.post<Factura>(`${API_BASE}/facturas/${id}/alistar/`);
    return response;
  },

  // Rechazar factura
  rechazar: async (id: number, motivo: string): Promise<any> => {
    const response = await apiClient.post<Factura>(`${API_BASE}/facturas/${id}/rechazar/`, { motivo });
    return response;
  },

  // Obtener facturas pendientes
  getPendientes: async (): Promise<Factura[]> => {
    const response = await apiClient.get<any>(`${API_BASE}/facturas/pendientes/`);
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },

  // Obtener estadísticas
  getEstadisticas: async (): Promise<any> => {
    const response = await apiClient.get<any>(`${API_BASE}/facturas/estadisticas/`);
    return response;
  },

  // Obtener seguimiento de factura
  getSeguimiento: async (id: number): Promise<any> => {
    const response = await apiClient.get<any>(`${API_BASE}/facturas/${id}/seguimiento/`);
    return response;
  },

  // Obtener próximo número sugerido
  getNumeroSugerido: async (): Promise<string> => {
    const response = await apiClient.get<{ numero_factura?: string }>(`${API_BASE}/facturas/numero_sugerido/`);
    return response?.numero_factura || '';
  },

  // Completar registro de factura pendiente (desde Mis Pendientes)
  completarRegistro: async (id: number, data: Partial<Factura>): Promise<Factura> => {
    const response = await apiClient.patch<Factura>(`${API_BASE}/facturas/${id}/completar_registro/`, data);
    return response;
  },
};

// ============================================================
// PROVEEDORES
// ============================================================

export const proveedoresService = {
  getAll: async (params?: any): Promise<PaginatedResponse<Proveedor>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/proveedores/${query ? '?' + query : ''}`;
    const response = await apiClient.get<PaginatedResponse<Proveedor>>(endpoint);
    return response;
  },

  getById: async (id: number): Promise<Proveedor> => {
    const response = await apiClient.get<Proveedor>(`${API_BASE}/proveedores/${id}/`);
    return response;
  },

  create: async (data: Partial<Proveedor>): Promise<Proveedor> => {
    const response = await apiClient.post<Proveedor>(`${API_BASE}/proveedores/`, data);
    return response;
  },

  update: async (id: number, data: Partial<Proveedor>): Promise<Proveedor> => {
    const response = await apiClient.patch<Proveedor>(`${API_BASE}/proveedores/${id}/`, data);
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${API_BASE}/proveedores/${id}/`);
  },

  getMiPerfil: async (nit?: string): Promise<Proveedor> => {
    const query = nit ? `?nit=${encodeURIComponent(nit)}` : '';
    const response = await apiClient.get<Proveedor>(`${API_BASE}/proveedores/mi_perfil/${query}`);
    return response;
  },

  getMisFacturas: async (proveedorId: number, params?: any): Promise<PaginatedResponse<Factura>> => {
    const query = buildQueryString({ proveedor: proveedorId, ...params });
    const endpoint = `${API_BASE}/facturas/${query ? '?' + query : ''}`;
    const response = await apiClient.get<PaginatedResponse<Factura>>(endpoint);
    return response;
  },
};

// ============================================================
// DEPARTAMENTOS
// ============================================================

export const departamentosService = {
  getAll: async (params?: any): Promise<PaginatedResponse<Departamento>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/departamentos/${query ? '?' + query : ''}`;
    const response = await apiClient.get<PaginatedResponse<Departamento>>(endpoint);
    return response;
  },

  getById: async (id: number): Promise<Departamento> => {
    const response = await apiClient.get<Departamento>(`${API_BASE}/departamentos/${id}/`);
    return response;
  },

  getAreasSolicitantes: async (): Promise<Departamento[]> => {
    const response = await apiClient.get<any>(`${API_BASE}/departamentos/areas_solicitantes/`);
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },
};

// ============================================================
// CUENTAS CONTABLES
// ============================================================

export const cuentasContablesService = {
  getAll: async (params?: any): Promise<PaginatedResponse<CuentaContable>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/cuentas-contables/${query ? '?' + query : ''}`;
    const response = await apiClient.get<PaginatedResponse<CuentaContable>>(endpoint);
    return response;
  },

  getById: async (id: number): Promise<CuentaContable> => {
    const response = await apiClient.get<CuentaContable>(`${API_BASE}/cuentas-contables/${id}/`);
    return response;
  },
};

// ============================================================
// CENTROS DE COSTO
// ============================================================

export const centrosCostoService = {
  getAll: async (params?: any): Promise<PaginatedResponse<CentroCosto>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/centros-costo/${query ? '?' + query : ''}`;
    const response = await apiClient.get<PaginatedResponse<CentroCosto>>(endpoint);
    return response;
  },

  getById: async (id: number): Promise<CentroCosto> => {
    const response = await apiClient.get<CentroCosto>(`${API_BASE}/centros-costo/${id}/`);
    return response;
  },
};

export const parametrosSlaService = {
  getResumenProceso: async (): Promise<{ totalDias: number; todosHabiles: boolean; etapas: number }> => {
    const response = await apiClient.get<any>(`${API_BASE}/parametros-sla/`);
    const list: ParametroSLA[] = Array.isArray(response) ? response : response?.results || [];

    const totalDias = list.reduce((acc, item) => acc + (Number(item.dias_maximos) || 0), 0);
    const todosHabiles = list.length > 0 ? list.every((item) => Boolean(item.aplica_dias_habiles)) : true;

    return {
      totalDias,
      todosHabiles,
      etapas: list.length,
    };
  },
};

// ============================================================
// DOCUMENTOS ADJUNTOS
// ============================================================

export const documentosService = {
  getByFactura: async (facturaId: number): Promise<DocumentoAdjunto[]> => {
    const query = buildQueryString({ factura_id: facturaId });
    const endpoint = `${API_BASE}/documentos/${query ? '?' + query : ''}`;
    const response = await apiClient.get<any>(endpoint);
    return response.results || response;
  },

  upload: async (facturaId: number, file: File, tipoDocumento: string): Promise<DocumentoAdjunto> => {
    const formData = new FormData();
    formData.append('factura', facturaId.toString());
    formData.append('nombre_archivo', file.name);
    formData.append('tipo_documento', tipoDocumento);
    formData.append('url_storage', file.name);

    const response = await apiClient.postFormData<DocumentoAdjunto>(`${API_BASE}/documentos/`, formData);
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${API_BASE}/documentos/${id}/`);
  },
};

// ============================================================
// HISTORIAL
// ============================================================

export const historialService = {
  getByFactura: async (facturaId: number): Promise<HistorialFactura[]> => {
    const query = buildQueryString({ factura_id: facturaId });
    const endpoint = `${API_BASE}/historial/${query ? '?' + query : ''}`;
    const response = await apiClient.get<any>(endpoint);
    return response.results || response;
  },
};

// ============================================================
// COMENTARIOS
// ============================================================

export const comentariosService = {
  getByFactura: async (facturaId: number): Promise<ComentarioFactura[]> => {
    const query = buildQueryString({ factura_id: facturaId });
    const endpoint = `${API_BASE}/comentarios/${query ? '?' + query : ''}`;
    const response = await apiClient.get<any>(endpoint);
    return response.results || response;
  },

  create: async (facturaId: number, comentario: string, tipo: string): Promise<ComentarioFactura> => {
    const response = await apiClient.post<ComentarioFactura>(`${API_BASE}/comentarios/`, {
      factura: facturaId,
      comentario,
      tipo,
    });
    return response;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete<void>(`${API_BASE}/comentarios/${id}/`);
  },
};
