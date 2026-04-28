import type { Proveedor } from '../../core.models';

export interface UploadedDoc {
  id: string;
  type: string;
  file: File;
}

export interface EnviarFacturaProps {
  miProveedor: Proveedor | null;
  onSuccess?: () => void;
}
