import { motion } from 'framer-motion';
import { Button } from '../../../../../components/ui/button';
import { RefreshCw } from 'lucide-react';
import type { useAdminFinancieroHome } from '../../../hooks/admin_financiero/useAdminFinancieroHome';

type Gestion = ReturnType<typeof useAdminFinancieroHome>;

/** Encabezado del panel de administración financiera. */
export function EncabezadoAdminHome({ refreshing, lastUpdated, fetchDashboard, resumen, saludOperativa, visibleQuickActions, onNavigate }: Pick<Gestion, 'refreshing' | 'lastUpdated' | 'fetchDashboard' | 'resumen' | 'saludOperativa' | 'visibleQuickActions' | 'onNavigate'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-800 via-red-700 to-red-900 p-6 text-white shadow-xl"
    >
      <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-red-500/50 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-1/3 h-40 w-40 rounded-full bg-amber-400/20 blur-2xl" />

      <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Panel de Administración Financiera</h1>
          <p className="mt-2 text-sm leading-6 text-red-50/90">
            Monitoreo operativo, alertas y control integral del flujo financiero desde una vista ejecutiva accionable.
          </p>
          <p className="mt-1 text-xs text-red-200/80">
            {lastUpdated ? `Última actualización: ${lastUpdated.toLocaleString('es-CO')}` : 'Sincronizando información...'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              Salud operativa: {saludOperativa.toFixed(0)}%
            </span>
            <span className="rounded-full bg-white/10 px-3 py-1">En proceso: {resumen?.facturas_en_proceso ?? 0}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">Riesgo: {resumen?.facturas_riesgo ?? 0}</span>
          </div>
        </div>

        {/* Accesos rápidos en el header */}
        <div className="flex flex-col items-start gap-3 xl:items-end xl:shrink-0">
          <Button
            onClick={() => void fetchDashboard(true)}
            disabled={refreshing}
            className="self-end bg-white/15 border border-white/30 hover:bg-white/25 text-white"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </Button>
          <div className="flex gap-2">
            {visibleQuickActions.map((qa) => {
              const Icon = qa.icon;
              return (
                <button
                  key={qa.menu}
                  onClick={() => onNavigate(qa.menu)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl bg-white/10 border border-white/20 px-5 py-3 text-center text-white transition-all hover:bg-white/20 min-w-[80px]"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{qa.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
