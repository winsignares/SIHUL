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

const ORDER_OPTIONS = ['recientes', 'antiguos', 'monto'];
const ESTADOS_CONFIRMACION = new Set([
  'Autorizada',
  'Autorizada para pago',
]);

const normalizeEstado = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

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
    orden: 'recientes',
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
      fechaAutorizacion: factura.fecha_autorizacion ?? factura.fecha_modificacion ?? factura.fecha_recepcion ?? '',
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
      const response = await facturasService.getAll({ limit: 300, ordering: '-fecha_modificacion' });
      const lista = toList<Factura>(response)
        .filter((factura) => {
          const estadoNormalizado = normalizeEstado(factura.estado);
          return (
            ESTADOS_CONFIRMACION.has(factura.estado) ||
            estadoNormalizado === 'autorizada' ||
            estadoNormalizado === 'autorizada para pago'
          );
        })
        .filter((factura) => !factura.numero_confirmacion && !factura.numero_transaccion);
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
      setError('No se pudo cargar los pagos aplicados. Verifique la conexion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarFacturas();
  }, [cargarFacturas]);

  const facturasConfirmacion = useMemo(() => {
    return facturas
      .map((factura) => facturaToConfirmacion(factura, docsMap[factura.id] ?? []));
  }, [facturas, docsMap]);

  const parseFecha = (value?: string) => (value ? new Date(value).getTime() : 0);

  const facturasFiltradas = useMemo(() => {
    const filtradas = facturasConfirmacion.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
      if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
      if (filtros.fechaInicio && factura.fechaAutorizacion < filtros.fechaInicio) return false;
      if (filtros.fechaFin && factura.fechaAutorizacion > filtros.fechaFin) return false;
      if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
      if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
      return true;
    });

    switch (ORDER_OPTIONS.includes(filtros.orden) ? filtros.orden : 'recientes') {
      case 'antiguos':
        return filtradas.sort((a, b) => parseFecha(a.fechaAutorizacion) - parseFecha(b.fechaAutorizacion));
      case 'monto':
        return filtradas.sort((a, b) => b.valorTotal - a.valorTotal);
      default:
        return filtradas.sort((a, b) => parseFecha(b.fechaAutorizacion) - parseFecha(a.fechaAutorizacion));
    }
  }, [facturasConfirmacion, filtros]);

  const resumen = useMemo(() => {
    const total = facturasFiltradas.length;
    const valorTotal = facturasFiltradas.reduce((acc, factura) => acc + factura.valorTotal, 0);
    const urgentes = facturasFiltradas.filter((factura) => (factura.diasTranscurridos || 0) >= 2).length;
    const conConfirmacion = facturasFiltradas.filter((factura) => Boolean(factura.numeroConfirmacion)).length;
    return {
      total,
      valorTotal,
      urgentes,
      conConfirmacion,
    };
  }, [facturasFiltradas]);

  const abrirDetalle = (factura: FacturaConfirmacion) => {
    setFacturaSeleccionada(factura);
    setDetalleAbierto(true);
  };

  const abrirConfirmar = (factura: FacturaConfirmacion) => {
    setFacturaSeleccionada(factura);
    setNumeroConfirmacion(factura.numeroConfirmacion || 'Generando...');
    setObservaciones('');
    setConfirmarAbierto(true);

    const facturaId = factura.facturaId;
    if (!facturaId || factura.numeroConfirmacion) return;

    void (async () => {
      try {
        const actualizada = await facturasService.generarNumeroConfirmacion(facturaId);
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
      void cargarFacturas();
    } catch {
      showToast('err', 'Error al confirmar el pago. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  return {
    facturas,
    facturasConfirmacion,
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
    resumen,
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
