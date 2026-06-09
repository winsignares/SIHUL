import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, FileText, User, X, Clock3, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';

type TimelineStep = {
  id: number;
  name: string;
  description: string;
  owner: string;
  sla: string;
  status: 'done' | 'current' | 'pending';
};

type FacturaDetail = {
  idTramite: string;
  proveedor: string;
  valorTotal: number;
  fechaInicio?: string;
  progreso: number;
  etapaActual: string;
};

interface Props {
  open: boolean;
  onClose: () => void;
  factura: FacturaDetail | null;
}

const defaultTimeline: TimelineStep[] = [
  { id: 1, name: 'Recepción y Registro', description: 'Factura registrada en el sistema por el funcionario', owner: 'Funcionario', sla: 'SLA: 1 día', status: 'done' },
  { id: 2, name: 'Radicación en Contabilidad', description: 'Radicación formal y generación del número de radicado', owner: 'Contabilidad', sla: 'SLA: 3 días', status: 'done' },
  { id: 3, name: 'Causación Contable', description: 'Reconocimiento contable y asignación de cuenta', owner: 'Contabilidad', sla: 'SLA: 2 días', status: 'current' },
  { id: 4, name: 'Alistamiento en Tesorería', description: 'Revisión, preparación y generación de archivo de pago', owner: 'Tesorería', sla: 'SLA: 3 días', status: 'pending' },
  { id: 5, name: 'Control Previo de Auditoría', description: 'Revisión de expediente y documentación soporte', owner: 'Auditoría', sla: 'SLA: 4 días', status: 'pending' },
  { id: 6, name: 'Retorno a Tesorería', description: 'Post-auditoría, remisión a dirección financiera', owner: 'Tesorería', sla: 'SLA: 1 día', status: 'pending' },
  { id: 7, name: 'Cargue en Dirección Financiera', description: 'Actualización del proceso de pago y cargue formal', owner: 'Dirección Financiera', sla: 'SLA: 2 días', status: 'pending' },
  { id: 8, name: 'Autorización en Rectoría', description: 'Revisión y autorización final del pago', owner: 'Rectoría', sla: 'SLA: 2 días', status: 'pending' },
  { id: 9, name: 'Aplicación del Pago', description: 'Validación en portal bancario y aplicación del pago', owner: 'Dirección Financiera / Rectoría', sla: 'SLA: 1 día', status: 'pending' },
  { id: 10, name: 'Factura Pagada', description: 'Pago aplicado y expediente documental disponible', owner: 'Tesorería', sla: 'SLA: 1 día', status: 'pending' },
];

export default function FacturaDetailModal({ open, onClose, factura }: Props) {
  const [tab, setTab] = useState<'info' | 'timeline'>('info');

  const timeline = useMemo(() => defaultTimeline, []);

  if (!factura) return null;

  const statusStyles = (status: TimelineStep['status']) => {
    if (status === 'done') return 'border-green-300 bg-green-50 text-green-800';
    if (status === 'current') return 'border-blue-300 bg-blue-50 text-blue-800';
    return 'border-slate-200 bg-slate-50 text-slate-700';
  };

  const dotStyles = (status: TimelineStep['status']) => {
    if (status === 'done') return 'bg-green-500';
    if (status === 'current') return 'bg-blue-500';
    return 'bg-slate-300';
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/55 backdrop-blur-[1px] z-[100] p-4 flex items-center justify-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-3xl max-h-[88vh] overflow-auto rounded-2xl bg-white shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-slate-200 px-6 py-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-bold text-slate-900">Detalles Completos del Tramite</h3>
                  <p className="text-slate-600">Informacion detallada, timeline y seguimiento de la factura</p>
                </div>
                <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-500">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 inline-flex rounded-xl bg-slate-100 p-1">
                <button
                  onClick={() => setTab('info')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'info' ? 'bg-white text-slate-900 shadow' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Informacion General
                </button>
                <button
                  onClick={() => setTab('timeline')}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${tab === 'timeline' ? 'bg-white text-red-600 shadow' : 'text-slate-600 hover:text-slate-800'}`}
                >
                  Timeline del Proceso
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-4xl font-bold text-slate-900">{factura.idTramite}</p>
                    <p className="text-slate-700 text-lg">{factura.proveedor}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-5xl font-extrabold text-green-600">${factura.valorTotal.toLocaleString('es-CO')}</p>
                    <p className="text-slate-600">Valor Total</p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-sm text-slate-700 mb-1">
                    <span>Progreso del Tramite</span>
                    <span>{factura.progreso}%</span>
                  </div>
                  <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                    <motion.div className="h-full bg-green-500" initial={{ width: 0 }} animate={{ width: `${factura.progreso}%` }} transition={{ duration: 0.6 }} />
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700 text-sm">
                  <div className="flex items-center gap-2"><Calendar className="w-4 h-4" /> Inicio: {factura.fechaInicio || 'Sin fecha registrada'}</div>
                  <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> Etapa actual: {factura.etapaActual}</div>
                </div>
              </div>

              {tab === 'timeline' && (
                <div className="relative">
                  {/* Línea conectiva animada de fondo */}
                  <div className="absolute left-[26px] top-8 bottom-0 w-1 bg-gradient-to-b from-green-500 via-blue-500 to-slate-300 rounded-full" />
                  
                  <div className="space-y-4 relative z-10">
                    {timeline.map((step, idx) => {
                      const doneCount = timeline.filter(s => s.status === 'done').length;
                      const showCheckAnimation = step.status === 'done';
                      
                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -24, y: 12 }}
                          animate={{ opacity: 1, x: 0, y: 0 }}
                          transition={{ 
                            delay: idx * 0.08, 
                            type: 'spring',
                            damping: 16,
                            stiffness: 100
                          }}
                          className={`rounded-2xl border-2 p-5 transition-all ${statusStyles(step.status)}`}
                        >
                          <div className="flex items-start gap-4">
                            {/* Indicador visual del paso */}
                            <div className="relative pt-1 flex-shrink-0">
                              <motion.div
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: idx * 0.08 + 0.1, type: 'spring' }}
                                className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg ${
                                  step.status === 'done' 
                                    ? 'bg-green-500 shadow-green-300' 
                                    : step.status === 'current' 
                                    ? 'bg-blue-500 shadow-blue-300' 
                                    : 'bg-slate-300 shadow-slate-200'
                                }`}
                              >
                                {step.status === 'done' ? (
                                  <motion.div
                                    initial={{ scale: 0, rotate: -45 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: idx * 0.08 + 0.15, type: 'spring', damping: 12 }}
                                  >
                                    <CheckCircle2 className="w-6 h-6" />
                                  </motion.div>
                                ) : step.status === 'current' ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                                  >
                                    <Clock3 className="w-6 h-6" />
                                  </motion.div>
                                ) : (
                                  <span>{step.id}</span>
                                )}
                              </motion.div>
                            </div>

                            {/* Contenido del paso */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3 flex-wrap">
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  transition={{ delay: idx * 0.08 + 0.05 }}
                                >
                                  <p className="text-xl font-bold text-slate-900">{step.name}</p>
                                  <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                                </motion.div>

                                <motion.div 
                                  className="flex items-center gap-2 flex-wrap justify-end"
                                  initial={{ opacity: 0, x: 12 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.08 + 0.1 }}
                                >
                                  {step.status === 'done' && (
                                    <motion.span 
                                      className="text-xs px-3 py-1.5 rounded-full border-2 border-green-400 bg-green-50 text-green-700 font-semibold"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: idx * 0.08 + 0.2, type: 'spring', damping: 14 }}
                                    >
                                      ✓ Completado
                                    </motion.span>
                                  )}
                                  {step.status === 'current' && (
                                    <motion.span 
                                      className="text-xs px-3 py-1.5 rounded-full border-2 border-blue-400 bg-blue-50 text-blue-700 font-semibold"
                                      animate={{ scale: [1, 1.05, 1] }}
                                      transition={{ duration: 1.5, repeat: Infinity }}
                                    >
                                      ⏳ En Proceso
                                    </motion.span>
                                  )}
                                  {step.status === 'pending' && (
                                    <span className="text-xs px-3 py-1.5 rounded-full border-2 border-slate-300 bg-slate-50 text-slate-600">
                                      ◯ Pendiente
                                    </span>
                                  )}
                                  <span className="text-xs px-3 py-1.5 rounded-full border-2 border-amber-300 bg-amber-50 text-amber-700 font-semibold">
                                    {step.sla}
                                  </span>
                                </motion.div>
                              </div>

                              <motion.div 
                                className="mt-3 pt-3 border-t border-current border-opacity-20 flex items-center gap-1 text-sm text-slate-700"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.08 + 0.15 }}
                              >
                                <User className="w-4 h-4 flex-shrink-0" />
                                <span className="font-semibold">Responsable:</span>
                                <span>{step.owner}</span>
                              </motion.div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {tab === 'info' && (
                <div className="rounded-2xl border border-slate-200 p-5 bg-slate-50">
                  <h4 className="text-xl font-semibold text-slate-800 mb-3">Resumen de la Factura</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
                    <div className="flex items-center gap-2"><Clock3 className="w-4 h-4" /> Estado actual: {factura.etapaActual}</div>
                    <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-green-600" /> Cumplimiento: {factura.progreso >= 50 ? 'Adecuado' : 'En seguimiento'}</div>
                    <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-amber-500" /> Riesgo: {factura.progreso < 25 ? 'Alto' : 'Controlado'}</div>
                    <div className="flex items-center gap-2"><FileText className="w-4 h-4" /> ID Tramite: {factura.idTramite}</div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
