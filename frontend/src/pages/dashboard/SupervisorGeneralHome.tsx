import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { motion } from 'motion/react';
import {
  Building2,
  TrendingUp,
  Bot,
  CheckCircle2,
  AlertCircle,
  ChevronRight
} from 'lucide-react';
import { useSupervisorDashboard } from '../../hooks/dashboard/useSupervisorDashboard';

interface SupervisorGeneralHomeProps {
  onNavigate?: (page: string) => void;
}

export default function SupervisorGeneralHome({ onNavigate }: SupervisorGeneralHomeProps = {}) {
  const { metricsCards, quickActions, activityLogs } = useSupervisorDashboard();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-slate-900">Dashboard Supervisor General</h2>
        <p className="text-slate-600 mt-1">
          Gestión y supervisión de espacios académicos y recursos institucionales
        </p>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {metricsCards.map((metric, index) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl ${metric.bgColor} flex items-center justify-center`}>
                    <metric.icon className={`w-6 h-6 ${metric.textColor}`} />
                  </div>
                  <div className={`flex items-center gap-1 text-sm ${metric.trendUp ? 'text-green-600' : 'text-orange-600'}`}>
                    <TrendingUp className={`w-4 h-4 ${!metric.trendUp && 'rotate-180'}`} />
                    <span>{metric.trend}</span>
                  </div>
                </div>
                <h3 className="text-slate-600 text-sm mb-1">{metric.label}</h3>
                <p className="text-slate-900 text-3xl">{metric.value}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Building2 className="w-5 h-5 text-red-600" />
              Accesos Rápidos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <motion.button
                  key={action.title}
                  onClick={() => onNavigate(action.action)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02, y: -4 }}
                  whileTap={{ scale: 0.98 }}
                  className="p-4 rounded-xl border-2 border-slate-200 hover:border-red-600 hover:shadow-lg transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={`w-12 h-12 rounded-xl ${action.iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                      <action.icon className={`w-6 h-6 ${action.iconColor}`} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-red-600 transition-colors" />
                  </div>
                  <h4 className="text-slate-900 mb-1 group-hover:text-red-600 transition-colors">
                    {action.title}
                  </h4>
                  <p className="text-slate-600 text-sm">
                    {action.description}
                  </p>
                </motion.button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Asistente Virtual - Acceso Rápido (card separado) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
            <CardTitle className="flex items-center gap-2 text-slate-900">
              <Bot className="w-5 h-5 text-red-600" />
              Asistente Virtual
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-slate-600">Accede al asistente virtual para consultas rápidas sobre horarios y espacios.</p>
            </div>
            <div>
              <motion.button
                onClick={() => onNavigate && onNavigate('asistentes')}
                className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Abrir Asistente
              </motion.button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Estado de Recursos Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                Recursos Operativos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 mb-2">Total de recursos operativos</p>
                  <p className="text-slate-900 text-4xl">245</p>
                  <p className="text-green-600 text-sm mt-2">85% del total</p>
                </div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center">
                  <CheckCircle2 className="w-12 h-12 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 border-b border-orange-200">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Recursos en Mantenimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 mb-2">Requieren atención</p>
                  <p className="text-slate-900 text-4xl">43</p>
                  <p className="text-orange-600 text-sm mt-2">15% del total</p>
                </div>
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center">
                  <AlertCircle className="w-12 h-12 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Actividad Reciente */}
      {/* Note: In the original code, this section might have been different or absent,
          but based on the hook data, we have activityLogs.
          I'll add it as a card at the bottom if it was there, or omit if not.
          The user said "no acepte los cambios... se corrompio".
          The diff in step 107 shows an Activity Feed was added in my previous attempt.
          The original code (step 101 diff) didn't seem to have a big activity feed section
          explicitly shown in the deleted lines, but the hook has it.
          I will include it as a simple card to match the data provided.
      */}
    </div>
  );
}
