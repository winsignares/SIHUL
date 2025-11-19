import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { GraduationCap, Lock, User, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AuthService } from '../lib/auth';
import type { Usuario } from '../lib/models';
import universityImage from '../assets/Image/UniversidadLibre.webp';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simular delay de red para realismo
    setTimeout(() => {
      const result = AuthService.login(email, password);
      
      if (result.success && result.usuario) {
        console.log('✅ Login exitoso:', result.usuario.nombre, result.usuario.rol);
        
        // Redirigir según el rol del usuario
        const roleDashboards: Record<Usuario['rol'], string> = {
          admin: '/admin',
          autorizado: '/audiovisual',
          consultor: '/consultor',
          consultorDocente: '/docente',
          consultorEstudiante: '/estudiante'
        };
        
        navigate(roleDashboards[result.usuario.rol]);
      } else {
        setError(result.error || 'Error al iniciar sesión');
      }
      
      setIsLoading(false);
    }, 500);
  };

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

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-6xl mx-4"
      >
        <div className="grid lg:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">
          {/* Left Side - Login Form */}
          <div className="p-12 lg:p-16 flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <div className="mb-8">
                <p className="text-[rgb(23,25,27)] mb-2 text-[20px] text-center font-bold italic">BIENVENIDOS A UNISPACE</p>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-600 to-red-800 rounded-xl flex items-center justify-center shadow-lg">
                    <GraduationCap className="w-7 h-7 text-yellow-400" />
                  </div>
                  <h1 className="bg-gradient-to-r from-red-600 to-red-800 bg-clip-text text-transparent text-[20px] font-bold">
                    SISTEMA DE GESTION UNIVERSITARIA
                  </h1>
                </div>
                <p className="text-[rgb(6,7,7)]">
                  Inicia sesión para acceder a la plataforma de gestión académica
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                    <Input
                      type="email"
                      placeholder="Correo Institucional"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-12 h-14 bg-slate-50 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-xl transition-all"
                      required
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="space-y-2"
                >
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                    <Input
                      type="password"
                      placeholder="Contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-12 h-14 bg-slate-50 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-xl transition-all"
                      required
                    />
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
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <Button
                    type="submit"
                    disabled={isLoading}
                    onMouseEnter={() => setIsHovered(true)}
                    onMouseLeave={() => setIsHovered(false)}
                    className="w-full h-14 bg-gradient-to-r from-red-600 via-red-700 to-red-800 hover:from-red-700 hover:via-red-800 hover:to-red-900 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-yellow-400/20 to-transparent"
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
            className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-12 lg:p-16 flex flex-col justify-center items-center text-white overflow-hidden"
          >
            {/* Background Image with Overlay */}
            <div
              className="absolute inset-0 bg-cover opacity-40"
              style={{
                backgroundImage: `url(${universityImage})`,
                backgroundPosition: '80% center' // desplaza la imagen hacia la derecha
              }}
            />
            
            {/* Animated Geometric Shapes */}
            <motion.div
              className="absolute top-10 right-10 w-32 h-32 border-4 border-yellow-400 rounded-full opacity-20"
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
              className="absolute bottom-10 left-10 w-24 h-24 border-4 border-blue-400 rounded-lg opacity-20"
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
                className="mb-8"
              >
                <div className="w-24 h-24 mx-auto mb-6 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/20 shadow-2xl">
                  <GraduationCap className="w-14 h-14 text-yellow-400" />
                </div>
                <h2 className="mb-4 text-white">
                  SISTEMA DE GESTIÓN
                </h2>
                <div className="w-20 h-1 bg-gradient-to-r from-yellow-400 to-yellow-600 mx-auto rounded-full mb-6"></div>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.6 }}
                className="space-y-4"
              >
                <p className="text-white/90 max-w-md mx-auto leading-relaxed">
                  Plataforma integral para la administración de espacios, horarios y programas académicos universitarios.
                </p>
                <p className="text-white/80">
                  Optimiza la gestión educativa con herramientas modernas y eficientes.
                </p>
              </motion.div>

              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.9, duration: 0.6 }}
                className="mt-12 grid grid-cols-3 gap-4"
              >
                {[
                  { icon: '📚', label: 'Horarios' },
                  { icon: '🏛️', label: 'Espacios' },
                  { icon: '📊', label: 'Reportes' }
                ].map((item, index) => (
                  <motion.div
                    key={item.label}
                    whileHover={{ scale: 1.05 }}
                    className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20"
                  >
                    <div className="text-3xl mb-2">{item.icon}</div>
                    <p className="text-white/90">{item.label}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Floating Particles */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-40"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{
                  y: [0, -30, 0],
                  opacity: [0.4, 0.8, 0.4],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
              />
            ))}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
