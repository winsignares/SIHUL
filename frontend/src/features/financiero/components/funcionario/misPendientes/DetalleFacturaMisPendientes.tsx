import FacturaDetailModal from '../../factura-detail-modal';
import type { useMisPendientesFuncionario } from '../../../hooks/funcionario/useMisPendientesFuncionario';

type Gestion = ReturnType<typeof useMisPendientesFuncionario>;

/** Detalle de la factura seleccionada. */
export function DetalleFacturaMisPendientes({ openDetail, setOpenDetail, selectedDetail, setSelectedDetail }: Pick<Gestion, 'openDetail' | 'setOpenDetail' | 'selectedDetail' | 'setSelectedDetail'>) {
  return (
    <FacturaDetailModal
      isOpen={openDetail}
      onClose={() => {
        setOpenDetail(false);
        setSelectedDetail(null);
      }}
      factura={selectedDetail}
    />
  );
}
