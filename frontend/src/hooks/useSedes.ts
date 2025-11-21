import { useState, useEffect } from 'react';
import { sedesService } from '../services/sedes/sedesService';
import type { Sede, CreateSedeDto, UpdateSedeDto } from '../models/sede';

export function useSedes() {
  const [sedes, setSedes] = useState<Sede[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSedes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await sedesService.getAll();
      setSedes(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar sedes');
      setSedes([]);
    } finally {
      setLoading(false);
    }
  };

  const getSede = async (id: number): Promise<Sede | null> => {
    setLoading(true);
    setError(null);
    try {
      const sede = await sedesService.getById(id);
      return sede;
    } catch (err: any) {
      setError(err.message || 'Error al cargar sede');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createSede = async (data: CreateSedeDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newSede = await sedesService.create(data);
      setSedes((prev) => [...prev, newSede]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear sede');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateSede = async (data: UpdateSedeDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedSede = await sedesService.update(data);
      setSedes((prev) =>
        prev.map((s) => (s.id === updatedSede.id ? updatedSede : s))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar sede');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteSede = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await sedesService.delete(id);
      setSedes((prev) => prev.filter((s) => s.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar sede');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSedes();
  }, []);

  return {
    sedes,
    loading,
    error,
    fetchSedes,
    getSede,
    createSede,
    updateSede,
    deleteSede,
  };
}
