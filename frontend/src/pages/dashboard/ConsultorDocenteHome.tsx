import { Card, CardContent } from '../../share/card';
import { motion } from 'motion/react';
import { Clock, BookOpen, Users, ChevronRight, Calendar, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useConsultorDocente } from '../../hooks/dashboard/useConsultorDocente';

interface ConsultorDocenteHomeProps {
  onNavigate?: (menu: string) => void;
}

export default function ConsultorDocenteHome({ onNavigate }: ConsultorDocenteHomeProps) {
  const navigate = useNavigate();
  const { stats } = useConsultorDocente();

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
          ¡Bienvenido al Portal del Docente!
        </h1>
        <p className="text-slate-600 dark:text-slate-400">
          Gestiona tu horario académico y consulta tu información docente
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

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-slate-800 dark:to-slate-700 hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center mb-4 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-slate-900 dark:text-slate-100 mb-2">
                  Gestionar Horario
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4 flex-1">
                  Visualiza tu horario semanal, exporta a PDF/Excel y solicita cambios al administrador.
                </p>
                <motion.button
                  onClick={() => navigate('/docente/horario')}
                  className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:from-red-700 hover:to-red-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Ver Mi Horario</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-slate-800 dark:to-slate-700 hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4 shadow-lg">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-slate-900 dark:text-slate-100 mb-2">
                  Pedir Préstamos
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4 flex-1">
                  Solicita espacios para clases adicionales, tutorías, conferencias y eventos académicos.
                </p>
                <motion.button
                  onClick={() => navigate('/docente/prestamos')}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-full"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>Solicitar Préstamo</span>
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Asistente Virtual - Acceso Rápido */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-slate-900 dark:text-slate-100 mb-1">Asistente Virtual</h3>
                <p className="text-slate-600 dark:text-slate-400">Accede al asistente virtual para consultas rápidas</p>
              </div>
              <div>
                <motion.button
                  onClick={() => navigate('/docente/asistente-virtual')}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Abrir Asistente
                </motion.button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
      >
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <h3 className="text-slate-900 dark:text-slate-100 mb-4">
              Funcionalidades Disponibles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <h4 className="text-slate-700 dark:text-slate-300">Gestión de Horario</h4>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Visualiza tu horario semanal asignado
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Exporta tu horario a PDF o Excel
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 dark:text-green-400">✓</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Solicita cambios de horario al administrador
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-slate-700 dark:text-slate-300">Préstamos de Espacios</h4>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Solicita espacios para clases adicionales
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Gestiona tutorías, conferencias y eventos
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-blue-600 dark:text-blue-400">✓</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Revisa el estado de tus solicitudes
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
