import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { type SharedFacturaDetail } from '../../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../../share/factura-details-helpers';

export interface RectoriaStats {
  pagosPorAutorizar: number;
  autorizadosEsteMes: number;
  pendientesCriticos: number;
  pagosAplicados: number;
}

export interface KanbanEstadoRectoria {
  estado: string;
  sourceEstado: string;
  color: string;
  cantidad: number;
  facturas: SharedFacturaDetail[];
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

const getEstadoClave = (value?: string) => {
  const estado = normalizeEstado(value);

  if (estado.includes('enviada') && estado.includes('rector')) return 'enviada_rectoria';
  if (estado.includes('rechazada') && estado.includes('rector')) return 'rechazada_rectoria';
  if (estado.includes('pago aplicado')) return 'pago_aplicado';
  if (estado.includes('autorizada')) return 'autorizada';
  if (estado.includes('pagada')) return 'pagada';

  return 'otro';
};

const ESTADOS_KANBAN = [
  { key: 'enviada_rectoria', label: 'Pendiente de autorizacion', color: 'bg-amber-100 text-amber-700' },
  { key: 'autorizada', label: 'Autorizada por Rectoria', color: 'bg-green-100 text-green-700' },
  { key: 'rechazada_rectoria', label: 'Rechazada por Rectoria', color: 'bg-red-100 text-red-700' },
  { key: 'pago_aplicado', label: 'Pago aplicado', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'pagada', label: 'Pagada', color: 'bg-teal-100 text-teal-700' },
] as const;

const buildDocumentos = (docs: DocumentoAdjunto[]) =>
  docs.map((d) => ({
    id: String(d.id),
    nombre: d.nombre_archivo,
    tipo: d.tipo_documento,
    verificado: d.verificado,
    url: d.archivo_url ?? d.url_storage ?? undefined,
  }));

export function useRectoriaHome() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFactura, setSelectedFactura] = useState<SharedFacturaDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showKanbanCompleto, setShowKanbanCompleto] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);

    try {
      const response = await facturasService.getAll({ limit: 300, ordering: '-fecha_modificacion' });
      const lista = toList<Factura>(response).filter((factura) => getEstadoClave(factura.estado) !== 'otro');

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
      setError('No se pudieron cargar los indicadores de Rectoria.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    void cargarDatos();
  }, [cargarDatos]);

  const facturasDetalle = useMemo(() => {
    return facturas.map((factura) => ({
      ...buildSharedFacturaDetail(factura),
      documentos: buildDocumentos(docsMap[factura.id] ?? []),
    }));
  }, [facturas, docsMap]);

  const stats = useMemo<RectoriaStats>(() => {
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    const pendientes = facturas.filter((factura) => getEstadoClave(factura.estado) === 'enviada_rectoria');
    const autorizadas = facturas.filter((factura) => getEstadoClave(factura.estado) === 'autorizada');
    const aplicadas = facturas.filter((factura) => getEstadoClave(factura.estado) === 'pago_aplicado');

    const autorizadosEsteMes = autorizadas.filter((factura) => {
      if (!factura.fecha_autorizacion) return false;
      const fecha = new Date(factura.fecha_autorizacion);
      return fecha.getMonth() === month && fecha.getFullYear() === year;
    }).length;

    return {
      pagosPorAutorizar: pendientes.length,
      autorizadosEsteMes,
      pendientesCriticos: pendientes.filter((factura) => (factura.dias_transcurridos || 0) >= 3).length,
      pagosAplicados: aplicadas.length,
    };
  }, [facturas]);

  const kanbanEstados = useMemo<KanbanEstadoRectoria[]>(() => {
    return ESTADOS_KANBAN.map(({ key, label, color }) => {
      const facturasEstado = facturasDetalle
        .filter((factura) => getEstadoClave(factura.estado) === key)
        .sort((a, b) => {
          const fechaA = new Date(a.fechaRecepcion || a.fechaFactura || 0).getTime();
          const fechaB = new Date(b.fechaRecepcion || b.fechaFactura || 0).getTime();
          return fechaA - fechaB;
        });

      return {
        estado: label,
        sourceEstado: key,
        color,
        cantidad: facturasEstado.length,
        facturas: facturasEstado,
      };
    });
  }, [facturasDetalle]);

  const actividadesRecientes = useMemo(() => {
    return [...facturasDetalle]
      .sort((a, b) => {
        const fechaA = new Date(a.fechaRecepcion || a.fechaFactura || 0).getTime();
        const fechaB = new Date(b.fechaRecepcion || b.fechaFactura || 0).getTime();
        return fechaB - fechaA;
      })
      .slice(0, 12);
  }, [facturasDetalle]);

  const handleClickActividad = (actividad: SharedFacturaDetail) => {
    setSelectedFactura(actividad);
    setShowDetailModal(true);
  };

  const getEstadoBadge = (estado: string) => {
    switch (getEstadoClave(estado)) {
      case 'enviada_rectoria':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'autorizada':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'rechazada_rectoria':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'pago_aplicado':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'pagada':
        return 'bg-teal-100 text-teal-700 border-teal-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return {
    cargando,
    error,
    stats,
    kanbanEstados,
    actividadesRecientes,
    selectedFactura,
    showDetailModal,
    showKanbanCompleto,
    setShowDetailModal,
    setShowKanbanCompleto,
    setSelectedFactura,
    handleClickActividad,
    getEstadoBadge,
    recargarDatos: cargarDatos,
  };
}
