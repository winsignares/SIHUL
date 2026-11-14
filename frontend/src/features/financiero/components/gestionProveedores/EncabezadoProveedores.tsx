import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';

/** Encabezado de la gestión de proveedores. */
export function EncabezadoProveedores() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl"
    >
      <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
      <div className="space-y-2">
        <h1 className="flex items-center gap-3 text-3xl font-bold">
          <Building2 className="h-8 w-8 text-amber-300" />
          Gestión de Proveedores
        </h1>
        <p className="max-w-3xl text-sm text-red-100">
          Centraliza aquí el alta, edición, estado y datos bancarios de proveedores. Este módulo ya no depende de Gestión de Usuarios.
        </p>
      </div>
    </motion.div>
  );
}
