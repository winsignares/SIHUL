import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Label } from '../../../../components/ui/label';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import type { useConsultaEspacios } from '../../hooks/useConsultaEspacios';

import { formatHoraDecimal } from '../../hooks/consultaEspaciosComun';


import type { useMoverClase } from '../../hooks/useMoverClase';
type DeConsulta = ReturnType<typeof useConsultaEspacios>;

interface Props {
  moverClase: ReturnType<typeof useMoverClase>;
  filteredEspacios: DeConsulta['filteredEspacios'];
  diasSemana: DeConsulta['diasSemana'];
  horas: DeConsulta['horas'];
  getOcupacionPorHora: DeConsulta['getOcupacionPorHora'];
  getConflictoEnRango: DeConsulta['getConflictoEnRango'];
  describirConflicto: (conflicto: DeConsulta['horarios'][number]) => string;
}

/** Diálogo «Mover clase a otro espacio» del cronograma de la consulta de espacios. */
export function MoverClaseDialog({ moverClase, filteredEspacios, diasSemana, horas, getOcupacionPorHora, getConflictoEnRango, describirConflicto }: Props) {
  const {
    moveClassDialogOpen,
    setMoveClassDialogOpen,
    selectedClassToMove,
    setSelectedClassToMove,
    targetEspacioId,
    setTargetEspacioId,
    targetMoveDia,
    setTargetMoveDia,
    targetMoveHoraInicio,
    setTargetMoveHoraInicio,
    moveClassError,
    setMoveClassError,
    movingClass,
    ejecutarMovimientoOtroEspacio,
    conflictoMovimientoSeleccionado
  } = moverClase;

  return (
    <>
      {/* Diálogo para Mover Clase a Otro Espacio */}
      <Dialog open={moveClassDialogOpen} onOpenChange={setMoveClassDialogOpen}>
        <DialogContent className="w-[90vw] h-[85vh] max-w-none max-h-none overflow-y-auto p-4 sm:p-8 rounded-lg" style={{ maxWidth: '50vw' }}>
          <DialogHeader>
            <DialogTitle>Mover Clase a Otro Espacio</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {moveClassError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{moveClassError}</AlertDescription>
              </Alert>
            )}

            {/* Información de la clase actual y nuevo horario */}
            {selectedClassToMove && (
              <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">
                  Clase a Mover
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Materia:</span>
                    <p className="font-medium">{selectedClassToMove.materia}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Docente:</span>
                    <p className="font-medium">{selectedClassToMove.docente || 'No asignado'}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Horario Actual:</span>
                    <p className="font-medium">{selectedClassToMove.dia} {formatHoraDecimal(selectedClassToMove.horaInicio)}-{formatHoraDecimal(selectedClassToMove.horaFin)}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Grupo:</span>
                    <p className="font-medium">{selectedClassToMove.grupo || 'N/A'}</p>
                  </div>
                </div>
                {targetEspacioId && targetMoveDia && targetMoveHoraInicio !== null && (
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <span className="text-purple-600 dark:text-purple-400 font-medium">Nuevo Horario:</span>
                    <p className="font-medium text-purple-700 dark:text-purple-300">
                      {targetMoveDia} {formatHoraDecimal(targetMoveHoraInicio)}-{formatHoraDecimal(targetMoveHoraInicio + (selectedClassToMove.horaFin - selectedClassToMove.horaInicio))}
                    </p>
                    {conflictoMovimientoSeleccionado && (
                      <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                        Conflicto detectado con {describirConflicto(conflictoMovimientoSeleccionado)}.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Selección de espacio destino */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Seleccionar Espacio Destino</Label>
              <Select 
                value={targetEspacioId} 
                onValueChange={(value) => {
                setTargetEspacioId(value);
                // Inicializar día y hora con los valores originales al seleccionar espacio
                if (selectedClassToMove) {
                  setTargetMoveDia(selectedClassToMove.dia);
                  setTargetMoveHoraInicio(selectedClassToMove.horaInicio);
                }
              }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Seleccionar aula o espacio..." />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {filteredEspacios.map((espacio) => (
                    <SelectItem key={espacio.id} value={espacio.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{espacio.nombre}</span>
                        <span className="text-xs text-slate-500">
                          {espacio.tipo} - Cap: {espacio.capacidad} - {espacio.sede}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Vista previa del horario del espacio destino */}
            {targetEspacioId && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Vista Previa del Horario Destino
                </h3>
                <Card className="border-slate-200 dark:border-slate-700">
                  <CardContent className="p-4">
                    <div className="w-full">
                      <div className="grid grid-cols-[50px_repeat(6,1fr)] gap-1" style={{ gridAutoRows: '32px' }}>
                        {/* Headers */}
                        <div className="p-1"></div>
                        {diasSemana.map((dia) => (
                          <div
                            key={dia}
                            className={`text-xs text-center text-white font-semibold p-1 rounded bg-slate-800 ${
                              selectedClassToMove?.dia === dia ? 'ring-2 ring-purple-500' : ''
                            }`}
                          >
                            {dia.slice(0, 3)}
                          </div>
                        ))}

                        {/* Time slots */}
                        {horas.map((hora, idx) => (
                          <div key={`time-${hora}`} className="text-xs text-slate-500 flex items-center justify-end pr-1"
                            style={{ gridColumn: 1, gridRow: idx + 2 }}>
                            {formatHoraDecimal(hora)}
                          </div>
                        ))}

                        {/* Grid cells */}
                        {horas.flatMap((hora, horaIdx) =>
                          diasSemana.map((dia, diaIdx) => {
                            const ocupacionEnCelda = getOcupacionPorHora(targetEspacioId, dia, hora);

                            // Separar en horario vs prestamo
                            const horarioEnCelda = ocupacionEnCelda && ocupacionEnCelda.tipo !== 'prestamo' ? ocupacionEnCelda : null;
                            const prestamoEnCelda = ocupacionEnCelda && ocupacionEnCelda.tipo === 'prestamo' ? ocupacionEnCelda : null;
                            const duracionSeleccionada = selectedClassToMove
                              ? selectedClassToMove.horaFin - selectedClassToMove.horaInicio
                              : 0;
                            const conflictoPropuesto = selectedClassToMove
                              ? getConflictoEnRango(
                                  targetEspacioId,
                                  dia,
                                  hora,
                                  hora + duracionSeleccionada,
                                  selectedClassToMove
                                )
                              : null;

                            // Verificar si es el horario propuesto seleccionado
                            const isProposedSlot = selectedClassToMove &&
                              targetMoveDia &&
                              targetMoveHoraInicio !== null &&
                              dia === targetMoveDia &&
                              hora >= targetMoveHoraInicio &&
                              hora < targetMoveHoraInicio + duracionSeleccionada;
                            
                            // Verificar si esta celda está disponible para selección
                            const canSelect = !!selectedClassToMove && !conflictoPropuesto;

                            let bgClass = 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700';
                            let hoverClass = canSelect ? 'hover:bg-blue-50 hover:border-blue-300 cursor-pointer' : '';
                            let labelText = '';
                            let textClass = '';

                            if (prestamoEnCelda) {
                              // Los préstamos tienen prioridad sobre los horarios
                              const isPrestamoPendiente = prestamoEnCelda.estado === 'Pendiente';
                              bgClass = isPrestamoPendiente
                                ? 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700'
                                : 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700';
                              hoverClass = '';
                              labelText =
                                prestamoEnCelda.prestamo?.motivo ||
                                prestamoEnCelda.grupo ||
                                prestamoEnCelda.materia ||
                                (isPrestamoPendiente ? 'Préstamo pendiente' : 'Préstamo aprobado');
                              textClass = isPrestamoPendiente ? 'text-yellow-600' : 'text-green-600';
                            } else if (horarioEnCelda) {
                              bgClass = 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700';
                              hoverClass = '';
                              labelText = horarioEnCelda.materia || 'Ocupado';
                              textClass = 'text-red-600';
                            }
                            if (isProposedSlot) {
                              bgClass = conflictoMovimientoSeleccionado
                                ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 ring-2 ring-red-500'
                                : 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-700 ring-2 ring-purple-500';
                              hoverClass = '';
                            }

                            return (
                              <div
                                key={`preview-${dia}-${hora}`}
                                className={`border rounded text-xs flex items-center justify-center ${bgClass} ${hoverClass} transition-colors`}
                                style={{ gridColumn: diaIdx + 2, gridRow: horaIdx + 2 }}
                                onClick={() => {
                                  if (canSelect) {
                                    setTargetMoveDia(dia);
                                    setTargetMoveHoraInicio(hora);
                                    // Limpiar error si existe
                                    if (moveClassError) setMoveClassError(null);
                                  }
                                }}
                                title={
                                  canSelect
                                    ? `Seleccionar ${dia} ${formatHoraDecimal(hora)}`
                                    : conflictoPropuesto
                                      ? `No disponible: ${describirConflicto(conflictoPropuesto)}`
                                      : ''
                                }
                              >
                                {prestamoEnCelda && <span className={`${textClass} font-medium truncate px-1`}>{labelText}</span>}
                                {!prestamoEnCelda && horarioEnCelda && <span className={`${textClass} font-medium truncate px-1`}>{labelText}</span>}
                                {isProposedSlot && !horarioEnCelda && !prestamoEnCelda && (
                                  <span className={`${conflictoMovimientoSeleccionado ? 'text-red-600' : 'text-purple-600'} font-medium`}>
                                    {conflictoMovimientoSeleccionado ? 'Conflicto' : 'Nuevo'}
                                  </span>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-3 mt-3 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded"></div>
                        <span>Horario ocupado</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-yellow-100 border border-yellow-300 rounded"></div>
                        <span>Préstamo pendiente</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-green-100 border border-green-300 rounded"></div>
                        <span>Préstamo aprobado</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-purple-100 border border-purple-300 rounded ring-1 ring-purple-500"></div>
                        <span>Posición propuesta</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-red-100 border border-red-300 rounded ring-1 ring-red-500"></div>
                        <span>Posición con conflicto</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button variant="outline" onClick={() => {
              setMoveClassDialogOpen(false);
              setSelectedClassToMove(null);
              setTargetEspacioId('');
              setTargetMoveDia('');
              setTargetMoveHoraInicio(null);
              setMoveClassError(null);
            }}>
              Cancelar
            </Button>
            <Button 
              onClick={ejecutarMovimientoOtroEspacio}
              disabled={!targetEspacioId || movingClass || !!conflictoMovimientoSeleccionado}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
            >
              {movingClass ? 'Moviendo...' : 'Mover Clase'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
