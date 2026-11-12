import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Check, CheckCircle2 } from 'lucide-react';
import { useRegistrarFactura } from '../../hooks/funcionario/useRegistrarFactura';


import { PasoInformacionGeneral } from '../../components/registrarFactura/PasoInformacionGeneral';
import { PasoSoportes } from '../../components/registrarFactura/PasoSoportes';
import { PasoConfirmacion } from '../../components/registrarFactura/PasoConfirmacion';
import { VistaPreviaDocumentoDialog } from '../../components/registrarFactura/VistaPreviaDocumentoDialog';
import { RechazarFacturaDialog } from '../../components/registrarFactura/RechazarFacturaDialog';
export default function RegistrarFactura() {
  const hook = useRegistrarFactura();
  const {
    prefillFromPendiente,
    showLegacyBlocks,
    step,
    setStep,
    prefillLoading,
    error,
    success,
    flowCompletion,
  } = hook;

  if (success) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-[1000]">
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ 
              opacity: 1, 
              scale: 1, 
              y: 0,
              transition: {
                type: 'spring',
                damping: 12,
                stiffness: 100,
                mass: 0.8
              }
            }}
            exit={{ 
              opacity: 0, 
              scale: 0.5,
              transition: { duration: 0.3 }
            }}
            className="relative max-w-2xl w-full mx-4"
          >
            {/* Confetti animado de fondo */}
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full pointer-events-none"
                style={{
                  width: Math.random() * 20 + 8,
                  height: Math.random() * 20 + 8,
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  background: ['#10b981', '#059669', '#047857', '#34d399'][Math.floor(Math.random() * 4)],
                  opacity: 0.7,
                }}
                animate={{
                  y: [0, -300, -400],
                  x: [0, Math.random() * 100 - 50],
                  rotate: [0, 360, 720],
                  opacity: [0.7, 0.7, 0],
                }}
                transition={{
                  duration: 2,
                  ease: 'easeOut',
                  delay: i * 0.08,
                }}
              />
            ))}

            {/* Tarjeta de éxito principal */}
            <motion.div
              className="bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-3xl p-10 text-center shadow-2xl"
              animate={{
                boxShadow: [
                  '0 0 0 0px rgba(16, 185, 129, 0.4)',
                  '0 0 0 40px rgba(16, 185, 129, 0)',
                ],
              }}
              transition={{
                duration: 1.5,
                ease: 'easeOut',
              }}
            >
              {/* Ícono con animación de pulse */}
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  rotate: [0, 5, -5, 0],
                }}
                transition={{
                  duration: 1.2,
                  ease: 'easeInOut',
                }}
              >
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: 'spring', damping: 12 }}
                  className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg"
                >
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </motion.div>
              </motion.div>

              {/* Textos animados */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-4xl font-bold text-green-700 mb-3">
                  ✓ ¡Éxito!
                </h2>
                <p className="text-xl text-green-600 font-semibold mb-2">
                  Factura registrada correctamente
                </p>
                <p className="text-green-600">
                  La factura ha sido cargada al sistema y está lista para continuar su flujo de aprobación.
                </p>
              </motion.div>

              <motion.div className="hidden">
                <div className="flex items-center justify-center gap-2">
                  <span>📋 Datos guardados</span>
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, delay: 0.7 }}>✓</motion.span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>📁 Documentos cargados</span>
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, delay: 0.9 }}>✓</motion.span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <span>🚀 Flujo iniciado</span>
                  <motion.span animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.6, delay: 1.1 }}>✓</motion.span>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    );
  }

  const stepItems = [
    { id: 1, title: 'Información general', description: 'Proveedor, valor, fechas y área' },
    { id: 2, title: 'Soportes', description: 'Revisión documental y adjuntos' },
    { id: 3, title: 'Confirmación', description: 'Resumen antes del registro' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold text-slate-900">
          {prefillFromPendiente ? 'Verificar y Registrar Factura' : 'Registrar Nueva Factura'}
        </h1>
        <p className="text-slate-600 mt-1">
          {prefillFromPendiente
            ? 'Revise datos y soportes enviados por el proveedor antes del registro oficial.'
            : 'Complete la información de la factura recibida del proveedor'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {stepItems.map((item) => {
          const isActive = step === item.id;
          const isDone = step > item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                if (item.id < step) setStep(item.id);
              }}
              className={`text-left rounded-xl border p-4 transition-all ${
                isActive
                  ? 'border-slate-900 bg-white shadow-sm'
                  : isDone
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
                  isDone ? 'bg-emerald-600 text-white' : isActive ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {isDone ? <Check className="h-4 w-4" /> : item.id}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="text-xs text-slate-500">{item.description}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="hidden">
        {/* Barra de progreso moderna */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 bg-gradient-to-r from-slate-50 to-red-50 rounded-2xl p-6 border border-slate-200"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-slate-600 font-medium">Progreso del Registro</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{flowCompletion}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-600">Paso</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">{step} de 3</p>
            </div>
          </div>
          <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg shadow-red-300"
              initial={{ width: 0 }} 
              animate={{ width: `${flowCompletion}%` }} 
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>

        {/* Indicadores de paso con diseño mejorado */}
        <div className="flex items-center justify-between mb-10 relative">
          {[1, 2, 3].map((n) => (
            <div key={n} className="flex items-center flex-1">
              <motion.div
                className="flex flex-col items-center flex-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: n * 0.1 }}
              >
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.96 }}
                  className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg shadow-lg transition-all ${
                    step > n 
                      ? 'bg-green-500 text-white shadow-green-300' 
                      : step === n 
                      ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-red-300 scale-110' 
                      : 'bg-slate-200 text-slate-400'
                  }`}
                >
                  {step > n ? '✓' : n}
                </motion.div>
                <span className={`text-xs font-semibold mt-3 text-center transition-colors ${
                  step >= n ? 'text-red-600' : 'text-slate-400'
                }`}>
                  {n === 1 ? 'Datos\nGenerales' : n === 2 ? 'Documentos' : 'Confirmación'}
                </span>
              </motion.div>
              
              {n < 3 && (
                <div className="flex-1 mx-3 h-1 relative">
                  <div className="absolute inset-0 bg-slate-200 rounded-full" />
                  <motion.div 
                    className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: step > n ? '100%' : '0%' }}
                    transition={{ duration: 0.4 }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2 text-red-700">
          <AlertCircle size={18} /> {error}
        </motion.div>
      )}

      {showLegacyBlocks && prefillFromPendiente && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
          Se cargaron automáticamente datos desde Pendientes (registro #{prefillFromPendiente.facturaId}).
          El flujo ahora es de verificación: valida información y soportes, y registra sin re-digitar.
        </motion.div>
      )}

      {prefillLoading && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
          Cargando información completa de la solicitud del proveedor...
        </motion.div>
      )}

      {/* Contenedor con AnimatePresence para transiciones suaves entre pasos */}
      <AnimatePresence mode="wait">
        {step === 1 && (
        <PasoInformacionGeneral hook={hook} />
        )}

        {step === 2 && (
          <PasoSoportes hook={hook} />
        )}

        {step === 3 && (
          <PasoConfirmacion hook={hook} />
        )}
      </AnimatePresence>

      <VistaPreviaDocumentoDialog hook={hook} />

      <RechazarFacturaDialog hook={hook} />
    </div>
  );
}
