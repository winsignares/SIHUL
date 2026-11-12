
export type BancoOption = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigo_bancario?: string | null;
};

export type TipoCuentaOption = {
  id: number;
  nombre: string;
  descripcion?: string | null;
};

export type FormState = {
  tipoDocumento: string;
  identificacionFactura: string;
  departamentoId: number;
  valorSubtotal: number;
  ivaPorcentaje: number;
  valorIva: number;
  valorTotal: number;
  fechaFactura: string;
  fechaRecepcion: string;
  banco: string;
  bancoId: number | null;
  tipoCuenta: string;
  numeroCuenta: string;
  cuentaBancaria: string;
};

export type ServiceItem = {
  id: string;
  cantidad: number;
  servicio: string;
  valorUnitario: number;
  ivaPorcentaje: number;
};

export const formatMoney = (val: unknown) => {
  const num = Number(val) || 0;
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const formatNumberInput = (value: string) => {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const createEmptyServiceItem = (): ServiceItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  cantidad: 1,
  servicio: '',
  valorUnitario: 0,
  ivaPorcentaje: 19,
});

export const calculateServiceItem = (item: ServiceItem) => {
  const cantidad = Number(item.cantidad) || 0;
  const valorUnitario = Number(item.valorUnitario) || 0;
  const ivaPorcentaje = Number(item.ivaPorcentaje) || 0;
  const subtotal = Number((cantidad * valorUnitario).toFixed(2));
  const valorIva = Number(((subtotal * ivaPorcentaje) / 100).toFixed(2));
  const total = Number((subtotal + valorIva).toFixed(2));

  return {
    ...item,
    cantidad,
    valorUnitario,
    ivaPorcentaje,
    subtotal,
    valorIva,
    total,
  };
};

export const TIPO_DOCUMENTO_OPTS = [
  'Factura',
  'Cuenta de Cobro',
];
export const DOC_TYPES = ['Factura', 'Orden de Compra', 'Certificación Bancaria', 'Acta de Entrega', 'Soporte Adicional'];
export const DOC_TYPE_DETAILS: Record<string, { label: string; helper?: string; optional?: boolean }> = {
  Factura: {
    label: 'Factura / Cuenta de Cobro',
    helper: 'Carga la factura electrónica o la cuenta de cobro firmada.',
  },
  'Orden de Compra': {
    label: 'Orden de Compra / Servicio / Contrato',
    helper: 'Incluye la orden de compra, servicio contratado o el contrato firmado.',
  },
  'Certificación Bancaria': {
    label: 'Certificación Bancaria',
    helper: 'Requerida si tu información bancaria cambió recientemente.',
  },
  'Acta de Entrega': {
    label: 'Acta de recibo a satisfacción',
    helper: 'Adjunta el acta firmada donde conste la recepción del servicio o bien.',
  },
  'Soporte Adicional': {
    label: 'Soporte Adicional',
    helper: 'Seguridad social, entrada de almacén o entrada de activo fijo.',
    optional: true,
  },
};
export const MAX_SPECIFIC_DOC_SIZE_BYTES = 25 * 1024 * 1024;
export const ALLOWED_DOC_EXTENSIONS = new Set(['pdf']);
export const ALLOWED_DOC_MIME_TYPES = new Set(['application/pdf']);
export const BANCOS_COLOMBIA = [
  'Bancolombia',
  'Banco de Bogotá',
  'Davivienda',
  'BBVA',
  'Banco Popular',
  'Banco AV Villas',
  'Banco Caja Social',
  'Banco de Occidente',
  'Scotiabank Colpatria',
  'Otro',
];
export const TIPO_CUENTA_OPTS = ['Ahorros', 'Corriente'];

export type ApiListResponse<T> = {
  results?: T[];
};

export const extractResults = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && Array.isArray((payload as ApiListResponse<T>).results)) {
    return (payload as ApiListResponse<T>).results as T[];
  }
  return [];
};

export const getToday = () => new Date().toISOString().split('T')[0];

export const fileStartsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((value, idx) => bytes[idx] === value);

export const validateDocFile = async (file: File): Promise<string | null> => {
  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (!ALLOWED_DOC_EXTENSIONS.has(extension)) {
    return 'Tipo de archivo no permitido. Usa PDF, XML, PNG o JPG.';
  }

  if (file.size > MAX_SPECIFIC_DOC_SIZE_BYTES) {
    return `El archivo "${file.name}" supera el tamaño máximo permitido de 25 MB.`;
  }

  if (file.type && !ALLOWED_DOC_MIME_TYPES.has(file.type)) {
    return 'El tipo MIME del archivo no es válido para documentos financieros.';
  }

  const head = new Uint8Array(await file.slice(0, 512).arrayBuffer());
  const decoded = new TextDecoder().decode(head).trimStart().toLowerCase();

  if (decoded.startsWith('<!doctype html') || decoded.startsWith('<html')) {
    return 'El archivo seleccionado contiene HTML y no un documento válido.';
  }

  if (extension === 'pdf' && !fileStartsWith(head, [0x25, 0x50, 0x44, 0x46, 0x2d])) {
    return 'El contenido no corresponde a un PDF válido.';
  }

  if (extension === 'png' && !fileStartsWith(head, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) {
    return 'El contenido no corresponde a una imagen PNG válida.';
  }

  if ((extension === 'jpg' || extension === 'jpeg') && !fileStartsWith(head, [0xff, 0xd8, 0xff])) {
    return 'El contenido no corresponde a una imagen JPG válida.';
  }

  if (extension === 'xml' && !(decoded.startsWith('<?xml') || decoded.startsWith('<'))) {
    return 'El contenido no corresponde a un XML válido.';
  }

  return null;
};
