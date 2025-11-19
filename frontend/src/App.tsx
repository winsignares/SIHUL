import { useEffect, useState } from 'react';
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from './components/ThemeContext';
import { UserProvider } from './lib/UserContext';
import { Toaster } from './components/ui/sonner';
import { initializeDatabase } from './lib/seed-data';
import { AuthService } from './lib/auth';
import { router } from './routes';
import type { Usuario } from './lib/models';

export default function App() {
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar la base de datos al montar el componente
  useEffect(() => {
    console.log('🚀 Inicializando aplicación...');
    initializeDatabase();
    
    // Verificar si hay sesión activa
    const session = AuthService.getSession();
    if (session) {
      console.log('✅ Sesión activa detectada:', session.nombre);
      setCurrentUser(session);
    }
    
    setIsInitialized(true);
  }, []);

  // Mostrar loading mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Inicializando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider>
      <UserProvider usuario={currentUser}>
        <RouterProvider router={router} />
        <Toaster position="bottom-right" />
      </UserProvider>
    </ThemeProvider>
  );
}
