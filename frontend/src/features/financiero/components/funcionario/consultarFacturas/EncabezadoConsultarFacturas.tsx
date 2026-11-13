import { motion } from 'framer-motion';
import { FileSearch } from 'lucide-react';

/** Título de la consulta de facturas. */
export function EncabezadoConsultarFacturas() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-600 to-red-700 rounded-xl p-6 text-white shadow-lg"
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
          <FileSearch className="w-6 h-6 text-yellow-300" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Consultar Facturas</h2>
          <p className="text-red-100">Visualiza y realiza seguimiento del estado de las facturas registradas</p>
        </div>
      </div>
    </motion.div>
  );
}
