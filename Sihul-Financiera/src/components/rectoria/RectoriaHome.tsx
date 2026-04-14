import { motion } from 'motion/react';
import { Card, CardContent } from '../ui/card';
import { Crown, CheckSquare, Clock, CheckCircle2 } from 'lucide-react';

export default function RectoriaHome({ onNavigate }: { onNavigate: (menu: string) => void }) {
  const stats = [
    { title: 'Pagos por Autorizar', value: '5', icon: CheckSquare, color: 'from-indigo-600 to-indigo-700', iconColor: 'text-indigo-100', trend: 'Cargados por Dir. Financiera' },
    { title: 'Autorizados Este Mes', value: '87', icon: CheckCircle2, color: 'from-green-600 to-green-700', iconColor: 'text-green-100', trend: '+8% vs mes anterior' }
  ];

  return (
    <div className="p-8 space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Panel de Rectoría</h1>
            <p className="text-red-100">Autorización final institucional de pagos (RF09)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-sm text-red-100">
          <Clock className="w-4 h-4" />
          <span>Última actualización: Hoy, 23 de Marzo 2026 - 16:00 PM</span>
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

      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer group bg-white overflow-hidden" onClick={() => onNavigate('autorizar')}>
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <CheckSquare className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-slate-800 mb-2 group-hover:text-red-600 transition-colors">Autorizar Pagos (RF09)</h3>
                <p className="text-sm text-slate-600">Revisar documentación, aprobar o rechazar pagos con firma institucional</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
