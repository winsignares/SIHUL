import { useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { useAuth } from '../hooks/useAuth';
import { Button } from '../share/button';
import { Input } from '../share/input';
import { Avatar, AvatarFallback } from '../share/avatar';
import { Badge } from '../share/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../share/tooltip';
import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Calendar, 
  FileText,
  LogOut,
  Menu,
  BookOpen,
  CalendarRange,
  UsersRound,
  BarChart3,
  Settings,
  MessageSquare,
  Bell,
  Video,
  Eye,
  GraduationCap,
  BookUser,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Clock,
  GitMerge,
  HandCoins,
  Shield,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DashboardLayoutProps {
  children?: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { usuario } = useUser();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['gestion', 'principal']);
  const [notificacionesSinLeer] = useState(3);
  const [mensajesSinLeer] = useState(2);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Extraer ruta activa
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const activeMenu = pathSegments[pathSegments.length - 1] || 'dashboard';

  const toggleMenuSection = (sectionId: string) => {
    if (!isSidebarCollapsed) {
      setExpandedMenus(prev => 
        prev.includes(sectionId) 
          ? prev.filter(id => id !== sectionId)
          : [...prev, sectionId]
      );
    }
  };

  // Menú dinámico por rol
  const getMenuSections = () => {
    if (!usuario) return [];

    const rol = usuario.rol?.toLowerCase() || '';

    if (rol === 'administrador' || rol === 'admin') {
      return [
        {
          id: 'principal',
          label: 'Principal',
          items: [
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }
          ]
        },
        {
          id: 'gestion',
          label: 'Gestión Académica',
          items: [
            { id: 'facultades', icon: Building2, label: 'Facultades', path: '/dashboard/facultades' },
            { id: 'programas', icon: Building2, label: 'Programas', path: '/dashboard/programas' },
            { id: 'asignaturas', icon: BookOpen, label: 'Asignaturas', path: '/dashboard/asignaturas' },
            { id: 'grupos', icon: GitMerge, label: 'Grupos', path: '/dashboard/grupos' },
            { id: 'espacios', icon: MapPin, label: 'Espacios Físicos', path: '/dashboard/espacios' },
            { id: 'prestamos', icon: HandCoins, label: 'Préstamos', path: '/dashboard/prestamos' },
            { id: 'horarios', icon: Clock, label: 'Horarios', path: '/dashboard/horarios' },
            { id: 'periodos', icon: Calendar, label: 'Períodos', path: '/dashboard/periodos' }
          ]
        },
        {
          id: 'reportes',
          label: 'Reportes',
          items: [
            { id: 'reportes', icon: BarChart3, label: 'Reportes', path: '/dashboard/reportes' }
          ]
        },
        {
          id: 'administracion',
          label: 'Administración',
          items: [
            { id: 'usuarios', icon: Shield, label: 'Usuarios', path: '/dashboard/usuarios' },
            { id: 'notificaciones', icon: Bell, label: 'Notificaciones', path: '/dashboard/notificaciones' },
            { id: 'mensajeria', icon: MessageSquare, label: 'Mensajería', path: '/dashboard/mensajeria' }
          ]
        }
      ];
    }

    if (rol === 'audiovisual') {
      return [
        {
          id: 'principal',
          label: 'Principal',
          items: [
            { id: 'audiovisual', icon: Video, label: 'Dashboard AV', path: '/dashboard/audiovisual' }
          ]
        },
        {
          id: 'gestion',
          label: 'Gestión',
          items: [
            { id: 'recursos', icon: Video, label: 'Recursos', path: '/dashboard/recursos' },
            { id: 'espacios', icon: Building2, label: 'Espacios', path: '/dashboard/espacios' },
            { id: 'prestamos', icon: FileText, label: 'Préstamos', path: '/dashboard/prestamos' }
          ]
        }
      ];
    }

    if (rol === 'consultor') {
      return [
        {
          id: 'principal',
          label: 'Principal',
          items: [
            { id: 'consultor', icon: Eye, label: 'Panel Consultor', path: '/dashboard/consultor' }
          ]
        },
        {
          id: 'consultas',
          label: 'Consultas',
          items: [
            { id: 'consulta-espacios', icon: Building2, label: 'Espacios', path: '/dashboard/consulta-espacios' },
            { id: 'consulta-horarios', icon: Calendar, label: 'Horarios', path: '/dashboard/consulta-horarios' },
            { id: 'consulta-prestamos', icon: FileText, label: 'Préstamos', path: '/dashboard/consulta-prestamos' }
          ]
        }
      ];
    }

    if (rol === 'profesor') {
      return [
        {
          id: 'principal',
          label: 'Principal',
          items: [
            { id: 'profesor', icon: GraduationCap, label: 'Mi Panel', path: '/dashboard/profesor' }
          ]
        },
        {
          id: 'mis-datos',
          label: 'Mis Datos',
          items: [
            { id: 'horarios', icon: Calendar, label: 'Mis Horarios', path: '/dashboard/horarios' },
            { id: 'prestamos', icon: FileText, label: 'Mis Préstamos', path: '/dashboard/prestamos' }
          ]
        }
      ];
    }

    if (rol === 'estudiante') {
      return [
        {
          id: 'principal',
          label: 'Principal',
          items: [
            { id: 'estudiante', icon: BookUser, label: 'Mi Panel', path: '/dashboard/estudiante' }
          ]
        },
        {
          id: 'mi-informacion',
          label: 'Mi Información',
          items: [
            { id: 'horarios', icon: Calendar, label: 'Mi Horario', path: '/dashboard/horarios' }
          ]
        }
      ];
    }

    return [];
  };

  const menuSections = getMenuSections();

  const getInitials = () => {
    if (!usuario) return 'U';
    const nombres = usuario.nombre?.split(' ') || [];
    const apellidos = usuario.apellido?.split(' ') || [];
    const inicialNombre = nombres[0]?.[0] || '';
    const inicialApellido = apellidos[0]?.[0] || '';
    return `${inicialNombre}${inicialApellido}`.toUpperCase() || 'U';
  };

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar */}
      <TooltipProvider>
        <motion.aside
          animate={{ width: isSidebarCollapsed ? 80 : 280 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-gradient-to-b from-red-900 via-red-800 to-red-950 flex flex-col relative shadow-2xl"
        >
          {/* Logo */}
          <div className="p-6 border-b border-red-700/50 flex items-center justify-center">
            <motion.div 
              className="flex items-center gap-3"
              animate={{ justifyContent: isSidebarCollapsed ? 'center' : 'flex-start' }}
              whileHover={{ scale: 1.02 }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                <GraduationCap className="w-7 h-7 text-red-900" />
              </div>
              <AnimatePresence>
                {!isSidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <h1 className="text-white text-xl font-bold whitespace-nowrap">UNISPACE</h1>
                    <p className="text-red-300 text-sm whitespace-nowrap capitalize">{usuario?.rol || 'Usuario'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-6">
              {menuSections.map((section) => (
                <div key={section.id}>
                  {/* Section Header */}
                  <AnimatePresence>
                    {!isSidebarCollapsed && (
                      <motion.button
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => toggleMenuSection(section.id)}
                        className="w-full flex items-center justify-between px-3 py-2 text-red-200 hover:text-white transition-colors group"
                      >
                        <span className="uppercase tracking-wider text-xs font-semibold">{section.label}</span>
                        <motion.div
                          animate={{ rotate: expandedMenus.includes(section.id) ? 180 : 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </motion.div>
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Menu Items */}
                  <AnimatePresence>
                    {(!isSidebarCollapsed && expandedMenus.includes(section.id)) || isSidebarCollapsed ? (
                      <motion.div
                        initial={!isSidebarCollapsed ? { height: 0, opacity: 0 } : { opacity: 1 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={!isSidebarCollapsed ? { height: 0, opacity: 0 } : {}}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className={`space-y-1 ${!isSidebarCollapsed ? 'mt-2' : ''}`}>
                          {section.items.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path || activeMenu === item.id;
                            
                            const buttonContent = (
                              <motion.div key={item.id}>
                                <Link
                                  to={item.path}
                                  className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 ${
                                    isSidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                                  } ${
                                    isActive
                                      ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 shadow-lg'
                                      : 'text-red-100 hover:bg-red-700/50'
                                  }`}
                                >
                                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-900' : 'text-red-300'}`} />
                                  <AnimatePresence>
                                    {!isSidebarCollapsed && (
                                      <motion.span
                                        initial={{ opacity: 0, width: 0 }}
                                        animate={{ opacity: 1, width: 'auto' }}
                                        exit={{ opacity: 0, width: 0 }}
                                        transition={{ duration: 0.2 }}
                                        className="flex-1 text-left whitespace-nowrap"
                                      >
                                        {item.label}
                                      </motion.span>
                                    )}
                                  </AnimatePresence>
                                  {isActive && !isSidebarCollapsed && (
                                    <motion.div
                                      layoutId="activeIndicator"
                                      className="w-2 h-2 bg-red-900 rounded-full flex-shrink-0"
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                    />
                                  )}
                                </Link>
                              </motion.div>
                            );

                            if (isSidebarCollapsed) {
                              return (
                                <Tooltip key={item.id} delayDuration={0}>
                                  <TooltipTrigger asChild>
                                    {buttonContent}
                                  </TooltipTrigger>
                                  <TooltipContent side="right" className="bg-red-900 text-white border-red-700">
                                    {item.label}
                                  </TooltipContent>
                                </Tooltip>
                              );
                            }

                            return buttonContent;
                          })}
                        </div>
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-red-700/50 space-y-2">
            {/* Botón Minimizar */}
            <motion.button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className={`w-full flex items-center gap-2 rounded-xl bg-red-700/30 hover:bg-red-700/50 text-red-100 transition-colors ${
                isSidebarCollapsed ? 'justify-center px-3 py-3' : 'justify-between px-4 py-3'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isSidebarCollapsed ? (
                <ChevronRight className="w-5 h-5" />
              ) : (
                <>
                  <span className="text-sm font-medium">Minimizar</span>
                  <ChevronLeft className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {/* Botón Cerrar Sesión */}
            {isSidebarCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="w-full border-red-600 text-red-100 hover:bg-red-700/50 hover:text-white hover:border-red-500 px-0 py-3"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-red-900 text-white border-red-700">
                  Cerrar Sesión
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={handleLogout}
                variant="outline"
                className="w-full border-red-600 text-red-100 hover:bg-red-700/50 hover:text-white hover:border-red-500 bg-red-700/30"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </Button>
            )}
          </div>
        </motion.aside>
      </TooltipProvider>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navbar */}
        <motion.header 
          className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 shadow-sm"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              {/* Left: Menu Toggle + Title */}
              <div className="flex items-center gap-4">
                <motion.button
                  onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                  className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Menu className="w-6 h-6 text-slate-700 dark:text-slate-300" />
                </motion.button>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                    {usuario?.nombre} {usuario?.apellido}
                  </h1>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Sistema de Gestión Académica</p>
                </div>
              </div>

              {/* Center: Search */}
              <div className="hidden md:flex flex-1 max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Buscar horarios, espacios, programas..."
                    className="pl-12 pr-4 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl"
                  />
                </div>
              </div>

              {/* Right: Notifications + Messages + Settings + Avatar */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard/notificaciones')}
                  className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <Bell className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  {notificacionesSinLeer > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-red-600 text-white border-2 border-white dark:border-slate-900 text-xs">
                      {notificacionesSinLeer}
                    </Badge>
                  )}
                </motion.button>

                {/* Messages */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard/mensajeria')}
                  className="relative p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <MessageSquare className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                  {mensajesSinLeer > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-blue-600 text-white border-2 border-white dark:border-slate-900 text-xs">
                      {mensajesSinLeer}
                    </Badge>
                  )}
                </motion.button>

                {/* Settings */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/dashboard/ajustes')}
                  className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                  <Settings className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                </motion.button>

                {/* Avatar */}
                <Avatar className="w-10 h-10 border-2 border-white dark:border-slate-700 shadow-md">
                  <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white font-semibold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6 bg-slate-50 dark:bg-slate-900">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {children || <Outlet />}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
