import { useState, useEffect } from 'react';
import { gruposService } from '../services/grupos/gruposService';
import type { Grupo, CreateGrupoDto, UpdateGrupoDto } from '../models/grupo';

export function useGrupos() {
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGrupos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await gruposService.getAll();
      setGrupos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar grupos');
      setGrupos([]);
    } finally {
      setLoading(false);
    }
  };

  const getGrupo = async (id: number): Promise<Grupo | null> => {
    setLoading(true);
    setError(null);
    try {
      const grupo = await gruposService.getById(id);
      return grupo;
    } catch (err: any) {
      setError(err.message || 'Error al cargar grupo');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createGrupo = async (data: CreateGrupoDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newGrupo = await gruposService.create(data);
      setGrupos((prev) => [...prev, newGrupo]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear grupo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateGrupo = async (data: UpdateGrupoDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedGrupo = await gruposService.update(data);
      setGrupos((prev) =>
        prev.map((g) => (g.id === updatedGrupo.id ? updatedGrupo : g))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar grupo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteGrupo = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await gruposService.delete(id);
      setGrupos((prev) => prev.filter((g) => g.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar grupo');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrupos();
  }, []);

  return {
    grupos,
    loading,
    error,
    fetchGrupos,
    getGrupo,
    createGrupo,
    updateGrupo,
    deleteGrupo,
  };
}
