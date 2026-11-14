import { useCallback, useEffect, useMemo, useState } from 'react';
import type { SharedFacturaDetail } from '../../components/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../components/factura-details-helpers';
import { facturasService } from '../../services';
import type { Factura as APIFactura } from '../../models/core.models';
import { ITEMS_POR_PAGINA, toList, isComprobanteFlow, parseFecha, mapFactura, type FacturaComprobanteRow } from './generarComprobanteEgresoUtils';
import { useActualizacionEnVivo } from '../../../../hooks/useActualizacionEnVivo';

/** Estado y acciones de generar el comprobante de egreso (tesorería). */
export function useGenerarComprobanteEgreso() {
  const [facturasRaw, setFacturasRaw] = useState<APIFactura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const [detalleFactura, setDetalleFactura] = useState<SharedFacturaDetail | null>(null);

  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    numeroRadicado: '',
    numeroProcesoPago: '',
    fechaInicio: '',
    fechaFin: '',
    orden: 'antiguos',
  });

  const filtrosActivos = [filtros.numeroFactura, filtros.numeroRadicado, filtros.numeroProcesoPago, filtros.fechaInicio, filtros.fechaFin].filter(Boolean).length;
  const FILTROS_INICIALES = { numeroFactura: '', numeroRadicado: '', numeroProcesoPago: '', fechaInicio: '', fechaFin: '', orden: 'antiguos' };

  const loadFacturas = useCallback(async () => {
    const response = await facturasService.getAll({ limit: 300, ordering: '-fecha_modificacion' });
    return toList<APIFactura>(response).filter((factura) => isComprobanteFlow(factura.estado));
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
      setLoadError('No fue posible cargar facturas pagadas.');
    } finally {
      setLoading(false);
    }
  }, [loadFacturas]);

  useEffect(() => {
    void cargarFacturas();
  }, [cargarFacturas]);

  const facturasComprobante = useMemo(() => facturasRaw.map(mapFactura), [facturasRaw]);

  const facturasFiltradas = useMemo(() => {
    const filtradas = facturasComprobante.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.numeroRadicado && !factura.numeroRadicado.toLowerCase().includes(filtros.numeroRadicado.toLowerCase())) return false;
      if (filtros.numeroProcesoPago && !factura.numeroProcesoPago.toLowerCase().includes(filtros.numeroProcesoPago.toLowerCase())) return false;
      if (filtros.fechaInicio && factura.fechaPagoAplicado < filtros.fechaInicio) return false;
      if (filtros.fechaFin && factura.fechaPagoAplicado > filtros.fechaFin) return false;
      return true;
    });

    switch (filtros.orden) {
      case 'recientes':
        return filtradas.sort((a, b) => parseFecha(b.fechaPagoAplicado) - parseFecha(a.fechaPagoAplicado));
      default:
        return filtradas.sort((a, b) => parseFecha(a.fechaPagoAplicado) - parseFecha(b.fechaPagoAplicado));
    }
  }, [facturasComprobante, filtros]);

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

  const handleVerDetalle = (factura: FacturaComprobanteRow) => {
    const base = buildSharedFacturaDetail(factura.raw);
    setDetalleFactura(base);
    // Cargar detalle completo con documentos en segundo plano
    void facturasService.getById(factura.facturaId).then((detalle) => {
      setDetalleFactura(buildSharedFacturaDetail(detalle));
    }).catch(() => {});
  };



  return {
    facturasRaw,
    setFacturasRaw,
    loading,
    setLoading,
    loadError,
    setLoadError,
    paginaActual,
    setPaginaActual,
    detalleFactura,
    setDetalleFactura,
    filtros,
    setFiltros,
    filtrosActivos,
    FILTROS_INICIALES,
    loadFacturas,
    cargarFacturas,
    facturasComprobante,
    facturasFiltradas,
    totalPaginas,
    facturasPaginadas,
    handleVerDetalle,
  };
}
