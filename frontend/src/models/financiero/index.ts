// Modelos para el módulo Financiero

export interface Proveedor {
  id: number;
  nit: string;
  razon_social: string;
  nombre_comercial?: string;
  tipo_proveedor: 'Bienes' | 'Servicios' | 'Construcción' | 'Mixto';
  email?: string;
  telefono?: string;
  cuenta_bancaria_completa?: string;
  estado: 'Activo' | 'Inactivo' | 'Bloqueado' | 'Verificación';
}

export interface Departamento {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'Financiero' | 'Académico' | 'Administrativo';
  responsable_id?: number;
  responsable?: { id: number; nombre: string };
  estado: 'Activo' | 'Inactivo';
}

export interface CuentaContable {
  id: number;
  codigo: string;
  nombre: string;
  tipo_cuenta: 'Activo' | 'Pasivo' | 'Patrimonio' | 'Ingreso' | 'Gasto' | 'Costo';
  nivel: number;
  naturaleza: 'Débito' | 'Crédito';
}

export interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'Administrativo' | 'Académico' | 'Operativo' | 'Investigación' | 'Extensión';
}

export type EstadoFactura =
  | 'Recibida'
  | 'Radicada'
  | 'Causada'
  | 'Alistada'
  | 'Aprobada Auditoría'
  | 'Rechazada Auditoría'
  | 'Cargada'
  | 'Revisada Dir. Financiera'
  | 'Enviada Rectoría'
  | 'Autorizada'
  | 'Rechazada'
  | 'Pago Aplicado'
  | 'Pagada'
  | 'Devuelta'
  | 'Detenida'
  | 'Anulada';

export type IndicadorRiesgo = 'ok' | 'atencion' | 'atrasada' | 'vencida';

export interface Factura {
  id: number;
  numero_factura: string;
  numero_radicado?: string;
  numero_proceso_pago?: string;
  numero_transaccion?: string;
  numero_comprobante?: string;
  
  proveedor_id: number;
  proveedor?: Proveedor;
  
  departamento_id: number;
  departamento?: Departamento;
  
  cuenta_contable_id?: number;
  centro_costo_id?: number;
  
  valor_subtotal: number;
  valor_iva: number;
  valor_retencion_renta: number;
  valor_retencion_iva: number;
  valor_retencion_ica: number;
  valor_total: number;
  valor_neto_pagar: number;
  
  tipo_documento: 'Factura Electrónica' | 'Factura' | 'Cuenta de Cobro' | 'Nota Débito' | 'Otro';
  descripcion: string;
  observaciones?: string;
  
  fecha_factura: string;
  fecha_recepcion: string;
  fecha_radicacion?: string;
  fecha_causacion?: string;
  fecha_alistamiento?: string;
  fecha_aprobacion_auditoria?: string;
  fecha_cargue?: string;
  fecha_autorizacion?: string;
  fecha_pago_aplicado?: string;
  fecha_comprobante?: string;
  
  estado: EstadoFactura;
  etapa_actual?: string;
  indicador_riesgo: IndicadorRiesgo;
  sla_cumplido: boolean;
  dias_transcurridos: number;
  
  usuario_responsable_id?: number;
  usuario_responsable?: { id: number; nombre: string };
  
  urgente: boolean;
  requiere_autorizacion_especial: boolean;
  
  fecha_creacion: string;
  fecha_modificacion: string;
}

export interface DocumentoAdjunto {
  id: number;
  factura_id: number;
  nombre_archivo: string;
  tipo_documento: string;
  url_storage: string;
  obligatorio: boolean;
  verificado: boolean;
  fecha_carga: string;
}

export interface HistorialFactura {
  id: number;
  factura_id: number;
  fecha_accion: string;
  accion: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  usuario_nombre?: string;
  usuario_rol?: string;
  observacion?: string;
}

export interface ComentarioFactura {
  id: number;
  factura_id: number;
  usuario_id: number;
  usuario?: { id: number; nombre: string };
  comentario: string;
  tipo: 'Observación' | 'Pregunta' | 'Aclaración' | 'Aprobación' | 'Rechazo';
  fecha_creacion: string;
}

export interface RechazoDevolucion {
  id: number;
  factura_id: number;
  tipo: 'Rechazo' | 'Devolución';
  etapa_rechazo: string;
  motivo: string;
  estado_devolucion: string;
  fecha_rechazo: string;
  usuario_rechaza_id: number;
}

// DTOs para crear/actualizar
export interface CreateFacturaDTO {
  numero_factura?: string;
  proveedor_id: number;
  departamento_id: number;
  cuenta_contable_id?: number;
  centro_costo_id?: number;
  
  valor_subtotal: number;
  valor_iva: number;
  valor_retencion_renta?: number;
  valor_retencion_iva?: number;
  valor_retencion_ica?: number;
  valor_total: number;
  
  tipo_documento: string;
  descripcion: string;
  observaciones?: string;
  
  fecha_factura: string;
  fecha_recepcion: string;
  
  urgente?: boolean;
  usuario_responsable_id?: number;
}

export interface ParametroSLA {
  id: number;
  etapa: string;
  rol_responsable: string;
  dias_maximos: number;
  alerta_amarillo_porcentaje: number;
  alerta_roja_porcentaje: number;
  descripcion?: string;
  activo: boolean;
  aplica_dias_habiles: boolean;
}

export interface UpdateFacturaEstadoDTO {
  motivo?: string;
  observacion?: string;
}

// Respuesta de APIs
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
