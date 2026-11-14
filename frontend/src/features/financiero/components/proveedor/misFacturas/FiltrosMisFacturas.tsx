import { Search } from 'lucide-react';
import type { useMisFacturas } from '../../../hooks/proveedor/useMisFacturas';

type Gestion = ReturnType<typeof useMisFacturas>;

/** Búsqueda y filtros de las facturas. */
export function FiltrosMisFacturas({ search, setSearch, estadoFiltro, setEstadoFiltro, estados }: Pick<Gestion, 'search' | 'setSearch' | 'estadoFiltro' | 'setEstadoFiltro' | 'estados'>) {
  return (
    <div className="flex flex-col md:flex-row gap-3">
      <div className="relative flex-1">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por numero, radicado o identificacion..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
        />
      </div>
      <select
        id="estado-filtro"
        aria-label="Filtrar por estado de factura"
        value={estadoFiltro}
        onChange={e => setEstadoFiltro(e.target.value)}
        className="px-3 py-2.5 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
      >
        <option value="">Todos</option>
        {estados.map(e => (
          <option key={e} value={e}>{e === '__rechazadas' ? 'Rechazadas' : e}</option>
        ))}
      </select>
    </div>
  );
}
