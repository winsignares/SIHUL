import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Eye, Search, Filter, FileSearch, Bell } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { facturasService } from '../../../services/financiero';
import type { Factura } from '../../../models/financiero/core.models';
import type { FuncionarioConsultaRow, FuncionarioEstadoChange, FuncionarioSeguimientoResponse } from '../../../models/financiero/funcionario';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import type { TimelineEtapa } from '../../../share/factura-timeline';
import { displayDate, displayRadicado } from '../../../share/field-placeholders';
import { downloadDocumentosConsolidados } from '../../../share/documentos-consolidados';

const TIMELINE_BLUEPRINT: Array<{ id: string; nombre: string; estadoRef: string; responsable: string; diasMaximos: number }> = [
  { id: '1', nombre: 'Recepción', estadoRef: 'Recibida', responsable: 'Funcionario', diasMaximos: 1 },
  { id: '1.5', nombre: 'Registro Completo', estadoRef: 'Registrada', responsable: 'Funcionario', diasMaximos: 1 },
  { id: '2', nombre: 'Radicación', estadoRef: 'Radicada', responsable: 'Contabilidad', diasMaximos: 3 },
  { id: '3', nombre: 'Causación', estadoRef: 'Causada', responsable: 'Contabilidad', diasMaximos: 2 },
  { id: '4', nombre: 'Alistamiento', estadoRef: 'Alistada', responsable: 'Tesorería', diasMaximos: 3 },
  { id: '5', nombre: 'Control Previo', estadoRef: 'Aprobada Auditoría', responsable: 'Auditoría', diasMaximos: 4 },
  { id: '6', nombre: 'Cargue', estadoRef: 'Cargada', responsable: 'Dirección Financiera', diasMaximos: 2 },
  { id: '7', nombre: 'Revisión Dirección Financiera', estadoRef: 'Revisada Dir. Financiera', responsable: 'Dirección Financiera', diasMaximos: 2 },
  { id: '8', nombre: 'Envío a Rectoría', estadoRef: 'Enviada Rectoría', responsable: 'Dirección Financiera', diasMaximos: 1 },
  { id: '9', nombre: 'Autorización de Pago', estadoRef: 'Autorizada', responsable: 'Rectoría', diasMaximos: 3 },
  { id: '10', nombre: 'Aplicación de Pago', estadoRef: 'Pago Aplicado', responsable: 'Tesorería', diasMaximos: 1 },
  { id: '11', nombre: 'Pago Finalizado', estadoRef: 'Pagada', responsable: 'Tesorería', diasMaximos: 1 },
];

const toList = <T,>(data: unknown): T[] => {
  if (Array.isArray(data)) return data as T[];
  if (Array.isArray((data as { results?: unknown[] })?.results)) return (data as { results: T[] }).results;
  return [];
};

const ESTADO_OBJETIVO = 'Registrada';
const esEstadoRegistrado = (estado?: string | null) => (estado || '').toLowerCase() === ESTADO_OBJETIVO.toLowerCase();

function mapFactura(f: Factura): FuncionarioConsultaRow {
  const dias = Math.max(0, Number(f.dias_transcurridos || 0));
  let riesgo: FuncionarioConsultaRow['riesgo'] = 'verde';
  if (dias > 15) riesgo = 'vencido';
  else if (dias > 10) riesgo = 'naranja';
  else if (dias > 5) riesgo = 'amarillo';

  return {
    id: String(f.id),
    facturaId: Number(f.id),
    riesgo,
    idTramite: f.numero_factura || `FAC-${f.id}`,
    proveedor: f.proveedor?.razon_social || 'Proveedor sin nombre',
    nit: f.proveedor?.nit,
    area: f.departamento?.nombre || 'Sin area',
    monto: Number(f.valor_total || 0),
    estado: f.estado || 'Recibida',
    etapa: f.etapa_actual || 'Recepción y Registro',
    numeroRadicado: f.numero_radicado || '',
    sinRadicado: !f.numero_radicado,
    fechaFactura: f.fecha_factura || '',
    fechaRecepcion: f.fecha_recepcion || '',
    dias,
  };
}

function inferEtapaActual(estado: string): string {
  const found = TIMELINE_BLUEPRINT.find((item) => item.estadoRef === estado);
  return found?.nombre || estado;
}

function mapRiesgo(risk: FuncionarioConsultaRow['riesgo']): 'verde' | 'amarillo' | 'rojo' | 'vencido' {
  if (risk === 'naranja') return 'rojo';
  return risk;
}

function buildTimelineFromSeguimiento(seguimiento: FuncionarioSeguimientoResponse, fallbackEstado: string): TimelineEtapa[] {
  const historial = Array.isArray(seguimiento?.historial) ? [...seguimiento.historial] : [];
  historial.sort((a, b) => new Date(a.fecha_accion || 0).getTime() - new Date(b.fecha_accion || 0).getTime());

  const estadoActual = seguimiento?.factura?.estado || fallbackEstado;
  const estadoIndex = TIMELINE_BLUEPRINT.findIndex((step) => step.estadoRef === estadoActual);

  const isRejectedFlow = ['Rechazada', 'Rechazada Auditoría', 'Devuelta', 'Detenida', 'Anulada'].includes(estadoActual);

  return TIMELINE_BLUEPRINT.map((step, index) => {
    const matchHistorial = historial.find((h) => h.estado_nuevo === step.estadoRef);
    let estado: TimelineEtapa['estado'];
    
    if (isRejectedFlow && index === Math.max(estadoIndex, 0)) {
      estado = 'rechazado';
    } else if (estadoIndex >= 0 && index <= estadoIndex) {
      estado = 'completado';
    } else if (estadoIndex >= 0 && index === estadoIndex + 1) {
      estado = 'en-proceso';
    } else {
      estado = 'pendiente';
    }

    return {
      id: step.id,
      nombre: step.nombre,
      estado,
      fechaInicio: matchHistorial?.fecha_accion,
      fechaFin: matchHistorial?.fecha_accion,
      usuarioResponsable: matchHistorial?.usuario_nombre || step.responsable,
      observaciones: matchHistorial?.observacion || matchHistorial?.accion || undefined,
      diasMaximos: step.diasMaximos,
    };
  });
}

export default function ConsultarFacturas() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [rows, setRows] = useState<FuncionarioConsultaRow[]>([]);
  const [facturasData, setFacturasData] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SharedFacturaDetail | null>(null);
  const [estadoChanges, setEstadoChanges] = useState<FuncionarioEstadoChange[]>([]);

  const [numeroFactura, setNumeroFactura] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [estado, setEstado] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadRows = async () => {
    const response = await facturasService.getAll({ estado: ESTADO_OBJETIVO, limit: 500 });
    const list = toList<Factura>(response).filter((factura) => esEstadoRegistrado(factura.estado));
    return {
      list,
      rows: list.map(mapFactura),
    };
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const { list, rows: nextRows } = await loadRows();
        setFacturasData(list);
        setRows(nextRows);
      } catch {
        setRows([]);
        setFacturasData([]);
        setLoadError('No fue posible consultar facturas. Intente nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void (async () => {
        try {
          const { list, rows: latest } = await loadRows();
          setFacturasData(list);
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
      })();
    }, 25000);

    return () => window.clearInterval(interval);
  }, []);

  const proveedores = useMemo(() => Array.from(new Set(rows.map(r => r.proveedor))), [rows]);
  const estados = useMemo(() => Array.from(new Set(rows.map(r => r.estado))), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (numeroFactura) {
        const query = numeroFactura.toLowerCase();
        const matches = [r.idTramite, r.proveedor, r.nit, r.estado]
          .some((value) => String(value || '').toLowerCase().includes(query));
        if (!matches) return false;
      }
      if (proveedor && r.proveedor !== proveedor) return false;
      if (estado && r.estado !== estado) return false;
      if (fechaInicio && r.fechaRecepcion && r.fechaRecepcion < fechaInicio) return false;
      if (fechaFin && r.fechaRecepcion && r.fechaRecepcion > fechaFin) return false;
      return true;
    });
  }, [rows, numeroFactura, proveedor, estado, fechaInicio, fechaFin]);

  const filteredFacturas = useMemo(() => {
    const allowedIds = new Set(filtered.map((row) => row.facturaId));
    return facturasData.filter((factura) => allowedIds.has(Number(factura.id)));
  }, [facturasData, filtered]);

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
  }, [numeroFactura, proveedor, estado, fechaInicio, fechaFin]);

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
        const timeline = buildTimelineFromSeguimiento(seguimiento as FuncionarioSeguimientoResponse, estadoActual);

        setSelectedDetail({
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
          descripcion: factura?.descripcion,
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
    if (dias >= 10) return 'bg-red-100 text-red-700 border-red-200';
    if (dias >= 5) return 'bg-orange-100 text-orange-700 border-orange-200';
    if (dias >= 2) return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const handleExport = async () => {
    if (filteredFacturas.length === 0) return;

    const XLSX = await import('xlsx');

    const rows = filteredFacturas.map((factura) => {
      const documentos = (factura.documentos || [])
        .map((doc) => `${doc.tipo_documento || 'Documento'}: ${doc.nombre_archivo || 'Sin nombre'}`)
        .join(' | ');

      return {
        ID: factura.id,
        'Numero Factura': factura.numero_factura,
        'Numero Radicado': factura.numero_radicado || '',
        'Numero Proceso Pago': factura.numero_proceso_pago || '',
        'Numero Confirmacion': factura.numero_confirmacion || '',
        'Numero Transaccion': factura.numero_transaccion || '',
        'Numero Comprobante': factura.numero_comprobante || '',
        'Proveedor ID': factura.proveedor_id,
        Proveedor: factura.proveedor?.razon_social || '',
        NIT: factura.proveedor?.nit || '',
        'Tipo Proveedor': factura.proveedor?.tipo_proveedor || '',
        'Email Proveedor': factura.proveedor?.email || '',
        'Telefono Proveedor': factura.proveedor?.telefono || '',
        'Banco Proveedor': factura.proveedor?.banco || '',
        'Tipo Cuenta Proveedor': factura.proveedor?.tipo_cuenta || '',
        'Numero Cuenta Proveedor': factura.proveedor?.numero_cuenta || '',
        'Departamento ID': factura.departamento_id,
        'Area Solicitante': factura.departamento?.nombre || '',
        'Cuenta Contable ID': factura.cuenta_contable_id || '',
        'Cuenta Contable': factura.cuenta_contable?.nombre || '',
        'Centro Costo ID': factura.centro_costo_id || '',
        'Centro Costo': factura.centro_costo?.nombre || '',
        'Valor Subtotal': factura.valor_subtotal,
        'Valor Tasa': factura.valor_iva,
        'Valor Retencion Renta': factura.valor_retencion_renta,
        'Valor Retencion IVA': factura.valor_retencion_iva,
        'Valor Retencion ICA': factura.valor_retencion_ica,
        'Valor Total': factura.valor_total,
        'Valor Neto Pagar': factura.valor_neto_pagar,
        'Tipo Documento': factura.tipo_documento,
        Descripcion: factura.descripcion,
        Observaciones: factura.observaciones || '',
        'Cuenta Bancaria Proveedor': factura.cuenta_bancaria_proveedor || '',
        'Fecha Factura': factura.fecha_factura,
        'Fecha Recepcion': factura.fecha_recepcion,
        'Fecha Radicacion': factura.fecha_radicacion || '',
        'Fecha Causacion': factura.fecha_causacion || '',
        'Fecha Alistamiento': factura.fecha_alistamiento || '',
        'Fecha Aprobacion Auditoria': factura.fecha_aprobacion_auditoria || '',
        'Fecha Cargue': factura.fecha_cargue || '',
        'Fecha Autorizacion': factura.fecha_autorizacion || '',
        'Fecha Pago Aplicado': factura.fecha_pago_aplicado || '',
        'Fecha Comprobante': factura.fecha_comprobante || '',
        Estado: factura.estado,
        Etapa: factura.etapa_actual || '',
        'Indicador Riesgo': factura.indicador_riesgo,
        'SLA Cumplido': factura.sla_cumplido ? 'Si' : 'No',
        'Dias Transcurridos': factura.dias_transcurridos,
        'Responsable ID': factura.usuario_responsable_id || '',
        Responsable: factura.usuario_responsable?.nombre || '',
        Urgente: factura.urgente ? 'Si' : 'No',
        'Requiere Autorizacion Especial': factura.requiere_autorizacion_especial ? 'Si' : 'No',
        'Fecha Creacion': factura.fecha_creacion,
        'Fecha Modificacion': factura.fecha_modificacion,
        Documentos: documentos,
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(rows);
    worksheet['!cols'] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 12 },
      { wch: 32 },
      { wch: 16 },
      { wch: 16 },
      { wch: 26 },
      { wch: 18 },
      { wch: 16 },
      { wch: 20 },
      { wch: 20 },
      { wch: 14 },
      { wch: 26 },
      { wch: 14 },
      { wch: 26 },
      { wch: 14 },
      { wch: 26 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 24 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 16 },
      { wch: 12 },
      { wch: 24 },
      { wch: 24 },
      { wch: 40 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Facturas');
    XLSX.writeFile(workbook, `facturas-funcionario-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const clearFilters = () => {
    setNumeroFactura('');
    setProveedor('');
    setEstado('');
    setFechaInicio('');
    setFechaFin('');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
            <FileSearch className="w-6 h-6 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Consultar Facturas</h2>
            <p className="text-red-100">Visualiza y realiza seguimiento del estado de las facturas registradas</p>
          </div>
        </div>
      </motion.div>

      {estadoChanges.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-start gap-3">
          <Bell className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-semibold">Actualización de etapas detectada</p>
            <p>
              {estadoChanges[0].numeroFactura} pasó de {estadoChanges[0].estadoAnterior} a {estadoChanges[0].estadoNuevo}
              {estadoChanges.length > 1 ? ` y ${estadoChanges.length - 1} factura(s) más.` : '.'}
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        {loadError && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
            {loadError}
          </div>
        )}
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white">
              <Filter className="w-4 h-4" />
            </div>
            <div>
              <p className="text-base font-semibold text-slate-900">Filtros de búsqueda</p>
              <p className="text-xs text-slate-500">Consulta de facturas por criterios operativos</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters} 
            className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition-all"
          >
            Limpiar todo
          </motion.button>
        </div>

        <div className="flex flex-wrap items-end gap-3 mb-4 pb-4 border-b border-slate-200">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="min-w-0 flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Número de factura</label>
            <div className="relative">
              <Search className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                value={numeroFactura} 
                onChange={e => setNumeroFactura(e.target.value)} 
                className="w-full border border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-500 transition-all"
                placeholder="FAC-2024-001" 
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="min-w-0 flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Proveedor</label>
            <select 
              value={proveedor} 
              onChange={e => setProveedor(e.target.value)} 
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-500 transition-all"
            >
              <option value="">Todos</option>
              {proveedores.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="min-w-0 flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Estado</label>
            <select 
              value={estado} 
              onChange={e => setEstado(e.target.value)} 
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-500 transition-all"
            >
              <option value="">Todos</option>
              {estados.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="min-w-0 flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Desde</label>
            <div className="relative">
              <input 
                type="date" 
                value={fechaInicio} 
                onChange={e => setFechaInicio(e.target.value)} 
                className="w-full border border-slate-300 rounded-lg px-3 pr-10 py-2.5 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-500 transition-all"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="min-w-0 flex-1 max-w-xs">
            <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Hasta</label>
            <div className="relative">
              <input 
                type="date" 
                value={fechaFin} 
                onChange={e => setFechaFin(e.target.value)} 
                className="w-full border border-slate-300 rounded-lg px-3 pr-10 py-2.5 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-500 transition-all"
              />
              <Calendar className="w-4 h-4 text-slate-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </motion.div>

          </div>
      </div>

      {/* Tabla de Resultados */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.55 }}
        className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6 overflow-x-auto mt-6"
      >
        <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-slate-200">
          <div>
            <h3 className="text-xl font-bold text-slate-900">Resultados de la búsqueda</h3>
            <p className="text-sm text-slate-500 mt-1">{filtered.length} factura(s) encontrada(s) - Página {currentPage} de {totalPages || 1}</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={() => void handleExport()}
            disabled={filteredFacturas.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-green-500 text-green-600 hover:bg-green-50 font-semibold transition-all"
          >
            <Download className="w-4 h-4" /> Exportar
          </motion.button>
        </div>

        <div className="min-w-[1300px]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-300">
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Riesgo</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">ID Trámite</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Proveedor</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Área</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Monto</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Estado</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Etapa</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">N° Radicado</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Fecha</th>
                <th className="py-3 px-4 text-left text-xs font-bold text-slate-700 uppercase">Días</th>
                <th className="py-3 px-4 text-center text-xs font-bold text-slate-700 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td className="p-4 text-slate-500 text-center" colSpan={11}>Cargando facturas...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="p-4 text-slate-500 text-center" colSpan={11}>No hay resultados con los filtros actuales.</td></tr>
              ) : paginatedFiltered.map((row: FuncionarioConsultaRow, idx: number) => (
                <motion.tr 
                  key={row.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + idx * 0.05 }}
                  className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <td className="p-4">
                    <motion.div 
                      className={`w-4 h-4 rounded-full ${riskDot(row.riesgo)}`}
                      whileHover={{ scale: 1.3 }}
                      title={row.riesgo}
                    />
                  </td>
                  <td className="p-4 font-bold text-slate-900">{row.idTramite}</td>
                  <td className="p-4 text-slate-700 font-semibold">{row.proveedor}</td>
                  <td className="p-4 text-slate-700">{row.area}</td>
                  <td className="p-4 font-bold text-green-600">${row.monto.toLocaleString('es-CO')}</td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border-2 ${estadoBadge(row.estado)}`}>
                      {row.estado}
                    </span>
                  </td>
                  <td className="p-4 text-slate-700 text-sm">{inferEtapaActual(row.estado) || row.etapa}</td>
                  <td className="p-4">
                    {row.sinRadicado
                      ? <span className="text-slate-400 italic text-xs">{displayRadicado(row.numeroRadicado)}</span>
                      : <span className="text-slate-600 font-mono">{displayRadicado(row.numeroRadicado)}</span>
                    }
                  </td>
                  <td className="p-4 text-slate-700">{displayDate(row.fechaRecepcion)}</td>
                  <td className="p-4">
                    <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-xs font-bold ${diasBadge(row.dias)}`}>
                      {row.dias} {row.dias === 1 ? 'día' : 'días'}
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => void downloadDocumentosConsolidados(row.facturaId, row.idTramite, 'funcionario')}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-50 border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-100 font-semibold transition-all"
                      >
                        <Download className="w-4 h-4" /> Docs
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedId(row.id);
                          setOpenDetail(true);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-50 border-2 border-red-300 text-red-600 hover:bg-red-100 font-semibold transition-all"
                      >
                        <Eye className="w-4 h-4" /> Ver
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginación */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
            <div className="text-sm text-slate-600">
              Mostrando {((currentPage - 1) * itemsPerPage) + 1} a {Math.min(currentPage * itemsPerPage, filtered.length)} de {filtered.length} resultados
            </div>
            <div className="flex items-center gap-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                ← Anterior
              </motion.button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <motion.button
                      key={pageNum}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-slate-900 text-white'
                          : 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      {pageNum}
                    </motion.button>
                  );
                })}
              </div>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
              >
                Siguiente →
              </motion.button>
            </div>
          </div>
        )}
      </motion.div>

      <FacturaDetailModal
        isOpen={openDetail}
        onClose={() => {
          setOpenDetail(false);
          setSelectedDetail(null);
          if (searchParams.get('factura')) {
            const nextParams = new URLSearchParams(searchParams);
            nextParams.delete('factura');
            setSearchParams(nextParams, { replace: true });
          }
        }}
        factura={selectedDetail}
      />

      {detailLoading && (
        <div className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 text-slate-700 text-sm shadow-lg">
            Cargando detalle y timeline de la factura...
          </div>
        </div>
      )}
    </div>
  );
}
