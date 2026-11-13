import { useLoginPagina } from '../hooks/useLoginPagina';
import { FormularioLogin } from '../components/login/FormularioLogin';
import { PanelMarcaLogin } from '../components/login/PanelMarcaLogin';
import { LoginBackgroundParticles } from '../components/login/FondoParticulas';
import { motion } from 'motion/react';

export default function Login() {
  const gestion = useLoginPagina();

  return (
    <div className={`min-h-screen flex items-center justify-center relative overflow-hidden ${gestion.isMobile ? 'p-4' : 'p-8'} bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100`}>
      <LoginBackgroundParticles />

      {/* Main Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-6xl mx-4"
      >
        <div className={`grid ${gestion.isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'} bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200/30 max-w-5xl`}>
          {/* Glow Effect */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500/3 via-transparent to-transparent pointer-events-none" />

          <FormularioLogin {...gestion} />

          <PanelMarcaLogin />

        </div>
      </motion.div>
    </div>
  );
}
