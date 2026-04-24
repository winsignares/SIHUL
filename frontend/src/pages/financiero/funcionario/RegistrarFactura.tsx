import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Calendar, CheckCircle2, Download, ExternalLink, FileText, RefreshCw, Upload, X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { formatValidationErrors, type ApiError } from '../../../core/errorHandler';
import { departamentosService, documentosService, facturasService, parametrosSlaService, proveedoresService } from '../../../services/financiero';
import type { CreateFacturaDTO, Departamento, DocumentoAdjunto, Factura, Proveedor } from '../../../models/financiero';

type UploadedDoc = {
  id: string;
  type: 'Factura' | 'Orden de Compra' | 'Certificación Bancaria' | 'Acta de Entrega' | 'Soporte Adicional';
  file: File;
};

const DOCUMENT_TYPES: Array<UploadedDoc['type']> = ['Factura', 'Orden de Compra', 'Certificación Bancaria', 'Acta de Entrega', 'Soporte Adicional'];
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

type PrefillFromPendiente = {
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
};

export default function RegistrarFactura() {
  const location = useLocation();
  const prefillFromPendiente = (location.state as { prefillFromPendiente?: PrefillFromPendiente } | null)?.prefillFromPendiente;

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
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [existingDocs, setExistingDocs] = useState<DocumentoAdjunto[]>([]);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [diagInfo, setDiagInfo] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; count: number; source: string; rawError: string | null }>({ status: 'idle', count: 0, source: '', rawError: null });

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

  const addDoc = (type: UploadedDoc['type'], file?: File) => {
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

    // Simula progreso visual de carga para feedback inmediato UX.
    setUploadProgress((prev) => ({ ...prev, [id]: 0 }));
    let current = 0;
    const interval = window.setInterval(() => {
      current += Math.floor(Math.random() * 22) + 12;
      if (current >= 100) {
        current = 100;
        window.clearInterval(interval);
      }
      setUploadProgress((prev) => ({ ...prev, [id]: current }));
    }, 120);
  };

  const reloadExistingDocs = async () => {
    if (!prefillFromPendiente?.facturaId) return;
    setDiagInfo({ status: 'loading', count: 0, source: `GET /financiero/documentos/?factura_id=${prefillFromPendiente.facturaId}`, rawError: null });
    try {
      const list = await documentosService.getByFactura(prefillFromPendiente.facturaId);
      const docs = Array.isArray(list) ? list : [];
      setExistingDocs(docs);
      setDiagInfo({ status: 'done', count: docs.length, source: `GET /financiero/documentos/?factura_id=${prefillFromPendiente.facturaId} (manual reload)`, rawError: null });
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message || String(e);
      setDiagInfo({ status: 'error', count: 0, source: `GET /financiero/documentos/?factura_id=${prefillFromPendiente.facturaId}`, rawError: msg });
    }
  };

  const openExistingDocument = (doc: DocumentoAdjunto) => {
    const url = resolveDocumentUrl(doc.archivo_url ?? doc.url_storage);
    if (!url) {
      setError('Este documento no tiene una URL válida para vista previa en el navegador.');
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const downloadExistingDocument = (doc: DocumentoAdjunto) => {
    const url = resolveDocumentUrl(doc.archivo_url ?? doc.url_storage);
    if (!url) {
      setError('Este documento no tiene una URL válida para descarga directa.');
      return;
    }

    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.target = '_blank';
    anchor.rel = 'noopener noreferrer';
    anchor.download = doc.nombre_archivo || 'documento';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  };

  const openLocalDocument = (doc: UploadedDoc) => {
    const objectUrl = URL.createObjectURL(doc.file);
    window.open(objectUrl, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  };

  const downloadLocalDocument = (doc: UploadedDoc) => {
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
    setUploadProgress((prev) => {
      const clone = { ...prev };
      delete clone[id];
      return clone;
    });
  };

  const requiredDocTypes = DOCUMENT_TYPES;
  const existingDocTypes = useMemo(
    () => new Set(existingDocs.map((doc) => doc.tipo_documento).filter((tipo): tipo is UploadedDoc['type'] => DOCUMENT_TYPES.includes(tipo as UploadedDoc['type']))),
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
    const required = DOCUMENT_TYPES;
    const docTypes = new Set<UploadedDoc['type']>([...existingDocTypes, ...uploadedDocTypes]);
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
      if (docs && docs.length > 0) {
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
      setSuccess(false);
      setStep(1);
      setError(null);
      setDocs([]);
      setExistingDocs([]);
      setUploadProgress({});
      setForm({
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
      void facturasService.getNumeroSugerido().then((numero) => setNumeroFacturaSugerido(numero || '')).catch(() => setNumeroFacturaSugerido(''));
    }, 4000);

    return () => clearTimeout(timer);
  }, [success]);

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

              {/* Detalles animados */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 space-y-2 text-sm text-green-600"
              >
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

  return (
    <div className="max-w-5xl mx-auto space-y-6">
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

      <div className="max-w-4xl mx-auto">
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

      {prefillFromPendiente && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          Se cargaron automáticamente datos desde Pendientes (registro #{prefillFromPendiente.facturaId}).
          El flujo ahora es de verificación: valida información y soportes, y registra sin re-digitar.
        </motion.div>
      )}

      {prefillWarning && (
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
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-slate-900">Información General</h2>
          <p className="text-slate-500 mt-2">Complete los datos de la factura recibida del proveedor</p>
        </div>

        <div className="space-y-6">
          {/* Selección de Proveedor */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200"
          >
            <label className="block text-sm font-bold text-blue-900 mb-2">☆ Seleccionar Proveedor *</label>
            <select
              className="w-full border-2 border-blue-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white text-slate-900 font-medium"
              value={form.proveedorId}
              onChange={(e) => setField('proveedorId', Number(e.target.value))}
              disabled={Boolean(prefillFromPendiente) || catalogLoading || proveedores.length === 0}
            >
              <option value={0}>-- Seleccione un proveedor --</option>
              {proveedores.map((p) => (
                <option key={p.id} value={p.id}>{p.razon_social}</option>
              ))}
            </select>
            <p className="text-xs text-blue-700 mt-2">
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
            className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border-2 border-amber-300"
          >
            <p className="text-sm font-bold text-amber-900 mb-4">📄 Datos de la Factura *</p>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Número de Factura</label>
                <input 
                  className="w-full border-2 border-amber-200 rounded-lg px-4 py-2.5 bg-amber-50 text-slate-700"
                  value={numeroFacturaSugerido || 'Cargando consecutivo...'}
                  readOnly
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Tipo de Documento</label>
                <select 
                  className="w-full border-2 border-amber-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                  value={form.tipoDocumento} 
                  onChange={(e) => setField('tipoDocumento', e.target.value)}
                >
                  <option value="Factura">Factura</option>
                  <option value="Factura Electrónica">Factura Electrónica</option>
                  <option value="Cuenta de Cobro">Cuenta de Cobro</option>
                  <option value="Nota Débito">Nota Débito</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Subtotal</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                  <input 
                    type="number" 
                    className="w-full border-2 border-amber-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={form.valorSubtotal || ''} 
                    onChange={(e) => setField('valorSubtotal', Number(e.target.value || 0))} 
                    placeholder="0"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">IVA</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
                  <input
                    type="number"
                    className="w-full border-2 border-amber-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={form.valorIva || ''}
                    onChange={(e) => setField('valorIva', Number(e.target.value || 0))}
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
                    className="w-full border-2 border-amber-200 rounded-lg pl-8 pr-4 py-2.5 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-all"
                    value={form.valorTotal || ''}
                    onChange={(e) => setField('valorTotal', Number(e.target.value || 0))}
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
            className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border-2 border-purple-300"
          >
            <p className="text-sm font-bold text-purple-900 mb-4">📅 Fechas Clave *</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Fecha de Emisión (Factura)</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-purple-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="date" 
                    className="w-full border-2 border-purple-200 rounded-lg pl-10 pr-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all"
                    value={form.fechaFactura} 
                    onChange={(e) => setField('fechaFactura', e.target.value)}
                  />
                </div>
                <p className="text-xs text-purple-700 mt-1">Fecha que aparece en la factura</p>
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
                    disabled={Boolean(prefillFromPendiente)}
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
                disabled={catalogLoading || departamentos.length === 0}
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

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Descripción del Servicio/Producto *</label>
              <textarea 
                className="w-full border-2 border-slate-300 rounded-lg px-4 py-3 min-h-28 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                value={form.descripcion} 
                onChange={(e) => setField('descripcion', e.target.value)} 
                placeholder="Descripción detallada: concepto, periodo, alcance del servicio/producto facturado..."
              />
            </div>

            <div>
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
            className="flex justify-end gap-3 pt-4 border-t-2 border-slate-200"
          >
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
                  onClick={() => { void reloadExistingDocs(); }}
                  disabled={diagInfo.status === 'loading'}
                  className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-blue-300 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 disabled:opacity-50 transition-all mt-1"
                >
                  <RefreshCw className={`w-4 h-4 ${diagInfo.status === 'loading' ? 'animate-spin' : ''}`} />
                  Recargar documentos
                </button>
              )}
            </div>

            {prefillFromPendiente && prefillApplied && (
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

            {existingDocs.length > 0 && (
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
              className="mb-8 rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 p-6 border-2 border-green-300"
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
              className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
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
                  {existingDocs.map((d) => (
                    <div
                      key={`exist-list-${d.id}`}
                      className="bg-blue-50 rounded-xl p-4 border-2 border-blue-200"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{d.tipo_documento}</p>
                            <p className="text-xs text-slate-500 truncate">{d.nombre_archivo}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-blue-100 text-blue-700">Proveedor</span>
                          <button
                            type="button"
                            onClick={() => openExistingDocument(d)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <ExternalLink className="w-3.5 h-3.5" /> Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadExistingDocument(d)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {docs.map((d, idx) => (
                    <motion.div
                      key={d.id}
                      initial={{ opacity: 0, x: -12, y: 12 }}
                      animate={{ opacity: 1, x: 0, y: 0 }}
                      transition={{ delay: 0.3 + idx * 0.05 }}
                      className="bg-white rounded-xl p-4 border-2 border-slate-200 hover:border-green-400 transition-all"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white shadow-lg">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-slate-900 text-sm">{d.type}</p>
                            <p className="text-xs text-slate-500 truncate">{d.file.name}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
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
                          <button
                            type="button"
                            onClick={() => removeDoc(d.id)}
                            className="p-2 rounded-lg hover:bg-red-100 text-red-600 hover:text-red-700 transition-all hover:scale-110 active:scale-95"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Barra de progreso por archivo */}
                      <div className="mt-3 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${uploadProgress[d.id] || 0}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      {uploadProgress[d.id] !== undefined && uploadProgress[d.id] < 100 && (
                        <p className="text-xs text-slate-500 mt-1 text-right">{uploadProgress[d.id]}%</p>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>

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
              <motion.button 
                whileHover={{ scale: 1.02 }} 
                whileTap={{ scale: 0.98 }} 
                onClick={nextStep} 
                type="button" 
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold shadow-lg shadow-red-300 hover:shadow-lg hover:shadow-red-400 transition-all"
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
              <h2 className="text-4xl font-bold text-slate-900">Confirmación del Registro</h2>
              <p className="text-slate-500 mt-2">Revise toda la información antes de registrar la factura</p>
            </div>

            {/* Tarjeta de datos principales */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-300 p-6 mb-6"
            >
              <p className="font-bold text-amber-900 mb-4 text-lg">🏢 Información del Proveedor</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <p className="text-xs text-amber-700 font-semibold mb-1">Proveedor</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(form.proveedorNombre, 'No seleccionado')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-amber-200">
                  <p className="text-xs text-amber-700 font-semibold mb-1">NIT</p>
                  <p className="text-lg font-bold text-slate-900 font-mono">{safeString(form.nit, 'No disponible')}</p>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta de factura */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.15 }}
              className="rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-300 p-6 mb-6"
            >
              <p className="font-bold text-blue-900 mb-4 text-lg">📄 Datos de la Factura</p>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Número</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(numeroFacturaSugerido, 'Cargando...')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Tipo</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(form.tipoDocumento, 'No especificado')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Subtotal</p>
                  <p className="text-xl font-bold text-slate-800">{formatMoney(form.valorSubtotal)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-1">IVA</p>
                  <p className="text-xl font-bold text-slate-800">{formatMoney(form.valorIva)}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-blue-200">
                  <p className="text-xs text-blue-700 font-semibold mb-1">Valor Total</p>
                  <p className="text-2xl font-bold text-green-600">{formatMoney(form.valorTotal)}</p>
                </div>
              </div>
            </motion.div>

            {/* Tarjeta de fechas */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300 p-6 mb-6"
            >
              <p className="font-bold text-purple-900 mb-4 text-lg">📅 Fechas Importantes</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-lg p-4 border border-purple-200">
                  <p className="text-xs text-purple-700 font-semibold mb-1">Emisión de Factura</p>
                  <p className="text-lg font-bold text-slate-900">{safeString(form.fechaFactura, 'Sin fecha')}</p>
                </div>
                <div className="bg-white rounded-lg p-4 border border-red-400">
                  <p className="text-xs text-red-700 font-semibold mb-1">⚠ Recepción en Universidad (SLA)</p>
                  <p className="text-lg font-bold text-red-600">{safeString(form.fechaRecepcion, 'Sin fecha')}</p>
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
              <p className="font-bold text-slate-900 mb-4 text-lg">📋 Información Adicional</p>
              <div className="space-y-3">
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 font-semibold mb-1">Área Solicitante</p>
                  <p className="text-slate-900 font-semibold">
                    {departamentos?.length > 0 
                      ? safeString(departamentos.find(d => d?.id === form.departamentoId)?.nombre, 'No seleccionada')
                      : 'No seleccionada'}
                  </p>
                </div>
                <div className="bg-white rounded-lg p-3 border border-slate-200">
                  <p className="text-xs text-slate-600 font-semibold mb-1">Descripción</p>
                  <p className="text-slate-800 text-sm">{safeString(form.descripcion, 'Sin descripción')}</p>
                </div>
                {form.observaciones && safeString(form.observaciones) !== 'Sin observaciones' && (
                  <div className="bg-white rounded-lg p-3 border border-slate-200">
                    <p className="text-xs text-slate-600 font-semibold mb-1">Observaciones</p>
                    <p className="text-slate-800 text-sm">{safeString(form.observaciones, 'Sin observaciones')}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Sumario de documentos */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
              className="rounded-2xl bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-300 p-6 mb-6"
            >
              <p className="font-bold text-green-900 mb-4 text-lg">✓ Documentos Verificados ({existingDocs.length + docs.length})</p>
              <div className="space-y-2">
                {existingDocs.map((d) => (
                  <div
                    key={`confirm-existing-${d.id}`}
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-green-200"
                  >
                    <span className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-bold">P</span>
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
                    className="flex items-center gap-3 bg-white rounded-lg p-3 border border-green-200"
                  >
                    <span className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-bold">✓</span>
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
    </div>
  );
}
