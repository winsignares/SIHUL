import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, Users, Database, BarChart3, Settings, 
  ChevronLeft, ChevronRight, LogOut, Search, Bell, 
  Menu, X, ChevronDown, Clock, ShieldCheck
} from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback } from './ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import AdminFinancieroHome from './admin-financiero/AdminFinancieroHome';
import GestionUsuarios from './admin-financiero/GestionUsuarios';
import GestionProveedores from './admin-financiero/GestionProveedores';
import ReportesConsolidados from './admin-financiero/ReportesConsolidados';
import Configuracion from './admin-financiero/Configuracion';
import ParametrizacionSLA from './admin-financiero/ParametrizacionSLA';

interface AdminFinancieroDashboardProps {
  userName: string;
  onLogout: () => void;
}

type MenuOption = 'home' | 'usuarios' | 'proveedores' | 'reportes' | 'configuracion' | 'parametrizacion-sla';

export default function AdminFinancieroDashboard({ userName, onLogout }: AdminFinancieroDashboardProps) {
  const [activeMenu, setActiveMenu] = useState<MenuOption>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['gestion']);
  const [searchQuery, setSearchQuery] = useState('');

  const menuSections = [
    {
      id: 'gestion',
      label: 'Administración',
      items: [
        { id: 'home', icon: LayoutDashboard, label: 'Dashboard Principal', action: 'home' },
        { id: 'usuarios', icon: Users, label: 'Gestión de Usuarios', action: 'usuarios' },
        { id: 'proveedores', icon: Database, label: 'Gestión de Proveedores', action: 'proveedores' },
        { id: 'parametrizacion-sla', icon: Clock, label: 'Parametrización SLA', action: 'parametrizacion-sla' },
        { id: 'reportes', icon: BarChart3, label: 'Reportes Consolidados', action: 'reportes' },
        { id: 'configuracion', icon: Settings, label: 'Configuración Sistema', action: 'configuracion' }
      ]
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuId) ? prev.filter(id => id !== menuId) : [...prev, menuId]
    );
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'home': return <AdminFinancieroHome onNavigate={setActiveMenu} />;
      case 'usuarios': return <GestionUsuarios />;
      case 'proveedores': return <GestionProveedores />;
      case 'parametrizacion-sla': return <ParametrizacionSLA />;
      case 'reportes': return <ReportesConsolidados />;
      case 'configuracion': return <Configuracion />;
      default: return <AdminFinancieroHome onNavigate={setActiveMenu} />;
    }
  };

  const getMenuTitle = () => {
    const titles: { [key in MenuOption]: string } = {
      home: 'Dashboard Principal',
      usuarios: 'Gestión de Usuarios',
      proveedores: 'Gestión de Proveedores',
      reportes: 'Reportes Consolidados',
      configuracion: 'Configuración del Sistema',
      'parametrizacion-sla': 'Parametrización SLA'
    };
    return titles[activeMenu];
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: isSidebarCollapsed ? '80px' : '280px' }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="bg-gradient-to-b from-red-600 via-red-700 to-red-900 text-white shadow-2xl flex flex-col relative z-20"
      >
        {/* Header del Sidebar */}
        <div className="p-4 border-b border-red-500/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-12 h-12 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0">
                <ShieldCheck className="w-7 h-7 text-red-900" />
              </div>
              <AnimatePresence>
                {!isSidebarCollapsed && (
                  <motion.div initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} transition={{ duration: 0.3 }}>
                    <h1 className="text-white whitespace-nowrap">ADMIN</h1>
                    <p className="text-red-300 whitespace-nowrap text-xs">Financiero</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="text-white hover:bg-red-500/30 flex-shrink-0"
            >
              {isSidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <X className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Menu Items */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-red-900">
          {menuSections.map(section => (
            <div key={section.id} className="mb-4">
              {!isSidebarCollapsed && (
                <div className="flex items-center justify-between px-3 mb-2">
                  <span className="text-xs text-red-300 uppercase tracking-wider">{section.label}</span>
                </div>
              )}
              <div className="space-y-1">
                {section.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeMenu === item.action;
                  return (
                    <TooltipProvider key={item.id}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.button
                            onClick={() => setActiveMenu(item.action as MenuOption)}
                            whileHover={{ x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                              isActive
                                ? 'bg-white text-red-700 shadow-lg'
                                : 'text-red-100 hover:bg-red-500/30'
                            }`}
                          >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-red-700' : 'text-yellow-400'}`} />
                            <AnimatePresence>
                              {!isSidebarCollapsed && (
                                <motion.span
                                  initial={{ opacity: 0, width: 0 }}
                                  animate={{ opacity: 1, width: 'auto' }}
                                  exit={{ opacity: 0, width: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="whitespace-nowrap overflow-hidden text-left text-sm"
                                >
                                  {item.label}
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </TooltipTrigger>
                        {isSidebarCollapsed && (
                          <TooltipContent side="right">
                            <p>{item.label}</p>
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-red-500/30">
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Avatar className="w-10 h-10 border-2 border-yellow-400">
              <AvatarFallback className="bg-yellow-400 text-red-900 font-bold">AF</AvatarFallback>
            </Avatar>
            <AnimatePresence>
              {!isSidebarCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <p className="text-sm text-white truncate">Administrador</p>
                  <p className="text-xs text-red-300 truncate">{userName}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white dark:bg-slate-800 shadow-md z-10">
          <div className="flex items-center justify-between px-8 py-4">
            <div className="flex items-center gap-6 flex-1">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="lg:hidden text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400"
              >
                <Menu className="w-6 h-6" />
              </motion.button>
              <div>
                <motion.h1 key={activeMenu} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-slate-900 dark:text-slate-100">{getMenuTitle()}</motion.h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm">Administración del Sistema Financiero</p>
              </div>
            </div>
            <div className="hidden md:flex flex-1 max-w-xl">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Buscar usuarios, facturas, reportes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-11 pr-4 py-2 w-full bg-slate-100 dark:bg-slate-700 border-0 focus:ring-2 focus:ring-red-600 rounded-xl"
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full"></span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Notificaciones</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={onLogout} className="text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400">
                      <LogOut className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Cerrar Sesión</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-auto bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
          <AnimatePresence mode="wait">
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
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}