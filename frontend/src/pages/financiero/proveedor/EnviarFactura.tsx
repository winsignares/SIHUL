import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  FileText,
  Send,
  Building2,
  DollarSign,
  Upload,
  Plus,
  X,
  Search,
  Trash2,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../core/apiClient';
import { departamentosService, documentosService, facturasService, proveedoresService } from '../../../services/financiero';
import { API_BASE } from '../../../services/financiero/core/shared';
import type { Departamento, Factura, Proveedor } from '../../../models/financiero/core.models';
import type { EnviarFacturaProps, UploadedDoc } from '../../../models/financiero/proveedor';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Button } from '../../../share/button';

type BancoOption = {
  id: number;
  nombre: string;
  descripcion?: string | null;
  codigo_bancario?: string | null;
};

type TipoCuentaOption = {
  id: number;
  nombre: string;
  descripcion?: string | null;
};

type FormState = {
  tipoDocumento: string;
  descripcion: string;
  observaciones: string;
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

type ServiceItem = {
  id: string;
  cantidad: number;
  servicio: string;
  valorUnitario: number;
  ivaPorcentaje: number;
};

const formatMoney = (val: unknown) => {
  const num = Number(val) || 0;
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const formatNumberInput = (value: string) => {
  const num = value.replace(/[^0-9]/g, '');
  if (!num) return '';
  return num.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

const createEmptyServiceItem = (): ServiceItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  cantidad: 1,
  servicio: '',
  valorUnitario: 0,
  ivaPorcentaje: 19,
});

const calculateServiceItem = (item: ServiceItem) => {
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

const buildInvoiceDescription = (
  items: Array<ServiceItem & { subtotal: number; valorIva: number; total: number }>,
) => items
  .filter(item => item.servicio.trim() && item.cantidad > 0 && item.valorUnitario > 0)
  .map((item, index) =>
    `${index + 1}. ${item.cantidad} x ${item.servicio.trim()} | Unitario: ${formatMoney(item.valorUnitario)} | `
    + `Subtotal: ${formatMoney(item.subtotal)} | IVA ${item.ivaPorcentaje}%: ${formatMoney(item.valorIva)} | `
    + `Total: ${formatMoney(item.total)}`)
  .join('\n');

const TIPO_DOCUMENTO_OPTS = [
  'Factura',
  'Cuenta de Cobro',
];
const DOC_TYPES = ['Factura', 'Orden de Compra', 'Certificación Bancaria', 'Acta de Entrega', 'Soporte Adicional'];
const DOC_TYPE_DETAILS: Record<string, { label: string; helper?: string; optional?: boolean }> = {
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
    label: 'Acta de Entrega de Recibo a satisfacción',
    helper: 'Adjunta el acta firmada donde conste la recepción del servicio o bien.',
  },
  'Soporte Adicional': {
    label: 'Soporte Adicional',
    helper: 'Evidencias o soportes que consideres relevantes.',
    optional: true,
  },
};
const ALLOWED_DOC_EXTENSIONS = new Set(['pdf']);
const ALLOWED_DOC_MIME_TYPES = new Set(['application/pdf']);
const BANCOS_COLOMBIA = [
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
const TIPO_CUENTA_OPTS = ['Ahorros', 'Corriente'];

type ApiListResponse<T> = {
  results?: T[];
};

const extractResults = <T,>(payload: unknown): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && Array.isArray((payload as ApiListResponse<T>).results)) {
    return (payload as ApiListResponse<T>).results as T[];
  }
  return [];
};

const getToday = () => new Date().toISOString().split('T')[0];

const fileStartsWith = (bytes: Uint8Array, signature: number[]): boolean =>
  signature.every((value, idx) => bytes[idx] === value);

const validateDocFile = async (file: File): Promise<string | null> => {
  const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : '';
  if (!ALLOWED_DOC_EXTENSIONS.has(extension)) {
    return 'Tipo de archivo no permitido. Usa PDF, XML, PNG o JPG.';
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

export default function EnviarFactura({ miProveedor, onSuccess }: EnviarFacturaProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const correccionFactura = (location.state as { correccionFactura?: Factura } | null)?.correccionFactura;
  const isCorreccion = Boolean(correccionFactura);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [nitBusqueda, setNitBusqueda] = useState('');
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState<Proveedor | null>(miProveedor);
  const [buscandoProveedor, setBuscandoProveedor] = useState(false);
  const [errBusqueda, setErrBusqueda] = useState<string | null>(null);

  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [numeroFacturaSugerido, setNumeroFacturaSugerido] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [docToDelete, setDocToDelete] = useState<UploadedDoc | null>(null);
  const [deletingDoc, setDeletingDoc] = useState(false);
  const [bancos, setBancos] = useState<BancoOption[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuentaOption[]>([]);
  const [serviceItems, setServiceItems] = useState<ServiceItem[]>([createEmptyServiceItem()]);

  const [form, setForm] = useState<FormState>({
    tipoDocumento: 'Factura',
    descripcion: '',
    observaciones: '',
    departamentoId: 0,
    valorSubtotal: 0,
    ivaPorcentaje: 19,
    valorIva: 0,
    valorTotal: 0,
    fechaFactura: getToday(),
    fechaRecepcion: getToday(),
    banco: '',
    bancoId: null,
    tipoCuenta: '',
    numeroCuenta: '',
    cuentaBancaria: '',
  });

  useEffect(() => {
    if (miProveedor) setProveedorSeleccionado(miProveedor);
  }, [miProveedor]);

  useEffect(() => {
    if (!correccionFactura) return;

    const existingDocs = (correccionFactura.documentos || []).map((doc) => ({
      id: String(doc.id),
      type: doc.tipo_documento,
      existingUrl: doc.archivo_url || doc.url_storage || '',
      existingName: doc.nombre_archivo,
      isExisting: true,
    }));

    const ivaPorcentaje = (() => {
      const subtotal = Number(correccionFactura.valor_subtotal || 0);
      const iva = Number(correccionFactura.valor_iva || 0);
      if (!subtotal) return 19;
      return Math.min(100, Math.max(0, Math.round((iva / subtotal) * 100)));
    })();

    setProveedorSeleccionado(correccionFactura.proveedor || miProveedor || null);
    setForm(prev => ({
      ...prev,
      tipoDocumento: correccionFactura.tipo_documento || prev.tipoDocumento,
      observaciones: correccionFactura.observaciones || prev.observaciones,
      departamentoId: correccionFactura.departamento?.id || prev.departamentoId,
      fechaFactura: correccionFactura.fecha_factura || prev.fechaFactura,
      fechaRecepcion: getToday(),
      cuentaBancaria: correccionFactura.cuenta_bancaria_proveedor || prev.cuentaBancaria,
    }));
    setServiceItems([{
      id: `correccion-${correccionFactura.id}`,
      cantidad: 1,
      servicio: correccionFactura.descripcion || '',
      valorUnitario: Number(correccionFactura.valor_subtotal || 0),
      ivaPorcentaje,
    }]);
    setDocs(existingDocs);
    setStep(2);
    setNumeroFacturaSugerido(correccionFactura.numero_factura || 'Corrección en curso');
  }, [correccionFactura, miProveedor]);

  const serviceItemsCalculated = useMemo(
    () => serviceItems.map(item => calculateServiceItem(item)),
    [serviceItems],
  );

  const invoiceTotals = useMemo(() => serviceItemsCalculated.reduce(
    (acc, item) => ({
      subtotal: Number((acc.subtotal + item.subtotal).toFixed(2)),
      iva: Number((acc.iva + item.valorIva).toFixed(2)),
      total: Number((acc.total + item.total).toFixed(2)),
    }),
    { subtotal: 0, iva: 0, total: 0 },
  ), [serviceItemsCalculated]);

  const generatedDescription = useMemo(
    () => buildInvoiceDescription(serviceItemsCalculated),
    [serviceItemsCalculated],
  );

  useEffect(() => {
    setForm(prev => {
      if (
        prev.descripcion === generatedDescription &&
        prev.valorSubtotal === invoiceTotals.subtotal &&
        prev.valorIva === invoiceTotals.iva &&
        prev.valorTotal === invoiceTotals.total
      ) {
        return prev;
      }

      return {
        ...prev,
        descripcion: generatedDescription,
        valorSubtotal: invoiceTotals.subtotal,
        valorIva: invoiceTotals.iva,
        valorTotal: invoiceTotals.total,
      };
    });
  }, [generatedDescription, invoiceTotals]);

  const documentTypes = useMemo(() => {
    const existingTypes = docs.map((doc) => doc.type).filter(Boolean);
    return Array.from(new Set([...DOC_TYPES, ...existingTypes]));
  }, [docs]);

  const fetchCatalog = useMemo(() => async <T,>(endpoint: string): Promise<T[]> => {
    const payload = await apiClient.get<T[] | ApiListResponse<T>>(endpoint, { requiresAuth: false });
    return extractResults<T>(payload);
  }, []);

  useEffect(() => {
    const loadCatalogos = async () => {
      setCatalogLoading(true);
      try {
        const [deptsResult, bancosResult, tiposResult] = await Promise.allSettled([
          departamentosService.getAreasSolicitantes(),
          fetchCatalog<BancoOption>(`${API_BASE}/bancos/?limit=500`),
          fetchCatalog<TipoCuentaOption>(`${API_BASE}/tipos-cuenta/?limit=500`),
        ]);

        if (deptsResult.status === 'fulfilled') {
          setDepartamentos(Array.isArray(deptsResult.value) ? deptsResult.value : []);
        } else {
          console.error('[EnviarFactura] Error cargando areas solicitantes', deptsResult.reason);
        }

        if (bancosResult.status === 'fulfilled') {
          setBancos(bancosResult.value);
        } else {
          console.error('[EnviarFactura] Error cargando bancos', bancosResult.reason);
        }

        if (tiposResult.status === 'fulfilled') {
          setTiposCuenta(tiposResult.value);
        } else {
          console.error('[EnviarFactura] Error cargando tipos de cuenta', tiposResult.reason);
        }
      } catch (err) {
        console.error('[EnviarFactura] Error inesperado cargando catalogos financieros', err);
      } finally {
        setCatalogLoading(false);
      }
    };
    void loadCatalogos();
  }, [fetchCatalog]);

  useEffect(() => {
    if (isCorreccion) return;
    const loadNumeroSugerido = async () => {
      try {
        const numero = await facturasService.getNumeroSugerido();
        setNumeroFacturaSugerido(numero || 'Se asignará al guardar');
      } catch {
        setNumeroFacturaSugerido('Se asignará al guardar');
      }
    };
    void loadNumeroSugerido();
  }, [isCorreccion]);

  useEffect(() => {
    if (!departamentos.length || !proveedorSeleccionado || form.departamentoId > 0) return;
    const deptoPreferido =
      departamentos.find(d => d.codigo === 'ADM') ||
      departamentos.find(d => d.nombre.toLowerCase().includes('administr')) ||
      departamentos[0];

    if (deptoPreferido) {
      setForm(prev => ({ ...prev, departamentoId: deptoPreferido.id }));
    }
  }, [departamentos, proveedorSeleccionado, form.departamentoId]);

  useEffect(() => {
    if (!proveedorSeleccionado) return;
    setForm(prev => {
      const shouldUpdateBanco = !prev.banco && !!proveedorSeleccionado.banco;
      const shouldUpdateTipo = !prev.tipoCuenta && !!proveedorSeleccionado.tipo_cuenta;
      const shouldUpdateNumero = !prev.numeroCuenta && !!proveedorSeleccionado.numero_cuenta;
      const shouldUpdateCuenta = !prev.cuentaBancaria && !!proveedorSeleccionado.cuenta_bancaria_completa;
      if (!shouldUpdateBanco && !shouldUpdateTipo && !shouldUpdateNumero && !shouldUpdateCuenta) {
        return prev;
      }
      const nextBancoNombre = shouldUpdateBanco ? (proveedorSeleccionado.banco || '') : prev.banco;
      const matchedBanco = bancos.find(b => b.nombre.toLowerCase() === nextBancoNombre.toLowerCase());
      const nextTipo = shouldUpdateTipo ? (proveedorSeleccionado.tipo_cuenta || '') : prev.tipoCuenta;
      const nextNumero = shouldUpdateNumero ? (proveedorSeleccionado.numero_cuenta || '') : prev.numeroCuenta;
      const cuentaTexto =
        (shouldUpdateCuenta ? proveedorSeleccionado.cuenta_bancaria_completa : prev.cuentaBancaria)
        || [nextBancoNombre, nextTipo, nextNumero].filter(Boolean).join(' - ');
      return {
        ...prev,
        banco: nextBancoNombre,
        bancoId: matchedBanco?.id ?? prev.bancoId,
        tipoCuenta: nextTipo,
        numeroCuenta: nextNumero,
        cuentaBancaria: cuentaTexto,
      };
    });
  }, [proveedorSeleccionado, bancos]);

  const handleBuscarProveedor = async () => {
    if (!nitBusqueda.trim()) return;
    setBuscandoProveedor(true);
    setErrBusqueda(null);
    try {
      const prov = await proveedoresService.getMiPerfil(nitBusqueda.trim());
      setProveedorSeleccionado(prov);
    } catch {
      setErrBusqueda('No se encontró un proveedor con ese NIT. Verifica e intenta nuevamente.');
      setProveedorSeleccionado(null);
    } finally {
      setBuscandoProveedor(false);
    }
  };

  const handleFieldChange = <K extends keyof FormState>(
    field: K,
    value: FormState[K],
    transform?: (draft: FormState) => FormState,
  ) => {
    setForm(prev => {
      let updated: FormState = { ...prev, [field]: value };
      if (transform) {
        updated = transform(updated);
      }

      updated.cuentaBancaria = [updated.banco, updated.tipoCuenta, updated.numeroCuenta]
        .filter(Boolean)
        .join(' - ');

      return updated;
    });
  };

  const handleServiceItemChange = (
    id: string,
    field: keyof Omit<ServiceItem, 'id'>,
    value: string | number,
  ) => {
    setServiceItems(prev => prev.map(item => {
      if (item.id !== id) return item;

      if (field === 'servicio') {
        return { ...item, servicio: String(value) };
      }

      if (field === 'ivaPorcentaje') {
        return { ...item, ivaPorcentaje: Math.max(0, Number(value) || 0) };
      }

      if (field === 'cantidad') {
        return { ...item, cantidad: Math.max(1, Number(value) || 1) };
      }

      return { ...item, valorUnitario: Math.max(0, Number(value) || 0) };
    }));
  };

  const handleAddServiceItem = () => {
    setServiceItems(prev => [...prev, createEmptyServiceItem()]);
  };

  const handleRemoveServiceItem = (id: string) => {
    setServiceItems(prev => {
      if (prev.length === 1) {
        return [{ ...prev[0], servicio: '', cantidad: 1, valorUnitario: 0, ivaPorcentaje: prev[0].ivaPorcentaje || 19 }];
      }
      return prev.filter(item => item.id !== id);
    });
  };

  const handleBancoChange = (nombre: string) => {
    const match = bancos.find((b) => b.nombre === nombre) || null;
    handleFieldChange('banco', nombre, (draft) => ({
      ...draft,
      bancoId: match?.id ?? null,
      tipoCuenta: '',
    }));
  };

  const handleAddDoc = async (e: React.ChangeEvent<HTMLInputElement>, type: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = await validateDocFile(file);
    if (validationError) {
      setError(`${type}: ${validationError}`);
      e.target.value = '';
      return;
    }
    setError(null);
    setDocs(prev => [...prev.filter(d => d.type !== type), { id: Date.now().toString(), type, file }]);
    e.target.value = '';
  };

  const handleRemoveDoc = async (doc: UploadedDoc) => {
    if (doc.isExisting) {
      const docId = Number(doc.id);
      if (!Number.isNaN(docId)) {
        try {
          await documentosService.delete(docId);
        } catch {
          setError('No se pudo eliminar el documento. Intenta nuevamente.');
          return;
        }
      }
    }

    setDocs(prev => prev.filter(d => d.id !== doc.id));
  };

  const requestRemoveDoc = (doc: UploadedDoc) => {
    setDocToDelete(doc);
    setDeleteDialogOpen(true);
  };

  const confirmRemoveDoc = async () => {
    if (!docToDelete) return;
    setDeletingDoc(true);
    setError(null);
    try {
      await handleRemoveDoc(docToDelete);
      setDeleteDialogOpen(false);
      setDocToDelete(null);
    } finally {
      setDeletingDoc(false);
    }
  };

  const bancosOptions = useMemo(() => (bancos.length
    ? bancos
    : BANCOS_COLOMBIA.map((nombre, idx) => ({ id: 1000 + idx, nombre }))), [bancos]);

  const tiposCuentaOptions = useMemo(() => (tiposCuenta.length
    ? Array.from(new Map(tiposCuenta.map(tipo => [tipo.nombre, tipo])).values())
    : TIPO_CUENTA_OPTS.map((nombre, idx) => ({ id: 1000 + idx, nombre }))), [tiposCuenta]);

  const missingDocTypes = useMemo(
    () => documentTypes.filter(type => !docs.some(doc => doc.type === type)),
    [documentTypes, docs],
  );

  const documentosPendientes = useMemo(
    () => missingDocTypes.map(type => DOC_TYPE_DETAILS[type]?.label ?? type),
    [missingDocTypes],
  );

  const allDocumentsUploaded = missingDocTypes.length === 0;
  const hasInvalidServiceItems = serviceItemsCalculated.some(
    item => !item.servicio.trim() || item.cantidad <= 0 || item.valorUnitario <= 0,
  );
  const hasValidServiceItems = serviceItemsCalculated.some(
    item => item.servicio.trim() && item.cantidad > 0 && item.valorUnitario > 0,
  );

  const canGoNext = () => {
    if (step === 1) return !!proveedorSeleccionado;
    if (step === 2) {
      return (
        form.tipoDocumento &&
        form.departamentoId > 0 &&
        form.fechaFactura &&
        form.observaciones.trim().length > 2 &&
        hasValidServiceItems &&
        !hasInvalidServiceItems &&
        invoiceTotals.subtotal > 0
      );
    }
    if (step === 3) {
      return allDocumentsUploaded;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!proveedorSeleccionado) return;
    setLoading(true);
    setError(null);
    try {
      const subtotal = invoiceTotals.subtotal;
      const iva = invoiceTotals.iva;
      const total = invoiceTotals.total;
      const descripcion = buildInvoiceDescription(serviceItemsCalculated);
      const cuentaBancariaCompleta = [form.banco, form.tipoCuenta, form.numeroCuenta].filter(Boolean).join(' - ') || form.cuentaBancaria;

      const proveedorUpdates: Partial<Proveedor> = {};
      if (form.banco && form.banco !== proveedorSeleccionado.banco) proveedorUpdates.banco = form.banco;
      if (form.tipoCuenta && form.tipoCuenta !== proveedorSeleccionado.tipo_cuenta) proveedorUpdates.tipo_cuenta = form.tipoCuenta;
      if (form.numeroCuenta && form.numeroCuenta !== proveedorSeleccionado.numero_cuenta) {
        proveedorUpdates.numero_cuenta = form.numeroCuenta;
      }
      if (cuentaBancariaCompleta && cuentaBancariaCompleta !== proveedorSeleccionado.cuenta_bancaria_completa) {
        proveedorUpdates.cuenta_bancaria_completa = cuentaBancariaCompleta;
      }

      if (Object.keys(proveedorUpdates).length > 0) {
        await proveedoresService.update(proveedorSeleccionado.id, proveedorUpdates);
      }

      const payload = {
        proveedor_id: proveedorSeleccionado.id,
        departamento_id: form.departamentoId,
        tipo_documento: form.tipoDocumento as 'Factura' | 'Factura Electrónica' | 'Cuenta de Cobro' | 'Nota Débito' | 'Otro',
        descripcion,
        observaciones: form.observaciones || undefined,
        valor_subtotal: subtotal,
        valor_iva: iva,
        valor_total: total,
        fecha_factura: form.fechaFactura,
        fecha_recepcion: form.fechaRecepcion,
        cuenta_bancaria_proveedor: cuentaBancariaCompleta || undefined,
      };

      const factura = correccionFactura
        ? await facturasService.corregir(correccionFactura.id, {
          ...payload,
          observaciones_correccion: form.observaciones || undefined,
        })
        : await facturasService.create(payload);

      // Upload documents
      const failedDocTypes: string[] = [];
      for (const doc of docs.filter((item) => item.file)) {
        try {
          await documentosService.upload(factura.id, doc.file as File, doc.type);
        } catch (uploadErr: unknown) {
          const errMsg = (uploadErr as { message?: string })?.message || String(uploadErr);
          console.error(`[EnviarFactura] Falló subida de documento "${doc.type}" para factura ${factura.id}:`, errMsg, uploadErr);
          failedDocTypes.push(doc.type);
        }
      }

      if (failedDocTypes.length > 0) {
        setError(
          `La factura fue enviada (#${factura.id}), pero fallaron los soportes: ${failedDocTypes.join(', ')}. ` +
          'Revisa la consola del navegador para ver el detalle del error y vuelve a intentarlo.'
        );
        // No mostrar pantalla de éxito: el usuario debe ver el error y reintentar
        return;
      }

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setStep(1);
        setForm({
          tipoDocumento: 'Factura',
          descripcion: '',
          observaciones: '',
          departamentoId: 0,
          valorSubtotal: 0,
          ivaPorcentaje: 19,
          valorIva: 0,
          valorTotal: 0,
          fechaFactura: getToday(),
          fechaRecepcion: getToday(),
          banco: '',
          bancoId: null,
          tipoCuenta: '',
          numeroCuenta: '',
          cuentaBancaria: '',
        });
        setServiceItems([createEmptyServiceItem()]);
        setDocs([]);
        onSuccess?.();
        if (isCorreccion) {
          navigate('/financiero/proveedor/mis-facturas');
        }
      }, 3000);
    } catch (err: unknown) {
      const msg = (err as { message?: string; detail?: string })?.message
        || (err as { message?: string; detail?: string })?.detail
        || 'Error al enviar la factura. Verifica los datos.';
      setError(String(msg));
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 space-y-4"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="text-green-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isCorreccion ? '¡Corrección enviada!' : '¡Factura enviada!'}
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-center max-w-md">
          {isCorreccion
            ? 'La corrección fue enviada y tu factura vuelve al flujo normal. Puedes consultar su estado en '
            : 'Tu factura fue recibida exitosamente. Puedes consultar su estado en '}
          <strong>Mis Facturas</strong>.
        </p>
      </motion.div>
    );
  }

  const steps = [
    { num: 1, label: 'Identificación' },
    { num: 2, label: 'Datos Factura' },
    { num: 3, label: 'Documentos' },
    { num: 4, label: isCorreccion ? 'Confirmar Corrección' : 'Confirmar' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-800 to-red-900 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <Send size={24} className="flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-1">{isCorreccion ? 'Corregir Factura' : 'Enviar Factura'}</h3>
            <p className="text-red-100 text-sm">
              {isCorreccion
                ? 'Actualiza los campos solicitados y reenvía la factura al proceso.'
                : 'Completa los pasos para enviar tu factura al área financiera'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${i < steps.length - 1 ? '' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${step > s.num ? 'bg-red-700 text-white shadow-md' : step === s.num ? 'bg-red-900 text-white shadow-lg scale-110' : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                {step > s.num ? <CheckCircle2 size={18} /> : s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:block transition-all ${step === s.num ? 'text-red-900 dark:text-red-600' : step > s.num ? 'text-red-700 dark:text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-1 mx-2 rounded-full transition-all ${step > s.num ? 'bg-red-700' : step >= s.num + 1 ? 'bg-red-700' : 'bg-slate-300 dark:bg-slate-600'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
        >
          {/* STEP 1: Identificación */}
          {step === 1 && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Building2 size={20} className="text-orange-600" />
                Identificación del Proveedor
              </h4>

              {proveedorSeleccionado ? (
                <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-green-600" />
                    <span className="font-semibold text-green-800 dark:text-green-300">Proveedor identificado</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">Razón Social</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{proveedorSeleccionado.razon_social}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">NIT</p>
                      <p className="font-semibold text-slate-900 dark:text-white">{proveedorSeleccionado.nit}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">Tipo</p>
                      <p className="font-medium text-slate-700 dark:text-slate-300">{proveedorSeleccionado.tipo_proveedor}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400 text-xs">Estado</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${proveedorSeleccionado.estado === 'Activo' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {proveedorSeleccionado.estado}
                      </span>
                    </div>
                  </div>
                  {!miProveedor && (
                    <button onClick={() => setProveedorSeleccionado(null)} className="text-xs text-red-600 hover:underline">
                      Cambiar proveedor
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <p className="text-slate-600 dark:text-slate-300 text-sm">
                    No se encontró un proveedor vinculado automáticamente a tu cuenta. Ingresa tu NIT para buscarte en el sistema.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Ingresa tu NIT (ej: 900123456-1)"
                      value={nitBusqueda}
                      onChange={e => setNitBusqueda(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleBuscarProveedor()}
                      className="flex-1 px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none font-medium"
                    />
                    <button
                      onClick={handleBuscarProveedor}
                      disabled={buscandoProveedor || !nitBusqueda.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-orange-600 to-red-700 hover:from-orange-700 hover:to-red-800 disabled:opacity-50 text-white rounded-lg text-sm font-semibold flex items-center gap-2 transition-all shadow-md hover:shadow-lg disabled:shadow-none"
                    >
                      <Search size={16} />
                      {buscandoProveedor ? 'Buscando...' : 'Buscar'}
                    </button>
                  </div>
                  {errBusqueda && (
                    <p className="text-red-600 text-sm flex items-center gap-1">
                      <AlertCircle size={14} /> {errBusqueda}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 2: Datos de la Factura */}
          {step === 2 && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <FileText size={20} className="text-orange-600" />
                Datos de la Factura
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Tipo de Documento <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.tipoDocumento}
                    onChange={e => handleFieldChange('tipoDocumento', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium cursor-pointer"
                  >
                    {TIPO_DOCUMENTO_OPTS.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    N° Factura{' '}
                    <span className="text-slate-400 text-xs">
                      {isCorreccion ? '(número original de la factura)' : '(generado automáticamente por el sistema)'}
                    </span>
                  </label>
                  <input
                    type="text"
                    value={numeroFacturaSugerido}
                    disabled
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 outline-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {isCorreccion
                      ? 'Este número se mantiene y solo actualizas la información requerida.'
                      : 'Evita errores de duplicidad: el consecutivo se asigna automáticamente.'}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de la Factura <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.fechaFactura}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => handleFieldChange('fechaFactura', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Se autocompleta con hoy. Cámbiala solo si la factura física tiene otra fecha.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Fecha de Recepción <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={form.fechaRecepcion}
                    max={new Date().toISOString().split('T')[0]}
                    disabled
                    className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 outline-none"
                  />
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Corresponde al día de envío en el portal.</p>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Área / Departamento Solicitante <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.departamentoId}
                    onChange={e => handleFieldChange('departamentoId', Number(e.target.value))}
                    disabled={catalogLoading || !!proveedorSeleccionado}
                    className={`w-full px-4 py-3 border-2 rounded-lg text-sm outline-none font-medium cursor-pointer ${proveedorSeleccionado
                      ? 'border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                      : 'border-slate-300 dark:border-slate-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600'
                      }`}
                  >
                    <option value={0}>-- Seleccionar área --</option>
                    {departamentos.map(d => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    {proveedorSeleccionado
                      ? 'El área se asigna automáticamente para reducir errores de radicación.'
                      : 'Selecciona el área interna a la que corresponde tu servicio o bien.'}
                  </p>
                </div>

              </div>

              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 p-4">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Identificacion Factura <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ejemplo: Computadores y Envio"
                  value={form.observaciones}
                  onChange={e => handleFieldChange('observaciones', e.target.value)}
                  className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium"
                />
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Usa este campo para identificar rapidamente la factura, por ejemplo: Computadores y Envio.
                </p>
              </div>

              {/* Valores */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h5 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-orange-600" />
                  Servicios Facturados
                </h5>
                <div className="space-y-4">
                  <div className="hidden xl:grid xl:grid-cols-[96px_minmax(220px,1.6fr)_minmax(150px,1fr)_110px_minmax(150px,1fr)_minmax(150px,1fr)_48px] gap-3 px-3 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                    <span>Items</span>
                    <span>Servicio</span>
                    <span>Valor unitario</span>
                    <span>IVA / INC </span>
                    <span>Subtotal</span>
                    <span>Total</span>
                    <span />
                  </div>

                  {serviceItemsCalculated.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-900/30 p-4"
                    >
                      <div className="grid grid-cols-1 xl:grid-cols-[96px_minmax(220px,1.6fr)_minmax(150px,1fr)_110px_minmax(150px,1fr)_minmax(150px,1fr)_48px] gap-3 items-start">
                        <div>
                          <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Cantidad</label>
                          <input
                            type="number"
                            min={1}
                            step={1}
                            value={item.cantidad}
                            onChange={e => handleServiceItemChange(item.id, 'cantidad', e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Servicio</label>
                          <input
                            type="text"
                            placeholder="Nombre del servicio o bien"
                            value={item.servicio}
                            onChange={e => handleServiceItemChange(item.id, 'servicio', e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium"
                          />
                        </div>

                        <div>
                          <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Valor unitario</label>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={formatNumberInput(String(item.valorUnitario || ''))}
                            onChange={e => handleServiceItemChange(item.id, 'valorUnitario', e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-semibold"
                          />
                        </div>

                        <div>
                          <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">IVA %</label>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            placeholder="19"
                            value={item.ivaPorcentaje}
                            onChange={e => handleServiceItemChange(item.id, 'ivaPorcentaje', e.target.value)}
                            className="w-full px-3 py-2.5 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-semibold"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3 xl:block">
                          <div>
                            <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Subtotal</label>
                            <input
                              type="text"
                              readOnly
                              value={formatNumberInput(String(item.subtotal || ''))}
                              className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                            />
                          </div>
                          <div className="xl:hidden">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">IVA valor</label>
                            <input
                              type="text"
                              readOnly
                              value={formatNumberInput(String(item.valorIva || ''))}
                              className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-semibold"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block xl:hidden text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Total</label>
                          <input
                            type="text"
                            readOnly
                            value={formatNumberInput(String(item.total || ''))}
                            className="w-full px-3 py-2.5 border-2 border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white outline-none font-bold"
                          />
                          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            IVA / INC: {formatMoney(item.valorIva)}
                          </p>
                        </div>

                        <div className="flex xl:justify-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveServiceItem(item.id)}
                            className="h-11 w-11 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:border-red-300 hover:bg-red-100 transition-colors flex items-center justify-center"
                            title={serviceItemsCalculated.length === 1 ? 'Limpiar fila' : 'Eliminar fila'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddServiceItem}
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:border-red-300 hover:bg-red-100"
                    >
                      <Plus size={16} />
                      Agregar servicio
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Subtotal factura</p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatMoney(invoiceTotals.subtotal)}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">IVA / INC total</p>
                      <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{formatMoney(invoiceTotals.iva)}</p>
                    </div>
                    <div className="rounded-xl border border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-300">Total factura</p>
                      <p className="mt-1 text-xl font-bold text-orange-700 dark:text-orange-300">{formatMoney(invoiceTotals.total)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cuenta bancaria */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Cuenta Bancaria para Pago <span className="text-slate-400 text-xs">(opcional)</span>
                </label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <select
                    value={form.banco}
                    onChange={e => handleBancoChange(e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium cursor-pointer"
                  >
                    <option value="">Seleccionar banco</option>
                    {bancosOptions.map((banco) => (
                      <option key={banco.id} value={banco.nombre}>{banco.nombre}</option>
                    ))}
                  </select>

                  <select
                    value={form.tipoCuenta}
                    onChange={e => handleFieldChange('tipoCuenta', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium cursor-pointer"
                  >
                    <option value="">Tipo de cuenta</option>
                    {tiposCuentaOptions.map((tipo) => (
                      <option key={tipo.id} value={tipo.nombre}>{tipo.nombre}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Número de cuenta"
                    value={form.numeroCuenta}
                    onChange={e => handleFieldChange('numeroCuenta', e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-500 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-none font-medium"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completa estos datos para agilizar validación y pago en tesorería.</p>
              </div>

            </div>
          )}

          {/* STEP 3: Documentos */}
          {step === 3 && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Upload size={20} className="text-orange-600" />
                Adjuntar Documentos
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Adjunta todos los soportes requeridos para continuar con la confirmación.
              </p>
              {!allDocumentsUploaded && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 space-y-2">
                  <p className="font-semibold text-amber-900 dark:text-amber-200">
                    Faltan documentos por adjuntar:
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-amber-900/90 dark:text-amber-200">
                    {documentosPendientes.map((doc) => (
                      <li key={doc}>{doc}</li>
                    ))}
                  </ul>
                  <p className="text-xs text-amber-900/80 dark:text-amber-200/90">
                    Adjunta estos soportes para habilitar el envío final de tu factura.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {documentTypes.map(type => {
                  const uploaded = docs.find(d => d.type === type);
                  const docMeta = DOC_TYPE_DETAILS[type];
                  return (
                    <div key={type} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{docMeta?.label ?? type}</p>
                        {docMeta?.helper && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{docMeta.helper}</p>
                        )}
                        {uploaded && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs space-y-1">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <CheckCircle2 size={16} className="flex-shrink-0 text-green-600 dark:text-green-400" />
                              <p className="truncate">
                                {uploaded.file?.name || uploaded.existingName || 'Documento cargado'}
                              </p>
                            </div>
                            {uploaded.existingUrl && (
                              <a
                                href={uploaded.existingUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-orange-600 hover:text-orange-700 underline"
                              >
                                Ver documento actual
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {uploaded ? (
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => requestRemoveDoc(uploaded)}
                            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50"
                            title="Eliminar documento"
                            aria-label={`Eliminar ${type}`}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors">
                          <Upload size={12} className="inline mr-1" />
                          Adjuntar
                          <input type="file" className="hidden" accept=".pdf" onChange={e => { void handleAddDoc(e, type); }} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Confirmar */}
          {step === 4 && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <CheckCircle2 size={20} className="text-orange-600" />
                Confirmar y Enviar
              </h4>

              <div className="space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
                  <h5 className="font-semibold text-slate-800 dark:text-white text-sm">Proveedor</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500 dark:text-slate-400">Razón Social:</span> <span className="font-medium text-slate-800 dark:text-white">{proveedorSeleccionado?.razon_social}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">NIT:</span> <span className="font-medium text-slate-800 dark:text-white">{proveedorSeleccionado?.nit}</span></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
                  <h5 className="font-semibold text-slate-800 dark:text-white text-sm">Factura</h5>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="text-slate-500 dark:text-slate-400">Tipo:</span> <span className="font-medium text-slate-800 dark:text-white">{form.tipoDocumento}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Fecha:</span> <span className="font-medium text-slate-800 dark:text-white">{form.fechaFactura}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Área:</span> <span className="font-medium text-slate-800 dark:text-white">{departamentos.find(d => d.id === form.departamentoId)?.nombre || '-'}</span></div>
                    <div><span className="text-slate-500 dark:text-slate-400">Documentos:</span> <span className="font-medium text-slate-800 dark:text-white">{docs.length} adjuntos</span></div>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-2">
                  <h5 className="font-semibold text-slate-800 dark:text-white text-sm">Identificacion Factura</h5>
                  <p className="text-sm text-slate-700 dark:text-slate-200">{form.observaciones}</p>
                </div>

                <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl space-y-3">
                  <h5 className="font-semibold text-slate-800 dark:text-white text-sm">Detalle de servicios</h5>
                  <div className="space-y-2">
                    {serviceItemsCalculated.map((item, index) => (
                      <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm">
                        <div>
                          <p className="font-medium text-slate-800 dark:text-white">
                            {index + 1}. {item.servicio.trim() || 'Servicio sin nombre'}
                          </p>
                          <p className="text-slate-500 dark:text-slate-400">
                            {item.cantidad} x {formatMoney(item.valorUnitario)} | IVA {item.ivaPorcentaje}%
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-slate-800 dark:text-white">{formatMoney(item.total)}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Subtotal {formatMoney(item.subtotal)} | IVA {formatMoney(item.valorIva)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                  <h5 className="font-semibold text-orange-800 dark:text-orange-300 text-sm mb-2">Valores</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{formatMoney(invoiceTotals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">IVA:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{formatMoney(invoiceTotals.iva)}</span>
                    </div>
                    <div className="flex justify-between border-t border-orange-200 dark:border-orange-700 pt-1 mt-1">
                      <span className="font-bold text-slate-800 dark:text-white">Total:</span>
                      <span className="font-bold text-orange-700 dark:text-orange-400 text-lg">{formatMoney(invoiceTotals.total)}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-300">
                  <AlertCircle size={14} className="inline mr-1" />
                  {isCorreccion
                    ? 'Al enviar la corrección, la factura vuelve a estado Recibida y se reanuda el proceso.'
                    : 'Al enviar, tu factura quedará en estado Recibida y será procesada por el área de cuentas por pagar.'}
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className={step === 1 ? 'flex justify-end' : 'flex justify-between'}>
        {step > 1 && (
          <button
            onClick={() => {
              if (isCorreccion && step === 2) return;
              setStep(s => Math.max(1, s - 1));
            }}
            disabled={isCorreccion && step === 2}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <Send size={16} />
            {loading ? 'Enviando...' : isCorreccion ? 'Enviar corrección' : 'Enviar Factura'}
          </button>
        )}
      </div>

      <Dialog
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) setDocToDelete(null);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg">
              <X className="w-5 h-5 text-red-600" />
              Eliminar documento
            </DialogTitle>
            <DialogDescription>
              {docToDelete
                ? `¿Deseas eliminar el documento "${docToDelete.existingName || docToDelete.file?.name || docToDelete.type}"? Esta acción no se puede deshacer.`
                : '¿Deseas eliminar este documento? Esta acción no se puede deshacer.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deletingDoc}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => void confirmRemoveDoc()} disabled={deletingDoc}>
              {deletingDoc ? 'Eliminando...' : 'Eliminar documento'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
