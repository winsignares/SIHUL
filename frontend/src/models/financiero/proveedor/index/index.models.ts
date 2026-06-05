import type { Proveedor } from '../../core.models';

export interface ProveedorDashboardHomeProps {
  miProveedor: Proveedor | null;
  proveedorLoading: boolean;
  onGoToEnviar: () => void;
  onGoToMisFacturas: () => void;
}
