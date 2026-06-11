import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { type SharedFacturaDetail } from '../../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../../share/factura-details-helpers';

export interface FacturaRevision extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaEnvio: string;
  cuentaContable: string;
  puedeCargarYEnviar: boolean;
  yaEnviadaRectoria: boolean;
}

const ESTADOS_VISIBLES_DIRECCION_FINANCIERA = new Set([
  'Revisada Dir. Financiera',
  'Rechazada por Rectoría',
]);

const ESTADOS_GESTIONABLES = new Set([
  'Revisada Dir. Financiera',
  'Rechazada por Rectoría',
]);

const ESTADOS_ENVIADA_RECTORIA = new Set([
  'Enviada Rectoría',
]);

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

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
    numeroRadicado: '',
    numeroProcesoPago: '',
    orden: 'recientes',
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
      slaObjetivoDias: base.slaObjetivoDias ?? 2,
      id: String(factura.id),
      nit: factura.proveedor?.nit ?? '',
      fechaEnvio: factura.fecha_aprobacion_auditoria ?? factura.fecha_recepcion ?? factura.fecha_modificacion ?? '',
      cuentaContable: factura.cuenta_contable ? `${factura.cuenta_contable.codigo} - ${factura.cuenta_contable.nombre}` : '',
      puedeCargarYEnviar: ESTADOS_GESTIONABLES.has(factura.estado),
      yaEnviadaRectoria: ESTADOS_ENVIADA_RECTORIA.has(factura.estado),
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
      const lista = toList<Factura>(response).filter((factura) => ESTADOS_VISIBLES_DIRECCION_FINANCIERA.has(factura.estado));

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
      setError('No se pudo cargar las facturas. Verifique la conexion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarFacturas();
  }, [cargarFacturas]);

  const facturasRevision = useMemo(() => {
    return facturas.map((f) => facturaToRevision(f, docsMap[f.id] ?? []));
  }, [facturas, docsMap]);

  const parseFecha = (value?: string) => (value ? new Date(value).getTime() : 0);

  const facturasFiltradas = useMemo(() => {
    const filtradas = facturasRevision.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.numeroRadicado && !(factura.numeroRadicado?.toLowerCase().includes(filtros.numeroRadicado.toLowerCase()) ?? false)) return false;
      if (filtros.numeroProcesoPago && !(factura.numeroProcesoPago?.toLowerCase().includes(filtros.numeroProcesoPago.toLowerCase()) ?? false)) return false;
      return true;
    });

    switch (filtros.orden) {
      case 'antiguos':
        return filtradas.sort((a, b) => parseFecha(a.fechaEnvio) - parseFecha(b.fechaEnvio));
      case 'sla':
        return filtradas.sort((a, b) => (b.diasTranscurridos || 0) - (a.diasTranscurridos || 0));
      default:
        return filtradas.sort((a, b) => parseFecha(b.fechaEnvio) - parseFecha(a.fechaEnvio));
    }
  }, [facturasRevision, filtros]);

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

    if (!facturaSeleccionada.puedeCargarYEnviar) {
      showToast('err', 'Esta factura ya fue enviada a Rectoria y no puede cargarse nuevamente.');
      return;
    }

    if (!observaciones.trim() || observaciones.trim().length < 10) {
      showToast('err', 'Las observaciones del cargue son obligatorias (minimo 10 caracteres).');
      return;
    }

    setProcesando(true);
    try {
      await facturasService.cargarDireccionFinanciera(facturaSeleccionada.facturaId, observaciones || undefined);
      await facturasService.enviarRectoria(facturaSeleccionada.facturaId, observaciones || undefined);
      showToast('ok', `Factura ${facturaSeleccionada.numeroFactura} cargada y enviada a Rectoria.`);
      cerrarDecision();
      void cargarFacturas();
    } catch {
      showToast('err', 'Error al cargar y enviar la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const devolverFactura = async () => {
    if (!facturaSeleccionada?.facturaId) return;

    if (!observaciones.trim() || observaciones.trim().length < 10) {
      showToast('err', 'El motivo de rechazo es requerido (minimo 10 caracteres).');
      return;
    }

    setProcesando(true);
    try {
      await facturasService.update(facturaSeleccionada.facturaId, {
        estado: 'Devuelta',
        observaciones: observaciones.trim(),
      });
      showToast('ok', `Factura ${facturaSeleccionada.numeroFactura} devuelta a Tesoreria.`);
      cerrarDecision();
      void cargarFacturas();
    } catch {
      showToast('err', 'Error al rechazar la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  return {
    facturas,
    facturasRevision,
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
