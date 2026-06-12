import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Building2, PauseCircle, PlayCircle, Plus, Save, Search, Trash2 } from 'lucide-react';
import { proveedoresService } from '../../../services/financiero';
import type { Proveedor } from '../../../models/financiero/core.models';
import { userService } from '../../../services/users/authService';
import { toast } from 'sonner';

type ProveedorUI = Proveedor & { usuario?: number | null };
type ProveedorFormState = Partial<ProveedorUI> & { nuevaContrasena?: string };

const emptyForm: ProveedorFormState = {
  razon_social: '',
  nit: '',
  tipo_proveedor: 'Servicios',
  tipo_persona: 'Jurídica',
  estado: 'Activo',
  email: '',
  telefono: '',
  direccion: '',
  ciudad: '',
  banco: '',
  tipo_cuenta: 'Ahorros',
  numero_cuenta: '',
  nuevaContrasena: '',
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

export default function GestionProveedoresReal() {
  const [proveedores, setProveedores] = useState<ProveedorUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [tipoFilter, setTipoFilter] = useState('all');
  const [ciudadFilter, setCiudadFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [accionProveedorId, setAccionProveedorId] = useState<number | null>(null);
  const [form, setForm] = useState<ProveedorFormState>(emptyForm);

  const extractProveedores = (response: unknown): ProveedorUI[] => {
    if (Array.isArray(response)) return response as ProveedorUI[];
    if (response && typeof response === 'object') {
      const maybePaginated = response as { results?: ProveedorUI[]; proveedores?: ProveedorUI[] };
      if (Array.isArray(maybePaginated.results)) return maybePaginated.results;
      if (Array.isArray(maybePaginated.proveedores)) return maybePaginated.proveedores;
    }
    return [];
  };

  const buildProveedorPayload = (source: ProveedorFormState): Partial<Proveedor> => ({
    razon_social: source.razon_social,
    nit: source.nit,
    tipo_proveedor: source.tipo_proveedor,
    tipo_persona: source.tipo_persona,
    estado: source.estado,
    email: source.email,
    telefono: source.telefono,
    direccion: source.direccion,
    ciudad: source.ciudad,
    banco: source.banco,
    tipo_cuenta: source.tipo_cuenta,
    numero_cuenta: source.numero_cuenta,
  });

  const cargar = useCallback(async () => {
    setLoading(true);
    try {
      const response = await proveedoresService.getAll({ limit: 200, ordering: '-id' });
      setProveedores(extractProveedores(response));
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No se pudieron cargar los proveedores.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const ciudadesDisponibles = useMemo(
    () => Array.from(new Set(proveedores.map((p) => (p.ciudad || '').trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es')),
    [proveedores]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    const base = proveedores.filter((p) => {
      if (estadoFilter !== 'all' && p.estado !== estadoFilter) {
        return false;
      }

      if (tipoFilter !== 'all' && p.tipo_proveedor !== tipoFilter) {
        return false;
      }

      if (ciudadFilter !== 'all' && (p.ciudad || '').trim() !== ciudadFilter) {
        return false;
      }

      if (!q) {
        return true;
      }

      return [p.razon_social, p.nit, p.email, p.ciudad, p.tipo_proveedor].some((value) =>
        (value || '').toLowerCase().includes(q)
      );
    });

    return [...base].sort((a, b) => (b.id || 0) - (a.id || 0));
  }, [search, proveedores, estadoFilter, tipoFilter, ciudadFilter]);

  const limpiarFiltros = () => {
    setSearch('');
    setEstadoFilter('all');
    setTipoFilter('all');
    setCiudadFilter('all');
  };

  const abrirNuevo = () => {
    setEditingId(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const abrirEdicion = (p: Proveedor) => {
    setEditingId(p.id);
    setForm({ ...p });
    setDialogOpen(true);
  };

  const guardar = async () => {
    if (!form.razon_social || !form.nit || !form.tipo_proveedor) {
      toast.error('Razon social, NIT y tipo de proveedor son obligatorios.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await proveedoresService.update(editingId, buildProveedorPayload(form));

        const nuevaContrasena = (form.nuevaContrasena || '').trim();
        if (nuevaContrasena) {
          if (form.usuario) {
            await userService.actualizarUsuario({
              id: form.usuario,
              contrasena: nuevaContrasena,
            });
            toast.success('Proveedor y contraseña actualizados correctamente.');
          } else {
            toast.warning('Proveedor actualizado. No se pudo cambiar contraseña porque no tiene usuario vinculado.');
          }
        } else {
          toast.success('Proveedor actualizado correctamente.');
        }
      } else {
        await proveedoresService.create(buildProveedorPayload(form));
        toast.success('Proveedor creado correctamente.');
      }
      setDialogOpen(false);
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible guardar el proveedor.'));
    } finally {
      setSaving(false);
    }
  };

  const toggleEstado = async (p: Proveedor) => {
    const next = p.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setAccionProveedorId(p.id);
    try {
      await proveedoresService.update(p.id, { estado: next });
      toast.success(`Proveedor ${next.toLowerCase()} correctamente.`);
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible cambiar el estado.'));
    } finally {
      setAccionProveedorId(null);
    }
  };

  const eliminarProveedor = async (p: Proveedor) => {
    const confirmar = window.confirm(`¿Seguro que deseas eliminar a ${p.razon_social}? Esta acción no se puede deshacer.`);
    if (!confirmar) {
      return;
    }

    setAccionProveedorId(p.id);
    try {
      await proveedoresService.delete(p.id);
      toast.success('Proveedor eliminado correctamente.');
      await cargar();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible eliminar el proveedor.'));
    } finally {
      setAccionProveedorId(null);
    }
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
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Building2 className="w-8 h-8 text-amber-300" />
              Gestión de Proveedores
            </h1>
            <p className="max-w-2xl text-sm text-red-100">Consolida terceros, estados de operación y datos bancarios en una bandeja más clara y fácil de revisar.</p>
          </div>
        </div>
      </motion.div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-slate-900">Proveedores registrados</CardTitle>
            <Button size="sm" onClick={abrirNuevo} className="bg-red-700 hover:bg-red-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo proveedor
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="relative lg:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                placeholder="Buscar por ID, razón social, NIT, correo o ciudad"
              />
            </div>

            <div className="lg:col-span-2">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Activo">Activo</SelectItem>
                  <SelectItem value="Inactivo">Inactivo</SelectItem>
                  <SelectItem value="Bloqueado">Bloqueado</SelectItem>
                  <SelectItem value="Verificación">Verificación</SelectItem>
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
                  <SelectItem value="Servicios">Servicios</SelectItem>
                  <SelectItem value="Bienes">Bienes</SelectItem>
                  <SelectItem value="Construcción">Construcción</SelectItem>
                  <SelectItem value="Mixto">Mixto</SelectItem>
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
                  {ciudadesDisponibles.map((ciudad) => (
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
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-center">Razón social</TableHead>
                    <TableHead className="text-center">NIT</TableHead>
                    <TableHead className="text-center">Ciudad</TableHead>
                    <TableHead className="text-center">Tipo</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-slate-500 py-7">
                        No hay proveedores para mostrar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => {
                      const isProcessing = accionProveedorId === p.id;
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="text-center font-medium text-slate-800">{p.razon_social}</TableCell>
                          <TableCell className="text-center">{p.nit}</TableCell>
                          <TableCell className="text-center">{p.ciudad || '—'}</TableCell>
                          <TableCell className="text-center">{p.tipo_proveedor}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={p.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                              {p.estado}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => abrirEdicion(p)} title="Editar">
                                <Building2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => void toggleEstado(p)}
                                title={p.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                className={p.estado === 'Activo' ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}
                              >
                                {p.estado === 'Activo'
                                  ? <PauseCircle className="w-4 h-4" />
                                  : <PlayCircle className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isProcessing}
                                onClick={() => void eliminarProveedor(p)}
                                title="Eliminar"
                              >
                                <Trash2 className="w-4 h-4" />
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
      <DialogContent className="w-[96vw] sm:!max-w-[92vw] xl:!max-w-[80vw] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="border-b bg-slate-50 px-6 py-5">
          <DialogTitle className="text-xl text-slate-900">{editingId ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
          <p className="text-sm text-slate-600">
            Gestiona la información base del proveedor y sus datos de acceso cuando exista usuario vinculado.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-150px)]">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-8 rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800 mb-3">Datos del proveedor</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Razón social</Label>
                  <Input value={form.razon_social || ''} onChange={(e) => setForm((prev) => ({ ...prev, razon_social: e.target.value }))} />
                </div>
                <div className="space-y-2"><Label>NIT</Label><Input value={form.nit || ''} onChange={(e) => setForm((prev) => ({ ...prev, nit: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Email</Label><Input value={form.email || ''} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Teléfono</Label><Input value={form.telefono || ''} onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Ciudad</Label><Input value={form.ciudad || ''} onChange={(e) => setForm((prev) => ({ ...prev, ciudad: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Tipo proveedor</Label>
                  <Select value={form.tipo_proveedor || 'Servicios'} onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_proveedor: value as Proveedor['tipo_proveedor'] }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Servicios">Servicios</SelectItem>
                      <SelectItem value="Bienes">Bienes</SelectItem>
                      <SelectItem value="Construcción">Construcción</SelectItem>
                      <SelectItem value="Mixto">Mixto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Banco</Label><Input value={form.banco || ''} onChange={(e) => setForm((prev) => ({ ...prev, banco: e.target.value }))} /></div>
                <div className="space-y-2"><Label>Número de cuenta</Label><Input value={form.numero_cuenta || ''} onChange={(e) => setForm((prev) => ({ ...prev, numero_cuenta: e.target.value }))} /></div>
              </div>
            </div>

            <div className="xl:col-span-4 rounded-xl border bg-slate-50 p-4 space-y-3">
              <p className="text-sm font-semibold text-slate-800">Acceso del proveedor</p>
              <p className="text-xs text-slate-600">
                Si el proveedor tiene usuario vinculado, puedes cambiar su contraseña desde aquí.
              </p>

              <div className="space-y-2">
                <Label>Nueva contraseña (opcional)</Label>
                <Input
                  type="password"
                  value={form.nuevaContrasena || ''}
                  onChange={(e) => setForm((prev) => ({ ...prev, nuevaContrasena: e.target.value }))}
                  placeholder="Solo si deseas cambiarla"
                />
              </div>

              <div className="rounded-lg border bg-white px-3 py-2 text-xs text-slate-600">
                {form.usuario
                  ? 'Usuario vinculado detectado: el cambio de contraseña se aplicará al guardar.'
                  : 'Este proveedor no tiene usuario vinculado en backend.'}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t bg-white px-6 py-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={guardar} disabled={saving} className="bg-red-600 hover:bg-red-700 text-white"><Save className="w-4 h-4 mr-2" />{saving ? 'Guardando...' : 'Guardar'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </div>
  );
}
