import { useState, useEffect, useMemo } from 'react';
import { 
  componenteService, 
  componenteRolService
} from '../../services/componentes/componentesAPI';
import type {
  Componente,
  ComponenteRol,
  CreateComponenteRolPayload,
  UpdateComponenteRolPayload
} from '../../services/componentes/componentesAPI';
import { rolService } from '../../services/users/authService';
import type { Rol } from '../../services/users/authService';

interface UseComponentesRolesReturn {
  // Estados
  componentes: Componente[];
  roles: Rol[];
  asignaciones: ComponenteRol[];
  loading: boolean;
  error: string | null;
  
  // Paginación
  paginaActual: number;
  itemsPorPagina: number;
  totalPaginas: number;
  rolesPaginados: Rol[];
  cambiarPagina: (pagina: number) => void;
  
  // Búsqueda/Filtro
  terminoBusqueda: string;
  setTerminoBusqueda: (termino: string) => void;
  rolesFiltrados: Rol[];
  
  // CRUD Roles
  cargarDatos: () => Promise<void>;
  crearRol: (rol: Omit<Rol, 'id'>) => Promise<void>;
  actualizarRol: (rol: Rol) => Promise<void>;
  eliminarRol: (id: number) => Promise<void>;
  
  // CRUD Asignaciones (ComponenteRol)
  crearAsignacion: (payload: CreateComponenteRolPayload) => Promise<void>;
  actualizarAsignacion: (payload: UpdateComponenteRolPayload) => Promise<void>;
  eliminarAsignacion: (id: number) => Promise<void>;
  
  // Utilidades
  obtenerAsignacionesPorRol: (rolId: number) => ComponenteRol[];
  obtenerAsignacionesPorComponente: (componenteId: number) => ComponenteRol[];
  verificarAsignacionExiste: (componenteId: number, rolId: number) => boolean;
}

export function useComponentesRoles(): UseComponentesRolesReturn {
  const [componentes, setComponentes] = useState<Componente[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [asignaciones, setAsignaciones] = useState<ComponenteRol[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de paginación y búsqueda
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const itemsPorPagina = 5;

  /**
   * Filtrar roles por término de búsqueda
   */
  const rolesFiltrados = useMemo(() => {
    if (!terminoBusqueda.trim()) return roles;
    
    const termino = terminoBusqueda.toLowerCase();
    return roles.filter(rol => 
      rol.nombre.toLowerCase().includes(termino) ||
      (rol.descripcion && rol.descripcion.toLowerCase().includes(termino))
    );
  }, [roles, terminoBusqueda]);

  /**
   * Calcular total de páginas
   */
  const totalPaginas = useMemo(() => {
    return Math.ceil(rolesFiltrados.length / itemsPorPagina);
  }, [rolesFiltrados.length, itemsPorPagina]);

  /**
   * Obtener roles de la página actual
   */
  const rolesPaginados = useMemo(() => {
    const inicio = (paginaActual - 1) * itemsPorPagina;
    const fin = inicio + itemsPorPagina;
    return rolesFiltrados.slice(inicio, fin);
  }, [rolesFiltrados, paginaActual, itemsPorPagina]);

  /**
   * Cambiar página
   */
  const cambiarPagina = (pagina: number) => {
    if (pagina >= 1 && pagina <= totalPaginas) {
      setPaginaActual(pagina);
    }
  };

  /**
   * Reset página cuando cambia el filtro
   */
  useEffect(() => {
    setPaginaActual(1);
  }, [terminoBusqueda]);

  /**
   * Cargar todos los datos necesarios
   */
  const cargarDatos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Cargar en paralelo componentes, roles y asignaciones
      const [componentesRes, rolesRes, asignacionesRes] = await Promise.all([
        componenteService.list(),
        rolService.listarRoles(),
        componenteRolService.list()
      ]);
      
      setComponentes(componentesRes.componentes || []);
      setRoles(rolesRes.roles || []);
      setAsignaciones(asignacionesRes.componente_roles || []);
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear un nuevo rol
   */
  const crearRol = async (rol: Omit<Rol, 'id'>) => {
    setLoading(true);
    setError(null);
    
    try {
      await rolService.crearRol(rol);
      await cargarDatos();
    } catch (err) {
      console.error('Error al crear rol:', err);
      setError(err instanceof Error ? err.message : 'Error al crear rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar un rol existente
   */
  const actualizarRol = async (rol: Rol) => {
    setLoading(true);
    setError(null);
    
    try {
      await rolService.actualizarRol(rol);
      await cargarDatos();
    } catch (err) {
      console.error('Error al actualizar rol:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar un rol
   */
  const eliminarRol = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await rolService.eliminarRol(id);
      await cargarDatos();
    } catch (err) {
      console.error('Error al eliminar rol:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar rol');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Crear una nueva asignación componente-rol
   */
  const crearAsignacion = async (payload: CreateComponenteRolPayload) => {
    setLoading(true);
    setError(null);
    
    try {
      await componenteRolService.create(payload);
      await cargarDatos();
    } catch (err) {
      console.error('Error al crear asignación:', err);
      setError(err instanceof Error ? err.message : 'Error al crear asignación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Actualizar una asignación existente (cambiar permiso)
   */
  const actualizarAsignacion = async (payload: UpdateComponenteRolPayload) => {
    setLoading(true);
    setError(null);
    
    try {
      await componenteRolService.update(payload);
      await cargarDatos();
    } catch (err) {
      console.error('Error al actualizar asignación:', err);
      setError(err instanceof Error ? err.message : 'Error al actualizar asignación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Eliminar una asignación
   */
  const eliminarAsignacion = async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await componenteRolService.delete({ id });
      await cargarDatos();
    } catch (err) {
      console.error('Error al eliminar asignación:', err);
      setError(err instanceof Error ? err.message : 'Error al eliminar asignación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Obtener asignaciones por rol
   */
  const obtenerAsignacionesPorRol = (rolId: number): ComponenteRol[] => {
    return asignaciones.filter(a => a.rol_id === rolId);
  };

  /**
   * Obtener asignaciones por componente
   */
  const obtenerAsignacionesPorComponente = (componenteId: number): ComponenteRol[] => {
    return asignaciones.filter(a => a.componente_id === componenteId);
  };

  /**
   * Verificar si existe una asignación específica
   */
  const verificarAsignacionExiste = (componenteId: number, rolId: number): boolean => {
    return asignaciones.some(
      a => a.componente_id === componenteId && a.rol_id === rolId
    );
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    cargarDatos();
  }, []);

  return {
    // Estados
    componentes,
    roles,
    asignaciones,
    loading,
    error,
    
    // Paginación
    paginaActual,
    itemsPorPagina,
    totalPaginas,
    rolesPaginados,
    cambiarPagina,
    
    // Búsqueda
    terminoBusqueda,
    setTerminoBusqueda,
    rolesFiltrados,
    
    // CRUD Roles
    cargarDatos,
    crearRol,
    actualizarRol,
    eliminarRol,
    
    // CRUD Asignaciones
    crearAsignacion,
    actualizarAsignacion,
    eliminarAsignacion,
    
    // Utilidades
    obtenerAsignacionesPorRol,
    obtenerAsignacionesPorComponente,
    verificarAsignacionExiste
  };
}
