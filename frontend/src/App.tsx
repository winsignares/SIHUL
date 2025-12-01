import { useState, useEffect } from "react";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import { UserProvider } from "./context/UserContext";
import { Toaster } from "./share/sonner";
import AppRouter from "./router/AppRouter";

export default function App() {
  useEffect(() => {
    console.log("🚀 Aplicación iniciada");
    // La sesión se manejará mediante AuthContext
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <UserProvider>
          <AppRouter />
          <Toaster position="top-right" richColors expand />
        </UserProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}