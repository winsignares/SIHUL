import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { motion } from 'motion/react';
import { X } from 'lucide-react';
import type { useCrearHorarios } from '../../hooks/useCrearHorarios';

type CrearHorarios = ReturnType<typeof useCrearHorarios>;

/** Lista de las asignaturas ya asignadas al grupo. */
export function ListaAsignaturasAsignadas({
  horariosAsignados,
  handleEliminarHorarioAsignado
}: Pick<CrearHorarios, 'horariosAsignados' | 'handleEliminarHorarioAsignado'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
        <CardTitle className="text-slate-900">Asignaturas Asignadas ({horariosAsignados.length})</CardTitle>
      </CardHeader>
      <CardContent className="p-4">
        <div className="space-y-3">
          {horariosAsignados.map((horario, index) => {
            return (
              <motion.div
                key={horario.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`flex items-center justify-between p-4 rounded-lg border hover:shadow-md transition-shadow ${
                  horario.estado === 'pendiente' || horario.es_solicitud
                    ? 'bg-amber-50 border-amber-200'
                    : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex-1 grid grid-cols-5 gap-4">
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Asignatura</p>
                    <div className="flex items-center gap-2">
                      <p className="text-slate-900">{horario.asignatura_nombre}</p>
                      {(horario.estado === 'pendiente' || horario.es_solicitud) && (
                        <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0.5">
                          Pendiente
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Docente</p>
                    <p className="text-slate-700">{horario.docente_nombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Espacio</p>
                    <p className="text-slate-700">{horario.espacio_nombre}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Día</p>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      {horario.dia_semana.charAt(0).toUpperCase() + horario.dia_semana.slice(1)}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-slate-500 text-xs mb-1">Horario</p>
                    <p className="text-slate-700">{horario.hora_inicio} - {horario.hora_fin}</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEliminarHorarioAsignado(horario.id)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
