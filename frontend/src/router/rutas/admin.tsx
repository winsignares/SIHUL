import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import {
  AsignacionEspaciosSeccionalPage,
  AsistentesVirtuales,
  CentroHorarios,
  ComponentesRoles,
  DashboardHome,
  EnConstruccion,
  EstadoRecursos,
  FacultadesPrograms,
  GestionChatbots,
  GestionRoles,
  GestionUsuarios,
  OcupacionSemanal,
  PeriodosAcademicos,
  PrestamosEspacios,
  Reportes,
  SolicitudesEspacio,
} from '../paginas';

/** Rutas de Admin - Planeación. */
export const rutasAdmin = () => (
  <>
    <Route path="admin/dashboard" element={
      <ProtectedRoute requiredComponent="Dashboard">
        <DashboardHome />
      </ProtectedRoute>
    } />

    <Route path="admin/centro-institucional" element={
      <ProtectedRoute requiredComponent="Centro Institucional">
        <FacultadesPrograms />
      </ProtectedRoute>
    } />

    <Route path="admin/centro-horarios" element={
      <ProtectedRoute requiredComponent="Centro de Horarios">
        <CentroHorarios />
      </ProtectedRoute>
    } />

    <Route path="admin/asignacion" element={
      <ProtectedRoute requiredComponent="Asignación Automática">
        <EnConstruccion />
      </ProtectedRoute>
    } />

    <Route path="asignacion-espacios-seccional" element={
      <ProtectedRoute requiredComponent="Asignación de espacios por seccional">
        <AsignacionEspaciosSeccionalPage />
      </ProtectedRoute>
    } />

    <Route path="admin/prestamos" element={
      <ProtectedRoute requiredComponent="Préstamos de Espacios">
        <PrestamosEspacios />
      </ProtectedRoute>
    } />

    <Route path="admin/periodos" element={
      <ProtectedRoute requiredComponent="Periodos Académicos">
        <PeriodosAcademicos />
      </ProtectedRoute>
    } />

    <Route path="admin/asistente-virtual" element={
      <ProtectedRoute requiredComponent="Asistentes Virtuales">
        <AsistentesVirtuales />
      </ProtectedRoute>
    } />

    <Route path="admin/chatbots" element={
      <ProtectedRoute requiredComponent={['Gestión de Chatbots', 'Gestión de Documentación de Chatbots']}>
        <GestionChatbots />
      </ProtectedRoute>
    } />

    <Route path="admin/ocupacion" element={
      <ProtectedRoute requiredComponent="Ocupación Semanal">
        <OcupacionSemanal />
      </ProtectedRoute>
    } />

    <Route path="admin/reportes" element={
      <ProtectedRoute requiredComponent="Reportes Generales">
        <Reportes />
      </ProtectedRoute>
    } />

    <Route path="admin/usuarios" element={
      <ProtectedRoute requiredComponent="Gestión de Usuarios">
        <GestionUsuarios />
      </ProtectedRoute>
    } />

    <Route path="admin/estado-recursos" element={
      <ProtectedRoute requiredComponent="Estado de Recursos">
        <EstadoRecursos />
      </ProtectedRoute>
    } />

    <Route path="admin/solicitudes-espacio" element={
      <ProtectedRoute>
        <SolicitudesEspacio />
      </ProtectedRoute>
    } />

    <Route path="admin/componentes-roles" element={
      <ProtectedRoute requiredComponent="Gestión de Componentes">
        <ComponentesRoles />
      </ProtectedRoute>
    } />

    <Route path="admin/roles" element={
      <ProtectedRoute requiredComponent="Gestión de Roles">
        <GestionRoles />
      </ProtectedRoute>
    } />
  </>
);
