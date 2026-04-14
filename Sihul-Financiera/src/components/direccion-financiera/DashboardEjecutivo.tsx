import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { BarChart3, TrendingUp, DollarSign, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { Badge } from '../ui/badge';

export default function DashboardEjecutivo() {
  const statsResumen = [
    { title: 'Total Procesado Mes', value: '$124.5M', icon: DollarSign, color: 'from-green-600 to-green-700', trend: '+18% vs anterior' },
    { title: 'Facturas en Proceso', value: '45', icon: FileText, color: 'from-blue-600 to-blue-700', trend: '12 vencidas' },
    { title: 'Tiempo Promedio', value: '14.2 días', icon: Clock, color: 'from-orange-600 to-orange-700', trend: 'Meta: 17 días' },
    { title: 'Tasa de Aprobación', value: '94%', icon: CheckCircle2, color: 'from-purple-600 to-purple-700', trend: '+2% vs anterior' }
  ];

  const estadosKanban = [
    { estado: 'Recibida', cantidad: 8, color: 'bg-gray-500' },
    { estado: 'Radicada', cantidad: 6, color: 'bg-blue-500' },
    { estado: 'Causada', cantidad: 12, color: 'bg-indigo-500' },
    { estado: 'Alistada', cantidad: 7, color: 'bg-yellow-500' },
    { estado: 'Aprobada auditoría', cantidad: 5, color: 'bg-orange-500' },
    { estado: 'Cargada', cantidad: 4, color: 'bg-purple-500' },
    { estado: 'Autorizada', cantidad: 3, color: 'bg-green-500' }
  ];

  const topProveedores = [
    { nombre: 'Mantenimiento Integral EU', facturas: 18, total: 42500000 },
    { nombre: 'Editorial Universitaria', facturas: 15, total: 38200000 },
    { nombre: 'Servicios TI Colombia', facturas: 12, total: 29800000 },
    { nombre: 'Tecnología Educativa SAS', facturas: 10, total: 25600000 },
    { nombre: 'Insumos Médicos', facturas: 8, total: 18900000 }
  ];

  return (
    <div className="p-8 space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Dashboard Ejecutivo (RF17)</h1>
            <p className="text-red-100 text-sm">Monitoreo completo del flujo de cuentas por pagar</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsResumen.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-xl flex items-center justify-center shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
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

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-800">Tablero Kanban por Estados</CardTitle>
            <CardDescription>Vista consolidada del flujo de facturas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4">
              {estadosKanban.map((item, index) => (
                <motion.div
                  key={item.estado}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="bg-white rounded-xl border-2 border-slate-200 p-4 hover:shadow-lg transition-all"
                >
                  <div className={`w-full h-2 ${item.color} rounded-full mb-3`}></div>
                  <p className="text-3xl font-bold text-slate-800 mb-1">{item.cantidad}</p>
                  <p className="text-xs text-slate-600">{item.estado}</p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <TrendingUp className="w-5 h-5 text-red-600" />
              Top 5 Proveedores - Este Mes
            </CardTitle>
            <CardDescription>Principales proveedores por volumen y monto</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProveedores.map((proveedor, index) => (
                <motion.div
                  key={proveedor.nombre}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.05 }}
                  className="flex items-center justify-between p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center text-white font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-slate-800">{proveedor.nombre}</p>
                      <p className="text-sm text-slate-600">{proveedor.facturas} factura(s)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-800">${proveedor.total.toLocaleString('es-CO')}</p>
                    <Badge className="bg-green-100 text-green-700 border-green-200 border text-xs">Pagado</Badge>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
