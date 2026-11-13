import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';

/** Título de la página de pendientes. */
export function EncabezadoMisPendientes() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <Clock className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Mis Pendientes</h2>
          <p className="text-red-100">Facturas recibidas que debo registrar en el sistema (SLA: 2 dias)</p>
        </div>
      </div>
    </motion.div>
  );
}
