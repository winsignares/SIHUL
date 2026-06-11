import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { type SharedFacturaDetail } from '../../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../../share/factura-details-helpers';

export interface FacturaAutorizacion extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaEnvioRectoria: string;
  cuentaContable: string;
  centroCosto: string;
}

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

const normalizeEstado = (value?: string) =>
  (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const isPendienteRectoria = (estado?: string) => {
  const normalized = normalizeEstado(estado);
  return normalized.includes('enviada') && normalized.includes('rector');
};

const parseFecha = (value?: string) => (value ? new Date(value).getTime() : 0);

export function useAutorizarPagos() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    numeroRadicado: '',
    numeroProcesoPago: '',
    orden: 'antiguos',
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaAutorizacion | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogAccion, setMostrarDialogAccion] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [accion, setAccion] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [motivo, setMotivo] = useState('');

  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const showToast = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const mapFactura = (factura: Factura, docs: DocumentoAdjunto[]): FacturaAutorizacion => {
    const base = buildSharedFacturaDetail(factura);
    return {
      ...base,
      id: String(factura.id),
      nit: factura.proveedor?.nit ?? '',
      fechaEnvioRectoria: factura.fecha_cargue ?? factura.fecha_recepcion ?? factura.fecha_creacion ?? '',
      cuentaContable: factura.cuenta_contable ? `${factura.cuenta_contable.codigo} - ${factura.cuenta_contable.nombre}` : '',
      centroCosto: factura.centro_costo ? `${factura.centro_costo.codigo} - ${factura.centro_costo.nombre}` : '',
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
      const lista = toList<Factura>(response).filter((factura) => isPendienteRectoria(factura.estado));
      setFacturas(lista);

      const docsResults = await Promise.all(
        lista.map((factura) =>
          documentosService
            .getByFactura(factura.id)
            .then((docs) => ({ id: factura.id, docs }))
            .catch(() => ({ id: factura.id, docs: [] as DocumentoAdjunto[] }))
        )
      );

      const nextDocsMap: Record<number, DocumentoAdjunto[]> = {};
      docsResults.forEach(({ id, docs }) => {
        nextDocsMap[id] = docs;
      });
      setDocsMap(nextDocsMap);
    } catch {
      setError('No se pudieron cargar los pagos pendientes de autorizacion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarFacturas();
  }, [cargarFacturas]);

  const facturasAutorizacion = useMemo(() => {
    return facturas.map((factura) => mapFactura(factura, docsMap[factura.id] ?? []));
  }, [facturas, docsMap]);

  const facturasFiltradas = useMemo(() => {
    const filtradas = facturasAutorizacion.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.numeroRadicado && !(factura.numeroRadicado?.toLowerCase().includes(filtros.numeroRadicado.toLowerCase()) ?? false)) return false;
      if (filtros.numeroProcesoPago && !(factura.numeroProcesoPago?.toLowerCase().includes(filtros.numeroProcesoPago.toLowerCase()) ?? false)) return false;
      return true;
    });

    switch (filtros.orden) {
      case 'recientes':
        return filtradas.sort((a, b) => parseFecha(b.fechaEnvioRectoria) - parseFecha(a.fechaEnvioRectoria));
      case 'sla':
        return filtradas.sort((a, b) => (b.diasTranscurridos || 0) - (a.diasTranscurridos || 0));
      default:
        return filtradas.sort((a, b) => parseFecha(a.fechaEnvioRectoria) - parseFecha(b.fechaEnvioRectoria));
    }
  }, [facturasAutorizacion, filtros]);

  const resumen = useMemo(() => {
    const total = facturasFiltradas.reduce((sum, factura) => sum + factura.valorTotal, 0);
    const criticos = facturasFiltradas.filter((factura) => (factura.diasTranscurridos || 0) >= 3).length;
    const promedioDias = Math.round(
      facturasFiltradas.reduce((sum, factura) => sum + (factura.diasTranscurridos || 0), 0) / Math.max(1, facturasFiltradas.length)
    );

    return {
      total,
      criticos,
      promedioDias,
    };
  }, [facturasFiltradas]);

  const abrirDialog = (factura: FacturaAutorizacion, accionSeleccionada: 'aprobar' | 'rechazar') => {
    setFacturaSeleccionada(factura);
    setAccion(accionSeleccionada);
    setMotivo('');
    setMostrarDialogAccion(true);
  };

  const handleVerDetalle = (factura: FacturaAutorizacion) => {
    setFacturaDetalle(factura);
    setMostrarDialogDetalle(true);
  };

  const procesarAutorizacion = async () => {
    if (!facturaSeleccionada?.facturaId) return;

    if (!motivo.trim() || motivo.trim().length < 10) {
      showToast('err', 'Las observaciones son obligatorias y deben tener minimo 10 caracteres.');
      return;
    }

    setIsProcessing(true);

    try {
      if (accion === 'aprobar') {
        await facturasService.autorizarRectoria(facturaSeleccionada.facturaId, motivo.trim());
        showToast('ok', `Pago autorizado por Rectoria: ${facturaSeleccionada.numeroFactura}.`);
      } else {
        await facturasService.rechazarRectoria(facturaSeleccionada.facturaId, motivo.trim());
        showToast('ok', `Pago rechazado y devuelto a Direccion Financiera: ${facturaSeleccionada.numeroFactura}.`);
      }

      setMostrarDialogAccion(false);
      setFacturaSeleccionada(null);
      setMotivo('');
      await cargarFacturas();
    } catch {
      showToast('err', 'No fue posible procesar la decision en Rectoria.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    filtros,
    facturasAutorizacion,
    facturasFiltradas,
    resumen,
    facturaSeleccionada,
    facturaDetalle,
    mostrarDialogAccion,
    mostrarDialogDetalle,
    accion,
    motivo,
    isProcessing,
    cargando,
    error,
    toast,
    setFiltros,
    setMostrarDialogAccion,
    setMostrarDialogDetalle,
    setMotivo,
    abrirDialog,
    handleVerDetalle,
    procesarAutorizacion,
    cargarFacturas,
  };
}
