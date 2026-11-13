import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { SharedFacturaDetail } from '../../components/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../components/factura-details-helpers';
import { facturasService } from '../../services';
import type { Factura as APIFactura } from '../../models/core.models';
import { FILTROS_INICIALES, ITEMS_POR_PAGINA, toList, mapFactura, getErrorMessage, type Factura } from './controlPrevioUtils';

/** Estado y acciones del control previo de facturas (auditoría). */
export function useControlPrevio() {
  const auditoriaChecklist = [
    { id: 'causacion', label: 'Causación contable validada' },
    { id: 'soportes', label: 'Soportes completos y legibles' },
    { id: 'rubro', label: 'Distribucion correcta en rubro' },
    { id: 'proceso', label: 'Proceso de pago verificado' },
  ];

  const opcionesRechazo = [
    { id: 'docs', label: 'Soportes incompletos' },
    { id: 'causacion', label: 'Inconsistencia en causación contable' },
    { id: 'rubro', label: 'Distribucion incorrecta en rubro' },
    { id: 'banco', label: 'Soporte de pago incompleto' },
    { id: 'otros', label: 'Otro hallazgo' },
  ];

  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [facturasAlistadas, setFacturasAlistadas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [mostrarDialogAprobar, setMostrarDialogAprobar] = useState(false);
  const [mostrarDialogRechazar, setMostrarDialogRechazar] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(() => (
    auditoriaChecklist.reduce((acc, item) => ({ ...acc, [item.id]: false }), {})
  ));
  const [rechazoSeleccion, setRechazoSeleccion] = useState<string[]>([]);


  const loadFacturas = async () => {
    const response = await facturasService.getAll({ estado: 'Alistada', ordering: '-fecha_alistamiento', limit: 200 });
    return toList<APIFactura>(response).map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        setFacturasAlistadas(await loadFacturas());
      } catch {
        setFacturasAlistadas([]);
        setLoadError('No fue posible cargar las facturas alistadas.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const facturasFiltradas = useMemo(() => facturasAlistadas.filter((factura) => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
    if (filtros.numeroRadicado && !(factura.numeroRadicado?.toLowerCase().includes(filtros.numeroRadicado.toLowerCase()) ?? false)) return false;
    if (filtros.numeroProcesoPago && !(factura.numeroProcesoPago?.toLowerCase().includes(filtros.numeroProcesoPago.toLowerCase()) ?? false)) return false;
    if (filtros.fechaInicio && new Date(factura.fechaAlistamiento) < new Date(filtros.fechaInicio)) return false;
    if (filtros.fechaFin && new Date(factura.fechaAlistamiento) > new Date(filtros.fechaFin)) return false;
    return true;
  }), [facturasAlistadas, filtros]);

  const facturasOrdenadas = useMemo(() => {
    const listado = [...facturasFiltradas];
    if (filtros.orden === 'antiguos') {
      return listado.sort((a, b) => a.facturaId - b.facturaId);
    }
    return listado.sort((a, b) => b.facturaId - a.facturaId);
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

  const verDetalle = async (factura: Factura) => {
    setMostrarDialogDetalle(true);
    try {
      const detail = await facturasService.getById(factura.facturaId);
      const baseDetail = buildSharedFacturaDetail(detail);
      setFacturaDetalle({
        ...baseDetail,
        auditoriaView: true,
        auditoriaNotas: 'Validar causación contable, soportes completos y distribución correcta antes de emitir concepto.',
      });
    } catch {
      setFacturaDetalle({
        facturaId: factura.facturaId,
        numeroFactura: factura.numeroFactura,
        numeroRadicado: factura.numeroRadicado,
        numeroProcesoPago: factura.numeroProcesoPago,
        proveedor: factura.proveedor,
        nit: factura.nit,
        valorTotal: factura.valorTotal,
        areaSolicitante: factura.areaSolicitante,
        estado: factura.estado,
        diasTranscurridos: factura.diasTranscurridos,
        fechaRecepcion: factura.fechaAlistamiento,
        auditoriaView: true,
        auditoriaNotas: 'Validar causación contable, soportes completos y distribución correcta antes de emitir concepto.',
        nivelRiesgo: factura.diasTranscurridos >= 18 ? 'rojo' : factura.diasTranscurridos >= 12 ? 'amarillo' : 'verde',
      });
    }
  };

  const abrirDialogAprobar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setChecklistState(auditoriaChecklist.reduce((acc, item) => ({ ...acc, [item.id]: false }), {}));
    setMostrarDialogAprobar(true);
  };

  const abrirDialogRechazar = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoRechazo('');
    setRechazoSeleccion([]);
    setMostrarDialogRechazar(true);
  };

  const checklistCompleto = auditoriaChecklist.every((item) => checklistState[item.id]);

  const buildRechazoMotivo = (seleccion: string[]) => {
    if (seleccion.length === 0) return '';
    const labels = opcionesRechazo.filter((opt) => seleccion.includes(opt.id)).map((opt) => opt.label);
    return `Hallazgos: ${labels.join('; ')}.`;
  };

  const confirmarAprobacion = () => {
    if (!facturaSeleccionada) return;
    if (!observaciones.trim() || observaciones.trim().length < 10) {
      toast.error('Las observaciones son obligatorias y deben tener mínimo 10 caracteres');
      return;
    }

    setProcesando(true);
    void (async () => {
      try {
        await facturasService.aprobarAuditoria(facturaSeleccionada.facturaId, observaciones.trim());
        setFacturasAlistadas(await loadFacturas());
        toast.success(`Factura aprobada por auditoría: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogAprobar(false);
        setFacturaSeleccionada(null);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible aprobar la factura.'));
      } finally {
        setProcesando(false);
      }
    })();
  };

  const confirmarRechazo = () => {
    if (!facturaSeleccionada) return;
    if (!motivoRechazo.trim() || motivoRechazo.trim().length < 10) {
      toast.error('El motivo de rechazo es obligatorio y debe tener mínimo 10 caracteres');
      return;
    }

    setProcesando(true);
    void (async () => {
      try {
        await facturasService.rechazarAuditoria(facturaSeleccionada.facturaId, motivoRechazo.trim());
        setFacturasAlistadas(await loadFacturas());
        toast.warning(`Factura rechazada por auditoría: ${facturaSeleccionada.numeroFactura}`);
        setMostrarDialogRechazar(false);
        setFacturaSeleccionada(null);
      } catch (error: unknown) {
        toast.error(getErrorMessage(error, 'No fue posible rechazar la factura.'));
      } finally {
        setProcesando(false);
      }
    })();
  };


  return {
    auditoriaChecklist,
    opcionesRechazo,
    filtros,
    setFiltros,
    facturasAlistadas,
    setFacturasAlistadas,
    loading,
    setLoading,
    loadError,
    setLoadError,
    paginaActual,
    setPaginaActual,
    facturaSeleccionada,
    setFacturaSeleccionada,
    facturaDetalle,
    setFacturaDetalle,
    mostrarDialogDetalle,
    setMostrarDialogDetalle,
    mostrarDialogAprobar,
    setMostrarDialogAprobar,
    mostrarDialogRechazar,
    setMostrarDialogRechazar,
    observaciones,
    setObservaciones,
    motivoRechazo,
    setMotivoRechazo,
    procesando,
    setProcesando,
    checklistState,
    setChecklistState,
    rechazoSeleccion,
    setRechazoSeleccion,
    loadFacturas,
    facturasFiltradas,
    facturasOrdenadas,
    totalPaginas,
    facturasPaginadas,
    verDetalle,
    abrirDialogAprobar,
    abrirDialogRechazar,
    checklistCompleto,
    buildRechazoMotivo,
    confirmarAprobacion,
    confirmarRechazo,
  };
}
