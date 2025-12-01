import { Bell } from 'lucide-react';
import { Button } from '../../share/button';
import { useNotificacionesContext } from '../../context/NotificacionesContext';
import { useNavigate } from 'react-router-dom';

/**
 * Componente del ícono de notificaciones con contador
 * Se puede usar en el navbar para mostrar las notificaciones pendientes
 */
export function NotificacionesIcon() {
    const { contadorNoLeidas } = useNotificacionesContext();
    const navigate = useNavigate();

    const handleClick = () => {
        navigate('/notificaciones');
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className="relative"
            title={`${contadorNoLeidas} notificación(es) sin leer`}
        >
            <Bell className="h-5 w-5" />
            {contadorNoLeidas > 0 && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-yellow-500 animate-pulse ring-2 ring-white dark:ring-slate-800"></span>
            )}
        </Button>
    );
}
