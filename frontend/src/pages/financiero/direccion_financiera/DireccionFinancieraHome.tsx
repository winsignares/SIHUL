import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import {
  Loader2,
  Upload,
  CheckCircle2,
  FileText,
  Eye,
  RefreshCw,
  AlertCircle,
  Landmark,
  Briefcase,
  ShieldCheck,
  ArrowRight,
  FolderKanban,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import KanbanVistaCompleta from './KanbanVistaCompleta';
import { useDireccionFinancieraHome } from '../../../hooks/financiero/direccion_financiera';

interface DireccionFinancieraHomeProps {
  onGoToPendientes: () => void;
  onGoToRevisar: () => void;
  onGoToEnviar: () => void;
  onGoToConfirmar: () => void;
}

export default function DireccionFinancieraHome({
  onGoToRevisar,
  onGoToConfirmar,
}: DireccionFinancieraHomeProps) {
  const [activityPage, setActivityPage] = useState(1);
  const {
    cargando,
    error,
    stats,
    kanbanEstados,
    actividadesRecientes,
    selectedFactura,
    showDetailModal,
    showKanbanCompleto,
    setShowDetailModal,
    setShowKanbanCompleto,
    setSelectedFactura,
    handleClickActividad,
    getEstadoBadge,
    recargarDatos,
  } = useDireccionFinancieraHome();

  const quickActions = [
    {
      title: 'Cargue y Revision',
      description: 'Validar expedientes y mover a Rectoria',
      icon: ShieldCheck,
      action: onGoToRevisar,
      className: 'bg-red-600 hover:bg-red-700 text-white',
    },
    {
      title: 'Control Bancario',
      description: 'Confirmar cierre de pago',
      icon: Landmark,
      action: onGoToConfirmar,
      className: 'bg-white hover:bg-slate-50 text-slate-900 border border-slate-200',
    },
  ];

  const statsData = [
    {
      title: 'Pendientes de Cargue',
      value: stats.facturasPorCargar,
      icon: FileText,
      accent: 'text-red-700 bg-red-50',
    },
    {
      title: 'Pendientes de Revision',
      value: stats.pendientesRevision,
      icon: ShieldCheck,
      accent: 'text-amber-700 bg-amber-50',
    },
    {
      title: 'Listas para Rectoria',
      value: stats.listasParaEnviar,
      icon: Upload,
      accent: 'text-blue-700 bg-blue-50',
    },
    {
      title: 'Cargadas en el Ciclo',
      value: stats.cargadasEsteMes,
      icon: CheckCircle2,
      accent: 'text-emerald-700 bg-emerald-50',
    },
  ];

  const kanbanResumen = kanbanEstados
    .filter((item) => item.cantidad > 0)
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5);

  const ACTIVITIES_PER_PAGE = 3;
  const totalActivityPages = Math.max(1, Math.ceil(actividadesRecientes.length / ACTIVITIES_PER_PAGE));

  const pagedActivities = useMemo(() => {
    const start = (activityPage - 1) * ACTIVITIES_PER_PAGE;
    return actividadesRecientes.slice(start, start + ACTIVITIES_PER_PAGE);
  }, [actividadesRecientes, activityPage]);

  useEffect(() => {
    setActivityPage(1);
  }, [actividadesRecientes.length]);

  useEffect(() => {
    setActivityPage((prev) => Math.min(prev, totalActivityPages));
  }, [totalActivityPages]);

  return (
    <>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[28px] bg-gradient-to-r from-red-800 via-red-700 to-red-900 p-6 text-white shadow-xl"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Briefcase className="h-7 w-7 text-amber-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Direccion Financiera y Sindicatura</h1>
                  <p className="mt-2 text-sm leading-6 text-red-50/90">
                    Gestiona cargue final, remision a Rectoria y control bancario desde una vista resumida y accionable.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="border border-white/15 bg-white/10 text-white">Revision activa: {cargando ? '--' : stats.pendientesRevision}</Badge>
                <Badge className="border border-white/15 bg-white/10 text-white">Por mover: {cargando ? '--' : stats.facturasPorCargar + stats.listasParaEnviar}</Badge>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px]">
              {quickActions.map((action) => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.title}
                    onClick={action.action}
                    className={`rounded-2xl px-4 py-4 text-left transition-all ${action.className}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <Icon className="h-5 w-5" />
                      <ArrowRight className="h-4 w-4 opacity-70" />
                    </div>
                    <p className="mt-4 text-sm font-bold">{action.title}</p>
                    <p className={`mt-1 text-xs ${action.className.includes('text-white') ? 'text-red-100' : 'text-slate-500'}`}>
                      {action.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </motion.div>

        {error && (
          <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            <AlertCircle className="h-5 w-5" />
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
                <Card className="border border-slate-200 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-slate-500">{stat.title}</p>
                        <p className="mt-2 text-3xl font-black text-slate-900">{cargando ? '--' : stat.value}</p>
                      </div>
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.accent}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-slate-900">Panel de seguimiento y trazabilidad</CardTitle>
                  <CardDescription>Consulta el estado general del proceso en el Kanban resumido y revisa al mismo tiempo los movimientos mas recientes del modulo.</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={recargarDatos} variant="outline" disabled={cargando} className="border-slate-300 text-slate-700 hover:bg-slate-50">
                    <RefreshCw className={`mr-2 h-4 w-4 ${cargando ? 'animate-spin' : ''}`} />
                    Actualizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-start">
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Kanban resumido</h3>
                      <p className="text-sm text-slate-500">Identifica rapidamente en que etapas se concentra hoy el mayor volumen de facturas.</p>
                    </div>
                    <Button onClick={() => setShowKanbanCompleto(true)} className="bg-amber-500 text-slate-950 hover:bg-amber-400 sm:shrink-0">
                      Ver completo
                    </Button>
                  </div>

                  {cargando ? (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-10 text-slate-400">
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Cargando flujo...
                    </div>
                  ) : kanbanResumen.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                      <FolderKanban className="mx-auto mb-3 h-8 w-8 opacity-30" />
                      Sin movimiento visible en este momento.
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {kanbanResumen.map((item) => (
                        <div key={item.estado} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4">
                          <div className="min-w-0">
                            <p className="truncate font-semibold text-slate-900">{item.estado}</p>
                            <p className="mt-1 text-sm text-slate-500">{item.cantidad} factura(s)</p>
                          </div>
                          <Badge className={`${item.color} border shrink-0`}>{item.cantidad}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4 border-t border-slate-200 pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900">Actividad reciente</h3>
                      <p className="text-sm text-slate-500">Sigue los ultimos cambios realizados sobre facturas y expedientes del flujo.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {actividadesRecientes.length > ACTIVITIES_PER_PAGE && (
                        <Badge variant="outline">
                          Pagina {activityPage} de {totalActivityPages}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {cargando ? (
                    <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-10 text-slate-400">
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Cargando actividad...
                    </div>
                  ) : actividadesRecientes.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                      <FileText className="mx-auto mb-3 h-8 w-8 opacity-30" />
                      No hay actividad reciente.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {pagedActivities.map((item, index) => (
                        <motion.button
                          key={`${item.numeroFactura}-${index}`}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.24 + index * 0.05 }}
                          onClick={() => handleClickActividad(item)}
                          className="w-full rounded-2xl border border-slate-200 bg-white p-4 text-left transition-colors hover:bg-slate-50"
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="truncate font-semibold text-slate-900">{item.numeroFactura}</p>
                                <Eye className="h-4 w-4 shrink-0 text-red-600" />
                              </div>
                              <p className="mt-1 truncate text-sm text-slate-600">{item.proveedor}</p>
                            </div>
                            <div className="shrink-0 text-right">
                              <p className="text-sm font-bold text-slate-900">${item.valorTotal.toLocaleString('es-CO')}</p>
                              {item.fechaRecepcion && (
                                <p className="mt-0.5 text-xs text-slate-400">{new Date(item.fechaRecepcion).toLocaleDateString('es-CO')}</p>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-2">
                            <Badge className={`${getEstadoBadge(item.estado)} border`}>{item.estado}</Badge>
                            {item.numeroRadicado && item.numeroRadicado !== 'Sin radicado' && (
                              <Badge variant="outline" className="font-mono text-[10px]">{item.numeroRadicado}</Badge>
                            )}
                          </div>
                        </motion.button>
                      ))}

                      {totalActivityPages > 1 && (
                        <div className="flex items-center justify-between border-t border-slate-200 pt-3">
                          <p className="text-sm text-slate-500">
                            Mostrando {(activityPage - 1) * ACTIVITIES_PER_PAGE + 1} a {Math.min(activityPage * ACTIVITIES_PER_PAGE, actividadesRecientes.length)} de {actividadesRecientes.length}
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActivityPage((prev) => Math.max(1, prev - 1))}
                              disabled={activityPage === 1}
                              className="border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                            >
                              <ChevronLeft className="mr-1 h-4 w-4" />
                              Anterior
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActivityPage((prev) => Math.min(totalActivityPages, prev + 1))}
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
      </div>

      <KanbanVistaCompleta
        isOpen={showKanbanCompleto}
        kanbanEstados={kanbanEstados}
        onClose={() => setShowKanbanCompleto(false)}
        onSelectFactura={(factura) => {
          setSelectedFactura(factura);
          setShowDetailModal(true);
        }}
      />

      <FacturaDetailModal
        factura={selectedFactura}
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedFactura(null);
        }}
      />
    </>
  );
}
