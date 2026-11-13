import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { SharedFacturaDetail } from '../../components/factura-detail-modal';
import { facturasService, documentosService } from '../../services';
import type { Factura as APIFactura } from '../../models/core.models';
import { buildSharedFacturaDetail } from '../../components/factura-details-helpers';
import { FILTROS_INICIALES, ITEMS_POR_PAGINA, toList, mapFactura, getErrorMessage, type Factura } from './alistarPagosUtils';

/** Estado y acciones de alistar pagos (tesorería). */
export function useAlistarPagos() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogAlistar, setMostrarDialogAlistar] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [numeroProcesoPago, setNumeroProcesoPago] = useState('');
  const [archivoSeven, setArchivoSeven] = useState<File | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [facturasTesoreria, setFacturasTesoreria] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);

  const loadFacturas = async () => {
    const response = await facturasService.getAll({ limit: 200 });
    return toList<APIFactura>(response)
      .filter((f) => f.estado === 'Radicada' || f.estado === 'Causada' || f.estado === 'Detenida')
      .map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setFacturasTesoreria(await loadFacturas());
      } catch {
        setFacturasTesoreria([]);
        setLoadError('No fue posible cargar facturas para alistamiento.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const facturasFiltradas = useMemo(() => facturasTesoreria.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.numeroRadicado && !(factura.numeroRadicado?.toLowerCase().includes(filtros.numeroRadicado.toLowerCase()) ?? false)) return false;
    return true;
  }), [facturasTesoreria, filtros]);

  const facturasOrdenadas = useMemo(() => {
    const listado = [...facturasFiltradas];
    const parseFechaSort = (v?: string) => (v ? new Date(v).getTime() : 0);
    if (filtros.orden === 'antiguos') {
      return listado.sort((a, b) => parseFechaSort(a.fechaCausacion) - parseFechaSort(b.fechaCausacion));
    }
    return listado.sort((a, b) => parseFechaSort(b.fechaCausacion) - parseFechaSort(a.fechaCausacion));
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

  const abrirDialogAlistar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setNumeroProcesoPago(factura.numeroProcesoPago || '');
    setArchivoSeven(null);
    setObservaciones('');
    setMostrarDialogAlistar(true);
  };

  const abrirDialogRechazar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoRechazo('');
    setMostrarDialogRechazar(true);
  };

  const abrirDialogDetalle = (factura: Factura) => {
    setFacturaDetalle({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      proveedor: factura.proveedor,
      nit: factura.nit,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaCausacion,
      nivelRiesgo: factura.diasTranscurridos > 17 ? 'rojo' : factura.diasTranscurridos > 10 ? 'amarillo' : 'verde',
    });
    setMostrarDialogDetalle(true);
    void facturasService.getById(factura.facturaId).then((detalle) => {
      setFacturaDetalle(buildSharedFacturaDetail(detalle));
    }).catch(() => {});
  };

  const alistarPago = () => {
    if (!facturaSeleccionada) return;
    if (!numeroProcesoPago.trim()) {
      toast.error('Debe registrar el numero de proceso de pago generado en SEVEN');
      return;
    }
    if (!archivoSeven) {
      toast.error('Debe cargar el archivo generado en SEVEN');
      return;
    }
    if (archivoSeven.size === 0) {
      toast.error('El archivo seleccionado está vacío. Verifique que el archivo TXT tenga contenido antes de cargarlo.');
      return;
    }
    if (observaciones.trim().length < 5) {
      toast.error('Debe registrar una observacion del proceso');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        // El backend convierte este TXT a PDF antes de guardarlo y de incluirlo
        // en los documentos unificados de la factura.
        await documentosService.upload(facturaSeleccionada.facturaId, archivoSeven, 'Archivo Plano Bancario');
        const nombreArchivoPdf = archivoSeven.name.replace(/\.[^.]+$/, '') + '.pdf';
        await facturasService.alistar(facturaSeleccionada.facturaId, {
          numero_proceso_pago: numeroProcesoPago.trim(),
          archivo_plano_generado: nombreArchivoPdf,
          observaciones: observaciones.trim(),
        });

        setFacturasTesoreria(await loadFacturas());
        toast.success(`Pago alistado: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogAlistar(false);
        setFacturaSeleccionada(null);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible completar el alistamiento.'));
      } finally {
        setIsProcessing(false);
      }
    })();
  };

  const rechazarAlistamiento = () => {
    if (!facturaSeleccionada || motivoRechazo.trim().length < 10) {
      toast.error('Debe indicar una observacion minima de 10 caracteres');
      return;
    }

    setIsProcessing(true);
    void (async () => {
      try {
        await facturasService.detenerEnTesoreria(facturaSeleccionada.facturaId, motivoRechazo.trim());
        setFacturasTesoreria(await loadFacturas());
        toast.warning(`Factura rechazada en Tesorería: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRechazar(false);
        setFacturaSeleccionada(null);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible rechazar el alistamiento.'));
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
    mostrarDialogAlistar,
    setMostrarDialogAlistar,
    mostrarDialogRechazar,
    setMostrarDialogRechazar,
    mostrarDialogDetalle,
    setMostrarDialogDetalle,
    numeroProcesoPago,
    setNumeroProcesoPago,
    archivoSeven,
    setArchivoSeven,
    observaciones,
    setObservaciones,
    motivoRechazo,
    setMotivoRechazo,
    isProcessing,
    setIsProcessing,
    facturasTesoreria,
    setFacturasTesoreria,
    loading,
    setLoading,
    loadError,
    setLoadError,
    paginaActual,
    setPaginaActual,
    loadFacturas,
    facturasFiltradas,
    facturasOrdenadas,
    totalPaginas,
    facturasPaginadas,
    abrirDialogAlistar,
    abrirDialogRechazar,
    abrirDialogDetalle,
    alistarPago,
    rechazarAlistamiento,
  };
}
