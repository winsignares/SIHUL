import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../../share/factura-detail-modal';

export interface FacturaConfirmacion extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaAutorizacion: string;
  numeroConfirmacion?: string;
}

export function useConfirmacionPagos() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaConfirmacion | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);
  const [numeroConfirmacion, setNumeroConfirmacion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  });

  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const showToast = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const facturaToConfirmacion = (factura: Factura, docs: DocumentoAdjunto[]): FacturaConfirmacion => {
    const base = buildSharedFacturaDetail(factura);
    return {
      ...base,
      id: String(factura.id),
      nit: factura.proveedor?.nit ?? '',
      fechaAutorizacion: factura.fecha_autorizacion ?? factura.fecha_recepcion ?? '',
      numeroConfirmacion: factura.numero_confirmacion ?? undefined,
      documentos: docs.map((d) => ({
        id: String(d.id),
        nombre: d.nombre_archivo,
        tipo: d.tipo_documento,
        verificado: d.verificado,
        url: d.archivo_url ?? d.url_storage ?? undefined,
      })),
    };
  };

  const cargarFacturas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      // Facturas autorizadas por rectoría, pendientes de confirmación de proceso
      const lista = await facturasService.getByEstado('Autorizada');
      
      setFacturas(lista);
      
      const docsResults = await Promise.all(
        lista.map((f) =>
          documentosService
            .getByFactura(f.id)
            .then((d) => ({ id: f.id, docs: d }))
            .catch(() => ({ id: f.id, docs: [] as DocumentoAdjunto[] }))
        )
      );
      const map: Record<number, DocumentoAdjunto[]> = {};
      docsResults.forEach(({ id, docs }) => {
        map[id] = docs;
      });
      setDocsMap(map);
    } catch {
      setError('No se pudo cargar las facturas. Verifique la conexión.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  const facturasFiltradas = useMemo(() => {
    return facturas
      .filter((f) => f.etapa_actual !== 'Control de Pago Bancario')
      .map((f) => facturaToConfirmacion(f, docsMap[f.id] ?? []))
      .filter((factura) => {
        if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
        if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
        if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
        if (filtros.fechaInicio && factura.fechaAutorizacion < filtros.fechaInicio) return false;
        if (filtros.fechaFin && factura.fechaAutorizacion > filtros.fechaFin) return false;
        if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
        if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
        return true;
      });
  }, [facturas, docsMap, filtros]);

  const abrirDetalle = (factura: FacturaConfirmacion) => {
    setFacturaSeleccionada(factura);
    setDetalleAbierto(true);
  };

  const abrirConfirmar = (factura: FacturaConfirmacion) => {
    setFacturaSeleccionada(factura);
    setNumeroConfirmacion('Generando...');
    setObservaciones('');
    setConfirmarAbierto(true);

    if (!factura.facturaId) return;

    void (async () => {
      try {
        const actualizada = await facturasService.generarNumeroConfirmacion(factura.facturaId);
        const numero = actualizada.numero_confirmacion || 'CONF no disponible';
        setNumeroConfirmacion(numero);
        setFacturaSeleccionada((prev) => (prev ? { ...prev, numeroConfirmacion: actualizada.numero_confirmacion || prev.numeroConfirmacion } : prev));
      } catch {
        setNumeroConfirmacion('No fue posible generar el consecutivo');
        showToast('err', 'Error al generar el numero de confirmacion.');
      }
    })();
  };

  const cerrarConfirmar = () => {
    setConfirmarAbierto(false);
    setFacturaSeleccionada(null);
    setNumeroConfirmacion('');
    setObservaciones('');
  };

  const confirmarPago = async () => {
    if (!facturaSeleccionada?.facturaId) return;

    setProcesando(true);
    try {
      const facturaActualizada = await facturasService.confirmarControlPago(
        facturaSeleccionada.facturaId,
        observaciones || undefined
      );
      setNumeroConfirmacion(facturaActualizada.numero_confirmacion || 'CONF no disponible');
      showToast('ok', `Control de pago confirmado para ${facturaSeleccionada.numeroFactura}.`);
      cerrarConfirmar();
      cargarFacturas();
    } catch {
      showToast('err', 'Error al confirmar el pago. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  return {
    facturas,
    facturasFiltradas,
    docsMap,
    cargando,
    error,
    procesando,
    facturaSeleccionada,
    detalleAbierto,
    confirmarAbierto,
    numeroConfirmacion,
    observaciones,
    filtros,
    toast,
    setFiltros,
    setNumeroConfirmacion,
    setObservaciones,
    setDetalleAbierto,
    setConfirmarAbierto,
    abrirDetalle,
    abrirConfirmar,
    cerrarConfirmar,
    confirmarPago,
    cargarFacturas,
  };
}
