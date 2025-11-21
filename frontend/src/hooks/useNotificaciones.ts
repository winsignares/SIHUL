import { useState, useEffect } from 'react';
import { notificacionesService, type Notificacion } from '../services/notificaciones/notificacionesService';

export function useNotificaciones(usuarioId: number | null, leidas?: boolean) {
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotificaciones = async () => {
    if (!usuarioId) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await notificacionesService.getByUsuario(usuarioId, leidas);
      setNotificaciones(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  };

  const marcarLeida = async (notificacionId: number) => {
    setLoading(true);
    setError(null);
    try {
      await notificacionesService.marcarLeida(notificacionId);
      setNotificaciones(notificaciones.map(n => 
        n.id === notificacionId ? { ...n, leida: true } : n
      ));
    } catch (err: any) {
      setError(err.message || 'Error al marcar notificación');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotificaciones();
  }, [usuarioId, leidas]);

  return {
    notificaciones,
    loading,
    error,
    refetch: fetchNotificaciones,
    marcarLeida,
  };
}
