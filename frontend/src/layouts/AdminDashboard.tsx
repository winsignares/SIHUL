import React, { useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Bell,
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback } from '../share/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../share/tooltip';
import { Button } from '../share/button';

import { useAdminDashboard, type MenuOption } from '../hooks/useAdminDashboard';
import { useIsMobile } from '../hooks/useIsMobile';

interface AdminDashboardProps {
  userName?: string;
  onLogout?: () => void;
  userRole?: string;
  children?: ReactNode;
}

export default function AdminDashboard(props: AdminDashboardProps) {
  const isMobile = useIsMobile();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const {
    userRole,
    userName,
    userFacultyName,
    isSidebarHovered,
    setIsSidebarHovered,
    shouldShowExpanded,
    notificacionesSinLeer,
    menuSections,
    handleLogout,
    location,
    isPublicAccess
  } = useAdminDashboard(props.userName, props.userRole, props.onLogout);

  // En móvil, cerrar menú cuando navega
  React.useEffect(() => {
    if (isMobile) {
      setMobileMenuOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <div className="flex h-screen bg-slate-100 dark:bg-slate-900 overflow-hidden">
      {/* Sidebar Desktop */}
      {!isMobile && (
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
                      <p className="text-red-300 whitespace-nowrap text-xs">{isPublicAccess ? 'Acceso Público' : userRole === 'supervisor_general' ? 'Supervisor General' : userRole === 'planeacion_facultad' ? `Planeación (${userFacultyName})` : userRole === 'docente' ? 'Docente' : userRole === 'estudiante' ? 'Estudiante' : 'Administrador'}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
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
                      {section.items.map((item: any) => {
                        const Icon = item.icon;
                        const path = item.route;
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
                                  className="flex-1 text-left whitespace-nowrap overflow-hidden text-sm"
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
                              <TooltipContent side="right" className="bg-red-900 text-white border-red-700 text-xs">
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

            {/* Footer */}
            <div className="border-t border-red-700/50 p-4 space-y-2">
              {!isPublicAccess && (
                <>
                  {/* Notificaciones */}
                  {
                    (() => {
                      const path = '/notificaciones';
                      const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
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
                              <span className="absolute top-1 left-1 h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse ring-2 ring-red-800"></span>
                            )}
                            <AnimatePresence>
                              {shouldShowExpanded && (
                                <motion.span
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="flex-1 text-left whitespace-nowrap overflow-hidden text-sm"
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

                  {/* Usuario */}
                  {
                    (() => {
                      const path = '/ajustes';
                      const isActive = location.pathname === path || location.pathname.startsWith(path + '/');
                      return (
                        <Link to={path} className="block w-full" key="perfil">
                          <motion.div
                            className={`flex items-center gap-3 rounded-xl cursor-pointer ${shouldShowExpanded ? 'px-4 py-3' : 'justify-center px-3 py-3'} ${isActive
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500'
                                : 'bg-red-700/30 hover:bg-red-700/50'
                              }`}
                            whileHover={{ scale: shouldShowExpanded ? 1 : 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Avatar className={`w-8 h-8 flex-shrink-0 border-2 ${isActive ? 'border-red-900' : 'border-yellow-400'}`}>
                              <AvatarFallback className={isActive ? 'bg-red-900 text-yellow-400 text-xs' : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-red-900 text-xs'}>
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
                                  <p className={`text-sm truncate ${isActive ? 'text-red-900 font-semibold' : 'text-white'}`}>{userName}</p>
                                  <p className={`text-xs truncate font-medium ${isActive ? 'text-red-900' : 'text-yellow-300'}`}>{userRole === 'supervisor_general' ? 'Supervisor General' : userRole === 'planeacion_facultad' ? `Planeación (${userFacultyName})` : userRole === 'docente' ? 'Docente' : userRole === 'estudiante' ? 'Estudiante' : 'Administrador'}</p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </motion.div>
                        </Link>
                      );
                    })()
                  }

                  {/* Cerrar Sesión */}
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className={`w-full border-red-600 text-red-100 hover:bg-red-700/60 hover:text-white hover:border-red-500 bg-red-700/30 transition-all text-sm h-auto flex items-center gap-2 rounded-xl ${shouldShowExpanded ? 'px-4 py-3' : 'justify-center px-3 py-3'}`}
                  >
                    <LogOut className="w-4 h-4 flex-shrink-0" />
                    <AnimatePresence>
                      {shouldShowExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="whitespace-nowrap"
                        >
                          Cerrar
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </>
              )}

              {/* Iniciar Sesión - Solo en acceso público */}
              {isPublicAccess && (
                <Link to="/login" className="block w-full">
                  <motion.div
                    className="w-full flex items-center gap-3 rounded-xl px-4 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 shadow-lg hover:shadow-xl transition-all"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <LogOut className="w-5 h-5 flex-shrink-0 rotate-180" />
                    <AnimatePresence>
                      {shouldShowExpanded && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className="flex-1 text-left whitespace-nowrap overflow-hidden text-sm font-semibold"
                        >
                          Iniciar Sesión
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              )}
            </div>
          </motion.aside>
        </TooltipProvider>
      )}

      {/* Mobile Header */}
      {isMobile && (
        <div className="fixed top-0 left-0 right-0 bg-gradient-to-r from-red-900 via-red-800 to-red-950 border-b border-red-700/50 p-4 flex items-center justify-between z-40">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 hover:bg-red-700/50 rounded-lg transition"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <Menu className="w-6 h-6 text-white" />
            )}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center shadow-lg">
              <GraduationCap className="w-6 h-6 text-red-900" />
            </div>
            <h1 className="text-white font-bold">SIHUL</h1>
          </div>
          <div className="w-10" />
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileMenuOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setMobileMenuOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
          <motion.div
            className="fixed left-0 top-0 bottom-0 w-64 bg-gradient-to-b from-red-900 via-red-800 to-red-950 shadow-2xl z-40 overflow-y-auto scrollbar-hidden"
            initial={{ x: -280 }}
            animate={{ x: 0 }}
            exit={{ x: -280 }}
          >
            <div className="pt-20 px-4 pb-4 space-y-6">
              {menuSections.map((section) => (
                <div key={section.id}>
                  <div className="px-3 py-2 text-red-200 mb-2">
                    <span className="uppercase tracking-wider text-xs font-semibold">{section.label}</span>
                  </div>
                  <div className="space-y-1">
                    {section.items.map((item: any) => {
                      const Icon = item.icon;
                      const path = item.route;
                      const isActive = location.pathname === path || location.pathname.startsWith(path + '/');

                      return (
                        <Link to={path} key={item.id} className="block">
                          <motion.div
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                              isActive
                                ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 shadow-lg'
                                : 'text-red-100 hover:bg-red-700/50'
                            }`}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-900' : 'text-red-300'}`} />
                            <span className="flex-1 text-sm">{item.label}</span>
                          </motion.div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}

              {/* Mobile Footer */}
              <div className="border-t border-red-700/50 pt-4 space-y-2">
                {!isPublicAccess && (
                  <>
                    <Link to="/notificaciones" className="block">
                      <motion.div className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-100 hover:bg-red-700/50 relative">
                        <Bell className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-sm">Notificaciones</span>
                        {notificacionesSinLeer > 0 && (
                          <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                        )}
                      </motion.div>
                    </Link>
                    <Link to="/ajustes" className="block">
                      <motion.div className="flex items-center gap-3 px-4 py-3 rounded-lg text-red-100 hover:bg-red-700/50">
                        <Settings className="w-5 h-5 flex-shrink-0" />
                        <span className="flex-1 text-sm">Configuración</span>
                      </motion.div>
                    </Link>
                    <Button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        handleLogout();
                      }}
                      className="w-full bg-red-700 hover:bg-red-600 text-white text-sm py-2 h-auto rounded-lg"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Cerrar Sesión
                    </Button>
                  </>
                )}

                {/* Iniciar Sesión - Solo en acceso público (Mobile) */}
                {isPublicAccess && (
                  <Link to="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <motion.div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 text-red-900 font-semibold hover:shadow-lg transition-all">
                      <LogOut className="w-5 h-5 flex-shrink-0 rotate-180" />
                      <span className="flex-1 text-sm">Iniciar Sesión</span>
                    </motion.div>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Add padding to account for mobile header */}
        <div className={`flex-1 flex overflow-hidden ${isMobile ? 'mt-16' : ''}`}>
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
            {props.children || <div className="p-4 md:p-8 text-center text-gray-500 text-sm md:text-base">Cargando...</div>}
          </motion.div>
        </div>
      </div>
    </div>
  );
}