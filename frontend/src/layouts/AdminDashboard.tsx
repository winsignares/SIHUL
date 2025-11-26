import DashboardHome from '../pages/dashboard/DashboardHome';
import FacultadesPrograms from '../pages/gestionAcademica/FacultadesPrograms';
import EspaciosFisicos from '../pages/gestionAcademica/EspaciosFisicos';
import ConsultaEspacios from '../pages/espacios/ConsultaEspacios';
import CentroHorarios from '../pages/gestionAcademica/CentroHorarios';
import PeriodosAcademicos from '../pages/gestionAcademica/PeriodosAcademicos';
import Reportes from '../pages/reporte/Reportes';
import Notificaciones from '../pages/users/Notificaciones';
import Ajustes from '../pages/users/Ajustes';
import PrestamosEspacios from '../pages/espacios/PrestamosEspacios';
import OcupacionSemanal from '../pages/reporte/OcupacionSemanal';
import AsistentesVirtuales from '../pages/chatbot/AsistentesVirtuales';
import GestionUsuarios from '../pages/gestionAcademica/GestionUsuarios';
import AsignacionAutomatica from '../pages/gestionAcademica/AsignacionAutomatica';
import EstadoRecursos from '../pages/gestionAcademica/EstadoRecursos';
import MiHorario from '../pages/horarios/MiHorario';
import SupervisorGeneralHome from '../pages/dashboard/SupervisorGeneralHome';
import ConsultorDocenteHome from '../pages/dashboard/ConsultorDocenteHome';
import ConsultorEstudianteHome from '../pages/dashboard/ConsultorEstudianteHome';
import DocentePrestamos from '../pages/prestamos/DocentePrestamos';
import SupervisorSalonHome from '../pages/espacios/SupervisorSalonHome';

import { useState, useEffect } from 'react';
import { Button } from '../share/button';
import React from 'react';
import type { ReactNode } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { db } from '../hooks/database';
import {
  LayoutDashboard,
  Building2,
  Calendar,
  Clock,
  MapPin,
  FileText,
  LogOut,
  GraduationCap,
  Bell,
  Search,
  MessageSquare,
  Settings,
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Home,
  Users,
  HandCoins,
  BarChart3,
  Shield,
  Eye,
  Zap,
  Boxes,
  Bot,
  MoreVertical,
  User,
  Wrench
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '../share/input';
import { Avatar, AvatarFallback } from '../share/avatar';
import { Badge } from '../share/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../share/tooltip';

import { useUser } from '../context/UserContext';

interface AdminDashboardProps {
  userName?: string;
  onLogout?: () => void;
  userRole?: string;
  children?: ReactNode;
}

type MenuOption = 'home' | 'facultades' | 'espacios' | 'asignacion' | 'centrohorarios' | 'periodos' | 'reportes' | 'prestamos' | 'recursos' | 'ocupacion' | 'notificaciones' | 'ajustes' | 'chat' | 'usuarios' | 'asistentes' | 'mihorario';

export default function AdminDashboard(props: AdminDashboardProps) {
  const { usuario, setUsuario } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeMenu, setActiveMenu] = useState<MenuOption>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);
  const [notificacionesSinLeer, setNotificacionesSinLeer] = useState(3);

  const shouldShowExpanded = !isSidebarCollapsed || isSidebarHovered;

  // Determinar el rol del usuario
  const userRole = usuario?.rol || props.userRole || 'admin';
  const role = userRole;
  const userName = usuario?.nombre || props.userName || 'Usuario';
  const onLogout = props.onLogout || (() => {
    // Limpiar sesión en contexto y en la db local sin recargar la página
    setUsuario(null);
    try {
      db.cerrarSesion();
    } catch (e) {
      console.warn('No se pudo limpiar la sesión local:', e);
    }
    navigate('/login');
  });

  // Sincronizar activeMenu con la ruta actual
  useEffect(() => {
    const pathToMenu: Record<string, MenuOption> = {
      '/admin/dashboard': 'home',
      '/admin/asignacion': 'asignacion',
      '/admin/centro-institucional': 'facultades',
      '/admin/centro-horarios': 'centrohorarios',
      '/admin/prestamos': 'prestamos',
      '/admin/periodos': 'periodos',
      '/admin/asistente-virtual': 'asistentes',
      '/supervisor/asistente-virtual': 'asistentes',
      '/docente/asistente-virtual': 'asistentes',
      '/estudiante/asistente-virtual': 'asistentes',
      '/admin/ocupacion': 'ocupacion',
      '/admin/reportes': 'reportes',
      '/admin/usuarios': 'usuarios',
      '/admin/espacios': 'espacios',
      '/admin/recursos': 'recursos',
      '/supervisor/dashboard': 'home',
      '/supervisor/espacios': 'espacios',
      '/supervisor/prestamos': 'prestamos',
      '/supervisor/recursos': 'recursos',
      '/docente/dashboard': 'home',
      '/docente/horario': 'mihorario',
      '/docente/prestamos': 'prestamos',
      '/estudiante/dashboard': 'home',
      '/estudiante/mi-horario': 'mihorario',
      '/notificaciones': 'notificaciones',
      '/ajustes': 'ajustes'
    };
    // Buscar la mejor coincidencia por prefijo (soporta barras finales o parámetros)
    const keys = Object.keys(pathToMenu).sort((a, b) => b.length - a.length);
    let found: MenuOption | undefined;
    for (const k of keys) {
      if (location.pathname === k || location.pathname.startsWith(k + '/') || location.pathname.startsWith(k)) {
        found = pathToMenu[k];
        break;
      }
    }
    const menu = found || 'home';
    setActiveMenu(menu);
  }, [location.pathname]);

  // Cuando la ruta cambia (el usuario hizo click en un Link), colapsar la sidebar
  useEffect(() => {
    setIsSidebarCollapsed(true);
  }, [location.pathname]);

  // Menús por rol
  const menuByRole: Record<string, Array<{ id: string; label: string; items: any[] }>> = {
    admin: [
      {
        id: 'principal',
        label: 'Principal',
        items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
      },
      {
        id: 'gestion',
        label: 'Gestión Académica',
        items: [
          { id: 'facultades', icon: Building2, label: 'Centro Institucional', action: 'facultades' },
          { id: 'prestamos', icon: HandCoins, label: 'Préstamos de Espacios', action: 'prestamos' },
          { id: 'asignacion', icon: Zap, label: 'Asignación Automática', action: 'asignacion' },
          { id: 'centrohorarios', icon: Clock, label: 'Centro Horarios', action: 'centrohorarios' },
          { id: 'periodos', icon: Calendar, label: 'Períodos Académicos', action: 'periodos' },
          { id: 'asistentes', icon: Bot, label: 'Asistentes Virtuales', action: 'asistentes' }
        ]
      },
      {
        id: 'reportes',
        label: 'Reportes y Análisis',
        items: [
          { id: 'ocupacion', icon: BarChart3, label: 'Ocupación Semanal', action: 'ocupacion' },
          { id: 'reportes', icon: FileText, label: 'Reportes Generales', action: 'reportes' }
        ]
      },
      {
        id: 'administracion',
        label: 'Administración',
        items: [{ id: 'usuarios', icon: Shield, label: 'Gestión de Usuarios', action: 'usuarios' }]
      }
    ],
    autorizado: [
      {
        id: 'principal',
        label: 'Principal',
        items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
      },
      {
        id: 'gestion',
        label: 'Gestión de Espacios',
        items: [
          { id: 'prestamos', icon: HandCoins, label: 'Préstamos de Espacios', action: 'prestamos' },
          { id: 'centrohorarios', icon: Clock, label: 'Centro Horarios', action: 'centrohorarios' }
        ]
      },
      {
        id: 'reportes',
        label: 'Reportes y Análisis',
        items: [{ id: 'ocupacion', icon: BarChart3, label: 'Ocupación Semanal', action: 'ocupacion' }]
      }
    ],
    consultor: [
      {
        id: 'principal',
        label: 'Principal',
        items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
      },
      {
        id: 'academico',
        label: 'Académico',
        items: [
          { id: 'mihorario', icon: Clock, label: 'Mi Horario', action: 'mihorario' }
        ]
      }
    ],
    'supervisor_general': [
      {
        id: 'principal',
        label: 'Principal',
        items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
      },
      {
        id: 'gestion',
        label: 'Gestión de Espacios',
        items: [
          { id: 'espacios', icon: MapPin, label: 'Disponibilidad de Espacios', action: 'espacios' },
          { id: 'prestamos', icon: HandCoins, label: 'Apertura y Cierre de Salones', action: 'prestamos' },
          { id: 'recursos', icon: Wrench, label: 'Estado de Recursos', action: 'recursos' },
          { id: 'asistentes', icon: Bot, label: 'Asistente Virtual', action: 'asistentes' }
        ]
      }
    ],
    'consultor_docente': [
      {
        id: 'principal',
        label: 'Principal',
        items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
      },
      {
        id: 'academico',
        label: 'Académico',
        items: [
          { id: 'mihorario', icon: Clock, label: 'Mi Horario', action: 'mihorario' },
          { id: 'prestamos', icon: HandCoins, label: 'Préstamos de Espacios', action: 'prestamos' },
          { id: 'asistentes', icon: Bot, label: 'Asistente Virtual', action: 'asistentes' }
        ]
      }
    ],
    'consultor_estudiante': [
      {
        id: 'principal',
        label: 'Principal',
        items: [{ id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }]
      },
      {
        id: 'academico',
        label: 'Académico',
        items: [
          { id: 'mihorario', icon: Clock, label: 'Mi Horario', action: 'mihorario' },
          { id: 'asistentes', icon: Bot, label: 'Asistente Virtual', action: 'asistentes' }
        ]
      }
    ]
  };

  const menuSections = menuByRole[role] || menuByRole['admin'];

  // Mapear acciones de menú a rutas (AppRouter debería manejar la navegación)
  const menuToPath = (menu: MenuOption): string => {
    const mapping: Record<MenuOption, string> = {
      home: userRole === 'admin' ? '/admin/dashboard' : userRole === 'supervisor_general' ? '/supervisor/dashboard' : userRole === 'consultor_docente' ? '/docente/dashboard' : '/estudiante/dashboard',
      facultades: '/admin/centro-institucional',
      espacios: userRole === 'supervisor_general' ? '/supervisor/espacios' : '/admin/espacios',
      asignacion: '/admin/asignacion',
      centrohorarios: '/admin/centro-horarios',
      periodos: '/admin/periodos',
      reportes: '/admin/reportes',
      prestamos: userRole === 'admin' ? '/admin/prestamos' : userRole === 'supervisor_general' ? '/supervisor/prestamos' : '/docente/prestamos',
      recursos: userRole === 'supervisor_general' ? '/supervisor/recursos' : '/admin/recursos',
      ocupacion: '/admin/ocupacion',
      notificaciones: '/notificaciones',
      ajustes: '/ajustes',
      chat: '/admin/chat',
      usuarios: '/admin/usuarios',
      asistentes: userRole === 'admin' ? '/admin/asistente-virtual' : userRole === 'supervisor_general' ? '/supervisor/asistente-virtual' : userRole === 'consultor_docente' ? '/docente/asistente-virtual' : '/estudiante/asistente-virtual',
      mihorario: userRole === 'consultor_docente' ? '/docente/horario' : '/estudiante/mi-horario'
    };
    return mapping[menu] || '/';
  };

  const handleMenuChange = (menu: MenuOption) => {
    // Mantener el estado visual del menú (colapsar la sidebar) pero NO navegar directamente.
    setActiveMenu(menu);
    setIsSidebarCollapsed(true);
  };

  const renderContent = () => {
    const navigateTo = (page: string) => {
      setActiveMenu(page as MenuOption);
    };

    switch (activeMenu) {
      case 'home':
        // Renderizar dashboard específico según el rol
        if (userRole === 'admin') {
          return <DashboardHome onNavigate={navigateTo} />;
        } else if (userRole === 'supervisor_general') {
          return (
            <SupervisorGeneralHome
              onNavigate={(action: string) => {
                // Mapear acciones rápidas del dashboard a opciones de menú
                if (action === 'cronograma') {
                  handleMenuChange('espacios');
                } else if (action === 'apertura-cierre') {
                  handleMenuChange('prestamos');
                } else if (action === 'estado-recursos') {
                  handleMenuChange('recursos');
                } else {
                  // intentamos usar el action como MenuOption si coincide
                  try {
                    handleMenuChange(action as MenuOption);
                  } catch (e) {
                    // fallback: ir al dashboard
                    handleMenuChange('home');
                  }
                }
              }}
            />
          );
        } else if (userRole === 'consultor_docente') {
          return (
            <ConsultorDocenteHome
              onNavigate={(action: string) => {
                if (action === 'horario') {
                  handleMenuChange('mihorario');
                } else if (action === 'prestamos') {
                  handleMenuChange('prestamos');
                } else if (action === 'asistentes') {
                  handleMenuChange('asistentes');
                } else {
                  try { handleMenuChange(action as MenuOption); } catch (e) { handleMenuChange('home'); }
                }
              }}
            />
          );
        } else if (userRole === 'consultor_estudiante') {
          return (
            <ConsultorEstudianteHome
              onNavigate={(action: string) => {
                if (action === 'horario') {
                  handleMenuChange('mihorario');
                } else if (action === 'asistentes') {
                  handleMenuChange('asistentes');
                } else {
                  try { handleMenuChange(action as MenuOption); } catch (e) { handleMenuChange('home'); }
                }
              }}
            />
          );
        } else {
          return <DashboardHome onNavigate={navigateTo} />;
        }
      case 'facultades':
        return <FacultadesPrograms />;
      case 'espacios':
        // Supervisores generales deben ver la vista de consulta ligera
        if (userRole === 'supervisor_general') {
          return <ConsultaEspacios />;
        }
        return <EspaciosFisicos />;
      case 'recursos':
        return <EstadoRecursos />;
      case 'prestamos':
        // Mostrar componente de préstamos según el rol activo
        if (userRole === 'consultor_docente') {
          return <DocentePrestamos />;
        }
        if (userRole === 'supervisor_general') {
          return <SupervisorSalonHome />;
        }
        // Administradores y otros usan la vista general de préstamos
        return <PrestamosEspacios />;
      case 'centrohorarios':
        return <CentroHorarios />;
      case 'asignacion':
        return <AsignacionAutomatica />;
      case 'periodos':
        return <PeriodosAcademicos />;
      case 'ocupacion':
        return <OcupacionSemanal />;
      case 'reportes':
        return <Reportes />;
      case 'notificaciones':
        return <Notificaciones onNotificacionesChange={setNotificacionesSinLeer} />;
      case 'chat':
        return <AsistentesVirtuales />;
      case 'ajustes':
        return <Ajustes />;
      case 'usuarios':
        return <GestionUsuarios />;
      case 'asistentes':
        return <AsistentesVirtuales />;
      case 'mihorario':
        return <MiHorario />;
      default:
        return <DashboardHome onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <TooltipProvider>
        <motion.aside
          onMouseEnter={() => setIsSidebarHovered(true)}
          onMouseLeave={() => setIsSidebarHovered(false)}
          animate={{ width: shouldShowExpanded ? 280 : 80 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-gradient-to-b from-red-900 via-red-800 to-red-950 flex flex-col relative shadow-2xl z-50"
        >
          {/* Logo + Nombre */}
          <div className="p-6 border-b border-red-700/50 flex items-center justify-center">
            <motion.div
              className="flex items-center gap-3"
              animate={{ justifyContent: shouldShowExpanded ? 'flex-start' : 'center' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <GraduationCap className="w-7 h-7 text-red-900" />
              </div>
              <AnimatePresence>
                {shouldShowExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-white whitespace-nowrap">SIHUL</h1>
                    <p className="text-red-300 whitespace-nowrap text-xs">Administrador de Planeación</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Barra de Búsqueda */}
          <div className="p-4 border-b border-red-700/50">
            <AnimatePresence>
              {shouldShowExpanded ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-red-300" />
                  <Input
                    placeholder="Buscar..."
                    className="pl-9 pr-3 h-10 bg-red-800/50 border-red-700 text-white placeholder:text-red-300 focus:ring-2 focus:ring-yellow-500/20 focus:border-yellow-500"
                  />
                </motion.div>
              ) : (
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <motion.button
                      className="w-full flex items-center justify-center p-2.5 rounded-xl bg-red-800/50 hover:bg-red-700/50 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Search className="w-5 h-5 text-red-300" />
                    </motion.button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-red-900 text-white border-red-700">
                    Buscar
                  </TooltipContent>
                </Tooltip>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto scrollbar-hidden">
            <div className="space-y-6">
              {menuSections.map((section) => (
                <div key={section.id}>
                  {/* Section Header - Solo visible cuando expandido */}
                  <AnimatePresence>
                    {shouldShowExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-3 py-2 text-red-200 overflow-hidden"
                      >
                        <span className="uppercase tracking-wider text-xs">{section.label}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Menu Items */}
                  <div className="space-y-1 mt-2">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const path = menuToPath(item.action as MenuOption);
                      const isActive = location.pathname === path || location.pathname.startsWith(path + '/') || (path !== '/' && location.pathname.startsWith(path));

                      const content = (
                        <motion.div
                          key={item.id}
                          className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${shouldShowExpanded ? 'px-4 py-3' : 'justify-center px-3 py-3'
                            } ${isActive
                              ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 shadow-lg'
                              : 'text-red-100 hover:bg-red-700/50'
                            }`}
                          whileHover={{ x: isActive ? 0 : (shouldShowExpanded ? 4 : 0), scale: shouldShowExpanded ? 1 : 1.05 }}
                          whileTap={{ scale: 0.95 }}
                        >
                          <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-900' : 'text-red-300'}`} />
                          <AnimatePresence>
                            {shouldShowExpanded && (
                              <motion.span
                                initial={{ opacity: 0, width: 0 }}
                                animate={{ opacity: 1, width: 'auto' }}
                                exit={{ opacity: 0, width: 0 }}
                                transition={{ duration: 0.2 }}
                                className="flex-1 text-left whitespace-nowrap overflow-hidden"
                              >
                                {item.label}
                              </motion.span>
                            )}
                          </AnimatePresence>
                          {isActive && shouldShowExpanded && (
                            <motion.div
                              layoutId="activeIndicator"
                              className="w-2 h-2 bg-red-900 rounded-full flex-shrink-0"
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            />
                          )}
                        </motion.div>
                      );

                      // Envolver en NavLink para que AppRouter maneje navegación
                      const link = (
                        <Link to={path} key={item.id} className="block w-full">
                          {content}
                        </Link>
                      );

                      if (!shouldShowExpanded) {
                        return (
                          <Tooltip key={item.id} delayDuration={0}>
                            <TooltipTrigger asChild>
                              {link}
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-red-900 text-white border-red-700">
                              {item.label}
                            </TooltipContent>
                          </Tooltip>
                        );
                      }

                      return link;
                    })}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          {/* Notificaciones, Ajustes, Usuario */}
          <div className="border-t border-red-700/50 p-4 space-y-2">
            {/* Notificaciones */}
            {
              (() => {
                const path = menuToPath('notificaciones');
                const isActive = location.pathname === path || location.pathname.startsWith(path + '/') || location.pathname.startsWith(path);
                return (
                  <Link to={path} className="block w-full" key="notificaciones">
                    <motion.div
                      className={`w-full flex items-center gap-3 rounded-xl transition-all relative ${shouldShowExpanded ? 'px-4 py-3' : 'justify-center px-3 py-3'
                        } ${isActive
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 shadow-lg'
                          : 'text-red-100 hover:bg-red-700/50'
                        }`}
                      whileHover={{ scale: shouldShowExpanded ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Bell className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-900' : 'text-red-300'}`} />
                      {notificacionesSinLeer > 0 && (
                        <Badge className="absolute top-1 left-1 w-5 h-5 flex items-center justify-center p-0 bg-red-600 text-white border-2 border-red-900 text-xs">
                          {notificacionesSinLeer}
                        </Badge>
                      )}
                      <AnimatePresence>
                        {shouldShowExpanded && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 text-left whitespace-nowrap overflow-hidden"
                          >
                            Notificaciones
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                );
              })()
            }

            {/* Ajustes */}
            {
              (() => {
                const path = menuToPath('ajustes');
                const isActive = location.pathname === path || location.pathname.startsWith(path + '/') || location.pathname.startsWith(path);
                return (
                  <Link to={path} className="block w-full" key="ajustes">
                    <motion.div
                      className={`w-full flex items-center gap-3 rounded-xl transition-all ${shouldShowExpanded ? 'px-4 py-3' : 'justify-center px-3 py-3'
                        } ${isActive
                          ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 shadow-lg'
                          : 'text-red-100 hover:bg-red-700/50'
                        }`}
                      whileHover={{ scale: shouldShowExpanded ? 1 : 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Settings className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-900' : 'text-red-300'}`} />
                      <AnimatePresence>
                        {shouldShowExpanded && (
                          <motion.span
                            initial={{ opacity: 0, width: 0 }}
                            animate={{ opacity: 1, width: 'auto' }}
                            exit={{ opacity: 0, width: 0 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 text-left whitespace-nowrap overflow-hidden"
                          >
                            Ajustes
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  </Link>
                );
              })()
            }

            {/* Usuario - SIN dropdown de tres puntos */}
            <div className={`flex items-center gap-3 rounded-xl bg-red-700/30 ${shouldShowExpanded ? 'px-4 py-3' : 'justify-center px-3 py-3'}`}>
              <Avatar className="w-8 h-8 flex-shrink-0 border-2 border-yellow-400">
                <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-red-900">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <AnimatePresence>
                {shouldShowExpanded && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 min-w-0"
                  >
                    <p className="text-white text-sm truncate">{userName}</p>
                    <p className="text-red-300 text-xs truncate">{userRole === 'admin' ? 'Administrador' : userRole === 'supervisor_general' ? 'Supervisor General' : userRole === 'consultor_docente' ? 'Consultor Docente' : userRole === 'consultor_estudiante' ? 'Consultor Estudiante' : userRole === 'autorizado' ? 'Autorizado' : 'Consultor'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer: Cerrar Sesión */}
          <div className="p-4 border-t border-red-700/50">
            {shouldShowExpanded ? (
              <Button
                onClick={onLogout}
                variant="outline"
                className="w-full border-red-600 text-red-100 hover:bg-red-700/60 hover:text-white hover:border-red-500 bg-red-700/30 transition-colors"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            ) : (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onLogout}
                    variant="ghost"
                    className="w-10 h-10 flex items-center justify-center rounded-xl text-red-100 hover:bg-red-700/50 hover:text-white transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-red-900 text-white border-red-700">
                  Cerrar Sesión
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        </motion.aside>
      </TooltipProvider>

      {/* Main Content - SIN HEADER */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Content Area: make this a flex container so inner children can be constrained */}
        <main className="flex-1 flex overflow-hidden">
          <motion.div
            key={location.pathname}
            className={
              (location.pathname.includes('asistente-virtual') || location.pathname.includes('/chat'))
                ? 'flex-1 min-h-0 flex overflow-hidden'
                : 'flex-1 min-h-0 overflow-y-auto scrollbar-hidden'
            }
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {props.children || <div className="p-8 text-center text-gray-500">Cargando...</div>}
          </motion.div>
        </main>
      </div>
    </div>
  );
}