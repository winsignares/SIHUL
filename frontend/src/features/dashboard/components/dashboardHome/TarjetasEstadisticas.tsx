import { motion } from 'motion/react';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import type { useDashboardHome } from '../../hooks/useDashboardHome';


type Home = ReturnType<typeof useDashboardHome>;
type Props = Pick<Home, 'stats'> & { isMobile: boolean };

/** Tarjetas con los indicadores del mes. */
export function TarjetasEstadisticas({
  stats,
  isMobile
}: Props) {
  return (
    <div className={`grid gap-6 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'}`}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.5 }}
            whileHover={{ y: isMobile ? 0 : -8, scale: isMobile ? 1 : 1.02 }}
          >
            <Card className={`border-0 shadow-lg bg-gradient-to-br ${stat.bgGradient} backdrop-blur-sm overflow-hidden relative group cursor-pointer`}>
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${stat.gradient} opacity-20 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-500`}></div>
              <CardContent className={`${isMobile ? 'p-4' : 'p-6'} relative`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className={`text-slate-600 mb-2 ${isMobile ? 'text-xs' : ''}`}>{stat.label}</p>
                    <motion.h2
                      className={`text-slate-900 ${isMobile ? 'text-lg' : ''}`}
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 200 }}
                    >
                      {stat.value}
                    </motion.h2>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className={`bg-gradient-to-r ${stat.gradient} text-white border-0 text-xs`}>
                        {stat.change}
                      </Badge>
                      <span className={`text-slate-500 ${isMobile ? 'text-xs' : 'text-sm'}`}>este mes</span>
                    </div>
                  </div>
                  <motion.div
                    className={`${stat.iconBg} ${isMobile ? 'w-12 h-12' : 'w-14 h-14'} rounded-2xl flex items-center justify-center shadow-lg flex-shrink-0`}
                    whileHover={{ rotate: isMobile ? 0 : 360, scale: isMobile ? 1 : 1.1 }}
                    transition={{ duration: 0.6 }}
                  >
                    <Icon className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} text-white`} />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
