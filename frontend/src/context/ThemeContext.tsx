/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'sonner';

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  icon?: any;
  description?: string;
}

const notifications: Array<Notification & NotificationOptions> = [];

export function showNotification(notification: Notification, options?: NotificationOptions) {
  const payload = { ...notification, ...(options || {}) } as Notification & NotificationOptions;
  notifications.push(payload);
  
  // Mostrar notificación usando sonner toast
  const message = payload.description ? `${payload.message}: ${payload.description}` : payload.message;
  
  switch (payload.type) {
    case 'success':
      toast.success(message, { duration: payload.duration || 3000 });
      break;
    case 'error':
      toast.error(message, { duration: payload.duration || 4000 });
      break;
    case 'warning':
      toast.warning(message, { duration: payload.duration || 3500 });
      break;
    case 'info':
    default:
      toast.info(message, { duration: payload.duration || 3000 });
      break;
  }
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
