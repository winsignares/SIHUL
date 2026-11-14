import { motion } from 'framer-motion';
import { FileText, RefreshCw } from 'lucide-react';
import type { useMisFacturas } from '../../../hooks/proveedor/useMisFacturas';

type Gestion = ReturnType<typeof useMisFacturas>;

/** Título de la página del proveedor. */
export function EncabezadoMisFacturas({ loadFacturas }: Pick<Gestion, 'loadFacturas'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <FileText size={24} className="flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-1">Mis Facturas</h3>
            <p className="text-red-100 text-sm">Consulta y haz seguimiento rapido de todas tus facturas enviadas.</p>
          </div>
        </div>
        <button
          onClick={() => void loadFacturas()}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors border border-white/30"
          title="Actualizar"
        >
          <RefreshCw size={18} />
        </button>
      </div>
    </motion.div>
  );
}
