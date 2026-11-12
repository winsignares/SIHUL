import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { userService, rolService, type Usuario, type Rol } from '../../../users/services/authService';
import { componenteRolService, componenteService, componenteUsuarioService, type Componente, type ComponenteRol, type ComponenteUsuario } from '../../../../services/componentes/componentesAPI';
import {
  formatSede,
  getErrorMessage,
  getRolNombre,
  initialEditarUsuario,
  initialNuevoUsuario,
  isFinancialRole,
  isProveedorRole,
  normalizeText,
  type PermisoTipo,
} from './gestionUsuariosFinancieroUtils';

/** Estado y acciones de la gestión de usuarios financieros. */
export function useGestionUsuariosFinanciero() {
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
        acc[item.componente_id] = item.permiso as PermisoTipo;
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
        userService.listarUsuarios({ financiero: true }),
        rolService.listarRoles(),
        componenteService.list({ financiero: true }),
        componenteRolService.list({ financiero: true }),
        componenteUsuarioService.list({ financiero: true }),
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

  const limpiarFiltros = () => {
    setSearch('');
    setRolFilter('all');
    setEstadoFilter('all');
    setSedeFilter('all');
  };

  return {
    loading,
    rolesById,
    rolesGestionables,
    sedesDisponibles,
    usuariosFiltrados,
    accionUsuarioId,
    search,
    setSearch,
    rolFilter,
    setRolFilter,
    estadoFilter,
    setEstadoFilter,
    sedeFilter,
    setSedeFilter,
    limpiarFiltros,
    setDialogOpen,
    iniciarEdicion,
    toggleEstadoUsuario,
    eliminarUsuario,
    dialogOpen,
    nuevoUsuario,
    setNuevoUsuario,
    handleNuevoRolChange,
    componentesDelRolNuevo,
    componentesNuevoUsuario,
    toggleComponenteNuevo,
    crearUsuario,
    saving,
    editDialogOpen,
    setEditDialogOpen,
    editarUsuario,
    setEditarUsuario,
    handleEditarRolChange,
    componentesDelRolSeleccionado,
    componentesEditarUsuario,
    toggleComponenteEditar,
    actualizarUsuario,
    updating,
  };
}
