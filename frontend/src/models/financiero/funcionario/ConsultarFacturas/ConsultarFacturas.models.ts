
export interface FuncionarioConsultaRow {
  id: string;
  facturaId: number;
  riesgo: 'verde' | 'amarillo' | 'naranja' | 'vencido';
  idTramite: string;
  proveedor: string;
  nit?: string;
  area: string;
  monto: number;
  estado: string;
  etapa: string;
  numeroRadicado: string;
  sinRadicado: boolean;
  fechaFactura: string;
  fechaRecepcion: string;
  dias: number;
}

export interface FuncionarioEstadoChange {
  id: number;
  numeroFactura: string;
  estadoAnterior: string;
  estadoNuevo: string;
}
