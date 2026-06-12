import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../share/card';
import { Button } from '../../../share/button';
import {
  Calculator,
  Clock,
  Loader2,
} from 'lucide-react';
import type { ContabilidadHomePropsModel } from '../../../models/financiero/contabilidad';
import { useContabilidadHome } from '../../../hooks/financiero/contabilidad';

export default function ContabilidadHome({
  onGoToPendientes,
  onGoToRadicar,
  onGoToCausar,
}: ContabilidadHomePropsModel) {
  const { 
    loadingStats, 
    stats, 
    quickActions, 
    recentActivity, 
    currentPage, 
    setCurrentPage, 
    totalPages, 
    getEstadoBadge 
  } = useContabilidadHome({
    onGoToPendientes,
    onGoToRadicar,
    onGoToCausar,
  });

  return (
    <div className="space-y-4">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-5 text-white shadow-xl"
      >
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
            <Calculator className="w-6 h-6 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-0 text-2xl font-bold">
              Panel de Contabilidad
            </h1>
            <p className="text-red-100 text-sm">
              Gestiona la radicación y causación de cuentas por pagar
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-red-100">
          <Clock className="w-3 h-3" />
          <span>Última actualización: Hoy, 13 de Abril 2026 - 11:15 AM</span>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}
                    >
                      <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-slate-800 mb-0">
                      {stat.value}
                    </p>
                    <p className="text-xs text-slate-600 mb-1">{stat.title}</p>
                    <p className="text-xs text-slate-500">{stat.trend}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              onClick={action.action}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-12 h-12 bg-gradient-to-br ${action.color} rounded-lg flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-slate-800 mb-1 group-hover:text-red-600 transition-colors text-sm">
                        {action.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-2">{action.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card className="border-0 shadow-lg bg-white">
          <CardContent className="p-8">
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-5 h-5 text-red-600" />
                <h2 className="text-xl font-bold text-slate-800">Actividad Reciente</h2>
              </div>
              <p className="text-sm text-slate-600">
                Últimas acciones realizadas en el área de contabilidad
              </p>
            </div>
            {loadingStats ? (
              <div className="flex items-center justify-center py-8 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mr-2" /> Cargando actividad...
              </div>
            ) : recentActivity.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No hay actividad reciente registrada.</p>
            ) : (
              <>
                <div className="space-y-3">
                  {recentActivity.slice(0, 5).map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center flex-shrink-0">
                          <Calculator className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-slate-800 text-base">
                              {item.accion || 'Movimiento contable'} - {item.numero_factura || `Factura ${item.factura_id}`}
                            </p>
                            <span className={`text-xs px-2 py-1 rounded-full border whitespace-nowrap ${getEstadoBadge(item.estado_nuevo ?? '')} `}>
                              {item.estado_nuevo ?? item.accion}
                            </span>
                          </div>
                          <p className="text-sm text-slate-600 truncate">{item.accion}{item.observacion ? ` — ${item.observacion}` : ''}</p>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0 ml-3">
                        <p className="text-sm text-slate-500">{item.fecha_accion?.slice(0, 16).replace('T', ' ')}</p>
                        {item.usuario_nombre && <p className="text-xs text-slate-400 truncate">{item.usuario_nombre}</p>}
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Controles de Paginación */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 pt-4 border-t border-slate-200">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((prev: number) => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-1 h-7"
                    >
                      Ant.
                    </Button>
                    
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => {
                        if (totalPages <= 3) return i + 1;
                        if (currentPage <= 2) return i + 1;
                        if (currentPage >= totalPages - 1) return totalPages - 2 + i;
                        return currentPage - 1 + i;
                      }).map((pageNum) => (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={currentPage === pageNum ? "default" : "outline"}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`text-xs px-2 py-1 h-7 ${currentPage === pageNum ? "bg-red-600 text-white hover:bg-red-700" : "border-slate-300 text-slate-700 hover:bg-slate-50"}`}
                        >
                          {pageNum}
                        </Button>
                      ))}
                    </div>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setCurrentPage((prev: number) => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed text-xs px-2 py-1 h-7"
                    >
                      Sig.
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
