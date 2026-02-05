import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { GraduationCap, Lock, User, ArrowRight, Eye, EyeOff, Mail } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import universityImage from '../../assets/Image/universidad_libre.jpg';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useRegister } from '../../hooks/users/useRegister';

export default function Register() {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const {
    formData,
    isLoading,
    error,
    isHovered,
    setIsHovered,
    handleChange,
    handleSubmit,
    navigate
  } = useRegister();

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${isMobile ? 'p-4' : 'p-8'} bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100`}>
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

      {/* Floating Particles */}
      {[...Array(50)].map((_, i) => (
        <motion.div
          key={`particle-${i}`}
          className={`absolute rounded-full opacity-40 ${
            i % 3 === 0 ? 'bg-gradient-to-r from-red-400 to-red-500' :
            i % 3 === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
            'bg-gradient-to-r from-blue-400 to-blue-500'
          }`}
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${2 + Math.random() * 4}px`,
            height: `${2 + Math.random() * 4}px`,
          }}
          animate={{
            y: [0, -150, 0],
            x: [0, Math.random() * 100 - 50, 0],
            opacity: [0.1, 0.6, 0.1],
            scale: [0.5, 1.2, 0.5],
          }}
          transition={{
            duration: 6 + Math.random() * 6,
            repeat: Infinity,
            delay: Math.random() * 4,
            ease: "easeInOut"
          }}
        />
      ))}

      {/* Main Register Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-6xl mx-4"
      >
        <div className={`grid ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'} bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/30 max-w-5xl`}>
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/3 via-transparent to-transparent pointer-events-none" />
          
          {/* Left Side - Register Form */}
          <div className="p-8 lg:p-14 flex flex-col justify-center bg-white relative">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="mb-8">
                <motion.p 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1, duration: 0.6 }}
                  className="text-slate-900 mb-3 text-2xl text-center font-bold tracking-tight"
                >
                  CREAR CUENTA
                </motion.p>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                  className="flex items-center gap-3 mb-6 justify-center"
                >
                  <motion.div 
                    className="w-16 h-16 bg-gradient-to-br from-red-600 via-red-700 to-red-800 rounded-2xl flex items-center justify-center shadow-lg hover:shadow-2xl transition-all hover:scale-110"
                    whileHover={{ scale: 1.1 }}
                  >
                    <GraduationCap className="w-9 h-9 text-yellow-300" />
                  </motion.div>
                  <h1 className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent text-xl font-bold leading-tight tracking-tight">
                    GESTIÓN UNIVERSITARIA
                  </h1>
                </motion.div>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: 0.25, duration: 0.8 }}
                  className="h-0.5 bg-gradient-to-r from-transparent via-red-600 to-transparent mb-4 rounded-full"
                />
                <motion.p 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="text-slate-600 text-center text-sm leading-relaxed font-medium"
                >
                  Regístrate para acceder a la plataforma
                </motion.p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Nombre Completo */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Nombre Completo</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
                    <Input
                      type="text"
                      name="nombreCompleto"
                      placeholder="Juan Pérez García"
                      value={formData.nombreCompleto}
                      onChange={handleChange}
                      className="pl-12 h-11 bg-slate-50 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-slate-900"
                    />
                  </div>
                </motion.div>

                {/* Correo */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Correo Institucional</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
                    <Input
                      type="email"
                      name="correo"
                      placeholder="correo@unilibre.edu.co"
                      value={formData.correo}
                      onChange={handleChange}
                      className="pl-12 h-11 bg-slate-50 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-slate-900"
                    />
                  </div>
                </motion.div>

                {/* Confirmar Correo */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Confirmar Correo</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
                    <Input
                      type="email"
                      name="confirmarCorreo"
                      placeholder="correo@unilibre.edu.co"
                      value={formData.confirmarCorreo}
                      onChange={handleChange}
                      className="pl-12 h-11 bg-slate-50 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-slate-900"
                    />
                  </div>
                </motion.div>

                {/* Contraseña */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="pl-12 pr-12 h-11 bg-slate-50 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-slate-900"
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

                {/* Confirmar Contraseña */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.55, duration: 0.5 }}
                  className="space-y-2"
                >
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Confirmar Contraseña</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      name="confirmarPassword"
                      placeholder="••••••••"
                      value={formData.confirmarPassword}
                      onChange={handleChange}
                      className="pl-12 pr-12 h-11 bg-slate-50 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-slate-900"
                    />
                    <motion.button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors duration-300"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {showConfirmPassword ? (
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
                    className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg font-medium text-sm"
                  >
                    {error}
                  </motion.div>
                )}

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.5 }}
                  className="pt-4"
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white rounded-lg shadow-lg hover:shadow-xl hover:shadow-red-600/40 transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-base tracking-wide uppercase"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 via-yellow-300/10 to-transparent"
                      initial={{ x: '-100%' }}
                      animate={{ x: isHovered ? '100%' : '-100%' }}
                      transition={{ duration: 0.5 }}
                    />
                    <span className="relative flex items-center justify-center gap-2">
                      {isLoading ? 'CREANDO CUENTA...' : 'REGISTRARSE'}
                      {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
                    </span>
                  </Button>
                </motion.div>

                {/* Ya tienes cuenta */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.65, duration: 0.5 }}
                  className="text-center pt-4"
                >
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-slate-600 hover:text-red-600 transition-colors duration-200 font-medium"
                  >
                    ¿Ya tienes cuenta?{' '}
                    <span className="text-red-600 hover:text-red-700 font-semibold hover:underline">
                      Iniciar Sesión
                    </span>
                  </button>
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

            {/* Content */}
            <motion.div 
              className="relative z-10 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <motion.div
                className="mb-8"
                animate={{
                  scale: [1, 1.1, 1],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
              >
                <GraduationCap className="w-24 h-24 mx-auto text-yellow-300 drop-shadow-lg" />
              </motion.div>
              <h2 className="text-4xl font-bold mb-6 drop-shadow-lg">Únete a UNISPACE</h2>
              <p className="text-lg text-white/90 drop-shadow-md leading-relaxed mb-8">
                Crea tu cuenta y accede a todos los servicios de gestión universitaria
              </p>
              
              <div className="space-y-4">
                <motion.div 
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-700 font-bold text-xl">✓</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Gestión de Horarios</p>
                    <p className="text-sm text-white/80">Consulta y administra tus horarios académicos</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-700 font-bold text-xl">✓</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Reserva de Espacios</p>
                    <p className="text-sm text-white/80">Solicita y gestiona espacios universitarios</p>
                  </div>
                </motion.div>

                <motion.div 
                  className="flex items-center gap-4 bg-white/10 backdrop-blur-sm p-4 rounded-lg"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="w-12 h-12 bg-yellow-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-red-700 font-bold text-xl">✓</span>
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">Acceso a Recursos</p>
                    <p className="text-sm text-white/80">Utiliza todos los recursos académicos disponibles</p>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
