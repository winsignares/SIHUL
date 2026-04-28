export type FuncionarioDocumentType =
  | 'Factura'
  | 'Orden de Compra'
  | 'Certificación Bancaria'
  | 'Acta de Entrega'
  | 'Soporte Adicional';

export interface FuncionarioUploadedDoc {
  id: string;
  type: FuncionarioDocumentType;
  file: File;
}

export interface PrefillFromPendiente {
  facturaId: number;
  snapshot?: {
    numeroFactura?: string;
    proveedorId?: number;
    proveedorNombre?: string;
    nit?: string;
    tipoDocumento?: string;
    valorSubtotal?: number;
    valorIva?: number;
    valorTotal?: number;
    fechaFactura?: string;
    fechaRecepcion?: string;
    departamentoId?: number;
    descripcion?: string;
    observaciones?: string;
  };
}
