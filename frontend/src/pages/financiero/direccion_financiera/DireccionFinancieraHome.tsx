import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { Loader2, Briefcase, Clock, Upload, CheckCircle2, FileText, Eye, RefreshCw, AlertCircle } from 'lucide-react';
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
  onGoToPendientes,
  onGoToRevisar,
  onGoToEnviar,
  onGoToConfirmar,
}: DireccionFinancieraHomeProps) {
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
    formatUltimaActualizacion,
    recargarDatos,
  } = useDireccionFinancieraHome();

  const quickActions = [
    {
      title: 'Mis Pendientes',
      description: 'Facturas recibidas desde Tesoreria pendientes de gestion',
      icon: Clock,
      color: 'from-yellow-600 to-yellow-700',
      action: onGoToPendientes,
    },
    {
      title: 'Revisar Pagos',
      description: 'Cargue formal en direccion financiera o devolucion a tesoreria',
      icon: FileText,
      color: 'from-blue-600 to-blue-700',
      action: onGoToRevisar,
    },
    {
      title: 'Enviar a Rectoria',
      description: 'Remision de casos revisados para autorizacion final',
      icon: Upload,
      color: 'from-red-600 to-red-700',
      action: onGoToEnviar,
    },
    {
      title: 'Control de Pago Bancario',
      description: 'Confirmacion bancaria de pagos autorizados por Rectoria',
      icon: CheckCircle2,
      color: 'from-emerald-600 to-emerald-700',
      action: onGoToConfirmar,
    },
  ];

  const statsData = [
    { title: 'Pendientes de Cargue', value: String(stats.facturasPorCargar), icon: Upload, color: 'from-purple-600 to-purple-700', iconColor: 'text-purple-100', trend: 'Recibidas de Tesoreria' },
    { title: 'Listas para Enviar a Rectoria', value: String(stats.listasParaEnviar), icon: CheckCircle2, color: 'from-green-600 to-green-700', iconColor: 'text-green-100', trend: 'Cargadas para autorizacion' },
  ];

  return (
    <>
      <div className="space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Direccion Financiera / Sindicatura</h1>
              <p className="text-red-100">Cargue formal, control y seguimiento integral del flujo</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-red-100">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>Ultima actualizacion: {formatUltimaActualizacion()}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={recargarDatos} disabled={cargando} className="text-white hover:bg-white/20">
              <RefreshCw className={`w-4 h-4 mr-2 ${cargando ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </motion.div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            {error}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statsData.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                        <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>
                    </div>
                    <p className="text-3xl font-bold text-slate-800 mb-1">{cargando ? '-' : stat.value}</p>
                    <p className="text-sm text-slate-600 mb-2">{stat.title}</p>
                    <p className="text-xs text-slate-500">{stat.trend}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Kanban Summary */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Tablero Kanban Resumido</CardTitle>
                  <CardDescription>Estados reales de todo el flujo: desde Funcionario, pasando por Tesoreria, Auditoria, Direccion Financiera y Rectoria, hasta Pago.</CardDescription>
                </div>
                <Button onClick={() => setShowKanbanCompleto(true)} className="bg-red-600 hover:bg-red-700">
                  Ver Kanban Completo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {cargando ? (
                <div className="flex items-center justify-center py-8 text-slate-400">
                  <Loader2 className="w-6 h-6 animate-spin mr-3" /> Cargando datos...
                </div>
              ) : (
                <div className="overflow-x-auto [scrollbar-gutter:stable_both-edges] pb-2">
                  <div className="flex w-max min-w-full gap-3">
                    {kanbanEstados.map((item) => (
                      <div key={item.estado} className="min-w-[210px] rounded-xl border border-slate-200 p-4 bg-white hover:shadow-md transition-shadow">
                        <p className="text-2xl font-bold text-slate-800 mb-1">{item.cantidad}</p>
                        <Badge className={`${item.color} border`}>{item.estado}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="space-y-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button key={action.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + index * 0.08 }} onClick={action.action} className="w-full text-left">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 bg-gradient-to-br ${action.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                          <Icon className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">{action.title}</h3>
                          <p className="text-sm text-slate-600">{action.description}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.button>
              );
            })}
          </div>

          {/* Recent Activity */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800">Actividad Reciente</CardTitle>
                    <CardDescription>Click para abrir detalle enriquecido del tramite</CardDescription>
                  </div>
                  <Button onClick={recargarDatos} variant="ghost" size="sm" disabled={cargando}>
                    <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cargando ? (
                  <div className="flex items-center justify-center py-8 text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mr-3" /> Cargando...
                  </div>
                ) : actividadesRecientes.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No hay actividad reciente</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {actividadesRecientes.map((item, index) => (
                      <motion.button
                        key={item.numeroFactura}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 + index * 0.05 }}
                        onClick={() => handleClickActividad(item)}
                        className="w-full text-left p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-800 mb-1">{item.numeroFactura}</p>
                            <p className="text-sm text-slate-600">{item.proveedor}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-slate-800">${item.valorTotal.toLocaleString('es-CO')}</p>
                            <Badge className={`${getEstadoBadge(item.estado)} border mt-1`}>{item.estado}</Badge>
                          </div>
                        </div>
                        <div className="mt-2 inline-flex items-center gap-1 text-xs text-red-600">
                          <Eye className="w-3 h-3" />
                          Ver detalle del tramite
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Kanban Full View */}
      <KanbanVistaCompleta
        isOpen={showKanbanCompleto}
        kanbanEstados={kanbanEstados}
        onClose={() => setShowKanbanCompleto(false)}
        onSelectFactura={(factura) => {
          setSelectedFactura(factura);
          setShowDetailModal(true);
        }}
      />

      {/* Detail Modal */}
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
