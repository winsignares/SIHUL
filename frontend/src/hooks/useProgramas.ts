import { useState, useEffect, useMemo } from 'react';
import { programasService } from '../services/programas/programasService';
import type { Programa, CreateProgramaDto, UpdateProgramaDto } from '../models/programa';

interface ProgramaFilters {
  searchTerm?: string;
  facultadId?: number | null;
}

export function useProgramas(filters?: ProgramaFilters) {
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgramas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await programasService.getAll();
      setProgramas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar programas');
      setProgramas([]);
    } finally {
      setLoading(false);
    }
  };

  const getPrograma = async (id: number): Promise<Programa | null> => {
    setLoading(true);
    setError(null);
    try {
      const programa = await programasService.getById(id);
      return programa;
    } catch (err: any) {
      setError(err.message || 'Error al cargar programa');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validatePrograma = (data: Partial<CreateProgramaDto>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.nombre?.trim()) {
      errors.push('El nombre es obligatorio');
    }

    if (!data.codigo?.trim()) {
      errors.push('El código es obligatorio');
    }

    if (!data.facultad_id) {
      errors.push('Debe seleccionar una facultad');
    }

    if (!data.numero_semestres || data.numero_semestres < 1) {
      errors.push('El número de semestres debe ser mayor a 0');
    }

    return { valid: errors.length === 0, errors };
  };

  const createPrograma = async (data: CreateProgramaDto): Promise<boolean> => {
    const validation = validatePrograma(data);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const newPrograma = await programasService.create(data);
      setProgramas((prev) => [...prev, newPrograma]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear programa');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updatePrograma = async (data: UpdateProgramaDto): Promise<boolean> => {
    const validation = validatePrograma(data);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedPrograma = await programasService.update(data);
      setProgramas((prev) =>
        prev.map((p) => (p.id === updatedPrograma.id ? updatedPrograma : p))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar programa');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deletePrograma = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await programasService.delete(id);
      setProgramas((prev) => prev.filter((p) => p.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar programa');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Filtros y búsqueda
  const filteredProgramas = useMemo(() => {
    let result = [...programas];

    // Búsqueda por texto
    if (filters?.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      result = result.filter(
        (p) =>
          p.nombre.toLowerCase().includes(search) ||
          p.codigo.toLowerCase().includes(search)
      );
    }

    // Filtro por facultad
    if (filters?.facultadId) {
      result = result.filter((p) => p.facultad_id === filters.facultadId);
    }

    return result;
  }, [programas, filters]);

  // Obtener programas por facultad
  const getProgramasByFacultad = (facultadId: number | null): Programa[] => {
    if (!facultadId) return programas;
    return programas.filter((p) => p.facultad_id === facultadId);
  };

  // Obtener nombre de programa
  const getProgramaNombre = (id: number): string => {
    const programa = programas.find((p) => p.id === id);
    return programa?.nombre || 'Sin programa';
  };

  useEffect(() => {
    fetchProgramas();
  }, []);

  return {
    programas: filteredProgramas,
    allProgramas: programas,
    loading,
    error,
    fetchProgramas,
    getPrograma,
    createPrograma,
    updatePrograma,
    deletePrograma,
    validatePrograma,
    getProgramasByFacultad,
    getProgramaNombre,
  };
}
