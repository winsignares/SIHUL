import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import {
  AsistentesVirtuales,
  ConsultaEspacios,
  EstadoRecursos,
  SupervisorGeneralHome,
  SupervisorSalonHome,
} from '../paginas';

/** Rutas de Supervisor General. */
export const rutasSupervisor = () => (
  <>
    <Route path="supervisor/dashboard" element={
      <ProtectedRoute requiredComponent="Dashboard Supervisor">
        <SupervisorGeneralHome />
      </ProtectedRoute>
    } />

    <Route path="supervisor/espacios" element={
      <ProtectedRoute requiredComponent="Disponibilidad de Espacios">
        <ConsultaEspacios />
      </ProtectedRoute>
    } />

    <Route path="supervisor/prestamos" element={
      <ProtectedRoute requiredComponent="Apertura y Cierre de Salones">
        <SupervisorSalonHome />
      </ProtectedRoute>
    } />

    <Route path="supervisor/recursos" element={
      <ProtectedRoute requiredComponent="Estado de Recursos">
        <EstadoRecursos />
      </ProtectedRoute>
    } />

    <Route path="supervisor/asistente-virtual" element={
      <ProtectedRoute requiredComponent="Asistentes Virtuales Supervisor">
        <AsistentesVirtuales />
      </ProtectedRoute>
    } />
  </>
);
