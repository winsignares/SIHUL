import type { Rol } from '../services/users/authService';
import type { Role } from '../models/auth/auth.model';

type SpaceSupervisorRole = Pick<Rol, 'nombre' | 'supervisa_espacios'> | Pick<Role, 'nombre' | 'supervisa_espacios'> | null | undefined;

export const isSpaceSupervisorRole = (role: SpaceSupervisorRole): boolean => {
  if (!role) return false;
  return Boolean(role.supervisa_espacios) || role.nombre === 'supervisor_general';
};
