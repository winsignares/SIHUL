import { Button } from '../../share/button';
import { Input } from '../../share/input';
import {
  Bot,
  User,
  Sparkles,
  Check,
  CheckCheck,
  Search,
  Zap,
  Star,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAsistentesVirtuales } from '../../hooks/chatbot/useAsistentesVirtuales';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function AsistentesVirtuales() {
  const isMobile = useIsMobile();
  const {
    asistenteActivo,
    inputMensaje,
    setInputMensaje,
    isTyping,
    searchTerm,
    setSearchTerm,
    messagesEndRef,
    abrirChat,
    handleKeyPress,
    mensajesActuales,
    mostrarPreguntasRapidas,
    filteredAsistentes,
    enviarPreguntaRapida,
    enviarMensaje,
    preguntasRotadas
  } = useAsistentesVirtuales();

  return (
    <div className="flex-1 min-h-0 flex">
      {/* Panel Izquierdo - Lista de Agentes */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-[380px] border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex flex-col relative overflow-hidden"
      >
        {/* Efectos de fondo animados */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-red-500/5 to-yellow-500/5 rounded-full blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, 30, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 10, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl"
            animate={{
              x: [0, -30, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{ duration: 12, repeat: Infinity, delay: 1 }}
          />
        </div>

        {/* Header del Panel */}
        <div className="relative z-10 p-4 border-b border-slate-200 dark:border-slate-700 bg-gradient-to-r from-red-500 via-red-600 to-rose-600 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <motion.div
              className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center relative"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <User className="w-5 h-5 text-white" />
              <motion.div
                className="absolute inset-0 rounded-full bg-white/30"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </motion.div>
            <div className="flex-1">
              <motion.h2
                className="text-white"
                animate={{ opacity: [1, 0.8, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                Asistentes Virtuales
              </motion.h2>
              <div className="flex items-center gap-2">
                <motion.div
                  className="w-2 h-2 bg-green-400 rounded-full shadow-lg shadow-green-400/50"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
                <span className="text-white/80 text-sm">En línea</span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            >
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </motion.div>
          </div>

          {/* Buscador */}
          <motion.div
            className="relative"
            whileHover={{ scale: 1.02 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar agente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/90 dark:bg-slate-900/50 border-white/20 focus:bg-white focus:scale-105 transition-all"
            />
          </motion.div>
        </div>

        {/* Lista de Agentes */}
        <div className="flex-1 overflow-y-auto relative z-10 p-3 scrollbar-hidden">
          {filteredAsistentes.map((asistente, index) => {
            const Icon = asistente.icon;
            const isActive = asistenteActivo?.id === asistente.id;

            return (
              <motion.div
                key={asistente.id}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{
                  scale: 1.02,
                  y: -4,
                  boxShadow: isActive
                    ? '0 20px 40px rgba(239, 68, 68, 0.2)'
                    : '0 10px 30px rgba(0, 0, 0, 0.1)',
                  transition: { type: 'spring', stiffness: 400, damping: 25 }
                }}
                whileTap={{ scale: 0.98 }}
                onClick={() => abrirChat(asistente)}
                className={`mb-3 p-4 rounded-2xl cursor-pointer relative overflow-hidden group transition-all ${isActive
                  ? 'bg-gradient-to-br from-white via-red-50/30 to-rose-50/30 dark:from-slate-700 dark:via-red-900/10 dark:to-rose-900/10 border-2 border-red-200 dark:border-red-800 shadow-lg shadow-red-100 dark:shadow-red-900/20'
                  : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-md hover:border-slate-300 dark:hover:border-slate-600'
                  }`}
              >
                {/* Efecto de brillo al hover */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  whileHover={{ x: '100%' }}
                  transition={{ duration: 0.6 }}
                />

                <div className="flex items-start gap-3 relative z-10">
                  {/* Avatar del Agente */}
                  <div className="relative flex-shrink-0">
                    <motion.div
                      className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${asistente.bgGradient} flex items-center justify-center shadow-lg relative overflow-hidden`}
                      whileHover={{ scale: 1.15, rotate: 5 }}
                      whileTap={{ scale: 0.95 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Icon className="w-7 h-7 text-white relative z-10" />
                    </motion.div>
                    {asistente.online && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white shadow-lg shadow-green-500/50" />
                    )}
                  </div>

                  {/* Info del Agente */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <motion.span
                        className={`truncate ${isActive ? 'text-slate-900 dark:text-slate-100' : 'text-slate-900 dark:text-slate-100'}`}
                        whileHover={{ x: 3 }}
                      >
                        {asistente.nombre}
                      </motion.span>
                      <motion.span
                        className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0 ml-2"
                        animate={{ opacity: [1, 0.5, 1] }}
                        transition={{ duration: 3, repeat: Infinity }}
                      >
                        {asistente.timestamp}
                      </motion.span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-600 dark:text-slate-400 truncate flex-1">
                        {asistente.ultimoMensaje}
                      </span>
                    </div>

                    {/* Badge de estado */}
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2 flex items-center gap-1"
                      >
                        <div className="px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
                          <span className="text-xs text-red-700 dark:text-red-300 flex items-center gap-1">
                            <MessageCircle className="w-3 h-3" />
                            Chat activo
                          </span>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Indicador de activo - Barra lateral */}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute left-0 top-3 bottom-3 w-1.5 rounded-r-full bg-gradient-to-b ${asistente.bgGradient} shadow-lg`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Brillo decorativo en la esquina */}
                {isActive && (
                  <motion.div
                    className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-red-200/40 to-transparent rounded-2xl"
                    animate={{
                      opacity: [0.3, 0.6, 0.3],
                      scale: [1, 1.1, 1]
                    }}
                    transition={{ duration: 3, repeat: Infinity }}
                  />
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Footer Info */}
        <motion.div
          className="relative z-10 p-4 border-t border-slate-200 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-900/30 dark:to-slate-800/30"
          whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
        >
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
            >
              <Bot className="w-4 h-4" />
            </motion.div>
            <span>Powered by IA INTEGRADA</span>
            <motion.div
              animate={{
                rotate: [0, 15, -15, 0],
                scale: [1, 1.2, 1.2, 1]
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Sparkles className="w-3 h-3 text-yellow-500" />
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      {/* Panel Derecho - Chat */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex-1 min-h-0 flex flex-col bg-slate-50 dark:bg-slate-900/20 relative overflow-hidden"
      >
        {/* Efectos de fondo del chat */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
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
            <motion.div
              className="relative z-10 p-4 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-md"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <motion.div
                      className={`w-12 h-12 rounded-full bg-gradient-to-br ${asistenteActivo.bgGradient} flex items-center justify-center shadow-lg relative overflow-hidden`}
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <asistenteActivo.icon className="w-6 h-6 text-white relative z-10" />
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
                    <h2 className="text-slate-900 dark:text-slate-100">{asistenteActivo.nombre}</h2>
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

                {/* Indicadores de actividad */}
                <div className="flex items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    className="cursor-pointer"
                  >
                    <MessageCircle className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: -10 }}
                    className="cursor-pointer"
                  >
                    <Star className="w-5 h-5 text-slate-400 hover:text-yellow-500" />
                  </motion.div>
                </div>
              </div>
            </motion.div>

            {/* Área de Mensajes */}
            <div
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-4 relative z-10 scrollbar-hidden"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23cbd5e1' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
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
                        <asistenteActivo.icon className="w-4 h-4 text-white relative z-10" />
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
                        <div className="text-sm leading-relaxed whitespace-pre-line relative z-10">{mensaje.texto}</div>
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
                    <asistenteActivo.icon className="w-4 h-4 text-white" />
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

            {/* Input Area */}
            <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 relative z-10">
              <div className="flex gap-2">
                <Input
                  value={inputMensaje}
                  onChange={(e) => setInputMensaje(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder={`Escribe un mensaje a ${asistenteActivo.nombre}...`}
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-red-500/20"
                />
                <Button
                  onClick={enviarMensaje}
                  disabled={!inputMensaje.trim() || isTyping}
                  className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-500/20"
                >
                  <Zap className="w-4 h-4" />
                </Button>
              </div>
              <div className="text-center mt-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">
                  Presiona Enter para enviar
                </span>
              </div>
            </div>
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
    </div>
  );
}