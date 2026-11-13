import { motion } from 'framer-motion';
import { Badge } from '../../../../../components/ui/badge';
import { SlidersHorizontal } from 'lucide-react';
import type { useConfiguracionFinanciera } from '../../../hooks/admin_financiero/useConfiguracionFinanciera';

type Gestion = ReturnType<typeof useConfiguracionFinanciera>;

/** Título y acciones de la configuración. */
export function EncabezadoConfiguracion({ editable, grouped, totalCambiosPendientes }: Pick<Gestion, 'editable' | 'grouped' | 'totalCambiosPendientes'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl"
    >
      <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <SlidersHorizontal className="w-8 h-8 text-amber-300" />
            Configuración del Sistema Financiero
          </h1>
          <p className="text-rose-100 text-sm mt-1">Centro de control de políticas, alertas y reglas operativas con cambios visibles, agrupados y fáciles de seguir.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge className="border border-white/20 bg-white/10 text-white">Editables: {editable.length}</Badge>
            <Badge className="border border-white/20 bg-white/10 text-white">Categorías: {Object.keys(grouped).length}</Badge>
          </div>
        </div>
        <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs">
          <p className="font-semibold">Cambios pendientes</p>
          <p className="text-2xl font-bold leading-none mt-1">{totalCambiosPendientes}</p>
        </div>
      </div>
    </motion.div>
  );
}
