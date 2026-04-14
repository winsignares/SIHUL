import { useState, useEffect } from "react";
import { ThemeProvider } from "./components/ThemeContext";
import { UserProvider } from "./lib/UserContext";
import { FacturasProvider } from "./contexts/FacturasContext";
import { Toaster } from "./components/ui/sonner";
import Login from "./components/Login";
import AdminDashboard from "./components/AdminDashboard";
import AudiovisualDashboard from "./components/AudiovisualDashboard";
import ConsultorDashboard from "./components/ConsultorDashboard";
import ConsultorEstudianteDashboard from "./components/ConsultorEstudianteDashboard";
import ConsultorDocenteDashboard from "./components/ConsultorDocenteDashboard";
import SupervisorSalonDashboard from "./components/SupervisorSalonDashboard";
import FuncionarioDashboard from "./components/FuncionarioDashboard";
import ContabilidadDashboard from "./components/ContabilidadDashboard";
import TesoreriaDashboard from "./components/TesoreriaDashboard";
import AuditoriaDashboard from "./components/AuditoriaDashboard";
import DireccionFinancieraDashboard from "./components/DireccionFinancieraDashboard";
import RectoriaDashboard from "./components/RectoriaDashboard";
import AdminFinancieroDashboard from "./components/AdminFinancieroDashboard";
import { initializeDatabase } from "./lib/seed-data";
import { AuthService } from "./lib/auth";
import type { Usuario } from "./lib/models";

// Tipos de usuario: Admin, Usuario Autorizado, Consultor Estudiante, Consultor Docente, Supervisor Salones, Funcionario
export type UserRole =
  | "admin"
  | "autorizado"
  | "consultor"
  | "consultor-estudiante"
  | "consultor-docente"
  | "supervisor-salones"
  | "funcionario"
  | "contabilidad"
  | "tesoreria"
  | "auditoria"
  | "direccion-financiera"
  | "rectoria"
  | "admin-financiero"
  | null;

export default function App() {
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userName, setUserName] = useState<string>("");
  const [currentUser, setCurrentUser] =
    useState<Usuario | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Inicializar la base de datos al montar el componente
  useEffect(() => {
    console.log("🚀 Inicializando aplicación...");
    initializeDatabase();

    // Verificar si hay sesión activa
    const session = AuthService.getSession();
    if (session) {
      console.log(
        "✅ Sesión activa detectada:",
        session.nombre,
      );
      setUserRole(session.rol);
      setUserName(session.nombre);
      setCurrentUser(session);
    }

    setIsInitialized(true);
  }, []);

  const handleLogin = (
    role: UserRole,
    name: string,
    usuario: Usuario,
  ) => {
    console.log("✅ Login exitoso:", name, role);
    setUserRole(role);
    setUserName(name);
    setCurrentUser(usuario);
  };

  const handleLogout = () => {
    console.log("👋 Cerrando sesión...");
    AuthService.logout();
    setUserRole(null);
    setUserName("");
    setCurrentUser(null);
  };

  // Mostrar loading mientras se inicializa
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">
            Inicializando sistema...
          </p>
        </div>
      </div>
    );
  }

  // Renderiza el dashboard según el tipo de usuario
  const renderDashboard = () => {
    if (!userRole || !currentUser) {
      return <Login onLogin={handleLogin} />;
    }

    switch (userRole) {
      case "admin":
        return (
          <AdminDashboard userName={currentUser.nombre} onLogout={handleLogout} />
        );
      case "autorizado":
        return (
          <AudiovisualDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "consultor":
        return (
          <ConsultorDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "consultor-estudiante":
        return (
          <ConsultorEstudianteDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "consultor-docente":
        return (
          <ConsultorDocenteDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "supervisor-salones":
        return (
          <SupervisorSalonDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "funcionario":
        return (
          <FuncionarioDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "contabilidad":
        return (
          <ContabilidadDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "tesoreria":
        return (
          <TesoreriaDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "auditoria":
        return (
          <AuditoriaDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "direccion-financiera":
        return (
          <DireccionFinancieraDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "rectoria":
        return (
          <RectoriaDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      case "admin-financiero":
        return (
          <AdminFinancieroDashboard
            userName={currentUser.nombre}
            onLogout={handleLogout}
          />
        );
      default:
        return <Login onLogin={handleLogin} />;
    }
  };

  return (
    <ThemeProvider>
      <UserProvider usuario={currentUser}>
        <FacturasProvider>
          {!userRole ? (
            <Login onLogin={handleLogin} />
          ) : (
            renderDashboard()
          )}
          <Toaster position="bottom-right" />
        </FacturasProvider>
      </UserProvider>
    </ThemeProvider>
  );
}