import FacturaDetailModal from '../../factura-detail-modal';
import type { useEnviarDireccionFinanciera } from '../../../hooks/tesoreria/useEnviarDireccionFinanciera';

type Gestion = ReturnType<typeof useEnviarDireccionFinanciera>;

/** Detalle de la factura seleccionada. */
export function DetalleFacturaEnviarDireccion({ facturaDetalle, setFacturaDetalle, mostrarDialogDetalle, setMostrarDialogDetalle }: Pick<Gestion, 'facturaDetalle' | 'setFacturaDetalle' | 'mostrarDialogDetalle' | 'setMostrarDialogDetalle'>) {
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
