import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../../share/factura-detail-modal';

export interface StatsDireccionFinanciera {
  facturasPorCargar: number;
  cargadasEsteMes: number;
  pendientesRevision: number;
  listasParaEnviar: number;
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
      // Cargar facturas de diferentes estados relevantes para DF
      // Nota: Usamos 'Aprobada Auditoría' como el estado de facturas enviadas por Tesorería a DF
      const [
        aprobadasAuditoria,
        revisadasDF,
        enviadasRectoria,
        autorizadas,
      ] = await Promise.all([
        facturasService.getByEstado('Aprobada Auditoría'),
        facturasService.getByEstado('Revisada Dir. Financiera'),
        facturasService.getByEstado('Enviada Rectoría'),
        facturasService.getByEstado('Autorizada'),
      ]);

      // Combinar todas las facturas
      const todasLasFacturas = [...aprobadasAuditoria, ...revisadasDF, ...enviadasRectoria, ...autorizadas];
      
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
    } catch (err) {
      setError('No se pudo cargar los datos. Verifique la conexión.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const stats = useMemo<StatsDireccionFinanciera>(() => {
    const facturasPorCargar = facturas.filter(f => f.estado === 'Aprobada Auditoría').length;
    const cargadasEsteMes = facturas.filter(f => 
      f.estado === 'Cargada' || f.estado === 'Revisada Dir. Financiera'
    ).length;
    const pendientesRevision = facturasPorCargar;
    const listasParaEnviar = facturas.filter(f => f.estado === 'Revisada Dir. Financiera').length;

    return {
      facturasPorCargar,
      cargadasEsteMes,
      pendientesRevision,
      listasParaEnviar,
    };
  }, [facturas]);

  const kanbanEstados = useMemo(() => {
    const estados = [
      { estado: 'Recibida', cantidad: 0, color: 'bg-gray-100 text-gray-700' },
      { estado: 'Radicada', cantidad: 0, color: 'bg-blue-100 text-blue-700' },
      { estado: 'Causada', cantidad: 0, color: 'bg-indigo-100 text-indigo-700' },
      { estado: 'Alistada', cantidad: 0, color: 'bg-yellow-100 text-yellow-700' },
      { estado: 'Aprobada Auditoría', cantidad: 0, color: 'bg-orange-100 text-orange-700' },
      { estado: 'Cargada', cantidad: 0, color: 'bg-purple-100 text-purple-700' },
      { estado: 'Revisada Dir. Financiera', cantidad: 0, color: 'bg-pink-100 text-pink-700' },
      { estado: 'Enviada Rectoría', cantidad: 0, color: 'bg-cyan-100 text-cyan-700' },
      { estado: 'Autorizada', cantidad: 0, color: 'bg-green-100 text-green-700' },
      { estado: 'Pago Aplicado', cantidad: 0, color: 'bg-emerald-100 text-emerald-700' },
    ];

    facturas.forEach(f => {
      const estadoItem = estados.find(e => e.estado === f.estado);
      if (estadoItem) {
        estadoItem.cantidad++;
      }
    });

    return estados;
  }, [facturas]);

  const actividadesRecientes = useMemo<SharedFacturaDetail[]>(() => {
    // Tomar las últimas 5 facturas con más actividad (ordenadas por fecha de actualización)
    const recientes = facturas
      .slice(0, 5)
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
    return recientes;
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
      'Cargada': 'bg-orange-100 text-orange-700 border-orange-200',
      'Revisada Dir. Financiera': 'bg-pink-100 text-pink-700 border-pink-200',
      'Enviada Rectoría': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'Autorizada': 'bg-green-100 text-green-700 border-green-200',
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
