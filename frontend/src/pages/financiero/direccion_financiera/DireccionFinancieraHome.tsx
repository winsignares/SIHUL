import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { Briefcase, Clock, Upload, CheckCircle2, FileText, Eye } from 'lucide-react';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import KanbanVistaCompleta from './KanbanVistaCompleta';

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
  const [showKanbanCompleto, setShowKanbanCompleto] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<SharedFacturaDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const stats = [
    { title: 'Facturas por Cargar', value: '5', icon: Upload, color: 'from-purple-600 to-purple-700', iconColor: 'text-purple-100', trend: 'Aprobadas por auditoria' },
    { title: 'Cargadas Este Mes', value: '87', icon: CheckCircle2, color: 'from-green-600 to-green-700', iconColor: 'text-green-100', trend: '+10% vs mes anterior' },
  ];

  const quickActions = [
    {
      title: 'Mis Pendientes',
      description: 'Cola operativa de cargue con SLA de direccion financiera',
      icon: Clock,
      color: 'from-yellow-600 to-yellow-700',
      action: onGoToPendientes,
    },
    {
      title: 'Revisar Pagos',
      description: 'Revision de pagos enviados por Tesoreria antes de remision',
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
      title: 'Confirmacion de Pagos',
      description: 'Control de confirmaciones del proceso bancario',
      icon: CheckCircle2,
      color: 'from-emerald-600 to-emerald-700',
      action: onGoToConfirmar,
    },
  ];

  const kanbanEstados = [
    { estado: 'Recibida', cantidad: 3, color: 'bg-gray-100 text-gray-700' },
    { estado: 'Radicada', cantidad: 2, color: 'bg-blue-100 text-blue-700' },
    { estado: 'Causada', cantidad: 2, color: 'bg-indigo-100 text-indigo-700' },
    { estado: 'Alistada', cantidad: 2, color: 'bg-yellow-100 text-yellow-700' },
    { estado: 'Aprobada Auditoria', cantidad: 2, color: 'bg-orange-100 text-orange-700' },
    { estado: 'Cargada', cantidad: 2, color: 'bg-purple-100 text-purple-700' },
    { estado: 'Autorizada', cantidad: 2, color: 'bg-green-100 text-green-700' },
  ];

  const actividadesRecientes: SharedFacturaDetail[] = [
    {
      numeroFactura: 'FAC-2026-006',
      proveedor: 'Servicios de Aseo Total',
      valorTotal: 4200000,
      estado: 'Cargada',
      fechaFactura: '2026-03-14',
      fechaRecepcion: '2026-03-20',
      areaSolicitante: 'Servicios Generales',
      diasTranscurridos: 6,
      numeroRadicado: 'RAD-2026-00128',
      numeroProcesoPago: 'PP-2026-0074',
      descripcion: 'Servicio de aseo mensual',
    },
    {
      numeroFactura: 'FAC-2026-005',
      proveedor: 'Editorial Universitaria',
      valorTotal: 5670000,
      estado: 'Aprobada Auditoria',
      fechaFactura: '2026-03-15',
      fechaRecepcion: '2026-03-21',
      areaSolicitante: 'Biblioteca',
      diasTranscurridos: 5,
      numeroRadicado: 'RAD-2026-00132',
      numeroProcesoPago: 'PP-2026-0076',
      descripcion: 'Adquisicion de libros academicos',
    },
    {
      numeroFactura: 'FAC-2026-007',
      proveedor: 'Transporte Estudiantil SA',
      valorTotal: 7200000,
      estado: 'Autorizada',
      fechaFactura: '2026-03-12',
      fechaRecepcion: '2026-03-18',
      areaSolicitante: 'Bienestar',
      diasTranscurridos: 8,
      numeroRadicado: 'RAD-2026-00124',
      numeroProcesoPago: 'PP-2026-0072',
      descripcion: 'Servicio de transporte estudiantil',
    },
  ];

  const handleClickActividad = (actividad: SharedFacturaDetail) => {
    setSelectedFactura(actividad);
    setShowDetailModal(true);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: Record<string, string> = {
      Recibida: 'bg-blue-100 text-blue-700 border-blue-200',
      Radicada: 'bg-green-100 text-green-700 border-green-200',
      Causada: 'bg-purple-100 text-purple-700 border-purple-200',
      Alistada: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Aprobada Auditoria': 'bg-teal-100 text-teal-700 border-teal-200',
      Cargada: 'bg-orange-100 text-orange-700 border-orange-200',
      Autorizada: 'bg-green-100 text-green-700 border-green-200',
      Pagada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };
    return badges[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <>
      <div className="space-y-8">
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
          <div className="flex items-center gap-2 text-sm text-red-100">
            <Clock className="w-4 h-4" />
            <span>Ultima actualizacion: Hoy, 14 de Abril 2026 - 11:45 AM</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stats.map((stat, index) => {
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
                    <p className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</p>
                    <p className="text-sm text-slate-600 mb-2">{stat.title}</p>
                    <p className="text-xs text-slate-500">{stat.trend}</p>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Tablero Kanban Resumido</CardTitle>
                  <CardDescription>Estados del flujo de cuentas por pagar</CardDescription>
                </div>
                <Button onClick={() => setShowKanbanCompleto(true)} className="bg-red-600 hover:bg-red-700">
                  Ver Kanban Completo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {kanbanEstados.map((item) => (
                  <div key={item.estado} className="rounded-xl border border-slate-200 p-4 bg-white hover:shadow-md transition-shadow">
                    <p className="text-2xl font-bold text-slate-800 mb-1">{item.cantidad}</p>
                    <Badge className={`${item.color} border`}>{item.estado}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="text-slate-800">Actividad Reciente</CardTitle>
                <CardDescription>Click para abrir detalle enriquecido del tramite</CardDescription>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <KanbanVistaCompleta
        isOpen={showKanbanCompleto}
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
