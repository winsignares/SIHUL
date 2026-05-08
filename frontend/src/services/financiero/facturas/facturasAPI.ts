import { apiClient } from '../../../core/apiClient';
import type { CreateFacturaDTO, Factura, PaginatedResponse } from '../../../models/financiero/core.models';
import { API_BASE, buildQueryString } from '../core/shared';

export const facturasService = {
  getAll: async (params?: Record<string, unknown>): Promise<PaginatedResponse<Factura>> => {
    const query = buildQueryString(params);
    const endpoint = `${API_BASE}/facturas/${query ? `?${query}` : ''}`;
    return apiClient.get<PaginatedResponse<Factura>>(endpoint);
  },

  getById: async (id: number): Promise<Factura> => {
    return apiClient.get<Factura>(`${API_BASE}/facturas/${id}/`);
  },

  create: async (data: CreateFacturaDTO): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/`, data);
  },

  update: async (id: number, data: Partial<Factura>): Promise<Factura> => {
    return apiClient.patch<Factura>(`${API_BASE}/facturas/${id}/`, data);
  },

  radicar: async (id: number, observaciones?: string): Promise<Factura> => {
    const body = observaciones ? { observaciones } : undefined;
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/radicar/`, body);
  },

  causar: async (
    id: number,
    opts?: { cuenta_contable_id?: number; centro_costo_id?: number; observaciones?: string }
  ): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/causar/`, opts || {});
  },

  getByEstado: async (estado: string): Promise<Factura[]> => {
    const response = await apiClient.get<PaginatedResponse<Factura> | Factura[]>(
      `${API_BASE}/facturas/?estado=${encodeURIComponent(estado)}`
    );
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },

  alistar: async (
    id: number,
    opts?: { numero_proceso_pago?: string; archivo_plano_generado?: string; observaciones?: string }
  ): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/alistar/`, opts || {});
  },

  enviarDireccionFinanciera: async (id: number, observaciones?: string): Promise<Factura> => {
    const body = observaciones ? { observaciones } : undefined;
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/enviar_direccion_financiera/`, body);
  },

  cargarDireccionFinanciera: async (id: number, observaciones?: string): Promise<Factura> => {
    const body = observaciones ? { observaciones } : undefined;
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/cargar_direccion_financiera/`, body);
  },

  enviarRectoria: async (id: number, observaciones?: string): Promise<Factura> => {
    const body = observaciones ? { observaciones } : undefined;
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/enviar_rectoria/`, body);
  },

  autorizarRectoria: async (id: number, observaciones?: string): Promise<Factura> => {
    const body = observaciones ? { observaciones } : undefined;
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/autorizar_rectoria/`, body);
  },

  rechazarRectoria: async (id: number, motivo: string): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/rechazar_rectoria/`, { motivo });
  },

  confirmarControlPago: async (id: number, observaciones?: string): Promise<Factura> => {
    const body = observaciones ? { observaciones } : undefined;
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/confirmar_control_pago/`, body);
  },

  registrarPagoAplicado: async (
    id: number,
    opts: { numero_transaccion: string; fecha_pago_aplicado?: string; observaciones?: string; comprobante_bancario: File }
  ): Promise<Factura> => {
    const formData = new FormData();
    formData.append('numero_transaccion', opts.numero_transaccion);
    if (opts.fecha_pago_aplicado) formData.append('fecha_pago_aplicado', opts.fecha_pago_aplicado);
    if (opts.observaciones) formData.append('observaciones', opts.observaciones);
    formData.append('comprobante_bancario', opts.comprobante_bancario);
    return apiClient.postFormData<Factura>(`${API_BASE}/facturas/${id}/registrar_pago_aplicado/`, formData);
  },

  generarComprobante: async (
    id: number,
    opts: { numero_comprobante: string; observaciones?: string }
  ): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/generar_comprobante/`, opts);
  },

  detenerEnTesoreria: async (id: number, observaciones: string): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/detener_en_tesoreria/`, { observaciones });
  },

  aprobarAuditoria: async (id: number, observaciones?: string): Promise<Factura> => {
    const body = observaciones ? { observaciones } : undefined;
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/aprobar_auditoria/`, body);
  },

  rechazarAuditoria: async (id: number, motivo: string): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/rechazar_auditoria/`, { motivo });
  },

  rechazar: async (id: number, motivo: string, destino?: 'funcionario' | 'radicacion'): Promise<Factura> => {
    return apiClient.post<Factura>(`${API_BASE}/facturas/${id}/rechazar/`, { motivo, destino });
  },

  getPendientes: async (): Promise<Factura[]> => {
    const response = await apiClient.get<PaginatedResponse<Factura> | Factura[]>(`${API_BASE}/facturas/pendientes/`);
    if (Array.isArray(response)) return response;
    return response?.results || [];
  },

  getEstadisticas: async (): Promise<Record<string, unknown>> => {
    return apiClient.get<Record<string, unknown>>(`${API_BASE}/facturas/estadisticas/`);
  },

  getSeguimiento: async (id: number): Promise<Record<string, unknown>> => {
    return apiClient.get<Record<string, unknown>>(`${API_BASE}/facturas/${id}/seguimiento/`);
  },

  getNumeroSugerido: async (): Promise<string> => {
    const response = await apiClient.get<{ numero_factura?: string }>(`${API_BASE}/facturas/numero_sugerido/`);
    return response?.numero_factura || '';
  },

  completarRegistro: async (id: number, data: Partial<Factura>): Promise<Factura> => {
    return apiClient.patch<Factura>(`${API_BASE}/facturas/${id}/completar_registro/`, data);
  },

  corregir: async (id: number, data: Partial<Factura> & { observaciones_correccion?: string }): Promise<Factura> => {
    return apiClient.patch<Factura>(`${API_BASE}/facturas/${id}/corregir/`, data);
  },
};
