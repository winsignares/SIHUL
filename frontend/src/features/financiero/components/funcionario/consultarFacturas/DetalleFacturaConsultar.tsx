import FacturaDetailModal from '../../factura-detail-modal';
import type { useConsultarFacturas } from '../../../hooks/funcionario/useConsultarFacturas';

type Gestion = ReturnType<typeof useConsultarFacturas>;

/** Detalle de la factura seleccionada. */
export function DetalleFacturaConsultar({ searchParams, setSearchParams, openDetail, setOpenDetail, selectedDetail, setSelectedDetail }: Pick<Gestion, 'searchParams' | 'setSearchParams' | 'openDetail' | 'setOpenDetail' | 'selectedDetail' | 'setSelectedDetail'>) {
  return (
    <FacturaDetailModal
      isOpen={openDetail}
      onClose={() => {
        setOpenDetail(false);
        setSelectedDetail(null);
        if (searchParams.get('factura')) {
          const nextParams = new URLSearchParams(searchParams);
          nextParams.delete('factura');
          setSearchParams(nextParams, { replace: true });
        }
      }}
      factura={selectedDetail}
    />
  );
}
