import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { motion } from 'motion/react';

interface CountdownTimerProps {
  minutosRestantes: number;
  segundosRestantes: number;
  tipo: 'apertura' | 'cierre';
  onTimeUp?: () => void;
}

/**
 * Componente de temporizador con colores dinámicos según urgencia
 * 
 * Colores para APERTURA:
 * - Rojo: < 5 min
 * - Naranja: 5-10 min
 * - Amarillo: 10-15 min
 * - Azul: > 15 min
 * 
 * Colores para CIERRE:
 * - Rojo: < 5 min
 * - Morado: 5-10 min
 * - Índigo: 10-15 min
 * - Gris: > 15 min
 */
export default function CountdownTimer({ 
  minutosRestantes: minInicial, 
  segundosRestantes: segInicial, 
  tipo,
  onTimeUp 
}: CountdownTimerProps) {
  const [minutos, setMinutos] = useState(minInicial);
  const [segundos, setSegundos] = useState(segInicial);

  useEffect(() => {
    // Actualizar el countdown cada segundo
    const interval = setInterval(() => {
      if (segundos > 0) {
        setSegundos(segundos - 1);
      } else if (minutos > 0) {
        setMinutos(minutos - 1);
        setSegundos(59);
      } else {
        // Tiempo agotado
        clearInterval(interval);
        onTimeUp?.();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [minutos, segundos, onTimeUp]);

  // Calcular el total de minutos para determinar el color
  const tiempoTotal = minutos + (segundos / 60);

  // Determinar colores según urgencia y tipo
  const getColorClasses = () => {
    if (tipo === 'apertura') {
      if (tiempoTotal < 5) {
        return {
          bg: 'bg-gradient-to-br from-red-500 to-red-600',
          border: 'border-red-300',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-100 dark:bg-red-950',
          pulse: true
        };
      } else if (tiempoTotal < 10) {
        return {
          bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
          border: 'border-orange-300',
          text: 'text-orange-700 dark:text-orange-300',
          badge: 'bg-orange-100 dark:bg-orange-950',
          pulse: false
        };
      } else if (tiempoTotal < 15) {
        return {
          bg: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
          border: 'border-yellow-300',
          text: 'text-yellow-700 dark:text-yellow-300',
          badge: 'bg-yellow-100 dark:bg-yellow-950',
          pulse: false
        };
      } else {
        return {
          bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
          border: 'border-blue-300',
          text: 'text-blue-700 dark:text-blue-300',
          badge: 'bg-blue-100 dark:bg-blue-950',
          pulse: false
        };
      }
    } else {
      // cierre
      if (tiempoTotal < 5) {
        return {
          bg: 'bg-gradient-to-br from-red-500 to-red-600',
          border: 'border-red-300',
          text: 'text-red-700 dark:text-red-300',
          badge: 'bg-red-100 dark:bg-red-950',
          pulse: true
        };
      } else if (tiempoTotal < 10) {
        return {
          bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
          border: 'border-purple-300',
          text: 'text-purple-700 dark:text-purple-300',
          badge: 'bg-purple-100 dark:bg-purple-950',
          pulse: false
        };
      } else if (tiempoTotal < 15) {
        return {
          bg: 'bg-gradient-to-br from-indigo-500 to-indigo-600',
          border: 'border-indigo-300',
          text: 'text-indigo-700 dark:text-indigo-300',
          badge: 'bg-indigo-100 dark:bg-indigo-950',
          pulse: false
        };
      } else {
        return {
          bg: 'bg-gradient-to-br from-slate-500 to-slate-600',
          border: 'border-slate-300',
          text: 'text-slate-700 dark:text-slate-300',
          badge: 'bg-slate-100 dark:bg-slate-950',
          pulse: false
        };
      }
    }
  };

  const colors = getColorClasses();

  // Formatear tiempo para display
  const formatTime = () => {
    const minStr = minutos.toString().padStart(2, '0');
    const segStr = segundos.toString().padStart(2, '0');
    return `${minStr}:${segStr}`;
  };

  return (
    <motion.div
      className={`flex items-center gap-3 p-3 rounded-lg border-2 ${colors.border} ${colors.badge}`}
      animate={colors.pulse ? { scale: [1, 1.02, 1] } : {}}
      transition={colors.pulse ? { duration: 1, repeat: Infinity } : {}}
    >
      <div className={`w-12 h-12 rounded-full ${colors.bg} flex items-center justify-center shadow-lg`}>
        <Clock className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
          {tipo === 'apertura' ? 'Tiempo hasta apertura' : 'Tiempo hasta cierre'}
        </p>
        <p className={`text-2xl font-bold font-mono ${colors.text}`}>
          {formatTime()}
        </p>
      </div>
    </motion.div>
  );
}
