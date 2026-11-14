import { useEffect, useMemo, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { apiClient } from '../../../../core/apiClient';
import { departamentosService, documentosService, facturasService, proveedoresService } from '../../services';
import { API_BASE } from '../../services/core/shared';
import type { Departamento, Factura, Proveedor } from '../../models/core.models';
import type { EnviarFacturaProps, UploadedDoc } from '../../models/proveedor';
import { type BancoOption, type TipoCuentaOption, type FormState, type ServiceItem, createEmptyServiceItem, calculateServiceItem, DOC_TYPES, DOC_TYPE_DETAILS, BANCOS_COLOMBIA, TIPO_CUENTA_OPTS, type ApiListResponse, extractResults, getToday, validateDocFile } from '../../components/enviarFactura/auxiliares';
import { useActualizacionEnVivo } from '../../../../hooks/useActualizacionEnVivo';

/** Estado y reglas de EnviarFactura (la página solo dibuja). */
export function useEnviarFactura({ miProveedor, onSuccess }: EnviarFacturaProps) {
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
    identificacionFactura: '',
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

    setProveedorSeleccionado(correccionFactura.proveedor || miProveedor || null);
    setForm(prev => ({
      ...prev,
      tipoDocumento: correccionFactura.tipo_documento || prev.tipoDocumento,
      identificacionFactura: correccionFactura.identificacion_factura || prev.identificacionFactura,
      departamentoId: correccionFactura.departamento?.id || prev.departamentoId,
      fechaFactura: correccionFactura.fecha_factura || prev.fechaFactura,
      fechaRecepcion: getToday(),
      cuentaBancaria: correccionFactura.cuenta_bancaria_proveedor || prev.cuentaBancaria,
    }));

    // Los bienes y servicios siempre se leen desde los ítems estructurados.
    const existingItems = correccionFactura.items;
    if (existingItems && existingItems.length > 0) {
      setServiceItems(existingItems.map((item, i) => ({
        id: `correccion-${correccionFactura.id}-${i}`,
        cantidad: Number(item.cantidad),
        servicio: item.descripcion,
        valorUnitario: Number(item.valor_unitario),
        ivaPorcentaje: Number(item.porcentaje_iva),
      })));
    } else {
      setServiceItems([createEmptyServiceItem()]);
    }
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

  useEffect(() => {
    setForm(prev => {
      if (
        prev.valorSubtotal === invoiceTotals.subtotal &&
        prev.valorIva === invoiceTotals.iva &&
        prev.valorTotal === invoiceTotals.total
      ) {
        return prev;
      }

      return {
        ...prev,
        valorSubtotal: invoiceTotals.subtotal,
        valorIva: invoiceTotals.iva,
        valorTotal: invoiceTotals.total,
      };
    });
  }, [invoiceTotals]);

  const documentTypes = useMemo(() => {
    const existingTypes = docs.map((doc) => doc.type).filter(Boolean);
    return Array.from(new Set([...DOC_TYPES, ...existingTypes]));
  }, [docs]);

  const fetchCatalog = useMemo(() => async <T,>(endpoint: string): Promise<T[]> => {
    const payload = await apiClient.get<T[] | ApiListResponse<T>>(endpoint, { requiresAuth: false });
    return extractResults<T>(payload);
  }, []);

  const loadCatalogos = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setCatalogLoading(true);
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
  }, [fetchCatalog]);

  useEffect(() => {
    void loadCatalogos();
  }, [loadCatalogos]);

  // Alguien más cambió los catálogos financieros: se vuelven a leer sin tocar el formulario.
  useActualizacionEnVivo(['catalogos-financieros'], () => {
    void loadCatalogos({ silent: true });
  });

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
        form.identificacionFactura.trim().length > 2 &&
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

      // Construir items estructurados para el nuevo modelo
      const itemsPayload = serviceItemsCalculated
        .filter(item => item.servicio.trim() && item.cantidad > 0 && item.valorUnitario > 0)
        .map((item, index) => ({
          descripcion: item.servicio.trim(),
          cantidad: item.cantidad,
          valor_unitario: item.valorUnitario,
          porcentaje_iva: item.ivaPorcentaje,
          valor_subtotal: item.subtotal,
          valor_iva: item.valorIva,
          valor_total: item.total,
          orden: index + 1,
        }));

      const payload = {
        proveedor_id: proveedorSeleccionado.id,
        departamento_id: form.departamentoId,
        tipo_documento: form.tipoDocumento as 'Factura' | 'Factura Electrónica' | 'Cuenta de Cobro' | 'Nota Débito' | 'Otro',
        identificacion_factura: form.identificacionFactura || undefined,
        items: itemsPayload,
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
          observaciones_correccion: form.identificacionFactura || undefined,
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
          identificacionFactura: '',
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

  return {
    location,
    navigate,
    correccionFactura,
    isCorreccion,
    step,
    setStep,
    loading,
    setLoading,
    catalogLoading,
    setCatalogLoading,
    error,
    setError,
    success,
    setSuccess,
    nitBusqueda,
    setNitBusqueda,
    proveedorSeleccionado,
    setProveedorSeleccionado,
    buscandoProveedor,
    setBuscandoProveedor,
    errBusqueda,
    setErrBusqueda,
    departamentos,
    setDepartamentos,
    docs,
    setDocs,
    numeroFacturaSugerido,
    setNumeroFacturaSugerido,
    deleteDialogOpen,
    setDeleteDialogOpen,
    docToDelete,
    setDocToDelete,
    deletingDoc,
    setDeletingDoc,
    bancos,
    setBancos,
    tiposCuenta,
    setTiposCuenta,
    serviceItems,
    setServiceItems,
    form,
    setForm,
    serviceItemsCalculated,
    invoiceTotals,
    documentTypes,
    fetchCatalog,
    handleBuscarProveedor,
    handleFieldChange,
    handleServiceItemChange,
    handleAddServiceItem,
    handleRemoveServiceItem,
    handleBancoChange,
    handleAddDoc,
    handleRemoveDoc,
    requestRemoveDoc,
    confirmRemoveDoc,
    bancosOptions,
    tiposCuentaOptions,
    missingDocTypes,
    documentosPendientes,
    allDocumentsUploaded,
    hasInvalidServiceItems,
    hasValidServiceItems,
    canGoNext,
    handleSubmit,
  };
}
