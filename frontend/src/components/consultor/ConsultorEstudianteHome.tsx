import { Card, CardContent } from '../ui/card';
import { motion } from 'motion/react';
import { Clock, BookOpen, GraduationCap, ChevronRight, Calendar } from 'lucide-react';

interface ConsultorEstudianteHomeProps {
  onNavigate: (menu: string) => void;
}

export default function ConsultorEstudianteHome({ onNavigate }: ConsultorEstudianteHomeProps) {
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
          Consulta tu horario y mantente al día con tus asignaturas.
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-600 dark:text-slate-400 mb-1">Asignaturas</p>
                  <h3 className="text-slate-900 dark:text-slate-100">5 materias</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <Clock className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-600 dark:text-slate-400 mb-1">Horas Semanales</p>
                  <h3 className="text-slate-900 dark:text-slate-100">20 horas</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-7 h-7 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-slate-600 dark:text-slate-400 mb-1">Semestre</p>
                  <h3 className="text-slate-900 dark:text-slate-100">4° Semestre</h3>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-700 flex items-center justify-center mb-4 shadow-lg">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-slate-900 dark:text-slate-100 mb-2">
                  Ver Horario
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4 flex-1">
                  Revisa tu horario semanal y mantente al día con tus clases.
                </p>
                <motion.button
                  onClick={() => onNavigate('horario')}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-xl hover:from-indigo-700 hover:to-indigo-800 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 w-full"
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
          <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-pink-50 to-rose-50 dark:from-slate-800 dark:to-slate-700 hover:shadow-lg transition-shadow h-full">
            <CardContent className="p-6">
              <div className="flex flex-col h-full">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-600 to-rose-600 flex items-center justify-center mb-4 shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-slate-900 dark:text-slate-100 mb-2">
                  Progreso Académico
                </h2>
                <p className="text-slate-600 dark:text-slate-400 mb-4 flex-1">
                  Próximamente podrás ver tus avances, notas y estadísticas de desempeño.
                </p>
                <motion.button
                  disabled
                  className="px-4 py-2 bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center gap-2 w-full cursor-not-allowed"
                  whileTap={{ scale: 0.98 }}
                >
                  <span>En desarrollo</span>
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

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
                <h4 className="text-slate-700 dark:text-slate-300">Horario Académico</h4>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Visualiza tu horario semanal asignado
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-indigo-600 dark:text-indigo-400">✓</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Filtra por día para enfocarte en clases específicas
                  </p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="text-slate-700 dark:text-slate-300">Próximas Mejoras</h4>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-600 dark:text-pink-400">•</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Seguimiento de notas y desempeño académico
                  </p>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="text-pink-600 dark:text-pink-400">•</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400">
                    Historial de clases y asistencia
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
