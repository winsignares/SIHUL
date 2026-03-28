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
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const COMPONENTES_ROLES_CACHE_KEY = 'permisos-componentes-roles';

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
  
  // Carga de datos
  cargarDatos: (options?: { force?: boolean }) => Promise<void>;
  
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
  const cargarDatos = async ({ force = false }: { force?: boolean } = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const activeToken = localStorage.getItem('auth_token');
      const cachedData = force
        ? null
        : getSessionCacheData<{
            componentes: Componente[];
            roles: Rol[];
            asignaciones: ComponenteRol[];
          }>(COMPONENTES_ROLES_CACHE_KEY, activeToken);

      if (cachedData) {
        setComponentes(cachedData.componentes);
        setRoles(cachedData.roles);
        setAsignaciones(cachedData.asignaciones);
        return;
      }

      // Cargar en paralelo componentes, roles y asignaciones
      const [componentesRes, rolesRes, asignacionesRes] = await Promise.all([
        componenteService.list(),
        rolService.listarRoles(),
        componenteRolService.list()
      ]);

      const componentesData = componentesRes.componentes || [];
      const rolesData = rolesRes.roles || [];
      const asignacionesData = asignacionesRes.componente_roles || [];

      setComponentes(componentesData);
      setRoles(rolesData);
      setAsignaciones(asignacionesData);
      setSessionCacheData(COMPONENTES_ROLES_CACHE_KEY, activeToken, {
        componentes: componentesData,
        roles: rolesData,
        asignaciones: asignacionesData
      });
    } catch (err) {
      console.error('Error al cargar datos:', err);
      setError(err instanceof Error ? err.message : 'Error desconocido al cargar datos');
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
      await cargarDatos({ force: true });
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
      await cargarDatos({ force: true });
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
      await cargarDatos({ force: true });
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
    
    // Carga de datos
    cargarDatos,
    
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
