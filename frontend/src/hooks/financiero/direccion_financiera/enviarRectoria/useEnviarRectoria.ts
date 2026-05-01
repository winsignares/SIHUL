import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../../share/factura-detail-modal';

export interface FacturaEnvio extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaRevision: string;
}

export function useEnviarRectoria() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaEnvio | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [envioAbierto, setEnvioAbierto] = useState(false);
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

  const facturaToEnvio = (factura: Factura, docs: DocumentoAdjunto[]): FacturaEnvio => {
    const base = buildSharedFacturaDetail(factura);
    return {
      ...base,
      id: String(factura.id),
      nit: factura.proveedor?.nit ?? '',
      fechaRevision: factura.fecha_aprobacion_auditoria ?? factura.fecha_recepcion ?? '',
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
      // Facturas revisadas y cargadas en DF, listas para enviar a rectoria
      const lista = await facturasService.getByEstado('Revisada Dir. Financiera');
      
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
      .map((f) => facturaToEnvio(f, docsMap[f.id] ?? []))
      .filter((factura) => {
        if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
        if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
        if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
        if (filtros.fechaInicio && factura.fechaRevision < filtros.fechaInicio) return false;
        if (filtros.fechaFin && factura.fechaRevision > filtros.fechaFin) return false;
        if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
        if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
        return true;
      });
  }, [facturas, docsMap, filtros]);

  const abrirDetalle = (factura: FacturaEnvio) => {
    setFacturaSeleccionada(factura);
    setDetalleAbierto(true);
  };

  const abrirEnvio = (factura: FacturaEnvio) => {
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setEnvioAbierto(true);
  };

  const cerrarEnvio = () => {
    setEnvioAbierto(false);
    setFacturaSeleccionada(null);
    setObservaciones('');
  };

  const enviarARectoria = async () => {
    if (!facturaSeleccionada?.facturaId) return;
    
    setProcesando(true);
    try {
      await facturasService.update(facturaSeleccionada.facturaId, {
        estado: 'Enviada Rectoría',
        observaciones: observaciones || undefined,
      });
      showToast('ok', `Factura ${facturaSeleccionada.numeroFactura} enviada a Rectoría exitosamente.`);
      cerrarEnvio();
      cargarFacturas();
    } catch {
      showToast('err', 'Error al enviar la factura. Intente de nuevo.');
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
    envioAbierto,
    observaciones,
    filtros,
    toast,
    setFiltros,
    setObservaciones,
    setDetalleAbierto,
    setEnvioAbierto,
    abrirDetalle,
    abrirEnvio,
    cerrarEnvio,
    enviarARectoria,
    cargarFacturas,
  };
}
