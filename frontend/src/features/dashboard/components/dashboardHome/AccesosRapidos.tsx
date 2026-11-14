import { motion } from 'motion/react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Activity, Bot, Clock, FileText } from 'lucide-react';

type Props = { navigate: (path: string) => void };

/** Atajos a los módulos principales. */
export function AccesosRapidos({
  navigate
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.9, duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg bg-gradient-to-r from-red-600 via-red-700 to-red-800 text-white overflow-hidden relative">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>
        <CardContent className="p-6 relative">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white mb-2">Accesos Rápidos</h3>
              <p className="text-red-100">Gestiona rápidamente tus módulos principales</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
            {[
              { label: 'Centro Horarios', icon: Clock, path: '/admin/centro-horarios' },
              { label: 'Asistente Virtual', icon: Bot, path: '/admin/asistente-virtual' },
              { label: 'Ver Reportes', icon: FileText, path: '/admin/reportes' },
              { label: 'Ocupación', icon: Activity, path: '/admin/ocupacion' }
            ].map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={index}
                  onClick={() => navigate(action.path)}
                  className="bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl p-4 transition-all border border-white/20 group"
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Icon className="w-8 h-8 text-yellow-400 mb-2" />
                  <p className="text-white group-hover:text-yellow-400 transition-colors">{action.label}</p>
                </motion.button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
