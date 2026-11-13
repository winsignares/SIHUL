import { motion } from 'framer-motion';
import { FileOutput } from 'lucide-react';

/** Título de la página del comprobante de egreso. */
export function EncabezadoComprobanteEgreso() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="overflow-hidden rounded-[28px] bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.16),_transparent_36%),linear-gradient(135deg,_#991b1b_0%,_#dc2626_42%,_#7f1d1d_100%)] p-7 text-white shadow-[0_24px_60px_-24px_rgba(127,29,29,0.7)]"
    >
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/12">
          <FileOutput className="h-8 w-8 text-amber-300" />
        </div>
        <div>
          <h1 className="text-3xl font-black tracking-tight">Factura Autorizada / Pagada</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-red-50/90">
            Facturas autorizadas por Rectoria y pagadas. Descarga el expediente completo con todos los documentos del proceso.
          </p>
        </div>
      </div>
    </motion.div>
  );
}
