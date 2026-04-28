import type { SharedFacturaDetail } from '../../../../share/factura-detail-modal';

export interface KanbanVistaCompletaPropsModel {
  isOpen: boolean;
  onClose: () => void;
  onSelectFactura: (factura: SharedFacturaDetail) => void;
}
