import FacturaDetailModal from '../../factura-detail-modal';
import type { useRegistrarPagoAplicado } from '../../../hooks/tesoreria/useRegistrarPagoAplicado';

type Gestion = ReturnType<typeof useRegistrarPagoAplicado>;

/** Detalle de la factura seleccionada. */
export function DetalleFacturaRegistrarPago({ facturaDetalle, setFacturaDetalle, mostrarDialogDetalle, setMostrarDialogDetalle }: Pick<Gestion, 'facturaDetalle' | 'setFacturaDetalle' | 'mostrarDialogDetalle' | 'setMostrarDialogDetalle'>) {
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
