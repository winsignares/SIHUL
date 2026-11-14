import { Card, CardContent } from '../../../../components/ui/card';
import { motion } from 'motion/react';
import type { usePrestamosEspaciosPagina } from '../../hooks/usePrestamosEspaciosPagina';

type Gestion = ReturnType<typeof usePrestamosEspaciosPagina>;

/** Tarjetas con los totales por estado. */
export function EstadisticasPrestamos({ statsData }: Pick<Gestion, 'statsData'>) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statsData.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
                  <p className="text-3xl text-slate-900 dark:text-slate-100">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} ${stat.textColor} p-3 rounded-xl`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
              <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${stat.color}`} />
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
