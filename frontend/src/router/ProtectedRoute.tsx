import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Componente para proteger rutas por componentes del backend
export function ProtectedRoute({
  children,
  requiredComponent
}: {
  children: React.ReactNode;
  // Nombre del componente requerido; con una lista basta con tener cualquiera de ellos.
  requiredComponent?: string | string[];
}) {
  const { isAuthenticated, hasPermission } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si no requiere componente específico, permitir acceso
  if (!requiredComponent) {
    return <>{children}</>;
  }

  // Verificar si el usuario tiene el componente (o alguno de la lista)
  const requeridos = Array.isArray(requiredComponent) ? requiredComponent : [requiredComponent];
  if (!requeridos.some((nombre) => hasPermission(nombre))) {
    console.warn('[ProtectedRoute] Acceso denegado a componente:', requeridos.join(' | '));
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Acceso Denegado</h2>
        <p className="text-gray-600">No tienes permisos para acceder a esta sección.</p>
        <p className="text-sm text-gray-500 mt-2">Componente requerido: {requeridos.join(' o ')}</p>
      </div>
    );
  }

  return <>{children}</>;
}
