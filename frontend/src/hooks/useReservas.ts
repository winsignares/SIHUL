import { useState, useEffect } from 'react';
import { reservasService } from '../services/reservas/reservasService';
import type { Reserva, CreateReservaDto, UpdateReservaDto } from '../models/reserva';

export function useReservas() {
  const [reservas, setReservas] = useState<Reserva[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchReservas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await reservasService.getAll();
      setReservas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar reservas');
    } finally {
      setLoading(false);
    }
  };

  const getReserva = async (id: number): Promise<Reserva | null> => {
    setLoading(true);
    setError(null);
    try {
      const reserva = await reservasService.getById(id);
      return reserva;
    } catch (err: any) {
      setError(err.message || 'Error al cargar reserva');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const createReserva = async (data: CreateReservaDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const newReserva = await reservasService.create(data);
      setReservas((prev) => [...prev, newReserva]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateReserva = async (data: UpdateReservaDto): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedReserva = await reservasService.update(data);
      setReservas((prev) =>
        prev.map((r) => (r.id === updatedReserva.id ? updatedReserva : r))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteReserva = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await reservasService.delete(id);
      setReservas((prev) => prev.filter((r) => r.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const aprobarReserva = async (id: number, observaciones?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedReserva = await reservasService.aprobar(id);
      setReservas((prev) =>
        prev.map((r) => (r.id === updatedReserva.id ? updatedReserva : r))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al aprobar reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const rechazarReserva = async (id: number, observaciones: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedReserva = await reservasService.rechazar(id);
      setReservas((prev) =>
        prev.map((r) => (r.id === updatedReserva.id ? updatedReserva : r))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al rechazar reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const cancelarReserva = async (id: number, observaciones?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updatedReserva = await reservasService.cancelar(id);
      setReservas((prev) =>
        prev.map((r) => (r.id === updatedReserva.id ? updatedReserva : r))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al cancelar reserva');
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  return {
    reservas,
    loading,
    error,
    fetchReservas,
    getReserva,
    createReserva,
    updateReserva,
    deleteReserva,
    aprobarReserva,
    rechazarReserva,
    cancelarReserva,
  };
}
