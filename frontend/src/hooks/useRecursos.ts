import { useState, useEffect } from 'react';
import { recursosService } from '../services/recursos/recursosService';
import type { Recurso, CreateRecursoDto, UpdateRecursoDto } from '../models/recurso';

export function useRecursos() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecursos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await recursosService.getAll();
      setRecursos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar recursos');
      setRecursos([]);
    } finally {
      setLoading(false);
    }
  };

  const getRecurso = async (id: number): Promise<Recurso | null> => {
    setLoading(true);
    setError(null);
    try {
      const recurso = await recursosService.getById(id);
      return recurso;
    } catch (err: any) {
      setError(err.message || 'Error al cargar recurso');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createRecurso = async (data: CreateRecursoDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newRecurso = await recursosService.create(data);
      setRecursos((prev) => [...prev, newRecurso]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear recurso');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateRecurso = async (data: UpdateRecursoDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedRecurso = await recursosService.update(data);
      setRecursos((prev) =>
        prev.map((r) => (r.id === updatedRecurso.id ? updatedRecurso : r))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar recurso');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteRecurso = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await recursosService.delete(id);
      setRecursos((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar recurso');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecursos();
  }, []);

  return {
    recursos,
    loading,
    error,
    fetchRecursos,
    getRecurso,
    createRecurso,
    updateRecurso,
    deleteRecurso,
  };
}
