import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../../share/factura-detail-modal';

export interface FacturaRevision extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaEnvio: string;
  cuentaContable: string;
}

export function useRevisarPagos() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaRevision | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [decisionAbierta, setDecisionAbierta] = useState(false);
  const [decisionTipo, setDecisionTipo] = useState<'aprobar' | 'devolver'>('aprobar');
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

  const facturaToRevision = (factura: Factura, docs: DocumentoAdjunto[]): FacturaRevision => {
    const base = buildSharedFacturaDetail(factura);
    return {
      ...base,
      id: String(factura.id),
      nit: factura.proveedor?.nit ?? '',
      fechaEnvio: factura.fecha_aprobacion_auditoria ?? factura.fecha_recepcion ?? '',
      cuentaContable: factura.cuenta_contable ? `${factura.cuenta_contable.codigo} - ${factura.cuenta_contable.nombre}` : '',
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
      // Facturas aprobadas por auditoria (enviadas por tesoreria a direccion financiera)
      const lista = await facturasService.getByEstado('Aprobada Auditoría');
      
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
      .map((f) => facturaToRevision(f, docsMap[f.id] ?? []))
      .filter((factura) => {
        if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
        if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
        if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
        if (filtros.fechaInicio && factura.fechaEnvio < filtros.fechaInicio) return false;
        if (filtros.fechaFin && factura.fechaEnvio > filtros.fechaFin) return false;
        if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
        if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
        return true;
      });
  }, [facturas, docsMap, filtros]);

  const abrirDetalle = (factura: FacturaRevision) => {
    setFacturaSeleccionada(factura);
    setDetalleAbierto(true);
  };

  const abrirDecision = (factura: FacturaRevision, tipo: 'aprobar' | 'devolver') => {
    setFacturaSeleccionada(factura);
    setDecisionTipo(tipo);
    setObservaciones('');
    setDecisionAbierta(true);
  };

  const cerrarDecision = () => {
    setDecisionAbierta(false);
    setFacturaSeleccionada(null);
    setObservaciones('');
  };

  const aprobarFactura = async () => {
    if (!facturaSeleccionada?.facturaId) return;
    
    setProcesando(true);
    try {
      // Cambiar estado a "Revisada Dir. Financiera" (revisada y cargada)
      await facturasService.update(facturaSeleccionada.facturaId, {
        estado: 'Revisada Dir. Financiera',
        observaciones: observaciones || undefined,
      });
      showToast('ok', `Factura ${facturaSeleccionada.numeroFactura} revisada y cargada exitosamente.`);
      cerrarDecision();
      cargarFacturas();
    } catch {
      showToast('err', 'Error al aprobar la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const devolverFactura = async () => {
    if (!facturaSeleccionada?.facturaId) return;
    
    if (!observaciones.trim() || observaciones.trim().length < 10) {
      showToast('err', 'El motivo de devolución es requerido (mínimo 10 caracteres).');
      return;
    }

    setProcesando(true);
    try {
      // Devolver a tesorería
      await facturasService.update(facturaSeleccionada.facturaId, {
        estado: 'Devuelta',
        observaciones: observaciones.trim(),
      });
      showToast('ok', `Factura ${facturaSeleccionada.numeroFactura} devuelta a Tesoreria.`);
      cerrarDecision();
      cargarFacturas();
    } catch {
      showToast('err', 'Error al devolver la factura. Intente de nuevo.');
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
    decisionAbierta,
    decisionTipo,
    observaciones,
    filtros,
    toast,
    setFiltros,
    setObservaciones,
    setDetalleAbierto,
    setDecisionAbierta,
    abrirDetalle,
    abrirDecision,
    cerrarDecision,
    aprobarFactura,
    devolverFactura,
    cargarFacturas,
  };
}
