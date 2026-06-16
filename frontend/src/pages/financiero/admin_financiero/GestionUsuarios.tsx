import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Input } from '../../../share/input';
import { Button } from '../../../share/button';
import { Label } from '../../../share/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Checkbox } from '../../../share/checkbox';
import { Edit3, PauseCircle, PlayCircle, Plus, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { toast } from 'sonner';
import { userService, rolService, type Usuario, type Rol } from '../../../services/users/authService';
import { componenteRolService, componenteService, componenteUsuarioService, type Componente, type ComponenteRol, type ComponenteUsuario } from '../../../services/componentes/componentesAPI';

type PermisoTipo = 'VER' | 'EDITAR';

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const FINANCIAL_ROLE_NAMES = new Set([
  'funcionario',
  'contabilidad',
  'tesoreria',
  'auditoria',
  'direccion financiera',
  'rectoria',
  'admin financiero',
]);

const isProveedorRole = (roleName: string) => normalizeText(roleName) === 'proveedor';

const isFinancialRole = (roleName: string) => FINANCIAL_ROLE_NAMES.has(normalizeText(roleName));

const getRolNombre = (usuario: Usuario, rolesById: Record<number, string>) =>
  rolesById[usuario.rol_id || -1] || usuario.rol?.nombre || 'Sin rol';

const formatSede = (sede: Usuario['sede']) => {
  if (!sede) return 'Sin sede';
  if (typeof sede === 'string') return sede;
  return sede.nombre || 'Sin sede';
};

const getErrorMessage = (error: unknown, fallback: string) =>
  error instanceof Error ? error.message : fallback;

const initialNuevoUsuario = {
  nombre: '',
  correo: '',
  contrasena: '',
  rolId: '',
  activo: true,
};

const initialEditarUsuario = {
  id: null as number | null,
  nombre: '',
  correo: '',
  contrasena: '',
  rolId: '',
  activo: true,
};

export default function GestionUsuariosReal() {
  const [loading, setLoading] = useState(true);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [rolesById, setRolesById] = useState<Record<number, string>>({});
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [componenteRoles, setComponenteRoles] = useState<ComponenteRol[]>([]);
  const [componenteUsuarios, setComponenteUsuarios] = useState<ComponenteUsuario[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [accionUsuarioId, setAccionUsuarioId] = useState<number | null>(null);
  const [nuevoUsuario, setNuevoUsuario] = useState(initialNuevoUsuario);
  const [editarUsuario, setEditarUsuario] = useState(initialEditarUsuario);
  const [componentesNuevoUsuario, setComponentesNuevoUsuario] = useState<Record<number, PermisoTipo>>({});
  const [componentesEditarUsuario, setComponentesEditarUsuario] = useState<Record<number, PermisoTipo>>({});
  const [search, setSearch] = useState('');
  const [rolFilter, setRolFilter] = useState('all');
  const [estadoFilter, setEstadoFilter] = useState('all');
  const [sedeFilter, setSedeFilter] = useState('all');

  const buildRoleComponentSelection = useCallback((rolId: number): Record<number, PermisoTipo> => {
    if (!rolId) return {};
    return componenteRoles
      .filter((item) => item.rol_id === rolId)
      .reduce<Record<number, PermisoTipo>>((acc, item) => {
        acc[item.componente_id] = item.permiso;
        return acc;
      }, {});
  }, [componenteRoles]);

  const buildEffectiveSelectionForUser = useCallback((usuarioId: number, rolId: number): Record<number, PermisoTipo> => {
    const base = buildRoleComponentSelection(rolId);
    const overrides = componenteUsuarios.filter((item) => item.usuario_id === usuarioId);

    const merged = { ...base };
    overrides.forEach((override) => {
      if (override.activo) {
        merged[override.componente_id] = override.permiso;
      } else {
        delete merged[override.componente_id];
      }
    });

    return merged;
  }, [buildRoleComponentSelection, componenteUsuarios]);

  const syncComponentesUsuario = useCallback(async (usuarioId: number, rolId: number, selected: Record<number, PermisoTipo>) => {
    const base = buildRoleComponentSelection(rolId);
    const existing = componenteUsuarios.filter((item) => item.usuario_id === usuarioId);
    const existingByComponente = new Map(existing.map((item) => [item.componente_id, item]));

    const candidateIds = new Set<number>([
      ...Object.keys(base).map(Number),
      ...Object.keys(selected).map(Number),
      ...existing.map((item) => item.componente_id),
    ]);

    for (const componenteId of candidateIds) {
      const basePermiso = base[componenteId];
      const selectedPermiso = selected[componenteId];
      const existingOverride = existingByComponente.get(componenteId);

      let shouldPersistOverride = false;
      let payload: { permiso: PermisoTipo; activo: boolean } | null = null;

      if (basePermiso) {
        if (!selectedPermiso) {
          shouldPersistOverride = true;
          payload = { permiso: basePermiso, activo: false };
        } else if (selectedPermiso !== basePermiso) {
          shouldPersistOverride = true;
          payload = { permiso: selectedPermiso, activo: true };
        }
      } else if (selectedPermiso) {
        shouldPersistOverride = true;
        payload = { permiso: selectedPermiso, activo: true };
      }

      if (shouldPersistOverride && payload) {
        if (existingOverride?.id) {
          if (existingOverride.permiso !== payload.permiso || existingOverride.activo !== payload.activo) {
            await componenteUsuarioService.update({ id: existingOverride.id, permiso: payload.permiso, activo: payload.activo });
          }
        } else {
          await componenteUsuarioService.create({
            usuario_id: usuarioId,
            componente_id: componenteId,
            permiso: payload.permiso,
            activo: payload.activo,
          });
        }
      } else if (!shouldPersistOverride && existingOverride?.id) {
        await componenteUsuarioService.delete(existingOverride.id);
      }
    }
  }, [buildRoleComponentSelection, componenteUsuarios]);

  const cargarData = useCallback(async () => {
    setLoading(true);
    try {
      const [usuariosResp, rolesResp, componentesResp, componenteRolesResp, componenteUsuariosResp] = await Promise.all([
        userService.listarUsuarios(),
        rolService.listarRoles(),
        componenteService.list(),
        componenteRolService.list(),
        componenteUsuarioService.list(),
      ]);

      const rolesMap = Object.fromEntries((rolesResp.roles || []).map((r) => [r.id, r.nombre]));
      setRolesById(rolesMap);
      setRoles(rolesResp.roles || []);
      setUsuarios(usuariosResp.usuarios || []);
      setComponentes(componentesResp.componentes || []);
      setComponenteRoles(componenteRolesResp.componente_roles || []);
      setComponenteUsuarios(componenteUsuariosResp.componente_usuarios || []);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No se pudo cargar la gestión de usuarios financieros.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void cargarData();
  }, [cargarData]);

  const rolesGestionables = useMemo(
    () => roles.filter((rol) => isFinancialRole(rol.nombre) && !isProveedorRole(rol.nombre)),
    [roles]
  );

  const usuariosFinancieros = useMemo(() => {
    return usuarios.filter((usuario) => {
      const rolNombre = getRolNombre(usuario, rolesById);
      return isFinancialRole(rolNombre) && !isProveedorRole(rolNombre);
    });
  }, [usuarios, rolesById]);

  const sedesDisponibles = useMemo(
    () => Array.from(new Set(usuariosFinancieros.map((usuario) => formatSede(usuario.sede)))).sort((a, b) => a.localeCompare(b, 'es')),
    [usuariosFinancieros]
  );

  const usuariosFiltrados = useMemo(() => {
    const query = normalizeText(search);
    return usuariosFinancieros.filter((usuario) => {
      const rolNombre = getRolNombre(usuario, rolesById);
      const sede = formatSede(usuario.sede);

      if (rolFilter !== 'all' && normalizeText(rolNombre) !== normalizeText(rolFilter)) {
        return false;
      }

      if (estadoFilter === 'activo' && !usuario.activo) {
        return false;
      }

      if (estadoFilter === 'inactivo' && usuario.activo) {
        return false;
      }

      if (sedeFilter !== 'all' && normalizeText(sede) !== normalizeText(sedeFilter)) {
        return false;
      }

      if (!query) {
        return true;
      }

      return [String(usuario.id || ''), usuario.nombre, usuario.correo, rolNombre, sede].some((value) =>
        normalizeText(value || '').includes(query)
      );
    });
  }, [search, usuariosFinancieros, rolesById, rolFilter, estadoFilter, sedeFilter]);

  const crearUsuario = async () => {
    const nombre = nuevoUsuario.nombre.trim();
    const correo = nuevoUsuario.correo.trim();
    const contrasena = nuevoUsuario.contrasena.trim();

    if (!nombre || !correo || !contrasena || !nuevoUsuario.rolId) {
      toast.error('Completa nombre, correo, contraseña y rol para crear el usuario.');
      return;
    }

    setSaving(true);
    try {
      const created = await userService.crearUsuario({
        nombre,
        correo,
        contrasena,
        rol_id: Number(nuevoUsuario.rolId),
        activo: nuevoUsuario.activo,
      });

      await syncComponentesUsuario(created.id, Number(nuevoUsuario.rolId), componentesNuevoUsuario);
      toast.success('Usuario creado correctamente.');
      setDialogOpen(false);
      setNuevoUsuario(initialNuevoUsuario);
      setComponentesNuevoUsuario({});
      await cargarData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible crear el usuario.'));
    } finally {
      setSaving(false);
    }
  };

  const iniciarEdicion = (usuario: Usuario) => {
    if (!usuario.id) {
      toast.error('No se puede editar este usuario porque no tiene ID válido.');
      return;
    }

    const rolId = usuario.rol_id ?? usuario.rol?.id;
    setEditarUsuario({
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      contrasena: '',
      rolId: rolId ? String(rolId) : '',
      activo: usuario.activo,
    });

    if (rolId) {
      setComponentesEditarUsuario(buildEffectiveSelectionForUser(usuario.id, rolId));
    } else {
      setComponentesEditarUsuario({});
    }
    setEditDialogOpen(true);
  };

  const actualizarUsuario = async () => {
    if (!editarUsuario.id) {
      toast.error('No se pudo identificar el usuario a actualizar.');
      return;
    }

    const nombre = editarUsuario.nombre.trim();
    const correo = editarUsuario.correo.trim();
    const contrasena = editarUsuario.contrasena.trim();

    if (!nombre || !correo || !editarUsuario.rolId) {
      toast.error('Completa nombre, correo y rol para actualizar el usuario.');
      return;
    }

    setUpdating(true);
    try {
      await userService.actualizarUsuario({
        id: editarUsuario.id,
        nombre,
        correo,
        contrasena: contrasena || undefined,
        rol_id: Number(editarUsuario.rolId),
        activo: editarUsuario.activo,
      });

      await syncComponentesUsuario(editarUsuario.id, Number(editarUsuario.rolId), componentesEditarUsuario);

      toast.success('Usuario actualizado correctamente.');
      setEditDialogOpen(false);
      setEditarUsuario(initialEditarUsuario);
      setComponentesEditarUsuario({});
      await cargarData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible actualizar el usuario.'));
    } finally {
      setUpdating(false);
    }
  };

  const eliminarUsuario = async (usuario: Usuario) => {
    if (!usuario.id) {
      toast.error('No se puede eliminar este usuario porque no tiene ID válido.');
      return;
    }

    const confirmar = window.confirm(`¿Seguro que deseas eliminar a ${usuario.nombre}? Esta acción no se puede deshacer.`);
    if (!confirmar) {
      return;
    }

    setAccionUsuarioId(usuario.id);
    try {
      await userService.eliminarUsuario(usuario.id);
      toast.success('Usuario eliminado correctamente.');
      await cargarData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible eliminar el usuario.'));
    } finally {
      setAccionUsuarioId(null);
    }
  };

  const toggleEstadoUsuario = async (usuario: Usuario) => {
    if (!usuario.id) {
      toast.error('No se puede cambiar estado de este usuario porque no tiene ID válido.');
      return;
    }

    setAccionUsuarioId(usuario.id);
    try {
      await userService.actualizarUsuario({
        id: usuario.id,
        activo: !usuario.activo,
      });
      toast.success(`Usuario ${usuario.activo ? 'desactivado' : 'activado'} correctamente.`);
      await cargarData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, 'No fue posible cambiar el estado del usuario.'));
    } finally {
      setAccionUsuarioId(null);
    }
  };

  const permisosRolSeleccionado = useMemo(() => {
    const rolId = Number(editarUsuario.rolId);
    if (!rolId) {
      return [];
    }

    return componenteRoles.filter((item) => item.rol_id === rolId);
  }, [editarUsuario.rolId, componenteRoles]);

  const permisosPorComponente = useMemo(
    () => new Map(permisosRolSeleccionado.map((item) => [item.componente_id, item.permiso])),
    [permisosRolSeleccionado]
  );

  const componentesOrdenados = useMemo(
    () => [...componentes].sort((a, b) => (a.nombre || '').localeCompare(b.nombre || '', 'es')),
    [componentes]
  );

  const componentesDelRolSeleccionado = useMemo(() => {
    const idsComponentesRol = new Set(permisosRolSeleccionado.map((item) => item.componente_id));
    return componentesOrdenados.filter((componente) => Boolean(componente.id) && idsComponentesRol.has(componente.id as number));
  }, [componentesOrdenados, permisosRolSeleccionado]);

  const componentesDelRolNuevo = useMemo(() => {
    const rolId = Number(nuevoUsuario.rolId);
    if (!rolId) return [];
    const ids = new Set(componenteRoles.filter((item) => item.rol_id === rolId).map((item) => item.componente_id));
    return componentesOrdenados.filter((componente) => Boolean(componente.id) && ids.has(componente.id as number));
  }, [nuevoUsuario.rolId, componenteRoles, componentesOrdenados]);

  const handleNuevoRolChange = (value: string) => {
    setNuevoUsuario((prev) => ({ ...prev, rolId: value }));
    setComponentesNuevoUsuario(buildRoleComponentSelection(Number(value)));
  };

  const handleEditarRolChange = (value: string) => {
    setEditarUsuario((prev) => ({ ...prev, rolId: value }));
    if (editarUsuario.id) {
      setComponentesEditarUsuario(buildEffectiveSelectionForUser(editarUsuario.id, Number(value)));
      return;
    }
    setComponentesEditarUsuario(buildRoleComponentSelection(Number(value)));
  };

  const toggleComponenteNuevo = (componenteId: number) => {
    setComponentesNuevoUsuario((prev) => {
      const next = { ...prev };
      if (next[componenteId]) {
        delete next[componenteId];
      } else {
        next[componenteId] = 'VER';
      }
      return next;
    });
  };

  const setPermisoComponenteNuevo = (componenteId: number, permiso: PermisoTipo) => {
    setComponentesNuevoUsuario((prev) => ({ ...prev, [componenteId]: permiso }));
  };

  const toggleComponenteEditar = (componenteId: number) => {
    setComponentesEditarUsuario((prev) => {
      const next = { ...prev };
      if (next[componenteId]) {
        delete next[componenteId];
      } else {
        next[componenteId] = 'VER';
      }
      return next;
    });
  };

  const setPermisoComponenteEditar = (componenteId: number, permiso: PermisoTipo) => {
    setComponentesEditarUsuario((prev) => ({ ...prev, [componenteId]: permiso }));
  };

  const limpiarFiltros = () => {
    setSearch('');
    setRolFilter('all');
    setEstadoFilter('all');
    setSedeFilter('all');
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-700 to-red-800 p-6 text-white shadow-xl"
      >
        <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-amber-300/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 left-1/3 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold flex items-center gap-3">
              <Users className="w-8 h-8 text-amber-300" />
              Gestión de Usuarios Financieros
            </h1>
            <p className="max-w-2xl text-sm text-red-100">Centraliza altas, edición y permisos del equipo financiero en una vista corta, clara y alineada con el resto del aplicativo.</p>
          </div>
        </div>
      </motion.div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-slate-900">Gestión Usuarios</CardTitle>
            <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-red-700 hover:bg-red-800 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Nuevo usuario
            </Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div className="relative lg:col-span-5">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                id="buscar-usuarios"
                aria-label="Buscar usuarios"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
                placeholder="Buscar por ID, nombre, correo, rol o sede"
              />
            </div>

            <div className="lg:col-span-2">
              <Select value={rolFilter} onValueChange={setRolFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los roles</SelectItem>
                  {rolesGestionables.map((rol) => (
                    <SelectItem key={rol.id} value={rol.nombre}>{rol.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select value={estadoFilter} onValueChange={setEstadoFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="activo">Activos</SelectItem>
                  <SelectItem value="inactivo">Inactivos</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="lg:col-span-2">
              <Select value={sedeFilter} onValueChange={setSedeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Sede" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las sedes</SelectItem>
                  {sedesDisponibles.map((sede) => (
                    <SelectItem key={sede} value={sede}>{sede}</SelectItem>
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
            <p className="text-sm text-slate-500">Cargando usuarios...</p>
          ) : (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="text-center">Usuario</TableHead>
                    <TableHead className="text-center">Correo</TableHead>
                    <TableHead className="text-center">Rol</TableHead>
                    <TableHead className="text-center">Estado</TableHead>
                    <TableHead className="text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usuariosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-slate-500 py-7">
                        No hay usuarios para mostrar.
                      </TableCell>
                    </TableRow>
                  ) : (
                    usuariosFiltrados.map((usuario) => {
                      const rolNombre = getRolNombre(usuario, rolesById);
                      const isProcessing = accionUsuarioId === usuario.id;
                      return (
                        <TableRow key={usuario.id}>
                          <TableCell className="text-center font-medium text-slate-800">{usuario.nombre}</TableCell>
                          <TableCell className="text-center">{usuario.correo}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline" className="text-slate-700">
                              <ShieldCheck className="w-3 h-3 mr-1" />
                              {rolNombre}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                              {usuario.activo ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              <Button size="sm" variant="outline" onClick={() => iniciarEdicion(usuario)} title="Editar">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isProcessing}
                                onClick={() => void toggleEstadoUsuario(usuario)}
                                title={usuario.activo ? 'Desactivar' : 'Activar'}
                                className={usuario.activo ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}
                              >
                                {usuario.activo
                                  ? <PauseCircle className="w-4 h-4" />
                                  : <PlayCircle className="w-4 h-4" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                disabled={isProcessing}
                                onClick={() => void eliminarUsuario(usuario)}
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={nuevoUsuario.nombre}
                onChange={(e) => setNuevoUsuario((prev) => ({ ...prev, nombre: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>

            <div className="space-y-1">
              <Label>Correo</Label>
              <Input
                type="email"
                value={nuevoUsuario.correo}
                onChange={(e) => setNuevoUsuario((prev) => ({ ...prev, correo: e.target.value }))}
                placeholder="correo@dominio.edu.co"
              />
            </div>

            <div className="space-y-1">
              <Label>Contraseña</Label>
              <Input
                type="password"
                value={nuevoUsuario.contrasena}
                onChange={(e) => setNuevoUsuario((prev) => ({ ...prev, contrasena: e.target.value }))}
                placeholder="••••••••"
              />
            </div>

            <div className="space-y-1">
              <Label>Rol</Label>
              <Select value={nuevoUsuario.rolId} onValueChange={handleNuevoRolChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {rolesGestionables.map((rol) => (
                    <SelectItem key={rol.id} value={String(rol.id)}>{rol.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between border rounded-lg px-3 py-2">
              <Label>Estado inicial</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setNuevoUsuario((prev) => ({ ...prev, activo: !prev.activo }))}
              >
                {nuevoUsuario.activo ? 'Activo' : 'Inactivo'}
              </Button>
            </div>

            <div className="space-y-3 border rounded-xl p-4 bg-slate-50/70">
              <p className="text-sm font-semibold text-slate-900">Componentes para el nuevo usuario</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-52 overflow-auto pr-1">
                {componentesDelRolNuevo.length === 0 ? (
                  <p className="text-xs text-slate-500 md:col-span-2">Selecciona un rol para configurar componentes.</p>
                ) : (
                  componentesDelRolNuevo.map((componente) => {
                    const componenteId = componente.id || -1;
                    const activo = Boolean(componentesNuevoUsuario[componenteId]);
                    const permiso = componentesNuevoUsuario[componenteId] || 'VER';
                    return (
                      <div key={componenteId} className="rounded-lg border bg-white p-3 space-y-2">
                        <p className="text-sm font-medium text-slate-800 truncate">{componente.nombre}</p>
                        <div className="flex items-center justify-between gap-2">
                          <Button size="sm" variant={activo ? 'default' : 'outline'} onClick={() => toggleComponenteNuevo(componenteId)}>
                            {activo ? 'Activo' : 'Inactivo'}
                          </Button>
                          <Select value={permiso} onValueChange={(value) => setPermisoComponenteNuevo(componenteId, value as PermisoTipo)} disabled={!activo}>
                            <SelectTrigger className="h-8 w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VER">VER</SelectItem>
                              <SelectItem value="EDITAR">EDITAR</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void crearUsuario()} disabled={saving} className="bg-red-700 hover:bg-red-800 text-white">
              {saving ? 'Creando...' : 'Crear usuario'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="w-[98vw] sm:!max-w-[96vw] xl:!max-w-[88vw] max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="border-b bg-slate-50 px-6 py-5">
            <DialogTitle className="text-xl text-slate-900">Editar usuario financiero</DialogTitle>
            <p className="text-sm text-slate-600">
              Actualiza datos principales del usuario y verifica los componentes habilitados por su rol.
            </p>
          </DialogHeader>

          <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-150px)]">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
              <div className="xl:col-span-4 space-y-4 rounded-xl border bg-white p-4 shadow-sm">
                <p className="text-sm font-semibold text-slate-800">Información del usuario</p>

                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={editarUsuario.nombre}
                    onChange={(e) => setEditarUsuario((prev) => ({ ...prev, nombre: e.target.value }))}
                    placeholder="Nombre completo"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Correo</Label>
                  <Input
                    type="email"
                    value={editarUsuario.correo}
                    onChange={(e) => setEditarUsuario((prev) => ({ ...prev, correo: e.target.value }))}
                    placeholder="correo@dominio.edu.co"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Rol</Label>
                  <Select value={editarUsuario.rolId} onValueChange={handleEditarRolChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {rolesGestionables.map((rol) => (
                        <SelectItem key={rol.id} value={String(rol.id)}>{rol.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Nueva contraseña (opcional)</Label>
                  <Input
                    type="password"
                    value={editarUsuario.contrasena}
                    onChange={(e) => setEditarUsuario((prev) => ({ ...prev, contrasena: e.target.value }))}
                    placeholder="Solo si deseas cambiarla"
                  />
                </div>

                <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
                  <Label className="text-slate-700">Estado del usuario</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setEditarUsuario((prev) => ({ ...prev, activo: !prev.activo }))}
                  >
                    {editarUsuario.activo ? 'Activo' : 'Inactivo'}
                  </Button>
                </div>
              </div>

              <div className="xl:col-span-8 space-y-3 rounded-xl border bg-slate-50 p-4">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Componentes habilitados para el rol seleccionado</p>
                  <p className="text-xs text-slate-600">Activa/desactiva componentes y define permiso por usuario.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[58vh] overflow-auto pr-1">
                  {componentesDelRolSeleccionado.length === 0 ? (
                    <div className="md:col-span-2 xl:col-span-3 text-sm text-slate-500 rounded-lg border bg-white px-3 py-4">
                      Este rol no tiene componentes asociados en la configuración actual.
                    </div>
                  ) : (
                    componentesDelRolSeleccionado.map((componente) => {
                      const componenteId = componente.id || -1;
                      const activo = Boolean(componentesEditarUsuario[componenteId]);
                      const permisoBase = permisosPorComponente.get(componenteId) || 'VER';
                      const permiso = componentesEditarUsuario[componenteId] || permisoBase;
                      return (
                        <div key={componente.id} className="rounded-lg border bg-white p-3 shadow-sm space-y-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{componente.nombre}</p>
                            <p className="text-xs text-slate-500 line-clamp-2">{componente.descripcion || 'Sin descripción'}</p>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-slate-600 cursor-pointer" onClick={() => toggleComponenteEditar(componenteId)}>
                              <Checkbox checked={activo} aria-label={`Permiso para ${componente.nombre}`} />
                              <span className="text-xs">{activo ? 'Habilitado' : 'Inactivo'}</span>
                            </div>
                            <Select value={permiso} onValueChange={(value) => setPermisoComponenteEditar(componenteId, value as PermisoTipo)} disabled={!activo}>
                              <SelectTrigger className="h-8 w-28">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="VER">VER</SelectItem>
                                <SelectItem value="EDITAR">EDITAR</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-white px-6 py-4">
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
            <Button onClick={() => void actualizarUsuario()} disabled={updating} className="bg-red-700 hover:bg-red-800 text-white">
              {updating ? 'Guardando...' : 'Guardar cambios'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
