import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  showNotification: (notification: Notification, options?: NotificationOptions) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface Notification {
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

interface NotificationOptions {
  duration?: number;
  icon?: any;
  description?: string;
}

const notifications: Array<Notification & NotificationOptions> = [];

export function showNotification(notification: Notification, options?: NotificationOptions) {
  const payload = { ...notification, ...(options || {}) } as Notification & NotificationOptions;
  notifications.push(payload);
  // Aquí puedes agregar lógica para mostrar la notificación en pantalla
  console.log(`Notification: ${payload.type} - ${payload.message}` + (payload.description ? ` (${payload.description})` : ''));
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light');

  useEffect(() => {
    // Cargar tema guardado
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      setThemeState(savedTheme);
      applyTheme(savedTheme);
    }
  }, []);

  const applyTheme = (newTheme: Theme) => {
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, showNotification }}>
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
