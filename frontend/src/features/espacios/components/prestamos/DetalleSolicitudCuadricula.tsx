import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Calendar, User, FileText, Package, Sparkles } from 'lucide-react';
import type { usePrestamosEspaciosPagina } from '../../hooks/usePrestamosEspaciosPagina';

type Gestion = ReturnType<typeof usePrestamosEspaciosPagina>;

/** Detalle de una solicitud en la vista de cuadrícula. */
export function DetalleSolicitudCuadricula({ detalleGridId, setDetalleGridId, filteredPrestamos, recurrenceSummary, getEstadoBadge, getEstadoIcon }: Pick<Gestion, 'detalleGridId' | 'setDetalleGridId' | 'filteredPrestamos' | 'recurrenceSummary' | 'getEstadoBadge' | 'getEstadoIcon'>) {
  return (
    <Dialog open={detalleGridId !== null} onOpenChange={(open) => { if (!open) setDetalleGridId(null); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        {(() => {
          const prestamo = filteredPrestamos.find((p) => p.id === detalleGridId);
          if (!prestamo) return null;
          return (
            <>
              <DialogHeader>
                <DialogTitle className="text-2xl flex items-center gap-2">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${prestamo.estado === 'pendiente' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                      prestamo.estado === 'aprobado' ? 'bg-green-50 dark:bg-green-950/20' :
                        'bg-red-50 dark:bg-red-950/20'
                    }`}>
                    {getEstadoIcon(prestamo.estado)}
                  </div>
                  Detalles de la Solicitud
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Estado actual</span>
                  {getEstadoBadge(prestamo.estado)}
                </div>

                <div className="space-y-3">
                  <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <User className="w-5 h-5 text-blue-600" />
                    Información del Solicitante
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Nombre</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.solicitante}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Email</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.email}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Teléfono</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.telefono}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Fecha de Solicitud</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.fechaSolicitud}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    Detalles del Evento
                  </h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Espacio Solicitado</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.espacio}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Tipo de Evento</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.tipoEvento}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Fecha</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.fecha}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Horario</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                    </div>
                    <div>
                      <Label className="text-slate-600 dark:text-slate-400 text-xs">Asistentes</Label>
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.asistentes}</p>
                    </div>
                    {prestamo.periodo_nombre && (
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Periodo académico</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.periodo_nombre}</p>
                      </div>
                    )}
                  </div>
                </div>

                {prestamo.recursosNecesarios.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Package className="w-5 h-5 text-blue-600" />
                      Recursos Necesarios
                    </h3>
                    <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      {prestamo.recursosNecesarios.map((recurso, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                        >
                          {recurso}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {prestamo.motivo && (
                  <div className="space-y-3">
                    <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-slate-600" />
                      Motivo
                    </h3>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-900 dark:text-slate-100">{prestamo.motivo}</p>
                    </div>
                  </div>
                )}

                {prestamo.es_recurrente && (
                  <div className="space-y-3">
                    <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-indigo-600" />
                      Repetición
                    </h3>
                    <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      <p className="text-slate-900 dark:text-slate-100 text-sm">{recurrenceSummary(prestamo)}</p>
                    </div>
                  </div>
                )}
              </div>
            </>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
