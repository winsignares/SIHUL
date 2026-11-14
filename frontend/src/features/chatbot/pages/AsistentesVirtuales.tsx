import { useState } from 'react';
import { Bot } from 'lucide-react';
import { motion } from 'motion/react';
import { useAsistentesVirtuales } from '../hooks/useAsistentesVirtuales';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { VistaPreviaDocumento, type DocumentoAbierto } from '../components/VistaPreviaDocumento';
import { PanelListaAsistentes } from '../components/asistentes/PanelListaAsistentes';
import { EncabezadoChat } from '../components/asistentes/EncabezadoChat';
import { AreaMensajes } from '../components/asistentes/AreaMensajes';
import { EntradaMensaje } from '../components/asistentes/EntradaMensaje';

interface AsistentesVirtualesProps {
  /** Página embebible del chat público: sin menú de la aplicación, con la seccional fija y pantalla única en celular. */
  modoEmbebido?: boolean;
  seccionalFija?: string;
  /** Nombre de la seccional para mostrar (con tildes); por defecto, el mismo valor de `seccionalFija`. */
  seccionalEtiqueta?: string;
}

export default function AsistentesVirtuales({ modoEmbebido = false, seccionalFija, seccionalEtiqueta }: AsistentesVirtualesProps = {}) {
  const isMobile = useIsMobile();
  const [verLista, setVerLista] = useState(false);
  const [documentoAbierto, setDocumentoAbierto] = useState<DocumentoAbierto | null>(null);
  const floatingDotPositions = [
    'left-[10%] top-[15%]',
    'left-[25%] top-[65%]',
    'left-[50%] top-[20%]',
    'left-[70%] top-[55%]',
    'left-[85%] top-[30%]'
  ];
  const asistentes = useAsistentesVirtuales({ publicoForzado: modoEmbebido, seccionalFija });
  const { asistenteActivo } = asistentes;

  // En celular (solo en modo embebido) se muestra una pantalla a la vez: el chat, o la lista de asistentes.
  const enCelularEmbebido = modoEmbebido && isMobile;
  const mostrarLista = !enCelularEmbebido || verLista || !asistenteActivo;
  const mostrarChat = !enCelularEmbebido || !mostrarLista;

  return (
    <div className="flex-1 min-h-0 flex">
      {/* Panel Izquierdo - Lista de Agentes */}
      <PanelListaAsistentes
        {...asistentes}
        modoEmbebido={modoEmbebido}
        mostrarLista={mostrarLista}
        seccionalFija={seccionalFija}
        seccionalEtiqueta={seccionalEtiqueta}
        setVerLista={setVerLista}
      />

      {/* Panel Derecho - Chat */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className={`flex-1 min-h-0 ${mostrarChat ? 'flex' : 'hidden'} flex-col bg-slate-50 dark:bg-slate-900/20 relative overflow-hidden`}
      >
        {/* Efectos de fondo del chat */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute w-2 h-2 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full ${floatingDotPositions[i]}`}
              animate={{
                y: [0, -30, 0],
                opacity: [0, 1, 0],
                scale: [0, 1, 0]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: i * 0.5
              }}
            />
          ))}
        </div>

        {asistenteActivo ? (
          <>
            {/* Header del Chat */}
            <EncabezadoChat
              {...asistentes}
              asistenteActivo={asistenteActivo}
              enCelularEmbebido={enCelularEmbebido}
              setVerLista={setVerLista}
            />

            {/* Panel de Historial - DESACTIVADO */}
            {/*
            <AnimatePresence>
              {mostrarHistorial && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="relative z-10 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border-b border-slate-200 dark:border-slate-700 overflow-hidden"
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                        <Clock className="w-4 h-4" />
                        Conversaciones Anteriores
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setMostrarHistorial(false)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>

                    {cargandoHistorial ? (
                      <div className="text-center py-4">
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="inline-block"
                        >
                          <Bot className="w-6 h-6 text-blue-500" />
                        </motion.div>
                        <p className="text-sm text-slate-500 mt-2">Cargando historial...</p>
                      </div>
                    ) : conversacionesHistorial.length === 0 ? (
                      <div className="text-center py-4">
                        <History className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-sm text-slate-500">No hay conversaciones anteriores</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-hidden">
                        {conversacionesHistorial.map((conv, index) => (
                          <motion.button
                            key={conv.chat_id}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => cargarConversacionAnterior(conv.chat_id)}
                            className="w-full text-left p-3 rounded-lg bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md group"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400">
                                  {conv.primer_mensaje}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                  {new Date(conv.fecha_inicio).toLocaleDateString('es-ES', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-1 rounded-full">
                                  {conv.total_interacciones} msg
                                </span>
                              </div>
                            </div>
                          </motion.button>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            */}

            {/* Área de Mensajes */}
            <AreaMensajes
              {...asistentes}
              asistenteActivo={asistenteActivo}
              setDocumentoAbierto={setDocumentoAbierto}
            />

            {/* Input Area */}
            <EntradaMensaje {...asistentes} asistenteActivo={asistenteActivo} />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            <div className="text-center">
              <Bot className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>Selecciona un asistente para comenzar</p>
            </div>
          </div>
        )}
      </motion.div>
      <VistaPreviaDocumento documento={documentoAbierto} onCerrar={() => setDocumentoAbierto(null)} />
    </div>
  );
}
