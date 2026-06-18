import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import {
  AlertCircle,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Eye,
  FileCheck,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import FacturaDetailModal from '../../../share/factura-detail-modal';
import { useRectoriaHome } from '../../../hooks/financiero/rectoria';
import { useAuth } from '../../../context/AuthContext';

interface RectoriaHomeProps {
  onGoToAutorizar: () => void;
}

const ACTIVITIES_PER_PAGE = 3;

export default function RectoriaHome({ onGoToAutorizar }: RectoriaHomeProps) {
  const { components } = useAuth();
  const [activityPage, setActivityPage] = useState(1);
  const {
    cargando,
    error,
    stats,
    actividadesRecientes,
    selectedFactura,
    showDetailModal,
    setShowDetailModal,
    setSelectedFactura,
    handleClickActividad,
    getEstadoBadge,
    recargarDatos,
  } = useRectoriaHome();

  const quickActions = [
    {
      title: 'Autorizar Pagos',
      description: 'Revisar y decidir pagos enviados por Direccion Financiera',
      icon: FileCheck,
      action: onGoToAutorizar,
      className: 'bg-white text-slate-900 border border-white/20 hover:bg-red-50',
      descriptionClass: 'text-slate-500',
    },
  ];

  const visibleQuickActions = quickActions.filter(() =>
    components.some((component) => component.nombre === 'Autorizar Pagos')
  );

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
          className="rounded-[28px] bg-gradient-to-r from-red-700 via-red-600 to-red-800 p-6 text-white shadow-xl"
        >
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/10">
                  <Crown className="h-7 w-7 text-amber-300" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight sm:text-3xl">Rectoria</h1>
                  <p className="mt-2 text-sm leading-6 text-red-50/90">
                    Supervisa la autorizacion institucional y el cierre del flujo con una vista resumida, clara y accionable.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Badge className="border border-white/15 bg-white/10 text-white">Por autorizar: {cargando ? '--' : stats.pagosPorAutorizar}</Badge>
                <Badge className="border border-white/15 bg-white/10 text-white">Casos criticos: {cargando ? '--' : stats.pendientesCriticos}</Badge>
              </div>
            </div>

            <div className="grid gap-3 xl:min-w-[340px]">
              {visibleQuickActions.map((action) => {
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
                    <p className={`mt-1 text-xs ${action.descriptionClass}`}>{action.description}</p>
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

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-slate-900">Actividad reciente de Rectoría</CardTitle>
                  <CardDescription>Consulta los ultimos pagos revisados en este rol para seguir decisiones, rechazos y cierres sin salir del dashboard.</CardDescription>
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
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">Movimientos recientes del rol</h3>
                    <p className="text-sm text-slate-500">Muestra los pagos con movimiento mas reciente para seguir el cierre de cada caso desde Rectoría.</p>
                  </div>
                  {actividadesRecientes.length > ACTIVITIES_PER_PAGE && (
                    <Badge variant="outline">
                      Pagina {activityPage} de {totalActivityPages}
                    </Badge>
                  )}
                </div>

                {cargando ? (
                  <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-10 text-slate-400">
                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                    Cargando actividad...
                  </div>
                ) : actividadesRecientes.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center text-slate-400">
                    <Eye className="mx-auto mb-3 h-8 w-8 opacity-30" />
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
                          <p className="shrink-0 text-sm font-bold text-slate-900">${item.valorTotal.toLocaleString('es-CO')}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <Badge className={`${getEstadoBadge(item.estado)} border`}>{item.estado}</Badge>
                          <Badge variant="outline">{item.areaSolicitante || 'Sin area'}</Badge>
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
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
