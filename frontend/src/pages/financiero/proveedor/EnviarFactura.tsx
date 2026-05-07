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
  X,
  Search,
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { departamentosService, documentosService, facturasService, proveedoresService } from '../../../services/financiero';
import type { Departamento, Factura, Proveedor } from '../../../models/financiero/core.models';
import type { EnviarFacturaProps, UploadedDoc } from '../../../models/financiero/proveedor';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Button } from '../../../share/button';

const formatMoney = (val: unknown) => {
  const num = Number(val) || 0;
  return `$${num.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

const TIPO_DOCUMENTO_OPTS = [
  'Factura Electrónica',
  'Factura',
  'Cuenta de Cobro',
  'Nota Débito',
  'Otro',
];
const DOC_TYPES = ['Factura', 'Orden de Compra', 'Certificación Bancaria', 'Acta de Entrega', 'Soporte Adicional'];
const ALLOWED_DOC_EXTENSIONS = new Set(['pdf', 'xml', 'png', 'jpg', 'jpeg']);
const ALLOWED_DOC_MIME_TYPES = new Set(['application/pdf', 'application/xml', 'text/xml', 'image/png', 'image/jpeg']);
const IVA_PERCENTAGES = [0, 5, 19];
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

  const [form, setForm] = useState({
    tipoDocumento: 'Factura' as string,
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
      descripcion: correccionFactura.descripcion || prev.descripcion,
      observaciones: correccionFactura.observaciones || prev.observaciones,
      departamentoId: correccionFactura.departamento?.id || prev.departamentoId,
      valorSubtotal: Number(correccionFactura.valor_subtotal || 0),
      valorIva: Number(correccionFactura.valor_iva || 0),
      valorTotal: Number(correccionFactura.valor_total || 0),
      ivaPorcentaje,
      fechaFactura: correccionFactura.fecha_factura || prev.fechaFactura,
      fechaRecepcion: getToday(),
      cuentaBancaria: correccionFactura.cuenta_bancaria_proveedor || prev.cuentaBancaria,
    }));
    setDocs(existingDocs);
    setStep(2);
    setNumeroFacturaSugerido(correccionFactura.numero_factura || 'Corrección en curso');
  }, [correccionFactura, miProveedor]);

  const documentTypes = useMemo(() => {
    const existingTypes = docs.map((doc) => doc.type).filter(Boolean);
    return Array.from(new Set([...DOC_TYPES, ...existingTypes]));
  }, [docs]);

  useEffect(() => {
    const loadCatalogos = async () => {
      setCatalogLoading(true);
      try {
        const depts = await departamentosService.getAreasSolicitantes();
        setDepartamentos(Array.isArray(depts) ? depts : []);
      } catch {
        setDepartamentos([]);
      } finally {
        setCatalogLoading(false);
      }
    };
    void loadCatalogos();
  }, []);

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
    setForm(prev => ({
      ...prev,
      banco: prev.banco || proveedorSeleccionado.banco || '',
      tipoCuenta: prev.tipoCuenta || proveedorSeleccionado.tipo_cuenta || '',
      numeroCuenta: prev.numeroCuenta || proveedorSeleccionado.numero_cuenta || '',
      cuentaBancaria:
        prev.cuentaBancaria ||
        proveedorSeleccionado.cuenta_bancaria_completa ||
        [proveedorSeleccionado.banco, proveedorSeleccionado.tipo_cuenta, proveedorSeleccionado.numero_cuenta].filter(Boolean).join(' - '),
    }));
  }, [proveedorSeleccionado]);

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

  const handleFieldChange = (field: string, value: unknown) => {
    setForm(prev => {
      const updated = { ...prev, [field]: value };
      if (field === 'valorSubtotal' || field === 'ivaPorcentaje') {
        const subtotal = Number(updated.valorSubtotal) || 0;
        const porcentaje = Number(updated.ivaPorcentaje) || 0;
        updated.valorIva = Number(((subtotal * porcentaje) / 100).toFixed(2));
        updated.valorTotal = Number((subtotal + updated.valorIva).toFixed(2));
      }

      if (field === 'banco' || field === 'tipoCuenta' || field === 'numeroCuenta') {
        updated.cuentaBancaria = [updated.banco, updated.tipoCuenta, updated.numeroCuenta]
          .filter(Boolean)
          .join(' - ');
      }

      return updated;
    });
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

  const canGoNext = () => {
    if (step === 1) return !!proveedorSeleccionado;
    if (step === 2) {
      return (
        form.tipoDocumento &&
        form.descripcion.trim().length > 5 &&
        form.departamentoId > 0 &&
        form.fechaFactura &&
        Number(form.valorTotal) > 0
      );
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!proveedorSeleccionado) return;
    setLoading(true);
    setError(null);
    try {
      const subtotal = Number(form.valorSubtotal) || 0;
      const iva = Number(form.valorIva) || 0;
      const total = Number(form.valorTotal);
      const cuentaBancariaCompleta = [form.banco, form.tipoCuenta, form.numeroCuenta].filter(Boolean).join(' - ') || form.cuentaBancaria;

      const payload = {
        proveedor_id: proveedorSeleccionado.id,
        departamento_id: form.departamentoId,
        tipo_documento: form.tipoDocumento as 'Factura' | 'Factura Electrónica' | 'Cuenta de Cobro' | 'Nota Débito' | 'Otro',
        descripcion: form.descripcion,
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
          tipoCuenta: '',
          numeroCuenta: '',
          cuentaBancaria: '',
        });
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
        className="bg-gradient-to-r from-orange-600 to-orange-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <Send size={24} className="flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-1">{isCorreccion ? 'Corregir Factura' : 'Enviar Factura'}</h3>
            <p className="text-orange-100 text-sm">
              {isCorreccion
                ? 'Actualiza los campos solicitados y reenvía la factura al proceso.'
                : 'Completa los pasos para enviar tu factura al área financiera'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2 flex-1">
            <div className={`flex items-center gap-2 flex-1 ${i < steps.length - 1 ? '' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${step > s.num ? 'bg-green-500 text-white' : step === s.num ? 'bg-orange-600 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-xs font-medium hidden sm:block ${step === s.num ? 'text-orange-600' : 'text-slate-500 dark:text-slate-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${step > s.num ? 'bg-green-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
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
                      className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                    />
                    <button
                      onClick={handleBuscarProveedor}
                      disabled={buscandoProveedor || !nitBusqueda.trim()}
                      className="px-4 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
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
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
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
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
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
                    className={`w-full px-3 py-2.5 border rounded-lg text-sm outline-none ${proveedorSeleccionado
                      ? 'border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300'
                      : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500'
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

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Descripción del Servicio / Bien <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Describe el servicio o bien facturado..."
                    value={form.descripcion}
                    onChange={e => handleFieldChange('descripcion', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                  />
                </div>
              </div>

              {/* Valores */}
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <h5 className="font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
                  <DollarSign size={18} className="text-orange-600" />
                  Valores
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subtotal <span className="text-red-500">*</span></label>
                    <input
                      type="number"
                      min={0}
                      value={form.valorSubtotal || ''}
                      onChange={e => handleFieldChange('valorSubtotal', Number(e.target.value))}
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Valor antes de impuestos.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IVA (%)</label>
                    <select
                      value={form.ivaPorcentaje}
                      onChange={e => handleFieldChange('ivaPorcentaje', Number(e.target.value))}
                      className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                    >
                      {IVA_PERCENTAGES.map(p => (
                        <option key={p} value={p}>{p}%</option>
                      ))}
                    </select>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">El valor de IVA se calcula automáticamente.</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">IVA (valor)</label>
                    <input
                      type="number"
                      min={0}
                      value={form.valorIva || ''}
                      readOnly
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 outline-none"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                      Total <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.valorTotal || ''}
                      readOnly
                      placeholder="0"
                      className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm bg-slate-100 dark:bg-slate-700/60 text-slate-700 dark:text-slate-200 outline-none font-semibold"
                    />
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Total = Subtotal + IVA.</p>
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
                    onChange={e => handleFieldChange('banco', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Seleccionar banco</option>
                    {BANCOS_COLOMBIA.map(banco => (
                      <option key={banco} value={banco}>{banco}</option>
                    ))}
                  </select>

                  <select
                    value={form.tipoCuenta}
                    onChange={e => handleFieldChange('tipoCuenta', e.target.value)}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  >
                    <option value="">Tipo de cuenta</option>
                    {TIPO_CUENTA_OPTS.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Número de cuenta"
                    value={form.numeroCuenta}
                    onChange={e => handleFieldChange('numeroCuenta', e.target.value.replace(/[^0-9]/g, ''))}
                    className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                  />
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completa estos datos para agilizar validación y pago en tesorería.</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Observaciones
                </label>
                <textarea
                  rows={2}
                  placeholder="Observaciones adicionales..."
                  value={form.observaciones}
                  onChange={e => handleFieldChange('observaciones', e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: Documentos */}
          {step === 3 && (
            <div className="space-y-6">
              <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
                <Upload size={20} className="text-orange-600" />
                Adjuntar Documentos <span className="text-slate-400 text-sm font-normal">(opcional)</span>
              </h4>
              <p className="text-slate-600 dark:text-slate-300 text-sm">
                Adjunta los soportes de tu factura. Puedes continuar sin documentos.
              </p>

              <div className="space-y-3">
                {documentTypes.map(type => {
                  const uploaded = docs.find(d => d.type === type);
                  return (
                    <div key={type} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-slate-800 dark:text-white">{type}</p>
                        {uploaded && (
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs space-y-1">
                            <p className="truncate">
                              {uploaded.file?.name || uploaded.existingName || 'Documento cargado'}
                            </p>
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
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-green-500" />
                          <button
                            onClick={() => requestRemoveDoc(uploaded)}
                            className="p-1 hover:bg-red-50 rounded text-red-500"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <label className="cursor-pointer px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors">
                          <Upload size={12} className="inline mr-1" />
                          Adjuntar
                          <input type="file" className="hidden" accept=".pdf,.xml,.jpg,.jpeg,.png" onChange={e => { void handleAddDoc(e, type); }} />
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

                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl">
                  <h5 className="font-semibold text-orange-800 dark:text-orange-300 text-sm mb-2">Valores</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">Subtotal:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{formatMoney(form.valorSubtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600 dark:text-slate-400">IVA:</span>
                      <span className="font-medium text-slate-800 dark:text-white">{formatMoney(form.valorIva)}</span>
                    </div>
                    <div className="flex justify-between border-t border-orange-200 dark:border-orange-700 pt-1 mt-1">
                      <span className="font-bold text-slate-800 dark:text-white">Total:</span>
                      <span className="font-bold text-orange-700 dark:text-orange-400 text-lg">{formatMoney(form.valorTotal)}</span>
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
      <div className="flex justify-between">
        <button
          onClick={() => {
            if (isCorreccion && step === 2) return;
            setStep(s => Math.max(1, s - 1));
          }}
          disabled={step === 1 || (isCorreccion && step === 2)}
          className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft size={16} /> Anterior
        </button>

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-5 py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium text-sm transition-colors"
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
