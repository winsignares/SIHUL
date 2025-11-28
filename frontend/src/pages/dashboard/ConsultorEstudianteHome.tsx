import { Card, CardContent } from '../../share/card';
import { motion } from 'motion/react';
import { Clock, BookOpen, Calendar, ChevronRight } from 'lucide-react';
import { useConsultorEstudiante } from '../../hooks/dashboard/useConsultorEstudiante';

interface ConsultorEstudianteHomeProps {
  onNavigate?: (menu: string) => void;
}

export default function ConsultorEstudianteHome({ onNavigate }: ConsultorEstudianteHomeProps) {
  const { stats } = useConsultorEstudiante();

  const getGradient = (color: string) => {
    switch (color) {
      case 'blue': return 'from-blue-500 to-blue-600';
      case 'green': return 'from-green-500 to-green-600';
      case 'purple': return 'from-purple-500 to-purple-600';
      default: return 'from-blue-500 to-blue-600';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">
          ¡Bienvenido al Portal del Estudiante!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Consulta tu horario académico del semestre actual
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: (index + 1) * 0.1, duration: 0.5 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${getGradient(stat.color || 'blue')} flex items-center justify-center shadow-lg`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-600 dark:text-slate-400 mb-1">{stat.label}</p>
                      <h3 className="text-slate-900 dark:text-slate-100">{stat.value}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Main Action Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-slate-800 dark:to-slate-700">
          <CardContent className="p-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-slate-900 dark:text-slate-100 mb-2">
                  Consulta tu Horario Académico
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4">
                  Visualiza tu horario semanal, horarios de clases, aulas asignadas y más información académica.
                </p>
                <motion.button
                  onClick={() => onNavigate && onNavigate('horario')}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl flex items-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Ver Mi Horario</span>
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </div>
              <div className="hidden lg:block">
                <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-red-100 to-yellow-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center">
                  <Calendar className="w-24 h-24 text-red-600 dark:text-red-400 opacity-50" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Asistente Virtual - Acceso Rápido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <h3 className="text-slate-900 dark:text-slate-100 mb-1">Asistente Virtual</h3>
              <p className="text-slate-600 dark:text-slate-400">Pregúntale al asistente sobre horarios, espacios y más.</p>
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
      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <h3 className="text-slate-900 dark:text-slate-100 mb-4">
              Instrucciones para Consultar tu Horario
            </h3>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 dark:text-red-400">1</span>
                </div>
                <div>
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Selecciona tu Programa:</span> Elige el programa académico al que perteneces (Ej: Ingeniería de Sistemas, Derecho, Medicina, etc.)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 dark:text-red-400">2</span>
                </div>
                <div>
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Selecciona tu Semestre:</span> Indica el semestre que estás cursando actualmente (1 al 10 según tu programa)
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                  <span className="text-red-600 dark:text-red-400">3</span>
                </div>
                <div>
                  <p className="text-slate-700 dark:text-slate-300">
                    <span className="font-medium">Visualiza tu Horario:</span> El sistema mostrará automáticamente tu horario semanal con todas las asignaturas, horarios y aulas
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
