import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import {
  ChevronRight,
  Users,
  Building2,
  Sparkles,
  Clock
} from 'lucide-react';
import { motion } from 'motion/react';
import { Badge } from '../../share/badge';
import { useDashboardHome } from '../../hooks/dashboard/useDashboardHome';
import { usePublicDashboard } from '../../hooks/dashboard/usePublicDashboard';

export default function PublicDashboard() {
  const { periodoActivo } = useDashboardHome();
  const { quickAccessItems, handleNavigateToService } = usePublicDashboard();

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">¡Bienvenido! 👋</h1>
          <p className="text-slate-600 text-lg">Portal público de acceso a SIHUL</p>
          <p className="text-slate-500 text-sm mt-3">Sistema Integral de Gestión Horaria y Uso de Locales, Acceso público a servicios institucionales</p>
        </div>
      </motion.div>

      {/* Accesos Rápidos */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-red-600" />
            Accesos Rápidos
          </h2>
          <p className="text-slate-600 mt-2">Servicios disponibles para usuarios públicos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickAccessItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8, scale: 1.02 }}
              >
                <Card className={`border-0 shadow-lg bg-gradient-to-br ${item.bgGradient} overflow-hidden relative group cursor-pointer h-full transition-all hover:shadow-2xl`}>
                  <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${item.gradient} opacity-20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
                  
                  <CardContent className="p-6 relative h-full flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <motion.div
                        className={`bg-gradient-to-br ${item.gradient} w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg`}
                        whileHover={{ rotate: 360, scale: 1.1 }}
                        transition={{ duration: 0.6 }}
                      >
                        <Icon className="w-7 h-7 text-white" />
                      </motion.div>
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white border-0 text-xs font-semibold">
                        {item.badge}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-slate-900 mb-2">{item.label}</h3>
                      <p className="text-slate-600 text-sm mb-4">{item.description}</p>
                    </div>

                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Button
                        onClick={() => handleNavigateToService(item.route, item.id)}
                        className={`w-full bg-gradient-to-r ${item.gradient} text-white hover:opacity-90`}
                      >
                        Acceder
                        <ChevronRight className="w-4 h-4 ml-2" />
                      </Button>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Información Adicional */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        {[
          {
            icon: Building2,
            title: 'Espacios Disponibles',
            description: 'Consulta la disponibilidad de aulas, laboratorios y salas en tiempo real',
            gradient: 'from-blue-500 to-cyan-600',
            bgGradient: 'from-blue-50 to-cyan-50'
          },
          {
            icon: Users,
            title: 'Información Institucional',
            description: 'Accede a datos públicos sobre facultades, programas y personal',
            gradient: 'from-emerald-500 to-teal-600',
            bgGradient: 'from-emerald-50 to-teal-50'
          },
          {
            icon: Clock,
            title: 'Horarios Académicos',
            description: 'Visualiza los horarios de clases y eventos institucionales',
            gradient: 'from-amber-500 to-orange-600',
            bgGradient: 'from-amber-50 to-orange-50'
          }
        ].map((item, index) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
              whileHover={{ y: -4 }}
            >
              <Card className={`border-0 shadow-lg bg-gradient-to-br ${item.bgGradient}`}>
                <CardContent className="p-6">
                  <motion.div
                    className={`bg-gradient-to-br ${item.gradient} w-12 h-12 rounded-xl flex items-center justify-center shadow-lg mb-4`}
                    whileHover={{ scale: 1.1, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Icon className="w-6 h-6 text-white" />
                  </motion.div>
                  <h3 className="text-slate-900 font-bold mb-2">{item.title}</h3>
                  <p className="text-slate-600 text-sm">{item.description}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Footer Info */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0, duration: 0.5 }}
        className="text-center py-8 border-t border-slate-200 mt-8"
      >
        <p className="text-slate-600 mb-2">¿Necesitas ayuda adicional?</p>
        <p className="text-slate-500 text-sm">Contacta con el equipo de soporte institucional para más información</p>
      </motion.div>
    </div>
  );
}
