import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { solicitudEspacioService, type SolicitudEspacio } from '../../services/horarios/solicitudEspacioAPI';
import { useAuth } from '../../context/AuthContext';

export interface UseSolicitudesEspacioProps {
    onSolicitudActualizada?: () => void;
}

export function useSolicitudesEspacio({ onSolicitudActualizada }: UseSolicitudesEspacioProps = {}) {
    const { user } = useAuth();
    const { notification, showNotification } = useNotification();

    const [loading, setLoading] = useState(false);
    const [solicitudes, setSolicitudes] = useState<SolicitudEspacio[]>([]);
    const [filtroEstado, setFiltroEstado] = useState<'todas' | 'pendiente' | 'aprobada' | 'rechazada'>('todas');

    useEffect(() => {
        loadSolicitudes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const loadSolicitudes = async () => {
        try {
            setLoading(true);
            const response = await solicitudEspacioService.list();
            setSolicitudes(response.solicitudes);
        } catch (error) {
            showNotification(
                `Error al cargar solicitudes: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const solicitudesFiltradas = filtroEstado === 'todas'
        ? solicitudes
        : solicitudes.filter(s => s.estado === filtroEstado);

    const handleAprobarSolicitud = async (solicitudId: number, comentario?: string) => {
        if (!user?.id) {
            showNotification('Usuario no identificado', 'error');
            return;
        }

        try {
            setLoading(true);
            await solicitudEspacioService.aprobar({
                solicitud_id: solicitudId,
                admin_id: user.id,
                comentario
            });

            showNotification('✅ Solicitud aprobada exitosamente', 'success');
            await loadSolicitudes();

            if (onSolicitudActualizada) {
                onSolicitudActualizada();
            }
        } catch (error) {
            showNotification(
                `Error al aprobar solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    const handleRechazarSolicitud = async (solicitudId: number, comentario?: string) => {
        if (!user?.id) {
            showNotification('Usuario no identificado', 'error');
            return;
        }

        try {
            setLoading(true);
            await solicitudEspacioService.rechazar({
                solicitud_id: solicitudId,
                admin_id: user.id,
                comentario
            });

            showNotification('✅ Solicitud rechazada', 'success');
            await loadSolicitudes();

            if (onSolicitudActualizada) {
                onSolicitudActualizada();
            }
        } catch (error) {
            showNotification(
                `Error al rechazar solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                'error'
            );
        } finally {
            setLoading(false);
        }
    };

    return {
        loading,
        solicitudes,
        solicitudesFiltradas,
        filtroEstado,
        setFiltroEstado,
        loadSolicitudes,
        handleAprobarSolicitud,
        handleRechazarSolicitud,
        notification
    };
}
