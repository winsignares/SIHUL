import FacturaDetailModal from '../factura-detail-modal';
import type { useControlPrevio } from '../../hooks/auditoria/useControlPrevio';

type Gestion = ReturnType<typeof useControlPrevio>;

/** Detalle de la factura seleccionada. */
export function DetalleFacturaControlPrevio({ facturaDetalle, setFacturaDetalle, mostrarDialogDetalle, setMostrarDialogDetalle }: Pick<Gestion, 'facturaDetalle' | 'setFacturaDetalle' | 'mostrarDialogDetalle' | 'setMostrarDialogDetalle'>) {
  return (
    <FacturaDetailModal
      factura={facturaDetalle}
      isOpen={mostrarDialogDetalle}
      onClose={() => {
        setMostrarDialogDetalle(false);
        setFacturaDetalle(null);
      }}
    />
  );
}
