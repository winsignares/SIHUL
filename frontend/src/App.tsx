import { useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { NotificacionesProvider } from "./context/NotificacionesContext";
import { Toaster } from "./share/sonner";
import AppRouter from "./router/AppRouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ApiRequestFeedback } from "./components/common/ApiRequestFeedback";
import { BackendOfflineOverlay } from "./components/common/BackendOfflineOverlay";
import { startBackendHealthWatcher } from "./core/backendHealth";

export default function App() {
  useEffect(() => {
    const stopWatcher = startBackendHealthWatcher();
    return stopWatcher;
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <NotificacionesProvider>
            <UserProvider>
              <AppRouter />
              <ApiRequestFeedback />
              <BackendOfflineOverlay />
              <Toaster position="top-right" richColors expand />
            </UserProvider>
          </NotificacionesProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
