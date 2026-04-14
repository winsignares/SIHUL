import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Download, Eye, Search, Filter, DollarSign, FileSearch } from 'lucide-react';
import { facturasService } from '../../../services/financiero';
import type { Factura } from '../../../models/financiero';
import FacturaDetailModal from './FacturaDetailModal.tsx';

type Row = {
  id: string;
  riesgo: 'verde' | 'amarillo' | 'naranja' | 'vencido';
  idTramite: string;
  proveedor: string;
  area: string;
  monto: number;
  estado: string;
  etapa: string;
  numeroRadicado: string;
  fecha: string;
  dias: number;
};

const mockRows: Row[] = [
  {
    id: '1',
    riesgo: 'verde',
    idTramite: 'FAC-2026-150',
    proveedor: 'Editorial Academica Colombia',
    area: 'Biblioteca',
    monto: 3200000,
    estado: 'Recibida',
    etapa: 'Radicacion Contable',
    numeroRadicado: '-',
    fecha: '2026-04-01',
    dias: 1,
  },
  {
    id: '2',
    riesgo: 'verde',
    idTramite: 'FAC-2026-145',
    proveedor: 'Tecnologia Global SAS',
    area: 'Sistemas',
    monto: 8900000,
    estado: 'Radicada',
    etapa: 'Causacion Contable',
    numeroRadicado: 'RAD-2026-00145',
    fecha: '2026-03-25',
    dias: 4,
  },
  {
    id: '3',
    riesgo: 'verde',
    idTramite: 'FAC-2026-142',
    proveedor: 'Mantenimiento y Obras SAS',
    area: 'Mantenimiento',
    monto: 5600000,
    estado: 'Causada',
    etapa: 'Alistamiento de Pago',
    numeroRadicado: 'RAD-2026-00142',
    fecha: '2026-03-20',
    dias: 11,
  },
];

function mapFactura(f: Factura): Row {
  const dias = Number(f.dias_transcurridos || 0);
  let riesgo: Row['riesgo'] = 'verde';
  if (dias > 15) riesgo = 'vencido';
  else if (dias > 10) riesgo = 'naranja';
  else if (dias > 5) riesgo = 'amarillo';

  return {
    id: String(f.id),
    riesgo,
    idTramite: f.numero_factura || `FAC-${f.id}`,
    proveedor: f.proveedor?.razon_social || 'Proveedor sin nombre',
    area: f.departamento?.nombre || 'Sin area',
    monto: Number(f.valor_total || 0),
    estado: f.estado || 'Recibida',
    etapa: f.etapa_actual || 'Radicacion Contable',
    numeroRadicado: f.numero_radicado || '-',
    fecha: f.fecha_factura || '',
    dias,
  };
}

export default function ConsultarFacturas() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [numeroFactura, setNumeroFactura] = useState('');
  const [proveedor, setProveedor] = useState('');
  const [estado, setEstado] = useState('');
  const [area, setArea] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [montoMin, setMontoMin] = useState('0');
  const [montoMax, setMontoMax] = useState('999999999');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const response = await facturasService.getAll({ limit: 100 });
        const apiRows = Array.isArray(response?.results) ? response.results.map(mapFactura) : [];
        setRows(apiRows.length ? apiRows : mockRows);
      } catch {
        setRows(mockRows);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const proveedores = useMemo(() => Array.from(new Set(rows.map(r => r.proveedor))), [rows]);
  const estados = useMemo(() => Array.from(new Set(rows.map(r => r.estado))), [rows]);
  const areas = useMemo(() => Array.from(new Set(rows.map(r => r.area))), [rows]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (numeroFactura && !r.idTramite.toLowerCase().includes(numeroFactura.toLowerCase())) return false;
      if (proveedor && r.proveedor !== proveedor) return false;
      if (estado && r.estado !== estado) return false;
      if (area && r.area !== area) return false;
      if (fechaInicio && r.fecha && r.fecha < fechaInicio) return false;
      if (fechaFin && r.fecha && r.fecha > fechaFin) return false;
      if (montoMin && r.monto < Number(montoMin)) return false;
      if (montoMax && r.monto > Number(montoMax)) return false;
      return true;
    });
  }, [rows, numeroFactura, proveedor, estado, area, fechaInicio, fechaFin, montoMin, montoMax]);

  const selectedRow = filtered.find((r) => r.id === selectedId) || rows.find((r) => r.id === selectedId) || null;

  const estadoBadge = (value: string) => {
    if (value === 'Recibida') return 'bg-blue-100 text-blue-700 border-blue-200';
    if (value === 'Radicada') return 'bg-green-100 text-green-700 border-green-200';
    if (value === 'Causada') return 'bg-purple-100 text-purple-700 border-purple-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const riskDot = (risk: Row['riesgo']) => {
    if (risk === 'vencido') return 'bg-purple-700';
    if (risk === 'naranja') return 'bg-orange-500';
    if (risk === 'amarillo') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const clearFilters = () => {
    setNumeroFactura('');
    setProveedor('');
    setEstado('');
    setArea('');
    setFechaInicio('');
    setFechaFin('');
    setMontoMin('0');
    setMontoMax('999999999');
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

      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6 pb-4 border-b-2 border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shadow-lg">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">Filtros de Búsqueda</p>
              <p className="text-xs text-slate-500">Refine sus criterios para encontrar las facturas</p>
            </div>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
            onClick={clearFilters} 
            className="px-4 py-2.5 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-semibold transition-all"
          >
            🔄 Limpiar Todo
          </motion.button>
        </div>

        {/* Fila 1: Número, Proveedor, Estado, Área */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-slate-200">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">🔍 Número de Factura</label>
            <div className="relative">
              <Search className="w-4 h-4 text-red-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                value={numeroFactura} 
                onChange={e => setNumeroFactura(e.target.value)} 
                className="w-full border-2 border-slate-300 rounded-lg pl-9 pr-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                placeholder="FAC-2024-001" 
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">🏢 Proveedor</label>
            <select 
              value={proveedor} 
              onChange={e => setProveedor(e.target.value)} 
              className="w-full border-2 border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            >
              <option value="">Todos</option>
              {proveedores.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">📊 Estado</label>
            <select 
              value={estado} 
              onChange={e => setEstado(e.target.value)} 
              className="w-full border-2 border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            >
              <option value="">Todos</option>
              {estados.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <label className="block text-xs font-bold text-slate-700 mb-2 uppercase tracking-wide">🏭 Área Solicitante</label>
            <select 
              value={area} 
              onChange={e => setArea(e.target.value)} 
              className="w-full border-2 border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
            >
              <option value="">Todas</option>
              {areas.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </motion.div>
        </div>

        {/* Fila 2: Rango de Fechas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-slate-200">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-1">
              <Calendar className="w-4 h-4 text-blue-500" /> 📅 Rango de Fechas
            </label>
          </div>
          
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <label className="block text-xs text-slate-600 mb-2 font-semibold">desde</label>
            <div className="relative">
              <input 
                type="date" 
                value={fechaInicio} 
                onChange={e => setFechaInicio(e.target.value)} 
                className="w-full border-2 border-blue-300 rounded-lg px-3 pr-10 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <Calendar className="w-4 h-4 text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <label className="block text-xs text-slate-600 mb-2 font-semibold">hasta</label>
            <div className="relative">
              <input 
                type="date" 
                value={fechaFin} 
                onChange={e => setFechaFin(e.target.value)} 
                className="w-full border-2 border-blue-300 rounded-lg px-3 pr-10 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
              />
              <Calendar className="w-4 h-4 text-blue-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
            <label className="block text-xs text-slate-600 mb-2 font-semibold">días</label>
            <div className="w-full h-11 rounded-lg border-2 border-slate-300 flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-700">
              {fechaInicio && fechaFin ? Math.round((new Date(fechaFin).getTime() - new Date(fechaInicio).getTime()) / (1000 * 60 * 60 * 24)) + ' días' : '—'}
            </div>
          </motion.div>
        </div>

        {/* Fila 3: Rango de Montos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-3 uppercase tracking-wide flex items-center gap-1">
              <DollarSign className="w-4 h-4 text-green-500" /> 💰 Rango de Montos
            </label>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <label className="block text-xs text-slate-600 mb-2 font-semibold">mínimo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
              <input 
                type="number" 
                value={montoMin} 
                onChange={e => setMontoMin(e.target.value)} 
                className="w-full border-2 border-green-300 rounded-lg pl-8 pr-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
            <label className="block text-xs text-slate-600 mb-2 font-semibold">máximo</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 font-bold">$</span>
              <input 
                type="number" 
                value={montoMax} 
                onChange={e => setMontoMax(e.target.value)} 
                className="w-full border-2 border-green-300 rounded-lg pl-8 pr-3 py-2.5 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
              />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <label className="block text-xs text-slate-600 mb-2 font-semibold">rango</label>
            <div className="w-full h-11 rounded-lg border-2 border-slate-300 flex items-center justify-center bg-slate-50 text-sm font-semibold text-slate-700">
              ${Number(montoMin || 0).toLocaleString('es-CO')} - ${Number(montoMax || 0).toLocaleString('es-CO')}
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
            <h3 className="text-xl font-bold text-slate-900">📋 Resultados de la Búsqueda</h3>
            <p className="text-sm text-slate-500 mt-1">{filtered.length} factura(s) encontrada(s)</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }} 
            whileTap={{ scale: 0.95 }}
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
                <tr><td className="p-4 text-slate-500 text-center" colSpan={11}>⏳ Cargando facturas...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td className="p-4 text-slate-500 text-center" colSpan={11}>📭 No hay resultados con los filtros actuales</td></tr>
              ) : filtered.map((row, idx) => (
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
                  <td className="p-4 text-slate-700 text-sm">{row.etapa}</td>
                  <td className="p-4 text-slate-600 font-mono">{row.numeroRadicado}</td>
                  <td className="p-4 text-slate-700">{row.fecha || '—'}</td>
                  <td className="p-4 font-semibold text-slate-900">{row.dias} días</td>
                  <td className="p-4 text-center">
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
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <FacturaDetailModal
        open={openDetail}
        onClose={() => setOpenDetail(false)}
        factura={
          selectedRow
            ? {
                idTramite: selectedRow.idTramite,
                proveedor: selectedRow.proveedor,
                valorTotal: selectedRow.monto,
                fechaInicio: selectedRow.fecha,
                progreso: Math.max(8, Math.min(92, Math.round((selectedRow.dias / 17) * 100))),
                etapaActual: selectedRow.etapa,
              }
            : null
        }
      />
    </div>
  );
}
