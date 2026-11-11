import { Input } from '../../../share/input';
import { Button } from '../../../share/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { SearchableSelect } from '../../../share/searchableSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../share/dialog';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import { Alert, AlertDescription } from '../../../share/alert';
import { AlertCircle, Trash2 } from 'lucide-react';

import { type RepeatQuickOption, type CustomPeriod, formatHoraDecimal } from '../../../hooks/espacios/consultaEspaciosComun';
import { useNuevaSolicitud, type ContextoNuevaSolicitud } from '../../../hooks/espacios/useNuevaSolicitud';

/** Ventana «Nueva Solicitud» de la consulta de espacios (préstamo de un espacio desde el cronograma). */
export function NuevaSolicitudDialog(contexto: ContextoNuevaSolicitud) {
  const { user, dialogSolicitudOpen, setDialogSolicitudOpen, nuevaSolicitudData } = contexto;
  const {
    tiposActividad,
    recursosDisponibles,
    espaciosDisponibles,
    recursosSeleccionados,
    formData,
    setFormData,
    repeatOption,
    setRepeatOption,
    customPeriod,
    setCustomPeriod,
    formError,
    submitting,
    recurrencePreviewDates,
    horaFinEditable,
    setHoraFinEditable,
    conflictosFormulario,
    FIN_REPETICION_OPTIONS,
    DIAS_SEMANA_OPTIONS,
    repeatOptions,
    intervaloMaximoPeriodo,
    finRepeticionMaxFecha,
    ocurrenciasMaximoPeriodo,
    toggleDiaSemana,
    recurrenceSummary,
    agregarRecurso,
    eliminarRecurso,
    handleSubmitSolicitud
  } = useNuevaSolicitud(contexto);

  return (
    <>
      {/* Modal de Nueva Solicitud */}
      <Dialog open={dialogSolicitudOpen} onOpenChange={setDialogSolicitudOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Información del horario seleccionado */}
            {nuevaSolicitudData && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Horario Seleccionado
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Espacio:</span>
                    <p className="font-medium">{nuevaSolicitudData.espacio_nombre}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Día:</span>
                    <p className="font-medium">{nuevaSolicitudData.diaSemana}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Fecha:</span>
                    <p className="font-medium">{nuevaSolicitudData.fecha}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Horario:</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-medium">{nuevaSolicitudData.horaInicio}</span>
                      <span className="text-slate-400">-</span>
                      <Select
                        value={horaFinEditable?.toString() || ''}
                        onValueChange={(v) => setHoraFinEditable(parseInt(v, 10))}
                      >
                        <SelectTrigger className="h-8 text-sm w-[100px]">
                          <SelectValue placeholder="Hora fin" />
                        </SelectTrigger>
                        <SelectContent>
                          {(() => {
                            const horaInicioNum = parseInt(nuevaSolicitudData.horaInicio.split(':')[0], 10);
                            // Generar opciones desde hora inicio + 1 hasta 23:00
                            const opciones = [];
                            for (let h = horaInicioNum + 1; h <= 23; h++) {
                              opciones.push(
                                <SelectItem key={h} value={h.toString()}>
                                  {String(h).padStart(2, '0')}:00
                                </SelectItem>
                              );
                            }
                            return opciones;
                          })()}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Advertencia de Conflictos */}
            {conflictosFormulario.length > 0 && (
              <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-red-900 dark:text-red-100 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  Horarios Ocupados en {nuevaSolicitudData?.espacio_nombre}
                </h3>
                <div className="space-y-1">
                  {conflictosFormulario.map((conflicto, idx) => (
                    <div key={idx} className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 bg-red-600 rounded-full"></span>
                      <span className="font-medium">{conflicto.materia}</span>
                      <span className="text-red-600 dark:text-red-400">
                        ({formatHoraDecimal(conflicto.horaInicio)} - {formatHoraDecimal(conflicto.horaFin)})
                      </span>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-red-700 dark:text-red-300 mt-2">
                  Este espacio tiene {conflictosFormulario.length} horario(s) ocupado(s) en el rango seleccionado. 
                  Puede seleccionar otro espacio disponible abajo.
                </p>
              </div>
            )}

            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Información del Solicitante
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Solicitante</Label>
                  <Input value={user?.nombre || ''} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.correo || ''} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            {/* Selección de Espacio */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Selección de Espacio
              </h3>
              {espaciosDisponibles.length > 0 ? (
                <div className="space-y-2">
                  <Label>Espacio Disponible *</Label>
                  <Select
                    value={formData.espacio_id > 0 ? formData.espacio_id.toString() : ''}
                    onValueChange={(v) => setFormData({ ...formData, espacio_id: parseInt(v) })}
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
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay espacios disponibles para la fecha y horario seleccionados.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Detalles de la Actividad */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Detalles de la Actividad
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Actividad *</Label>
                  <Select
                    value={formData.tipo_actividad_id > 0 ? formData.tipo_actividad_id.toString() : ''}
                    onValueChange={(v) => setFormData({ ...formData, tipo_actividad_id: parseInt(v) })}
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
                  <Label>Número de Asistentes</Label>
                  <Input
                    type="number"
                    value={formData.asistentes}
                    onChange={(e) => setFormData({ ...formData, asistentes: e.target.value })}
                    placeholder="Ej: 30"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo del Préstamo *</Label>
                <Textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Describa el motivo de la solicitud (clase adicional, tutoría, evento, etc.)"
                  rows={3}
                />
              </div>
            </div>

            {/* Configuración de repetición */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Configuración de repetición
              </h3>

              <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="space-y-2">
                  <Label>Repetición</Label>
                  <Select value={repeatOption} onValueChange={(v: RepeatQuickOption) => setRepeatOption(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="No se repite" />
                    </SelectTrigger>
                    <SelectContent>
                      {repeatOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {repeatOption === 'custom' && (
                  <div className="space-y-4 border rounded-md p-3 bg-white dark:bg-slate-900/40">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Repetir cada *</Label>
                        <Input
                          type="number"
                          min="1"
                          max={Math.min(
                            customPeriod === 'day' ? 31 : customPeriod === 'week' ? 3 : customPeriod === 'month' ? 11 : 5,
                            intervaloMaximoPeriodo ?? Infinity
                          )}
                          value={formData.intervalo}
                          onChange={(e) => {
                            const maxValue = Math.min(
                              customPeriod === 'day' ? 31 : customPeriod === 'week' ? 3 : customPeriod === 'month' ? 11 : 5,
                              intervaloMaximoPeriodo ?? Infinity
                            );
                            const value = Math.max(1, Math.min(maxValue, Number(e.target.value) || 1));
                            setFormData((prev) => ({
                              ...prev,
                              intervalo: value
                            }));
                          }}
                        />
                        <p className="text-xs text-slate-500">
                          Máximo: {customPeriod === 'day' ? '31 días' : customPeriod === 'week' ? '3 semanas' : '11 meses'}
                          {intervaloMaximoPeriodo != null && (
                            <> (limitado a {intervaloMaximoPeriodo} por lo que resta del periodo académico)</>
                          )}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Periodo *</Label>
                        <Select value={customPeriod} onValueChange={(v: CustomPeriod) => setCustomPeriod(v)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Periodo" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="day">Día</SelectItem>
                            <SelectItem value="week">Semana</SelectItem>
                            <SelectItem value="month">Mes</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {customPeriod === 'week' && (
                      <div className="space-y-2">
                        <Label>Días de la semana *</Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {DIAS_SEMANA_OPTIONS.map((dia) => {
                            const selected = formData.dias_semana.includes(dia.value);
                            return (
                              <button
                                key={dia.value}
                                type="button"
                                onClick={() => toggleDiaSemana(dia.value)}
                                className={`px-3 py-2 rounded-md border text-sm text-left transition-colors ${selected
                                  ? 'bg-blue-100 border-blue-400 text-blue-800 dark:bg-blue-950/40 dark:border-blue-700 dark:text-blue-200'
                                  : 'bg-white border-slate-300 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200'
                                }`}
                              >
                                {dia.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {repeatOption !== 'none' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Finaliza repetición</Label>
                      <Select
                        value={formData.fin_repeticion_tipo}
                        onValueChange={(v: 'never' | 'until_date' | 'count') =>
                          setFormData((prev) => ({
                            ...prev,
                            fin_repeticion_tipo: v,
                            fin_repeticion_fecha: v === 'until_date' ? prev.fin_repeticion_fecha : '',
                            fin_repeticion_ocurrencias: v === 'count' ? prev.fin_repeticion_ocurrencias : ''
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar fin" />
                        </SelectTrigger>
                        <SelectContent>
                          {FIN_REPETICION_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {formData.fin_repeticion_tipo === 'until_date' && (
                      <div className="space-y-2">
                        <Label>Fecha de finalización *</Label>
                        <Input
                          type="date"
                          max={finRepeticionMaxFecha ?? undefined}
                          value={formData.fin_repeticion_fecha}
                          onChange={(e) => {
                            const value = finRepeticionMaxFecha && e.target.value > finRepeticionMaxFecha
                              ? finRepeticionMaxFecha
                              : e.target.value;
                            setFormData((prev) => ({ ...prev, fin_repeticion_fecha: value }));
                          }}
                        />
                        {finRepeticionMaxFecha && (
                          <p className="text-xs text-slate-500">
                            El periodo académico finaliza el {new Date(`${finRepeticionMaxFecha}T00:00:00`).toLocaleDateString('es-CO')}.
                          </p>
                        )}
                      </div>
                    )}

                    {formData.fin_repeticion_tipo === 'count' && (
                      <div className="space-y-2">
                        <Label>Número de repeticiones *</Label>
                        <Input
                          type="number"
                          min="1"
                          max={ocurrenciasMaximoPeriodo ?? undefined}
                          value={formData.fin_repeticion_ocurrencias}
                          onChange={(e) => {
                            let value = e.target.value;
                            if (ocurrenciasMaximoPeriodo != null && Number(value) > ocurrenciasMaximoPeriodo) {
                              value = String(ocurrenciasMaximoPeriodo);
                            }
                            setFormData((prev) => ({ ...prev, fin_repeticion_ocurrencias: value }));
                          }}
                          placeholder="Ej: 10"
                        />
                        {ocurrenciasMaximoPeriodo != null && (
                          <p className="text-xs text-slate-500">
                            Máximo {ocurrenciasMaximoPeriodo} repeticiones dentro del periodo académico.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-2">
                  {recurrenceSummary()}
                </p>

                {/* Preview visual de fechas generadas */}
                {recurrencePreviewDates.length > 0 && repeatOption !== 'none' && (
                  <div className="mt-4 border rounded-lg overflow-hidden bg-white dark:bg-slate-900/40">
                    <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        Vista previa de horarios ({recurrencePreviewDates.length} fechas)
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto p-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {recurrencePreviewDates.map((date, idx) => (
                          <div
                            key={idx}
                            className={`flex items-center gap-2 p-2 rounded-md text-sm ${
                              idx === 0
                                ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700'
                                : 'bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                              idx === 0
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200'
                            }`}>
                              {idx + 1}
                            </div>
                            <div className="flex-1">
                              <p className={`font-medium ${idx === 0 ? 'text-blue-800 dark:text-blue-200' : 'text-slate-700 dark:text-slate-300'}`}>
                                {date.toLocaleDateString('es-CO', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })}
                              </p>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {nuevaSolicitudData?.horaInicio} - {nuevaSolicitudData?.horaFin}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {recurrencePreviewDates.length >= 100 && (
                      <div className="px-4 py-2 bg-yellow-50 dark:bg-yellow-900/20 border-t border-yellow-200 dark:border-yellow-800">
                        <p className="text-xs text-yellow-700 dark:text-yellow-300">
                          Se muestran las primeras 100 ocurrencias. Hay más fechas que se generarán según la configuración.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Recursos Adicionales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Recursos Adicionales (Opcional)
              </h3>
              <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <div>
                  <Label className="text-sm font-medium">Agregar recursos necesarios</Label>
                  <div className="mt-2">
                    <SearchableSelect
                      items={recursosDisponibles.filter(r => !recursosSeleccionados.some(s => s.recurso_id === r.id))}
                      value={null}
                      onSelect={(recurso) => agregarRecurso(recurso.id!)}
                      getItemId={(recurso) => recurso.id!}
                      getItemLabel={(recurso) => recurso.nombre}
                      placeholder="Seleccionar recurso..."
                      searchPlaceholder="Buscar recurso..."
                      emptyMessage="No se encontró ningún recurso."
                    />
                  </div>
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
              <Button variant="outline" onClick={() => setDialogSolicitudOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitSolicitud} 
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
