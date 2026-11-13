import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../../../components/ui/card';
import { Badge } from '../../../../../components/ui/badge';
import { Input } from '../../../../../components/ui/input';
import { Label } from '../../../../../components/ui/label';
import { Checkbox } from '../../../../../components/ui/checkbox';
import { Switch } from '../../../../../components/ui/switch';
import { Textarea } from '../../../../../components/ui/textarea';
import type { ParametroFinanciero } from '../../../services';
import { ShieldCheck, BellRing, Building2 } from 'lucide-react';
import { CATEGORY_META, AREAS_SOLICITANTES_DEFAULT, shouldHideAsMirror, isFieldBlocked, parseListText, getFriendlyLabel, asBoolean, toApiValue } from '../../../hooks/admin_financiero/configuracionFinancieraUtils';
import type { useConfiguracionFinanciera } from '../../../hooks/admin_financiero/useConfiguracionFinanciera';

type Gestion = ReturnType<typeof useConfiguracionFinanciera>;

/** Parámetros editables por categoría. */
export function ParametrosPorCategoria({ valoresOriginales, loading, visibleEditable, grouped, updateLocalValue }: Pick<Gestion, 'valoresOriginales' | 'loading' | 'visibleEditable' | 'grouped' | 'updateLocalValue'>) {
  return (
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
  );
}
