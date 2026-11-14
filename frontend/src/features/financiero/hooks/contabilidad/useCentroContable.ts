import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CentroCosto, CuentaContable, Departamento } from '../../models/core.models';
import { centrosCostoService, cuentasContablesService, departamentosService } from '../../services';
import {
  initialCentroForm,
  initialCuentaForm,
  normalizeText,
  resolveList,
  type CentroCostoForm,
  type CuentaContableForm,
  type TabKey,
} from './centroContableUtils';
import { useActualizacionEnVivo } from '../../../../hooks/useActualizacionEnVivo';

/** Estado y acciones del Centro Contable: cuentas contables y centros de costo. */
export function useCentroContable() {
  const [activeTab, setActiveTab] = useState<TabKey>('cuentas');
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [centros, setCentros] = useState<CentroCosto[]>([]);
  const [departamentos, setDepartamentos] = useState<Departamento[]>([]);
  const [loadingCuentas, setLoadingCuentas] = useState(true);
  const [loadingCentros, setLoadingCentros] = useState(true);
  const [loadingDepartamentos, setLoadingDepartamentos] = useState(true);
  const [cuentaSearch, setCuentaSearch] = useState('');
  const [cuentaTipoFilter, setCuentaTipoFilter] = useState('all');
  const [cuentaEstadoFilter, setCuentaEstadoFilter] = useState('all');
  const [cuentaNivelFilter, setCuentaNivelFilter] = useState('all');
  const [centroSearch, setCentroSearch] = useState('');
  const [centroTipoFilter, setCentroTipoFilter] = useState('all');
  const [centroEstadoFilter, setCentroEstadoFilter] = useState('all');
  const [cuentaDialogOpen, setCuentaDialogOpen] = useState(false);
  const [centroDialogOpen, setCentroDialogOpen] = useState(false);
  const [cuentaForm, setCuentaForm] = useState<CuentaContableForm>(initialCuentaForm);
  const [centroForm, setCentroForm] = useState<CentroCostoForm>(initialCentroForm);
  const [savingCuenta, setSavingCuenta] = useState(false);
  const [savingCentro, setSavingCentro] = useState(false);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const departamentosById = useMemo(
    () => new Map(departamentos.map((departamento) => [departamento.id, departamento])),
    [departamentos],
  );

  const resolveDepartamentoId = useCallback((centro: CentroCosto) => {
    if (typeof centro.departamento === 'number') return centro.departamento;
    return centro.departamento?.id ?? centro.departamento_id ?? null;
  }, []);

  const resolveDepartamentoNombre = useCallback((centro: CentroCosto) => {
    const departamentoValue = centro.departamento as unknown;
    if (typeof departamentoValue === 'string') return departamentoValue;
    if (departamentoValue && typeof departamentoValue === 'object' && 'nombre' in departamentoValue) {
      return String((departamentoValue as { nombre?: string }).nombre || '');
    }
    const departamentoId = resolveDepartamentoId(centro);
    return departamentoId ? departamentosById.get(departamentoId)?.nombre : undefined;
  }, [departamentosById, resolveDepartamentoId]);

  const fetchCuentas = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoadingCuentas(true);
    try {
      const response = await cuentasContablesService.getAll({ page_size: 200 });
      setCuentas(resolveList<CuentaContable>(response as { results?: CuentaContable[] } | CuentaContable[]));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las cuentas contables.');
    } finally {
      setLoadingCuentas(false);
    }
  };

  const fetchCentros = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoadingCentros(true);
    try {
      const response = await centrosCostoService.getAll({ page_size: 200 });
      setCentros(resolveList<CentroCosto>(response as { results?: CentroCosto[] } | CentroCosto[]));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los centros de costo.');
    } finally {
      setLoadingCentros(false);
    }
  };

  const fetchDepartamentos = async ({ silent = false }: { silent?: boolean } = {}) => {
    if (!silent) setLoadingDepartamentos(true);
    try {
      const response = await departamentosService.getAll({ page_size: 200 });
      setDepartamentos(resolveList<Departamento>(response as { results?: Departamento[] } | Departamento[]));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los departamentos.');
    } finally {
      setLoadingDepartamentos(false);
    }
  };

  useEffect(() => {
    void fetchCuentas();
    void fetchCentros();
    void fetchDepartamentos();
  }, []);

  // Alguien más cambió cuentas, centros de costo o departamentos: se vuelven a leer sin spinner.
  useActualizacionEnVivo(['catalogos-financieros'], () => {
    void fetchCuentas({ silent: true });
    void fetchCentros({ silent: true });
    void fetchDepartamentos({ silent: true });
  });

  useEffect(() => {
    if (activeTab === 'centros' && centros.length === 0 && !loadingCentros) {
      void fetchCentros();
    }
  }, [activeTab, centros.length, loadingCentros]);

  const cuentasFiltradas = useMemo(() => {
    const query = normalizeText(cuentaSearch);
    return cuentas.filter((cuenta) => {
      if (cuentaTipoFilter !== 'all' && cuenta.tipo_cuenta !== cuentaTipoFilter) return false;
      if (cuentaEstadoFilter !== 'all' && cuenta.estado !== cuentaEstadoFilter) return false;
      if (cuentaNivelFilter !== 'all' && String(cuenta.nivel) !== cuentaNivelFilter) return false;
      if (!query) return true;
      return [cuenta.codigo, cuenta.nombre, cuenta.tipo_cuenta, cuenta.naturaleza]
        .filter(Boolean)
        .some((value) => normalizeText(String(value)).includes(query));
    });
  }, [cuentas, cuentaSearch, cuentaTipoFilter, cuentaEstadoFilter, cuentaNivelFilter]);

  const centrosFiltrados = useMemo(() => {
    const query = normalizeText(centroSearch);
    return centros.filter((centro) => {
      if (centroTipoFilter !== 'all' && centro.tipo !== centroTipoFilter) return false;
      if (centroEstadoFilter !== 'all' && centro.estado !== centroEstadoFilter) return false;
      if (!query) return true;
      return [centro.codigo, centro.nombre, centro.tipo, resolveDepartamentoNombre(centro)]
        .filter(Boolean)
        .some((value) => normalizeText(String(value)).includes(query));
    });
  }, [centros, centroSearch, centroTipoFilter, centroEstadoFilter, resolveDepartamentoNombre]);

  const openNuevaCuenta = () => {
    setCuentaForm(initialCuentaForm);
    setCuentaDialogOpen(true);
  };

  const openEditarCuenta = (cuenta: CuentaContable) => {
    setCuentaForm({
      id: cuenta.id,
      codigo: cuenta.codigo,
      nombre: cuenta.nombre,
      tipo_cuenta: cuenta.tipo_cuenta,
      nivel: cuenta.nivel,
      cuenta_padre: cuenta.cuenta_padre || '',
      naturaleza: cuenta.naturaleza,
      acepta_movimiento: cuenta.acepta_movimiento ?? true,
      requiere_tercero: cuenta.requiere_tercero ?? true,
      requiere_centro_costo: cuenta.requiere_centro_costo ?? true,
      descripcion: cuenta.descripcion || '',
      estado: cuenta.estado ?? 'Activo',
    });
    setCuentaDialogOpen(true);
  };

  const guardarCuenta = async () => {
    if (!cuentaForm.codigo.trim() || !cuentaForm.nombre.trim()) {
      toast.error('Completa código y nombre para la cuenta contable.');
      return;
    }

    setSavingCuenta(true);
    try {
      const payload = {
        codigo: cuentaForm.codigo.trim(),
        nombre: cuentaForm.nombre.trim(),
        tipo_cuenta: cuentaForm.tipo_cuenta,
        nivel: cuentaForm.nivel,
        cuenta_padre: cuentaForm.cuenta_padre?.trim() || null,
        naturaleza: cuentaForm.naturaleza,
        acepta_movimiento: cuentaForm.acepta_movimiento,
        requiere_tercero: cuentaForm.requiere_tercero,
        requiere_centro_costo: cuentaForm.requiere_centro_costo,
        descripcion: cuentaForm.descripcion?.trim() || null,
        estado: cuentaForm.estado,
      };

      if (cuentaForm.id) {
        await cuentasContablesService.update(cuentaForm.id, payload);
        toast.success('Cuenta contable actualizada.');
      } else {
        await cuentasContablesService.create(payload);
        toast.success('Cuenta contable creada correctamente.');
      }

      setCuentaDialogOpen(false);
      await fetchCuentas();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No fue posible guardar la cuenta contable.');
    } finally {
      setSavingCuenta(false);
    }
  };

  const eliminarCuenta = async (cuenta: CuentaContable) => {
    if (!cuenta.id) return;
    const confirmar = window.confirm(`¿Eliminar la cuenta ${cuenta.codigo} - ${cuenta.nombre}?`);
    if (!confirmar) return;

    setProcessingId(cuenta.id);
    try {
      await cuentasContablesService.delete(cuenta.id);
      toast.success('Cuenta contable eliminada.');
      await fetchCuentas();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No fue posible eliminar la cuenta contable.');
    } finally {
      setProcessingId(null);
    }
  };

  const openNuevoCentro = () => {
    setCentroForm(initialCentroForm);
    setCentroDialogOpen(true);
  };

  const openEditarCentro = (centro: CentroCosto) => {
    setCentroForm({
      id: centro.id,
      codigo: centro.codigo,
      nombre: centro.nombre,
      tipo: centro.tipo,
      departamento_id: resolveDepartamentoId(centro),
      presupuesto_asignado: centro.presupuesto_asignado ?? '',
      estado: centro.estado ?? 'Activo',
    });
    setCentroDialogOpen(true);
  };

  const guardarCentro = async () => {
    if (!centroForm.codigo.trim() || !centroForm.nombre.trim()) {
      toast.error('Completa código y nombre para el centro de costo.');
      return;
    }

    setSavingCentro(true);
    try {
      const presupuestoValue = centroForm.presupuesto_asignado === '' ? null : Number(centroForm.presupuesto_asignado);
      const payload = {
        codigo: centroForm.codigo.trim(),
        nombre: centroForm.nombre.trim(),
        tipo: centroForm.tipo,
        departamento: centroForm.departamento_id || null,
        presupuesto_asignado: Number.isNaN(presupuestoValue) ? null : presupuestoValue,
        estado: centroForm.estado,
      };

      if (centroForm.id) {
        await centrosCostoService.update(centroForm.id, payload);
        toast.success('Centro de costo actualizado.');
      } else {
        await centrosCostoService.create(payload);
        toast.success('Centro de costo creado correctamente.');
      }

      setCentroDialogOpen(false);
      await fetchCentros();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No fue posible guardar el centro de costo.');
    } finally {
      setSavingCentro(false);
    }
  };

  const eliminarCentro = async (centro: CentroCosto) => {
    if (!centro.id) return;
    const confirmar = window.confirm(`¿Eliminar el centro ${centro.codigo} - ${centro.nombre}?`);
    if (!confirmar) return;

    setProcessingId(centro.id);
    try {
      await centrosCostoService.delete(centro.id);
      toast.success('Centro de costo eliminado.');
      await fetchCentros();
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No fue posible eliminar el centro de costo.');
    } finally {
      setProcessingId(null);
    }
  };

  return {
    activeTab,
    setActiveTab,
    departamentos,
    loadingDepartamentos,
    loadingCuentas,
    loadingCentros,
    processingId,
    fetchCuentas,
    fetchCentros,
    cuentaSearch,
    setCuentaSearch,
    cuentaTipoFilter,
    setCuentaTipoFilter,
    cuentaEstadoFilter,
    setCuentaEstadoFilter,
    cuentaNivelFilter,
    setCuentaNivelFilter,
    cuentasFiltradas,
    openNuevaCuenta,
    openEditarCuenta,
    eliminarCuenta,
    cuentaDialogOpen,
    setCuentaDialogOpen,
    cuentaForm,
    setCuentaForm,
    guardarCuenta,
    savingCuenta,
    centroSearch,
    setCentroSearch,
    centroTipoFilter,
    setCentroTipoFilter,
    centroEstadoFilter,
    setCentroEstadoFilter,
    centrosFiltrados,
    resolveDepartamentoNombre,
    openNuevoCentro,
    openEditarCentro,
    eliminarCentro,
    centroDialogOpen,
    setCentroDialogOpen,
    centroForm,
    setCentroForm,
    guardarCentro,
    savingCentro,
  };
}
