import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getRouteForComponent } from '../../config/componentRoutes';

export function useLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [hasNavigated, setHasNavigated] = useState(false);
    const navigate = useNavigate();
    const { login, isAuthenticated, role, components, isLoading } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        try {
            const response = await login({ correo: email, contrasena: password });
            
            // Verificar si el usuario no tiene rol asignado
            if (!response?.rol || response.rol === null) {
                setError('Tu cuenta aún no tiene un rol asignado. Por favor, espera a que un administrador te asigne el rol correspondiente.');
                // Hacer logout automático
                localStorage.clear();
                return;
            }
            
            // La redirección se maneja en el useEffect cuando isAuthenticated cambia
        } catch (err: any) {
            console.error('Error en login:', err);
            const errorMessage = err?.response?.data?.message || err?.message || 'Error al iniciar sesión. Verifique sus credenciales.';
            setError(errorMessage);
        }
    };

    const handlePublicAccess = () => {
        console.log('[useLogin] Acceso público solicitado');
        
        // Limpiar cualquier data de autenticación y cache del localStorage
        localStorage.clear();
        
        // Marcar que es acceso público
        localStorage.setItem('auth_is_public', 'true');
        
        navigate('/public/dashboard', { replace: true });
    };

    useEffect(() => {
        if (isAuthenticated && role && components.length > 0 && !hasNavigated) {
            console.log('[useLogin] Usuario autenticado, redirigiendo...', { role, components });

            // Redireccionar según el rol y componentes
            if (role.nombre === 'admin' || role.nombre === 'planeacion_facultad') {
                navigate('/admin/dashboard');
            } else if (role.nombre === 'supervisor_general') {
                navigate('/supervisor/dashboard');
            } else {
                // Buscar el componente de dashboard para este rol
                const dashboardComponent = components.find(c => c.nombre.toLowerCase().includes('dashboard'));

                if (dashboardComponent) {
                    const route = getRouteForComponent(dashboardComponent.nombre);
                    console.log('[useLogin] Redirigiendo a:', route);
                    setHasNavigated(true);
                    navigate(route, { replace: true });
                } else {
                    // Fallback: usar el primer componente disponible
                    const firstComponent = components[0];
                    const route = getRouteForComponent(firstComponent.nombre);
                    console.log('[useLogin] No dashboard found, redirigiendo a primer componente:', route);
                    setHasNavigated(true);
                    navigate(route, { replace: true });
                }
            }
        }
    }, [isAuthenticated, role, components, navigate, hasNavigated]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        isHovered,
        setIsHovered,
        isLoading,
        handleSubmit,
        handlePublicAccess
    };
}
