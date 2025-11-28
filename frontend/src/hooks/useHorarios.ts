import { useState, useEffect } from 'react';
import { horariosService } from '../services/horarios/horariosService';
import type { Horario, CreateHorarioDto, UpdateHorarioDto } from '../models/horario';

export function useHorarios() {
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHorarios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await horariosService.getAll();
      setHorarios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar horarios');
    } finally {
      setLoading(false);
    }
  };

  const getHorario = async (id: number): Promise<Horario | null> => {
    setLoading(true);
    setError(null);
    try {
      const horario = await horariosService.getById(id);
      return horario;
    } catch (err: any) {
      setError(err.message || 'Error al cargar horario');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getHorariosByProfesor = async (profesorId: number): Promise<Horario[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await horariosService.getByProfesor(profesorId);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error al cargar horarios del profesor');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getHorariosByEstudiante = async (estudianteId: number): Promise<Horario[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await horariosService.getByEstudiante(estudianteId);
      return data;
    } catch (err: any) {
      setError(err.message || 'Error al cargar horarios del estudiante');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createHorario = async (data: CreateHorarioDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newHorario = await horariosService.create(data);
      setHorarios((prev) => [...prev, newHorario]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear horario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateHorario = async (data: UpdateHorarioDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedHorario = await horariosService.update(data);
      setHorarios((prev) =>
        prev.map((h) => (h.id === updatedHorario.id ? updatedHorario : h))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar horario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteHorario = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await horariosService.delete(id);
      setHorarios((prev) => prev.filter((h) => h.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar horario');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHorarios();
  }, []);

  return {
    horarios,
    loading,
    error,
    fetchHorarios,
    getHorario,
    getHorariosByProfesor,
    getHorariosByEstudiante,
    createHorario,
    updateHorario,
    deleteHorario,
  };
}
