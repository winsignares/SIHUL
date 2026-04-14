import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { 
  Clock, Save, AlertCircle, Edit, Check, X, 
  TrendingUp, Settings, Bell
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface ParametroSLA {
  id: string;
  etapa: string;
  rolResponsable: string;
  diasMaximos: number;
  alertaAmarillo: number; // % del tiempo para alerta amarilla
  alertaRoja: number; // % del tiempo para alerta roja
  descripcion: string;
  activo: boolean;
}

export default function ParametrizacionSLA() {
  const [editando, setEditando] = useState<string | null>(null);
  const [parametros, setParametros] = useState<ParametroSLA[]>([
    {
      id: '1',
      etapa: 'Registro y Recepción',
      rolResponsable: 'Funcionario',
      diasMaximos: 2,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo máximo para registrar factura recibida por correo',
      activo: true
    },
    {
      id: '2',
      etapa: 'Radicación',
      rolResponsable: 'Contabilidad',
      diasMaximos: 3,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo máximo para radicar factura en el sistema',
      activo: true
    },
    {
      id: '3',
      etapa: 'Causación',
      rolResponsable: 'Contabilidad',
      diasMaximos: 2,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo máximo para causar factura radicada',
      activo: true
    },
    {
      id: '4',
      etapa: 'Alistamiento (Sin CE)',
      rolResponsable: 'Tesorería',
      diasMaximos: 3,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo para alistar pago sin compromiso de egreso',
      activo: true
    },
    {
      id: '5',
      etapa: 'Control Previo',
      rolResponsable: 'Auditoría',
      diasMaximos: 4,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo máximo para control previo de auditoría',
      activo: true
    },
    {
      id: '6',
      etapa: 'Generación CE',
      rolResponsable: 'Tesorería',
      diasMaximos: 2,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo para generar compromiso de egreso definitivo',
      activo: true
    },
    {
      id: '7',
      etapa: 'Cargue Formal',
      rolResponsable: 'Dirección Financiera',
      diasMaximos: 2,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo para cargue formal previo a autorización',
      activo: true
    },
    {
      id: '8',
      etapa: 'Autorización de Pago',
      rolResponsable: 'Rectoría',
      diasMaximos: 3,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo máximo para autorización final de pago',
      activo: true
    },
    {
      id: '9',
      etapa: 'Aplicación de Pago',
      rolResponsable: 'Tesorería',
      diasMaximos: 2,
      alertaAmarillo: 60,
      alertaRoja: 80,
      descripcion: 'Tiempo para ejecutar y aplicar el pago',
      activo: true
    }
  ]);

  const [valoresTemp, setValoresTemp] = useState<{ [key: string]: Partial<ParametroSLA> }>({});

  const iniciarEdicion = (parametro: ParametroSLA) => {
    setEditando(parametro.id);
    setValoresTemp({
      [parametro.id]: { ...parametro }
    });
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setValoresTemp({});
  };

  const guardarParametro = (id: string) => {
    const valoresEditados = valoresTemp[id];
    if (!valoresEditados) return;

    // Validaciones
    if ((valoresEditados.diasMaximos || 0) < 1) {
      toast.error('Error de validación', {
        description: 'Los días máximos deben ser al menos 1'
      });
      return;
    }

    if ((valoresEditados.alertaAmarillo || 0) >= (valoresEditados.alertaRoja || 0)) {
      toast.error('Error de validación', {
        description: 'La alerta amarilla debe ser menor que la alerta roja'
      });
      return;
    }

    setParametros(prev =>
      prev.map(p =>
        p.id === id ? { ...p, ...valoresEditados } : p
      )
    );

    setEditando(null);
    setValoresTemp({});

    toast.success('¡Parámetro actualizado!', {
      description: `Los cambios en ${valoresEditados.etapa} se han guardado correctamente`
    });
  };

  const actualizarValorTemp = (id: string, campo: keyof ParametroSLA, valor: any) => {
    setValoresTemp(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [campo]: valor
      }
    }));
  };

  const toggleActivo = (id: string) => {
    setParametros(prev =>
      prev.map(p =>
        p.id === id ? { ...p, activo: !p.activo } : p
      )
    );

    const parametro = parametros.find(p => p.id === id);
    if (parametro) {
      toast.success(
        parametro.activo ? 'Parámetro desactivado' : 'Parámetro activado',
        {
          description: `${parametro.etapa} ahora está ${parametro.activo ? 'inactivo' : 'activo'}`
        }
      );
    }
  };

  const calcularTiempoTotal = () => {
    return parametros
      .filter(p => p.activo)
      .reduce((total, p) => total + p.diasMaximos, 0);
  };

  const guardarTodosLosParametros = () => {
    toast.success('¡Configuración guardada!', {
      description: 'Todos los parámetros SLA se han actualizado en el sistema'
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Settings className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Parametrización de Tiempos SLA</h1>
            <p className="text-red-100 text-sm">
              Configurar tiempos máximos de respuesta por etapa del proceso
            </p>
          </div>
        </div>
      </motion.div>

      {/* Resumen Global */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold mb-1">{calcularTiempoTotal()}</p>
                  <p className="text-sm text-blue-100">Días Totales del Flujo</p>
                </div>
                <Clock className="w-12 h-12 text-blue-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-green-600 to-green-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold mb-1">
                    {parametros.filter(p => p.activo).length}
                  </p>
                  <p className="text-sm text-green-100">Etapas Activas</p>
                </div>
                <Check className="w-12 h-12 text-green-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-600 to-orange-700 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold mb-1">{parametros.length}</p>
                  <p className="text-sm text-orange-100">Etapas Configuradas</p>
                </div>
                <TrendingUp className="w-12 h-12 text-orange-200 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabla de Parámetros */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-slate-800">
            <span>Configuración de Tiempos por Etapa</span>
            <Button
              onClick={guardarTodosLosParametros}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Todo
            </Button>
          </CardTitle>
          <CardDescription>
            Define los tiempos máximos de gestión y umbrales de alerta para cada etapa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {parametros.map((parametro, index) => (
              <motion.div
                key={parametro.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className={`border-2 ${parametro.activo ? 'border-slate-200' : 'border-slate-300 bg-slate-50'}`}>
                  <CardContent className="p-5">
                    <div className="space-y-4">
                      {/* Header de la Etapa */}
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h4 className="font-bold text-lg text-slate-800">{parametro.etapa}</h4>
                            <Badge variant="outline" className="border-blue-300 text-blue-700">
                              {editando === parametro.id 
                                ? valoresTemp[parametro.id]?.rolResponsable || parametro.rolResponsable
                                : parametro.rolResponsable
                              }
                            </Badge>
                            <Badge className={parametro.activo 
                              ? 'bg-green-100 text-green-700 border-green-300 border'
                              : 'bg-slate-100 text-slate-700 border-slate-300 border'
                            }>
                              {parametro.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-600">{parametro.descripcion}</p>
                        </div>

                        <div className="flex items-center gap-2">
                          {editando === parametro.id ? (
                            <>
                              <Button
                                size="sm"
                                onClick={() => guardarParametro(parametro.id)}
                                className="bg-green-600 hover:bg-green-700 text-white"
                              >
                                <Check className="w-4 h-4 mr-1" />
                                Guardar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={cancelarEdicion}
                              >
                                <X className="w-4 h-4 mr-1" />
                                Cancelar
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => iniciarEdicion(parametro)}
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toggleActivo(parametro.id)}
                                className={parametro.activo 
                                  ? 'border-red-600 text-red-600 hover:bg-red-50'
                                  : 'border-green-600 text-green-600 hover:bg-green-50'
                                }
                              >
                                {parametro.activo ? 'Desactivar' : 'Activar'}
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Configuración de Tiempos */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200">
                        {/* Días Máximos */}
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-sm font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-600" />
                            Días Máximos
                          </Label>
                          {editando === parametro.id ? (
                            <Input
                              type="number"
                              min="1"
                              value={valoresTemp[parametro.id]?.diasMaximos ?? parametro.diasMaximos}
                              onChange={(e) => actualizarValorTemp(parametro.id, 'diasMaximos', parseInt(e.target.value))}
                              className="border-blue-300 focus:border-blue-600 focus:ring-blue-600"
                            />
                          ) : (
                            <div className="text-3xl font-bold text-blue-700">
                              {parametro.diasMaximos} días
                            </div>
                          )}
                        </div>

                        {/* Alerta Amarilla */}
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-sm font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            Alerta Amarilla (%)
                          </Label>
                          {editando === parametro.id ? (
                            <Input
                              type="number"
                              min="1"
                              max="99"
                              value={valoresTemp[parametro.id]?.alertaAmarillo ?? parametro.alertaAmarillo}
                              onChange={(e) => actualizarValorTemp(parametro.id, 'alertaAmarillo', parseInt(e.target.value))}
                              className="border-yellow-300 focus:border-yellow-600 focus:ring-yellow-600"
                            />
                          ) : (
                            <div className="text-3xl font-bold text-yellow-600">
                              {parametro.alertaAmarillo}%
                            </div>
                          )}
                          <p className="text-xs text-slate-500">
                            ≥ {Math.ceil((parametro.diasMaximos * parametro.alertaAmarillo) / 100)} días
                          </p>
                        </div>

                        {/* Alerta Roja */}
                        <div className="space-y-2">
                          <Label className="text-slate-700 text-sm font-semibold flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-red-600" />
                            Alerta Roja (%)
                          </Label>
                          {editando === parametro.id ? (
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={valoresTemp[parametro.id]?.alertaRoja ?? parametro.alertaRoja}
                              onChange={(e) => actualizarValorTemp(parametro.id, 'alertaRoja', parseInt(e.target.value))}
                              className="border-red-300 focus:border-red-600 focus:ring-red-600"
                            />
                          ) : (
                            <div className="text-3xl font-bold text-red-600">
                              {parametro.alertaRoja}%
                            </div>
                          )}
                          <p className="text-xs text-slate-500">
                            ≥ {Math.ceil((parametro.diasMaximos * parametro.alertaRoja) / 100)} días
                          </p>
                        </div>
                      </div>

                      {/* Ejemplo Visual de Semáforo */}
                      {!editando || editando !== parametro.id && (
                        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                          <p className="text-xs text-slate-600 font-semibold mb-2">Ejemplo de semáforo:</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-green-500 h-2 rounded-l-full" />
                            <span className="text-xs text-slate-600">0-{parametro.alertaAmarillo}%</span>
                            <div className="flex-1 bg-yellow-500 h-2" />
                            <span className="text-xs text-slate-600">{parametro.alertaAmarillo}-{parametro.alertaRoja}%</span>
                            <div className="flex-1 bg-red-500 h-2 rounded-r-full" />
                            <span className="text-xs text-slate-600">{parametro.alertaRoja}-100%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Información Adicional */}
      <Card className="border-0 shadow-lg bg-blue-50 border-l-4 border-blue-600">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Bell className="w-6 h-6 text-blue-600 flex-shrink-0 mt-1" />
            <div>
              <h4 className="font-bold text-slate-800 mb-2">Impacto de los Parámetros SLA</h4>
              <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
                <li>Los días máximos definen el tiempo total permitido para cada etapa</li>
                <li>La alerta amarilla activa el indicador de "En Riesgo" cuando se alcanza ese % del tiempo</li>
                <li>La alerta roja activa el indicador de "Atrasado" cuando se alcanza ese % del tiempo</li>
                <li>Al superar los días máximos, la factura se marca como "Vencida"</li>
                <li>Estos valores afectan directamente los semáforos y KPIs en todos los dashboards</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
