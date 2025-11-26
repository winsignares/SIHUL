import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import type { Usuario } from '../models';
import { AuthService } from '../services/auth';

interface UserContextType {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  hasPermission: (componenteId: string, requiredPermission?: 'ver' | 'editar') => boolean;
  hasAccessToProgram: (programaId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const hasPermission = (componenteId: string, requiredPermission: 'ver' | 'editar' = 'ver'): boolean => {
    if (!usuario) return false;
    return AuthService.hasPermission(usuario, componenteId, requiredPermission);
  };

  const hasAccessToProgram = (programaId: string): boolean => {
    if (!usuario) return false;
    return AuthService.hasAccessToProgram(usuario, programaId);
  };

  return (
    <UserContext.Provider value={{ usuario, setUsuario, hasPermission, hasAccessToProgram }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser debe ser usado dentro de un UserProvider');
  }
  return context;
}
