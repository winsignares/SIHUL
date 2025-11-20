import { Card, CardContent } from '../ui/card';
import { motion } from 'motion/react';
import { Filter } from 'lucide-react';
import { useState } from 'react';

interface HorarioEstudianteProps {
  onBack?: () => void;
}

// Mock horario semanal estudiante
const horarioSemanal = [
  { dia: 'Lunes', bloques: [
    { hora: '07:00 - 09:00', asignatura: 'Matemáticas I', salon: 'A-203' },
    { hora: '09:00 - 11:00', asignatura: 'Programación I', salon: 'Lab-C2' },
  ]},
  { dia: 'Martes', bloques: [
    { hora: '08:00 - 10:00', asignatura: 'Física I', salon: 'Lab-F1' },
    { hora: '14:00 - 16:00', asignatura: 'Matemáticas I', salon: 'A-203' },
  ]},
  { dia: 'Miércoles', bloques: [
    { hora: '07:00 - 09:00', asignatura: 'Programación I', salon: 'Lab-C2' },
    { hora: '10:00 - 12:00', asignatura: 'Física I', salon: 'Lab-F1' },
  ]},
  { dia: 'Jueves', bloques: [
    { hora: '09:00 - 11:00', asignatura: 'Matemáticas I', salon: 'A-203' },
  ]},
  { dia: 'Viernes', bloques: [
    { hora: '07:00 - 09:00', asignatura: 'Programación I', salon: 'Lab-C2' },
    { hora: '11:00 - 13:00', asignatura: 'Física I', salon: 'Lab-F1' },
  ]},
];

export default function HorarioEstudiante({ onBack }: HorarioEstudianteProps) {
  const [filtroDia, setFiltroDia] = useState<string>('Todos');

  const diasFiltrados = filtroDia === 'Todos'
    ? horarioSemanal
    : horarioSemanal.filter(d => d.dia === filtroDia);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-slate-900 dark:text-slate-100">Mi Horario Semanal</h1>
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
        Consulta tu horario y filtra por día para enfocarte mejor.
      </p>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <label className="text-sm text-slate-600 dark:text-slate-400">Filtrar por día:</label>
        </div>
        <select
          value={filtroDia}
          onChange={(e) => setFiltroDia(e.target.value)}
          className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
        >
          <option>Todos</option>
          {horarioSemanal.map(d => <option key={d.dia}>{d.dia}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {diasFiltrados.map((dia) => (
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
                        {b.salon}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
