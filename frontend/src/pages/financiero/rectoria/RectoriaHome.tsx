import { motion } from 'framer-motion';
import { Card, CardContent } from '../../../share/card';
import { Button } from '../../../share/button';
import { Crown, CheckSquare, Clock, CheckCircle2, AlertTriangle, RefreshCw, AlertCircle } from 'lucide-react';
import { useRectoriaHome } from '../../../hooks/financiero/rectoria';

interface RectoriaHomeProps {
  onGoToPendientes: () => void;
  onGoToAutorizar: () => void;
}

export default function RectoriaHome({ onGoToPendientes, onGoToAutorizar }: RectoriaHomeProps) {
  const { stats: rectoriaStats, cargando, error, recargar, formatUltimaActualizacion } = useRectoriaHome();

  const stats = [
    {
      title: 'Pagos por Autorizar',
      value: String(rectoriaStats.pagosPorAutorizar),
      icon: CheckSquare,
      color: 'from-indigo-600 to-indigo-700',
      iconColor: 'text-indigo-100',
      trend: 'Cargados por Direccion Financiera',
    },
    {
      title: 'Autorizados Este Mes',
      value: String(rectoriaStats.autorizadosEsteMes),
      icon: CheckCircle2,
      color: 'from-green-600 to-green-700',
      iconColor: 'text-green-100',
      trend: 'Con decision final de Rectoria',
    },
    {
      title: 'Pendientes Criticos',
      value: String(rectoriaStats.pendientesCriticos),
      icon: AlertTriangle,
      color: 'from-orange-600 to-orange-700',
      iconColor: 'text-orange-100',
      trend: 'Vencen hoy por SLA',
    },
  ];

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl"
      >
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-3xl font-bold">Panel de Rectoria</h1>
            <p className="text-red-100">Autorizacion final institucional de pagos (RF09)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-100">
          <Clock className="w-4 h-4" />
          <span>Ultima actualizacion: {formatUltimaActualizacion()}</span>
          <Button variant="ghost" size="sm" onClick={recargar} disabled={cargando} className="text-white hover:bg-white/20 ml-2">
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.35 }}
          onClick={onGoToPendientes}
          className="text-left"
        >
          <Card className="w-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-600 to-yellow-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">Mis Pendientes</h3>
                  <p className="text-sm text-slate-600">Cola priorizada de pagos cargados para autorizacion institucional</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.button>

        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          onClick={onGoToAutorizar}
          className="text-left"
        >
          <Card className="w-full border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <CheckSquare className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">Autorizar Pagos (RF09)</h3>
                  <p className="text-sm text-slate-600">Aprobar o rechazar pagos antes de su aplicacion final</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.button>
      </div>
    </div>
  );
}
