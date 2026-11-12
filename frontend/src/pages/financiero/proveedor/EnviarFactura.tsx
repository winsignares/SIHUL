import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
} from 'lucide-react';
import type { EnviarFacturaProps } from '../../../models/financiero/proveedor';
import { useEnviarFactura } from '../../../hooks/financiero/proveedor/useEnviarFactura';


import { PasoIdentificacion } from '../../../components/financiero/enviarFactura/PasoIdentificacion';
import { PasoDatosFactura } from '../../../components/financiero/enviarFactura/PasoDatosFactura';
import { PasoDocumentos } from '../../../components/financiero/enviarFactura/PasoDocumentos';
import { PasoConfirmar } from '../../../components/financiero/enviarFactura/PasoConfirmar';
import { EliminarDocumentoDialog } from '../../../components/financiero/enviarFactura/EliminarDocumentoDialog';
export default function EnviarFactura({ miProveedor, onSuccess }: EnviarFacturaProps) {
  const hook = useEnviarFactura({ miProveedor, onSuccess });
  const {
    isCorreccion,
    step,
    setStep,
    loading,
    error,
    success,
    canGoNext,
    handleSubmit,
  } = hook;

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center py-20 space-y-4"
      >
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle2 className="text-green-600" size={40} />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
          {isCorreccion ? '¡Corrección enviada!' : '¡Factura enviada!'}
        </h2>
        <p className="text-slate-600 dark:text-slate-300 text-center max-w-md">
          {isCorreccion
            ? 'La corrección fue enviada y tu factura vuelve al flujo normal. Puedes consultar su estado en '
            : 'Tu factura fue recibida exitosamente. Puedes consultar su estado en '}
          <strong>Mis Facturas</strong>.
        </p>
      </motion.div>
    );
  }

  const steps = [
    { num: 1, label: 'Identificación' },
    { num: 2, label: 'Datos Factura' },
    { num: 3, label: 'Documentos' },
    { num: 4, label: isCorreccion ? 'Confirmar Corrección' : 'Confirmar' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-800 to-red-900 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex items-start gap-4">
          <Send size={24} className="flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-lg mb-1">{isCorreccion ? 'Corregir Factura' : 'Enviar Factura'}</h3>
            <p className="text-red-100 text-sm">
              {isCorreccion
                ? 'Actualiza los campos solicitados y reenvía la factura al proceso.'
                : 'Completa los pasos para enviar tu factura al área financiera'}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 py-4">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${i < steps.length - 1 ? '' : ''}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-all ${step > s.num ? 'bg-red-700 text-white shadow-md' : step === s.num ? 'bg-red-900 text-white shadow-lg scale-110' : 'bg-slate-300 dark:bg-slate-600 text-slate-600 dark:text-slate-300'}`}>
                {step > s.num ? <CheckCircle2 size={18} /> : s.num}
              </div>
              <span className={`text-xs font-semibold hidden sm:block transition-all ${step === s.num ? 'text-red-900 dark:text-red-600' : step > s.num ? 'text-red-700 dark:text-red-600' : 'text-slate-500 dark:text-slate-400'}`}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-12 h-1 mx-2 rounded-full transition-all ${step > s.num ? 'bg-red-700' : step >= s.num + 1 ? 'bg-red-700' : 'bg-slate-300 dark:bg-slate-600'}`} />
            )}
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 dark:bg-red-900/20 px-4 py-3 text-sm text-red-700 dark:text-red-400 flex gap-2">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          {error}
        </div>
      )}

      {/* Steps */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-md border border-slate-200 dark:border-slate-700"
        >
          {/* STEP 1: Identificación */}
          {step === 1 && (
            <PasoIdentificacion hook={hook} miProveedor={miProveedor} />
          )}

          {/* STEP 2: Datos de la Factura */}
          {step === 2 && (
            <PasoDatosFactura hook={hook} />
          )}

          {/* STEP 3: Documentos */}
          {step === 3 && (
            <PasoDocumentos hook={hook} />
          )}

          {/* STEP 4: Confirmar */}
          {step === 4 && (
            <PasoConfirmar hook={hook} />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className={step === 1 ? 'flex justify-end' : 'flex justify-between'}>
        {step > 1 && (
          <button
            onClick={() => {
              if (isCorreccion && step === 2) return;
              setStep(s => Math.max(1, s - 1));
            }}
            disabled={isCorreccion && step === 2}
            className="flex items-center gap-2 px-5 py-2.5 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium text-sm hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft size={16} /> Anterior
          </button>
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canGoNext()}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            Siguiente <ChevronRight size={16} />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-700 to-red-900 hover:from-red-800 hover:to-red-950 disabled:opacity-50 text-white rounded-lg font-semibold text-sm transition-all shadow-md hover:shadow-lg disabled:shadow-none"
          >
            <Send size={16} />
            {loading ? 'Enviando...' : isCorreccion ? 'Enviar corrección' : 'Enviar Factura'}
          </button>
        )}
      </div>

      <EliminarDocumentoDialog hook={hook} />
    </div>
  );
}
