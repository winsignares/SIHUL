import { motion } from 'motion/react';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { useReportes } from '../../hooks/useReportes';

type Reportes = ReturnType<typeof useReportes>;

/** Horario semanal completo de un grupo. */
export function ModalHorarioGrupo({
  showHorarioModal,
  setShowHorarioModal,
  grupoSeleccionado,
  obtenerHorariosGrupo
}: Pick<Reportes, 'showHorarioModal' | 'setShowHorarioModal' | 'grupoSeleccionado' | 'obtenerHorariosGrupo'>) {
  return (
    <Dialog open={showHorarioModal} onOpenChange={setShowHorarioModal}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-6 h-6 text-blue-600" />
            Horario Completo del Grupo {grupoSeleccionado}
          </DialogTitle>
        </DialogHeader>
        {grupoSeleccionado && (
          <div className="space-y-6 py-4">
            {/* Información del Grupo */}
            <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
              <CardContent className="p-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Grupo</p>
                    <Badge className="bg-blue-600">{grupoSeleccionado}</Badge>
                  </div>
                  <div>
                    <p className="text-slate-600 text-sm mb-1">Total de Clases</p>
                    <p className="text-slate-900">{obtenerHorariosGrupo(grupoSeleccionado).length} clases</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Grid Semanal */}
            <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                      <th className="border-2 border-slate-300 p-4 text-white w-32">
                        <Clock className="w-5 h-5 mx-auto mb-1" />
                        Hora
                      </th>
                      {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dia) => (
                        <th key={dia} className="border-2 border-slate-300 p-4 text-white">
                          {dia}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((hora) => {
                      // Convertir hora a rango (ej: "7:00" -> "7:00 - 8:00")
                      const horaNum = parseInt(hora.split(':')[0]);
                      const horaFin = horaNum + 1;
                      const horaRango = `${hora} - ${horaFin.toString().padStart(2, '0')}:00`;
                      
                      return (
                      <tr key={hora} className="hover:bg-slate-50 transition-colors">
                        <td className="border-2 border-slate-300 p-3 bg-slate-100 text-center text-slate-700 text-xs font-medium">
                          <div>{horaRango}</div>
                        </td>
                        {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map((dia) => {
                          const horariosDelGrupo = obtenerHorariosGrupo(grupoSeleccionado);
                          const clase = horariosDelGrupo.find(h => {
                            const diaMatch = h.dia.toLowerCase() === dia;
                            if (!diaMatch) return false;
                            
                            // Parsear el rango de horas (ej: "10:00-12:00")
                            const [horaInicio, horaFin] = h.hora.split('-');
                            const horaActual = parseInt(hora.split(':')[0]);
                            const horaInicioNum = parseInt(horaInicio.split(':')[0]);
                            const horaFinNum = parseInt(horaFin.split(':')[0]);
                            
                            // Verificar si la hora actual está dentro del rango
                            return horaActual >= horaInicioNum && horaActual < horaFinNum;
                          });
                          
                          return (
                            <td
                              key={dia}
                              className={`border-2 border-slate-300 p-2 transition-all ${clase
                                ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer'
                                : 'bg-white hover:bg-slate-50'
                                }`}
                            >
                              {clase ? (
                                <motion.div
                                  initial={{ scale: 0.9, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  className="h-full min-h-[120px] flex flex-col justify-center items-center text-white p-3 rounded-lg"
                                >
                                  <div className="text-center space-y-2 w-full">
                                    <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm mb-2">
                                      <p className="text-sm mb-1">{clase.asignatura}</p>
                                      <p className="text-xs text-yellow-200">{clase.docente}</p>
                                    </div>
                                    <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                      <MapPin className="w-4 h-4 text-yellow-300" />
                                      <span className="text-sm">{clase.espacio}</span>
                                    </div>
                                    <div className="text-xs text-yellow-100 mt-1">
                                      {clase.hora}
                                    </div>
                                  </div>
                                </motion.div>
                              ) : (
                                <div className="h-full min-h-[120px] flex items-center justify-center">
                                  <span className="text-slate-300 text-xs">—</span>
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Leyenda */}
            <div className="flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>
                <span className="text-slate-600">Clase asignada</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded"></div>
                <span className="text-slate-600">Hora libre</span>
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => setShowHorarioModal(false)} className="bg-blue-600 hover:bg-blue-700">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
