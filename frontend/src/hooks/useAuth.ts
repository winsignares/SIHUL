import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth/authService';
import { useUser } from '../context/UserContext';
import type { LoginCredentials } from '../models/auth';

export function useAuth() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setUsuario } = useUser();

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authService.login(credentials);
      
      // Actualizar el contexto de usuario
      const userData = {
        id: response.usuario.id,
        nombre: response.usuario.nombre,
        apellido: response.usuario.apellido,
        correo: credentials.correo,
        rol: response.usuario.rol,
        activo: true,
        permisos: response.usuario.permisos || [],
        areas: response.usuario.areas || [],
      };
      
      setUsuario(userData);
      navigate('/dashboard');
      return userData;
    } catch (err: any) {
      setError(err.message || 'Error al iniciar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    setError(null);
    try {
      await authService.logout();
      setUsuario(null);
      navigate('/login');
    } catch (err: any) {
      setError(err.message || 'Error al cerrar sesión');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkAuth = async () => {
    if (!authService.isAuthenticated()) {
      setUsuario(null);
      return null;
    }

    setLoading(true);
    setError(null);
    try {
      const usuario = await authService.getCurrentUser();
      const userData = authService.getUserData();
      
      setUsuario({
        ...usuario,
        permisos: userData?.permisos || [],
        areas: userData?.areas || [],
      });
      
      return usuario;
    } catch (err: any) {
      setError(err.message || 'Error al verificar autenticación');
      setUsuario(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    login,
    logout,
    checkAuth,
    loading,
    error,
  };
}
