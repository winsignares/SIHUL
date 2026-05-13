import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../share/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { Switch } from '../../../share/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../share/tabs';
import { toast } from 'sonner';
import { Building2, Landmark, Pencil, Plus, RefreshCw, Search, Trash2 } from 'lucide-react';
import type { CentroCosto, CuentaContable, Departamento } from '../../../models/financiero/core.models';
import { centrosCostoService, cuentasContablesService, departamentosService } from '../../../services/financiero';

type TabKey = 'cuentas' | 'centros';

type CuentaContableForm = {
  id?: number;
  codigo: string;
  nombre: string;
  tipo_cuenta: CuentaContable['tipo_cuenta'];
  nivel: number;
  cuenta_padre?: string;
  naturaleza: CuentaContable['naturaleza'];
  acepta_movimiento: boolean;
  requiere_tercero: boolean;
  requiere_centro_costo: boolean;
  descripcion?: string;
  estado: CuentaContable['estado'];
};

type CentroCostoForm = {
  id?: number;
  codigo: string;
  nombre: string;
  tipo: CentroCosto['tipo'];
  departamento_id?: number | null;
  presupuesto_asignado?: number | string;
  estado: CentroCosto['estado'];
};

const CUENTA_TIPOS: CuentaContable['tipo_cuenta'][] = ['Activo', 'Pasivo', 'Patrimonio', 'Ingreso', 'Gasto', 'Costo'];
const CUENTA_NATURALEZAS: CuentaContable['naturaleza'][] = ['Débito', 'Crédito'];
const CUENTA_ESTADOS: CuentaContable['estado'][] = ['Activo', 'Inactivo'];
const CENTRO_TIPOS: CentroCosto['tipo'][] = ['Administrativo', 'Académico', 'Operativo', 'Investigación', 'Extensión'];
const CENTRO_ESTADOS: CentroCosto['estado'][] = ['Activo', 'Inactivo'];
const NIVELES = [1, 2, 3, 4] as const;
const NIVEL_LABEL: Record<number, string> = {
  1: 'Clase',
  2: 'Grupo',
  3: 'Cuenta',
  4: 'Subcuenta',
};

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const formatCurrency = (value?: number | string | null) => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(numeric);
};

const initialCuentaForm: CuentaContableForm = {
  codigo: '',
  nombre: '',
  tipo_cuenta: 'Activo',
  nivel: 1,
  cuenta_padre: '',
  naturaleza: 'Débito',
  acepta_movimiento: true,
  requiere_tercero: true,
  requiere_centro_costo: true,
  descripcion: '',
  estado: 'Activo',
};

const initialCentroForm: CentroCostoForm = {
  codigo: '',
  nombre: '',
  tipo: 'Administrativo',
  departamento_id: null,
  presupuesto_asignado: '',
  estado: 'Activo',
};

const resolveList = <T,>(
  response:
    | { results?: T[]; data?: T[] | { results?: T[]; items?: T[]; data?: T[]; centros?: T[]; cuentas?: T[] }; items?: T[]; centros?: T[]; cuentas?: T[] }
    | T[]
): T[] => {
  if (Array.isArray(response)) return response;
  const nested = response.data && !Array.isArray(response.data) ? response.data : undefined;
  return (
    response.results ||
    (Array.isArray(response.data) ? response.data : undefined) ||
    response.items ||
    response.centros ||
    response.cuentas ||
    nested?.results ||
    nested?.items ||
    nested?.data ||
    nested?.centros ||
    nested?.cuentas ||
    []
  );
};

export default function CentroContable() {
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

  const resolveDepartamentoId = (centro: CentroCosto) => {
    if (typeof centro.departamento === 'number') return centro.departamento;
    return centro.departamento?.id ?? centro.departamento_id ?? null;
  };

  const resolveDepartamentoNombre = (centro: CentroCosto) => {
    const departamentoValue = centro.departamento as unknown;
    if (typeof departamentoValue === 'string') return departamentoValue;
    if (departamentoValue && typeof departamentoValue === 'object' && 'nombre' in departamentoValue) {
      return String((departamentoValue as { nombre?: string }).nombre || '');
    }
    const departamentoId = resolveDepartamentoId(centro);
    return departamentoId ? departamentosById.get(departamentoId)?.nombre : undefined;
  };

  const fetchCuentas = async () => {
    setLoadingCuentas(true);
    try {
      const response = await cuentasContablesService.getAll({ page_size: 200 });
      setCuentas(resolveList<CuentaContable>(response as { results?: CuentaContable[] } | CuentaContable[]));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar las cuentas contables.');
    } finally {
      setLoadingCuentas(false);
    }
  };

  const fetchCentros = async () => {
    setLoadingCentros(true);
    try {
      const response = await centrosCostoService.getAll({ page_size: 200 });
      setCentros(resolveList<CentroCosto>(response as { results?: CentroCosto[] } | CentroCosto[]));
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'No se pudieron cargar los centros de costo.');
    } finally {
      setLoadingCentros(false);
    }
  };

  const fetchDepartamentos = async () => {
    setLoadingDepartamentos(true);
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
  }, [centros, centroSearch, centroTipoFilter, centroEstadoFilter, departamentosById]);

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

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-red-700 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Landmark className="w-8 h-8 text-amber-300" />
              Centro Contable & Costos
            </h1>
            <p className="text-red-100 text-sm">
              Portal maestro para administrar cuentas contables y centros de costo con trazabilidad completa.
            </p>
          </div>
          <Button onClick={() => { void fetchCuentas(); void fetchCentros(); }} className="bg-white/15 border border-white/30 hover:bg-white/25 text-white">
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </motion.div>

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabKey)}>
        <Card className="border-0 shadow-lg">
          <CardHeader className="space-y-3">
            <CardTitle className="text-slate-900">Gestión contable centralizada</CardTitle>
            <TabsList className="grid w-full max-w-3xl grid-cols-2">
              <TabsTrigger value="cuentas" className="gap-2">
                <Landmark className="w-4 h-4" />
                Cuentas contables
              </TabsTrigger>
              <TabsTrigger value="centros" className="gap-2">
                <Building2 className="w-4 h-4" />
                Centros de costo
              </TabsTrigger>
            </TabsList>
          </CardHeader>
          <CardContent>
            <TabsContent value="cuentas" className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">Cuentas contables registradas</p>
                      <Button onClick={openNuevaCuenta} className="bg-yellow-400 hover:bg-yellow-500 text-red-900">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva cuenta
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                      <div className="relative lg:col-span-5">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={cuentaSearch}
                          onChange={(event) => setCuentaSearch(event.target.value)}
                          className="pl-9"
                          placeholder="Buscar por código, nombre, tipo o naturaleza"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <Select value={cuentaTipoFilter} onValueChange={setCuentaTipoFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            {CUENTA_TIPOS.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="lg:col-span-2">
                        <Select value={cuentaNivelFilter} onValueChange={setCuentaNivelFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Nivel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los niveles</SelectItem>
                            {NIVELES.map((nivel) => (
                              <SelectItem key={nivel} value={String(nivel)}>{NIVEL_LABEL[nivel]}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="lg:col-span-2">
                        <Select value={cuentaEstadoFilter} onValueChange={setCuentaEstadoFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {CUENTA_ESTADOS.map((estado) => (
                              <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="lg:col-span-1">
                        <Button variant="outline" className="w-full" onClick={() => {
                          setCuentaSearch('');
                          setCuentaTipoFilter('all');
                          setCuentaNivelFilter('all');
                          setCuentaEstadoFilter('all');
                        }}>
                          Limpiar
                        </Button>
                      </div>
                    </div>

                    {loadingCuentas ? (
                      <p className="text-sm text-slate-500">Cargando cuentas contables...</p>
                    ) : (
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead>Código</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Nivel</TableHead>
                              <TableHead>Naturaleza</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {cuentasFiltradas.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-slate-500 py-7">
                                  No hay cuentas contables registradas.
                                </TableCell>
                              </TableRow>
                            ) : (
                              cuentasFiltradas.map((cuenta) => (
                                <TableRow key={cuenta.id}>
                                  <TableCell className="font-semibold text-slate-800">{cuenta.codigo}</TableCell>
                                  <TableCell>{cuenta.nombre}</TableCell>
                                  <TableCell>{cuenta.tipo_cuenta}</TableCell>
                                  <TableCell>{NIVEL_LABEL[cuenta.nivel] ?? cuenta.nivel}</TableCell>
                                  <TableCell>{cuenta.naturaleza}</TableCell>
                                  <TableCell>
                                    <Badge className={cuenta.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                                      {cuenta.estado}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="outline" onClick={() => openEditarCuenta(cuenta)}>
                                        <Pencil className="w-3 h-3" />
                                        Editar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={processingId === cuenta.id}
                                        onClick={() => void eliminarCuenta(cuenta)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Eliminar
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
              </motion.div>
            </TabsContent>

            <TabsContent value="centros" className="space-y-5">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-700">Centros de costo registrados</p>
                      <Button onClick={openNuevoCentro} className="bg-amber-500 hover:bg-amber-600 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nuevo centro
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
                      <div className="relative lg:col-span-6">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                        <Input
                          value={centroSearch}
                          onChange={(event) => setCentroSearch(event.target.value)}
                          className="pl-9"
                          placeholder="Buscar por código, nombre, tipo o departamento"
                        />
                      </div>
                      <div className="lg:col-span-2">
                        <Select value={centroTipoFilter} onValueChange={setCentroTipoFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Tipo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los tipos</SelectItem>
                            {CENTRO_TIPOS.map((tipo) => (
                              <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="lg:col-span-2">
                        <Select value={centroEstadoFilter} onValueChange={setCentroEstadoFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos los estados</SelectItem>
                            {CENTRO_ESTADOS.map((estado) => (
                              <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="lg:col-span-2">
                        <Button variant="outline" className="w-full" onClick={() => {
                          setCentroSearch('');
                          setCentroTipoFilter('all');
                          setCentroEstadoFilter('all');
                        }}>
                          Limpiar
                        </Button>
                      </div>
                    </div>

                    {loadingCentros ? (
                      <p className="text-sm text-slate-500">Cargando centros de costo...</p>
                    ) : (
                      <div className="rounded-xl border overflow-hidden">
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-slate-50">
                              <TableHead>Código</TableHead>
                              <TableHead>Nombre</TableHead>
                              <TableHead>Tipo</TableHead>
                              <TableHead>Departamento</TableHead>
                              <TableHead>Presupuesto</TableHead>
                              <TableHead>Estado</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {centrosFiltrados.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={7} className="text-center text-slate-500 py-7">
                                  No hay centros de costo registrados.
                                </TableCell>
                              </TableRow>
                            ) : (
                              centrosFiltrados.map((centro) => (
                                <TableRow key={centro.id}>
                                  <TableCell className="font-semibold text-slate-800">{centro.codigo}</TableCell>
                                  <TableCell>{centro.nombre}</TableCell>
                                  <TableCell>{centro.tipo}</TableCell>
                                  <TableCell>{resolveDepartamentoNombre(centro) || 'Sin departamento'}</TableCell>
                                  <TableCell>{formatCurrency(centro.presupuesto_asignado)}</TableCell>
                                  <TableCell>
                                    <Badge className={centro.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                                      {centro.estado}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex justify-end gap-2">
                                      <Button size="sm" variant="outline" onClick={() => openEditarCentro(centro)}>
                                        <Pencil className="w-3 h-3" />
                                        Editar
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="destructive"
                                        disabled={processingId === centro.id}
                                        onClick={() => void eliminarCentro(centro)}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                        Eliminar
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
              </motion.div>
            </TabsContent>
          </CardContent>
        </Card>
      </Tabs>

      <Dialog open={cuentaDialogOpen} onOpenChange={setCuentaDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{cuentaForm.id ? 'Editar cuenta contable' : 'Nueva cuenta contable'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Código</Label>
              <Input value={cuentaForm.codigo} onChange={(event) => setCuentaForm((prev) => ({ ...prev, codigo: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={cuentaForm.nombre} onChange={(event) => setCuentaForm((prev) => ({ ...prev, nombre: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tipo de cuenta</Label>
              <Select value={cuentaForm.tipo_cuenta} onValueChange={(value) => setCuentaForm((prev) => ({ ...prev, tipo_cuenta: value as CuentaContable['tipo_cuenta'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CUENTA_TIPOS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nivel</Label>
              <Select value={String(cuentaForm.nivel)} onValueChange={(value) => setCuentaForm((prev) => ({ ...prev, nivel: Number(value) }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Nivel" />
                </SelectTrigger>
                <SelectContent>
                  {NIVELES.map((nivel) => (
                    <SelectItem key={nivel} value={String(nivel)}>{NIVEL_LABEL[nivel]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Naturaleza</Label>
              <Select value={cuentaForm.naturaleza} onValueChange={(value) => setCuentaForm((prev) => ({ ...prev, naturaleza: value as CuentaContable['naturaleza'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Naturaleza" />
                </SelectTrigger>
                <SelectContent>
                  {CUENTA_NATURALEZAS.map((item) => (
                    <SelectItem key={item} value={item}>{item}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Cuenta padre</Label>
              <Input value={cuentaForm.cuenta_padre || ''} onChange={(event) => setCuentaForm((prev) => ({ ...prev, cuenta_padre: event.target.value }))} placeholder="Opcional" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Descripción</Label>
              <Input value={cuentaForm.descripcion || ''} onChange={(event) => setCuentaForm((prev) => ({ ...prev, descripcion: event.target.value }))} placeholder="Detalle breve (opcional)" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Controles operativos</Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <span className="text-sm text-slate-700">Acepta movimiento</span>
                  <Switch checked={cuentaForm.acepta_movimiento} onCheckedChange={(checked) => setCuentaForm((prev) => ({ ...prev, acepta_movimiento: checked }))} />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <span className="text-sm text-slate-700">Requiere tercero</span>
                  <Switch checked={cuentaForm.requiere_tercero} onCheckedChange={(checked) => setCuentaForm((prev) => ({ ...prev, requiere_tercero: checked }))} />
                </div>
                <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                  <span className="text-sm text-slate-700">Centro de costo</span>
                  <Switch checked={cuentaForm.requiere_centro_costo} onCheckedChange={(checked) => setCuentaForm((prev) => ({ ...prev, requiere_centro_costo: checked }))} />
                </div>
              </div>
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Estado</Label>
              <Select value={cuentaForm.estado} onValueChange={(value) => setCuentaForm((prev) => ({ ...prev, estado: value as CuentaContable['estado'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {CUENTA_ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCuentaDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void guardarCuenta()} disabled={savingCuenta} className="bg-red-700 hover:bg-red-800 text-white">
              {savingCuenta ? 'Guardando...' : cuentaForm.id ? 'Actualizar cuenta' : 'Crear cuenta'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={centroDialogOpen} onOpenChange={setCentroDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{centroForm.id ? 'Editar centro de costo' : 'Nuevo centro de costo'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Código</Label>
              <Input value={centroForm.codigo} onChange={(event) => setCentroForm((prev) => ({ ...prev, codigo: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={centroForm.nombre} onChange={(event) => setCentroForm((prev) => ({ ...prev, nombre: event.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Tipo</Label>
              <Select value={centroForm.tipo} onValueChange={(value) => setCentroForm((prev) => ({ ...prev, tipo: value as CentroCosto['tipo'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  {CENTRO_TIPOS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Departamento</Label>
              <Select
                value={centroForm.departamento_id ? String(centroForm.departamento_id) : 'none'}
                onValueChange={(value) => setCentroForm((prev) => ({ ...prev, departamento_id: value === 'none' ? null : Number(value) }))}
                disabled={loadingDepartamentos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin departamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin departamento</SelectItem>
                  {departamentos.map((departamento) => (
                    <SelectItem key={departamento.id} value={String(departamento.id)}>{departamento.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Presupuesto asignado</Label>
              <Input
                type="number"
                inputMode="decimal"
                value={centroForm.presupuesto_asignado ?? ''}
                onChange={(event) => setCentroForm((prev) => ({ ...prev, presupuesto_asignado: event.target.value }))}
                placeholder="0"
              />
            </div>
            <div className="space-y-1">
              <Label>Estado</Label>
              <Select value={centroForm.estado} onValueChange={(value) => setCentroForm((prev) => ({ ...prev, estado: value as CentroCosto['estado'] }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  {CENTRO_ESTADOS.map((estado) => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCentroDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void guardarCentro()} disabled={savingCentro} className="bg-red-700 hover:bg-red-800 text-white">
              {savingCentro ? 'Guardando...' : centroForm.id ? 'Actualizar centro' : 'Crear centro'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
