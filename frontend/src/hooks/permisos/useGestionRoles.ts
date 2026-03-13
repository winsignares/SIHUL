import { useState, useEffect, useMemo } from 'react';
import { rolService } from '../../services/users/authService';
import type { Rol } from '../../services/users/authService';

interface UseGestionRolesReturn {
  roles: Rol[];
  loading: boolean;
  error: string | null;
  paginaActual: number;
  totalPaginas: number;
  rolesPaginados: Rol[];
  cambiarPagina: (pagina: number) => void;
  terminoBusqueda: string;
  setTerminoBusqueda: (termino: string) => void;
  cargarRoles: () => Promise<void>;
  crearRol: (rol: Omit<Rol, 'id'>) => Promise<void>;
  actualizarRol: (rol: Rol) => Promise<void>;
  eliminarRol: (id: number) => Promise<void>;
}

export function useGestionRoles(): UseGestionRolesReturn {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paginaActual, setPaginaActual] = useState(1);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const itemsPorPagina = 5;

  const rolesFiltrados = useMemo(() => {
    if (!terminoBusqueda.trim()) return roles;
    const termino = terminoBusqueda.toLowerCase();
    return roles.filter(r =>
      r.nombre.toLowerCase().includes(termino) ||
      (r.descripcion && r.descripcion.toLowerCase().includes(termino))
    );
  }, [roles, terminoBusqueda]);

  const totalPaginas = useMemo(() =>
    Math.ceil(rolesFiltrados.length / itemsPorPagina), [rolesFiltrados.length]);

  const rolesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    return rolesFiltrados.slice(inicio, inicio + itemsPorPagina);
  }, [rolesFiltrados, paginaActual]);

  useEffect(() => { setPaginaActual(1); }, [terminoBusqueda]);

  const cambiarPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) setPaginaActual(pagina);
  };

  const cargarRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await rolService.listarRoles();
      setRoles(res.roles || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const crearRol = async (rol: Omit<Rol, 'id'>) => {
    setLoading(true);
    setError(null);
    try {
      await rolService.crearRol(rol);
      await cargarRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const actualizarRol = async (rol: Rol) => {
    setLoading(true);
    setError(null);
    try {
      await rolService.actualizarRol(rol);
      await cargarRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const eliminarRol = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await rolService.eliminarRol(id);
      await cargarRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { cargarRoles(); }, []);

  return {
    roles,
    loading,
    error,
    paginaActual,
    totalPaginas,
    rolesPaginados,
    cambiarPagina,
    terminoBusqueda,
    setTerminoBusqueda,
    cargarRoles,
    crearRol,
    actualizarRol,
    eliminarRol,
  };
}
