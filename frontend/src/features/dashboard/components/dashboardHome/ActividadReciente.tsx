import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Loader2 } from 'lucide-react';
import type { useDashboardHome } from '../../hooks/useDashboardHome';


type Home = ReturnType<typeof useDashboardHome>;
type Props = Pick<Home, 'recentActivities'> & Pick<Home['state'], 'isLoadingActivities'> & Pick<Home['setters'], 'setShowAllActivities'>;

/** Últimas actividades del sistema. */
export function ActividadReciente({
  recentActivities,
  isLoadingActivities,
  setShowAllActivities
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6, duration: 0.5 }}
    >
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900">Actividad Reciente</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => setShowAllActivities(true)}
              disabled={isLoadingActivities}
            >
              Ver Todo
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingActivities ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-red-600" />
              <span className="ml-3 text-slate-600">Cargando actividades...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {recentActivities.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  No hay actividades recientes
                </div>
              ) : (
                recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      whileHover={{ x: 4, backgroundColor: 'rgba(248, 250, 252, 0.5)' }}
                      className="flex items-start gap-4 p-3 rounded-xl transition-all"
                    >
                      <div className={`${activity.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-slate-900">{activity.title}</p>
                        <p className="text-slate-600 truncate">{activity.description}</p>
                        <p className="text-slate-500 mt-1">{activity.time}</p>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
