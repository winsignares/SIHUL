import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Calendar, Check, CheckCircle2, Download, ExternalLink, FileText, Upload, X, XCircle } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatValidationErrors, type ApiError } from '../../../core/errorHandler';
import { departamentosService, documentosService, facturasService, parametrosSlaService, proveedoresService } from '../../../services/financiero';
import type {
  CreateFacturaDTO,
  Departamento,
  DocumentoAdjunto,
  Factura,
  Proveedor,
} from '../../../models/financiero/core.models';
import type { FuncionarioDocumentType, FuncionarioUploadedDoc, PrefillFromPendiente } from '../../../models/financiero/funcionario';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { parseFacturaDescripcion } from '../../../share/factura-description';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';

const DOCUMENT_TYPES: FuncionarioDocumentType[] = ['Factura', 'Orden de Compra', 'Certificación Bancaria', 'Acta de Entrega'];
const MAX_UPLOAD_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['pdf', 'xml', 'png', 'jpg', 'jpeg']);
const BLOCKED_EXTENSIONS = new Set(['exe', 'bat', 'cmd', 'ps1', 'js', 'vbs', 'scr', 'msi', 'com', 'jar', 'sh']);
const ALLOWED_MIME_TYPES = new Set(['application/pdf', 'application/xml', 'text/xml', 'image/png', 'image/jpeg']);

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (typeof data === 'object' && data !== null && 'results' in data) {
    const results = (data as { results?: unknown }).results;
    if (Array.isArray(results)) return results as T[];
  }
  return [];
};

const buildApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError | undefined;
  const detailed = formatValidationErrors(apiError?.errors);
  if (apiError?.message && detailed) {
    return `${apiError.message}. ${detailed}`;
  }
  if (apiError?.message) {
    return apiError.message;
  }
  return fallback;
};

// Funciones de seguridad para valores potencialmente undefined
const safeString = (val: unknown, fallback = 'Sin datos'): string => {
  if (val === null || val === undefined) return fallback;
  return String(val).trim() || fallback;
};

const safeNumber = (val: unknown, fallback = 0): number => {
  const num = Number(val);
  return isNaN(num) ? fallback : num;
};

const formatMoney = (val: unknown): string => {
  const num = safeNumber(val, 0);
  return `$${num.toLocaleString('es-CO', { maximumFractionDigits: 2 })}`;
};

function ReadonlyServiciosFactura({ descripcion }: { descripcion: string }) {
  const parsed = parseFacturaDescripcion(descripcion);
  const hasItems = parsed.items.length > 0;
  const hasText = Boolean(parsed.remainingText);

  if (!hasItems && !hasText) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
        Sin descripcion del servicio cargada por el proveedor.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {hasItems && (
        <div className="space-y-3">
          {parsed.items.map((item, index) => (
            <div
              key={`${item.rawLine}-${index}`}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
            >
              <div className="flex flex-wrap items-start gap-3 lg:flex-nowrap">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-sm font-semibold text-white">
                  {item.index ?? index + 1}
                </div>
                <div className="min-w-[220px] flex-1 lg:max-w-[38%]">
                  <p className="font-semibold text-slate-900">{item.servicio || 'Servicio sin nombre'}</p>
                  {(item.cantidad || item.unitario) && (
                    <p className="text-sm text-slate-500">
                      {item.cantidad ? `${item.cantidad} x ` : ''}
                      {item.unitario || 'Valor no especificado'}
                    </p>
                  )}
                </div>
                <div className="grid w-full gap-2 sm:grid-cols-3 lg:ml-auto lg:w-[430px] lg:flex-none">
                  {item.subtotal && (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">Subtotal</p>
                      <p className="font-semibold text-slate-800">{item.subtotal}</p>
                    </div>
                  )}
                  {item.ivaValor && (
                    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-right">
                      <p className="text-[11px] uppercase tracking-wide text-slate-500">
                        Tasa {item.ivaPorcentaje ? `${item.ivaPorcentaje}%` : ''}
                      </p>
                      <p className="font-semibold text-slate-800">{item.ivaValor}</p>
                    </div>
                  )}
                  {item.total && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-right">
                      <p className="text-[11px] uppercase tracking-wide text-red-600">Total</p>
                      <p className="font-semibold text-red-700">{item.total}</p>
                    </div>
                  )}
                </div>
              </div>
              {item.extraInfo && item.extraInfo.length > 0 && (
                <p className="mt-2 whitespace-pre-line text-sm text-slate-500">{item.extraInfo.join('\n')}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {hasText && (
        <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Descripcion adicional</p>
          <p className="whitespace-pre-line text-sm text-slate-700">{parsed.remainingText}</p>
        </div>
      )}
    </div>
  );
}

const getFileExtension = (filename: string): string => {
  const parts = filename.split('.');
  if (parts.length < 2) return '';
  return parts[parts.length - 1].toLowerCase();
};

const resolveDocumentUrl = (urlStorage?: string): string | null => {
  if (!urlStorage) return null;
  const cleaned = urlStorage.trim();
  if (!cleaned) return null;
  if (/^https?:\/\//i.test(cleaned)) return cleaned;
  if (cleaned.startsWith('/')) return cleaned;
  if (cleaned.startsWith('media/') || cleaned.startsWith('uploads/')) return `/${cleaned}`;
  return null;
};

const validateUploadFile = (file: File): string | null => {
  const extension = getFileExtension(file.name);

  if (!extension) {
    return 'El archivo debe tener extensión válida (PDF, XML, PNG o JPG).';
  }

  if (BLOCKED_EXTENSIONS.has(extension)) {
    return `Tipo de archivo bloqueado por seguridad (.${extension}).`;
  }

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return `Tipo de archivo no permitido (.${extension}). Use PDF, XML, PNG o JPG.`;
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return 'El archivo supera el tamaño máximo permitido (10 MB).';
  }

  if (file.type && !ALLOWED_MIME_TYPES.has(file.type)) {
    return 'El tipo MIME del archivo no es válido para documentos financieros.';
  }

  return null;
};

export default function RegistrarFactura() {
  const location = useLocation();
  const navigate = useNavigate();
  const prefillFromPendiente = (location.state as { prefillFromPendiente?: PrefillFromPendiente } | null)?.prefillFromPendiente;
  const showLegacyBlocks = Boolean((location.state as { showLegacyBlocks?: boolean } | null)?.showLegacyBlocks);
  const isReviewMode = Boolean(prefillFromPendiente);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillApplied, setPrefillApplied] = useState(false);
  const [prefillWarning, setPrefillWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [numeroFacturaSugerido, setNumeroFacturaSugerido] = useState('');
  const [slaTotalDias, setSlaTotalDias] = useState(0);
  const [slaTodosHabiles, setSlaTodosHabiles] = useState(true);
  const [slaEtapas, setSlaEtapas] = useState(0);

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [docs, setDocs] = useState<FuncionarioUploadedDoc[]>([]);
  const [existingDocs, setExistingDocs] = useState<DocumentoAdjunto[]>([]);
  const [diagInfo, setDiagInfo] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; count: number; source: string; rawError: string | null }>({ status: 'idle', count: 0, source: '', rawError: null });
  const [selectedExistingDocIds, setSelectedExistingDocIds] = useState<Set<string>>(new Set());
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [rechazarMotivo, setRechazarMotivo] = useState('');
  const [rechazarError, setRechazarError] = useState<string | null>(null);
  const [rechazarLoading, setRechazarLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; name: string } | null>(null);

  const [form, setForm] = useState({
    proveedorId: 0,
    proveedorNombre: '',
    nit: '',
    tipoDocumento: 'Factura',
    valorSubtotal: 0,
    valorIva: 0,
    valorTotal: 0,
    fechaFactura: '',
    fechaRecepcion: new Date().toISOString().split('T')[0],
    departamentoId: 0,
    descripcion: '',
    observaciones: '',
  });

  useEffect(() => {
    const load = async () => {
      setCatalogLoading(true);
      setError(null);
      try {
        const [prov, dept, resumenSla, numeroSugerido] = await Promise.all([
          proveedoresService.getAll({ limit: 100 }),
          departamentosService.getAreasSolicitantes(),
          parametrosSlaService.getResumenProceso(),
          facturasService.getNumeroSugerido(),
        ]);

        const provList = toList<Proveedor>(prov);
        const depList = toList<Departamento>(dept);

        setProveedores(provList);
        setDepartamentos(depList);
        setSlaTotalDias(Number(resumenSla.totalDias) || 0);
        setSlaTodosHabiles(Boolean(resumenSla.todosHabiles));
        setSlaEtapas(Number(resumenSla.etapas) || 0);
        setNumeroFacturaSugerido(numeroSugerido || '');
      } catch {
        setProveedores([]);
        setDepartamentos([]);
        setNumeroFacturaSugerido('');
        setError('No fue posible cargar proveedores y departamentos. Verifique la conexion con el backend.');
      } finally {
        setCatalogLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    setPrefillApplied(false);
    setPrefillWarning(null);
    setExistingDocs([]);
    setSelectedExistingDocIds(new Set());
    setDiagInfo({ status: 'idle', count: 0, source: '', rawError: null });
  }, [prefillFromPendiente?.facturaId]);

  useEffect(() => {
    if (!prefillFromPendiente?.snapshot) return;

    const snap = prefillFromPendiente.snapshot;
    const snapTotal = Number(snap.valorTotal || 0);
    const snapSubtotal = Number(snap.valorSubtotal ?? (snapTotal > 0 ? Number((snapTotal / 1.19).toFixed(2)) : 0));
    const snapIva = Number(snap.valorIva ?? (snapTotal > 0 ? Number((snapTotal - snapSubtotal).toFixed(2)) : 0));

    setForm((prev) => ({
      ...prev,
      proveedorId: Number(snap.proveedorId || prev.proveedorId || 0),
      proveedorNombre: snap.proveedorNombre || prev.proveedorNombre,
      nit: snap.nit || prev.nit,
      tipoDocumento: snap.tipoDocumento || prev.tipoDocumento,
      valorSubtotal: snapSubtotal || prev.valorSubtotal,
      valorIva: snapIva || prev.valorIva,
      valorTotal: snapTotal || prev.valorTotal,
      fechaFactura: snap.fechaFactura || prev.fechaFactura,
      fechaRecepcion: snap.fechaRecepcion || prev.fechaRecepcion,
      departamentoId: Number(snap.departamentoId || prev.departamentoId || 0),
      descripcion: snap.descripcion || prev.descripcion,
      observaciones: snap.observaciones || prev.observaciones,
    }));

    if (snap.numeroFactura) {
      setNumeroFacturaSugerido(snap.numeroFactura);
    }
  }, [prefillFromPendiente?.snapshot]);

  useEffect(() => {
    if (!prefillFromPendiente) return;

    if (catalogLoading || prefillApplied) return;

    const loadPrefillDetalle = async () => {
      setPrefillLoading(true);
      setPrefillWarning(null);
      try {
        let factura: Factura | null = null;

        try {
          const seguimiento = await facturasService.getSeguimiento(prefillFromPendiente.facturaId);
          factura = (seguimiento?.factura || null) as Factura | null;
        } catch {
          factura = null;
        }

        if (!factura) {
          factura = await facturasService.getById(prefillFromPendiente.facturaId);
        }

        if (!factura) return;

        const facturaProveedorId = Number(factura.proveedor_id || factura.proveedor?.id || 0);
        const facturaDepartamentoId = Number(factura.departamento?.id || factura.departamento_id || 0);

        const proveedorExiste = proveedores.some((p) => p.id === facturaProveedorId);
        const departamentoExiste = departamentos.some((d) => d.id === facturaDepartamentoId);

        setForm((prev) => ({
          ...prev,
          proveedorId: proveedorExiste ? facturaProveedorId : prev.proveedorId,
          proveedorNombre: factura.proveedor?.razon_social || prev.proveedorNombre,
          nit: factura.proveedor?.nit || prev.nit,
          tipoDocumento: factura.tipo_documento || prev.tipoDocumento,
          valorSubtotal: Number(factura.valor_subtotal || prev.valorSubtotal || 0),
          valorIva: Number(factura.valor_iva || prev.valorIva || 0),
          valorTotal: Number(factura.valor_total || prev.valorTotal || 0),
          fechaFactura: factura.fecha_factura || prev.fechaFactura,
          fechaRecepcion: factura.fecha_recepcion || prev.fechaRecepcion,
          departamentoId: departamentoExiste ? facturaDepartamentoId : prev.departamentoId,
          descripcion: factura.descripcion || prev.descripcion,
          observaciones: factura.observaciones || prev.observaciones,
        }));

        if (factura.numero_factura) {
          setNumeroFacturaSugerido(factura.numero_factura);
        }

        const docsFromFactura = Array.isArray(factura.documentos) ? factura.documentos : [];

        if (docsFromFactura.length > 0) {
          setExistingDocs(docsFromFactura);
          setDiagInfo({ status: 'done', count: docsFromFactura.length, source: 'seguimiento/detail (nested)', rawError: null });
        } else {
          setDiagInfo((prev) => ({ ...prev, status: 'loading', source: 'documentos endpoint' }));
          try {
            const docsFromEndpoint = await documentosService.getByFactura(prefillFromPendiente.facturaId);
            const list = Array.isArray(docsFromEndpoint) ? docsFromEndpoint : [];
            setExistingDocs(list);
            setDiagInfo({ status: 'done', count: list.length, source: `GET /financiero/documentos/?factura_id=${prefillFromPendiente.facturaId}`, rawError: null });
          } catch (e: unknown) {
            const msg = (e as { message?: string })?.message || String(e);
            setExistingDocs([]);
            setDiagInfo({ status: 'error', count: 0, source: `GET /financiero/documentos/?factura_id=${prefillFromPendiente.facturaId}`, rawError: msg });
            setPrefillWarning('Se cargaron datos básicos, pero no fue posible consultar soportes adjuntos del proveedor.');
          }
        }
      } catch (outerErr: unknown) {
        const outerMsg = (outerErr as { message?: string })?.message || String(outerErr);
        setDiagInfo((prev) => ({ ...prev, status: 'loading', source: 'documentos endpoint (fallback)', rawError: outerMsg }));
        try {
          const docsFromEndpoint = await documentosService.getByFactura(prefillFromPendiente.facturaId);
          const list = Array.isArray(docsFromEndpoint) ? docsFromEndpoint : [];
          setExistingDocs(list);
          setDiagInfo({ status: 'done', count: list.length, source: `GET /financiero/documentos/?factura_id=${prefillFromPendiente.facturaId} (fallback)`, rawError: outerMsg });
          setPrefillWarning('No se pudo cargar el detalle completo de la factura, pero sí se recuperaron los soportes del proveedor.');
        } catch (e2: unknown) {
          const msg2 = (e2 as { message?: string })?.message || String(e2);
          setExistingDocs([]);
          setDiagInfo({ status: 'error', count: 0, source: `GET /financiero/documentos/?factura_id=${prefillFromPendiente.facturaId} (fallback)`, rawError: `Detalle: ${outerMsg} | Docs: ${msg2}` });
          setPrefillWarning('No se pudo cargar el detalle completo ni los soportes del proveedor para esta factura.');
        }
      } finally {
        setPrefillApplied(true);
        setPrefillLoading(false);
      }
    };

    void loadPrefillDetalle();
  }, [prefillFromPendiente, catalogLoading, proveedores, departamentos, prefillApplied]);

  const selectedProveedor = useMemo(
    () => proveedores.find((p) => p.id === Number(form.proveedorId)),
    [proveedores, form.proveedorId]
  );

  useEffect(() => {
    if (selectedProveedor) {
      setForm((prev) => ({
        ...prev,
        proveedorNombre: selectedProveedor.razon_social,
        nit: selectedProveedor.nit,
      }));
    }
  }, [selectedProveedor]);

  const setField = (key: keyof typeof form, value: string | number) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'valorSubtotal' || key === 'valorIva') {
        updated.valorTotal = Number(updated.valorSubtotal || 0) + Number(updated.valorIva || 0);
      }
      if (key === 'valorTotal') {
        const total = Number(updated.valorTotal || 0);
        if (total >= 0) {
          updated.valorSubtotal = Number((total / 1.19).toFixed(2));
          updated.valorIva = Number((total - updated.valorSubtotal).toFixed(2));
        }
      }
      return updated;
    });
  };

  const addDoc = (type: FuncionarioDocumentType, file?: File) => {
    if (isReviewMode) return;
    if (!file) return;
    const validationError = validateUploadFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setDocs((prev) => [
      ...prev.filter((doc) => doc.type !== type),
      {
        id,
        type,
        file,
      },
    ]);

  };

  const openExistingDocument = (doc: DocumentoAdjunto) => {
    const url = resolveDocumentUrl(doc.archivo_url ?? doc.url_storage);
    if (!url) {
      setError('Este documento no tiene una URL válida para vista previa en el navegador.');
      return;
    }
    setPreviewDocument({ url, name: doc.nombre_archivo || doc.tipo_documento || 'Documento' });
  };

  const downloadExistingDocument = async (doc: DocumentoAdjunto) => {
    const url = resolveDocumentUrl(doc.archivo_url ?? doc.url_storage);
    if (!url) {
      setError('Este documento no tiene una URL válida para descarga directa.');
      return;
    }

    const fileName = doc.nombre_archivo || 'documento';
    try {
      const response = await fetch(url, { credentials: 'include' });
      if (!response.ok) throw new Error('download_failed');
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
      return;
    } catch {
      // Fallback para archivos servidos directamente por el backend.
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const openLocalDocument = (doc: FuncionarioUploadedDoc) => {
    const objectUrl = URL.createObjectURL(doc.file);
    setPreviewDocument({ url: objectUrl, name: doc.file.name });
  };

  const downloadLocalDocument = (doc: FuncionarioUploadedDoc) => {
    const objectUrl = URL.createObjectURL(doc.file);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = doc.file.name;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 10_000);
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const getExistingDocKey = (doc: DocumentoAdjunto) => String(doc.id ?? `${doc.tipo_documento}-${doc.nombre_archivo}`);

  const toggleExistingDocSelection = (doc: DocumentoAdjunto) => {
    const key = getExistingDocKey(doc);
    setSelectedExistingDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedExistingDocs = useMemo(
    () => existingDocs.filter((doc) => selectedExistingDocIds.has(getExistingDocKey(doc))),
    [existingDocs, selectedExistingDocIds]
  );
  const hasSelectedDocsForReject = selectedExistingDocIds.size > 0;

  const openRejectDialog = () => {
    if (!prefillFromPendiente?.facturaId) {
      setError('Solo se puede rechazar una factura que viene desde Mis Pendientes.');
      return;
    }
    setRechazarMotivo('');
    setRechazarError(null);
    setRechazarOpen(true);
  };

  const confirmReject = async () => {
    if (!prefillFromPendiente?.facturaId) return;

    const motivo = rechazarMotivo.trim();
    if (motivo.length < 10) {
      setRechazarError('Describe el motivo del rechazo (mÃ­nimo 10 caracteres).');
      return;
    }

    const docsPart = selectedExistingDocs.length
      ? `Documentos rechazados: ${selectedExistingDocs.map((doc) => `${doc.tipo_documento} - ${doc.nombre_archivo}`).join('; ')}. `
      : '';
    const finalMotivo = `${docsPart}Motivo: ${motivo}`;

    setRechazarLoading(true);
    try {
      await facturasService.rechazar(prefillFromPendiente.facturaId, finalMotivo);
      toast.success('Factura rechazada y enviada al proveedor para correcciÃ³n.');
      setRechazarOpen(false);
      navigate('/financiero/funcionario/pendientes');
    } catch {
      setRechazarError('No fue posible rechazar la factura. Intenta nuevamente.');
    } finally {
      setRechazarLoading(false);
    }
  };

  const requiredDocTypes = DOCUMENT_TYPES;
  const existingDocTypes = useMemo(
    () => new Set(existingDocs.map((doc) => doc.tipo_documento).filter((tipo): tipo is FuncionarioDocumentType => DOCUMENT_TYPES.includes(tipo as FuncionarioDocumentType))),
    [existingDocs]
  );
  const uploadedDocTypes = useMemo(() => new Set(docs.map((d) => d.type)), [docs]);
  const requiredUploaded = new Set([...existingDocTypes, ...uploadedDocTypes]).size;
  const uploadCompletion = Math.round((Math.min(requiredUploaded, requiredDocTypes.length) / requiredDocTypes.length) * 100);
  const flowCompletion = Math.round(((step - 1) / 2) * 100);

  const validateStep1 = () => {
    // Si el nombre y NIT del proveedor ya están llenos, no requerir selección del dropdown
    if (!form.proveedorId && (!form.proveedorNombre.trim() || !form.nit.trim())) {
      return 'Debe seleccionar un proveedor';
    }
    if (!form.tipoDocumento.trim()) return 'Tipo de documento es obligatorio';
    if (!form.valorTotal || Number(form.valorTotal) <= 0) return 'Valor total debe ser mayor a 0';
    if (!form.fechaFactura) return 'Fecha de emision es obligatoria';
    if (!form.fechaRecepcion) return 'Fecha de recepcion es obligatoria';
    if (!form.departamentoId) return 'Debe seleccionar un area solicitante';
    if (!form.descripcion.trim()) return 'Descripcion es obligatoria';
    return null;
  };

  const validateStep2 = () => {
    if (hasSelectedDocsForReject) {
      return 'Hay documentos marcados para rechazo. Debes rechazar la factura o desmarcarlos antes de continuar.';
    }
    const required = DOCUMENT_TYPES;
    const docTypes = new Set<FuncionarioDocumentType>([...existingDocTypes, ...uploadedDocTypes]);
    const missing = required.filter((t) => !docTypes.has(t));
    return missing.length ? `Faltan documentos obligatorios: ${missing.join(', ')}` : null;
  };

  const nextStep = () => {
    setError(null);
    if (step === 1) {
      const err = validateStep1();
      if (err) {
        setError(err);
        return;
      }
    }
    if (step === 2) {
      const err = validateStep2();
      if (err) {
        setError(err);
        return;
      }
    }
    setStep((s) => Math.min(3, s + 1));
  };

  const prevStep = () => {
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const submit = async () => {
    setError(null);
    const err = validateStep2();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);

    // Si no hay proveedorId pero hay nombre y NIT, buscar el proveedor en la lista
    let proveedorIdFinal = Number(form.proveedorId);
    if (!proveedorIdFinal && form.proveedorNombre.trim() && form.nit.trim()) {
      const proveedorEncontrado = proveedores.find(p => 
        p.razon_social === form.proveedorNombre.trim() && p.nit === form.nit.trim()
      );
      if (proveedorEncontrado) {
        proveedorIdFinal = proveedorEncontrado.id;
      } else {
        // Intentar búsqueda parcial solo por nombre
        const proveedorPorNombre = proveedores.find(p => 
          p.razon_social === form.proveedorNombre.trim()
        );
        if (proveedorPorNombre) {
          proveedorIdFinal = proveedorPorNombre.id;
        }
      }
    }

    if (!proveedorIdFinal) {
      setError('No se pudo resolver el proveedor de esta factura. Abra “Ver” en Mis Pendientes, valide el proveedor y vuelva a intentar.');
      setLoading(false);
      return;
    }

    const payload: CreateFacturaDTO = {
      numero_factura: numeroFacturaSugerido || undefined,
      proveedor_id: proveedorIdFinal,
      departamento_id: Number(form.departamentoId),
      valor_subtotal: Number(form.valorSubtotal || 0),
      valor_iva: Number(form.valorIva || 0),
      valor_total: Number(form.valorTotal),
      tipo_documento: form.tipoDocumento,
      descripcion: form.descripcion,
      observaciones: form.observaciones,
      fecha_factura: form.fechaFactura,
      fecha_recepcion: form.fechaRecepcion,
    };

    try {
      let factura: Factura;

      // Si viene de Mis Pendientes, actualizar la factura existente con el endpoint específico
      if (prefillFromPendiente?.facturaId) {
        const updatePayload: Partial<Factura> = {
          proveedor_id: payload.proveedor_id,
          departamento_id: payload.departamento_id,
          valor_subtotal: payload.valor_subtotal,
          valor_iva: payload.valor_iva,
          valor_total: payload.valor_total,
          tipo_documento: payload.tipo_documento as Factura['tipo_documento'],
          descripcion: payload.descripcion,
          observaciones: payload.observaciones,
          fecha_factura: payload.fecha_factura,
          fecha_recepcion: payload.fecha_recepcion,
        };
        factura = await facturasService.completarRegistro(prefillFromPendiente.facturaId, updatePayload);
      } else {
        // Si es una factura nueva, crearla
        factura = await facturasService.create(payload);
      }

      // Validar que la factura fue creada correctamente
      if (!factura || !factura.id) {
        setError('Error: La factura no fue creada correctamente. Por favor intente nuevamente.');
        setLoading(false);
        return;
      }

      // Subir documentos si existen
      if (!isReviewMode && docs && docs.length > 0) {
        await Promise.all(docs.map((doc) => documentosService.upload(factura.id, doc.file, doc.type)));
      }
      
      setSuccess(true);
    } catch (err) {
      setError(buildApiErrorMessage(err, 'No fue posible registrar la factura. Revise los datos e intente nuevamente.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      navigate('/financiero/funcionario/pendientes');
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigate, success]);

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[1000]">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
                mass: 0.8
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.5,
              transition: { duration: 0.3 }
            }}
            className="relative max-w-2xl w-full mx-4"
          >
            {/* Confetti animado de fondo */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: Math.random() * 20 + 8,
                  height: Math.random() * 20 + 8,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: ['#10b981', '#059669', '#047857', '#34d399'][Math.floor(Math.random() * 4)],
                  opacity: 0.7,
                }}
                animate={{
                  y: [0, -300, -400],
                  x: [0, Math.random() * 100 - 50],
                  rotate: [0, 360, 720],
                  opacity: [0.7, 0.7, 0],
                }}
                transition={{
                  duration: 2,
                  ease: 'easeOut',
                  delay: i * 0.08,
                }}
              />
            ))}

            {/* Tarjeta de éxito principal */}
            <motion.div
              className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-3xl p-10 text-center shadow-2xl"
              animate={{
                boxShadow: [
                  '0 0 0 0px rgba(16, 185, 129, 0.4)',
                  '0 0 0 40px rgba(16, 185, 129, 0)',
                ],
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
            >
              {/* Ícono con animación de pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                  className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
              </motion.div>

              {/* Textos animados */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-4xl font-bold text-green-700 mb-3">
                  ✓ ¡Éxito!
                </h2>
                <p className="text-xl text-green-600 font-semibold mb-2">
                  Factura registrada correctamente
                </p>
                <p className="text-green-600">
                  La factura ha sido cargada al sistema y está lista para continuar su flujo de aprobación.
                </p>
              </motion.div>

              <motion.div className="hidden">
                <div className="flex items-center justify-center gap-2">
                  <span>📋 Datos guardados</span>
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, delay: 0.7 }}>✓</motion.span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>📁 Documentos cargados</span>
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, delay: 0.9 }}>✓</motion.span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>🚀 Flujo iniciado</span>
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, delay: 1.1 }}>✓</motion.span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  const stepItems = [
    { id: 1, title: 'Informacion general', description: 'Proveedor, valor, fechas y area' },
    { id: 2, title: 'Soportes', description: 'Revision documental y adjuntos' },
    { id: 3, title: 'Confirmacion', description: 'Resumen antes del registro' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          {prefillFromPendiente ? 'Verificar y Registrar Factura' : 'Registrar Nueva Factura'}
        </h1>
        <p className="text-slate-600 mt-1">
          {prefillFromPendiente
            ? 'Revise datos y soportes enviados por el proveedor antes del registro oficial.'
            : 'Complete la informacion de la factura recibida del proveedor'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stepItems.map((item) => {
          const isActive = step === item.id;
          const isDone = step > item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id < step) setStep(item.id);
              }}
              className={`text-left rounded-xl border p-4 transition-all ${
                isActive
                  ? 'border-slate-900 bg-white shadow-sm'
                  : isDone
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : item.id}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden">
        {/* Barra de progreso moderna */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-slate-50 to-red-50 rounded-2xl p-6 border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 font-medium">Progreso del Registro</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{flowCompletion}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Paso</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{step} de 3</p>
            </div>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg shadow-red-300"
              initial={{ width: 0 }} 
              animate={{ width: `${flowCompletion}%` }} 
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Indicadores de paso con diseño mejorado */}
        <div className="flex items-center justify-between mb-10 relative">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center flex-1">
              <motion.div
                className="flex flex-col items-center flex-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: n * 0.1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all ${
                    step > n 
                      ? 'bg-green-500 text-white shadow-green-300' 
                      : step === n 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300 scale-110' 
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {step > n ? '✓' : n}
                </motion.div>
                <span className={`text-xs font-semibold mt-3 text-center transition-colors ${
                  step >= n ? 'text-red-600' : 'text-slate-400'
                }`}>
                  {n === 1 ? 'Datos\nGenerales' : n === 2 ? 'Documentos' : 'Confirmación'}
                </span>
              </motion.div>
              
              {n < 3 && (
                <div className="flex-1 mx-3 h-1 relative">
                  <div className="absolute inset-0 bg-slate-200 rounded-full" />
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: step > n ? '100%' : '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700">
          <AlertCircle size={18} /> {error}
        </motion.div>
      )}

      {showLegacyBlocks && prefillFromPendiente && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          Se cargaron automáticamente datos desde Pendientes (registro #{prefillFromPendiente.facturaId}).
          El flujo ahora es de verificación: valida información y soportes, y registra sin re-digitar.
        </motion.div>
      )}

      {showLegacyBlocks && prefillWarning && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          {prefillWarning}
        </motion.div>
      )}

      {prefillLoading && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Cargando información completa de la solicitud del proveedor...
        </motion.div>
      )}

      {/* Contenedor con AnimatePresence para transiciones suaves entre pasos */}
      <AnimatePresence mode="wait">
        {step === 1 && (
        <motion.div
          key="step-1"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
          className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
        >
        <div className="relative mb-8 pr-32">
          <h2 className="text-4xl font-bold text-slate-900">Información General</h2>
          <p className="max-w-xl text-slate-500 mt-2">Revise los datos enviados por el proveedor.</p>
          {prefillFromPendiente && (
            <button
              type="button"
              onClick={openRejectDialog}
              className="absolute right-0 top-0 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              <XCircle className="h-4 w-4" />
              Rechazar
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Selección de Proveedor */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-slate-50 rounded-xl p-5 border border-slate-200"
          >
            <label className="block text-sm font-bold text-slate-800 mb-2">Seleccionar Proveedor *</label>
            <select
              className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all bg-white text-slate-900 font-medium"
              value={form.proveedorId}
              onChange={(e) => setField('proveedorId', Number(e.target.value))}
              disabled={isReviewMode || catalogLoading || proveedores.length === 0}
            >
              <option value={0}>-- Seleccione un proveedor --</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.razon_social}</option>
              ))}
            </select>
            <p className="text-xs text-slate-600 mt-2">
              {prefillFromPendiente
                ? 'Proveedor bloqueado: corresponde a la solicitud pendiente seleccionada.'
                : catalogLoading
                ? 'Cargando proveedores...'
                : proveedores.length === 0
                  ? 'No hay proveedores disponibles. Cree proveedores en el modulo Admin Financiero.'
                  : 'Si el proveedor no existe, contacte al Administrador Financiero'}
            </p>
          </motion.div>

          {/* Datos del Proveedor */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre del Proveedor</label>
              <input 
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 text-slate-600 font-medium"
                value={form.proveedorNombre} 
                readOnly 
                placeholder="Auto-completado"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">NIT</label>
              <input 
                className="w-full border-2 border-slate-200 rounded-lg px-4 py-3 bg-slate-50 text-slate-600 font-medium"
                value={form.nit} 
                readOnly 
                placeholder="Auto-completado"
              />
            </div>
          </motion.div>

          {/* Datos de la Factura */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-50 rounded-xl p-5 border border-slate-200"
          >
            <p className="text-sm font-bold text-slate-800 mb-4">Datos de la Factura *</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Número de Factura</label>
                <input 
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 bg-white text-slate-700"
                  value={numeroFacturaSugerido || 'Cargando consecutivo...'}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Tipo de Documento</label>
                <select 
                  className="w-full border-2 border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                  value={form.tipoDocumento} 
                  onChange={(e) => setField('tipoDocumento', e.target.value)}
                  disabled={isReviewMode}
                >
                  <option value="Factura">Factura</option>
                  <option value="Cuenta de Cobro">Cuenta de Cobro</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Subtotal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                  <input 
                    type="number" 
                    className="w-full border-2 border-slate-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    value={form.valorSubtotal || ''} 
                    onChange={(e) => setField('valorSubtotal', Number(e.target.value || 0))} 
                    readOnly={isReviewMode}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Tasa</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                  <input
                    type="number"
                    className="w-full border-2 border-slate-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    value={form.valorIva || ''}
                    onChange={(e) => setField('valorIva', Number(e.target.value || 0))}
                    readOnly={isReviewMode}
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Valor Total</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                  <input
                    type="number"
                    className="w-full border-2 border-slate-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    value={form.valorTotal || ''}
                    onChange={(e) => setField('valorTotal', Number(e.target.value || 0))}
                    readOnly={isReviewMode}
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Fechas Importantes */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-slate-50 rounded-xl p-5 border border-slate-200"
          >
            <p className="text-sm font-bold text-slate-800 mb-4">Fechas Clave *</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Fecha de Emisión (Factura)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="date" 
                    className="w-full border-2 border-slate-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-slate-500 focus:border-slate-500 transition-all"
                    value={form.fechaFactura} 
                    onChange={(e) => setField('fechaFactura', e.target.value)}
                    disabled={isReviewMode}
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Fecha que aparece en la factura</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Fecha de Recepción en la Universidad</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-red-600 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="date" 
                    className="w-full border-2 border-red-400 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all font-semibold"
                    value={form.fechaRecepcion} 
                    onChange={(e) => setField('fechaRecepcion', e.target.value)}
                    disabled={isReviewMode}
                  />
                </div>
                <p className="text-xs text-red-600 font-semibold mt-1">
                  ⚠ Desde esta fecha inician los {slaTotalDias} días {slaTodosHabiles ? 'hábiles' : 'totales'} del SLA del proceso completo ({slaEtapas} etapas activas)
                </p>
              </div>
            </div>
          </motion.div>

          {/* Área y Descripción */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Área Solicitante *</label>
              <select 
                className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                value={form.departamentoId} 
                onChange={(e) => setField('departamentoId', Number(e.target.value))}
                disabled={isReviewMode || catalogLoading || departamentos.length === 0}
              >
                <option value={0}>Seleccione un área</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
              {!catalogLoading && departamentos.length === 0 && (
                <p className="text-xs text-red-600 mt-2">No hay areas/departamentos disponibles para asignar.</p>
              )}
            </div>

            {isReviewMode && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Identificacion Factura</label>
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">Dato enviado por el proveedor</p>
                    <p className="mt-1 whitespace-pre-line text-sm font-medium text-amber-900">
                      {safeString(form.observaciones, 'Sin identificacion cargada')}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">Descripcion del Servicio / Bien</label>
                  <ReadonlyServiciosFactura descripcion={form.descripcion} />
                </div>
              </>
            )}

            <div className={isReviewMode ? 'hidden' : ''}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción del Servicio/Producto *</label>
              <textarea 
                className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 min-h-28 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                value={form.descripcion} 
                onChange={(e) => setField('descripcion', e.target.value)} 
                readOnly={isReviewMode}
                placeholder="Descripción detallada: concepto, periodo, alcance del servicio/producto facturado..."
              />
            </div>

            <div className={isReviewMode ? 'hidden' : ''}>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Observaciones Adicionales</label>
              <textarea 
                className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 min-h-20 focus:ring-2 focus:ring-slate-400 focus:border-slate-400 transition-all"
                value={form.observaciones} 
                onChange={(e) => setField('observaciones', e.target.value)} 
                placeholder="Notas adicionales, contexto de recepción o alertas... (opcional)"
              />
            </div>
          </motion.div>

          {/* Botones de navegación */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex justify-between gap-3 pt-4 border-t-2 border-slate-200"
          >
            {showLegacyBlocks && prefillFromPendiente ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={openRejectDialog}
                type="button"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-all"
              >
                <XCircle className="h-4 w-4" />
                Rechazar factura
              </motion.button>
            ) : <span />}
            <motion.button 
              whileHover={{ scale: 1.02 }} 
              whileTap={{ scale: 0.98 }} 
              onClick={nextStep} 
              type="button" 
              disabled={prefillLoading}
              className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-300 hover:shadow-lg hover:shadow-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Siguiente →
            </motion.button>
          </motion.div>
        </div>
        </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-2"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
          >
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-4xl font-bold text-slate-900">Carga de Documentos</h2>
                <p className="text-slate-500 mt-2">Verifique soportes del proveedor y cargue solo faltantes o correcciones.</p>
              </div>
              {prefillFromPendiente && (
                <button
                  type="button"
                  onClick={openRejectDialog}
                  className="flex-shrink-0 inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar
                </button>
              )}
            </div>

            {showLegacyBlocks && prefillFromPendiente && prefillApplied && (
              <div className={`mb-5 rounded-xl border p-4 text-sm font-mono ${
                diagInfo.status === 'error' ? 'bg-red-50 border-red-300 text-red-800' :
                diagInfo.status === 'loading' ? 'bg-slate-50 border-slate-300 text-slate-600' :
                diagInfo.count === 0 ? 'bg-amber-50 border-amber-300 text-amber-800' :
                'bg-green-50 border-green-300 text-green-800'
              }`}>
                <p className="font-bold text-xs mb-1">🔍 DIAGNÓSTICO DE DOCUMENTOS</p>
                <p>Fuente: <span className="font-semibold">{diagInfo.source || '—'}</span></p>
                <p>Resultado: <span className="font-bold">{diagInfo.status === 'loading' ? 'Consultando...' : `${diagInfo.count} documento(s) encontrado(s) en BD`}</span></p>
                {diagInfo.rawError && <p className="mt-1 text-xs">Error: {diagInfo.rawError}</p>}
                {diagInfo.status === 'done' && diagInfo.count === 0 && (
                  <p className="mt-1 text-xs font-semibold">
                    ⚠ La BD no tiene documentos para esta factura. El proveedor puede no haberlos subido correctamente, o fallaron al guardarse.
                  </p>
                )}
              </div>
            )}

            {showLegacyBlocks && existingDocs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="mb-6 rounded-2xl bg-blue-50 border-2 border-blue-200 p-5"
              >
                <p className="text-sm font-bold text-blue-900 mb-3">📎 Documentos ya enviados por proveedor ({existingDocs.length})</p>
                <div className="space-y-2">
                  {existingDocs.map((doc) => (
                    <div key={`existing-${doc.id}`} className="bg-white rounded-lg p-3 border border-blue-200">
                      <p className="text-sm font-semibold text-slate-900">{doc.tipo_documento}</p>
                      <p className="text-xs text-slate-600">{doc.nombre_archivo}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Barra de progreso de documentos */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-bold text-green-900">📊 Progreso de Carga</p>
                  <p className="text-3xl font-bold text-green-600 mt-1">{uploadCompletion}%</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-green-700 font-semibold">{requiredUploaded} de {requiredDocTypes.length}</p>
                  <p className="text-xs text-green-600 mt-1">Documentos cargados</p>
                </div>
              </div>
              <div className="h-4 bg-green-200 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full shadow-lg"
                  initial={{ width: 0 }}
                  animate={{ width: `${uploadCompletion}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            {/* Tarjetas de carga */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="hidden"
            >
              {DOCUMENT_TYPES.map((type, idx) => {
                const hasUpload = uploadedDocTypes.has(type);
                const hasExisting = existingDocTypes.has(type);
                const hasDoc = hasUpload || hasExisting;
                return (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2 + idx * 0.08 }}
                    whileHover={{ y: -4 }}
                    className={`rounded-2xl p-6 border-2 transition-all ${
                      hasDoc
                        ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-400'
                        : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="font-bold text-slate-900 text-lg">{type}</p>
                        {hasUpload && <p className="text-xs text-green-600 font-semibold mt-1">✓ Actualizado en esta revisión</p>}
                        {!hasUpload && hasExisting && <p className="text-xs text-blue-600 font-semibold mt-1">✓ Ya enviado por proveedor</p>}
                      </div>
                      {hasDoc && <span className="text-2xl">✓</span>}
                    </div>
                    
                    <label className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold hover:shadow-lg hover:shadow-red-300 cursor-pointer transition-all hover:scale-105 active:scale-95">
                      <Upload className="w-4 h-4" /> 
                      {hasDoc ? 'Cambiar' : 'Subir'}
                      <input type="file" accept=".pdf,.xml,.png,.jpg,.jpeg,application/pdf,application/xml,text/xml,image/png,image/jpeg" className="hidden" onChange={(e) => addDoc(type, e.target.files?.[0])} />
                    </label>
                    <p className="text-[11px] text-slate-500 mt-2">Permitidos: PDF, XML, PNG, JPG. Máximo 10 MB.</p>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Listado de documentos cargados */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl border-2 border-slate-200 p-6 bg-slate-50"
            >
              <p className="font-bold text-slate-800 mb-4 text-lg">📁 Documentos Cargados</p>

              {docs.length === 0 && existingDocs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="py-8 text-center"
                >
                  <p className="text-slate-500 text-sm">📪 Aún no has cargado documentos</p>
                  <p className="text-slate-400 text-xs mt-1">Adjunta Factura, Orden de Compra, Certificación Bancaria, Acta de Entrega o Soporte Adicional</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {existingDocs.map((d) => {
                    const selected = selectedExistingDocIds.has(getExistingDocKey(d));
                    return (
                    <div
                      key={`exist-list-${d.id}`}
                      className={`rounded-xl p-4 border transition-all ${selected ? 'bg-green-50 border-green-300' : 'bg-white border-slate-200'}`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <button
                            type="button"
                            onClick={() => toggleExistingDocSelection(d)}
                            className={`flex h-9 w-9 items-center justify-center rounded-full border transition-all font-bold text-lg ${selected ? 'border-green-500 bg-green-500 text-white shadow-lg shadow-green-300' : 'border-slate-300 bg-white text-slate-400'}`}
                            title={selected ? 'Quitar de rechazo' : 'Marcar para rechazo'}
                            aria-label={selected ? 'Quitar documento de rechazo' : 'Marcar documento para rechazo'}
                          >
                            {selected ? '✓' : '○'}
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{d.tipo_documento}</p>
                            <p className="text-xs text-slate-500 truncate">{d.nombre_archivo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => openExistingDocument(d)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => { void downloadExistingDocument(d); }}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}

                  {docs.map((d, idx) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -12, y: 12 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-green-400 transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => removeDoc(d.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-all hover:scale-110 active:scale-95"
                            title="Eliminar documento"
                          >
                            <X className="w-5 h-5" />
                          </button>
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{d.type}</p>
                            <p className="text-xs text-slate-500 truncate">{d.file.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <label className="inline-flex cursor-pointer items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100">
                            <Upload className="w-3.5 h-3.5" /> Cambiar
                            <input
                              type="file"
                              accept=".pdf,.xml,.png,.jpg,.jpeg,application/pdf,application/xml,text/xml,image/png,image/jpeg"
                              className="hidden"
                              onChange={(event: React.ChangeEvent<HTMLInputElement>) => addDoc(d.type, event.target.files?.[0])}
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => openLocalDocument(d)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadLocalDocument(d)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar
                          </button>
                        </div>
                      </div>

                    </motion.div>
                  ))}
                </div>
              )}

              {hasSelectedDocsForReject && (
                <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  Tienes documentos marcados para rechazo. Si vas a devolver esta factura, usa el boton Rechazar factura. Para continuar al siguiente paso, primero desmarca esos documentos.
                </div>
              )}
            </motion.div>

            {/* Sección de Documentos Adicionales */}
            {!isReviewMode && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl border-2 border-slate-200 p-6 bg-slate-50 mt-8"
            >
              <div className="mb-4">
                <p className="font-bold text-slate-800 text-lg">📎 Documentos Adicionales</p>
                <p className="text-sm text-slate-600 mt-1">Agrega documentos adicionales si el funcionario necesita incluir más soportes (solo PDF)</p>
              </div>

              <div className="space-y-3">
                {/* Botón para agregar documentos adicionales */}
                <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-slate-300 bg-white hover:bg-slate-50 cursor-pointer transition-all hover:border-blue-400">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <span className="font-semibold text-slate-700">Agregar documento adicional (PDF)</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      
                      if (file.type !== 'application/pdf' && !file.name.endsWith('.pdf')) {
                        setError('Solo se permiten archivos PDF');
                        return;
                      }
                      
                      if (file.size > MAX_UPLOAD_SIZE_BYTES) {
                        setError('El archivo supera el tamaño máximo permitido (10 MB)');
                        return;
                      }
                      
                      addDoc('Soporte Adicional', file);
                    }}
                  />
                </label>

                {/* Listado de documentos adicionales cargados */}
                {docs.filter((d: FuncionarioUploadedDoc) => d.type === 'Soporte Adicional').length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-semibold text-slate-700">Documentos adicionales cargados:</p>
                    {docs.filter((d: FuncionarioUploadedDoc) => d.type === 'Soporte Adicional').map((d: FuncionarioUploadedDoc, idx: number) => (
                      <motion.div
                        key={d.id}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + idx * 0.05 }}
                        className="bg-white rounded-lg p-3 border border-blue-200 flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                          <p className="text-sm text-slate-700 truncate">{d.file.name}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDoc(d.id)}
                          className="p-1 rounded hover:bg-red-100 text-red-600 hover:text-red-700 transition-all"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
            )}

            {/* Botones de navegación */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="flex justify-between gap-3 pt-6 mt-6 border-t-2 border-slate-200"
            >
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={prevStep} 
                type="button" 
                className="px-6 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-all"
              >
                ← Anterior
              </motion.button>
              {showLegacyBlocks && prefillFromPendiente && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={openRejectDialog}
                  type="button"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-red-200 bg-red-50 text-red-700 font-semibold hover:bg-red-100 transition-all"
                >
                  <XCircle className="h-4 w-4" />
                  Rechazar factura
                </motion.button>
              )}
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={nextStep} 
                type="button" 
                disabled={hasSelectedDocsForReject}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-300 hover:shadow-lg hover:shadow-red-400 transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
              >
                Siguiente →
              </motion.button>
            </motion.div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div
            key="step-3"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8"
          >
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-slate-800 border-b-2 border-slate-300 pb-3">Confirmación del Registro</h2>
              <p className="text-slate-600 mt-3 text-lg font-medium">Por favor, revise toda la información antes de proceder con el registro de la factura</p>
            </div>

            {/* Tarjeta de datos principales */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
            >
              <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Información del Proveedor</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Proveedor</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(form.proveedorNombre, 'No seleccionado')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">NIT</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">{safeString(form.nit, 'No disponible')}</p>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta de factura */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
            >
              <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Datos de la Factura</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Número</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(numeroFacturaSugerido, 'Cargando...')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Tipo</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(form.tipoDocumento, 'No especificado')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Subtotal</p>
                  <p className="text-xl font-bold text-slate-800">{formatMoney(form.valorSubtotal)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Tasa</p>
                  <p className="text-xl font-bold text-slate-800">{formatMoney(form.valorIva)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-slate-900">{formatMoney(form.valorTotal)}</p>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta de fechas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
            >
              <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Fechas Importantes</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Emisión de Factura</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(form.fechaFactura, 'Sin fecha')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Recepción en Universidad (SLA)</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(form.fechaRecepcion, 'Sin fecha')}</p>
                </div>
              </div>
            </motion.div>

            {/* Resumen adicional */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 }}
              className="rounded-2xl bg-slate-50 border-2 border-slate-300 p-6 mb-6"
            >
              <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Información Adicional</p>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-1">Área Solicitante</p>
                  <p className="text-slate-800 font-semibold">
                    {departamentos?.length > 0 
                      ? safeString(departamentos.find(d => d?.id === form.departamentoId)?.nombre, 'No seleccionada')
                      : 'No seleccionada'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-sm text-slate-600 font-semibold mb-3">Descripción del Servicio / Bien</p>
                  <ReadonlyServiciosFactura descripcion={form.descripcion} />
                </div>
                {form.observaciones && safeString(form.observaciones) !== 'Sin observaciones' && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-sm text-slate-600 font-semibold mb-1">Observaciones</p>
                    <p className="text-slate-800 text-sm font-medium">{safeString(form.observaciones, 'Sin observaciones')}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sumario de documentos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-slate-50 border border-slate-200 p-6 mb-6"
            >
              <p className="font-bold text-slate-700 mb-4 text-lg border-b border-slate-300 pb-2">Documentos Verificados ({existingDocs.length + docs.length})</p>
              <div className="space-y-2">
                {existingDocs.map((d) => (
                  <div
                    key={`confirm-existing-${d.id}`}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200"
                  >
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-slate-300">✓</span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{d.tipo_documento}</p>
                      <p className="text-xs text-slate-500 truncate">{d.nombre_archivo}</p>
                    </div>
                  </div>
                ))}

                {docs.map((d, idx) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + idx * 0.05 }}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-slate-200"
                  >
                    <span className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 text-white flex items-center justify-center text-sm font-bold shadow-lg shadow-slate-300">✓</span>
                    <div>
                      <p className="font-semibold text-slate-900 text-sm">{d.type}</p>
                      <p className="text-xs text-slate-500 truncate">{d.file.name}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Botones de navegación */}
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex justify-between gap-3 pt-6 border-t-2 border-slate-200"
            >
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={prevStep} 
                type="button" 
                className="px-6 py-3 rounded-lg bg-slate-200 text-slate-700 font-semibold hover:bg-slate-300 transition-all"
              >
                ← Anterior
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={submit} 
                type="button" 
                disabled={loading}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg shadow-green-300 hover:shadow-lg hover:shadow-green-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '⏳ Registrando...' : '✓ Registrar Factura'}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={Boolean(previewDocument)}
        onOpenChange={(open) => {
          if (!open && previewDocument?.url.startsWith('blob:')) {
            URL.revokeObjectURL(previewDocument.url);
          }
          if (!open) setPreviewDocument(null);
        }}
      >
        <DialogContent className="max-w-7xl w-[95vw] h-[90vh]">
          <DialogHeader>
            <DialogTitle>{previewDocument?.name || 'Documento'}</DialogTitle>
            <DialogDescription>Vista previa del soporte seleccionado.</DialogDescription>
          </DialogHeader>
          {previewDocument && (
            <div className="h-[calc(90vh-120px)] overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
              <iframe
                src={previewDocument.url}
                title={previewDocument.name}
                className="h-full w-full"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={rechazarOpen} onOpenChange={setRechazarOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rechazar factura</DialogTitle>
            <DialogDescription>
              La factura volvera al proveedor para correccion. Si marcaste documentos, se incluiran en el motivo del rechazo.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedExistingDocs.length > 0 && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
                <p className="font-semibold mb-2">✓ Documentos seleccionados para rechazo:</p>
                <p className="text-green-700 font-medium">{selectedExistingDocs.map((doc: DocumentoAdjunto) => doc.tipo_documento).join(', ')}</p>
                <p className="text-xs text-green-600 mt-2 italic">Se rechazaron los siguientes documentos: {selectedExistingDocs.map((doc: DocumentoAdjunto) => doc.tipo_documento).join(', ')}, por favor modificar documentos.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="rechazo-registro-motivo">Motivo del rechazo</Label>
              <Textarea
                id="rechazo-registro-motivo"
                value={rechazarMotivo}
                onChange={(event) => {
                  setRechazarMotivo(event.target.value);
                  setRechazarError(null);
                }}
                placeholder="Describe que debe corregir el proveedor..."
                rows={4}
              />
              {rechazarError && <p className="text-sm text-red-600">{rechazarError}</p>}
            </div>
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setRechazarOpen(false)}
              className="rounded-md border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              disabled={rechazarLoading}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => { void confirmReject(); }}
              className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              disabled={rechazarLoading}
            >
              {rechazarLoading ? 'Rechazando...' : 'Confirmar rechazo'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
