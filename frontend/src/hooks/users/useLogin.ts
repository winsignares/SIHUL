import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/users/authService';

export function useLogin() {
    const LOCKOUT_SECONDS = 120;
    const LOCKOUT_STORAGE_KEY = 'login_lockout_until';
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isHovered, setIsHovered] = useState(false);
    const [hasNavigated, setHasNavigated] = useState(false);
    const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
    const [remainingSeconds, setRemainingSeconds] = useState(0);
    const navigate = useNavigate();
    const { login, isAuthenticated, role, components, isLoading } = useAuth();

    const isLockedOut = lockoutUntil !== null && lockoutUntil > Date.now();

    const startLockout = (seconds: number) => {
        const until = Date.now() + seconds * 1000;
        setLockoutUntil(until);
        localStorage.setItem(LOCKOUT_STORAGE_KEY, String(until));
        setRemainingSeconds(seconds);
    };

    const clearLockout = () => {
        setLockoutUntil(null);
        setRemainingSeconds(0);
        localStorage.removeItem(LOCKOUT_STORAGE_KEY);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (isLockedOut) {
            setError(`Demasiados intentos. Intenta de nuevo en ${remainingSeconds || LOCKOUT_SECONDS} segundos.`);
            return;
        }

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
            const status = err?.status ?? err?.response?.status;
            const errorMessage = err?.response?.data?.message || err?.message || 'Error al iniciar sesión. Verifique sus credenciales.';

            if (status === 429) {
                startLockout(LOCKOUT_SECONDS);
            }

            setError(errorMessage);
        }
    };

    const handlePublicAccess = () => {
        console.log('[useLogin] Acceso público solicitado');

        const publicVerified = localStorage.getItem('public_access_verified');
        
        // Limpiar cualquier data de autenticación y cache del localStorage
        localStorage.clear();
        
        // Marcar que es acceso público
        localStorage.setItem('auth_is_public', 'true');
        if (publicVerified) {
            localStorage.setItem('public_access_verified', publicVerified);
        }
        
        navigate('/public/dashboard', { replace: true });
    };

    const handleMicrosoftLogin = () => {
        window.location.href = authService.getMicrosoftLoginUrl();
    };

    useEffect(() => {
        if (isAuthenticated && role && components.length > 0 && !hasNavigated) {
            console.log('[useLogin] Usuario autenticado, redirigiendo...', { role, components });

            // Delegar selección de home al router central.
            // Así evitamos forzar al rol admin al dashboard de planeación.
            setHasNavigated(true);
            navigate('/', { replace: true });
            return;
        }

        if (isAuthenticated && role && components.length === 0) {
            setError('Tu cuenta no tiene componentes asignados todavía. Contacta a un administrador para habilitar tus módulos de acceso.');
        }
    }, [isAuthenticated, role, components, navigate, hasNavigated]);

    useEffect(() => {
        const stored = localStorage.getItem(LOCKOUT_STORAGE_KEY);
        if (!stored) {
            return;
        }

        const parsed = Number(stored);
        if (!Number.isFinite(parsed)) {
            localStorage.removeItem(LOCKOUT_STORAGE_KEY);
            return;
        }

        if (parsed > Date.now()) {
            setLockoutUntil(parsed);
            setRemainingSeconds(Math.ceil((parsed - Date.now()) / 1000));
        } else {
            localStorage.removeItem(LOCKOUT_STORAGE_KEY);
        }
    }, []);

    useEffect(() => {
        if (!isLockedOut || lockoutUntil === null) {
            return;
        }

        const interval = window.setInterval(() => {
            const secondsLeft = Math.ceil((lockoutUntil - Date.now()) / 1000);
            if (secondsLeft <= 0) {
                clearLockout();
                return;
            }
            setRemainingSeconds(secondsLeft);
        }, 1000);

        return () => window.clearInterval(interval);
    }, [isLockedOut, lockoutUntil]);

    return {
        email,
        setEmail,
        password,
        setPassword,
        error,
        isHovered,
        setIsHovered,
        isLoading,
        isLockedOut,
        remainingSeconds,
        handleSubmit,
        handlePublicAccess,
        handleMicrosoftLogin
    };
}
