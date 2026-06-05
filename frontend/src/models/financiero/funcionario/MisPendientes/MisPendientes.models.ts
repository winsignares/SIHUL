export interface FuncionarioPendingRow {
  id: string;
  numeroFactura?: string;
  proveedor: string;
  nit: string;
  contacto: string;
  tipoDocumento: string;
  descripcion: string;
  valorTotal: number;
  fechaFactura: string;
  fechaRecepcion: string;
  areaSolicitante: string;
  dias: number;
  slaMax: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'vencido';
  accion: string;
  proveedorId: number;
  departamentoId?: number;
  departamentoNombre?: string;
}
