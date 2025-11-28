import { useState, useEffect } from 'react';
import { horariosFusionadosService } from '../services/horarios/horariosFusionadosService';
import type { HorarioFusionado, CreateHorarioFusionadoDto, UpdateHorarioFusionadoDto } from '../models/horarioFusionado';

export function useHorariosFusionados() {
  const [horariosFusionados, setHorariosFusionados] = useState<HorarioFusionado[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHorariosFusionados = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await horariosFusionadosService.getAll();
      setHorariosFusionados(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar horarios fusionados');
    } finally {
      setLoading(false);
    }
  };

  const createHorarioFusionado = async (data: CreateHorarioFusionadoDto) => {
    setLoading(true);
    setError(null);
    try {
      const newHorario = await horariosFusionadosService.create(data);
      setHorariosFusionados([...horariosFusionados, newHorario]);
      return newHorario;
    } catch (err: any) {
      setError(err.message || 'Error al crear horario fusionado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateHorarioFusionado = async (data: UpdateHorarioFusionadoDto) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await horariosFusionadosService.update(data);
      setHorariosFusionados(horariosFusionados.map(h => h.id === updated.id ? updated : h));
      return updated;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar horario fusionado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteHorarioFusionado = async (id: number) => {
    setLoading(true);
    setError(null);
    try {
      await horariosFusionadosService.delete(id);
      setHorariosFusionados(horariosFusionados.filter(h => h.id !== id));
    } catch (err: any) {
      setError(err.message || 'Error al eliminar horario fusionado');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorariosFusionados();
  }, []);

  return {
    horariosFusionados,
    loading,
    error,
    fetchHorariosFusionados,
    createHorarioFusionado,
    updateHorarioFusionado,
    deleteHorarioFusionado,
  };
}
