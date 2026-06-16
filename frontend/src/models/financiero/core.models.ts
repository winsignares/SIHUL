// Modelos base compartidos para el módulo Financiero

export interface Proveedor {
  id: number;
  usuario?: number | null;
  nit: string;
  razon_social: string;
  nombre_comercial?: string;
  tipo_proveedor: 'Bienes' | 'Servicios' | 'Construcción' | 'Mixto';
  tipo_persona?: 'Natural' | 'Jurídica';
  email?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  departamento?: string;
  pais?: string;
  contacto_principal?: string;
  telefono_contacto?: string;
  banco?: string;
  tipo_cuenta?: 'Ahorros' | 'Corriente' | string;
  numero_cuenta?: string;
  cuenta_bancaria_completa?: string;
  regimen_tributario?: string;
  observaciones?: string;
  estado: 'Activo' | 'Inactivo' | 'Bloqueado' | 'Verificación';
}

export interface PaisCatalogo {
  id: number;
  nombre: string;
  codigo_iso: string;
  activo: boolean;
}

export interface DepartamentoGeograficoCatalogo {
  id: number;
  nombre: string;
  codigo?: string | null;
  activo: boolean;
  pais_id: number;
  pais?: PaisCatalogo;
}

export interface CiudadCatalogo {
  id: number;
  nombre: string;
  activo: boolean;
  departamento_id: number;
  pais_id: number;
  departamento?: DepartamentoGeograficoCatalogo;
}

export interface BancoCatalogo {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigo_bancario?: string | null;
  activo: boolean;
}

export interface TipoCuentaCatalogo {
  id: number;
  nombre: string;
  descripcion?: string | null;
  activo: boolean;
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
  cuenta_padre?: string | null;
  naturaleza: 'Débito' | 'Crédito';
  acepta_movimiento?: boolean;
  requiere_tercero?: boolean;
  requiere_centro_costo?: boolean;
  descripcion?: string | null;
  estado?: 'Activo' | 'Inactivo';
  fecha_creacion?: string;
}

export interface CentroCosto {
  id: number;
  codigo: string;
  nombre: string;
  tipo: 'Administrativo' | 'Académico' | 'Operativo' | 'Investigación' | 'Extensión';
  departamento_id?: number | null;
  departamento?: Departamento | number | null;
  presupuesto_asignado?: number | null;
  presupuesto_ejecutado?: number | null;
  porcentaje_ejecucion_display?: number;
  estado?: 'Activo' | 'Inactivo';
  fecha_creacion?: string;
  fecha_modificacion?: string;
}

export type EstadoFactura =
  | 'Recibida'
  | 'Registrada'
  | 'Radicada'
  | 'Causada'
  | 'Alistada'
  | 'Aprobada Auditoría'
  | 'Rechazada Auditoría'
  | 'Enviado a dirección financiera'
  | 'Cargada'
  | 'Revisada Dir. Financiera'
  | 'Enviada Rectoría'
  | 'Autorizada'
  | 'Rechazada por Rectoría'
  | 'Rechazada'
  | 'Pago Aplicado'
  | 'Pagada'
  | 'Devuelta'
  | 'Detenida'
  | 'Anulada';

export type IndicadorRiesgo = 'ok' | 'atencion' | 'atrasada' | 'vencida';

export interface ItemFactura {
  id?: number;
  descripcion: string;
  cantidad: number;
  valor_unitario: number;
  porcentaje_iva: number;
  valor_subtotal: number;
  valor_iva: number;
  valor_total: number;
  orden?: number;
}

export interface Factura {
  id: number;
  numero_factura: string;
  numero_radicado?: string;
  numero_proceso_pago?: string;
  numero_confirmacion?: string;
  numero_transaccion?: string;
  numero_comprobante?: string;
  numero_operacion_contable?: string;
  consecutivo_operacion?: string;
  archivo_plano_generado?: string;

  proveedor_id: number;
  proveedor?: Proveedor;

  departamento_id: number;
  departamento?: Departamento;

  cuenta_contable_id?: number;
  centro_costo_id?: number;
  cuenta_contable?: CuentaContable;
  centro_costo?: CentroCosto;

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
  identificacion_factura?: string;
  items?: ItemFactura[];
  cuenta_bancaria_proveedor?: string;

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
  sla_objetivo_dias?: number | null;

  usuario_responsable_id?: number;
  usuario_responsable?: { id: number; nombre: string };

  urgente: boolean;
  requiere_autorizacion_especial: boolean;

  fecha_creacion: string;
  fecha_modificacion: string;

  documentos?: DocumentoAdjunto[];
  historial?: HistorialFactura[];
  comentarios?: ComentarioFactura[];
}

export interface DocumentoAdjunto {
  id: number;
  factura_id: number;
  nombre_archivo: string;
  tipo_documento: string;
  url_storage: string;
  archivo_url?: string | null;
  tipo_mime?: string | null;
  tamano_bytes?: number | null;
  obligatorio: boolean;
  verificado: boolean;
  fecha_carga: string;
}

export interface HistorialFactura {
  id: number;
  factura_id: number;
  numero_factura?: string;
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
  identificacion_factura?: string;
  items?: ItemFactura[];

  fecha_factura: string;
  fecha_recepcion: string;

  cuenta_bancaria_proveedor?: string;
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
