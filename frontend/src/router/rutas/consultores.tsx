import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import {
  AsistentesVirtuales,
  ConsultorDocenteHome,
  ConsultorEstudianteHome,
  DocentePrestamos,
  MiHorario,
} from '../paginas';

/** Rutas de Consultor Docente. */
export const rutasDocente = () => (
  <>
    <Route path="docente/dashboard" element={
      <ProtectedRoute requiredComponent="Dashboard Docente">
        <ConsultorDocenteHome />
      </ProtectedRoute>
    } />

    <Route path="docente/horario" element={
      <ProtectedRoute requiredComponent="Mi Horario">
        <MiHorario />
      </ProtectedRoute>
    } />

    <Route path="docente/prestamos" element={
      <ProtectedRoute requiredComponent="Préstamos Docente">
        <DocentePrestamos />
      </ProtectedRoute>
    } />

    <Route path="docente/asistente-virtual" element={
      <ProtectedRoute requiredComponent="Asistentes Virtuales Docente">
        <AsistentesVirtuales />
      </ProtectedRoute>
    } />
  </>
);

/** Rutas de Consultor Estudiante. */
export const rutasEstudiante = () => (
  <>
    <Route path="estudiante/dashboard" element={
      <ProtectedRoute requiredComponent="Dashboard Estudiante">
        <ConsultorEstudianteHome />
      </ProtectedRoute>
    } />

    <Route path="estudiante/mi-horario" element={
      <ProtectedRoute requiredComponent="Mi Horario Estudiante">
        <MiHorario />
      </ProtectedRoute>
    } />

    <Route path="estudiante/asistente-virtual" element={
      <ProtectedRoute requiredComponent="Asistentes Virtuales Estudiante">
        <AsistentesVirtuales />
      </ProtectedRoute>
    } />
  </>
);
