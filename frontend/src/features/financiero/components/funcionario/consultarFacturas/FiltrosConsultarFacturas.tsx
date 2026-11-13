import { motion } from 'framer-motion';
import { Calendar, Search, Filter } from 'lucide-react';
import type { useConsultarFacturas } from '../../../hooks/funcionario/useConsultarFacturas';

type Gestion = ReturnType<typeof useConsultarFacturas>;

/** Filtros de la consulta de facturas. */
export function FiltrosConsultarFacturas({ loadError, numeroFactura, setNumeroFactura, estado, setEstado, fechaInicio, setFechaInicio, fechaFin, setFechaFin, ordenDias, setOrdenDias, estados, clearFilters }: Pick<Gestion, 'loadError' | 'numeroFactura' | 'setNumeroFactura' | 'estado' | 'setEstado' | 'fechaInicio' | 'setFechaInicio' | 'fechaFin' | 'setFechaFin' | 'ordenDias' | 'setOrdenDias' | 'estados' | 'clearFilters'>) {
  return (
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
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="min-w-0 flex-1 basis-0">
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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="min-w-0 flex-1 basis-0">
          <label className="block text-xs font-semibold text-slate-700 mb-1 uppercase tracking-wide">Ordenar por días</label>
          <select
            value={ordenDias}
            onChange={e => setOrdenDias(e.target.value as 'recientes' | 'antiguos')}
            className="w-full border border-slate-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-slate-900/20 focus:border-slate-500 transition-all"
          >
            <option value="antiguos">Más antiguos primero</option>
            <option value="recientes">Más recientes primero</option>
          </select>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="min-w-0 flex-1 basis-0">
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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="min-w-0 flex-1 basis-0">
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

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="min-w-0 flex-1 basis-0">
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
  );
}
