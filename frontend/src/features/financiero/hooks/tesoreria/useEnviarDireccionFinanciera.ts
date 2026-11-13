import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { SharedFacturaDetail } from '../../components/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../components/factura-details-helpers';
import { facturasService } from '../../services';
import type { Factura as APIFactura } from '../../models/core.models';
import { FILTROS_INICIALES, ITEMS_POR_PAGINA, ESTADOS_APROBADOS_AUDITORIA, toList, mapFactura, getErrorMessage, type Factura } from './enviarDireccionFinancieraUtils';

/** Estado y acciones de enviar facturas a dirección financiera (tesorería). */
export function useEnviarDireccionFinanciera() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogEnviar, setMostrarDialogEnviar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [facturasAprobadas, setFacturasAprobadas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ limit: 200 });
    return toList<APIFactura>(response)
      .filter((factura) => ESTADOS_APROBADOS_AUDITORIA.has(factura.estado))
      .map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setFacturasAprobadas(await loadFacturas());
      } catch {
        setFacturasAprobadas([]);
        setLoadError('No fue posible cargar facturas aprobadas para envio.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const filtrosActivos = [filtros.numeroFactura, filtros.numeroRadicado, filtros.numeroProcesoPago, filtros.fechaInicio, filtros.fechaFin].filter(Boolean).length;

  const facturasFiltradas = useMemo(() => {
    const fechaInicio = filtros.fechaInicio ? new Date(filtros.fechaInicio) : null;
    const fechaFin = filtros.fechaFin ? new Date(filtros.fechaFin) : null;

    return facturasAprobadas.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.numeroRadicado && !factura.numeroRadicado.toLowerCase().includes(filtros.numeroRadicado.toLowerCase())) return false;
      if (filtros.numeroProcesoPago && !factura.numeroProcesoPago.toLowerCase().includes(filtros.numeroProcesoPago.toLowerCase())) return false;

      const fechaFactura = factura.fechaAprobacionAuditoria ? new Date(factura.fechaAprobacionAuditoria) : null;
      if (fechaInicio && fechaFactura && fechaFactura < fechaInicio) return false;
      if (fechaFin && fechaFactura && fechaFactura > fechaFin) return false;
      return true;
    });
  }, [facturasAprobadas, filtros]);

  const facturasOrdenadas = useMemo(() => {
    const listado = [...facturasFiltradas];
    switch (filtros.orden) {
      case 'antiguos':
        return listado.sort((a, b) => new Date(a.fechaAprobacionAuditoria || 0).getTime() - new Date(b.fechaAprobacionAuditoria || 0).getTime());
      case 'sla':
        return listado.sort((a, b) => b.diasTranscurridos - a.diasTranscurridos);
      default:
        return listado.sort((a, b) => new Date(b.fechaAprobacionAuditoria || 0).getTime() - new Date(a.fechaAprobacionAuditoria || 0).getTime());
    }
  }, [facturasFiltradas, filtros.orden]);

  const totalPaginas = Math.max(1, Math.ceil(facturasOrdenadas.length / ITEMS_POR_PAGINA));

  const facturasPaginadas = useMemo(() => {
    const inicio = (paginaActual - 1) * ITEMS_POR_PAGINA;
    return facturasOrdenadas.slice(inicio, inicio + ITEMS_POR_PAGINA);
  }, [facturasOrdenadas, paginaActual]);

  useEffect(() => {
    setPaginaActual(1);
  }, [filtros]);

  useEffect(() => {
    setPaginaActual((prev) => Math.min(prev, totalPaginas));
  }, [totalPaginas]);

  const abrirDialogEnviar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMostrarDialogEnviar(true);
  };

  const abrirDialogRechazar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoRechazo('');
    setMostrarDialogRechazar(true);
  };

  const handleVerDetalle = async (factura: Factura) => {
    setMostrarDialogDetalle(true);
    try {
      const detail = await facturasService.getById(factura.facturaId);
      setFacturaDetalle(buildSharedFacturaDetail(detail));
    } catch {
      setFacturaDetalle({
        facturaId: factura.facturaId,
        numeroFactura: factura.numeroFactura,
        numeroRadicado: factura.numeroRadicado,
        proveedor: factura.proveedor,
        nit: factura.nit,
        valorTotal: factura.valorTotal,
        areaSolicitante: factura.areaSolicitante,
        estado: factura.estado,
        diasTranscurridos: factura.diasTranscurridos,
        fechaRecepcion: factura.fechaAprobacionAuditoria,
        observaciones: factura.observacionesAuditoria,
        numeroProcesoPago: factura.numeroProcesoPago,
        nivelRiesgo: factura.diasTranscurridos > 17 ? 'rojo' : factura.diasTranscurridos > 10 ? 'amarillo' : 'verde',
      });
    }
  };

  const enviarDireccionFinanciera = () => {
    if (!facturaSeleccionada) return;
    if (observaciones.trim().length < 5) {
      toast.error('Las observaciones son obligatorias (minimo 5 caracteres).');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        await facturasService.enviarDireccionFinanciera(facturaSeleccionada.facturaId, observaciones.trim() || undefined);
        setFacturasAprobadas(await loadFacturas());
        toast.success(`Factura enviada a Direccion Financiera: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogEnviar(false);
        setFacturaSeleccionada(null);
        setObservaciones('');
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible enviar la factura a Direccion Financiera.'));
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const rechazarEnvio = () => {
    if (!facturaSeleccionada) return;
    if (motivoRechazo.trim().length < 10) {
      toast.error('Debes detallar el motivo (minimo 10 caracteres).');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        await facturasService.detenerEnTesoreria(facturaSeleccionada.facturaId, motivoRechazo.trim());
        setFacturasAprobadas(await loadFacturas());
        toast.warning(`Factura detenida antes de enviar: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRechazar(false);
        setFacturaSeleccionada(null);
        setMotivoRechazo('');
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible detener el envio.'));
      } finally {
        setIsProcessing(false);
      }
    })();
  };


  return {
    filtros,
    setFiltros,
    facturaSeleccionada,
    setFacturaSeleccionada,
    facturaDetalle,
    setFacturaDetalle,
    mostrarDialogEnviar,
    setMostrarDialogEnviar,
    mostrarDialogDetalle,
    setMostrarDialogDetalle,
    mostrarDialogRechazar,
    setMostrarDialogRechazar,
    observaciones,
    setObservaciones,
    motivoRechazo,
    setMotivoRechazo,
    isProcessing,
    setIsProcessing,
    facturasAprobadas,
    setFacturasAprobadas,
    loading,
    setLoading,
    loadError,
    setLoadError,
    paginaActual,
    setPaginaActual,
    loadFacturas,
    filtrosActivos,
    facturasFiltradas,
    facturasOrdenadas,
    totalPaginas,
    facturasPaginadas,
    abrirDialogEnviar,
    abrirDialogRechazar,
    handleVerDetalle,
    enviarDireccionFinanciera,
    rechazarEnvio,
  };
}
