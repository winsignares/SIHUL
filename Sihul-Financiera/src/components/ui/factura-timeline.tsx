import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { 
  CheckCircle2, Clock, AlertCircle, XCircle, ChevronDown, 
  ChevronUp, User, Calendar, MessageSquare, ArrowLeft,
  FileText, Send
} from 'lucide-react';

interface TimelineEtapa {
  id: string;
  nombre: string;
  estado: 'completado' | 'en-proceso' | 'pendiente' | 'rechazado' | 'devuelto';
  fechaInicio?: string;
  fechaFin?: string;
  usuarioResponsable?: string;
  observaciones?: string;
  diasTranscurridos?: number;
  diasMaximos?: number;
  nivelRiesgo?: 'verde' | 'amarillo' | 'rojo' | 'vencido';
}

interface FacturaTimelineProps {
  numeroFactura: string;
  proveedor: string;
  valorTotal: number;
  etapas: TimelineEtapa[];
  fechaInicio: string;
}

export default function FacturaTimeline({ 
  numeroFactura, 
  proveedor, 
  valorTotal, 
  etapas,
  fechaInicio 
}: FacturaTimelineProps) {
  const [etapaExpandida, setEtapaExpandida] = useState<string | null>(null);

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'completado':
        return <CheckCircle2 className="w-6 h-6 text-green-600" />;
      case 'en-proceso':
        return <Clock className="w-6 h-6 text-blue-600 animate-pulse" />;
      case 'rechazado':
        return <XCircle className="w-6 h-6 text-red-600" />;
      case 'devuelto':
        return <ArrowLeft className="w-6 h-6 text-orange-600" />;
      default:
        return <Clock className="w-6 h-6 text-slate-300" />;
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'completado':
        return 'bg-green-100 border-green-300';
      case 'en-proceso':
        return 'bg-blue-100 border-blue-300';
      case 'rechazado':
        return 'bg-red-100 border-red-300';
      case 'devuelto':
        return 'bg-orange-100 border-orange-300';
      default:
        return 'bg-slate-100 border-slate-300';
    }
  };

  const getRiesgoColor = (nivel?: string) => {
    switch (nivel) {
      case 'verde':
        return 'bg-green-500';
      case 'amarillo':
        return 'bg-yellow-500';
      case 'rojo':
        return 'bg-red-500';
      case 'vencido':
        return 'bg-red-700';
      default:
        return 'bg-slate-300';
    }
  };

  const getRiesgoText = (nivel?: string) => {
    switch (nivel) {
      case 'verde':
        return 'A tiempo';
      case 'amarillo':
        return 'En riesgo';
      case 'rojo':
        return 'Atrasado';
      case 'vencido':
        return 'Vencido';
      default:
        return 'Sin datos';
    }
  };

  const toggleEtapa = (etapaId: string) => {
    setEtapaExpandida(etapaExpandida === etapaId ? null : etapaId);
  };

  const calcularProgreso = () => {
    const completadas = etapas.filter(e => e.estado === 'completado').length;
    return (completadas / etapas.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header del Timeline */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-red-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">{numeroFactura}</h3>
              <p className="text-slate-600">{proveedor}</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">
                ${valorTotal.toLocaleString('es-CO')}
              </p>
              <p className="text-sm text-slate-500">Valor Total</p>
            </div>
          </div>

          {/* Barra de Progreso Global */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-700 font-semibold">Progreso del Trámite</span>
              <span className="text-slate-600">{Math.round(calcularProgreso())}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${calcularProgreso()}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full"
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Inicio: {new Date(fechaInicio).toLocaleDateString('es-CO')}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              <span>{etapas.length} etapas</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline de Etapas */}
      <div className="relative">
        {/* Línea vertical del timeline */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-slate-200" />

        <div className="space-y-4">
          {etapas.map((etapa, index) => (
            <motion.div
              key={etapa.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative"
            >
              {/* Ícono de Estado */}
              <div className="absolute left-5 top-6 -translate-x-1/2 z-10 bg-white rounded-full p-1">
                {getEstadoIcon(etapa.estado)}
              </div>

              {/* Tarjeta de Etapa */}
              <Card 
                className={`ml-16 border-2 ${getEstadoColor(etapa.estado)} hover:shadow-lg transition-all cursor-pointer`}
                onClick={() => toggleEtapa(etapa.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-bold text-slate-800 text-lg">{etapa.nombre}</h4>
                        {etapa.estado === 'devuelto' && (
                          <Badge className="bg-orange-100 text-orange-700 border-orange-300 border">
                            Devuelto
                          </Badge>
                        )}
                        {etapa.estado === 'rechazado' && (
                          <Badge className="bg-red-100 text-red-700 border-red-300 border">
                            Rechazado
                          </Badge>
                        )}
                        {etapa.estado === 'completado' && (
                          <Badge className="bg-green-100 text-green-700 border-green-300 border">
                            Completado
                          </Badge>
                        )}
                        {etapa.estado === 'en-proceso' && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300 border">
                            En Proceso
                          </Badge>
                        )}
                      </div>

                      {/* Indicador de Riesgo */}
                      {etapa.nivelRiesgo && etapa.estado === 'en-proceso' && (
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`w-3 h-3 rounded-full ${getRiesgoColor(etapa.nivelRiesgo)}`} />
                          <span className="text-sm font-semibold text-slate-700">
                            {getRiesgoText(etapa.nivelRiesgo)}
                          </span>
                          {etapa.diasTranscurridos !== undefined && etapa.diasMaximos && (
                            <span className="text-sm text-slate-600">
                              ({etapa.diasTranscurridos}/{etapa.diasMaximos} días)
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-sm text-slate-600">
                        {etapa.fechaInicio && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(etapa.fechaInicio).toLocaleDateString('es-CO')}</span>
                          </div>
                        )}
                        {etapa.usuarioResponsable && (
                          <div className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            <span>{etapa.usuarioResponsable}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleEtapa(etapa.id);
                      }}
                    >
                      {etapaExpandida === etapa.id ? (
                        <ChevronUp className="w-5 h-5" />
                      ) : (
                        <ChevronDown className="w-5 h-5" />
                      )}
                    </Button>
                  </div>

                  {/* Detalles Expandibles */}
                  <AnimatePresence>
                    {etapaExpandida === etapa.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-4 pt-4 border-t border-slate-300 space-y-3">
                          {etapa.fechaFin && (
                            <div>
                              <p className="text-xs text-slate-500 mb-1">Fecha de finalización</p>
                              <p className="text-sm font-semibold text-slate-700">
                                {new Date(etapa.fechaFin).toLocaleDateString('es-CO', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          )}

                          {etapa.observaciones && (
                            <div className="bg-white rounded-lg p-3 border border-slate-200">
                              <div className="flex items-center gap-2 mb-2">
                                <MessageSquare className="w-4 h-4 text-slate-500" />
                                <p className="text-xs text-slate-500 font-semibold">Observaciones</p>
                              </div>
                              <p className="text-sm text-slate-700">{etapa.observaciones}</p>
                            </div>
                          )}

                          {etapa.estado === 'en-proceso' && etapa.diasMaximos && (
                            <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                              <p className="text-xs text-blue-600 font-semibold mb-2">Tiempo de Gestión</p>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-slate-700">
                                  {etapa.diasTranscurridos} días transcurridos
                                </span>
                                <span className="text-sm font-bold text-blue-700">
                                  {etapa.diasMaximos - (etapa.diasTranscurridos || 0)} días restantes
                                </span>
                              </div>
                              <div className="mt-2 w-full bg-blue-100 rounded-full h-2 overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ 
                                    width: `${((etapa.diasTranscurridos || 0) / etapa.diasMaximos) * 100}%` 
                                  }}
                                  className={`h-full ${getRiesgoColor(etapa.nivelRiesgo)}`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Footer con Resumen */}
      <Card className="border-0 shadow-lg bg-slate-50">
        <CardContent className="p-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-green-600">
                {etapas.filter(e => e.estado === 'completado').length}
              </p>
              <p className="text-xs text-slate-600">Completadas</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {etapas.filter(e => e.estado === 'en-proceso').length}
              </p>
              <p className="text-xs text-slate-600">En Proceso</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-600">
                {etapas.filter(e => e.estado === 'pendiente').length}
              </p>
              <p className="text-xs text-slate-600">Pendientes</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
