import { Route } from 'react-router-dom';
import { ProtectedRoute } from '../ProtectedRoute';
import { Ajustes, DynamicComponentPage, Notificaciones } from '../paginas';

/** Rutas compartidas: no requieren componente específico. */
export const rutasCompartidas = () => (
  <>
    <Route path="notificaciones" element={
      <ProtectedRoute>
        <Notificaciones />
      </ProtectedRoute>
    } />

    <Route path="ajustes" element={
      <ProtectedRoute>
        <Ajustes />
      </ProtectedRoute>
    } />

    {/* Ruta dinámica para componentes nuevos asignados desde backend */}
    <Route path="componentes/:slug" element={
      <ProtectedRoute>
        <DynamicComponentPage />
      </ProtectedRoute>
    } />
  </>
);
