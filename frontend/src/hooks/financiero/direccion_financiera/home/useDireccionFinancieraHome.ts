import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { type SharedFacturaDetail } from '../../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../../share/factura-details-helpers';

export interface StatsDireccionFinanciera {
  facturasPorCargar: number;
  cargadasEsteMes: number;
  pendientesRevision: number;
  listasParaEnviar: number;
}

export interface KanbanEstadoDireccionFinanciera {
  estado: string;
  sourceEstado: string;
  color: string;
  cantidad: number;
  facturas: SharedFacturaDetail[];
}

export function useDireccionFinancieraHome() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ultimaActualizacion, setUltimaActualizacion] = useState<Date>(new Date());

  const [selectedFactura, setSelectedFactura] = useState<SharedFacturaDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showKanbanCompleto, setShowKanbanCompleto] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [
        recibidas,
        registradas,
        radicadas,
        causadas,
        alistadas,
        aprobadasAuditoria,
        rechazadasAuditoria,
        revisadasDF,
        devueltas,
        cargadas,
        enviadasRectoria,
        autorizadas,
        rechazadasRectoria,
        pagosAplicados,
        pagadas,
      ] = await Promise.all([
        facturasService.getByEstado('Recibida'),
        facturasService.getByEstado('Registrada'),
        facturasService.getByEstado('Radicada'),
        facturasService.getByEstado('Causada'),
        facturasService.getByEstado('Alistada'),
        facturasService.getByEstado('Aprobada Auditoría'),
        facturasService.getByEstado('Rechazada Auditoría'),
        facturasService.getByEstado('Revisada Dir. Financiera'),
        facturasService.getByEstado('Devuelta'),
        facturasService.getByEstado('Cargada'),
        facturasService.getByEstado('Enviada Rectoría'),
        facturasService.getByEstado('Autorizada'),
        facturasService.getByEstado('Rechazada por Rectoría'),
        facturasService.getByEstado('Pago Aplicado'),
        facturasService.getByEstado('Pagada'),
      ]);

      const todasLasFacturas = [
        ...recibidas,
        ...registradas,
        ...radicadas,
        ...causadas,
        ...alistadas,
        ...aprobadasAuditoria,
        ...rechazadasAuditoria,
        ...revisadasDF,
        ...cargadas,
        ...enviadasRectoria,
        ...autorizadas,
        ...rechazadasRectoria,
        ...devueltas,
        ...pagosAplicados,
        ...pagadas,
      ];
      
      // Eliminar duplicados por ID
      const facturasUnicas = Array.from(new Map(todasLasFacturas.map(f => [f.id, f])).values());
      
      setFacturas(facturasUnicas);
      setUltimaActualizacion(new Date());

      // Cargar documentos para todas las facturas
      const docsResults = await Promise.all(
        facturasUnicas.map((f) =>
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
      setError('No se pudo cargar los datos. Verifique la conexión.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const stats = useMemo<StatsDireccionFinanciera>(() => {
    const facturasPorCargar = facturas.filter(f => f.estado === 'Revisada Dir. Financiera' || f.estado === 'Devuelta').length;
    const cargadasEsteMes = facturas.filter(f => f.estado === 'Cargada').length;
    const pendientesRevision = facturasPorCargar;
    const listasParaEnviar = facturas.filter(f => f.estado === 'Cargada').length;

    return {
      facturasPorCargar,
      cargadasEsteMes,
      pendientesRevision,
      listasParaEnviar,
    };
  }, [facturas]);

  const kanbanEstados = useMemo<KanbanEstadoDireccionFinanciera[]>(() => {
    const definiciones = [
      { label: 'Recibida (Funcionario)', sourceEstado: 'Recibida', color: 'bg-slate-100 text-slate-700' },
      { label: 'Registrada', sourceEstado: 'Registrada', color: 'bg-blue-100 text-blue-700' },
      { label: 'Radicada', sourceEstado: 'Radicada', color: 'bg-cyan-100 text-cyan-700' },
      { label: 'Causada', sourceEstado: 'Causada', color: 'bg-indigo-100 text-indigo-700' },
      { label: 'Alistada', sourceEstado: 'Alistada', color: 'bg-amber-100 text-amber-700' },
      { label: 'Aprobada Auditoría', sourceEstado: 'Aprobada Auditoría', color: 'bg-teal-100 text-teal-700' },
      { label: 'Rechazada Auditoría', sourceEstado: 'Rechazada Auditoría', color: 'bg-rose-100 text-rose-700' },
      { label: 'Revisada Dir. Financiera', sourceEstado: 'Revisada Dir. Financiera', color: 'bg-orange-100 text-orange-700' },
      { label: 'Cargada para autorización', sourceEstado: 'Cargada', color: 'bg-purple-100 text-purple-700' },
      { label: 'Enviada Rectoría', sourceEstado: 'Enviada Rectoría', color: 'bg-cyan-100 text-cyan-700' },
      { label: 'Autorizada para pago', sourceEstado: 'Autorizada', color: 'bg-green-100 text-green-700' },
      { label: 'Rechazada por Rectoría', sourceEstado: 'Rechazada por Rectoría', color: 'bg-red-100 text-red-800' },
      { label: 'Devuelta para ajustes', sourceEstado: 'Devuelta', color: 'bg-red-100 text-red-700' },
      { label: 'Pago Aplicado', sourceEstado: 'Pago Aplicado', color: 'bg-emerald-100 text-emerald-700' },
      { label: 'Pagada', sourceEstado: 'Pagada', color: 'bg-emerald-200 text-emerald-800' },
    ] as const;

    return definiciones.map(({ label, sourceEstado, color }) => {
      const facturasEstado = facturas
        .filter((f) => f.estado === sourceEstado)
        .sort((a, b) => new Date(b.fecha_modificacion).getTime() - new Date(a.fecha_modificacion).getTime())
        .map((f) => {
          const docs = docsMap[f.id] ?? [];
          return {
            ...buildSharedFacturaDetail(f),
            documentos: docs.map((d) => ({
              id: String(d.id),
              nombre: d.nombre_archivo,
              tipo: d.tipo_documento,
              verificado: d.verificado,
              url: d.archivo_url ?? d.url_storage ?? undefined,
            })),
          };
        });

      return {
        estado: label,
        sourceEstado,
        color,
        cantidad: facturasEstado.length,
        facturas: facturasEstado,
      };
    });
  }, [facturas, docsMap]);

  const ESTADOS_DF = new Set([
    'Aprobada Auditoría',
    'Revisada Dir. Financiera',
    'Cargada',
    'Enviada Rectoría',
    'Autorizada',
    'Rechazada por Rectoría',
    'Devuelta',
    'Pago Aplicado',
    'Pagada',
  ]);

  const actividadesRecientes = useMemo<SharedFacturaDetail[]>(() => {
    return facturas
      .filter(f => ESTADOS_DF.has(f.estado))
      .slice()
      .sort((a, b) => new Date(b.fecha_modificacion).getTime() - new Date(a.fecha_modificacion).getTime())
      .slice(0, 30)
      .map(f => {
        const docs = docsMap[f.id] ?? [];
        return {
          ...buildSharedFacturaDetail(f),
          documentos: docs.map((d) => ({
            id: String(d.id),
            nombre: d.nombre_archivo,
            tipo: d.tipo_documento,
            verificado: d.verificado,
            url: d.archivo_url ?? d.url_storage ?? undefined,
          })),
        };
      });
  }, [facturas, docsMap]);

  const handleClickActividad = (actividad: SharedFacturaDetail) => {
    setSelectedFactura(actividad);
    setShowDetailModal(true);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      'Recibida': 'bg-blue-100 text-blue-700 border-blue-200',
      'Radicada': 'bg-green-100 text-green-700 border-green-200',
      'Causada': 'bg-purple-100 text-purple-700 border-purple-200',
      'Alistada': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Aprobada Auditoría': 'bg-teal-100 text-teal-700 border-teal-200',
      'Revisada Dir. Financiera': 'bg-amber-100 text-amber-700 border-amber-200',
      'Cargada': 'bg-orange-100 text-orange-700 border-orange-200',
      'Enviada Rectoría': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'Autorizada': 'bg-green-100 text-green-700 border-green-200',
      'Devuelta': 'bg-red-100 text-red-700 border-red-200',
      'Pago Aplicado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Pagada': 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return badges[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const formatUltimaActualizacion = () => {
    return ultimaActualizacion.toLocaleString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    facturas,
    docsMap,
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
    formatUltimaActualizacion,
    recargarDatos: cargarDatos,
  };
}
