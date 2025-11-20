import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { 
  LayoutDashboard, 
  Clock, 
  LogOut,
  GraduationCap,
  Bell,
  Search,
  MessageSquare,
  Settings,
  Menu,
  ChevronDown,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ConsultorEstudianteHome from './consultor/ConsultorEstudianteHome.tsx';
import HorarioEstudiante from './consultor/HorarioEstudiante.tsx';
import Notificaciones from './admin/Notificaciones';
import Mensajeria from './admin/Mensajeria';
import Ajustes from './admin/Ajustes';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface ConsultorEstudianteDashboardProps {
  userName: string;
  onLogout: () => void;
}

type MenuOption = 'home' | 'horario' | 'notificaciones' | 'mensajeria' | 'ajustes';

export default function ConsultorEstudianteDashboard({ userName, onLogout }: ConsultorEstudianteDashboardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  
  // Extraer la ruta activa de la URL
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const activeMenu = (pathSegments[1] || 'home') as MenuOption;
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['consultas']);
  const [notificacionesSinLeer, setNotificacionesSinLeer] = useState(3);
  const [mensajesSinLeer, setMensajesSinLeer] = useState(2);

  const menuSections = [
    {
      id: 'principal',
      label: 'Principal',
      items: [
        { id: 'home', icon: LayoutDashboard, label: 'Dashboard', action: 'home' }
      ]
    },
    {
      id: 'consultas',
      label: 'Mi Horario',
      items: [
        { id: 'horario', icon: Clock, label: 'Ver Mi Horario', action: 'horario' }
      ]
    }
  ];

  const toggleMenuSection = (sectionId: string) => {
    if (!isSidebarCollapsed) {
      setExpandedMenus(prev => 
        prev.includes(sectionId) 
          ? prev.filter(id => id !== sectionId)
          : [...prev, sectionId]
      );
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'home':
        return <ConsultorEstudianteHome onNavigate={(m: string) => navigate(`/estudiante/${m}`)} />;
      case 'horario':
        return <HorarioEstudiante />;
      case 'notificaciones':
        return <Notificaciones />;
      case 'mensajeria':
        return <Mensajeria />;
      case 'ajustes':
        return <Ajustes />;
      default:
        return <ConsultorEstudianteHome onNavigate={(m: string) => navigate(`/estudiante/${m}`)} />;
    }
  };

  const getMenuTitle = () => {
    for (const section of menuSections) {
      const item = section.items.find(item => item.action === activeMenu);
      if (item) return item.label;
    }
    if (activeMenu === 'notificaciones') return 'Notificaciones';
    if (activeMenu === 'mensajeria') return 'Mensajería';
    if (activeMenu === 'ajustes') return 'Ajustes';
    return 'Dashboard';
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
                    <h1 className="text-white whitespace-nowrap">UNISPACE</h1>
                    <p className="text-red-300 whitespace-nowrap">Estudiante</p>
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
                        className="w-full flex items-center justify-between px-3 py-2 text-red-200 hover:text-white transition-colors group overflow-hidden"
                      >
                        <span className="uppercase tracking-wider text-xs">{section.label}</span>
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
                            const Icon = item.icon as any;
                            const isActive = activeMenu === (item.action as MenuOption);
                            
                            const buttonContent = (
                              <motion.button
                                key={item.id}
                                onClick={() => navigate(`/estudiante/${item.action}`)}
                                className={`w-full flex items-center gap-3 rounded-xl transition-all duration-200 group ${
                                  isSidebarCollapsed ? 'justify-center px-3 py-3' : 'px-4 py-3'
                                } ${
                                  isActive
                                    ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 shadow-lg'
                                    : 'text-red-100 hover:bg-red-700/50'
                                }`}
                                whileHover={{ x: isActive ? 0 : (isSidebarCollapsed ? 0 : 4), scale: isSidebarCollapsed ? 1.05 : 1 }}
                                whileTap={{ scale: 0.95 }}
                              >
                                <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-900' : 'text-red-300'}`} />
                                <AnimatePresence>
                                  {!isSidebarCollapsed && (
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
                                {isActive && !isSidebarCollapsed && (
                                  <motion.div
                                    layoutId="activeIndicator"
                                    className="w-2 h-2 bg-red-900 rounded-full flex-shrink-0"
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                  />
                                )}
                              </motion.button>
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

          {/* Footer: Minimizar + Cerrar Sesión */}
          <div className="p-4 border-t border-red-700/50 space-y-2">
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
                  <span>Minimizar</span>
                  <ChevronLeft className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {isSidebarCollapsed ? (
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <Button
                    onClick={onLogout}
                    variant="outline"
                    className="w-full border-red-600 text-red-100 hover:bg-red-700/50 hover:text-white hover:border-red-500 px-0"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-red-900 text-white border-red-700">
                  Cerrar Sesión
                </TooltipContent>
              </Tooltip>
            ) : (
              <Button
                onClick={onLogout}
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
                  <motion.h1 
                    key={activeMenu}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-slate-900 dark:text-slate-100"
                  >
                    {getMenuTitle()}
                  </motion.h1>
                  <p className="text-slate-500 dark:text-slate-400">Portal del Estudiante</p>
                </div>
              </div>

              {/* Center: Search Bar */}
              <div className="hidden md:flex flex-1 max-w-xl">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="Buscar asignaturas, horarios..."
                    className="pl-12 pr-4 h-12 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>
              </div>

              {/* Right: Notifications + Messages + Settings + Avatar */}
              <div className="flex items-center gap-3">
                {/* Notifications */}
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/estudiante/notificaciones')}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    activeMenu === 'notificaciones'
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Bell className={`w-5 h-5 ${
                    activeMenu === 'notificaciones' 
                      ? 'text-red-900' 
                      : 'text-slate-600 dark:text-slate-300'
                  }`} />
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
                  onClick={() => navigate('/estudiante/mensajeria')}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    activeMenu === 'mensajeria'
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <MessageSquare className={`w-5 h-5 ${
                    activeMenu === 'mensajeria' 
                      ? 'text-red-900' 
                      : 'text-slate-600 dark:text-slate-300'
                  }`} />
                  {mensajesSinLeer > 0 && (
                    <Badge className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center p-0 bg-green-600 text-white border-2 border-white dark:border-slate-900 text-xs">
                      {mensajesSinLeer}
                    </Badge>
                  )}
                </motion.button>

                {/* Settings */}
                <motion.button
                  whileHover={{ scale: 1.05, rotate: 90 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate('/estudiante/ajustes')}
                  className={`relative p-2.5 rounded-xl transition-all ${
                    activeMenu === 'ajustes'
                      ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-lg shadow-yellow-500/50'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  <Settings className={`w-5 h-5 ${
                    activeMenu === 'ajustes' 
                      ? 'text-red-900' 
                      : 'text-slate-600 dark:text-slate-300'
                  }`} />
                </motion.button>

                {/* User Avatar */}
                <motion.div 
                  className="flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-slate-700"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-right hidden md:block">
                    <p className="text-slate-900 dark:text-slate-100">{userName}</p>
                    <p className="text-slate-500 dark:text-slate-400">Estudiante</p>
                  </div>
                  <Avatar className="w-10 h-10 border-2 border-yellow-400 cursor-pointer">
                    <AvatarFallback className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-red-900">
                      {userName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </motion.div>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <motion.div
            key={activeMenu}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
