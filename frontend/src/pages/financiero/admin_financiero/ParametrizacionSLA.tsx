import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { AlertTriangle, Clock3, Edit3, Info, Save } from 'lucide-react';
import { parametrosSlaAdminService } from '../../../services/financiero';
import type { ParametroSLA } from '../../../models/financiero/core.models';
import { toast } from 'sonner';

const ETAPAS_ORDEN: Array<{ index: number; terms: string[] }> = [
  { index: 1, terms: ['registro y recepcion', 'recepcion y registro'] },
  { index: 2, terms: ['radicacion'] },
  { index: 3, terms: ['alistamiento'] },
  { index: 4, terms: ['control previo'] },
  { index: 5, terms: ['envio a direccion financiera'] },
  { index: 6, terms: ['cargue formal'] },
  { index: 7, terms: ['envio a rectoria'] },
  { index: 8, terms: ['aplicacion de pago', 'pago aplicado', 'factura pagada', 'comprobante de egreso', 'generacion comprobante'] },
];

const ETAPAS_OCULTAS = ['causacion', 'autorizacion de pago'];

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
  if (
    etapaNormalizada.includes('aplicacion de pago') ||
    etapaNormalizada.includes('pago aplicado') ||
    etapaNormalizada.includes('factura pagada') ||
    etapaNormalizada.includes('comprobante de egreso') ||
    etapaNormalizada.includes('generacion comprobante')
  ) {
    return 'aplicacion-pago';
  }
  return etapaNormalizada;
};

const isPreferredRegistroLabel = (etapa: string) => normalizeText(etapa).includes('registro y recepcion');

export default function ParametrizacionSLAReal() {
  const [parametros, setParametros] = useState<ParametroSLA[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [editingItem, setEditingItem] = useState<ParametroSLA | null>(null);

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
      const visibles = parametros.filter(
        (p) => !ETAPAS_OCULTAS.some((term) => normalizeText(p.etapa).includes(term))
      );
      const sorted = visibles.sort((a, b) => {
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

  // Helpers que operan sobre editingItem en lugar de sobre parametros[]
  const editDiasPreview = editingItem ? getDiasPreview(editingItem.dias_maximos, editingItem.alerta_amarillo_porcentaje) : 0;
  const editDiasCritico = editingItem ? getDiasPreview(editingItem.dias_maximos, editingItem.alerta_roja_porcentaje) : 0;
  const editInvalido = editDiasPreview > editDiasCritico;

  const updateEditDiasMaximos = (value: number) => {
    if (!editingItem) return;
    const diasMaximos = Math.max(1, value || 1);
    let avisoDia = clampDia(getDiasPreview(editingItem.dias_maximos, editingItem.alerta_amarillo_porcentaje), diasMaximos);
    const criticoDia = clampDia(getDiasPreview(editingItem.dias_maximos, editingItem.alerta_roja_porcentaje), diasMaximos);
    if (avisoDia > criticoDia) avisoDia = criticoDia;
    setEditingItem({
      ...editingItem,
      dias_maximos: diasMaximos,
      alerta_amarillo_porcentaje: getPercentFromDays(avisoDia, diasMaximos),
      alerta_roja_porcentaje: getPercentFromDays(criticoDia, diasMaximos),
    });
  };

  const updateEditAlertaDia = (tipo: 'preventivo' | 'critico', dayValue: string) => {
    if (!editingItem) return;
    const selectedDay = parseInt(dayValue, 10);
    const diasMaximos = Math.max(1, editingItem.dias_maximos || 1);
    let avisoDia = getDiasPreview(diasMaximos, editingItem.alerta_amarillo_porcentaje);
    let criticoDia = getDiasPreview(diasMaximos, editingItem.alerta_roja_porcentaje);
    if (tipo === 'preventivo') {
      avisoDia = clampDia(selectedDay, diasMaximos);
      if (avisoDia > criticoDia) criticoDia = avisoDia;
    } else {
      criticoDia = clampDia(selectedDay, diasMaximos);
      if (criticoDia < avisoDia) avisoDia = criticoDia;
    }
    setEditingItem({
      ...editingItem,
      alerta_amarillo_porcentaje: getPercentFromDays(avisoDia, diasMaximos),
      alerta_roja_porcentaje: getPercentFromDays(criticoDia, diasMaximos),
    });
  };

  const guardarEdicion = async () => {
    if (!editingItem) return;
    if (editInvalido) { toast.error('El aviso preventivo no puede quedar después de la alerta crítica.'); return; }
    setSavingId(editingItem.id);
    try {
      await parametrosSlaAdminService.actualizar(editingItem.id, {
        dias_maximos: editingItem.dias_maximos,
        alerta_amarillo_porcentaje: editingItem.alerta_amarillo_porcentaje,
        alerta_roja_porcentaje: editingItem.alerta_roja_porcentaje,
        activo: editingItem.activo,
        descripcion: editingItem.descripcion,
      });
      setParametros((prev) => prev.map((p) => (p.id === editingItem.id ? { ...p, ...editingItem } : p)));
      toast.success(`SLA actualizado correctamente.`);
      setEditingItem(null);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No fue posible guardar el parámetro SLA.');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl">
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <h1 className="text-3xl font-bold">Parametrización SLA</h1>
        <p className="mt-1 max-w-2xl text-sm text-red-100">Configura tiempos objetivo por etapa y define desde qué día una factura entra en alerta preventiva o crítica.</p>
      </motion.div>

      <Card className="border-amber-200 bg-amber-50/60">
        <CardContent className="p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
            <div className="space-y-1 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">¿Cómo funcionan los avisos?</p>
              <p>- <span className="font-medium">Aviso preventivo (día)</span>: día en el que inicia la alerta temprana.</p>
              <p>- <span className="font-medium">Alerta crítica (día)</span>: día en el que la etapa pasa a prioridad alta.</p>
              <p className="text-xs text-slate-600">Los días se eligen en una lista y se ajustan automáticamente según el valor de "Días límite".</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reglas SLA por Etapa</CardTitle>
          <CardDescription>Haz clic en el ícono de editar para modificar los valores de cada etapa.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading && <p className="text-sm text-slate-500">Cargando parámetros...</p>}
          {!loading && parametros.length === 0 && <p className="text-sm text-slate-500">No hay parámetros SLA configurados.</p>}

          {!loading && parametros.length > 0 && (
            <div className="rounded-xl border overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="pl-5 w-[24%]">Etapa</TableHead>
                    <TableHead className="w-[16%]">Responsable</TableHead>
                    <TableHead className="w-[10%] text-center">Días límite</TableHead>
                    <TableHead className="w-[13%] text-center">Aviso preventivo</TableHead>
                    <TableHead className="w-[13%] text-center">Alerta crítica</TableHead>
                    <TableHead className="w-[18%]">Vista previa</TableHead>
                    <TableHead className="w-[6%] text-center">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parametrosOrdenados.map((p) => {
                    const diasAviso = getDiasPreview(p.dias_maximos, p.alerta_amarillo_porcentaje);
                    const diasCritico = getDiasPreview(p.dias_maximos, p.alerta_roja_porcentaje);

                    return (
                      <TableRow key={p.id} className="align-middle">
                        <TableCell className="pl-5 py-4">
                          <p className="text-sm font-medium text-slate-800">
                            {p.descripcion || <span className="italic text-slate-400">Sin descripción</span>}
                          </p>
                        </TableCell>
                        <TableCell className="py-4">
                          <span className="text-sm text-slate-700">{p.rol_responsable}</span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="text-sm font-semibold text-slate-800">{p.dias_maximos}</span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="text-sm font-medium text-amber-700">Día {diasAviso}</span>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <span className="text-sm font-medium text-red-700">Día {diasCritico}</span>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-amber-700">
                              <Clock3 className="w-3 h-3 shrink-0" />
                              Aviso el día {diasAviso} de {p.dias_maximos}
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-red-700">
                              <AlertTriangle className="w-3 h-3 shrink-0" />
                              Crítico el día {diasCritico} de {p.dias_maximos}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingItem({ ...p })}
                            className="px-2"
                            title="Editar"
                          >
                            <Edit3 className="w-4 h-4" />
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

    {/* Dialog de edición */}
    <Dialog open={!!editingItem} onOpenChange={(open) => { if (!open) setEditingItem(null); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar parámetro SLA</DialogTitle>
          <p className="text-sm text-slate-500">{editingItem?.descripcion || editingItem?.etapa}</p>
        </DialogHeader>

        {editingItem && (() => {
          const dayOptions = getDayOptions(editingItem.dias_maximos);
          return (
            <div className="space-y-5 py-2">
              <div className="space-y-2">
                <Label>Descripción de la etapa</Label>
                <Input
                  value={editingItem.descripcion || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, descripcion: e.target.value })}
                  placeholder="Nombre visible de la etapa"
                />
              </div>

              <div className="space-y-2">
                <Label>Días límite</Label>
                <Input
                  type="number"
                  min={1}
                  value={editingItem.dias_maximos}
                  onChange={(e) => updateEditDiasMaximos(Math.max(1, parseInt(e.target.value || '1', 10)))}
                />
                <p className="text-xs text-slate-500">Número máximo de días permitidos para esta etapa.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-amber-700">
                    <Clock3 className="w-3.5 h-3.5" /> Aviso preventivo
                  </Label>
                  <Select value={String(editDiasPreview)} onValueChange={(v) => updateEditAlertaDia('preventivo', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((opt) => (
                        <SelectItem key={`edit-aviso-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-red-700">
                    <AlertTriangle className="w-3.5 h-3.5" /> Alerta crítica
                  </Label>
                  <Select value={String(editDiasCritico)} onValueChange={(v) => updateEditAlertaDia('critico', v)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOptions.map((opt) => (
                        <SelectItem key={`edit-critico-${opt.value}`} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {editInvalido && (
                <p className="text-xs text-red-600 font-medium">El aviso preventivo no puede quedar después de la alerta crítica.</p>
              )}

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 space-y-1.5">
                <p className="text-xs font-semibold text-slate-700">Vista previa</p>
                <div className="flex items-center gap-1.5 text-xs text-amber-700">
                  <Clock3 className="w-3 h-3" /> Aviso el día {editDiasPreview} de {editingItem.dias_maximos}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-red-700">
                  <AlertTriangle className="w-3 h-3" /> Crítico el día {editDiasCritico} de {editingItem.dias_maximos}
                </div>
              </div>
            </div>
          );
        })()}

        <DialogFooter>
          <Button variant="outline" onClick={() => setEditingItem(null)}>Cancelar</Button>
          <Button
            onClick={() => void guardarEdicion()}
            disabled={savingId !== null || editInvalido}
            className="bg-red-700 hover:bg-red-800 text-white"
          >
            <Save className="w-4 h-4 mr-2" />
            {savingId !== null ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
