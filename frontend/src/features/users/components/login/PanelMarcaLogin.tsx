import { GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import universityImage from '../../../../assets/Image/universidad_libre.jpg';
import { RightSideParticles } from './FondoParticulas';

/** Panel con la imagen y la marca de la universidad. */
export function PanelMarcaLogin() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3, duration: 0.6 }}
      className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-8 lg:p-12 flex flex-col justify-center items-center text-white overflow-hidden"
    >
      {/* Background Image with Overlay */}
      <motion.div
        className="absolute inset-0 bg-cover bg-center opacity-50"
        style={{ backgroundImage: `url(${universityImage})` }}
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      {/* Dark Overlay for Text Contrast */}
      <motion.div 
        className="absolute inset-0 bg-gradient-to-br from-red-900/50 via-red-800/40 to-red-900/60"
        animate={{
          opacity: [0.6, 0.7, 0.6],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Animated Geometric Shapes */}
      <motion.div
        className="absolute top-10 right-10 w-32 h-32 border-4 border-yellow-400 rounded-full opacity-30 shadow-lg shadow-yellow-400/20"
        animate={{
          scale: [1, 1.2, 1],
          rotate: [0, 180, 360],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "linear"
        }}
      />
      <motion.div
        className="absolute bottom-10 left-10 w-24 h-24 border-4 border-blue-400 rounded-lg opacity-30 shadow-lg shadow-blue-400/20"
        animate={{
          scale: [1, 1.3, 1],
          rotate: [0, -180, -360],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "linear"
        }}
      />

      {/* Content */}
      <div className="relative z-10 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="mb-12"
        >
          <motion.div 
            className="w-32 h-32 mx-auto mb-10 bg-gradient-to-br from-white/25 via-white/15 to-white/5 backdrop-blur-lg rounded-3xl flex items-center justify-center border-2 border-white/50 shadow-2xl shadow-yellow-400/30"
            animate={{
              scale: [1, 1.08, 1],
              boxShadow: ['0 0 20px rgba(250, 204, 21, 0.2)', '0 0 40px rgba(250, 204, 21, 0.4)', '0 0 20px rgba(250, 204, 21, 0.2)'],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <GraduationCap className="w-18 h-18 text-yellow-200" />
          </motion.div>
          <motion.h2 
            initial={{ opacity: 0, scale: 0.7, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 1 }}
            className="mb-8 text-white text-4xl font-bold bg-gradient-to-r from-yellow-100 via-yellow-300 to-yellow-400 bg-clip-text text-transparent drop-shadow-2xl tracking-tight leading-snug"
          >
            SISTEMA DE<br />GESTIÓN
          </motion.h2>
          <motion.div 
            initial={{ width: 0, opacity: 0, scaleX: 0 }}
            animate={{ width: 140, opacity: 1, scaleX: 1 }}
            transition={{ delay: 1, duration: 1, ease: "easeOut" }}
            className="h-2 bg-gradient-to-r from-yellow-300 via-yellow-400 via-yellow-300 to-yellow-500 mx-auto rounded-full mb-10 shadow-lg shadow-yellow-400/70"
          ></motion.div>
        </motion.div>

        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.1, duration: 0.7 }}
          className="space-y-5 px-4"
        >
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent mb-6"
          />
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 0.7 }}
            className="text-white/98 max-w-lg mx-auto leading-relaxed text-base font-semibold tracking-wide"
          >
            Plataforma integral para la administración de espacios, horarios y programas académicos universitarios.
          </motion.p>
          <motion.p 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.45, duration: 0.7 }}
            className="text-white/95 font-semibold text-base tracking-wide"
          >
            Optimiza la gestión educativa con herramientas modernas y eficientes.
          </motion.p>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.6, duration: 0.8 }}
            className="h-px bg-gradient-to-r from-transparent via-yellow-400/50 to-transparent mt-6"
          />
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          className="mt-14 grid grid-cols-3 gap-5"
        >
          {[
            { icon: '📚', label: 'Horarios' },
            { icon: '🏛️', label: 'Espacios' },
            { icon: '📊', label: 'Reportes' }
          ].map((item, index) => (
            <motion.div
              key={item.label}
              initial={{ scale: 1, y: 0 }}
              animate={{ 
                scale: [1, 1.15, 1],
                y: [0, -8, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: index * 0.35,
                ease: "easeInOut"
              }}
              whileHover={{ scale: 1.25, y: -12 }}
              className="bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-lg p-5 rounded-2xl border-2 border-white/40 shadow-lg hover:shadow-2xl hover:shadow-yellow-400/40 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              <motion.div 
                className="text-5xl mb-3 group-hover:scale-125 transition-transform relative z-10"
                animate={{ 
                  y: [0, -6, 0],
                }}
                transition={{
                  duration: 2.5,
                  repeat: Infinity,
                  delay: index * 0.35,
                  ease: "easeInOut"
                }}
              >
                {item.icon}
              </motion.div>
              <p className="text-white/95 font-bold text-sm tracking-wide relative z-10">{item.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <RightSideParticles />
    </motion.div>
  );
}
