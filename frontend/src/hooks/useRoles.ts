import { useState, useEffect } from 'react';
import { rolesService } from '../services/roles/rolesService';
import type { Rol, CreateRolDto, UpdateRolDto } from '../models/rol';

export function useRoles() {
  const [roles, setRoles] = useState<Rol[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await rolesService.getAll();
      setRoles(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar roles');
    } finally {
      setLoading(false);
    }
  };

  const createRol = async (data: CreateRolDto) => {
    setLoading(true);
    setError(null);
    try {
      const newRol = await rolesService.create(data);
      setRoles([...roles, newRol]);
      return newRol;
    } catch (err: any) {
      setError(err.message || 'Error al crear rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateRol = async (data: UpdateRolDto) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await rolesService.update(data);
      setRoles(roles.map(r => r.id === updated.id ? updated : r));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteRol = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await rolesService.delete(id);
      setRoles(roles.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  return {
    roles,
    loading,
    error,
    fetchRoles,
    createRol,
    updateRol,
    deleteRol,
  };
}
