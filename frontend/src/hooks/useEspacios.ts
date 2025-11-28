import { useState, useEffect, useMemo } from 'react';
import { espaciosService } from '../services/espacios/espaciosService';
import type { Espacio, CreateEspacioDto, UpdateEspacioDto } from '../models/espacio';

interface EspacioFilters {
  searchTerm?: string;
  sedeId?: number | null;
  tipo?: string | null;
  activo?: boolean | null;
}

export function useEspacios(filters?: EspacioFilters) {
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEspacios = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await espaciosService.getAll();
      setEspacios(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar espacios');
    } finally {
      setLoading(false);
    }
  };

  const getEspacio = async (id: number): Promise<Espacio | null> => {
    setLoading(true);
    setError(null);
    try {
      const espacio = await espaciosService.getById(id);
      return espacio;
    } catch (err: any) {
      setError(err.message || 'Error al cargar espacio');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validateEspacio = (data: Partial<CreateEspacioDto>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nombre?.trim()) {
      errors.push('El nombre es obligatorio');
    }

    if (!data.codigo?.trim()) {
      errors.push('El código es obligatorio');
    }

    if (!data.sede_id) {
      errors.push('Debe seleccionar una sede');
    }

    if (!data.capacidad || data.capacidad < 1) {
      errors.push('La capacidad debe ser mayor a 0');
    }

    if (!data.tipo) {
      errors.push('Debe seleccionar un tipo de espacio');
    }

    return { valid: errors.length === 0, errors };
  };

  const createEspacio = async (data: CreateEspacioDto): Promise<boolean> => {
    const validation = validateEspacio(data);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const newEspacio = await espaciosService.create(data);
      setEspacios((prev) => [...prev, newEspacio]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear espacio');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateEspacio = async (data: UpdateEspacioDto): Promise<boolean> => {
    const validation = validateEspacio(data);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedEspacio = await espaciosService.update(data);
      setEspacios((prev) =>
        prev.map((e) => (e.id === updatedEspacio.id ? updatedEspacio : e))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar espacio');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteEspacio = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await espaciosService.delete(id);
      setEspacios((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar espacio');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Filtros y búsqueda
  const filteredEspacios = useMemo(() => {
    let result = [...espacios];

    // Búsqueda por texto
    if (filters?.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      result = result.filter(
        (e) =>
          e.nombre.toLowerCase().includes(search) ||
          e.codigo.toLowerCase().includes(search)
      );
    }

    // Filtro por sede
    if (filters?.sedeId) {
      result = result.filter((e) => e.sede_id === filters.sedeId);
    }

    // Filtro por tipo
    if (filters?.tipo) {
      result = result.filter((e) => e.tipo === filters.tipo);
    }

    // Filtro por disponibilidad
    if (filters?.activo !== undefined && filters?.activo !== null) {
      result = result.filter((e) => e.activo === filters.activo);
    }

    return result;
  }, [espacios, filters]);

  // Obtener nombre de espacio
  const getEspacioNombre = (id: number): string => {
    const espacio = espacios.find((e) => e.id === id);
    return espacio?.nombre || 'Sin espacio';
  };

  // Obtener espacios por sede
  const getEspaciosBySede = (sedeId: number | null): Espacio[] => {
    if (!sedeId) return espacios;
    return espacios.filter((e) => e.sede_id === sedeId);
  };

  useEffect(() => {
    fetchEspacios();
  }, []);

  return {
    espacios: filteredEspacios,
    allEspacios: espacios,
    loading,
    error,
    fetchEspacios,
    getEspacio,
    createEspacio,
    updateEspacio,
    deleteEspacio,
    validateEspacio,
    getEspacioNombre,
    getEspaciosBySede,
  };
}
