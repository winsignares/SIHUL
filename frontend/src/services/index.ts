// Exportar todos los servicios desde un solo punto
export { authService } from './auth/authService';
export { usuariosService } from './usuarios/usuariosService';
export { rolesService } from './roles/rolesService';
export { asignaturasService } from './asignaturas/asignaturasService';
export { espaciosService } from './espacios/espaciosService';
export { espaciosExtService } from './espacios/espaciosExtService';
export { facultadesService } from './facultades/facultadesService';
export { gruposService } from './grupos/gruposService';
export { horariosService } from './horarios/horariosService';
export { horariosFusionadosService } from './horarios/horariosFusionadosService';
export { periodosService } from './periodos/periodosService';
export { programasService } from './programas/programasService';
export { recursosService, espacioRecursoService } from './recursos/recursosService';
export { reservasService } from './reservas/reservasService';
export { sedesService } from './sedes/sedesService';
export { dashboardService } from './dashboard/dashboardService';
export { notificacionesService } from './notificaciones/notificacionesService';
export { reportesService } from './reportes/reportesService';
export { busquedaService } from './busqueda/busquedaService';

// Exportar tipos
export type { DashboardEstadisticas } from './dashboard/dashboardService';
export type { Notificacion } from './notificaciones/notificacionesService';
export type { 
  DisponibilidadRequest, 
  DisponibilidadResponse, 
  Conflicto,
  OcupacionEspacio 
} from './espacios/espaciosExtService';
export type { ReporteOcupacion } from './reportes/reportesService';
export type { ResultadosBusqueda } from './busqueda/busquedaService';
