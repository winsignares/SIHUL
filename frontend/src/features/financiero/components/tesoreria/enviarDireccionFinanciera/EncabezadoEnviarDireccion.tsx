import { motion } from 'framer-motion';
import { Send } from 'lucide-react';

/** Título de la página de enviar a dirección financiera. */
export function EncabezadoEnviarDireccion() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
    >
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <Send className="w-7 h-7 text-yellow-400" />
        </div>
        <div>
          <h1 className="text-white mb-1 text-3xl font-bold">Enviar a Direccion Financiera</h1>
          <p className="text-red-100 text-sm">Facturas aprobadas por auditoria listas para remision formal</p>
        </div>
      </div>
    </motion.div>
  );
}
