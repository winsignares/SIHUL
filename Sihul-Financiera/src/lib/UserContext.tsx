// ============================================
// CONTEXTO DE USUARIO
// Proporciona información del usuario actual en toda la app
// ============================================

import { createContext, useContext, ReactNode } from 'react';
import type { Usuario } from './models';
import { AuthService } from './auth';

interface UserContextType {
  usuario: Usuario | null;
  hasPermission: (componenteId: string, requiredPermission?: 'ver' | 'editar') => boolean;
  hasAccessToProgram: (programaId: string) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  usuario: Usuario | null;
  children: ReactNode;
}

export function UserProvider({ usuario, children }: UserProviderProps) {
  const hasPermission = (componenteId: string, requiredPermission: 'ver' | 'editar' = 'ver'): boolean => {
    if (!usuario) return false;
    return AuthService.hasPermission(usuario, componenteId, requiredPermission);
  };

  const hasAccessToProgram = (programaId: string): boolean => {
    if (!usuario) return false;
    return AuthService.hasAccessToProgram(usuario, programaId);
  };

  return (
    <UserContext.Provider value={{ usuario, hasPermission, hasAccessToProgram }}>
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
