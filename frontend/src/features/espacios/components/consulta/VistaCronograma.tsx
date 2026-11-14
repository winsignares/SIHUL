import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { 
  GripVertical, 
  RefreshCw, 
  Pencil,
  Trash2
} from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../../components/ui/tooltip';
import { toast } from 'sonner';



import type { useConsultaEspacios } from '../../hooks/useConsultaEspacios';

interface Props {
  hook: ReturnType<typeof useConsultaEspacios>;
  dragOverCell: { dia: string, hora: number } | null;
  setDragOverCell: (valor: { dia: string, hora: number } | null) => void;
  draggedHorario: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null;
  setDraggedHorario: (valor: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null) => void;
  editModeEnabled: boolean;
  setEditModeEnabled: (valor: boolean) => void;
  espaciosToShow: ReturnType<typeof useConsultaEspacios>['filteredEspacios'];
  estaEnRangoSeleccion: (espacioId: string, dia: string, hora: number) => boolean;
  getDayColumnIndex: (dia: string) => number;
  puedeEditarDisponibilidad: boolean;
  setConfirmDeleteDialogOpen: (valor: boolean) => void;
  setConfirmMoveDialogOpen: (valor: boolean) => void;
  setHorarioToDelete: (valor: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null) => void;
  setIsProcessingMove: (valor: boolean) => void;
  setMoveClassDialogOpen: (valor: boolean) => void;
  setMoveClassError: (valor: string | null) => void;
  setPendingMove: (valor: { horario: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null, targetDia: string, targetHoraInicio: number } | null) => void;
  setSelectedClassToMove: (valor: ReturnType<typeof useConsultaEspacios>['horarios'][number] | null) => void;
  setTargetEspacioId: (valor: string) => void;
  validarMovimiento: (horario: ReturnType<typeof useConsultaEspacios>['horarios'][number], targetEspacioId: string, targetDia: string, targetHoraInicio: number, targetHoraFin: number) => { valido: boolean, error?: string };
}

/** Vista de cronograma de la consulta de espacios. */
export function VistaCronograma({ hook, dragOverCell, setDragOverCell, draggedHorario, setDraggedHorario, editModeEnabled, setEditModeEnabled, espaciosToShow, estaEnRangoSeleccion, getDayColumnIndex, puedeEditarDisponibilidad, setConfirmDeleteDialogOpen, setConfirmMoveDialogOpen, setHorarioToDelete, setIsProcessingMove, setMoveClassDialogOpen, setMoveClassError, setPendingMove, setSelectedClassToMove, setTargetEspacioId, validarMovimiento }: Props) {
  const {
    vistaActual,
    encabezadosDiasCronograma,
    horas,
    isDiaBloqueado,
    isCeldaBloqueada,
    horaToSlotIndex,
    isHoraExacta,
    horarios,
    getOcupacionPorHora,
    getConflictoEnRango,
    isDragging,
    iniciarSeleccion,
    actualizarSeleccion,
    finalizarSeleccion,
    puedeCrearSolicitudes,
    horariosLoading,
    loading,
  } = hook;

  return (
    <>
  {/* Vista Cronograma */}
  {vistaActual === 'cronograma' && (
    <div className="space-y-6">
      {/* Leyenda */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-green-500 rounded"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">Préstamo Aprobado</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-300 rounded"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">Préstamo Pendiente</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-yellow-600 rounded"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">Mantenimiento</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-[#f97316] rounded"></div>
              <span className="text-sm text-slate-700 dark:text-slate-300">Horario Pendiente</span>
            </div>
            {puedeCrearSolicitudes && (
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-purple-500 rounded border-2 border-purple-700"></div>
                <span className="text-sm text-slate-700 dark:text-slate-300">Seleccionar (drag para solicitud)</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Indicador de selección activa */}
      {isDragging && puedeCrearSolicitudes && (
        <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-3 text-center">
          <p className="text-purple-700 dark:text-purple-300 text-sm font-medium">
            Suelta el mouse para crear una nueva solicitud de préstamo
          </p>
        </div>
      )}

      {espaciosToShow.map((espacio) => (
        <motion.div
          key={espacio.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-900 dark:text-slate-100">{espacio.nombre}</CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="border-blue-600 text-blue-600">
                      {espacio.tipo}
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-600">
                      Capacidad: {espacio.capacidad}
                    </Badge>
                    <Badge variant="outline" className="border-slate-600 text-slate-600">
                      Edificio {espacio.edificio}
                    </Badge>
                  </div>
                </div>
                {puedeEditarDisponibilidad && (
                  <Button
                    variant={editModeEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setEditModeEnabled(!editModeEnabled)}
                    className={`${editModeEnabled
                      ? 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white'
                      : 'border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950'
                    }`}
                    title={editModeEnabled ? 'Deshabilitar edición de horarios' : 'Habilitar edición de horarios'}
                  >
                    <Pencil className="w-4 h-4 mr-2" />
                    {editModeEnabled ? 'Edición ON' : 'Editar'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div 
                className="overflow-x-auto relative"
                onMouseLeave={() => {
                  if (isDragging) finalizarSeleccion();
                }}
              >
                {(horariosLoading || loading) && (
                  <div className="absolute inset-0 z-30 bg-white/70 dark:bg-slate-900/70 backdrop-blur-[1px] flex items-center justify-center rounded-md">
                    <div className="flex flex-col items-center gap-2 text-slate-700 dark:text-slate-200">
                      <RefreshCw className="w-6 h-6 animate-spin" />
                      <span className="text-xs font-medium">Cargando horarios...</span>
                    </div>
                  </div>
                )}
                <div className="min-w-[1000px] grid grid-cols-[60px_repeat(7,1fr)] gap-1" style={{ gridAutoRows: '32px' }}>
                  <div className="p-2"></div>
                  {encabezadosDiasCronograma.map(({ dia, fecha }) => {
                    const diaBloqueado = isDiaBloqueado(dia);
                    return (
                    <div
                      key={dia}
                      className={`text-sm text-center text-white font-semibold p-2 rounded ${
                        diaBloqueado
                          ? 'bg-slate-500 shadow-[inset_0_0_0_9999px_rgba(15,23,42,0.25)]'
                          : 'bg-slate-800'
                      }`}
                    >
                      <div>{dia}</div>
                      <div className="text-[11px] font-medium opacity-90">{fecha}</div>
                    </div>
                  )})}

                  {horas.map((hora, idx) => (
                    <div
                      key={`time-${hora}`}
                      className={`text-xs text-slate-500 flex items-start justify-end pr-2 ${isHoraExacta(hora) ? 'font-semibold' : 'text-[9px] opacity-60'}`}
                      style={{
                        gridColumn: 1,
                        gridRow: idx + 2
                      }}
                    >
                      {isHoraExacta(hora) ? `${hora}:00` : `${hora % 1 === 0.25 ? '15' : hora % 1 === 0.5 ? '30' : '45'}`}
                    </div>
                  ))}

                  {/* Celdas vacías / disponibles - con interacción de selección y drop zone */}
                  {horas.flatMap((hora, horaIdx) =>
                    encabezadosDiasCronograma.map(({ dia }, diaIdx) => {
                      const ocupacionRaw = getOcupacionPorHora(espacio.id, dia, hora);
                    
                      // Verificar si la ocupación es del horario que se está arrastrando
                      const esOcupacionDelHorarioArrastrado = draggedHorario && ocupacionRaw && 
                        ocupacionRaw.id === draggedHorario.id &&
                        ocupacionRaw.materia === draggedHorario.materia;
                    
                      // Si es la ocupación del horario arrastrado, tratar como disponible
                      const ocupado = ocupacionRaw && !esOcupacionDelHorarioArrastrado;
                    
                      const estaSeleccionada = estaEnRangoSeleccion(espacio.id, dia, hora);
                      const celdaBloqueada = isCeldaBloqueada(dia, hora);
                    
                      // Verificar si esta celda es parte del rango donde se está arrastrando
                      // Para horarios de múltiples horas, resaltar todas las celdas que ocupará
                      // Slots de 15 minutos (4 slots por hora) para precisión en horarios
                      const duracionSlots = draggedHorario ? Math.round((draggedHorario.horaFin - draggedHorario.horaInicio) * 4) : 0;
                      const dropStartIdx = dragOverCell ? horaToSlotIndex(dragOverCell.hora) : -1;
                      const isDragOver = dragOverCell?.dia === dia &&
                        draggedHorario &&
                        horaIdx >= dropStartIdx &&
                        horaIdx < dropStartIdx + duracionSlots;
                      const conflictoDrop = draggedHorario
                        ? getConflictoEnRango(
                            espacio.id,
                            dia,
                            hora,
                            hora + (draggedHorario.horaFin - draggedHorario.horaInicio),
                            draggedHorario
                          )
                        : null;
                    
                      // Verificar si hay un horario arrastrado que puede soltarse aquí
                      // Para horarios, no bloquear por fecha pasada (son recurrentes)
                      const canDrop =
                        !!draggedHorario &&
                        editModeEnabled &&
                        draggedHorario.espacioId === espacio.id &&
                        !celdaBloqueada &&
                        !conflictoDrop;
                    
                      // Handlers inline sin useCallback (usar useCallback dentro de loop causa error de hooks)
                      const handleMouseDown = () => {
                        if (!celdaBloqueada && !ocupado && puedeCrearSolicitudes && !editModeEnabled) {
                          iniciarSeleccion(espacio.id, dia, hora);
                        }
                      };
                    
                      const handleMouseEnter = () => {
                        if (!celdaBloqueada && !ocupado && puedeCrearSolicitudes && !editModeEnabled) {
                          actualizarSeleccion(espacio.id, dia, hora);
                        }
                      };
                    
                      const handleMouseUp = () => {
                        if (puedeCrearSolicitudes && !editModeEnabled) {
                          finalizarSeleccion();
                        }
                      };
                    
                      const handleDragOver = (e: React.DragEvent) => {
                        if (canDrop) {
                          e.preventDefault();
                          setDragOverCell({ dia, hora });
                        } else if (dragOverCell?.dia === dia && dragOverCell?.hora === hora) {
                          setDragOverCell(null);
                        }
                      };
                    
                      const handleDragLeave = () => {
                        if (dragOverCell?.dia === dia && dragOverCell?.hora === hora) {
                          setDragOverCell(null);
                        }
                      };
                    
                      const handleDrop = (e: React.DragEvent) => {
                        e.preventDefault();
                        setDragOverCell(null);
                        if (draggedHorario && draggedHorario.espacioId === espacio.id) {
                          const duracion = draggedHorario.horaFin - draggedHorario.horaInicio;
                          const nuevaHoraInicio = hora;
                          const nuevaHoraFin = nuevaHoraInicio + duracion;
                        
                          if (nuevaHoraFin <= 23) {
                            const validacion = validarMovimiento(
                              draggedHorario,
                              espacio.id,
                              dia,
                              nuevaHoraInicio,
                              nuevaHoraFin
                            );

                            if (!validacion.valido) {
                              toast.error(validacion.error || 'No se puede mover el horario');
                              return;
                            }

                            setIsProcessingMove(false);
                            setPendingMove({
                              horario: draggedHorario,
                              targetDia: dia,
                              targetHoraInicio: nuevaHoraInicio
                            });
                            setConfirmMoveDialogOpen(true);
                          } else {
                            toast.error('No se puede mover el horario: las clases solo se permiten hasta las 23:00');
                          }
                        }
                      };

                      // Simplificado: solo verificar si es hora exacta para marcar visualmente
                      // La selección ahora es por bloques de 1 hora pero visualmente simple
                      const esHoraExactaSeleccion = estaSeleccionada && hora % 1 === 0;

                      return (
                        <div
                          key={`cell-${espacio.id}-${dia}-${hora}`}
                          className={`border rounded transition-all ${
                            isDragOver && canDrop
                              ? 'border-purple-500 bg-purple-100 dark:bg-purple-900/30 ring-2 ring-purple-500'
                              :
                            celdaBloqueada
                              ? 'border-slate-300 dark:border-slate-700 bg-slate-200/70 dark:bg-slate-900/60 shadow-[inset_0_0_0_9999px_rgba(15,23,42,0.06)] cursor-not-allowed'
                              :
                            ocupado
                              ? 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
                              : puedeCrearSolicitudes
                                ? estaSeleccionada
                                  ? esHoraExactaSeleccion
                                    ? 'bg-purple-500 border-purple-700 cursor-grabbing'
                                    : 'bg-purple-400 border-purple-600 cursor-grabbing'
                                  : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                          }`}
                          style={{
                            gridColumn: diaIdx + 2,
                            gridRow: horaIdx + 2,
                            zIndex: isDragOver && canDrop ? 20 : 1
                          }}
                          onMouseDown={handleMouseDown}
                          onMouseEnter={handleMouseEnter}
                          onMouseUp={handleMouseUp}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        />
                      );
                    })
                  )}

                  {/* Horarios ocupados */}
                  {horarios
                    .filter(h => h.espacioId === espacio.id && encabezadosDiasCronograma.some(d => d.dia === h.dia))
                    .map((ocupacion, idx) => {
                      const colStart = getDayColumnIndex(ocupacion.dia);
                      // Calcular fila usando slots de 15 minutos (precisión para horarios)
                      const slotStart = Math.round((ocupacion.horaInicio - 6) * 4);
                      const slotEnd = Math.round((ocupacion.horaFin - 6) * 4);
                      const rowStart = slotStart + 2;
                      const rowSpan = Math.max(1, slotEnd - slotStart);

                      // Validar rango: tenemos 68 slots (17 horas * 4) + 1 header = 69 filas
                      if (rowStart < 2 || rowStart > 70) return null;

                      // Determinar si es un préstamo o un horario académico
                      const isPrestamo = ocupacion.tipo === 'prestamo';
                      const isPrestamoPendiente = isPrestamo && ocupacion.prestamo?.estado === 'Pendiente';
                      const isPrestamoAprobado = isPrestamo && ocupacion.prestamo?.estado === 'Aprobado';
                      const isHorarioPendiente = !isPrestamo && ocupacion.estado === 'pendiente';
                      const prestamoMotivo = isPrestamo
                        ? ocupacion.prestamo?.motivo || ocupacion.grupo || ocupacion.materia || 'Préstamo'
                        : '';
                    
                      let colorClass = '';
                      let labelText = '';
                    
                      if (isPrestamoPendiente) {
                        colorClass = 'bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-slate-900';
                        labelText = 'PENDIENTE';
                      } else if (isPrestamoAprobado) {
                        colorClass = 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white';
                        labelText = '';
                      } else if (isHorarioPendiente) {
                        colorClass = 'bg-[#f97316] hover:bg-[#ea580c] text-white';
                        labelText = 'PENDIENTE';
                      } else if (ocupacion.estado === 'ocupado') {
                        colorClass = 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white';
                        labelText = ocupacion.materia || 'Ocupado';
                      } else {
                        colorClass = 'bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white';
                        labelText = '';
                      }

                      return (
                        <TooltipProvider key={`ocup-${idx}`}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                draggable={editModeEnabled && (!isPrestamo || isPrestamoPendiente)}
                                onDragStart={() => {
                                  if (editModeEnabled && (!isPrestamo || isPrestamoPendiente)) {
                                    setDraggedHorario(ocupacion);
                                  }
                                }}
                                onDragEnd={() => {
                                  setDraggedHorario(null);
                                  setDragOverCell(null);
                                }}
                                onClick={() => {
                                  if (!editModeEnabled) return;
                                  setSelectedClassToMove(ocupacion);
                                  setTargetEspacioId(espacio.id);
                                  setMoveClassDialogOpen(true);
                                  setMoveClassError(null);
                                }}
                                className={`${colorClass} text-white rounded p-1 sm:p-1.5 md:p-2 text-[10px] sm:text-[11px] md:text-xs ${
                                  editModeEnabled && (!isPrestamo || isPrestamoPendiente)
                                    ? 'cursor-move hover:ring-2 hover:ring-purple-400 group' 
                                    : 'cursor-pointer'
                                } shadow-sm flex flex-col justify-center items-center overflow-hidden h-full text-center leading-tight relative`}
                                style={{
                                  gridColumn: `${colStart} / span 1`,
                                  gridRow: `${rowStart} / span ${rowSpan}`,
                                  zIndex: 10,
                                  minHeight: `${rowSpan * 30}px`
                                }}
                              >
                                {editModeEnabled && (!isPrestamo || isPrestamoPendiente) && (
                                  <>
                                    <div className="absolute top-0.5 left-0.5 opacity-60">
                                      <GripVertical className="w-3 h-3" />
                                    </div>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (ocupacion.id) {
                                          setHorarioToDelete(ocupacion);
                                          setConfirmDeleteDialogOpen(true);
                                        } else {
                                          toast.error('No se puede eliminar: ID no disponible');
                                        }
                                      }}
                                      className="absolute top-0.5 right-0.5 p-0.5 bg-white/30 hover:bg-red-500 hover:text-white rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                      title="Eliminar horario"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  </>
                                )}
                                {isPrestamoPendiente && labelText && (
                                  <p className="text-[8px] sm:text-[9px] font-bold mb-0.5 bg-white/30 px-1 py-0.5 rounded shrink-0">{labelText}</p>
                                )}
                                <p className="font-semibold text-[9px] sm:text-[10px] md:text-[11px] leading-tight break-words w-full line-clamp-2">
                                  {isPrestamo ? prestamoMotivo : ocupacion.materia}
                                </p>
                                <p className="text-[8px] sm:text-[9px] opacity-90 leading-tight break-words w-full line-clamp-1">{ocupacion.docente}</p>
                                {rowSpan > 1 && (
                                  <p className="text-[7px] sm:text-[8px] opacity-75 leading-tight mt-0.5 shrink-0">
                                    {Math.floor(ocupacion.horaInicio)}:{String(Math.round((ocupacion.horaInicio % 1) * 60)).padStart(2, '0')}-
                                    {Math.floor(ocupacion.horaFin)}:{String(Math.round((ocupacion.horaFin % 1) * 60)).padStart(2, '0')}
                                  </p>
                                )}
                              </div>
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="space-y-1">
                                {isPrestamo ? (
                                  <>
                                    <p className={`font-semibold text-sm ${isPrestamoPendiente ? 'text-yellow-600' : 'text-green-600'}`}>
                                      PRÉSTAMO {isPrestamoPendiente ? 'PENDIENTE' : 'APROBADO'}
                                    </p>
                                    <p className="text-xs">Actividad: {ocupacion.materia}</p>
                                    <p className="text-xs">Solicitante: {ocupacion.docente || 'No especificado'}</p>
                                    {ocupacion.grupo && <p className="text-xs">Motivo: {ocupacion.grupo}</p>}
                                    {ocupacion.prestamo?.asistentes && (
                                      <p className="text-xs">Asistentes: {ocupacion.prestamo.asistentes}</p>
                                    )}
                                    {ocupacion.prestamo?.telefono && (
                                      <p className="text-xs">Teléfono: {ocupacion.prestamo.telefono}</p>
                                    )}
                                    <p className="text-xs">Horario: {Math.floor(ocupacion.horaInicio)}:{String(Math.round((ocupacion.horaInicio % 1) * 60)).padStart(2, '0')} - {Math.floor(ocupacion.horaFin)}:{String(Math.round((ocupacion.horaFin % 1) * 60)).padStart(2, '0')}</p>
                                    <p className="text-xs">Fecha: {ocupacion.prestamo?.fecha}</p>
                                  </>
                                ) : (
                                  <>
                                    <p className="font-semibold text-sm">{ocupacion.materia}</p>
                                    <p className="text-xs">Docente: {ocupacion.docente || 'No asignado'}</p>
                                    <p className="text-xs">Grupo: {ocupacion.grupo || 'N/A'}</p>
                                    <p className="text-xs">Horario: {Math.floor(ocupacion.horaInicio)}:{String(Math.round((ocupacion.horaInicio % 1) * 60)).padStart(2, '0')} - {Math.floor(ocupacion.horaFin)}:{String(Math.round((ocupacion.horaFin % 1) * 60)).padStart(2, '0')}</p>
                                    <p className="text-xs capitalize">Estado: {ocupacion.estado}</p>
                                  </>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      );
                    })}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )}

    </>
  );
}
