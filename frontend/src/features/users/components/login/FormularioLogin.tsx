import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { GraduationCap, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import ReCAPTCHA from 'react-google-recaptcha';
import type { useLoginPagina } from '../../hooks/useLoginPagina';

type Gestion = ReturnType<typeof useLoginPagina>;

/** Formulario de inicio de sesión y acceso público. */
export function FormularioLogin({ navigate, showPassword, setShowPassword, publicRecaptchaToken, publicAccessError, isVerifyingPublicAccess, publicRecaptchaSiteKey, email, password, error, isHovered, setIsHovered, isLoading, isLockedOut, remainingSeconds, handleSubmit, handleMicrosoftLogin, handlePublicAccessClick, handlePublicRecaptchaChange, handleEmailInvalid, handleEmailChange, handlePasswordInvalid, handlePasswordChange }: Pick<Gestion, 'navigate' | 'showPassword' | 'setShowPassword' | 'publicRecaptchaToken' | 'publicAccessError' | 'isVerifyingPublicAccess' | 'publicRecaptchaSiteKey' | 'email' | 'password' | 'error' | 'isHovered' | 'setIsHovered' | 'isLoading' | 'isLockedOut' | 'remainingSeconds' | 'handleSubmit' | 'handleMicrosoftLogin' | 'handlePublicAccessClick' | 'handlePublicRecaptchaChange' | 'handleEmailInvalid' | 'handleEmailChange' | 'handlePasswordInvalid' | 'handlePasswordChange'>) {
  return (
    <div className="p-8 lg:p-14 flex flex-col justify-center bg-white relative">
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        <div className="mb-10">
          <motion.p 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.6 }}
            className="text-slate-900 mb-3 text-2xl text-center font-bold tracking-tight"
          >
            ¡Bienvenido a Benji!
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
            <h1 className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent text-xl font-bold leading-tight tracking-tight">
              GESTIÓN UNIVERSITARIA
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
            className="text-slate-600 text-center text-sm leading-relaxed font-medium"
          >
            Accede a tu cuenta para gestionar horarios y espacios
          </motion.p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
            className="space-y-2"
          >
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Correo Institucional</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
              <Input
                type="email"
                placeholder="correo@unilibre.edu.co"
                value={email}
                onChange={handleEmailChange}
                onInvalid={handleEmailInvalid}
                className="pl-12 h-12 bg-slate-50 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-slate-900"
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
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Contraseña</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-600 transition-colors duration-300" />
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={handlePasswordChange}
                onInvalid={handlePasswordInvalid}
                className="pl-12 pr-12 h-12 bg-slate-50 border-2 border-slate-200 focus:border-red-600 focus:ring-red-600/20 rounded-lg transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg text-slate-900"
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
              className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded-lg font-medium text-sm"
            >
              {error}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="pt-4"
          >
            <Button
              type="submit"
              disabled={isLoading || isLockedOut}
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
                {isLoading
                  ? 'INICIANDO...'
                  : isLockedOut
                    ? `BLOQUEADO (${remainingSeconds}s)`
                    : 'INICIAR SESIÓN'}
                {!isLoading && !isLockedOut && (
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                )}
              </span>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.58, duration: 0.5 }}
          >
            <button
              type="button"
              onClick={handleMicrosoftLogin}
              className="w-full h-12 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 hover:border-slate-400 rounded-lg transition-all duration-300 font-semibold text-base flex items-center justify-center gap-3 shadow-sm hover:shadow-md"
            >
              {/* Microsoft Logo */}
              <div className="w-5 h-5 grid grid-cols-2 grid-rows-2 gap-0.5">
                <div className="bg-[#F25022]"></div>
                <div className="bg-[#7FBA00]"></div>
                <div className="bg-[#00A4EF]"></div>
                <div className="bg-[#FFB900]"></div>
              </div>
              Iniciar sesión con Microsoft
            </button>
          </motion.div>

          {/* Acceso Público centrado */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="text-center pt-3"
          >
            <div className="flex flex-col items-center gap-3">
              <p className="text-xs text-slate-600">Debes verificar que eres humano para continuar.</p>
              {publicRecaptchaSiteKey ? (
                <ReCAPTCHA
                  sitekey={publicRecaptchaSiteKey}
                  onChange={handlePublicRecaptchaChange}
                />
              ) : (
                <p className="text-xs text-red-600">
                  Falta configurar VITE_RECAPTCHA_SITE_KEY en el frontend.
                </p>
              )}
              {publicAccessError && (
                <p className="text-xs text-red-600">{publicAccessError}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handlePublicAccessClick}
              className="mt-3 text-slate-600 hover:text-red-600 font-semibold hover:underline transition-all duration-200"
              disabled={!publicRecaptchaToken || isVerifyingPublicAccess}
            >
              Acceso Público
            </button>
          </motion.div>

          {/* Sign Up separado */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65, duration: 0.5 }}
            className="text-left pt-10"
          >
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="text-slate-600 hover:text-red-600 transition-colors duration-200 font-medium"
            >
              ¿No tienes cuenta?{' '}
              <span className="text-red-600 hover:text-red-700 font-semibold hover:underline">
                Sign Up
              </span>
            </button>
          </motion.div>
        </form>


      </motion.div>
    </div>
  );
}
