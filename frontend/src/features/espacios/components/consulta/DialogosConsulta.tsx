import { NuevaSolicitudDialog } from './NuevaSolicitudDialog';
import { MoverClaseDialog } from './MoverClaseDialog';
import { ConfirmarMovimientoDialog } from './ConfirmarMovimientoDialog';
import { ConfirmarEliminarHorarioDialog } from './ConfirmarEliminarHorarioDialog';
import type { useConsultaEspaciosPagina } from '../../hooks/useConsultaEspaciosPagina';

type Gestion = ReturnType<typeof useConsultaEspaciosPagina>;

/** Diálogos de nueva solicitud, movimiento y eliminación de horarios. */
export function DialogosConsulta({ user, diasSemana, horas, filteredEspacios, horarios, getOcupacionPorHora, getConflictoEnRango, dialogSolicitudOpen, setDialogSolicitudOpen, nuevaSolicitudData, describirConflicto, periodoSeleccionado, puedeEditarDisponibilidad, setDraggedHorario, confirmMoveDialogOpen, setConfirmMoveDialogOpen, pendingMove, setPendingMove, isProcessingMove, horarioToDelete, setHorarioToDelete, confirmDeleteDialogOpen, setConfirmDeleteDialogOpen, isDeleting, eliminarHorario, ejecutarMovimiento, moverClase }: Pick<Gestion, 'user' | 'diasSemana' | 'horas' | 'filteredEspacios' | 'horarios' | 'getOcupacionPorHora' | 'getConflictoEnRango' | 'dialogSolicitudOpen' | 'setDialogSolicitudOpen' | 'nuevaSolicitudData' | 'describirConflicto' | 'periodoSeleccionado' | 'puedeEditarDisponibilidad' | 'setDraggedHorario' | 'confirmMoveDialogOpen' | 'setConfirmMoveDialogOpen' | 'pendingMove' | 'setPendingMove' | 'isProcessingMove' | 'horarioToDelete' | 'setHorarioToDelete' | 'confirmDeleteDialogOpen' | 'setConfirmDeleteDialogOpen' | 'isDeleting' | 'eliminarHorario' | 'ejecutarMovimiento' | 'moverClase'>) {
  return (
    <>
      {/* Modal de Nueva Solicitud */}
      <NuevaSolicitudDialog user={user} dialogSolicitudOpen={dialogSolicitudOpen} setDialogSolicitudOpen={setDialogSolicitudOpen} nuevaSolicitudData={nuevaSolicitudData} filteredEspacios={filteredEspacios} horarios={horarios} getConflictoEnRango={getConflictoEnRango} periodoSeleccionado={periodoSeleccionado} puedeEditarDisponibilidad={puedeEditarDisponibilidad} describirConflicto={describirConflicto} />

      {/* Diálogo de Confirmación para Drag and Drop */}
      <ConfirmarMovimientoDialog confirmMoveDialogOpen={confirmMoveDialogOpen} ejecutarMovimiento={ejecutarMovimiento} isProcessingMove={isProcessingMove} pendingMove={pendingMove} setConfirmMoveDialogOpen={setConfirmMoveDialogOpen} setDraggedHorario={setDraggedHorario} setPendingMove={setPendingMove} />

      {/* Diálogo para Mover Clase a Otro Espacio */}
      <MoverClaseDialog moverClase={moverClase} filteredEspacios={filteredEspacios} diasSemana={diasSemana} horas={horas} getOcupacionPorHora={getOcupacionPorHora} getConflictoEnRango={getConflictoEnRango} describirConflicto={describirConflicto} />

      {/* Diálogo de Confirmación para Eliminar Horario */}
      <ConfirmarEliminarHorarioDialog confirmDeleteDialogOpen={confirmDeleteDialogOpen} eliminarHorario={eliminarHorario} horarioToDelete={horarioToDelete} isDeleting={isDeleting} setConfirmDeleteDialogOpen={setConfirmDeleteDialogOpen} setHorarioToDelete={setHorarioToDelete} />
    </>
  );
}
