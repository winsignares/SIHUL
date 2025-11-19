import { Card, CardContent } from '../ui/card';
import { motion } from 'motion/react';
import { Calendar, DoorOpen, Building2, Send } from 'lucide-react';
import { useState } from 'react';

interface DocentePrestamosProps {
  onBack?: () => void;
}

type TipoEvento = 'Clase adicional' | 'Tutoría' | 'Conferencia' | 'Otro';

export default function DocentePrestamos({ onBack }: DocentePrestamosProps) {
  const [tipo, setTipo] = useState<TipoEvento>('Clase adicional');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [duracion, setDuracion] = useState(2);
  const [espacio, setEspacio] = useState('Aula');
  const [detalles, setDetalles] = useState('');

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-slate-900 dark:text-slate-100">Solicitar Préstamo de Espacio</h1>
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
        Diligencia el formulario para solicitar un espacio para actividades académicas.
      </p>

      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-6 space-y-4">
          {/* Tipo de evento */}
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Tipo de evento</label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value as TipoEvento)}
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
            >
              <option>Clase adicional</option>
              <option>Tutoría</option>
              <option>Conferencia</option>
              <option>Otro</option>
            </select>
          </div>

          {/* Fecha y hora */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Fecha</label>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Hora de inicio</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Duración (horas)</label>
              <input
                type="number"
                min={1}
                max={6}
                value={duracion}
                onChange={(e) => setDuracion(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          {/* Espacio */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Tipo de espacio</label>
              <select
                value={espacio}
                onChange={(e) => setEspacio(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
              >
                <option>Aula</option>
                <option>Laboratorio</option>
                <option>Auditorio</option>
                <option>Sala de computo</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Infraestructura requerida</label>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm">Proyector</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm">Computadores</span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-sm">Sonido</span>
              </div>
            </div>
          </div>

          {/* Detalles */}
          <div>
            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Detalles adicionales</label>
            <textarea
              value={detalles}
              onChange={(e) => setDetalles(e.target.value)}
              rows={4}
              placeholder="Describe el propósito del evento y cualquier requisito específico."
              className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end">
            <motion.button
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow hover:from-blue-700 hover:to-blue-800 flex items-center gap-2"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => alert('Solicitud enviada (mock)')}
            >
              <Send className="w-4 h-4" /> Enviar Solicitud
            </motion.button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DoorOpen className="w-4 h-4 text-slate-500" />
              <h3 className="text-slate-800 dark:text-slate-200">Últimos espacios usados</h3>
            </div>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5">
              <li>Aula A-203 (Matemáticas I)</li>
              <li>Lab-F1 (Física I)</li>
              <li>Lab-C2 (Programación I)</li>
            </ul>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              <h3 className="text-slate-800 dark:text-slate-200">Espacios disponibles populares</h3>
            </div>
            <ul className="text-sm text-slate-600 dark:text-slate-400 list-disc pl-5">
              <li>Aula B-101 (capacidad 40)</li>
              <li>Lab-C2 (computadores x 25)</li>
              <li>Auditorio Central (capacidad 120)</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
