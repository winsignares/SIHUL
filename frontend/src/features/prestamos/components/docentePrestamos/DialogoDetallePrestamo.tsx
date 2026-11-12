import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Plus, Save, X as XIcon } from 'lucide-react';
import { getEstadoBadge } from './EstadoPrestamoBadge';
import type { useDocentePrestamos } from '../../hooks/useDocentePrestamos';

type DocentePrestamos = ReturnType<typeof useDocentePrestamos>;

/** Diálogo con el detalle de una solicitud, con edición cuando aplica. */
export function DialogoDetallePrestamo({
  dialogPrestamoId,
  prestamos,
  modoEdicion,
  prestamoEditando,
  setPrestamoEditando,
  cancelarEdicion,
  guardarEdicion
}: Pick<DocentePrestamos, 'dialogPrestamoId' | 'prestamos' | 'modoEdicion' | 'prestamoEditando' | 'setPrestamoEditando' | 'cancelarEdicion' | 'guardarEdicion'>) {
  return (
    <Dialog 
      open={!!dialogPrestamoId}
      onOpenChange={(open) => {
        if (!open) {
          cancelarEdicion();
        }
      }}
    >
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalles del Préstamo</DialogTitle>
        </DialogHeader>
        {(() => {
          // Si no hay dialogPrestamoId, no renderizar nada (durante cierre o estado inicial)
          if (!dialogPrestamoId) {
            return <div className="text-center py-8 text-slate-500">Cargando...</div>;
          }

          // Siempre buscar el préstamo actual por ID en la lista COMPLETA (sin filtros)
          const prestamoActual = prestamos.find(p => p.id === dialogPrestamoId);
          
          if (!prestamoActual) {
            return <div className="text-center py-8 text-red-500">Error: Préstamo no encontrado</div>;
          }

          // Usar prestamoEditando si está en modo edición, sino usar el préstamo actual
          const prestamo = modoEdicion && prestamoEditando ? prestamoEditando : prestamoActual;

          return (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-600 dark:text-slate-400">Espacio</Label>
                  <p className="text-slate-900 dark:text-slate-100">{prestamo.espacio}</p>
                </div>
                <div>
                  <Label className="text-slate-600 dark:text-slate-400">Fecha</Label>
                  {modoEdicion && prestamoEditando ? (
                    <Input
                      type="date"
                      value={prestamoEditando.fecha}
                      onChange={(e) => setPrestamoEditando({ ...prestamoEditando, fecha: e.target.value })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-100">{prestamo.fecha}</p>
                  )}
                </div>
                <div>
                  <Label className="text-slate-600 dark:text-slate-400">Horario</Label>
                  {modoEdicion && prestamoEditando ? (
                    <div className="flex gap-2 items-center mt-1">
                      <Input
                        type="time"
                        value={prestamoEditando.horaInicio}
                        onChange={(e) => setPrestamoEditando({ ...prestamoEditando, horaInicio: e.target.value })}
                      />
                      <span>-</span>
                      <Input
                        type="time"
                        value={prestamoEditando.horaFin}
                        onChange={(e) => setPrestamoEditando({ ...prestamoEditando, horaFin: e.target.value })}
                      />
                    </div>
                  ) : (
                    <p className="text-slate-900 dark:text-slate-100">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                  )}
                </div>
                <div>
                  <Label className="text-slate-600 dark:text-slate-400">Asistentes</Label>
                  {modoEdicion && prestamoEditando ? (
                    <Input
                      type="number"
                      min="1"
                      value={prestamoEditando.asistentes}
                      onChange={(e) => setPrestamoEditando({ ...prestamoEditando, asistentes: parseInt(e.target.value) || 0 })}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-slate-900 dark:text-slate-100">{prestamo.asistentes}</p>
                  )}
                </div>
              </div>
              <div>
                <Label className="text-slate-600 dark:text-slate-400">Motivo</Label>
                {modoEdicion && prestamoEditando ? (
                  <Textarea
                    value={prestamoEditando.motivo}
                    onChange={(e) => setPrestamoEditando({ ...prestamoEditando, motivo: e.target.value })}
                    rows={3}
                    className="resize-none mt-1"
                  />
                ) : (
                  <p className="text-slate-900 dark:text-slate-100">{prestamo.motivo}</p>
                )}
              </div>
              <div>
                <Label className="text-slate-600 dark:text-slate-400">Recursos Necesarios</Label>
                <div className="flex flex-col gap-2 mt-2">
                  <div className="flex flex-wrap gap-2">
                    {modoEdicion && prestamoEditando ? (
                      prestamoEditando.recursosNecesarios.map((recurso, index) => (
                        <Badge key={index} variant="outline" className="flex items-center gap-1">
                          {recurso}
                          <button
                            type="button"
                            onClick={() => {
                              const nuevosRecursos = prestamoEditando.recursosNecesarios.filter((_, i) => i !== index);
                              setPrestamoEditando({ ...prestamoEditando, recursosNecesarios: nuevosRecursos });
                            }}
                            aria-label="Eliminar recurso"
                            title="Eliminar recurso"
                            className="ml-1 hover:text-red-600"
                          >
                            <XIcon className="w-3 h-3" />
                          </button>
                        </Badge>
                      ))
                    ) : (
                      prestamo.recursosNecesarios.map((recurso, index) => (
                        <Badge key={index} variant="outline">{recurso}</Badge>
                      ))
                    )}
                  </div>
                  {modoEdicion && prestamoEditando && (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Agregar recurso..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                            const nuevoRecurso = e.currentTarget.value.trim();
                            setPrestamoEditando({
                              ...prestamoEditando,
                              recursosNecesarios: [...prestamoEditando.recursosNecesarios, nuevoRecurso]
                            });
                            e.currentTarget.value = '';
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                          if (input?.value.trim()) {
                            const nuevoRecurso = input.value.trim();
                            setPrestamoEditando({
                              ...prestamoEditando,
                              recursosNecesarios: [...prestamoEditando.recursosNecesarios, nuevoRecurso]
                            });
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              {prestamo.comentariosAdmin && (
                <div>
                  <Label className="text-slate-600 dark:text-slate-400">Comentarios del Administrador</Label>
                  <p className="text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg mt-2">
                    {prestamo.comentariosAdmin}
                  </p>
                </div>
              )}
              <div>
                <Label className="text-slate-600 dark:text-slate-400">Estado</Label>
                <div className="mt-2">{getEstadoBadge(prestamo.estado)}</div>
              </div>
              {modoEdicion && prestamoEditando && (
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <Button
                    onClick={cancelarEdicion}
                    variant="outline"
                  >
                    <XIcon className="w-4 h-4 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    onClick={guardarEdicion}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Guardar Cambios
                  </Button>
                </div>
              )}
            </div>
          );
        })()}
      </DialogContent>
    </Dialog>
  );
}
