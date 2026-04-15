import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import {
  BarChart3,
  Download,
  TrendingUp,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  Calendar,
} from 'lucide-react';

export default function ReportesConsolidados() {
  const reportesDisponibles = [
    {
      titulo: 'Reporte de Facturas Pagadas',
      descripcion: 'Facturas procesadas y pagadas en el periodo seleccionado',
      icon: CheckCircle2,
      color: 'from-green-600 to-green-700',
      registros: 87,
      totalMonto: '$1,245,800,000',
    },
    {
      titulo: 'Tiempo Promedio de Proceso',
      descripcion: 'Analisis de tiempos por etapa del flujo de cuentas por pagar',
      icon: Clock,
      color: 'from-blue-600 to-blue-700',
      registros: 127,
      totalMonto: '5.2 dias promedio',
    },
    {
      titulo: 'Reporte por Proveedor',
      descripcion: 'Facturas agrupadas por proveedor con totales',
      icon: Users,
      color: 'from-purple-600 to-purple-700',
      registros: 45,
      totalMonto: '$847,500,000',
    },
    {
      titulo: 'Facturas por Area Solicitante',
      descripcion: 'Distribucion de gastos por area administrativa',
      icon: FileText,
      color: 'from-orange-600 to-orange-700',
      registros: 18,
      totalMonto: '127 facturas',
    },
    {
      titulo: 'Historico Mensual',
      descripcion: 'Comparativa de facturacion mes a mes',
      icon: TrendingUp,
      color: 'from-red-600 to-red-700',
      registros: 12,
      totalMonto: '+15% vs anterior',
    },
    {
      titulo: 'Reporte de Auditoria',
      descripcion: 'Log de actividades y cambios en el sistema',
      icon: BarChart3,
      color: 'from-indigo-600 to-indigo-700',
      registros: 432,
      totalMonto: 'Este mes',
    },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <BarChart3 className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-3xl font-bold">Reportes Consolidados</h1>
            <p className="text-red-100 text-sm">Analitica, estadisticas y exportacion de datos del sistema</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportesDisponibles.map((reporte, index) => {
          const Icon = reporte.icon;
          return (
            <motion.div
              key={reporte.titulo}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-2xl transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className={`w-14 h-14 bg-gradient-to-br ${reporte.color} rounded-xl flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <CardTitle className="text-lg text-slate-800 group-hover:text-red-600 transition-colors">
                    {reporte.titulo}
                  </CardTitle>
                  <CardDescription>{reporte.descripcion}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Registros</p>
                      <p className="text-2xl font-bold text-slate-800">{reporte.registros}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 mb-1">Total</p>
                      <p className="text-lg font-semibold text-green-600">{reporte.totalMonto}</p>
                    </div>
                  </div>
                  <Button className="w-full bg-slate-100 text-slate-700 hover:bg-red-600 hover:text-white transition-all">
                    <Download className="w-4 h-4 mr-2" />
                    Exportar a Excel
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Calendar className="w-5 h-5 text-red-600" />
              Filtros de Periodo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Button variant="outline" className="border-blue-600 text-blue-600 hover:bg-blue-50">Este Mes</Button>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">Ultimo Trimestre</Button>
              <Button variant="outline" className="border-orange-600 text-orange-600 hover:bg-orange-50">Este Ano</Button>
              <Button variant="outline" className="border-purple-600 text-purple-600 hover:bg-purple-50">Personalizado</Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
