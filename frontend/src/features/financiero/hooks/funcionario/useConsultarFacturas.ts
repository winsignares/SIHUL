import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { facturasService } from '../../services';
import type { Factura } from '../../models/core.models';
import type { FuncionarioConsultaRow, FuncionarioEstadoChange } from '../../models/funcionario';
import type { SharedFacturaDetail } from '../../components/factura-detail-modal';
import { buildTimelineFromSeguimiento, type SeguimientoLike } from '../../../../components/ui/timeline-builder';
import { useSondeoVisible } from '../../../../hooks/useSondeoVisible';
import { toList, esEstadoFuncionario, mapFactura, mapRiesgo } from './consultarFacturasUtils';

/** Estado y acciones de la consulta de facturas (funcionario). */
export function useConsultarFacturas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<FuncionarioConsultaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SharedFacturaDetail | null>(null);
  const [estadoChanges, setEstadoChanges] = useState<FuncionarioEstadoChange[]>([]);

  const [numeroFactura, setNumeroFactura] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [ordenDias, setOrdenDias] = useState<'recientes' | 'antiguos'>('antiguos');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const loadRows = async () => {
    const response = await facturasService.getAll({ limit: 500 });
    const list = toList<Factura>(response).filter((factura) => esEstadoFuncionario(factura.estado));
    return list.map(mapFactura);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const nextRows = await loadRows();
        setRows(nextRows);
      } catch {
        setRows([]);
        setLoadError('No fue posible consultar facturas. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  // Revisa cambios de estado cada 25 s, solo con la pestaña visible
  useSondeoVisible(async () => {
    try {
      const latest = await loadRows();
      setRows((prev) => {
        const previousMap = new Map(prev.map((p) => [p.facturaId, p]));
        const changes: FuncionarioEstadoChange[] = [];

        latest.forEach((next) => {
          const old = previousMap.get(next.facturaId);
          if (old && old.estado !== next.estado) {
            changes.push({
              id: next.facturaId,
              numeroFactura: next.idTramite,
              estadoAnterior: old.estado,
              estadoNuevo: next.estado,
            });
          }
        });

        if (changes.length > 0) {
          setEstadoChanges(changes);
        }

        return latest;
      });
    } catch {
      // Polling silencioso para no interrumpir la experiencia si falla temporalmente.
    }
  }, 25000);

  const estados = useMemo(() => Array.from(new Set(rows.map((r) => r.estado))), [rows]);

  const filtered = useMemo(() => {
    const result = rows.filter((r) => {
      if (numeroFactura) {
        const query = numeroFactura.toLowerCase();
        const matches = [r.idTramite, r.proveedor, r.nit, r.estado]
          .some((value) => String(value || '').toLowerCase().includes(query));
        if (!matches) return false;
      }
      if (estado && r.estado !== estado) return false;
      if (fechaInicio && r.fechaRecepcion && r.fechaRecepcion < fechaInicio) return false;
      if (fechaFin && r.fechaRecepcion && r.fechaRecepcion > fechaFin) return false;
      return true;
    });
    return result.sort((a, b) => ordenDias === 'antiguos' ? b.dias - a.dias : a.dias - b.dias);
  }, [rows, numeroFactura, estado, fechaInicio, fechaFin, ordenDias]);

  // Paginación
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedFiltered = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filtered.slice(startIndex, endIndex);
  }, [filtered, currentPage, itemsPerPage]);

  const selectedRow = filtered.find((r) => r.id === selectedId) || rows.find((r) => r.id === selectedId) || null;

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [numeroFactura, estado, fechaInicio, fechaFin, ordenDias]);

  useEffect(() => {
    const facturaParam = searchParams.get('factura');
    if (!facturaParam || rows.length === 0) return;

    const facturaId = Number(facturaParam);
    if (!Number.isFinite(facturaId)) return;

    const row = rows.find((item) => item.facturaId === facturaId);
    if (!row) return;

    setSelectedId(row.id);
    setOpenDetail(true);
  }, [rows, searchParams]);

  useEffect(() => {
    if (!selectedRow || !openDetail) return;

    const loadDetail = async () => {
      setDetailLoading(true);
      try {
        const seguimiento = await facturasService.getSeguimiento(selectedRow.facturaId);
        const factura = (seguimiento?.factura || null) as Factura | null;
        const estadoActual = factura?.estado || selectedRow.estado;
        const timeline = buildTimelineFromSeguimiento(seguimiento as SeguimientoLike, estadoActual);

        setSelectedDetail({
          facturaId: selectedRow.facturaId,
          numeroFactura: factura?.numero_factura || selectedRow.idTramite,
          proveedor: factura?.proveedor?.razon_social || selectedRow.proveedor,
          valorSubtotal: Number(factura?.valor_subtotal || 0) || undefined,
          valorIva: Number(factura?.valor_iva || 0) || undefined,
          valorTotal: Number(factura?.valor_total || selectedRow.monto),
          fechaFactura: factura?.fecha_factura || selectedRow.fechaFactura,
          fechaRecepcion: factura?.fecha_recepcion || selectedRow.fechaRecepcion,
          areaSolicitante: factura?.departamento?.nombre || selectedRow.area,
          estado: estadoActual,
          diasTranscurridos: Math.max(0, Number(factura?.dias_transcurridos ?? selectedRow.dias)),
          numeroRadicado: factura?.numero_radicado || undefined,
          observaciones: factura?.observaciones || undefined,
          tipoDocumento: factura?.tipo_documento || undefined,
          cuentaBancariaProveedor: factura?.cuenta_bancaria_proveedor || undefined,
          contactoProveedor: [factura?.proveedor?.email, factura?.proveedor?.telefono].filter(Boolean).join(' | ') || undefined,
          nivelRiesgo: mapRiesgo(selectedRow.riesgo),
          nit: factura?.proveedor?.nit || selectedRow.nit,
          etapasTimeline: timeline,
          documentos: (factura?.documentos || []).map((doc) => ({
            id: String(doc.id),
            tipo: doc.tipo_documento,
            nombre: doc.nombre_archivo,
            fecha: doc.fecha_carga,
            verificado: doc.verificado,
            url: doc.archivo_url || doc.url_storage || undefined,
          })),
        });
      } catch {
        setSelectedDetail({
          facturaId: selectedRow.facturaId,
          numeroFactura: selectedRow.idTramite,
          proveedor: selectedRow.proveedor,
          valorTotal: selectedRow.monto,
          fechaFactura: selectedRow.fechaFactura,
          fechaRecepcion: selectedRow.fechaRecepcion,
          areaSolicitante: selectedRow.area,
          estado: selectedRow.estado,
          diasTranscurridos: Math.max(0, selectedRow.dias),
          numeroRadicado: selectedRow.sinRadicado ? undefined : selectedRow.numeroRadicado,
          nivelRiesgo: mapRiesgo(selectedRow.riesgo),
          nit: selectedRow.nit,
          etapasTimeline: buildTimelineFromSeguimiento({}, selectedRow.estado),
        });
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetail();
  }, [openDetail, selectedRow]);

  const estadoBadge = (value: string) => {
    if (value === 'Recibida') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (value === 'Registrada') return 'bg-cyan-100 text-cyan-700 border-cyan-200';
    if (value === 'Radicada') return 'bg-green-100 text-green-700 border-green-200';
    if (value === 'Causada') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const riskDot = (risk: FuncionarioConsultaRow['riesgo']) => {
    if (risk === 'vencido') return 'bg-purple-700';
    if (risk === 'naranja') return 'bg-orange-500';
    if (risk === 'amarillo') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const diasBadge = (dias: number) => {
    if (dias >= 20) {
      return 'bg-red-600/95 text-white border-red-600 shadow-[0_3px_10px_rgba(220,38,38,0.35)]';
    }
    if (dias >= 15) {
      return 'bg-red-500/90 text-white border-red-500 shadow-[0_2px_8px_rgba(239,68,68,0.25)]';
    }
    if (dias >= 10) {
      return 'bg-red-100 text-red-700 border-red-200';
    }
    if (dias >= 5) {
      return 'bg-orange-100 text-orange-700 border-orange-200';
    }
    if (dias >= 2) {
      return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    }
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const clearFilters = () => {
    setNumeroFactura('');
    setEstado('');
    setFechaInicio('');
    setFechaFin('');
    setOrdenDias('antiguos');
  };


  return {
    searchParams,
    setSearchParams,
    rows,
    setRows,
    loading,
    setLoading,
    loadError,
    setLoadError,
    openDetail,
    setOpenDetail,
    selectedId,
    setSelectedId,
    detailLoading,
    setDetailLoading,
    selectedDetail,
    setSelectedDetail,
    estadoChanges,
    setEstadoChanges,
    numeroFactura,
    setNumeroFactura,
    estado,
    setEstado,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    ordenDias,
    setOrdenDias,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    loadRows,
    estados,
    filtered,
    totalPages,
    paginatedFiltered,
    selectedRow,
    estadoBadge,
    riskDot,
    diasBadge,
    clearFilters,
  };
}
