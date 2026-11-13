import { VistaTarjetas } from './VistaTarjetas';
import { VistaCronograma } from './VistaCronograma';
import type { useConsultaEspaciosPagina } from '../../hooks/useConsultaEspaciosPagina';

type Gestion = ReturnType<typeof useConsultaEspaciosPagina>;

/** Vista de tarjetas y vista de cronograma. */
export function VistasConsulta({ hook, isMobile, firstItemIndex, lastItemIndex, periodoSeleccionado, puedeEditarDisponibilidad, editModeEnabled, setEditModeEnabled, draggedHorario, setDraggedHorario, dragOverCell, setDragOverCell, setConfirmMoveDialogOpen, setPendingMove, espaciosToShow, getAperturaBadge, getDayColumnIndex, estaEnRangoSeleccion, validarMovimiento, setIsProcessingMove, setHorarioToDelete, setConfirmDeleteDialogOpen, setSelectedClassToMove, setTargetEspacioId, setMoveClassDialogOpen, setMoveClassError }: Pick<Gestion, 'hook' | 'isMobile' | 'firstItemIndex' | 'lastItemIndex' | 'periodoSeleccionado' | 'puedeEditarDisponibilidad' | 'editModeEnabled' | 'setEditModeEnabled' | 'draggedHorario' | 'setDraggedHorario' | 'dragOverCell' | 'setDragOverCell' | 'setConfirmMoveDialogOpen' | 'setPendingMove' | 'espaciosToShow' | 'getAperturaBadge' | 'getDayColumnIndex' | 'estaEnRangoSeleccion' | 'validarMovimiento' | 'setIsProcessingMove' | 'setHorarioToDelete' | 'setConfirmDeleteDialogOpen' | 'setSelectedClassToMove' | 'setTargetEspacioId' | 'setMoveClassDialogOpen' | 'setMoveClassError'>) {
  return (
    <>
      <VistaTarjetas hook={hook} firstItemIndex={firstItemIndex} lastItemIndex={lastItemIndex} isMobile={isMobile} getAperturaBadge={getAperturaBadge} periodoSeleccionado={periodoSeleccionado} />
      <VistaCronograma hook={hook} dragOverCell={dragOverCell} setDragOverCell={setDragOverCell} draggedHorario={draggedHorario} setDraggedHorario={setDraggedHorario} editModeEnabled={editModeEnabled} setEditModeEnabled={setEditModeEnabled} espaciosToShow={espaciosToShow} estaEnRangoSeleccion={estaEnRangoSeleccion} getDayColumnIndex={getDayColumnIndex} puedeEditarDisponibilidad={puedeEditarDisponibilidad} setConfirmDeleteDialogOpen={setConfirmDeleteDialogOpen} setConfirmMoveDialogOpen={setConfirmMoveDialogOpen} setHorarioToDelete={setHorarioToDelete} setIsProcessingMove={setIsProcessingMove} setMoveClassDialogOpen={setMoveClassDialogOpen} setMoveClassError={setMoveClassError} setPendingMove={setPendingMove} setSelectedClassToMove={setSelectedClassToMove} setTargetEspacioId={setTargetEspacioId} validarMovimiento={validarMovimiento} />
    </>
  );
}
