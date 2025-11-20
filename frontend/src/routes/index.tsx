import { createBrowserRouter, Navigate } from 'react-router-dom';
import Login from '../components/Login';
import AdminDashboardRoute from './AdminDashboardRoute';
import AudiovisualDashboardRoute from './AudiovisualDashboardRoute';
import ConsultorDashboardRoute from './ConsultorDashboardRoute';
import ConsultorDocenteDashboardRoute from './ConsultorDocenteDashboardRoute';
import ConsultorEstudianteDashboardRoute from './ConsultorEstudianteDashboardRoute';
import ProtectedRoute from './ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />
  },
  {
    path: '/',
    element: <Navigate to="/login" replace />
  },
  {
    path: '/admin/*',
    element: <ProtectedRoute allowedRoles={['admin']} />,
    children: [
      {
        path: '*',
        element: <AdminDashboardRoute />
      }
    ]
  },
  {
    path: '/audiovisual/*',
    element: <ProtectedRoute allowedRoles={['autorizado']} />,
    children: [
      {
        path: '*',
        element: <AudiovisualDashboardRoute />
      }
    ]
  },
  {
    path: '/consultor/*',
    element: <ProtectedRoute allowedRoles={['consultor']} />,
    children: [
      {
        path: '*',
        element: <ConsultorDashboardRoute />
      }
    ]
  },
  {
    path: '/docente/*',
    element: <ProtectedRoute allowedRoles={['consultorDocente']} />,
    children: [
      {
        path: '*',
        element: <ConsultorDocenteDashboardRoute />
      }
    ]
  },
  {
    path: '/estudiante/*',
    element: <ProtectedRoute allowedRoles={['consultorEstudiante']} />,
    children: [
      {
        path: '*',
        element: <ConsultorEstudianteDashboardRoute />
      }
    ]
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />
  }
]);
