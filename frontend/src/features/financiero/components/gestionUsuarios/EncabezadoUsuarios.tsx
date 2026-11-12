import { motion } from 'framer-motion';
import { Users } from 'lucide-react';

/** Encabezado de la gestión de usuarios financieros. */
export function EncabezadoUsuarios() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl"
    >
      <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <Users className="w-8 h-8 text-amber-300" />
            Gestión de Usuarios Financieros
          </h1>
          <p className="max-w-2xl text-sm text-red-100">Centraliza altas, edición y permisos del equipo financiero en una vista corta, clara y alineada con el resto del aplicativo.</p>
        </div>
      </div>
    </motion.div>
  );
}
