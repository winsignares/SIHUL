import { motion } from 'framer-motion';
import type { useMisFacturas } from '../../../hooks/proveedor/useMisFacturas';

type Gestion = ReturnType<typeof useMisFacturas>;

/** Totales de las facturas por estado. */
export function ResumenMisFacturas({ facturas }: Pick<Gestion, 'facturas'>) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Total', value: facturas.length, color: 'text-slate-900 dark:text-white', bg: 'bg-slate-100 dark:bg-slate-700' },
        { label: 'En Proceso', value: facturas.filter((f) => !['Pagada', 'Rechazada', 'Anulada', 'Devuelta'].includes(f.estado)).length, color: 'text-rose-800 dark:text-rose-200', bg: 'bg-rose-50 dark:bg-rose-900/20' },
        { label: 'Pagadas', value: facturas.filter((f) => f.estado === 'Pagada' || f.estado === 'Pago Aplicado').length, color: 'text-green-700 dark:text-green-300', bg: 'bg-green-50 dark:bg-green-900/20' },
        { label: 'Devueltas', value: facturas.filter((f) => f.estado === 'Devuelta' || f.estado === 'Rechazada').length, color: 'text-amber-800 dark:text-amber-300', bg: 'bg-amber-50 dark:bg-amber-900/20' },
      ].map((stat, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className={`${stat.bg} rounded-xl p-4 border border-slate-200/60 dark:border-slate-600/40`}
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</p>
          <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
}
