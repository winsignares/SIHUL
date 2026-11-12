import { motion } from 'motion/react';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../../../components/ui/dialog';
import type { useDashboardHome } from '../../hooks/useDashboardHome';


type Home = ReturnType<typeof useDashboardHome>;
type Props = Pick<Home, 'activities'> & Pick<Home['state'], 'showAllActivities'> & Pick<Home['setters'], 'setShowAllActivities'>;

/** Historial completo de actividades del sistema. */
export function ModalActividades({
  showAllActivities,
  setShowAllActivities,
  activities
}: Props) {
  return (
    <Dialog open={showAllActivities} onOpenChange={setShowAllActivities}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-slate-900">Historial de Actividades del Sistema</DialogTitle>
          <DialogDescription>
            Registro completo de eventos y acciones realizadas en el sistema
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {activities.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              No hay actividades registradas
            </div>
          ) : (
            activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <motion.div
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.03 }}
                  className="flex items-start gap-4 p-4 rounded-xl border bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all"
                >
                  <div className={`${activity.color} w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-slate-900 font-medium">
                          {activity.title}
                        </p>
                        <p className="text-slate-600 mt-1">{activity.description}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-slate-500">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{activity.time}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {activity.date}
                          </Badge>
                        </div>
                      </div>
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        <DialogFooter>
          <Button
            onClick={() => setShowAllActivities(false)}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
