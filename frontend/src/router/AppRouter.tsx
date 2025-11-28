import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import DashboardHome from '../pages/AdminDashboardHome';
import GestionUsuarios from '../pages/GestionUsuarios';
import FacultadesPrograms from '../pages/FacultadesPrograms';
import EspaciosFisicos from '../pages/EspaciosFisicos';
import HorariosAcademicos from '../pages/HorariosAcademicos';
import PrestamosEspacios from '../pages/PrestamosEspacios';
import Asignaturas from '../pages/Asignaturas';
import PeriodosAcademicos from '../pages/PeriodosAcademicos';
import GruposFusion from '../pages/GruposFusion';
import Reportes from '../pages/Reportes';
import Ajustes from '../pages/Ajustes';
import Mensajeria from '../pages/Mensajeria';
import Notificaciones from '../pages/Notificaciones';
import AudiovisualHome from '../pages/AudiovisualHome';
import GestionRecursos from '../pages/GestionRecursos';
import ConsultorDashboardHome from '../pages/ConsultorDashboardHome';
import ConsultorDocenteHome from '../pages/ConsultorDocenteHome';
import ConsultorEstudianteHome from '../pages/ConsultorEstudianteHome';
import ConsultaEspacios from '../pages/ConsultaEspacios';
import ConsultaHorarios from '../pages/ConsultaHorarios';
import ConsultaPrestamos from '../pages/ConsultaPrestamos';
import VisualizacionHorarios from '../pages/VisualizacionHorarios';
import OcupacionSemanal from '../pages/OcupacionSemanal';
import ChatInterno from '../pages/ChatInterno';
import HorarioDocente from '../pages/HorarioDocente';
import HorarioEstudiante from '../pages/HorarioEstudiante';
import DocentePrestamos from '../pages/DocentePrestamos';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useUser } from '../context/UserContext';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { usuario } = useUser();

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardHome />} />
          
          {/* Rutas Admin */}
          <Route path="usuarios" element={<GestionUsuarios />} />
          <Route path="facultades" element={<FacultadesPrograms />} />
          <Route path="programas" element={<FacultadesPrograms />} />
          <Route path="espacios" element={<EspaciosFisicos />} />
          <Route path="horarios" element={<HorariosAcademicos />} />
          <Route path="visualizacion" element={<VisualizacionHorarios />} />
          <Route path="prestamos" element={<PrestamosEspacios />} />
          <Route path="asignaturas" element={<Asignaturas />} />
          <Route path="periodos" element={<PeriodosAcademicos />} />
          <Route path="grupos" element={<GruposFusion />} />
          <Route path="fusion" element={<GruposFusion />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="ocupacion" element={<OcupacionSemanal />} />
          <Route path="mensajeria" element={<Mensajeria />} />
          <Route path="chat" element={<ChatInterno />} />
          <Route path="notificaciones" element={<Notificaciones />} />
          
          {/* Rutas Audiovisual */}
          <Route path="audiovisual" element={<AudiovisualHome />} />
          <Route path="recursos" element={<GestionRecursos />} />
          
          {/* Rutas Consultor */}
          <Route path="consultor" element={<ConsultorDashboardHome />} />
          <Route path="consulta-espacios" element={<ConsultaEspacios />} />
          <Route path="consulta-horarios" element={<ConsultaHorarios />} />
          <Route path="consulta-prestamos" element={<ConsultaPrestamos />} />
          
          {/* Rutas Profesor */}
          <Route path="profesor" element={<ConsultorDocenteHome />} />
          <Route path="horario-docente" element={<HorarioDocente />} />
          <Route path="prestamos-docente" element={<DocentePrestamos />} />
          
          {/* Rutas Estudiante */}
          <Route path="estudiante" element={<ConsultorEstudianteHome />} />
          <Route path="horario-estudiante" element={<HorarioEstudiante />} />
          
          {/* Rutas Comunes */}
          <Route path="ajustes" element={<Ajustes />} />
        </Route>

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
