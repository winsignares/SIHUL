import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import type { TableFilterValues } from '../../../../components/ui/table-filters';
import type { SharedFacturaDetail } from '../../components/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../components/factura-details-helpers';
import { toast } from 'sonner';
import { facturasService } from '../../services';
import type { Factura as APIFactura } from '../../models/core.models';
import { ITEMS_POR_PAGINA, toList, isConfirmadaParaRegistro, parseFecha, mapFactura, type FacturaRegistroRow } from './registrarPagoAplicadoUtils';
import { useActualizacionEnVivo } from '../../../../hooks/useActualizacionEnVivo';

/** Estado y acciones de registrar el pago aplicado (tesorería). */
export function useRegistrarPagoAplicado() {
  const [filtros, setFiltros] = useState<TableFilterValues>({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
    orden: 'antiguos',
  });

  const [paginaActual, setPaginaActual] = useState(1);
  const [facturasRaw, setFacturasRaw] = useState<APIFactura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaRegistroRow | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogRegistrar, setMostrarDialogRegistrar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroTransaccion, setNumeroTransaccion] = useState('');
  const [fechaPago, setFechaPago] = useState(new Date().toISOString().split('T')[0]);
  const [archivoComprobante, setArchivoComprobante] = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState('');

  const loadFacturas = useCallback(async () => {
    const response = await facturasService.getAll({ limit: 300, ordering: '-fecha_modificacion' });
    return toList<APIFactura>(response).filter(isConfirmadaParaRegistro);
  }, []);

  // Alguien más cambió estos datos: se vuelve a leer sin mostrar el spinner.
  useActualizacionEnVivo(['facturas'], () => {
    void cargarFacturas({ silent: true });
  });

  const cargarFacturas = useCallback(async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    setLoadError(null);
    try {
      const rows = await loadFacturas();
      setFacturasRaw(rows);
    } catch {
      setFacturasRaw([]);
      setLoadError('No fue posible cargar pagos listos para registrar.');
    } finally {
      setLoading(false);
    }
  }, [loadFacturas]);

  useEffect(() => {
    void cargarFacturas();
  }, [cargarFacturas]);

  const facturasRegistro = useMemo(() => facturasRaw.map(mapFactura), [facturasRaw]);

  const facturasFiltradas = useMemo(() => {
    const filtradas = facturasRegistro.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.proveedor && factura.proveedor !== filtros.proveedor) return false;
      if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
      if (filtros.fechaInicio && factura.fechaAutorizacion < filtros.fechaInicio) return false;
      if (filtros.fechaFin && factura.fechaAutorizacion > filtros.fechaFin) return false;
      return true;
    });

    switch (filtros.orden) {
      case 'recientes':
        return filtradas.sort((a, b) => parseFecha(b.fechaAutorizacion) - parseFecha(a.fechaAutorizacion));
      case 'sla':
        return filtradas.sort((a, b) => (b.diasTranscurridos || 0) - (a.diasTranscurridos || 0));
      default:
        return filtradas.sort((a, b) => parseFecha(a.fechaAutorizacion) - parseFecha(b.fechaAutorizacion));
    }
  }, [facturasRegistro, filtros]);

  const totalPaginas = Math.max(1, Math.ceil(facturasFiltradas.length / ITEMS_POR_PAGINA));

  const facturasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return facturasFiltradas.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [facturasFiltradas, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros]);

  useEffect(() => {
    setPaginaActual((prev) => Math.min(prev, totalPaginas));
  }, [totalPaginas]);

  const proveedores = Array.from(new Set(facturasRegistro.map((factura) => factura.proveedor))).sort();
  const areas = Array.from(new Set(facturasRegistro.map((factura) => factura.areaSolicitante).filter(Boolean))).sort();

  const abrirDialogRegistrar = (factura: FacturaRegistroRow) => {
    setFacturaSeleccionada(factura);
    setNumeroTransaccion('');
    setFechaPago(new Date().toISOString().split('T')[0]);
    setArchivoComprobante(null);
    setObservaciones('');
    setMostrarDialogRegistrar(true);
  };

  const handleVerDetalle = (factura: FacturaRegistroRow) => {
    setFacturaDetalle(buildSharedFacturaDetail(factura.raw));
    setMostrarDialogDetalle(true);
  };

  const registrarPago = () => {
    if (!facturaSeleccionada) return;

    if (!numeroTransaccion.trim()) {
      toast.error('Debe ingresar el número de transacción bancaria.');
      return;
    }

    if (!archivoComprobante) {
      toast.error('Debe cargar el comprobante bancario.');
      return;
    }

    setIsProcessing(true);

    void (async () => {
      try {
        await facturasService.registrarPagoAplicado(facturaSeleccionada.facturaId, {
          numero_transaccion: numeroTransaccion.trim(),
          fecha_pago_aplicado: fechaPago,
          observaciones: observaciones.trim() || undefined,
          comprobante_bancario: archivoComprobante,
        });
        toast.success(`Pago aplicado registrado: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRegistrar(false);
        setFacturaSeleccionada(null);
        setNumeroTransaccion('');
        setObservaciones('');
        setArchivoComprobante(null);
        await cargarFacturas();
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'No fue posible registrar el pago aplicado.';
        toast.error(message);
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const onSelectComprobante = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    if (!file) {
      setArchivoComprobante(null);
      return;
    }

    const maxSizeBytes = 25 * 1024 * 1024;
    const allowedExtensions = ['pdf', 'xml', 'png', 'jpg', 'jpeg'];
    const extension = file.name.split('.').pop()?.toLowerCase() || '';

    if (!allowedExtensions.includes(extension)) {
      toast.error('Formato no permitido. Use PDF, XML, PNG o JPG.');
      event.target.value = '';
      setArchivoComprobante(null);
      return;
    }

    if (file.size > maxSizeBytes) {
      toast.error('El archivo supera el tamaño máximo permitido (25 MB).');
      event.target.value = '';
      setArchivoComprobante(null);
      return;
    }

    setArchivoComprobante(file);
  };


  return {
    filtros,
    setFiltros,
    paginaActual,
    setPaginaActual,
    facturasRaw,
    setFacturasRaw,
    loading,
    setLoading,
    loadError,
    setLoadError,
    isProcessing,
    setIsProcessing,
    facturaSeleccionada,
    setFacturaSeleccionada,
    facturaDetalle,
    setFacturaDetalle,
    mostrarDialogRegistrar,
    setMostrarDialogRegistrar,
    mostrarDialogDetalle,
    setMostrarDialogDetalle,
    numeroTransaccion,
    setNumeroTransaccion,
    fechaPago,
    setFechaPago,
    archivoComprobante,
    setArchivoComprobante,
    observaciones,
    setObservaciones,
    loadFacturas,
    cargarFacturas,
    facturasRegistro,
    facturasFiltradas,
    totalPaginas,
    facturasPaginadas,
    proveedores,
    areas,
    abrirDialogRegistrar,
    handleVerDetalle,
    registrarPago,
    onSelectComprobante,
  };
}
