import { useState, useEffect, useMemo } from 'react';
import { facultadesService } from '../services/facultades/facultadesService';
import type { Facultad, CreateFacultadDto, UpdateFacultadDto } from '../models/facultad';

interface FacultadFilters {
  searchTerm?: string;
  activo?: boolean | null;
}

export function useFacultades(filters?: FacultadFilters) {
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFacultades = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await facultadesService.getAll();
      setFacultades(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar facultades');
    } finally {
      setLoading(false);
    }
  };

  const getFacultad = async (id: number): Promise<Facultad | null> => {
    setLoading(true);
    setError(null);
    try {
      const facultad = await facultadesService.getById(id);
      return facultad;
    } catch (err: any) {
      setError(err.message || 'Error al cargar facultad');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validateFacultad = (data: Partial<CreateFacultadDto>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nombre?.trim()) {
      errors.push('El nombre es obligatorio');
    }

    if (!data.codigo?.trim()) {
      errors.push('El código es obligatorio');
    }

    return { valid: errors.length === 0, errors };
  };

  const createFacultad = async (data: CreateFacultadDto): Promise<boolean> => {
    const validation = validateFacultad(data);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const newFacultad = await facultadesService.create(data);
      setFacultades((prev) => [...prev, newFacultad]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear facultad');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateFacultad = async (data: UpdateFacultadDto): Promise<boolean> => {
    const validation = validateFacultad(data);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedFacultad = await facultadesService.update(data);
      setFacultades((prev) =>
        prev.map((f) => (f.id === updatedFacultad.id ? updatedFacultad : f))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar facultad');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteFacultad = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await facultadesService.delete(id);
      setFacultades((prev) => prev.filter((f) => f.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar facultad');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Filtros y búsqueda
  const filteredFacultades = useMemo(() => {
    let result = [...facultades];

    // Búsqueda por texto
    if (filters?.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      result = result.filter(
        (f) =>
          f.nombre.toLowerCase().includes(search) ||
          f.codigo.toLowerCase().includes(search)
      );
    }

    // Filtro por estado activo
    if (filters?.activo !== undefined && filters?.activo !== null) {
      result = result.filter((f) => f.activo === filters.activo);
    }

    return result;
  }, [facultades, filters]);

  // Obtener facultad por ID
  const getFacultadNombre = (id: number): string => {
    const facultad = facultades.find((f) => f.id === id);
    return facultad?.nombre || 'Sin facultad';
  };

  useEffect(() => {
    fetchFacultades();
  }, []);

  return {
    facultades: filteredFacultades,
    allFacultades: facultades,
    loading,
    error,
    fetchFacultades,
    getFacultad,
    createFacultad,
    updateFacultad,
    deleteFacultad,
    validateFacultad,
    getFacultadNombre,
  };
}
