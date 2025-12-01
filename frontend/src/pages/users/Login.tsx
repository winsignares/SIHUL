import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { GraduationCap, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import universityImage from '../../assets/Image/UniversidadLibre.webp';
import { useLogin } from '../../hooks/users/useLogin';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isHovered,
    setIsHovered,
    isLoading,
    handleSubmit
  } = useLogin();

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      {/* Animated Background Elements */}
      <motion.div
        className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-red-600 to-red-700 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-full opacity-20 blur-3xl"
        animate={{
          x: [0, -100, 0],
          y: [0, 50, 0],
          scale: [1, 1.3, 1],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
      <motion.div
        className="absolute top-1/2 left-1/2 w-72 h-72 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full opacity-15 blur-3xl"
        animate={{
          x: [-150, 150, -150],
          y: [150, -150, 150],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />

      {/* Floating Particles - Small Animated Particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className="absolute w-1 h-1 bg-gradient-to-r from-red-400 to-blue-400 rounded-full opacity-30"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -100, 0],
            x: [0, Math.random() * 50 - 25, 0],
            opacity: [0.1, 0.5, 0.1],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-6xl mx-4"
      >
        <div className="grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden border border-white/20 backdrop-blur-xl max-w-5xl">
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-red-500/10 via-transparent to-yellow-500/10 pointer-events-none" />
          {/* Left Side - Login Form */}
          <div className="p-8 lg:p-12 flex flex-col justify-center bg-gradient-to-br from-white via-white to-slate-50/50 relative">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="mb-12">
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="text-[rgb(23,25,27)] mb-4 text-[24px] text-center font-bold italic tracking-wide"
                >
                  BIENVENIDOS A UNISPACE
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                  className="flex items-center gap-3 mb-8 justify-center"
                >
                  <motion.div 
                    className="w-16 h-16 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-2xl transition-all hover:scale-110"
                    whileHover={{ scale: 1.1 }}
                  >
                    <GraduationCap className="w-9 h-9 text-yellow-300" />
                  </motion.div>
                  <h1 className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 bg-clip-text text-transparent text-[24px] font-bold leading-tight tracking-tight">
                    SISTEMA DE GESTION UNIVERSITARIA
                  </h1>
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.25, duration: 0.8 }}
                  className="h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent mb-6 rounded-full"
                />
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-[rgb(6,7,7)] text-center text-sm leading-relaxed font-medium"
                >
                  Inicia sesión para acceder a la plataforma de gestión académica
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Correo Institucional</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
                    <Input
                      type="email"
                      placeholder="Correo Institucional"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-gradient-to-r from-slate-50 to-blue-50/30 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 pr-12 h-14 bg-gradient-to-r from-slate-50 to-blue-50/30 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/30 rounded-xl transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                      required
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </motion.button>
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="pt-2"
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="w-full h-14 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl shadow-lg hover:shadow-2xl hover:shadow-red-600/50 transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed font-bold text-lg tracking-wide uppercase"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400/30 via-yellow-300/20 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: isHovered ? '100%' : '-100%' }}
                      transition={{ duration: 0.6 }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? 'INICIANDO SESIÓN...' : 'INICIAR SESIÓN'}
                      {!isLoading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
                    </span>
                  </Button>
                </motion.div>
              </form>


            </motion.div>
          </div>

          {/* Right Side - Image/Branding */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-8 lg:p-12 flex flex-col justify-center items-center text-white overflow-hidden"
          >
            {/* Background Image with Overlay */}
            <div
              className="absolute inset-0 bg-cover bg-center opacity-40"
              style={{ backgroundImage: `url(${universityImage})` }}
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

            {/* Floating Particles - Right Side */}
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={`right-particle-${i}`}
                className="absolute w-1 h-1 bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full opacity-40"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -50, 0],
                  x: [0, Math.random() * 30 - 15, 0],
                  opacity: [0.2, 0.6, 0.2],
                  scale: [0.5, 1.2, 0.5],
                }}
                transition={{
                  duration: 5 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                  ease: "easeInOut"
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
