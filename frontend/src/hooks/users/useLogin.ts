import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthService } from '../../services/auth';
import { normalizeRole } from '../../hooks/roleUtils';
import { useUser } from '../../context/UserContext';
import type { Usuario } from '../../models/index';

export function useLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [hasNavigated, setHasNavigated] = useState(false);
    const navigate = useNavigate();
    const { usuario, setUsuario } = useUser();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const result = AuthService.login(email, password);
            if (result.success && result.usuario) {
                const normalizedRole = normalizeRole(result.usuario.rol as string) as
                    | 'admin'
                    | 'supervisor_general'
                    | 'consultor_docente'
                    | 'consultor_estudiante'
                    | 'autorizado'
                    | 'consultor'
                    | undefined;

                const usuarioNormalizado: Usuario = {
                    ...result.usuario,
                    rol: (normalizedRole || result.usuario.rol) as Usuario['rol']
                } as Usuario;

                console.log('Login exitoso - Usuario:', result.usuario, 'Rol original:', result.usuario.rol, 'Rol normalizado:', usuarioNormalizado.rol);
                setUsuario(usuarioNormalizado);
            } else {
                console.log('Login fallido:', result.error);
                setError(result.error || 'Error al iniciar sesión');
            }
        } catch (err) {
            console.error('Error en AuthService.login:', err);
            setError('Error al iniciar sesión');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        console.log('useEffect Login - usuario:', usuario, 'rol:', usuario?.rol, 'hasNavigated:', hasNavigated);
        if (usuario && !hasNavigated) {
            console.log('Usuario logueado, redirigiendo a / para que el router maneje la navegación');
            setHasNavigated(true);
            navigate('/', { replace: true });
        }
    }, [usuario, navigate, hasNavigated]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        isHovered,
        setIsHovered,
        isLoading,
        handleSubmit
    };
}
