import { useState, useEffect } from 'react';
import { periodosService } from '../services/periodos/periodosService';
import type { Periodo, CreatePeriodoDto, UpdatePeriodoDto } from '../models/periodo';

export function usePeriodos() {
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriodos = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await periodosService.getAll();
      setPeriodos(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar períodos');
      setPeriodos([]);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodo = async (id: number): Promise<Periodo | null> => {
    setLoading(true);
    setError(null);
    try {
      const periodo = await periodosService.getById(id);
      return periodo;
    } catch (err: any) {
      setError(err.message || 'Error al cargar período');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createPeriodo = async (data: CreatePeriodoDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newPeriodo = await periodosService.create(data);
      setPeriodos((prev) => [...prev, newPeriodo]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear período');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePeriodo = async (data: UpdatePeriodoDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedPeriodo = await periodosService.update(data);
      setPeriodos((prev) =>
        prev.map((p) => (p.id === updatedPeriodo.id ? updatedPeriodo : p))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar período');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePeriodo = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await periodosService.delete(id);
      setPeriodos((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar período');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  return {
    periodos,
    loading,
    error,
    fetchPeriodos,
    getPeriodo,
    createPeriodo,
    updatePeriodo,
    deletePeriodo,
  };
}
