import { useEffect, useMemo, useState } from 'react';
import { parametrosFinancieroService, type ParametroFinanciero } from '../../services';
import { toast } from 'sonner';
import { CATEGORY_META, getDuplicateGroup, getPreferredKey, isFieldBlocked, toDisplayValue, toApiValue, getValidationError } from './configuracionFinancieraUtils';

/** Estado y acciones de los parámetros financieros. */
export function useConfiguracionFinanciera() {
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


  return {
    params,
    setParams,
    valoresOriginales,
    setValoresOriginales,
    loading,
    setLoading,
    saving,
    setSaving,
    search,
    setSearch,
    categoriaActiva,
    setCategoriaActiva,
    editable,
    visibleEditable,
    grouped,
    categoriasConConteo,
    totalCambiosPendientes,
    updateLocalValue,
    guardarTodo,
  };
}
