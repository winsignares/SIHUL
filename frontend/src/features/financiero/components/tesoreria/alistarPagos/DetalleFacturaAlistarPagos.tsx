import FacturaDetailModal from '../../factura-detail-modal';
import type { useAlistarPagos } from '../../../hooks/tesoreria/useAlistarPagos';

type Gestion = ReturnType<typeof useAlistarPagos>;

/** Detalle de la factura seleccionada. */
export function DetalleFacturaAlistarPagos({ facturaDetalle, setFacturaDetalle, mostrarDialogDetalle, setMostrarDialogDetalle }: Pick<Gestion, 'facturaDetalle' | 'setFacturaDetalle' | 'mostrarDialogDetalle' | 'setMostrarDialogDetalle'>) {
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
