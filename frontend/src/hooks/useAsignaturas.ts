import { useState, useEffect, useMemo } from 'react';
import { asignaturasService } from '../services/asignaturas/asignaturasService';
import type { Asignatura, CreateAsignaturaDto, UpdateAsignaturaDto } from '../models/asignatura';

interface AsignaturaFilters {
  searchTerm?: string;
  facultadId?: number | null;
  programaId?: number | null;
  semestre?: number | null;
}

export function useAsignaturas(programas?: any[], filters?: AsignaturaFilters) {
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAsignaturas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await asignaturasService.getAll();
      setAsignaturas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar asignaturas');
      setAsignaturas([]);
    } finally {
      setLoading(false);
    }
  };

  const getAsignatura = async (id: number): Promise<Asignatura | null> => {
    setLoading(true);
    setError(null);
    try {
      const asignatura = await asignaturasService.getById(id);
      return asignatura;
    } catch (err: any) {
      setError(err.message || 'Error al cargar asignatura');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Validaciones
  const validateAsignatura = (data: Partial<CreateAsignaturaDto>): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!data.codigo?.trim()) {
      errors.push('El código es obligatorio');
    }

    if (!data.nombre?.trim()) {
      errors.push('El nombre es obligatorio');
    }

    if (!data.programa_id) {
      errors.push('Debe seleccionar un programa');
    }

    if (!data.creditos || data.creditos < 1) {
      errors.push('Los créditos deben ser mayor a 0');
    }

    if (!data.horas_semana || data.horas_semana < 1) {
      errors.push('Las horas semanales deben ser mayor a 0');
    }

    if (!data.semestre || data.semestre < 1) {
      errors.push('El semestre debe ser mayor a 0');
    }

    return { valid: errors.length === 0, errors };
  };

  const createAsignatura = async (data: CreateAsignaturaDto): Promise<boolean> => {
    const validation = validateAsignatura(data);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const newAsignatura = await asignaturasService.create(data);
      setAsignaturas((prev) => [...prev, newAsignatura]);
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al crear asignatura');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateAsignatura = async (data: UpdateAsignaturaDto): Promise<boolean> => {
    const validation = validateAsignatura(data);
    if (!validation.valid) {
      setError(validation.errors.join(', '));
      return false;
    }

    setLoading(true);
    setError(null);
    try {
      const updatedAsignatura = await asignaturasService.update(data);
      setAsignaturas((prev) =>
        prev.map((a) => (a.id === updatedAsignatura.id ? updatedAsignatura : a))
      );
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al actualizar asignatura');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const deleteAsignatura = async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await asignaturasService.delete(id);
      setAsignaturas((prev) => prev.filter((a) => a.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || 'Error al eliminar asignatura');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Filtros y búsqueda
  const filteredAsignaturas = useMemo(() => {
    let result = [...asignaturas];

    // Búsqueda por texto
    if (filters?.searchTerm) {
      const search = filters.searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.codigo.toLowerCase().includes(search) ||
          a.nombre.toLowerCase().includes(search)
      );
    }

    // Filtro por programa
    if (filters?.programaId) {
      result = result.filter((a) => a.programa_id === filters.programaId);
    }

    // Filtro por facultad (indirecto a través de programa)
    if (filters?.facultadId && programas) {
      result = result.filter((a) => {
        const programa = programas.find((p: any) => p.id === a.programa_id);
        return programa?.facultad_id === filters.facultadId;
      });
    }

    // Filtro por semestre
    if (filters?.semestre) {
      result = result.filter((a) => a.semestre === filters.semestre);
    }

    return result;
  }, [asignaturas, filters, programas]);

  // Obtener semestres disponibles
  const getSemestresDisponibles = (programaId?: number | null): number[] => {
    if (!programaId && programas) {
      // Sin programa seleccionado: todos los semestres de todas las asignaturas
      return Array.from(new Set(asignaturas.map((a) => a.semestre))).sort((a, b) => a - b);
    }

    if (programaId && programas) {
      const programa = programas.find((p: any) => p.id === programaId);
      if (programa?.numero_semestres) {
        return Array.from({ length: programa.numero_semestres }, (_, i) => i + 1);
      }
    }

    return [];
  };

  // Obtener nombre de programa
  const getProgramaNombre = (programaId: number): string => {
    if (!programas) return 'Sin programa';
    const programa = programas.find((p: any) => p.id === programaId);
    return programa?.nombre || 'Sin programa';
  };

  useEffect(() => {
    fetchAsignaturas();
  }, []);

  return {
    asignaturas: filteredAsignaturas,
    allAsignaturas: asignaturas,
    loading,
    error,
    fetchAsignaturas,
    getAsignatura,
    createAsignatura,
    updateAsignatura,
    deleteAsignatura,
    validateAsignatura,
    getSemestresDisponibles,
    getProgramaNombre,
  };
}
