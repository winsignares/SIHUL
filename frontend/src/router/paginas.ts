import { lazyConReintento } from '../core/cargaConReintento';

// Páginas que carga el router, todas en diferido para mejorar el rendimiento.

// Públicas y de acceso
export const Login = lazyConReintento(() => import('../features/users/pages/Login'));
export const Register = lazyConReintento(() => import('../features/users/pages/Register'));
export const PublicDashboard = lazyConReintento(() => import('../features/dashboard/pages/PublicDashboard'));
export const PublicConsultaHorario = lazyConReintento(() => import('../features/horarios/pages/PublicConsultaHorario'));
export const PublicPrestamo = lazyConReintento(() => import('../features/prestamos/pages/PublicPrestamo'));
export const AsistentePublicoEmbebido = lazyConReintento(() => import('../features/chatbot/pages/AsistentePublicoEmbebido'));

// Compartidas por varios roles
export const ConsultaEspacios = lazyConReintento(() => import('../features/espacios/pages/ConsultaEspacios'));
export const AsistentesVirtuales = lazyConReintento(() => import('../features/chatbot/pages/AsistentesVirtuales'));
export const EstadoRecursos = lazyConReintento(() => import('../features/gestionAcademica/pages/EstadoRecursos'));
export const MiHorario = lazyConReintento(() => import('../features/horarios/pages/MiHorario'));
export const Notificaciones = lazyConReintento(() => import('../features/users/pages/Notificaciones'));
export const Ajustes = lazyConReintento(() => import('../features/users/pages/Ajustes'));
export const EnConstruccion = lazyConReintento(() => import('../pages/shared/EnConstruccion'));
export const DynamicComponentPage = lazyConReintento(() => import('../pages/shared/DynamicComponentPage'));

// Administración y planeación
export const DashboardHome = lazyConReintento(() => import('../features/dashboard/pages/DashboardHome'));
export const FacultadesPrograms = lazyConReintento(() => import('../features/gestionAcademica/pages/FacultadesPrograms'));
export const CentroHorarios = lazyConReintento(() => import('../features/gestionAcademica/pages/CentroHorarios'));
export const PrestamosEspacios = lazyConReintento(() => import('../features/espacios/pages/PrestamosEspacios'));
export const PeriodosAcademicos = lazyConReintento(() => import('../features/gestionAcademica/pages/PeriodosAcademicos'));
export const GestionChatbots = lazyConReintento(() => import('../features/chatbot/pages/GestionChatbots'));
export const OcupacionSemanal = lazyConReintento(() => import('../features/reporte/pages/OcupacionSemanal'));
export const Reportes = lazyConReintento(() => import('../features/reporte/pages/Reportes'));
export const GestionUsuarios = lazyConReintento(() => import('../features/gestionAcademica/pages/GestionUsuarios'));
export const SolicitudesEspacio = lazyConReintento(() => import('../features/gestionAcademica/pages/SolicitudesEspacio'));
export const ComponentesRoles = lazyConReintento(() => import('../features/permisos/pages/ComponentesRoles'));
export const GestionRoles = lazyConReintento(() => import('../features/permisos/pages/GestionRoles'));
export const AsignacionEspaciosSeccionalPage = lazyConReintento(() => import('../features/gestionAcademica/pages/AsignacionEspaciosSeccionalPage'));

// Supervisores
export const SupervisorGeneralHome = lazyConReintento(() => import('../features/dashboard/pages/SupervisorGeneralHome'));
export const SupervisorSalonHome = lazyConReintento(() => import('../features/espacios/pages/SupervisorSalonHome'));

// Docentes y estudiantes
export const ConsultorDocenteHome = lazyConReintento(() => import('../features/dashboard/pages/ConsultorDocenteHome'));
export const DocentePrestamos = lazyConReintento(() => import('../features/prestamos/pages/DocentePrestamos'));
export const ConsultorEstudianteHome = lazyConReintento(() => import('../features/dashboard/pages/ConsultorEstudianteHome'));

// Financiero
export const FuncionarioDashboard = lazyConReintento(() => import('../features/financiero/pages/funcionario'));
export const ProveedorDashboard = lazyConReintento(() => import('../features/financiero/pages/proveedor'));
export const ProveedorFacturaDetalle = lazyConReintento(() => import('../features/financiero/pages/proveedor/FacturaDetalle'));
export const RegistroProveedor = lazyConReintento(() => import('../features/financiero/pages/proveedor/RegistroProveedor'));
export const ContabilidadDashboard = lazyConReintento(() => import('../features/financiero/pages/contabilidad'));
export const TesoreriaDashboard = lazyConReintento(() => import('../features/financiero/pages/tesoreria'));
export const AuditoriaDashboard = lazyConReintento(() => import('../features/financiero/pages/auditoria'));
export const DireccionFinancieraDashboard = lazyConReintento(() => import('../features/financiero/pages/direccion_financiera'));
export const RectoriaDashboard = lazyConReintento(() => import('../features/financiero/pages/rectoria'));
export const AdminFinancieroDashboard = lazyConReintento(() => import('../features/financiero/pages/admin_financiero'));
