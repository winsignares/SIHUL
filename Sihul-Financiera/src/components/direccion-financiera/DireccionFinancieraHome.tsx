import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Briefcase, Upload, BarChart3, Clock, CheckCircle2, Eye, Maximize2, FileText, DollarSign, Building } from 'lucide-react';
import KanbanVistaCompleta from './KanbanVistaCompleta';
import FacturaDetailModal from '../ui/factura-detail-modal';

interface DireccionFinancieraHomeProps {
  onNavigate: (menu: string) => void;
}

export default function DireccionFinancieraHome({ onNavigate }: DireccionFinancieraHomeProps) {
  const [showKanbanCompleto, setShowKanbanCompleto] = useState(false);
  const [selectedFactura, setSelectedFactura] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const stats = [
    { title: 'Facturas por Cargar', value: '5', icon: Upload, color: 'from-purple-600 to-purple-700', iconColor: 'text-purple-100', trend: 'Aprobadas por auditoría' },
    { title: 'Cargadas Este Mes', value: '87', icon: CheckCircle2, color: 'from-green-600 to-green-700', iconColor: 'text-green-100', trend: '+10% vs mes anterior' }
  ];

  const quickActions = [
    { title: 'Cargar Pagos (RF08)', description: 'Cargue formal previo a autorización de Rectoría', icon: Upload, color: 'from-purple-600 to-purple-700', action: () => onNavigate('revisar') }
  ];

  // Tablero Kanban resumido
  const kanbanEstados = [
    { estado: 'Recibida', cantidad: 3, color: 'bg-gray-100 text-gray-700' },
    { estado: 'Radicada', cantidad: 2, color: 'bg-blue-100 text-blue-700' },
    { estado: 'Causada', cantidad: 2, color: 'bg-indigo-100 text-indigo-700' },
    { estado: 'Alistada', cantidad: 2, color: 'bg-yellow-100 text-yellow-700' },
    { estado: 'Aprobada Auditoría', cantidad: 2, color: 'bg-orange-100 text-orange-700' },
    { estado: 'Cargada', cantidad: 2, color: 'bg-purple-100 text-purple-700' },
    { estado: 'Autorizada', cantidad: 2, color: 'bg-green-100 text-green-700' }
  ];

  // Actividades recientes (ahora clickeables)
  const actividadesRecientes = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-006',
      proveedor: 'Servicios de Aseo Total',
      valorTotal: 4200000,
      accion: 'Cargada para autorización',
      fecha: '2026-03-23 14:30',
      estado: 'Cargada',
      fechaFactura: '2026-03-14',
      fechaRecepcion: '2026-03-20',
      areaSolicitante: 'Servicios Generales',
      diasTranscurridos: 6,
      numeroRadicado: 'RAD-2026-00128',
      numeroProcesoPago: 'PP-2026-0074',
      descripcion: 'Servicio de aseo mensual',
      observaciones: ''
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-005',
      proveedor: 'Editorial Universitaria',
      valorTotal: 5670000,
      accion: 'Aprobada por auditoría',
      fecha: '2026-03-23 11:20',
      estado: 'Aprobada Auditoría',
      fechaFactura: '2026-03-15',
      fechaRecepcion: '2026-03-21',
      areaSolicitante: 'Biblioteca',
      diasTranscurridos: 5,
      numeroRadicado: 'RAD-2026-00132',
      numeroProcesoPago: 'PP-2026-0076',
      descripcion: 'Adquisición de libros académicos',
      observaciones: ''
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-007',
      proveedor: 'Transporte Estudiantil SA',
      valorTotal: 7200000,
      accion: 'Autorizada para pago',
      fecha: '2026-03-23 09:15',
      estado: 'Autorizada',
      fechaFactura: '2026-03-12',
      fechaRecepcion: '2026-03-18',
      areaSolicitante: 'Bienestar',
      diasTranscurridos: 8,
      numeroRadicado: 'RAD-2026-00124',
      numeroProcesoPago: 'PP-2026-0072',
      descripcion: 'Servicio de transporte estudiantil',
      observaciones: ''
    },
    {
      id: '4',
      numeroFactura: 'FAC-2026-013',
      proveedor: 'Seguridad Privada Ltda.',
      valorTotal: 9500000,
      accion: 'Cargada para autorización',
      fecha: '2026-03-22 16:45',
      estado: 'Cargada',
      fechaFactura: '2026-03-13',
      fechaRecepcion: '2026-03-19',
      areaSolicitante: 'Seguridad',
      diasTranscurridos: 7,
      numeroRadicado: 'RAD-2026-00126',
      numeroProcesoPago: 'PP-2026-0075',
      descripcion: 'Servicio de seguridad privada mensual',
      observaciones: ''
    },
    {
      id: '5',
      numeroFactura: 'FAC-2026-004',
      proveedor: 'Mantenimiento y Obras EU',
      valorTotal: 12500000,
      accion: 'Alistada por tesorería',
      fecha: '2026-03-22 10:30',
      estado: 'Alistada',
      fechaFactura: '2026-03-17',
      fechaRecepcion: '2026-03-22',
      areaSolicitante: 'Mantenimiento',
      diasTranscurridos: 3,
      numeroRadicado: 'RAD-2026-00138',
      numeroProcesoPago: 'PP-2026-0078',
      descripcion: 'Reparaciones estructurales edificio A',
      observaciones: ''
    }
  ];

  const handleClickActividad = (actividad: any) => {
    setSelectedFactura(actividad);
    setShowDetailModal(true);
  };

  const getEstadoBadge = (estado: string) => {
    const badges: { [key: string]: string } = {
      'Recibida': 'bg-blue-100 text-blue-700 border-blue-200',
      'Radicada': 'bg-green-100 text-green-700 border-green-200',
      'Causada': 'bg-purple-100 text-purple-700 border-purple-200',
      'Alistada': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Aprobada Auditoría': 'bg-teal-100 text-teal-700 border-teal-200',
      'Cargada': 'bg-orange-100 text-orange-700 border-orange-200',
      'Autorizada': 'bg-green-100 text-green-700 border-green-200',
      'Pagada': 'bg-emerald-100 text-emerald-700 border-emerald-200'
    };
    return badges[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <>
      <div className="p-8 space-y-8">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <Briefcase className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1">Dirección Financiera / Sindicatura</h1>
              <p className="text-red-100">Cargue formal y monitoreo ejecutivo</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-100">
            <Clock className="w-4 h-4" />
            <span>Última actualización: Hoy, 23 de Marzo 2026 - 15:30 PM</span>
          </div>
        </motion.div>

        {/* Stats */}
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
                    <div>
                      <p className="text-3xl font-bold text-slate-800 mb-1">{stat.value}</p>
                      <p className="text-sm text-slate-600 mb-2">{stat.title}</p>
                      <p className="text-xs text-slate-500">{stat.trend}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Tablero Kanban Resumido */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <FileText className="w-5 h-5 text-red-600" />
                  Tablero Kanban - Estado del Flujo
                </CardTitle>
                <Button
                  onClick={() => setShowKanbanCompleto(true)}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Vista Completa
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {kanbanEstados.map((item, index) => (
                  <motion.div
                    key={item.estado}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`${item.color} rounded-xl p-4 text-center shadow-md hover:shadow-lg transition-all cursor-pointer`}
                  >
                    <p className="text-3xl font-bold mb-1">{item.cantidad}</p>
                    <p className="text-xs font-semibold">{item.estado}</p>
                  </motion.div>
                ))}
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm text-slate-600">
                  Total de facturas en proceso: <span className="font-bold text-red-600">15</span>
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions y Actividad Reciente */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="space-y-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.div key={action.title} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 + index * 0.1 }}>
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden" onClick={action.action}>
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
                </motion.div>
              );
            })}
          </div>

          {/* Actividad Reciente - Ahora Clickeable */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Clock className="w-5 h-5 text-red-600" />
                  Actividad Reciente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {actividadesRecientes.map((actividad, index) => (
                    <motion.div
                      key={actividad.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleClickActividad(actividad)}
                      className="p-4 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400 group-hover:text-red-600 transition-colors" />
                          <p className="font-mono font-bold text-sm text-slate-800 group-hover:text-red-600 transition-colors">
                            {actividad.numeroFactura}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </Button>
                      </div>
                      <div className="flex items-start gap-2 mb-2">
                        <Building className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                        <p className="text-sm text-slate-700 line-clamp-1">{actividad.proveedor}</p>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <p className="text-sm font-semibold text-green-600">
                          ${actividad.valorTotal.toLocaleString('es-CO')}
                        </p>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-slate-500">{actividad.accion}</p>
                        <Badge className={`${getEstadoBadge(actividad.estado)} border text-xs`}>
                          {actividad.estado}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-400 mt-2">{actividad.fecha}</p>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* Modal Vista Completa Kanban */}
      <KanbanVistaCompleta
        isOpen={showKanbanCompleto}
        onClose={() => setShowKanbanCompleto(false)}
      />

      {/* Modal Detalle de Factura */}
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