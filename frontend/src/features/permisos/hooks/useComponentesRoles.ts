import { useState, useEffect, useMemo } from 'react';
import { 
  componenteService, 
  componenteRolService
} from '../../../services/componentes/componentesAPI';
import type {
  AlcancePermisos,
  Componente,
  ComponenteRol,
  CreateComponenteRolPayload,
  UpdateComponenteRolPayload
} from '../../../services/componentes/componentesAPI';
import { rolService } from '../../users/services/authService';
import type { Rol } from '../../users/services/authService';
import { getSessionCacheData, setSessionCacheData } from '../../../core/sessionCache';
import { esComponenteFinanciero, normalizeFinancialRole } from '../../../context/financialRoleUtils';
import { useActualizacionEnVivo } from '../../../hooks/useActualizacionEnVivo';

const COMPONENTES_ROLES_CACHE_KEY = 'permisos-componentes-roles';

/** Roles que solo administra el administrador general (financieros y de administración general). */
const esRolReservado = (nombre: string): boolean =>
  normalizeFinancialRole(nombre) !== undefined || nombre.trim().toLowerCase() === 'admin_global';

interface UseComponentesRolesReturn {
  // Alcance: administrador general (elige plantilla o seccional) o de una seccional (trabaja con la suya)
  alcance: AlcancePermisos | null;
  /** Seccional cuyos ajustes se editan; null = plantilla general (solo el administrador general). */
  seccionalActiva: number | null;
  seleccionarSeccional: (seccionalId: number | null) => void;
  /** Todas las filas cargadas de un rol: la plantilla general y, si hay seccional activa, sus ajustes. */
  obtenerFilasPorRol: (rolId: number) => ComponenteRol[];

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
  const [alcance, setAlcance] = useState<AlcancePermisos | null>(null);
  const [seccionElegida, setSeccionElegida] = useState<number | null>(null);

  // El administrador de una seccional siempre trabaja con la suya; el general elige (o la plantilla general).
  const seccionalActiva = alcance && !alcance.es_general ? (alcance.seccional?.id ?? null) : seccionElegida;
  
  // Estados de paginación y búsqueda
  const [paginaActual, setPaginaActual] = useState<number>(1);
  const [terminoBusqueda, setTerminoBusqueda] = useState<string>('');
  const itemsPorPagina = 5;

  /**
   * Filtrar roles por término de búsqueda
   */
  const rolesFiltrados = useMemo(() => {
    const visibles = alcance && !alcance.es_general ? roles.filter(rol => !esRolReservado(rol.nombre)) : roles;
    if (!terminoBusqueda.trim()) return visibles;
    
    const termino = terminoBusqueda.toLowerCase();
    return visibles.filter(rol => 
      rol.nombre.toLowerCase().includes(termino) ||
      (rol.descripcion && rol.descripcion.toLowerCase().includes(termino))
    );
  }, [roles, terminoBusqueda, alcance]);

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
  const cargarDatos = async ({ force = false, silent = false }: { force?: boolean; silent?: boolean } = {}) => {
    if (!silent) setLoading(true);
    setError(null);
    
    try {
      const activeToken = localStorage.getItem('auth_token');
      const alcanceActual = alcance ?? await componenteRolService.alcance();
      if (!alcance) setAlcance(alcanceActual);
      const seccionDeseada = alcanceActual.es_general ? seccionElegida : (alcanceActual.seccional?.id ?? null);
      const claveCache = `${COMPONENTES_ROLES_CACHE_KEY}-${seccionDeseada ?? 'general'}`;
      const cachedData = force
        ? null
        : getSessionCacheData<{
            componentes: Componente[];
            roles: Rol[];
            asignaciones: ComponenteRol[];
          }>(claveCache, activeToken);

      if (cachedData) {
        setComponentes(cachedData.componentes);
        setRoles(cachedData.roles);
        setAsignaciones(cachedData.asignaciones);
      }

      // Cargar en paralelo componentes, roles y asignaciones
      const [componentesRes, rolesRes, asignacionesRes] = await Promise.all([
        componenteService.list(),
        rolService.listarRoles(),
        componenteRolService.list(seccionDeseada ? { seccional: seccionDeseada } : undefined)
      ]);

      const componentesData = componentesRes.componentes || [];
      const rolesData = rolesRes.roles || [];
      const asignacionesData = asignacionesRes.componente_roles || [];

      // Los componentes financieros los asigna solo el administrador general
      const componentesVisibles = alcanceActual.es_general
        ? componentesData
        : componentesData.filter(c => !esComponenteFinanciero(c.nombre));
      setComponentes(componentesVisibles);
      setRoles(rolesData);
      setAsignaciones(asignacionesData);
      setSessionCacheData(claveCache, activeToken, {
        componentes: componentesVisibles,
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
  const obtenerFilasPorRol = (rolId: number): ComponenteRol[] => {
    return asignaciones.filter(a => a.rol_id === rolId);
  };

  /**
   * Permisos que el rol tiene de verdad: la plantilla general, con los ajustes de la seccional activa encima
   * (un ajuste «Sin acceso» quita el componente).
   */
  const obtenerAsignacionesPorRol = (rolId: number): ComponenteRol[] => {
    const porComponente = new Map<number, ComponenteRol>();
    const filas = obtenerFilasPorRol(rolId);
    filas.filter(f => !f.seccional_id).forEach(f => porComponente.set(f.componente_id, f));
    filas.filter(f => !!f.seccional_id).forEach(f => porComponente.set(f.componente_id, f));
    return Array.from(porComponente.values()).filter(f => f.permiso !== 'NINGUNO');
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

  // Alguien más cambió componentes, permisos o roles: la matriz se vuelve a leer sin spinner (cada cambio se guarda al instante).
  useActualizacionEnVivo(['componentes', 'componentes-rol', 'componentes-usuario', 'roles', 'seccionales'], () => {
    void cargarDatos({ force: true, silent: true });
  });

  // Cargar datos al montar el componente y cada vez que el administrador general cambia de seccional
  useEffect(() => {
    cargarDatos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seccionElegida]);

  return {
    alcance,
    seccionalActiva,
    seleccionarSeccional: setSeccionElegida,
    obtenerFilasPorRol,

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
