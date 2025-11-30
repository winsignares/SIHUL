import React from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  Bell,
  Search,
  Settings,
  LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Input } from '../share/input';
import { Avatar, AvatarFallback } from '../share/avatar';
import { Badge } from '../share/badge';
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
    isSidebarHovered,
    setIsSidebarHovered,
    shouldShowExpanded,
    notificacionesSinLeer,
    menuSections,
    handleLogout,
    location
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
                const path = '/ajustes';
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
                    <p className="text-red-300 text-xs truncate">{userRole === 'admin' ? 'Administrador' : userRole === 'planeacion_facultad' ? 'Planeación Facultad' : userRole === 'supervisor_general' ? 'Supervisor General' : userRole === 'docente' ? 'Docente' : userRole === 'estudiante' ? 'Estudiante' : userRole === 'autorizado' ? 'Autorizado' : 'Consultor'}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

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