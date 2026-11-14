import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Button } from '../../../../../components/ui/button';
import { AlertTriangle, ChevronLeft, ChevronRight, Eye, FileText, FolderKanban, Loader2, RefreshCw } from 'lucide-react';
import { currency, ACTIVITIES_PER_PAGE } from '../../../hooks/admin_financiero/adminFinancieroHomeUtils';
import type { useAdminFinancieroHome } from '../../../hooks/admin_financiero/useAdminFinancieroHome';

type Gestion = ReturnType<typeof useAdminFinancieroHome>;

/** Panel de seguimiento y trazabilidad. */
export function SeguimientoAdminHome({ loading, refreshing, error, activityPage, setActivityPage, kanbanPage, setKanbanPage, fetchDashboard, KANBAN_PER_PAGE, resumen, distribucion, feedUnificado, totalActivityPages, pagedFeed, totalKanbanPages, pagedKanban, kpiCards }: Pick<Gestion, 'loading' | 'refreshing' | 'error' | 'activityPage' | 'setActivityPage' | 'kanbanPage' | 'setKanbanPage' | 'fetchDashboard' | 'KANBAN_PER_PAGE' | 'resumen' | 'distribucion' | 'feedUnificado' | 'totalActivityPages' | 'pagedFeed' | 'totalKanbanPages' | 'pagedKanban' | 'kpiCards'>) {
  return (
    <>
      {!loading && !error && resumen && (
        <>
          {/* KPI Cards principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {kpiCards.map((card) => {
              const Icon = card.icon;
              return (
                <motion.div
                  key={card.title}
                  whileHover={{ y: -5, scale: 1.01 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                >
                  <Card onClick={card.onClick} className={`cursor-pointer bg-gradient-to-br ${card.bgClass} hover:shadow-lg transition-all`}>
                    <CardContent className="p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-600">{card.title}</p>
                          <p className="text-3xl font-black text-slate-900">{card.value}</p>
                        </div>
                        <div className="rounded-xl bg-white/70 p-2 shadow-sm">
                          <Icon className={`w-6 h-6 ${card.iconClass}`} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-xs text-slate-600">{card.subtitle}</p>
                        <div className="h-1.5 rounded-full bg-white/80 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, Math.max(0, card.progress))}%` }}
                            transition={{ duration: 0.6, ease: 'easeOut' }}
                            className={`h-1.5 ${card.progressClass}`}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Panel de seguimiento y actividad reciente */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-slate-900">Panel de seguimiento y trazabilidad</CardTitle>
                    <CardDescription>
                      Consulta el estado general del proceso en el Kanban resumido y revisa al mismo tiempo los movimientos más recientes del módulo.
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => void fetchDashboard(true)}
                    variant="outline"
                    disabled={refreshing}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50 shrink-0"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                  {/* Panel de seguimiento */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Panel de seguimiento</h3>
                        <p className="text-sm text-slate-500">Identifica rápidamente en qué etapas se concentra hoy el mayor volumen de facturas.</p>
                      </div>
                      {distribucion.length > KANBAN_PER_PAGE && (
                        <Badge variant="outline" className="shrink-0">
                          {kanbanPage} / {totalKanbanPages}
                        </Badge>
                      )}
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-10 text-slate-400">
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Cargando flujo...
                      </div>
                    ) : distribucion.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                        <FolderKanban className="mx-auto mb-3 h-8 w-8 opacity-30" />
                        Sin movimiento visible en este momento.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="grid gap-3">
                          {pagedKanban.map((item) => (
                            <div key={item.estado} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                              <div className="min-w-0">
                                <p className="truncate font-semibold text-slate-900">{item.estado}</p>
                                <p className="mt-1 text-sm text-slate-500">{item.cantidad} factura(s)</p>
                              </div>
                              <Badge className="bg-red-100 text-red-700 border border-red-200 shrink-0">{item.cantidad}</Badge>
                            </div>
                          ))}
                        </div>

                        {totalKanbanPages > 1 && (
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <p className="text-sm text-slate-500">
                              {(kanbanPage - 1) * KANBAN_PER_PAGE + 1}–{Math.min(kanbanPage * KANBAN_PER_PAGE, distribucion.length)} de {distribucion.length}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setKanbanPage((p) => Math.max(1, p - 1))}
                                disabled={kanbanPage === 1}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Anterior
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setKanbanPage((p) => Math.min(totalKanbanPages, p + 1))}
                                disabled={kanbanPage === totalKanbanPages}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Siguiente
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actividad reciente + alertas unificadas */}
                  <div className="space-y-4 border-t border-slate-200 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h3 className="text-base font-semibold text-slate-900">Actividad reciente</h3>
                        <p className="text-sm text-slate-500">Sigue los últimos cambios y alertas de riesgo del flujo financiero.</p>
                      </div>
                      {feedUnificado.length > ACTIVITIES_PER_PAGE && (
                        <Badge variant="outline">
                          Página {activityPage} de {totalActivityPages}
                        </Badge>
                      )}
                    </div>

                    {loading ? (
                      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-10 text-slate-400">
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        Cargando actividad...
                      </div>
                    ) : feedUnificado.length === 0 ? (
                      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                        <FileText className="mx-auto mb-3 h-8 w-8 opacity-30" />
                        No hay actividad reciente.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {pagedFeed.map((item, index) => (
                          <motion.div
                            key={item.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.24 + index * 0.05 }}
                            className={`w-full rounded-2xl border p-4 ${
                              item.tipo === 'alerta'
                                ? 'border-amber-200 bg-amber-50/40'
                                : 'border-slate-200 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="truncate font-semibold text-slate-900">{item.titulo}</p>
                                  {item.tipo === 'alerta' ? (
                                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
                                  ) : (
                                    <Eye className="h-4 w-4 shrink-0 text-red-600" />
                                  )}
                                </div>
                                <p className="mt-1 truncate text-sm text-slate-600">{item.subtitulo}</p>
                              </div>
                              {item.valor != null && (
                                <p className="shrink-0 text-sm font-bold text-slate-900">
                                  {currency.format(item.valor)}
                                </p>
                              )}
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                              {item.riesgo && (
                                <Badge className={`border ${item.riesgo === 'vencida' || item.riesgo === 'atrasada' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-100 text-amber-700 border-amber-200'}`}>
                                  {item.riesgo}
                                </Badge>
                              )}
                              {item.estado && (
                                <Badge variant="outline">{item.estado}</Badge>
                              )}
                            </div>
                          </motion.div>
                        ))}

                        {totalActivityPages > 1 && (
                          <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                            <p className="text-sm text-slate-500">
                              Mostrando {(activityPage - 1) * ACTIVITIES_PER_PAGE + 1} a {Math.min(activityPage * ACTIVITIES_PER_PAGE, feedUnificado.length)} de {feedUnificado.length}
                            </p>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                                disabled={activityPage === 1}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                <ChevronLeft className="mr-1 h-4 w-4" />
                                Anterior
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setActivityPage((p) => Math.min(totalActivityPages, p + 1))}
                                disabled={activityPage === totalActivityPages}
                                className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                              >
                                Siguiente
                                <ChevronRight className="ml-1 h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </>
      )}
    </>
  );
}
