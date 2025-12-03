import React from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Bell,
  Settings,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Avatar, AvatarFallback } from '../share/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../share/tooltip';
import { Button } from '../share/button';

import { useAdminDashboard, type MenuOption } from '../hooks/useAdminDashboard';

interface AdminDashboardProps {
  userName?: string;
  onLogout?: () => void;
  userRole?: string;
  children?: ReactNode;
}

export default function AdminDashboard(props: AdminDashboardProps) {
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
                      const path = item.route; // Usar route directamente del item
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
          {!isPublicAccess && (
            <div className="border-t border-red-700/50 p-4 space-y-2">
            {/* Notificaciones */}
            {
              (() => {
                const path = '/notificaciones';
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
                        <span className="absolute top-1 left-1 h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse ring-2 ring-red-800"></span>
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



            {/* Usuario - Clickable para ir a Ajustes */}
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
                        <AvatarFallback className={isActive ? 'bg-red-900 text-yellow-400' : 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-red-900'}>
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
            </div>
          )}

          {/* Footer: Cerrar Sesión */}
          <div className="p-4 border-t border-red-700/50">
            {shouldShowExpanded ? (
              <Button
                onClick={handleLogout}
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
                    onClick={handleLogout}
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