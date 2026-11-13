import FacturaDetailModal from '../../factura-detail-modal';
import type { useGenerarComprobanteEgreso } from '../../../hooks/tesoreria/useGenerarComprobanteEgreso';

type Gestion = ReturnType<typeof useGenerarComprobanteEgreso>;

/** Detalle de la factura seleccionada. */
export function DetalleFacturaComprobanteEgreso({ detalleFactura, setDetalleFactura }: Pick<Gestion, 'detalleFactura' | 'setDetalleFactura'>) {
  return (
    <FacturaDetailModal
      factura={detalleFactura}
      isOpen={!!detalleFactura}
      onClose={() => setDetalleFactura(null)}
    />
  );
}
