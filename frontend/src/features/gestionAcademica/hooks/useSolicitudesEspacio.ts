import { useState, useEffect } from 'react';
import { useNotification } from '../../../components/ui/notificationBanner';
import { solicitudEspacioService, type SolicitudEspacio } from '../../horarios/services/solicitudEspacioAPI';
import { useAuth } from '../../../context/AuthContext';
import { useActualizacionEnVivo } from '../../../hooks/useActualizacionEnVivo';

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

    // Alguien más creó o resolvió una solicitud de espacio: se vuelve a leer sin mostrar el spinner.
    useActualizacionEnVivo(['solicitudes-espacio', 'horarios', 'espacios'], () => {
        void loadSolicitudes({ silent: true });
    });

    const loadSolicitudes = async ({ silent = false }: { silent?: boolean } = {}) => {
        try {
            if (!silent) setLoading(true);
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
