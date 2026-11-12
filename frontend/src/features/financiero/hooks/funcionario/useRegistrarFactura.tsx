import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { downloadDocumentoIndividual } from '../../components/documentos-consolidados';
import { departamentosService, documentosService, facturasService, parametrosSlaService, proveedoresService } from '../../services';
import type {
  CreateFacturaDTO,
  Departamento,
  DocumentoAdjunto,
  Factura,
  ItemFactura,
  Proveedor,
} from '../../models/core.models';
import type { FuncionarioDocumentType, FuncionarioUploadedDoc, PrefillFromPendiente } from '../../models/funcionario';
import { DOCUMENT_TYPES, toList, buildApiErrorMessage, buildDocumentoContenidoUrl, validateUploadFile } from '../../components/registrarFactura/auxiliares';

/** Estado y reglas de RegistrarFactura (la página solo dibuja). */
export function useRegistrarFactura() {
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
  const [, setPrefillWarning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [numeroFacturaSugerido, setNumeroFacturaSugerido] = useState('');
  const [, setSlaTotalDias] = useState(0);
  const [, setSlaTodosHabiles] = useState(true);
  const [, setSlaEtapas] = useState(0);

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [docs, setDocs] = useState<FuncionarioUploadedDoc[]>([]);
  const [existingDocs, setExistingDocs] = useState<DocumentoAdjunto[]>([]);
  const [, setDiagInfo] = useState<{ status: 'idle' | 'loading' | 'done' | 'error'; count: number; source: string; rawError: string | null }>({ status: 'idle', count: 0, source: '', rawError: null });
  const [selectedExistingDocIds, setSelectedExistingDocIds] = useState<Set<string>>(new Set());
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [rechazarMotivo, setRechazarMotivo] = useState('');
  const [rechazarError, setRechazarError] = useState<string | null>(null);
  const [rechazarLoading, setRechazarLoading] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<{ url: string; name: string } | null>(null);

  const [facturaItems, setFacturaItems] = useState<ItemFactura[] | undefined>(undefined);
  const [identificacionFactura, setIdentificacionFactura] = useState<string | undefined>(undefined);

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
        setError('No fue posible cargar proveedores y departamentos. Verifique la conexión con el backend.');
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
          observaciones: factura.observaciones || prev.observaciones,
        }));

        // Cargar items estructurados e identificacion si existen
        if (factura.items && factura.items.length > 0) {
          setFacturaItems(factura.items);
        }
        if (factura.identificacion_factura) {
          setIdentificacionFactura(factura.identificacion_factura);
        } else if (factura.observaciones && !factura.identificacion_factura) {
          setIdentificacionFactura(factura.observaciones);
        }

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
    const url = buildDocumentoContenidoUrl(doc);
    if (!url) {
      setError('No fue posible ubicar este documento para vista previa desde la base de datos.');
      return;
    }
    setPreviewDocument({ url, name: doc.nombre_archivo || doc.tipo_documento || 'Documento' });
  };

  const downloadExistingDocument = (doc: DocumentoAdjunto) => {
    const relUrl = buildDocumentoContenidoUrl(doc, true);
    if (!relUrl) {
      setError('No fue posible ubicar este documento para descarga desde la base de datos.');
      return;
    }
    downloadDocumentoIndividual(relUrl, doc.nombre_archivo || 'documento');
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

  const toggleDocumentoVerificado = async (doc: DocumentoAdjunto) => {
    if (!doc.id) return;
    try {
      const actualizado = await documentosService.verificar(doc.id, !doc.verificado);
      setExistingDocs((prev) => prev.map((item) => (item.id === actualizado.id ? actualizado : item)));
      toast.success(actualizado.verificado ? 'Documento verificado correctamente.' : 'Se retiró la verificación del documento.');
    } catch (requestError: unknown) {
      setError(buildApiErrorMessage(requestError, 'No fue posible actualizar la verificación del documento.'));
    }
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
      setRechazarError('Describe el motivo del rechazo (mínimo 10 caracteres).');
      return;
    }

    const docsPart = selectedExistingDocs.length
      ? `Documentos rechazados: ${selectedExistingDocs.map((doc) => `${doc.tipo_documento} - ${doc.nombre_archivo}`).join('; ')}. `
      : '';
    const finalMotivo = `${docsPart}Motivo: ${motivo}`;

    setRechazarLoading(true);
    try {
      await facturasService.rechazar(prefillFromPendiente.facturaId, finalMotivo);
      toast.success('Factura rechazada y enviada al proveedor para corrección.');
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
    if (!form.fechaFactura) return 'La fecha de emisión es obligatoria';
    if (!form.fechaRecepcion) return 'La fecha de recepción es obligatoria';
    if (!form.departamentoId) return 'Debe seleccionar un área solicitante';
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
    if (!form.observaciones.trim() || form.observaciones.trim().length < 10) {
      setError('La observación del proceso es obligatoria y debe tener mínimo 10 caracteres.');
      return;
    }
    if (!prefillFromPendiente?.facturaId && (!facturaItems || facturaItems.length === 0)) {
      setError('La factura debe incluir al menos un bien o servicio registrado por el proveedor.');
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
      items: facturaItems || [],
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

  return {
    location,
    navigate,
    prefillFromPendiente,
    showLegacyBlocks,
    isReviewMode,
    step,
    setStep,
    loading,
    setLoading,
    catalogLoading,
    setCatalogLoading,
    prefillLoading,
    setPrefillLoading,
    prefillApplied,
    setPrefillApplied,
    setPrefillWarning,
    error,
    setError,
    success,
    setSuccess,
    numeroFacturaSugerido,
    setNumeroFacturaSugerido,
    setSlaTotalDias,
    setSlaTodosHabiles,
    setSlaEtapas,
    proveedores,
    setProveedores,
    departamentos,
    setDepartamentos,
    docs,
    setDocs,
    existingDocs,
    setExistingDocs,
    setDiagInfo,
    selectedExistingDocIds,
    setSelectedExistingDocIds,
    rechazarOpen,
    setRechazarOpen,
    rechazarMotivo,
    setRechazarMotivo,
    rechazarError,
    setRechazarError,
    rechazarLoading,
    setRechazarLoading,
    previewDocument,
    setPreviewDocument,
    facturaItems,
    setFacturaItems,
    identificacionFactura,
    setIdentificacionFactura,
    form,
    setForm,
    selectedProveedor,
    setField,
    addDoc,
    openExistingDocument,
    downloadExistingDocument,
    openLocalDocument,
    downloadLocalDocument,
    removeDoc,
    getExistingDocKey,
    toggleExistingDocSelection,
    toggleDocumentoVerificado,
    selectedExistingDocs,
    hasSelectedDocsForReject,
    openRejectDialog,
    confirmReject,
    requiredDocTypes,
    existingDocTypes,
    uploadedDocTypes,
    requiredUploaded,
    uploadCompletion,
    flowCompletion,
    validateStep1,
    validateStep2,
    nextStep,
    prevStep,
    submit,
  };
}
