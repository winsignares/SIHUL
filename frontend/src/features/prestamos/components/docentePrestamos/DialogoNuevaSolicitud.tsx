import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Textarea } from '../../../../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Loading } from '../../../../components/common/Loading';
import type { useDocentePrestamos } from '../../hooks/useDocentePrestamos';

type DocentePrestamos = ReturnType<typeof useDocentePrestamos>;

/** Diálogo para crear una nueva solicitud de préstamo. */
export function DialogoNuevaSolicitud({
  dialogOpen,
  setDialogOpen,
  error,
  nuevaSolicitud,
  setNuevaSolicitud,
  sedes,
  espaciosDisponibles,
  cargandoEspacios,
  tiposActividad,
  recursosDisponibles,
  recursosSeleccionados,
  agregarRecurso,
  eliminarRecurso,
  crearSolicitud
}: Pick<DocentePrestamos, 'dialogOpen' | 'setDialogOpen' | 'error' | 'nuevaSolicitud' | 'setNuevaSolicitud' | 'sedes' | 'espaciosDisponibles' | 'cargandoEspacios' | 'tiposActividad' | 'recursosDisponibles' | 'recursosSeleccionados' | 'agregarRecurso' | 'eliminarRecurso' | 'crearSolicitud'>) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nueva Solicitud
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 py-4">

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Información Personal */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
            Información del Solicitante
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="solicitante">Nombre del Solicitante</Label>
              <Input
                id="solicitante"
                value={nuevaSolicitud.solicitante}
                onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, solicitante: e.target.value })}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={nuevaSolicitud.email}
                onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, email: e.target.value })}
                disabled
                className="bg-slate-50 dark:bg-slate-800"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefono">Teléfono de Contacto</Label>
            <Input
              id="telefono"
              value={nuevaSolicitud.telefono}
              onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, telefono: e.target.value })}
              placeholder="+57 300 123 4567"
            />
          </div>
        </div>

        {/* Ubicación y Horario */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
            Ubicación y Horario
          </h3>
          <div className="space-y-2">
            <Label htmlFor="sede">Sede *</Label>
            <Select
              value={nuevaSolicitud.sede_id > 0 ? nuevaSolicitud.sede_id.toString() : ''}
              onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, sede_id: parseInt(v), espacio_id: 0 })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sede" />
              </SelectTrigger>
              <SelectContent>
                {sedes.map(sede => (
                  <SelectItem key={sede.id ?? 0} value={sede.id?.toString() ?? ''}>{sede.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input
                id="fecha"
                type="date"
                value={nuevaSolicitud.fecha}
                onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, fecha: e.target.value, espacio_id: 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaInicio">Hora Inicio *</Label>
              <Input
                id="horaInicio"
                type="time"
                value={nuevaSolicitud.horaInicio}
                onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, horaInicio: e.target.value, espacio_id: 0 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="horaFin">Hora Fin *</Label>
              <Input
                id="horaFin"
                type="time"
                value={nuevaSolicitud.horaFin}
                onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, horaFin: e.target.value, espacio_id: 0 })}
              />
            </div>
          </div>
        </div>

        {/* Selección de Espacio */}
        {nuevaSolicitud.sede_id > 0 && nuevaSolicitud.fecha && nuevaSolicitud.horaInicio && nuevaSolicitud.horaFin && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
              Selección de Espacio
            </h3>
            {espaciosDisponibles.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="espacio">Espacio Disponible *</Label>
                <Select
                  value={nuevaSolicitud.espacio_id > 0 ? nuevaSolicitud.espacio_id.toString() : ''}
                  onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, espacio_id: parseInt(v) })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar espacio disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {espaciosDisponibles.map(espacio => (
                      <SelectItem key={espacio.id} value={espacio.id.toString()}>
                        {espacio.nombre} - {espacio.tipo} (Capacidad: {espacio.capacidad})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                  {espaciosDisponibles.length} espacio(s) disponible(s) para este horario
                </p>
              </div>
            ) : cargandoEspacios ? (
              <Loading compact message="Buscando espacios disponibles..." />
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No hay espacios disponibles para la sede, fecha y horario seleccionados.
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Detalles de la Actividad */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
            Detalles de la Actividad
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="tipoEvento">Tipo de Actividad *</Label>
              <Select
                value={nuevaSolicitud.tipo_actividad_id > 0 ? nuevaSolicitud.tipo_actividad_id.toString() : ''}
                onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, tipo_actividad_id: parseInt(v) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {tiposActividad.map(tipo => (
                    <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="asistentes">Número de Asistentes</Label>
              <Input
                id="asistentes"
                type="number"
                value={nuevaSolicitud.asistentes}
                onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, asistentes: e.target.value })}
                placeholder="Ej: 30"
                min="0"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="motivo">Motivo del Préstamo *</Label>
            <Textarea
              id="motivo"
              value={nuevaSolicitud.motivo}
              onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, motivo: e.target.value })}
              placeholder="Describa el motivo de la solicitud (clase adicional, tutoría, evento, etc.)"
              rows={3}
            />
          </div>
        </div>

        {/* Recursos Adicionales */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
            Recursos Adicionales (Opcional)
          </h3>
          <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Agregar recursos necesarios</Label>
              <Select onValueChange={(v) => agregarRecurso(parseInt(v))}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Agregar recurso..." />
                </SelectTrigger>
                <SelectContent>
                  {recursosDisponibles.map((recurso) => (
                    <SelectItem key={recurso.id} value={recurso.id!.toString()}>
                      {recurso.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {recursosSeleccionados.length > 0 ? (
              <div className="space-y-2">
                {recursosSeleccionados.map((item) => (
                  <div key={item.recurso_id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {item.recurso_nombre}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => eliminarRecurso(item.recurso_id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-3 text-slate-500 dark:text-slate-400 text-sm italic">
                No has seleccionado ningún recurso
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setDialogOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={crearSolicitud} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
            Enviar Solicitud
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
  );
}
