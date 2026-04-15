import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Badge } from '../../../share/badge';
import {
  ShieldCheck,
  Users,
  BarChart3,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Activity,
  Eye,
  Settings,
} from 'lucide-react';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface AdminFinancieroHomeProps {
  onNavigate: (menu: string) => void;
}

interface ActividadFactura extends SharedFacturaDetail {
  id: string;
  usuario: string;
  accion: string;
  tiempo: string;
  tipo: 'success' | 'warning' | 'info';
}

export default function AdminFinancieroHome({ onNavigate }: AdminFinancieroHomeProps) {
  const [selectedFactura, setSelectedFactura] = useState<SharedFacturaDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const statsGlobales = [
    { title: 'Usuarios Activos', value: '42', icon: Users, color: 'from-blue-600 to-blue-700', iconColor: 'text-blue-100', trend: '+3 este mes', action: () => onNavigate('usuarios') },
    { title: 'Facturas en Proceso', value: '127', icon: FileText, color: 'from-orange-600 to-orange-700', iconColor: 'text-orange-100', trend: '15 pendientes hoy', action: () => onNavigate('reportes') },
    { title: 'Monto Total en Tramite', value: '$847M', icon: DollarSign, color: 'from-green-600 to-green-700', iconColor: 'text-green-100', trend: '87 facturas', action: () => onNavigate('reportes') },
    { title: 'Tiempo Promedio Proceso', value: '5.2 dias', icon: Clock, color: 'from-purple-600 to-purple-700', iconColor: 'text-purple-100', trend: '-0.8 vs mes anterior', action: () => onNavigate('reportes') },
  ];

  const distribucionEstados = [
    { estado: 'Recibida', cantidad: 18, porcentaje: 14, color: 'bg-gray-500' },
    { estado: 'Radicada', cantidad: 15, porcentaje: 12, color: 'bg-blue-500' },
    { estado: 'Causada', cantidad: 12, porcentaje: 9, color: 'bg-indigo-500' },
    { estado: 'Alistada', cantidad: 20, porcentaje: 16, color: 'bg-yellow-500' },
    { estado: 'Aprobada Auditoria', cantidad: 17, porcentaje: 13, color: 'bg-orange-500' },
    { estado: 'Cargada', cantidad: 22, porcentaje: 17, color: 'bg-purple-500' },
    { estado: 'Autorizada', cantidad: 15, porcentaje: 12, color: 'bg-green-500' },
    { estado: 'Pagada', cantidad: 8, porcentaje: 7, color: 'bg-emerald-500' },
  ];

  const actividadesRecientes: ActividadFactura[] = [
    {
      id: '1',
      usuario: 'Maria Gonzalez (Tesoreria)',
      accion: 'Alisto factura para pago',
      numeroFactura: 'FAC-2026-0156',
      proveedor: 'Servicios Generales SAS',
      valorTotal: 5600000,
      tiempo: 'Hace 5 minutos',
      tipo: 'success',
      estado: 'Alistada',
      fechaFactura: '2026-03-20',
      fechaRecepcion: '2026-03-23',
      areaSolicitante: 'Mantenimiento',
      diasTranscurridos: 3,
      descripcion: 'Flujo operativo en tiempo esperado',
    },
    {
      id: '2',
      usuario: 'Carlos Ruiz (Auditoria)',
      accion: 'Aprobo control previo',
      numeroFactura: 'FAC-2026-0145',
      proveedor: 'Tecnologia y Equipos Ltda.',
      valorTotal: 12800000,
      tiempo: 'Hace 12 minutos',
      tipo: 'success',
      estado: 'Aprobada Auditoria',
      fechaFactura: '2026-03-19',
      fechaRecepcion: '2026-03-22',
      areaSolicitante: 'Sistemas',
      diasTranscurridos: 4,
      descripcion: 'Control previo aprobado sin hallazgos',
    },
    {
      id: '3',
      usuario: 'Pedro Martinez (Dir. Financiera)',
      accion: 'Cargo pagos para autorizacion',
      numeroFactura: 'FAC-2026-0132',
      proveedor: 'Mantenimiento Industrial',
      valorTotal: 8900000,
      tiempo: 'Hace 35 minutos',
      tipo: 'warning',
      estado: 'Cargada',
      fechaFactura: '2026-03-17',
      fechaRecepcion: '2026-03-20',
      areaSolicitante: 'Infraestructura',
      diasTranscurridos: 6,
      descripcion: 'Requiere autorizacion final de rectoria',
    },
  ];

  const rendimientoPorRol = [
    { rol: 'Funcionario', tareasPendientes: 8, tareasCompletadas: 45, eficiencia: 85 },
    { rol: 'Contabilidad', tareasPendientes: 12, tareasCompletadas: 38, eficiencia: 76 },
    { rol: 'Tesoreria', tareasPendientes: 15, tareasCompletadas: 42, eficiencia: 74 },
    { rol: 'Auditoria', tareasPendientes: 10, tareasCompletadas: 35, eficiencia: 78 },
    { rol: 'Dir. Financiera', tareasPendientes: 5, tareasCompletadas: 28, eficiencia: 85 },
    { rol: 'Rectoria', tareasPendientes: 3, tareasCompletadas: 25, eficiencia: 89 },
  ];

  const handleClickActividad = (actividad: ActividadFactura) => {
    setSelectedFactura(actividad);
    setShowDetailModal(true);
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'info':
        return <Activity className="w-4 h-4 text-blue-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Panel de Administracion Financiera</h1>
              <p className="text-red-100">Monitoreo completo del sistema de cuentas por pagar</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-red-100">
            <Clock className="w-4 h-4" />
            <span>Ultima actualizacion: Hoy, 14 de Abril 2026 - 16:30 PM</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statsGlobales.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={stat.action} className="cursor-pointer">
                <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 bg-white overflow-hidden group">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                      </div>
                      <TrendingUp className="w-5 h-5 text-green-600" />
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <BarChart3 className="w-5 h-5 text-red-600" />
                  Distribucion por Estado del Flujo
                </CardTitle>
                <CardDescription>127 facturas en proceso total</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {distribucionEstados.map((item, index) => (
                    <motion.div key={item.estado} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.05 }} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm text-slate-700">{item.estado}</span>
                        </div>
                        <span className="text-sm font-semibold text-slate-800">{item.cantidad} ({item.porcentaje}%)</span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${item.porcentaje}%` }} transition={{ delay: index * 0.1, duration: 0.5 }} className={`h-full ${item.color}`} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-0 shadow-lg h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-slate-800">
                  <Activity className="w-5 h-5 text-red-600" />
                  Actividad del Sistema en Tiempo Real
                </CardTitle>
                <CardDescription>Ultimas acciones realizadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {actividadesRecientes.map((actividad, index) => (
                    <motion.div key={actividad.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }} onClick={() => handleClickActividad(actividad)} className="p-4 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer group">
                      <div className="flex items-start gap-3">
                        {getTipoIcon(actividad.tipo)}
                        <div className="flex-1">
                          <p className="text-sm font-medium text-slate-800 group-hover:text-red-600 transition-colors">{actividad.usuario}</p>
                          <p className="text-sm text-slate-600">{actividad.accion}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className="text-xs">{actividad.numeroFactura}</Badge>
                            <span className="text-xs text-slate-500">{actividad.tiempo}</span>
                          </div>
                        </div>
                        <Button size="sm" variant="ghost" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Users className="w-5 h-5 text-red-600" />
                Rendimiento por Rol
              </CardTitle>
              <CardDescription>Metricas de eficiencia de cada departamento</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rendimientoPorRol.map((rol, index) => (
                  <motion.div key={rol.rol} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }} className="p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-red-300 hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-slate-800">{rol.rol}</h4>
                      <Badge className={`${rol.eficiencia >= 80 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{rol.eficiencia}%</Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Pendientes:</span><span className="font-semibold text-orange-600">{rol.tareasPendientes}</span></div>
                      <div className="flex items-center justify-between text-sm"><span className="text-slate-600">Completadas:</span><span className="font-semibold text-green-600">{rol.tareasCompletadas}</span></div>
                    </div>
                    <div className="mt-3 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${rol.eficiencia}%` }} transition={{ delay: index * 0.1, duration: 0.5 }} className={`h-full ${rol.eficiencia >= 80 ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
            <Card onClick={() => onNavigate('usuarios')} className="border-0 shadow-lg hover:shadow-2xl transition-all cursor-pointer group bg-gradient-to-br from-blue-600 to-blue-700 text-white">
              <CardContent className="p-6">
                <Users className="w-12 h-12 text-blue-100 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl mb-2">Gestionar Usuarios</h3>
                <p className="text-blue-100 text-sm">Crear, editar o desactivar usuarios del sistema</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
            <Card onClick={() => onNavigate('reportes')} className="border-0 shadow-lg hover:shadow-2xl transition-all cursor-pointer group bg-gradient-to-br from-green-600 to-green-700 text-white">
              <CardContent className="p-6">
                <BarChart3 className="w-12 h-12 text-green-100 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl mb-2">Reportes Consolidados</h3>
                <p className="text-green-100 text-sm">Ver metricas, estadisticas y exportar datos</p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
            <Card onClick={() => onNavigate('configuracion')} className="border-0 shadow-lg hover:shadow-2xl transition-all cursor-pointer group bg-gradient-to-br from-purple-600 to-purple-700 text-white">
              <CardContent className="p-6">
                <Settings className="w-12 h-12 text-purple-100 mb-4 group-hover:scale-110 transition-transform" />
                <h3 className="font-bold text-xl mb-2">Configuracion</h3>
                <p className="text-purple-100 text-sm">Ajustes del sistema y parametros generales</p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
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
