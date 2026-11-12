import { apiClient } from '../../../../core/apiClient';
import type { RegistroProveedorPayload } from '../../models/proveedor/RegistroProveedor';
import type { Proveedor } from '../../models/core.models';
import { API_BASE } from '../core/shared';

export const registroProveedorService = {
  registrar: (payload: RegistroProveedorPayload): Promise<{ usuario_id: number; proveedor: Proveedor }> =>
    apiClient.post<{ usuario_id: number; proveedor: Proveedor }>(
      `${API_BASE}/proveedores/crear_con_usuario/`,
      payload,
      { requiresAuth: false },
    ),
};
