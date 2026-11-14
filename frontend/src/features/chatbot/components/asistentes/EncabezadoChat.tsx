import { motion } from 'motion/react';
import { Button } from '../../../../components/ui/button';
import { ChevronLeft, RotateCcw, Zap } from 'lucide-react';
import { getSafeIcon } from './iconoSeguro';
import type { useAsistentesVirtuales } from '../../hooks/useAsistentesVirtuales';

type Hook = ReturnType<typeof useAsistentesVirtuales>;
type Asistente = NonNullable<Hook['asistenteActivo']>;

type Props = Pick<Hook, 'isTyping' | 'limpiarConversacion'> & {
  asistenteActivo: Asistente;
  enCelularEmbebido: boolean;
  setVerLista: (ver: boolean) => void;
};

/** Encabezado del chat: asistente activo, estado y nueva conversación. */
export function EncabezadoChat({
  asistenteActivo,
  enCelularEmbebido,
  setVerLista,
  isTyping,
  limpiarConversacion
}: Props) {
  const ActiveIcon = getSafeIcon(asistenteActivo.icon);

  return (
    <motion.div
      className="relative z-10 p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-md"
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {enCelularEmbebido && (
            <button
              type="button"
              onClick={() => setVerLista(true)}
              className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-600 dark:border-slate-600 dark:text-slate-300"
              aria-label="Ver otros asistentes"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <div className="relative">
            <motion.div
              className={`w-12 h-12 rounded-full bg-gradient-to-br ${asistenteActivo.bgGradient} flex items-center justify-center shadow-lg relative overflow-hidden`}
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <ActiveIcon className="w-6 h-6 text-white relative z-10" />
              <motion.div
                className="absolute inset-0 bg-white/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            {asistenteActivo.online && (
              <motion.div
                className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white shadow-lg"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-slate-900 dark:text-slate-100">{asistenteActivo.nombre}</h2>
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1">
              {isTyping ? (
                <motion.span
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className="flex items-center gap-1"
                >
                  <Zap className="w-3 h-3" />
                  escribiendo...
                </motion.span>
              ) : (
                <>
                  <motion.div
                    className="w-2 h-2 bg-green-500 rounded-full shadow-lg shadow-green-500/50"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  <span>En línea</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Botones de Acción */}
        <div className="flex items-center gap-2">
          {/* Botón Historial - DESACTIVADO */}
          {/*
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMostrarHistorial(!mostrarHistorial);
                if (!mostrarHistorial) {
                  cargarHistorialConversaciones();
                }
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 hover:bg-gradient-to-r hover:from-blue-100 hover:to-indigo-100 dark:hover:from-blue-900/40 dark:hover:to-indigo-900/40 hover:border-blue-300 dark:hover:border-blue-700 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Ver historial de conversaciones"
            >
              <History className="w-4 h-4" />
              <span className="text-xs font-medium">Historial</span>
            </Button>
          </motion.div>
          */}

          {/* Botón Nueva Conversación */}
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => limpiarConversacion(asistenteActivo.id)}
              className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-gradient-to-r hover:from-red-100 hover:to-rose-100 dark:hover:from-red-900/40 dark:hover:to-rose-900/40 hover:border-red-300 dark:hover:border-red-700 transition-all duration-200 shadow-sm hover:shadow-md"
              title="Iniciar nueva conversación"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="text-xs font-medium">Nueva</span>
            </Button>
          </motion.div>
        </div>
      </div>

    </motion.div>
  );
}
