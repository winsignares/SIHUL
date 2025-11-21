import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

// Usuario Context
interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  correo: string;
  email?: string; // Alias para compatibilidad
  rol: string;
  activo: boolean;
  permisos?: string[];
  areas?: string[];
}

interface UserContextType {
  usuario: Usuario | null;
  setUsuario: (usuario: Usuario | null) => void;
  hasPermiso: (permiso: string) => boolean;
  hasArea: (area: string) => boolean;
  hasAnyPermiso: (permisos: string[]) => boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  const hasPermiso = (permiso: string): boolean => {
    if (!usuario || !usuario.permisos) return false;
    return usuario.permisos.includes(permiso);
  };

  const hasArea = (area: string): boolean => {
    if (!usuario || !usuario.areas) return false;
    return usuario.areas.includes(area);
  };

  const hasAnyPermiso = (permisos: string[]): boolean => {
    if (!usuario || !usuario.permisos) return false;
    return permisos.some(p => usuario.permisos!.includes(p));
  };

  return (
    <UserContext.Provider value={{ usuario, setUsuario, hasPermiso, hasArea, hasAnyPermiso }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}

// Theme Context
type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme | null;
    return stored || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    let effectiveTheme = theme;
    if (theme === 'system') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }

    root.classList.add(effectiveTheme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((current) => {
      if (current === 'light') return 'dark';
      if (current === 'dark') return 'system';
      return 'light';
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}