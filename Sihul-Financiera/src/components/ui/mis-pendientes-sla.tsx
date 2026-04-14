import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Button } from './button';
import { 
  Clock, AlertTriangle, CheckCircle2, XCircle, 
  TrendingUp, Eye, ChevronRight, Calendar
} from 'lucide-react';

interface FacturaPendiente {
  id: string;
  numeroFactura: string;
  proveedor: string;
  valorTotal: number;
  fechaAsignacion: string;
  diasTranscurridos: number;
  diasMaximos: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'naranja' | 'vencido';
  etapaActual: string;
  areaSolicitante: string;
  observaciones?: string;
}

interface MisPendientesSLAProps {
  facturasPendientes: FacturaPendiente[];
  onVerDetalle: (factura: FacturaPendiente) => void;
  nombreUsuario: string;
  rolUsuario: string;
}

export default function MisPendientesSLA({ 
  facturasPendientes, 
  onVerDetalle,
  nombreUsuario,
  rolUsuario
}: MisPendientesSLAProps) {
  const [ordenamiento, setOrdenamiento] = useState<'riesgo' | 'dias' | 'monto'>('riesgo');

  const getRiesgoColor = (nivel: string) => {
    switch (nivel) {
      case 'verde':
        return 'bg-green-500';
      case 'amarillo':
        return 'bg-yellow-500';
      case 'naranja':
        return 'bg-orange-500';
      case 'vencido':
        return 'bg-purple-700';
      default:
        return 'bg-slate-300';
    }
  };

  const getRiesgoText = (nivel: string) => {
    switch (nivel) {
      case 'verde':
        return 'A tiempo';
      case 'amarillo':
        return 'En riesgo';
      case 'naranja':
        return 'Atrasado';
      case 'vencido':
        return 'Vencido';
      default:
        return 'Sin datos';
    }
  };

  const getRiesgoBadge = (nivel: string) => {
    switch (nivel) {
      case 'verde':
        return 'bg-green-100 text-green-700 border-green-300';
      case 'amarillo':
        return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'naranja':
        return 'bg-orange-100 text-orange-700 border-orange-300';
      case 'vencido':
        return 'bg-purple-100 text-purple-700 border-purple-400';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const calcularProgreso = (factura: FacturaPendiente) => {
    return Math.min((factura.diasTranscurridos / factura.diasMaximos) * 100, 100);
  };

  const calcularTiempoRestante = (factura: FacturaPendiente) => {
    const restante = factura.diasMaximos - factura.diasTranscurridos;
    if (restante < 0) {
      return `Vencido hace ${Math.abs(restante)} días`;
    } else if (restante === 0) {
      return 'Vence hoy';
    } else if (restante === 1) {
      return '1 día restante';
    } else {
      return `${restante} días restantes`;
    }
  };

  // KPIs
  const facturasVerde = facturasPendientes.filter(f => f.nivelRiesgo === 'verde').length;
  const facturasAmarillo = facturasPendientes.filter(f => f.nivelRiesgo === 'amarillo').length;
  const facturasNaranja = facturasPendientes.filter(f => f.nivelRiesgo === 'naranja').length;
  const facturasVencidas = facturasPendientes.filter(f => f.nivelRiesgo === 'vencido').length;

  // Ordenar facturas
  const facturasOrdenadas = [...facturasPendientes].sort((a, b) => {
    if (ordenamiento === 'riesgo') {
      const riesgoOrden: any = { vencido: 0, naranja: 1, amarillo: 2, verde: 3 };
      return riesgoOrden[a.nivelRiesgo] - riesgoOrden[b.nivelRiesgo];
    } else if (ordenamiento === 'dias') {
      return b.diasTranscurridos - a.diasTranscurridos;
    } else {
      return b.valorTotal - a.valorTotal;
    }
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-white mb-1">Mis Pendientes</h2>
            <p className="text-red-100 text-sm">{nombreUsuario} - {rolUsuario}</p>
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-yellow-400">{facturasPendientes.length}</p>
            <p className="text-sm text-red-100">Facturas asignadas</p>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-green-50 border-l-4 border-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-700">{facturasVerde}</p>
                  <p className="text-xs text-green-600 mt-1">A tiempo</p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-yellow-50 border-l-4 border-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-yellow-700">{facturasAmarillo}</p>
                  <p className="text-xs text-yellow-600 mt-1">En riesgo</p>
                </div>
                <Clock className="w-10 h-10 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-orange-50 border-l-4 border-orange-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-700">{facturasNaranja}</p>
                  <p className="text-xs text-orange-600 mt-1">Atrasadas</p>
                </div>
                <AlertTriangle className="w-10 h-10 text-orange-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-0 shadow-lg bg-purple-100 border-l-4 border-purple-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-purple-900">{facturasVencidas}</p>
                  <p className="text-xs text-purple-700 mt-1">Vencidas</p>
                </div>
                <XCircle className="w-10 h-10 text-purple-700 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros de Ordenamiento */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-700">Ordenar por:</span>
            <Button
              size="sm"
              variant={ordenamiento === 'riesgo' ? 'default' : 'outline'}
              onClick={() => setOrdenamiento('riesgo')}
              className={ordenamiento === 'riesgo' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Nivel de Riesgo
            </Button>
            <Button
              size="sm"
              variant={ordenamiento === 'dias' ? 'default' : 'outline'}
              onClick={() => setOrdenamiento('dias')}
              className={ordenamiento === 'dias' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Días Transcurridos
            </Button>
            <Button
              size="sm"
              variant={ordenamiento === 'monto' ? 'default' : 'outline'}
              onClick={() => setOrdenamiento('monto')}
              className={ordenamiento === 'monto' ? 'bg-red-600 hover:bg-red-700' : ''}
            >
              Monto
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Facturas Pendientes */}
      <div className="space-y-4">
        {facturasOrdenadas.map((factura, index) => (
          <motion.div
            key={factura.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card className="border-0 shadow-lg hover:shadow-2xl transition-all group cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  {/* Indicador de Semáforo */}
                  <div className="flex flex-col items-center gap-2">
                    <motion.div
                      animate={{
                        scale: factura.nivelRiesgo === 'vencido' ? [1, 1.2, 1] : 1,
                      }}
                      transition={{
                        duration: 1,
                        repeat: factura.nivelRiesgo === 'vencido' ? Infinity : 0,
                      }}
                      className={`w-12 h-12 rounded-full ${getRiesgoColor(factura.nivelRiesgo)} flex items-center justify-center shadow-lg`}
                    >
                      {factura.nivelRiesgo === 'verde' && <CheckCircle2 className="w-6 h-6 text-white" />}
                      {factura.nivelRiesgo === 'amarillo' && <Clock className="w-6 h-6 text-white" />}
                      {(factura.nivelRiesgo === 'naranja' || factura.nivelRiesgo === 'vencido') && (
                        <AlertTriangle className="w-6 h-6 text-white" />
                      )}
                    </motion.div>
                    <Badge className={`${getRiesgoBadge(factura.nivelRiesgo)} border text-xs`}>
                      {getRiesgoText(factura.nivelRiesgo)}
                    </Badge>
                  </div>

                  {/* Información de la Factura */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-lg text-slate-800 mb-1">
                          {factura.numeroFactura}
                        </h4>
                        <p className="text-slate-600 text-sm">{factura.proveedor}</p>
                        <p className="text-slate-500 text-xs mt-1">{factura.areaSolicitante}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-green-600">
                          ${factura.valorTotal.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>

                    {/* Etapa Actual */}
                    <div className="mb-3">
                      <Badge variant="outline" className="border-blue-300 text-blue-700">
                        {factura.etapaActual}
                      </Badge>
                    </div>

                    {/* Barra de Progreso de Tiempo */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600 font-semibold">
                          {calcularTiempoRestante(factura)}
                        </span>
                        <span className="text-slate-500">
                          {factura.diasTranscurridos} / {factura.diasMaximos} días
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${calcularProgreso(factura)}%` }}
                          transition={{ duration: 0.5, delay: index * 0.1 }}
                          className={`h-full ${getRiesgoColor(factura.nivelRiesgo)} transition-all`}
                        />
                      </div>
                    </div>

                    {/* Countdown Visual */}
                    {factura.nivelRiesgo === 'vencido' && (
                      <div className="mt-3 bg-red-100 border border-red-300 rounded-lg p-3 flex items-center gap-2">
                        <XCircle className="w-5 h-5 text-red-700" />
                        <p className="text-sm font-semibold text-red-700">
                          ¡Atención! Esta factura está vencida desde hace {factura.diasTranscurridos - factura.diasMaximos} días
                        </p>
                      </div>
                    )}

                    {factura.observaciones && (
                      <div className="mt-3 text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <p className="font-semibold text-xs text-slate-500 mb-1">Observaciones:</p>
                        <p>{factura.observaciones}</p>
                      </div>
                    )}

                    {/* Botón Ver Detalle */}
                    <div className="mt-4 flex justify-end">
                      <Button
                        onClick={() => onVerDetalle(factura)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver Detalle Completo
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {facturasPendientes.length === 0 && (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                ¡Excelente trabajo!
              </h3>
              <p className="text-slate-600">
                No tienes facturas pendientes en este momento
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}