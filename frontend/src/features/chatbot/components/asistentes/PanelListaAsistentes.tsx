import { motion } from 'motion/react';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Bot, MapPin, MessageCircle, Search, Sparkles, User } from 'lucide-react';
import { getSafeIcon } from './iconoSeguro';
import type { useAsistentesVirtuales } from '../../hooks/useAsistentesVirtuales';

type Hook = ReturnType<typeof useAsistentesVirtuales>;

type Props = Pick<Hook, 'esPublico' | 'seccionalesPublico' | 'seccionalPublica' | 'setSeccionalPublica' | 'cargandoSeccionales' | 'searchTerm' | 'setSearchTerm' | 'filteredAsistentes' | 'asistenteActivo' | 'abrirChat'> & {
  modoEmbebido: boolean;
  mostrarLista: boolean;
  seccionalFija?: string;
  seccionalEtiqueta?: string;
  setVerLista: (ver: boolean) => void;
};

/** Panel izquierdo: seccional, buscador y lista de asistentes. */
export function PanelListaAsistentes({
  modoEmbebido,
  mostrarLista,
  esPublico,
  seccionalFija,
  seccionalEtiqueta,
  seccionalesPublico,
  seccionalPublica,
  setSeccionalPublica,
  cargandoSeccionales,
  searchTerm,
  setSearchTerm,
  filteredAsistentes,
  asistenteActivo,
  abrirChat,
  setVerLista
}: Props) {
  return (
    <motion.div
      initial={{ x: -100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`${modoEmbebido ? 'w-full md:w-[380px]' : 'w-[380px]'} ${mostrarLista ? 'flex' : 'hidden'} border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-col relative overflow-hidden`}
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

        {/* Seccional fija (enlace de una seccional): solo se muestra, no se cambia */}
        {esPublico && seccionalFija && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-white/25 bg-white/10 px-3 py-2.5 shadow-inner backdrop-blur-sm">
            <MapPin className="h-4 w-4 text-yellow-300" />
            <span className="text-sm font-semibold text-white">Seccional {seccionalEtiqueta ?? seccionalFija}</span>
          </div>
        )}

        {/* Seccional (acceso público): define qué asistentes se ven y con qué información responden */}
        {esPublico && !seccionalFija && (
          <div className="mb-4 rounded-2xl border border-white/25 bg-white/10 p-3 shadow-inner backdrop-blur-sm">
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-white/90">
              <MapPin className="h-3.5 w-3.5 text-yellow-300" />
              Tu seccional
            </div>
            <Select
              value={seccionalPublica}
              onValueChange={setSeccionalPublica}
              disabled={cargandoSeccionales || seccionalesPublico.length === 0}
            >
              <SelectTrigger className="h-11 w-full rounded-xl border-white/40 bg-white text-slate-900 shadow-md">
                <SelectValue placeholder={cargandoSeccionales ? 'Cargando seccionales...' : 'Selecciona tu seccional'} />
              </SelectTrigger>
              <SelectContent>
                {seccionalesPublico.map((seccional) => (
                  <SelectItem key={seccional} value={seccional}>
                    {seccional}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="mt-2 text-[11px] leading-snug text-white/75">
              Verás los asistentes disponibles en tu seccional y las respuestas usarán su información.
            </p>
          </div>
        )}

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
          const Icon = getSafeIcon(asistente.icon);
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
              onClick={() => { abrirChat(asistente); setVerLista(false); }}
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
  );
}
