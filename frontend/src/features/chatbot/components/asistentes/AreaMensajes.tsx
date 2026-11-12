import { motion, AnimatePresence } from 'motion/react';
import { Check, CheckCheck, Sparkles } from 'lucide-react';
import { MensajeConCitas } from '../MensajeConCitas';
import { AnexosRespuesta } from '../AnexosRespuesta';
import type { DocumentoAbierto } from '../VistaPreviaDocumento';
import { getSafeIcon } from './iconoSeguro';
import type { useAsistentesVirtuales } from '../../hooks/useAsistentesVirtuales';

type Hook = ReturnType<typeof useAsistentesVirtuales>;
type Asistente = NonNullable<Hook['asistenteActivo']>;

type Props = Pick<Hook, 'esPublico' | 'isTyping' | 'messagesEndRef' | 'mensajesActuales' | 'mostrarPreguntasRapidas' | 'preguntasRotadas' | 'enviarPreguntaRapida'> & {
  asistenteActivo: Asistente;
  setDocumentoAbierto: (documento: DocumentoAbierto | null) => void;
};

/** Mensajes de la conversación, indicador de escritura y preguntas sugeridas. */
export function AreaMensajes({
  asistenteActivo,
  esPublico,
  isTyping,
  messagesEndRef,
  mensajesActuales,
  mostrarPreguntasRapidas,
  preguntasRotadas,
  enviarPreguntaRapida,
  setDocumentoAbierto
}: Props) {
  const ActiveIcon = getSafeIcon(asistenteActivo.icon);

  return (
    <div
      className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 relative z-10 chatbot-messages-bg"
    >
      <AnimatePresence>
        {mensajesActuales.map((mensaje, index) => (
          <motion.div
            key={mensaje.id}
            initial={{ opacity: 0, y: 20, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              delay: index * 0.05
            }}
            className={`flex gap-2 ${mensaje.tipo === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {/* Avatar */}
            {mensaje.tipo === 'bot' && (
              <motion.div
                className={`w-8 h-8 rounded-full bg-gradient-to-br ${asistenteActivo.bgGradient} flex items-center justify-center flex-shrink-0 shadow-md relative overflow-hidden`}
                whileHover={{ scale: 1.2, rotate: 10 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <ActiveIcon className="w-4 h-4 text-white relative z-10" />
                <motion.div
                  className="absolute inset-0 bg-white/20"
                  animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
              </motion.div>
            )}

            {/* Burbuja de Mensaje */}
            <div className={`max-w-[70%] ${mensaje.tipo === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
              <motion.div
                className={`rounded-2xl px-4 py-3 shadow-lg relative overflow-hidden ${mensaje.tipo === 'user'
                  ? 'bg-gradient-to-br from-red-500 via-red-600 to-rose-600 text-white rounded-tr-md'
                  : 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-2 border-slate-200 dark:border-slate-700 rounded-tl-md'
                  }`}
                whileHover={{
                  scale: 1.02,
                  y: -2,
                  boxShadow: mensaje.tipo === 'user'
                    ? '0 20px 40px rgba(239, 68, 68, 0.3)'
                    : '0 20px 40px rgba(0, 0, 0, 0.1)'
                }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                {/* Efecto de brillo */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />
                <div className="text-sm leading-relaxed whitespace-pre-line relative z-10">
                  {mensaje.tipo === 'bot' && !esPublico && asistenteActivo
                    ? <MensajeConCitas texto={mensaje.texto} onAbrir={(archivo, pagina) => setDocumentoAbierto({ agenteId: asistenteActivo.id, archivo, pagina })} />
                    : mensaje.texto}
                </div>
                {mensaje.tipo === 'bot' && (
                  <div className="relative z-10 whitespace-normal">
                    <AnexosRespuesta anexos={mensaje.anexos} />
                  </div>
                )}
              </motion.div>

              {/* Timestamp y Estado */}
              <div className={`flex items-center gap-1 px-2 ${mensaje.tipo === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {mensaje.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                </span>
                {mensaje.tipo === 'user' && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, delay: 0.2 }}
                  >
                    {mensaje.leido ? (
                      <CheckCheck className="w-3 h-3 text-blue-500" />
                    ) : (
                      <Check className="w-3 h-3 text-slate-400" />
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        <div ref={messagesEndRef} />
      </AnimatePresence>

      {/* Indicador de escritura */}
      {isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex gap-2"
        >
          <motion.div
            className={`w-8 h-8 rounded-full bg-gradient-to-br ${asistenteActivo.bgGradient} flex items-center justify-center flex-shrink-0 shadow-md`}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <ActiveIcon className="w-4 h-4 text-white" />
          </motion.div>
          <div className="bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-md px-4 py-3 shadow-lg">
            <div className="flex gap-1">
              {[0, 0.2, 0.4].map((delay, i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-gradient-to-br from-red-500 to-rose-600 rounded-full"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay }}
                />
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Preguntas Rápidas */}
      {mostrarPreguntasRapidas && !isTyping && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col gap-2 pl-10"
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-4 h-4 text-yellow-500" />
            </motion.div>
            <span className="text-sm text-slate-600 dark:text-slate-400">Preguntas sugeridas:</span>
          </div>
          {preguntasRotadas.map((pregunta, idx) => (
            <motion.button
              key={`${pregunta}-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              onClick={() => enviarPreguntaRapida(pregunta)}
              whileHover={{
                scale: 1.03,
                x: 8,
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)'
              }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-white to-slate-50 dark:from-slate-800 dark:to-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl text-left text-sm text-slate-700 dark:text-slate-300 hover:border-red-300 dark:hover:border-red-700 transition-all relative overflow-hidden group"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-rose-500/5"
                initial={{ x: '-100%' }}
                whileHover={{ x: '0%' }}
                transition={{ duration: 0.3 }}
              />
              <span className="relative z-10">{pregunta}</span>
            </motion.button>
          ))}
        </motion.div>
      )}
    </div>
  );
}
