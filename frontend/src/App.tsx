import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { UserProvider } from "./context/UserContext";
import { Toaster } from "./share/sonner";
import AppRouter from "./router/AppRouter";

export default function App() {
  useEffect(() => {
    console.log("🚀 Aplicación iniciada");
    // La sesión se manejará en el componente Login y mediante useAuth hook
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <AppRouter />
        <Toaster position="bottom-right" />
      </UserProvider>
    </ThemeProvider>
  );
}