import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Checkbox } from '../../../share/checkbox';
import { Switch } from '../../../share/switch';
import { Textarea } from '../../../share/textarea';
import { parametrosFinancieroService, type ParametroFinanciero } from '../../../services/financiero';
import { toast } from 'sonner';
import { Save, Search, SlidersHorizontal, ShieldCheck, BellRing, Building2, Settings2, Gauge, MailCheck, Clock3, Layers3, Sparkles } from 'lucide-react';

const CATEGORY_META: Record<ParametroFinanciero['categoria'], { titulo: string; descripcion: string; icono: typeof Settings2 }> = {
  general: { titulo: 'General', descripcion: 'Datos maestros e identidad institucional', icono: Building2 },
  autorizacion: { titulo: 'Autorización', descripcion: 'Reglas de umbrales y autorizaciones especiales', icono: ShieldCheck },
  sla: { titulo: 'SLA', descripcion: 'Alertas y políticas de tiempo por etapa', icono: Clock3 },
  email: { titulo: 'Notificaciones', descripcion: 'Canales de alertas y correo operativo', icono: MailCheck },
  sistema: { titulo: 'Sistema', descripcion: 'Comportamiento global y retención documental', icono: Settings2 },
  reportes: { titulo: 'Reportes', descripcion: 'Parámetros de salida analítica y consolidación', icono: Layers3 },
};

const FRIENDLY_LABELS: Record<string, string> = {
  nombre_institucion: 'Nombre de la institución',
  nit_institucion: 'NIT de la institución',
  areas_solicitantes_excluidas: 'Áreas ocultas en el campo Solicitante',
  monto_autorizacion_especial: 'Monto para activar autorización especial',
  alerta_automatica_activa: 'Alertas automáticas de SLA',
  dias_retencion_documental: 'Días de retención documental',
  dias_retencion_documentos: 'Días de retención de documentos',
  email_notificaciones_financiero: 'Correo de notificaciones financieras',
  email_notificaciones: 'Correo general de notificaciones',
};

const AREAS_SOLICITANTES_DEFAULT = [
  'Financiero',
  'Contabilidad',
  'Tesorería',
  'Auditoría',
  'Dirección Financiera',
  'Rectoría',
];

const DUPLICATE_PREFERENCE_GROUPS: Array<{ preferred: string; mirrors: string[] }> = [
  { preferred: 'dias_retencion_documental', mirrors: ['dias_retencion_documentos'] },
  { preferred: 'email_notificaciones_financiero', mirrors: ['email_notificaciones'] },
];

const getDuplicateGroup = (clave: string) =>
  DUPLICATE_PREFERENCE_GROUPS.find((group) => group.preferred === clave || group.mirrors.includes(clave));

const getPreferredKey = (clave: string) => getDuplicateGroup(clave)?.preferred ?? clave;

const shouldHideAsMirror = (clave: string) => {
  const group = getDuplicateGroup(clave);
  return Boolean(group && group.preferred !== clave);
};

const isFieldBlocked = (clave: string) => clave === 'nombre_institucion' || clave === 'nit_institucion';

const parseListText = (value: string): string[] =>
  value
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

const getFriendlyLabel = (clave: string) => {
  if (FRIENDLY_LABELS[clave]) return FRIENDLY_LABELS[clave];
  return clave
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const asBoolean = (value: string) => ['true', '1', 'si', 'sí', 'yes', 'on', 'activo'].includes(value.trim().toLowerCase());

const normalizeNumberString = (value: string) => value.replace(',', '.').trim();

const toDisplayValue = (param: ParametroFinanciero) => {
  if (param.tipo_dato !== 'json') return param.valor;
  try {
    const parsed = JSON.parse(param.valor);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item)).join('\n');
    }
    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed)
        .map(([key, value]) => `${key}: ${String(value)}`)
        .join('\n');
    }
    return String(parsed ?? '');
  } catch {
    return param.valor;
  }
};

const toApiValue = (param: ParametroFinanciero): string => {
  const currentValue = param.valor ?? '';

  if (param.tipo_dato === 'boolean') {
    return asBoolean(currentValue) ? 'true' : 'false';
  }

  if (param.tipo_dato === 'number') {
    return normalizeNumberString(currentValue);
  }

  if (param.tipo_dato === 'json') {
    const trimmed = currentValue.trim();
    if (!trimmed) return '[]';
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        return JSON.stringify(JSON.parse(trimmed));
      } catch {
        return JSON.stringify(
          trimmed
            .split(/[\n,]/)
            .map((item) => item.trim())
            .filter(Boolean),
        );
      }
    }
    return JSON.stringify(
      trimmed
        .split(/[\n,]/)
        .map((item) => item.trim())
        .filter(Boolean),
    );
  }

  return currentValue;
};

const getValidationError = (param: ParametroFinanciero): string | null => {
  if (param.tipo_dato === 'number') {
    const value = normalizeNumberString(param.valor);
    if (value === '' || Number.isNaN(Number(value))) {
      return `${getFriendlyLabel(param.clave)} debe ser un número válido.`;
    }
  }
  return null;
};

export default function ConfiguracionReal() {
  const [params, setParams] = useState<ParametroFinanciero[]>([]);
  const [valoresOriginales, setValoresOriginales] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState<'todas' | ParametroFinanciero['categoria']>('todas');

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const data = await parametrosFinancieroService.listar();
        setParams(data.map((p) => ({ ...p, valor: toDisplayValue(p) })));
        setValoresOriginales(Object.fromEntries(data.map((p) => [p.id, p.valor])));
      } catch (error: unknown) {
        toast.error(error instanceof Error ? error.message : 'No se pudo cargar la configuración financiera.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const editable = useMemo(() => params.filter((p) => p.editable), [params]);

  const visibleEditable = useMemo(() => {
    const map = new Map<string, ParametroFinanciero>();
    for (const item of editable) {
      const preferredKey = getPreferredKey(item.clave);
      const current = map.get(preferredKey);
      if (!current || current.clave !== preferredKey) {
        map.set(preferredKey, item.clave === preferredKey ? item : current || item);
      }
    }
    return Array.from(map.values());
  }, [editable]);

  const grouped = useMemo(() => {
    const query = search.trim().toLowerCase();
    const list = visibleEditable.filter((p) => {
      if (categoriaActiva !== 'todas' && p.categoria !== categoriaActiva) return false;
      if (!query) return true;
      return [p.clave, p.valor, p.descripcion || '', CATEGORY_META[p.categoria]?.titulo || p.categoria]
        .join(' ')
        .toLowerCase()
        .includes(query);
    });

    return list.reduce<Record<string, ParametroFinanciero[]>>((acc, param) => {
      const key = param.categoria;
      if (!acc[key]) acc[key] = [];
      acc[key].push(param);
      return acc;
    }, {});
  }, [visibleEditable, search, categoriaActiva]);

  const categoriasConConteo = useMemo(() => {
    const conteo = visibleEditable.reduce<Record<string, number>>((acc, item) => {
      acc[item.categoria] = (acc[item.categoria] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(CATEGORY_META).map(([categoria, meta]) => ({
      categoria: categoria as ParametroFinanciero['categoria'],
      titulo: meta.titulo,
      icono: meta.icono,
      cantidad: conteo[categoria] || 0,
    }));
  }, [visibleEditable]);

  const totalCambiosPendientes = useMemo(
    () => visibleEditable.filter((p) => (valoresOriginales[p.id] ?? toApiValue(p)) !== toApiValue(p)).length,
    [visibleEditable, valoresOriginales]
  );

  const updateLocalValue = (id: number, value: string) => {
    setParams((prev) => {
      const target = prev.find((p) => p.id === id);
      if (!target) return prev;
      const group = getDuplicateGroup(target.clave);
      const syncKeys = group ? [group.preferred, ...group.mirrors] : [target.clave];

      return prev.map((p) => (syncKeys.includes(p.clave) ? { ...p, valor: value } : p));
    });
  };

  const guardarTodo = async () => {
    setSaving(true);
    try {
      const targets = params.filter(
        (p) => p.editable && !isFieldBlocked(p.clave) && (valoresOriginales[p.id] ?? toApiValue(p)) !== toApiValue(p),
      );
      if (targets.length === 0) {
        toast.info('No hay cambios pendientes por guardar.');
        setSaving(false);
        return;
      }

      const validationError = targets.map(getValidationError).find(Boolean);
      if (validationError) {
        toast.error(validationError);
        setSaving(false);
        return;
      }

      for (const p of targets) {
        await parametrosFinancieroService.actualizar(p.id, { valor: toApiValue(p) });
      }
      setValoresOriginales((prev) => {
        const next = { ...prev };
        targets.forEach((p) => {
          next[p.id] = toApiValue(p);
        });
        return next;
      });
      toast.success('Configuración financiera actualizada correctamente.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No fue posible guardar la configuración.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <SlidersHorizontal className="w-8 h-8 text-amber-300" />
              Configuración del Sistema Financiero
            </h1>
            <p className="text-rose-100 text-sm mt-1">Centro de control de políticas, alertas y reglas operativas con cambios visibles, agrupados y fáciles de seguir.</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge className="border border-white/20 bg-white/10 text-white">Editables: {editable.length}</Badge>
              <Badge className="border border-white/20 bg-white/10 text-white">Categorías: {Object.keys(grouped).length}</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-white/25 bg-white/10 px-3 py-2 text-xs">
            <p className="font-semibold">Cambios pendientes</p>
            <p className="text-2xl font-bold leading-none mt-1">{totalCambiosPendientes}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-emerald-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Parámetros editables</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{editable.length}</p>
            <p className="text-xs text-slate-600 mt-1">Configurables por la administración financiera</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-blue-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Categorías activas</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{Object.keys(grouped).length}</p>
            <p className="text-xs text-slate-600 mt-1">General, SLA, sistema, reportes y más</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-amber-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Sincronización</p>
            <p className="text-sm font-semibold text-slate-900 mt-2">{saving ? 'Aplicando cambios...' : 'Listo para guardar'}</p>
            <p className="text-xs text-slate-600 mt-1">Los cambios impactan el módulo financiero inmediatamente.</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md bg-gradient-to-br from-white to-rose-50">
          <CardContent className="p-4">
            <p className="text-xs text-slate-500">Pendientes</p>
            <p className="text-3xl font-bold text-slate-900 mt-1">{totalCambiosPendientes}</p>
            <p className="text-xs text-slate-600 mt-1">Parámetros modificados sin persistir</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-md">
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                placeholder="Buscar por nombre del ajuste, valor o descripción"
              />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant={categoriaActiva === 'todas' ? 'default' : 'outline'}
                className={categoriaActiva === 'todas' ? 'bg-slate-900 hover:bg-slate-800 text-white' : ''}
                onClick={() => setCategoriaActiva('todas')}
              >
                Todas
              </Button>

              {categoriasConConteo.map((categoria) => {
                const Icono = categoria.icono;
                return (
                  <Button
                    key={categoria.categoria}
                    variant={categoriaActiva === categoria.categoria ? 'default' : 'outline'}
                    className={categoriaActiva === categoria.categoria ? 'bg-rose-700 hover:bg-rose-800 text-white' : ''}
                    onClick={() => setCategoriaActiva(categoria.categoria)}
                  >
                    <Icono className="w-4 h-4 mr-2" />
                    {categoria.titulo} ({categoria.cantidad})
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Parámetros editables por categoría</CardTitle>
          <CardDescription>
            Estructura optimizada para revisión rápida, edición masiva y trazabilidad visual por tipo de regla.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading && <p className="text-sm text-slate-500">Cargando parámetros...</p>}
          {!loading && visibleEditable.length === 0 && <p className="text-sm text-slate-500">No hay parámetros editables configurados.</p>}
          {!loading && visibleEditable.length > 0 && Object.keys(grouped).length === 0 && <p className="text-sm text-slate-500">No hay resultados para el filtro aplicado.</p>}

          {Object.entries(grouped).map(([categoria, items]) => {
            const meta = CATEGORY_META[categoria as ParametroFinanciero['categoria']];
            return (
              <div key={categoria} className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{meta?.titulo || categoria}</p>
                    <p className="text-xs text-slate-500">{meta?.descripcion || 'Parámetros de configuración'}</p>
                  </div>
                  <Badge variant="outline" className="text-slate-700">{items.length} parámetros</Badge>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {items.map((p) => {
                    if (shouldHideAsMirror(p.clave)) return null;
                    const blocked = isFieldBlocked(p.clave);
                    const selectedAreas = p.clave === 'areas_solicitantes_excluidas' ? parseListText(p.valor) : [];
                    const uniqueAreas =
                      p.clave === 'areas_solicitantes_excluidas'
                        ? Array.from(new Set([...AREAS_SOLICITANTES_DEFAULT, ...selectedAreas]))
                        : [];

                    return (
                    <div key={p.id} className="border border-slate-200 rounded-xl bg-white p-3 space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <Label className="font-semibold text-slate-800">{getFriendlyLabel(p.clave)}</Label>
                        {blocked && <Badge variant="outline" className="text-slate-600">Bloqueado</Badge>}
                      </div>

                      {p.tipo_dato === 'boolean' && (
                        <div className="rounded-lg border border-slate-200 p-3 flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-medium text-slate-800">Estado</p>
                            <p className="text-xs text-slate-500">{asBoolean(p.valor) ? 'Activado' : 'Desactivado'}</p>
                          </div>
                          <Switch
                            checked={asBoolean(p.valor)}
                            onCheckedChange={(checked) => updateLocalValue(p.id, checked ? 'true' : 'false')}
                            disabled={blocked}
                          />
                        </div>
                      )}

                      {p.tipo_dato === 'number' && (
                        <Input
                          type="number"
                          inputMode="decimal"
                          value={p.valor}
                          onChange={(e) => updateLocalValue(p.id, e.target.value)}
                          placeholder="Ingresa un número"
                          disabled={blocked}
                        />
                      )}

                      {p.clave === 'areas_solicitantes_excluidas' && (
                        <div className="rounded-lg border border-slate-200 p-3 space-y-2">
                          <p className="text-xs text-slate-600">Selecciona las áreas que no quieres mostrar como solicitante:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {uniqueAreas.map((area) => {
                              const checked = selectedAreas.includes(area);
                              return (
                                <label key={area} className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-2 text-sm cursor-pointer">
                                  <Checkbox
                                    checked={checked}
                                    disabled={blocked}
                                    onCheckedChange={(nextChecked) => {
                                      const next = nextChecked
                                        ? [...selectedAreas, area]
                                        : selectedAreas.filter((item) => item !== area);
                                      updateLocalValue(p.id, next.join('\n'));
                                    }}
                                  />
                                  <span className="text-slate-700">{area}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {p.tipo_dato === 'json' && p.clave !== 'areas_solicitantes_excluidas' && (
                        <Textarea
                          value={p.valor}
                          onChange={(e) => updateLocalValue(p.id, e.target.value)}
                          className="min-h-[96px]"
                          placeholder="Escribe una opción por línea o separadas por coma"
                          disabled={blocked}
                        />
                      )}

                      {p.tipo_dato === 'string' && (
                        <Input value={p.valor} onChange={(e) => updateLocalValue(p.id, e.target.value)} disabled={blocked} />
                      )}

                      {(valoresOriginales[p.id] ?? toApiValue(p)) !== toApiValue(p) && (
                        <Badge className="bg-amber-100 text-amber-800 border border-amber-200">Cambio pendiente</Badge>
                      )}

                      {p.descripcion && <p className="text-xs text-slate-500">{p.descripcion}</p>}
                    </div>
                  );})}
                </div>
              </div>
            );
          })}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            <div className="rounded-xl border bg-emerald-50/70 border-emerald-100 p-3 text-xs text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4" />
              Configuración segura con persistencia backend.
            </div>
            <div className="rounded-xl border bg-amber-50/70 border-amber-100 p-3 text-xs text-amber-800 flex items-center gap-2">
              <BellRing className="w-4 h-4" />
              Ajustes de alertas y notificaciones centralizados.
            </div>
            <div className="rounded-xl border bg-blue-50/70 border-blue-100 p-3 text-xs text-blue-800 flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Impacto inmediato sobre el flujo financiero institucional.
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-[460px] z-30">
        <div className="rounded-2xl border border-slate-200 bg-white/95 backdrop-blur shadow-2xl p-3 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Estado de edición</p>
            <p className="text-sm font-semibold text-slate-900 truncate">
              {totalCambiosPendientes > 0 ? `${totalCambiosPendientes} cambios listos para guardar` : 'No hay cambios pendientes'}
            </p>
          </div>
          <Button onClick={guardarTodo} disabled={saving || loading} className="bg-rose-700 hover:bg-rose-800 text-white whitespace-nowrap">
            {saving ? <Gauge className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </Button>
        </div>
      </div>

      <div className="rounded-2xl border border-rose-100 bg-gradient-to-r from-rose-50 to-amber-50 px-4 py-3 text-xs text-slate-700 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-rose-700" />
        Recomendación: guarda por lotes pequeños para auditar mejor el impacto de cada cambio.
      </div>
    </div>
  );
}
