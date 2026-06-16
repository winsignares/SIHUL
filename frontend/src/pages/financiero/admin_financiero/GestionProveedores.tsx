import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../share/card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Building2, PauseCircle, PlayCircle, Plus, Save, Search, ShieldCheck, Trash2, UserRound } from 'lucide-react';
import { toast } from 'sonner';
import { catalogosProveedoresService, proveedoresService } from '../../../services/financiero';
import { userService, type Usuario } from '../../../services/users/authService';
import type {
  BancoCatalogo,
  CiudadCatalogo,
  DepartamentoGeograficoCatalogo,
  PaisCatalogo,
  Proveedor,
  TipoCuentaCatalogo,
} from '../../../models/financiero/core.models';

type ProveedorUI = Proveedor & { usuario?: number | null };

type ProveedorFormState = {
  usuario?: number | null;
  nombreUsuario: string;
  correoUsuario: string;
  nuevaContrasena: string;
  nit: string;
  razon_social: string;
  nombre_comercial: string;
  tipo_proveedor: Proveedor['tipo_proveedor'];
  tipo_persona: NonNullable<Proveedor['tipo_persona']>;
  direccion: string;
  pais_id: string;
  departamento_geo_id: string;
  ciudad_id: string;
  telefono: string;
  email: string;
  contacto_principal: string;
  telefono_contacto: string;
  banco_id: string;
  tipo_cuenta_id: string;
  numero_cuenta: string;
  regimen_tributario: string;
  observaciones: string;
  estado: Proveedor['estado'];
};

const TIPO_PROVEEDOR_OPTIONS: Proveedor['tipo_proveedor'][] = ['Servicios', 'Bienes', 'Construcción', 'Mixto'];
const TIPO_PERSONA_OPTIONS: NonNullable<Proveedor['tipo_persona']>[] = ['Jurídica', 'Natural'];
const REGIMEN_OPTIONS = ['Responsable IVA', 'No responsable', 'Gran Contribuyente'] as const;
const ESTADO_OPTIONS: Proveedor['estado'][] = ['Activo', 'Inactivo', 'Bloqueado', 'Verificación'];

const emptyForm: ProveedorFormState = {
  usuario: null,
  nombreUsuario: '',
  correoUsuario: '',
  nuevaContrasena: '',
  nit: '',
  razon_social: '',
  nombre_comercial: '',
  tipo_proveedor: 'Servicios',
  tipo_persona: 'Jurídica',
  direccion: '',
  pais_id: '',
  departamento_geo_id: '',
  ciudad_id: '',
  telefono: '',
  email: '',
  contacto_principal: '',
  telefono_contacto: '',
  banco_id: '',
  tipo_cuenta_id: '',
  numero_cuenta: '',
  regimen_tributario: '',
  observaciones: '',
  estado: 'Activo',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const normalizeText = (value?: string) =>
  (value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

const toArray = <T,>(value: T[] | { results?: T[] } | unknown): T[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === 'object' && Array.isArray((value as { results?: T[] }).results)) {
    return (value as { results: T[] }).results;
  }
  return [];
};

export default function GestionProveedoresReal() {
  const [proveedores, setProveedores] = useState<ProveedorUI[]>([]);
  const [usuariosProveedor, setUsuariosProveedor] = useState<Usuario[]>([]);
  const [paises, setPaises] = useState<PaisCatalogo[]>([]);
  const [departamentosGeo, setDepartamentosGeo] = useState<DepartamentoGeograficoCatalogo[]>([]);
  const [ciudades, setCiudades] = useState<CiudadCatalogo[]>([]);
  const [bancos, setBancos] = useState<BancoCatalogo[]>([]);
  const [tiposCuenta, setTiposCuenta] = useState<TipoCuentaCatalogo[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accionProveedorId, setAccionProveedorId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [ciudadFilter, setCiudadFilter] = useState('all');
  const [form, setForm] = useState<ProveedorFormState>(emptyForm);

  const usuariosById = useMemo(
    () => Object.fromEntries(usuariosProveedor.filter((u) => u.id).map((u) => [u.id as number, u])),
    [usuariosProveedor]
  );

  const paisesById = useMemo(() => Object.fromEntries(paises.map((item) => [item.id, item])), [paises]);
  const departamentosById = useMemo(() => Object.fromEntries(departamentosGeo.map((item) => [item.id, item])), [departamentosGeo]);
  const ciudadesById = useMemo(() => Object.fromEntries(ciudades.map((item) => [item.id, item])), [ciudades]);
  const bancosById = useMemo(() => Object.fromEntries(bancos.map((item) => [item.id, item])), [bancos]);
  const tiposCuentaById = useMemo(() => Object.fromEntries(tiposCuenta.map((item) => [item.id, item])), [tiposCuenta]);

  const findPaisIdByName = useCallback((nombre?: string) => {
    const match = paises.find((item) => normalizeText(item.nombre) === normalizeText(nombre));
    return match ? String(match.id) : '';
  }, [paises]);

  const findDepartamentoIdByName = useCallback((nombre?: string, paisId?: string) => {
    const match = departamentosGeo.find((item) =>
      normalizeText(item.nombre) === normalizeText(nombre) &&
      (!paisId || String(item.pais_id) === paisId)
    );
    return match ? String(match.id) : '';
  }, [departamentosGeo]);

  const findCiudadIdByName = useCallback((nombre?: string, departamentoId?: string) => {
    const match = ciudades.find((item) =>
      normalizeText(item.nombre) === normalizeText(nombre) &&
      (!departamentoId || String(item.departamento_id) === departamentoId)
    );
    return match ? String(match.id) : '';
  }, [ciudades]);

  const findBancoIdByName = useCallback((nombre?: string) => {
    const match = bancos.find((item) => normalizeText(item.nombre) === normalizeText(nombre));
    return match ? String(match.id) : '';
  }, [bancos]);

  const findTipoCuentaIdByName = useCallback((nombre?: string) => {
    const match = tiposCuenta.find((item) => normalizeText(item.nombre) === normalizeText(nombre));
    return match ? String(match.id) : '';
  }, [tiposCuenta]);

  const cargarCatalogos = useCallback(async () => {
    const [paisesResp, departamentosResp, ciudadesResp, bancosResp, tiposCuentaResp] = await Promise.all([
      catalogosProveedoresService.getPaises(),
      catalogosProveedoresService.getDepartamentos(),
      catalogosProveedoresService.getCiudades(),
      catalogosProveedoresService.getBancos(),
      catalogosProveedoresService.getTiposCuenta(),
    ]);

    setPaises(paisesResp);
    setDepartamentosGeo(departamentosResp);
    setCiudades(ciudadesResp);
    setBancos(bancosResp);
    setTiposCuenta(tiposCuentaResp);
  }, []);

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const [proveedoresResp, usuariosResp] = await Promise.all([
        proveedoresService.getAll({ limit: 500, ordering: '-id' }),
        userService.listarUsuarios(),
      ]);

      setProveedores(toArray<ProveedorUI>(proveedoresResp));
      setUsuariosProveedor((usuariosResp.usuarios || []).filter((usuario) => normalizeText(usuario.rol?.nombre) === 'proveedor'));
      await cargarCatalogos();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No se pudieron cargar los proveedores.'));
    } finally {
      setLoading(false);
    }
  }, [cargarCatalogos]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const ciudadesDisponiblesFiltro = useMemo(
    () => Array.from(new Set(proveedores.map((p) => (p.ciudad || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [proveedores]
  );

  const filtered = useMemo(() => {
    const query = normalizeText(search);
    const base = proveedores.filter((p) => {
      if (estadoFilter !== 'all' && p.estado !== estadoFilter) return false;
      if (tipoFilter !== 'all' && p.tipo_proveedor !== tipoFilter) return false;
      if (ciudadFilter !== 'all' && (p.ciudad || '').trim() !== ciudadFilter) return false;
      if (!query) return true;
      return [p.nit, p.razon_social, p.email || '', p.ciudad || '', p.tipo_proveedor].some((value) => normalizeText(value).includes(query));
    });

    return [...base].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [proveedores, search, estadoFilter, tipoFilter, ciudadFilter]);

  const departamentosDisponibles = useMemo(() => {
    if (form.ciudad_id) {
      const ciudad = ciudadesById[Number(form.ciudad_id)];
      if (ciudad) {
        const departamento = departamentosById[ciudad.departamento_id];
        return departamento ? [departamento] : [];
      }
    }

    return departamentosGeo.filter((item) => !form.pais_id || String(item.pais_id) === form.pais_id);
  }, [form.ciudad_id, form.pais_id, ciudadesById, departamentosById, departamentosGeo]);

  const ciudadesDisponibles = useMemo(() => {
    if (form.departamento_geo_id) {
      return ciudades.filter((item) => String(item.departamento_id) === form.departamento_geo_id);
    }

    if (form.pais_id) {
      return ciudades.filter((item) => String(item.pais_id) === form.pais_id);
    }

    return ciudades;
  }, [ciudades, form.departamento_geo_id, form.pais_id]);

  const syncPaisDepartamentoCiudad = useCallback((next: Partial<ProveedorFormState>) => {
    setForm((prev) => {
      const merged = { ...prev, ...next };

      if (merged.ciudad_id) {
        const ciudad = ciudadesById[Number(merged.ciudad_id)];
        if (ciudad) {
          merged.departamento_geo_id = String(ciudad.departamento_id);
          merged.pais_id = String(ciudad.pais_id);
        }
      } else if (merged.departamento_geo_id) {
        const departamento = departamentosById[Number(merged.departamento_geo_id)];
        if (departamento) {
          merged.pais_id = String(departamento.pais_id);
        }
      }

      if (merged.departamento_geo_id && merged.ciudad_id) {
        const ciudad = ciudadesById[Number(merged.ciudad_id)];
        if (!ciudad || String(ciudad.departamento_id) !== merged.departamento_geo_id) {
          merged.ciudad_id = '';
        }
      }

      if (merged.pais_id && merged.departamento_geo_id) {
        const departamento = departamentosById[Number(merged.departamento_geo_id)];
        if (!departamento || String(departamento.pais_id) !== merged.pais_id) {
          merged.departamento_geo_id = '';
          merged.ciudad_id = '';
        }
      }

      if (!merged.pais_id) {
        merged.departamento_geo_id = '';
        merged.ciudad_id = '';
      }

      return merged;
    });
  }, [ciudadesById, departamentosById]);

  const abrirNuevo = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const abrirEdicion = (proveedor: ProveedorUI) => {
    const usuario = proveedor.usuario ? usuariosById[proveedor.usuario] : undefined;
    const paisId = findPaisIdByName(proveedor.pais);
    const departamentoId = findDepartamentoIdByName(proveedor.departamento, paisId);
    const ciudadId = findCiudadIdByName(proveedor.ciudad, departamentoId);

    setEditingId(proveedor.id);
    setForm({
      usuario: proveedor.usuario ?? null,
      nombreUsuario: usuario?.nombre || '',
      correoUsuario: usuario?.correo || proveedor.email || '',
      nuevaContrasena: '',
      nit: proveedor.nit || '',
      razon_social: proveedor.razon_social || '',
      nombre_comercial: proveedor.nombre_comercial || '',
      tipo_proveedor: proveedor.tipo_proveedor || 'Servicios',
      tipo_persona: proveedor.tipo_persona || 'Jurídica',
      direccion: proveedor.direccion || '',
      pais_id: paisId,
      departamento_geo_id: departamentoId,
      ciudad_id: ciudadId,
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      contacto_principal: proveedor.contacto_principal || '',
      telefono_contacto: proveedor.telefono_contacto || '',
      banco_id: findBancoIdByName(proveedor.banco),
      tipo_cuenta_id: findTipoCuentaIdByName(proveedor.tipo_cuenta),
      numero_cuenta: proveedor.numero_cuenta || '',
      regimen_tributario: proveedor.regimen_tributario || '',
      observaciones: proveedor.observaciones || '',
      estado: proveedor.estado || 'Activo',
    });
    setDialogOpen(true);
  };

  const buildProveedorPayload = (source: ProveedorFormState) => {
    const ciudad = source.ciudad_id ? ciudadesById[Number(source.ciudad_id)] : undefined;
    const departamento = source.departamento_geo_id ? departamentosById[Number(source.departamento_geo_id)] : undefined;
    const pais = source.pais_id ? paisesById[Number(source.pais_id)] : undefined;
    const banco = source.banco_id ? bancosById[Number(source.banco_id)] : undefined;
    const tipoCuenta = source.tipo_cuenta_id ? tiposCuentaById[Number(source.tipo_cuenta_id)] : undefined;

    return {
      nit: source.nit.trim(),
      razon_social: source.razon_social.trim(),
      nombre_comercial: source.nombre_comercial.trim() || undefined,
      tipo_proveedor: source.tipo_proveedor,
      tipo_persona: source.tipo_persona,
      direccion: source.direccion.trim() || undefined,
      pais_id: source.pais_id ? Number(source.pais_id) : undefined,
      departamento_geo_id: source.departamento_geo_id ? Number(source.departamento_geo_id) : undefined,
      ciudad_id: source.ciudad_id ? Number(source.ciudad_id) : undefined,
      pais: pais?.nombre || undefined,
      departamento: departamento?.nombre || undefined,
      ciudad: ciudad?.nombre || undefined,
      telefono: source.telefono.trim() || undefined,
      email: source.email.trim() || undefined,
      contacto_principal: source.contacto_principal.trim() || undefined,
      telefono_contacto: source.telefono_contacto.trim() || undefined,
      banco_id: source.banco_id ? Number(source.banco_id) : undefined,
      banco: banco?.nombre || undefined,
      tipo_cuenta_id: source.tipo_cuenta_id ? Number(source.tipo_cuenta_id) : undefined,
      tipo_cuenta: tipoCuenta?.nombre || undefined,
      numero_cuenta: source.numero_cuenta.trim() || undefined,
      regimen_tributario: source.regimen_tributario || undefined,
      observaciones: source.observaciones.trim() || undefined,
      estado: source.estado,
    };
  };

  const guardar = async () => {
    if (!form.razon_social.trim() || !form.nit.trim() || !form.tipo_proveedor || !form.tipo_persona) {
      toast.error('Razón social, NIT, tipo de proveedor y tipo de persona son obligatorios.');
      return;
    }

    if (!editingId && (!form.nombreUsuario.trim() || !form.correoUsuario.trim() || !form.nuevaContrasena.trim())) {
      toast.error('Para crear el proveedor también debes diligenciar nombre, correo de acceso y contraseña.');
      return;
    }

    setSaving(true);
    try {
      const proveedorPayload = buildProveedorPayload(form);

      if (editingId) {
        await proveedoresService.update(editingId, proveedorPayload);

        if (form.usuario) {
          const updatePayload: Parameters<typeof userService.actualizarUsuario>[0] = { id: form.usuario };
          if (form.nombreUsuario.trim()) updatePayload.nombre = form.nombreUsuario.trim();
          if (form.correoUsuario.trim()) updatePayload.correo = form.correoUsuario.trim();
          if (form.nuevaContrasena.trim()) updatePayload.contrasena = form.nuevaContrasena.trim();
          updatePayload.activo = form.estado === 'Activo';
          await userService.actualizarUsuario(updatePayload);
        }

        toast.success('Proveedor actualizado correctamente.');
      } else {
        await proveedoresService.crearConUsuario({
          nombre: form.nombreUsuario.trim(),
          correo: form.correoUsuario.trim(),
          contrasena: form.nuevaContrasena.trim(),
          ...proveedorPayload,
        });
        toast.success('Proveedor creado correctamente con su usuario de acceso.');
      }

      setDialogOpen(false);
      setForm({ ...emptyForm });
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible guardar el proveedor.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (proveedor: ProveedorUI) => {
    const nextEstado: Proveedor['estado'] = proveedor.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setAccionProveedorId(proveedor.id);
    try {
      await proveedoresService.update(proveedor.id, { estado: nextEstado });
      if (proveedor.usuario) {
        await userService.actualizarUsuario({
          id: proveedor.usuario,
          activo: nextEstado === 'Activo',
        });
      }
      toast.success(`Proveedor ${nextEstado.toLowerCase()} correctamente.`);
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible cambiar el estado del proveedor.'));
    } finally {
      setAccionProveedorId(null);
    }
  };

  const eliminarProveedor = async (proveedor: ProveedorUI) => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar a ${proveedor.razon_social}? Esta acción no se puede deshacer.`);
    if (!confirmar) return;

    setAccionProveedorId(proveedor.id);
    try {
      await proveedoresService.delete(proveedor.id);
      toast.success('Proveedor eliminado correctamente.');
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible eliminar el proveedor.'));
    } finally {
      setAccionProveedorId(null);
    }
  };

  const limpiarFiltros = () => {
    setSearch('');
    setEstadoFilter('all');
    setTipoFilter('all');
    setCiudadFilter('all');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="space-y-2">
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Building2 className="h-8 w-8 text-amber-300" />
            Gestión de Proveedores
          </h1>
          <p className="max-w-3xl text-sm text-red-100">
            Centraliza aquí el alta, edición, estado y datos bancarios de proveedores. Este módulo ya no depende de Gestión de Usuarios.
          </p>
        </div>
      </motion.div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-slate-900">Proveedores registrados</CardTitle>
            <Button size="sm" onClick={abrirNuevo} className="bg-red-700 text-white hover:bg-red-800">
              <Plus className="mr-2 h-4 w-4" />
              Nuevo proveedor
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
            <div className="relative lg:col-span-5">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                placeholder="Buscar por NIT, razón social, correo o ciudad"
              />
            </div>

            <div className="lg:col-span-2">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {ESTADO_OPTIONS.map((estado) => (
                    <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select value={tipoFilter} onValueChange={setTipoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los tipos</SelectItem>
                  {TIPO_PROVEEDOR_OPTIONS.map((tipo) => (
                    <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select value={ciudadFilter} onValueChange={setCiudadFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Ciudad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las ciudades</SelectItem>
                  {ciudadesDisponiblesFiltro.map((ciudad) => (
                    <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-1">
              <Button variant="outline" className="w-full" onClick={limpiarFiltros}>Limpiar</Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <p className="text-sm text-slate-500">Cargando proveedores...</p>
          ) : (
            <div className="overflow-hidden rounded-xl border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-center">NIT</TableHead>
                    <TableHead className="text-center">Razón social</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Ciudad</TableHead>
                    <TableHead className="text-center">Correo empresa</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="py-7 text-center text-slate-500">
                        No hay proveedores para mostrar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((proveedor) => {
                      const isProcessing = accionProveedorId === proveedor.id;
                      return (
                        <TableRow key={proveedor.id}>
                          <TableCell className="text-center font-mono text-sm">{proveedor.nit}</TableCell>
                          <TableCell className="text-center font-medium text-slate-800">{proveedor.razon_social}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-slate-700">{proveedor.tipo_proveedor}</Badge>
                          </TableCell>
                          <TableCell className="text-center">{proveedor.ciudad || '—'}</TableCell>
                          <TableCell className="text-center">{proveedor.email || '—'}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={proveedor.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                              {proveedor.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => abrirEdicion(proveedor)} title="Editar proveedor">
                                <Building2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => void toggleEstado(proveedor)}
                                title={proveedor.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                className={proveedor.estado === 'Activo' ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}
                              >
                                {proveedor.estado === 'Activo' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isProcessing}
                                onClick={() => void eliminarProveedor(proveedor)}
                                title="Eliminar proveedor"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[92vh] w-[96vw] overflow-y-auto sm:!max-w-[94vw] xl:!max-w-[84vw]">
          <DialogHeader>
            <DialogTitle className="text-xl text-slate-900">{editingId ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
            <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm xl:col-span-4">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <UserRound className="h-4 w-4 text-red-700" />
                Acceso del proveedor
              </p>
              <div className="space-y-2">
                <Label>Nombre del usuario {editingId ? '' : <span className="text-red-600">*</span>}</Label>
                <Input value={form.nombreUsuario} onChange={(e) => setForm((prev) => ({ ...prev, nombreUsuario: e.target.value }))} placeholder="Representante o nombre de acceso" />
              </div>
              <div className="space-y-2">
                <Label>Correo de acceso {editingId ? '' : <span className="text-red-600">*</span>}</Label>
                <Input type="email" value={form.correoUsuario} onChange={(e) => setForm((prev) => ({ ...prev, correoUsuario: e.target.value }))} placeholder="usuario@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>{editingId ? 'Nueva contraseña' : 'Contraseña'} {!editingId && <span className="text-red-600">*</span>}</Label>
                <Input type="password" value={form.nuevaContrasena} onChange={(e) => setForm((prev) => ({ ...prev, nuevaContrasena: e.target.value }))} placeholder={editingId ? 'Solo si deseas cambiarla' : 'Contraseña inicial'} />
              </div>
              <div className="rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600">
                {editingId
                  ? form.usuario
                    ? 'Este proveedor tiene usuario vinculado y puedes actualizar su acceso desde aquí.'
                    : 'El proveedor no tiene usuario vinculado; solo se actualizarán sus datos maestros.'
                  : 'Al guardar, se creará automáticamente el usuario con rol Proveedor.'}
              </div>
            </div>

            <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm xl:col-span-8">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <ShieldCheck className="h-4 w-4 text-red-700" />
                Datos del proveedor
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                <div className="space-y-2">
                  <Label>NIT <span className="text-red-600">*</span></Label>
                  <Input value={form.nit} onChange={(e) => setForm((prev) => ({ ...prev, nit: e.target.value }))} placeholder="900123456-7" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Razón social <span className="text-red-600">*</span></Label>
                  <Input value={form.razon_social} onChange={(e) => setForm((prev) => ({ ...prev, razon_social: e.target.value }))} placeholder="Proveedor S.A.S." />
                </div>
                <div className="space-y-2 md:col-span-2 xl:col-span-1">
                  <Label>Nombre comercial</Label>
                  <Input value={form.nombre_comercial} onChange={(e) => setForm((prev) => ({ ...prev, nombre_comercial: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Tipo de persona <span className="text-red-600">*</span></Label>
                  <Select value={form.tipo_persona} onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_persona: value as ProveedorFormState['tipo_persona'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPO_PERSONA_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de proveedor <span className="text-red-600">*</span></Label>
                  <Select value={form.tipo_proveedor} onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_proveedor: value as Proveedor['tipo_proveedor'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPO_PROVEEDOR_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select value={form.estado} onValueChange={(value) => setForm((prev) => ({ ...prev, estado: value as Proveedor['estado'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ESTADO_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 xl:col-span-3">
                  <Label>Dirección</Label>
                  <Input value={form.direccion} onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))} placeholder="Calle 123 # 45-67" />
                </div>
                <div className="space-y-2">
                  <Label>País</Label>
                  <Select value={form.pais_id || undefined} onValueChange={(value) => syncPaisDepartamentoCiudad({ pais_id: value, departamento_geo_id: '', ciudad_id: '' })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona país" /></SelectTrigger>
                    <SelectContent>
                      {paises.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Departamento</Label>
                  <Select value={form.departamento_geo_id || undefined} onValueChange={(value) => syncPaisDepartamentoCiudad({ departamento_geo_id: value, ciudad_id: '' })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
                    <SelectContent>
                      {departamentosDisponibles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Ciudad</Label>
                  <Select value={form.ciudad_id || undefined} onValueChange={(value) => syncPaisDepartamentoCiudad({ ciudad_id: value })}>
                    <SelectTrigger><SelectValue placeholder="Selecciona ciudad" /></SelectTrigger>
                    <SelectContent>
                      {ciudadesDisponibles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={form.telefono} onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Correo empresa</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="facturacion@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label>Contacto principal</Label>
                  <Input value={form.contacto_principal} onChange={(e) => setForm((prev) => ({ ...prev, contacto_principal: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono contacto</Label>
                  <Input value={form.telefono_contacto} onChange={(e) => setForm((prev) => ({ ...prev, telefono_contacto: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Banco</Label>
                  <Select value={form.banco_id || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, banco_id: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona banco" /></SelectTrigger>
                    <SelectContent>
                      {bancos.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de cuenta</Label>
                  <Select value={form.tipo_cuenta_id || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_cuenta_id: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                    <SelectContent>
                      {tiposCuenta.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de cuenta</Label>
                  <Input value={form.numero_cuenta} onChange={(e) => setForm((prev) => ({ ...prev, numero_cuenta: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Régimen tributario</Label>
                  <Select value={form.regimen_tributario || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, regimen_tributario: value }))}>
                    <SelectTrigger><SelectValue placeholder="Selecciona régimen" /></SelectTrigger>
                    <SelectContent>
                      {REGIMEN_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 md:col-span-2 xl:col-span-3">
                  <Label>Observaciones</Label>
                  <textarea
                    rows={4}
                    value={form.observaciones}
                    onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                    className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                    placeholder="Notas administrativas o tributarias del proveedor"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void guardar()} disabled={saving} className="bg-red-700 text-white hover:bg-red-800">
              <Save className="mr-2 h-4 w-4" />
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear proveedor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
