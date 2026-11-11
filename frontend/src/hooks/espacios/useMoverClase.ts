import type { useConsultaEspacios } from './useConsultaEspacios';
import { useState } from 'react';
import { prestamoService } from '../../services/prestamos/prestamoAPI';
import { horarioService } from '../../services/horarios/horariosAPI';
import { toast } from 'sonner';

import { formatHoraDecimal, formatHoraApi } from './consultaEspaciosComun';


type DeConsulta = ReturnType<typeof useConsultaEspacios>;

/** Datos de la página que usa el diálogo «Mover clase a otro espacio». */
export interface ContextoMoverClase {
  horarios: DeConsulta['horarios'];
  filteredEspacios: DeConsulta['filteredEspacios'];
  getConflictoEnRango: DeConsulta['getConflictoEnRango'];
  validarMovimiento: (horario: DeConsulta['horarios'][number], targetEspacioId: string, targetDia: string, targetHoraInicio: number, targetHoraFin: number) => { valido: boolean, error?: string };
  recargarDisponibilidad: () => Promise<void>;
}

/** Estado y movimiento del diálogo «Mover clase a otro espacio» de la consulta de espacios. */
export function useMoverClase({ horarios, filteredEspacios, getConflictoEnRango, validarMovimiento, recargarDisponibilidad }: ContextoMoverClase) {
  // Estados para diálogo de mover clase
  const [moveClassDialogOpen, setMoveClassDialogOpen] = useState(false);
  const [selectedClassToMove, setSelectedClassToMove] = useState<typeof horarios[0] | null>(null);
  const [targetEspacioId, setTargetEspacioId] = useState<string>('');
  const [targetMoveDia, setTargetMoveDia] = useState<string>('');
  const [targetMoveHoraInicio, setTargetMoveHoraInicio] = useState<number | null>(null);
  const [moveClassError, setMoveClassError] = useState<string | null>(null);
  const [movingClass, setMovingClass] = useState(false);

  // Función para mover clase a otro espacio
  const ejecutarMovimientoOtroEspacio = async () => {
    if (!selectedClassToMove || !targetEspacioId || !targetMoveDia || targetMoveHoraInicio === null) return;

    setMovingClass(true);
    setMoveClassError(null);

    const targetEspacio = filteredEspacios.find(e => e.id === targetEspacioId);
    if (!targetEspacio) {
      setMoveClassError('Espacio no encontrado');
      setMovingClass(false);
      return;
    }

    const duracion = selectedClassToMove.horaFin - selectedClassToMove.horaInicio;
    const targetHoraFin = targetMoveHoraInicio + duracion;

    // Validar el movimiento
    const validacion = validarMovimiento(
      selectedClassToMove,
      targetEspacioId,
      targetMoveDia,
      targetMoveHoraInicio,
      targetHoraFin
    );

    if (!validacion.valido) {
      setMoveClassError(validacion.error || 'No se puede realizar el movimiento');
      setMovingClass(false);
      return;
    }

    try {
      const formatHora = formatHoraApi;

      // Validar que haya un ID válido
      if (!selectedClassToMove.id) {
        setMoveClassError('Error: No se puede mover este elemento - ID no válido');
        return;
      }

      // Usar el servicio correcto según el tipo
      if (selectedClassToMove.tipo === 'prestamo') {
        // Para préstamos, usar prestamoService
        await prestamoService.actualizarPrestamo({
          id: selectedClassToMove.id,
          espacio_id: parseInt(targetEspacioId),
          estado: selectedClassToMove.estado || 'Pendiente',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fecha: (selectedClassToMove as any).fecha || (selectedClassToMove.prestamo?.fecha),
          hora_inicio: formatHora(targetMoveHoraInicio),
          hora_fin: formatHora(targetHoraFin)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      } else {
        // Para horarios académicos, usar horarioService
        await horarioService.update({
          id: selectedClassToMove.id,
          espacio_id: parseInt(targetEspacioId),
          dia_semana: targetMoveDia,
          hora_inicio: formatHora(targetMoveHoraInicio),
          hora_fin: formatHora(targetHoraFin)
        });
      }

      toast.success(`Clase movida exitosamente a ${targetEspacio.nombre} - ${targetMoveDia} ${formatHoraDecimal(targetMoveHoraInicio)}-${formatHoraDecimal(targetHoraFin)}`);

      // Cerrar diálogo y recargar
      setMoveClassDialogOpen(false);
      setSelectedClassToMove(null);
      setTargetEspacioId('');
      setTargetMoveDia('');
      setTargetMoveHoraInicio(null);
      recargarDisponibilidad();
    } catch {
      setMoveClassError('Error al mover la clase');
    } finally {
      setMovingClass(false);
    }
  };

  const conflictoMovimientoSeleccionado =
    selectedClassToMove && targetEspacioId && targetMoveDia && targetMoveHoraInicio !== null
      ? getConflictoEnRango(
          targetEspacioId,
          targetMoveDia,
          targetMoveHoraInicio,
          targetMoveHoraInicio + (selectedClassToMove.horaFin - selectedClassToMove.horaInicio),
          selectedClassToMove
        )
      : null;

  return {
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
    setMovingClass,
    ejecutarMovimientoOtroEspacio,
    conflictoMovimientoSeleccionado,
  };
}
