import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { AlertTriangle, Clock3, Info, Save } from 'lucide-react';
import { parametrosSlaAdminService } from '../../../services/financiero';
import type { ParametroSLA } from '../../../models/financiero/core.models';
import { toast } from 'sonner';

const ETAPAS_ORDEN: Array<{ index: number; terms: string[] }> = [
  { index: 1, terms: ['registro y recepcion', 'recepcion y registro'] },
  { index: 2, terms: ['radicacion'] },
  { index: 3, terms: ['causacion'] },
  { index: 4, terms: ['alistamiento'] },
  { index: 5, terms: ['control previo'] },
  { index: 6, terms: ['direccion financiera', 'envio a direccion financiera'] },
  { index: 7, terms: ['cargue formal'] },
  { index: 8, terms: ['autorizacion de pago'] },
  { index: 9, terms: ['aplicacion de pago'] },
  { index: 10, terms: ['comprobante de egreso'] },
  { index: 11, terms: ['generacion comprobante'] },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const getOrderByEtapa = (etapa: string) => {
  const etapaNormalizada = normalizeText(etapa);
  const found = ETAPAS_ORDEN.find((item) => item.terms.some((term) => etapaNormalizada.includes(term)));
  return found?.index ?? 999;
};

const getCanonicalEtapaKey = (etapa: string) => {
  const etapaNormalizada = normalizeText(etapa);
  if (etapaNormalizada.includes('registro y recepcion') || etapaNormalizada.includes('recepcion y registro')) {
    return 'registro-recepcion';
  }
  return etapaNormalizada;
};

const isPreferredRegistroLabel = (etapa: string) => normalizeText(etapa).includes('registro y recepcion');

export default function ParametrizacionSLAReal() {
  const [parametros, setParametros] = useState<ParametroSLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);

  const getErrorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback);

  const clampDia = (dia: number, diasMaximos: number) => {
    const max = Math.max(1, diasMaximos || 1);
    if (Number.isNaN(dia)) return 1;
    return Math.max(1, Math.min(max, dia));
  };

  const getDiasPreview = (diasMaximos: number, porcentaje: number) => {
    const max = Math.max(1, diasMaximos || 1);
    return Math.max(1, Math.ceil((max * (porcentaje || 0)) / 100));
  };

  const getPercentFromDays = (diasSeleccionados: number, diasMaximos: number) => {
    const max = Math.max(1, diasMaximos || 1);
    const dias = clampDia(diasSeleccionados, max);
    return Math.max(1, Math.min(100, Math.round((dias / max) * 100)));
  };

  const getDayOptions = (diasMaximos: number) =>
    Array.from({ length: Math.max(1, diasMaximos || 1) }, (_, index) => {
      const day = index + 1;
      return { value: String(day), label: `Día ${day}` };
    });

  const updateDiasMaximos = (id: number, value: number) => {
    setParametros((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const diasMaximos = Math.max(1, value || 1);
        let avisoDia = clampDia(getDiasPreview(p.dias_maximos, p.alerta_amarillo_porcentaje), diasMaximos);
        const criticoDia = clampDia(getDiasPreview(p.dias_maximos, p.alerta_roja_porcentaje), diasMaximos);

        if (avisoDia > criticoDia) {
          avisoDia = criticoDia;
        }

        return {
          ...p,
          dias_maximos: diasMaximos,
          alerta_amarillo_porcentaje: getPercentFromDays(avisoDia, diasMaximos),
          alerta_roja_porcentaje: getPercentFromDays(criticoDia, diasMaximos),
        };
      }),
    );
  };

  const updateAlertaDia = (id: number, tipo: 'preventivo' | 'critico', dayValue: string) => {
    const selectedDay = parseInt(dayValue, 10);
    setParametros((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const diasMaximos = Math.max(1, p.dias_maximos || 1);
        let avisoDia = getDiasPreview(diasMaximos, p.alerta_amarillo_porcentaje);
        let criticoDia = getDiasPreview(diasMaximos, p.alerta_roja_porcentaje);

        if (tipo === 'preventivo') {
          avisoDia = clampDia(selectedDay, diasMaximos);
          if (avisoDia > criticoDia) {
            criticoDia = avisoDia;
          }
        } else {
          criticoDia = clampDia(selectedDay, diasMaximos);
          if (criticoDia < avisoDia) {
            avisoDia = criticoDia;
          }
        }

        return {
          ...p,
          alerta_amarillo_porcentaje: getPercentFromDays(avisoDia, diasMaximos),
          alerta_roja_porcentaje: getPercentFromDays(criticoDia, diasMaximos),
        };
      }),
    );
  };

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const data = await parametrosSlaAdminService.listar();
      setParametros(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No se pudieron cargar los parámetros SLA.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const parametrosOrdenados = useMemo(
    () => {
      const sorted = [...parametros].sort((a, b) => {
        const orderA = getOrderByEtapa(a.etapa);
        const orderB = getOrderByEtapa(b.etapa);
        if (orderA !== orderB) return orderA - orderB;
        return a.etapa.localeCompare(b.etapa, 'es', { sensitivity: 'base' });
      });

      const uniqueMap = new Map<string, ParametroSLA>();
      for (const item of sorted) {
        const key = getCanonicalEtapaKey(item.etapa);
        const existing = uniqueMap.get(key);
        if (!existing) {
          uniqueMap.set(key, item);
          continue;
        }
        if (key === 'registro-recepcion' && isPreferredRegistroLabel(item.etapa) && !isPreferredRegistroLabel(existing.etapa)) {
          uniqueMap.set(key, item);
        }
      }

      return Array.from(uniqueMap.values());
    },
    [parametros],
  );

  const totalDias = useMemo(
    () => parametrosOrdenados.filter((p) => p.activo).reduce((acc, p) => acc + (p.dias_maximos || 0), 0),
    [parametrosOrdenados],
  );

  const updateField = <K extends keyof ParametroSLA>(id: number, field: K, value: ParametroSLA[K]) => {
    setParametros((prev) => prev.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const guardar = async (id: number) => {
    const item = parametros.find((p) => p.id === id);
    if (!item) return;
    const avisoDia = getDiasPreview(item.dias_maximos, item.alerta_amarillo_porcentaje);
    const criticoDia = getDiasPreview(item.dias_maximos, item.alerta_roja_porcentaje);
    if (avisoDia > criticoDia) {
      toast.error('El aviso preventivo no puede quedar después de la alerta crítica.');
      return;
    }

    setSavingId(id);
    try {
      await parametrosSlaAdminService.actualizar(id, {
        dias_maximos: item.dias_maximos,
        alerta_amarillo_porcentaje: item.alerta_amarillo_porcentaje,
        alerta_roja_porcentaje: item.alerta_roja_porcentaje,
        activo: item.activo,
        descripcion: item.descripcion,
      });
      toast.success(`SLA actualizado para ${item.etapa}.`);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible guardar el parámetro SLA.'));
    } finally {
      setSavingId(null);
    }
  };

  const etapasActivas = parametros.filter((p) => p.activo).length;
  const promedioDias = etapasActivas > 0 ? Math.round(totalDias / etapasActivas) : 0;

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-red-700 rounded-2xl p-6 text-white shadow-xl">
        <h1 className="text-3xl font-bold">Parametrización SLA</h1>
        <p className="text-red-100 text-sm mt-1">Configura tiempos de gestión por etapa con avisos simples y entendibles.</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-blue-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <CardContent className="p-5">
            <p className="text-xs text-slate-600">Tiempo total del flujo activo</p>
            <p className="text-3xl font-bold text-slate-900">{totalDias} días</p>
          </CardContent>
        </Card>
        <Card className="border-emerald-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardContent className="p-5">
            <p className="text-xs text-slate-600">Etapas activas</p>
            <p className="text-3xl font-bold text-slate-900">{etapasActivas}</p>
          </CardContent>
        </Card>
        <Card className="border-amber-100 bg-gradient-to-r from-amber-50 to-orange-50">
          <CardContent className="p-5">
            <p className="text-xs text-slate-600">Promedio por etapa</p>
            <p className="text-3xl font-bold text-slate-900">{promedioDias} días</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 mt-0.5" />
            <div className="space-y-1 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">¿Cómo funcionan los avisos?</p>
              <p>
                - <span className="font-medium">Aviso preventivo (día)</span>: día en el que inicia la alerta temprana.
              </p>
              <p>
                - <span className="font-medium">Alerta crítica (día)</span>: día en el que la etapa pasa a prioridad alta.
              </p>
              <p className="text-xs text-slate-600">
                Los días se eligen en una lista y se ajustan automáticamente según el valor de "Días límite".
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reglas SLA por Etapa</CardTitle>
          <CardDescription>Edita cada etapa en formato tabla y guarda los cambios fila por fila.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <p className="text-sm text-slate-500">Cargando parámetros...</p>}
          {!loading && parametros.length === 0 && <p className="text-sm text-slate-500">No hay parámetros SLA configurados.</p>}

          {!loading && parametros.length > 0 && (
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead>Etapa</TableHead>
                    <TableHead>Responsable</TableHead>
                    <TableHead>Días límite</TableHead>
                    <TableHead>Aviso preventivo (día)</TableHead>
                    <TableHead>Alerta crítica (día)</TableHead>
                    <TableHead>Vista previa</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parametrosOrdenados.map((p) => {
                    const diasAviso = getDiasPreview(p.dias_maximos, p.alerta_amarillo_porcentaje);
                    const diasCritico = getDiasPreview(p.dias_maximos, p.alerta_roja_porcentaje);
                    const invalido = diasAviso > diasCritico;
                    const dayOptions = getDayOptions(p.dias_maximos);

                    return (
                      <TableRow key={p.id} className="align-top">
                        <TableCell className="min-w-[220px]">
                          <p className="font-semibold text-slate-800">{p.etapa}</p>
                          <Input
                            className="mt-2 h-8 text-xs"
                            value={p.descripcion || ''}
                            onChange={(e) => updateField(p.id, 'descripcion', e.target.value)}
                            placeholder="Descripción de la etapa"
                          />
                        </TableCell>
                        <TableCell className="min-w-[150px] text-sm text-slate-700">{p.rol_responsable}</TableCell>
                        <TableCell className="min-w-[110px]">
                          <Input
                            type="number"
                            min={1}
                            value={p.dias_maximos}
                            onChange={(e) => updateDiasMaximos(p.id, Math.max(1, parseInt(e.target.value || '0', 10)))}
                          />
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <Select value={String(diasAviso)} onValueChange={(value) => updateAlertaDia(p.id, 'preventivo', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona día" />
                            </SelectTrigger>
                            <SelectContent>
                              {dayOptions.map((option) => (
                                <SelectItem key={`aviso-${p.id}-${option.value}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[140px]">
                          <Select value={String(diasCritico)} onValueChange={(value) => updateAlertaDia(p.id, 'critico', value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona día" />
                            </SelectTrigger>
                            <SelectContent>
                              {dayOptions.map((option) => (
                                <SelectItem key={`critico-${p.id}-${option.value}`} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="min-w-[220px]">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-xs text-amber-700">
                              <Clock3 className="w-3 h-3" />
                              Aviso el día {diasAviso} de {p.dias_maximos}
                            </div>
                            <div className="flex items-center gap-2 text-xs text-red-700">
                              <AlertTriangle className="w-3 h-3" />
                              Crítico el día {diasCritico} de {p.dias_maximos}
                            </div>
                            {invalido && (
                              <p className="text-[11px] text-red-700">Revisa los días configurados para mantener el orden de alertas.</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="min-w-[120px]">
                          <Button
                            type="button"
                            variant="outline"
                            className={p.activo ? 'text-emerald-700 border-emerald-300' : 'text-slate-700'}
                            onClick={() => updateField(p.id, 'activo', !p.activo)}
                          >
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </Button>
                        </TableCell>
                        <TableCell className="min-w-[140px] text-right">
                          <Button
                            onClick={() => void guardar(p.id)}
                            disabled={savingId === p.id || invalido}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Save className="w-3 h-3 mr-1" />
                            {savingId === p.id ? 'Guardando...' : 'Guardar'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
