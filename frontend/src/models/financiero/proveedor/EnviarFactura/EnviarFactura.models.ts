import type { Proveedor } from '../../core.models';

export interface UploadedDoc {
  id: string;
  type: string;
  file?: File;
  existingUrl?: string;
  existingName?: string;
  isExisting?: boolean;
}

export interface EnviarFacturaProps {
  miProveedor: Proveedor | null;
  onSuccess?: () => void;
}
