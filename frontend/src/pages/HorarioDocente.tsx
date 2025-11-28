import { Card, CardContent } from '../share/card';
import { motion } from 'motion/react';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';

interface HorarioDocenteProps {
  onBack?: () => void;
}

// Mock horario semanal docente
const horarioSemanal = [
  { dia: 'Lunes', bloques: [
    { hora: '07:00 - 09:00', asignatura: 'Matemáticas I', grupo: 'A1', salon: 'A-203' },
    { hora: '09:00 - 11:00', asignatura: 'Física I', grupo: 'B1', salon: 'Lab-F1' },
  ]},
  { dia: 'Martes', bloques: [
    { hora: '08:00 - 10:00', asignatura: 'Programación I', grupo: 'C1', salon: 'Lab-C2' },
    { hora: '14:00 - 16:00', asignatura: 'Matemáticas I', grupo: 'A1', salon: 'A-203' },
  ]},
  { dia: 'Miércoles', bloques: [
    { hora: '07:00 - 09:00', asignatura: 'Física I', grupo: 'B1', salon: 'Lab-F1' },
    { hora: '10:00 - 12:00', asignatura: 'Programación I', grupo: 'C1', salon: 'Lab-C2' },
  ]},
  { dia: 'Jueves', bloques: [
    { hora: '09:00 - 11:00', asignatura: 'Matemáticas I', grupo: 'A1', salon: 'A-203' },
  ]},
  { dia: 'Viernes', bloques: [
    { hora: '07:00 - 09:00', asignatura: 'Programación I', grupo: 'C1', salon: 'Lab-C2' },
    { hora: '11:00 - 13:00', asignatura: 'Física I', grupo: 'B1', salon: 'Lab-F1' },
  ]},
];

export default function HorarioDocente({ onBack }: HorarioDocenteProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-slate-900 dark:text-slate-100">Mi Horario Académico</h1>
        {onBack && (
          <motion.button
            onClick={onBack}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 transition"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            Volver
          </motion.button>
        )}
      </div>

      <p className="text-slate-600 dark:text-slate-400">
        Visualiza tu horario semanal, exporta y solicita cambios si es necesario.
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <motion.button
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white shadow hover:from-red-700 hover:to-red-800 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Download className="w-4 h-4" /> PDF
        </motion.button>
        <motion.button
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow hover:from-indigo-700 hover:to-indigo-800 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <Download className="w-4 h-4" /> Excel
        </motion.button>
        <motion.button
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow hover:from-blue-700 hover:to-blue-800 flex items-center gap-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
        >
          <RefreshCw className="w-4 h-4" /> Solicitar Cambio
        </motion.button>
      </div>

      {/* Horario Table */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {horarioSemanal.map((dia) => (
          <motion.div
            key={dia.dia}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 h-full">
              <CardContent className="p-4 space-y-3">
                <h2 className="text-slate-800 dark:text-slate-200 flex items-center gap-2">
                  <span className="font-semibold">{dia.dia}</span>
                </h2>
                <div className="space-y-3">
                  {dia.bloques.map((b, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600"
                    >
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                        {b.hora}
                      </p>
                      <p className="text-slate-700 dark:text-slate-300 font-medium">
                        {b.asignatura}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Grupo {b.grupo} • {b.salon}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="flex items-start gap-3 p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Si encuentras algún conflicto o necesitas ajustar tu horario, usa el botón "Solicitar Cambio" y el administrador revisará tu petición.
        </p>
      </div>
    </div>
  );
}
