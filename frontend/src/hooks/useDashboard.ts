import { useState, useEffect } from 'react';
import { dashboardService, type DashboardEstadisticas } from '../services/dashboard/dashboardService';

export function useDashboard() {
  const [estadisticas, setEstadisticas] = useState<DashboardEstadisticas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEstadisticas = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getEstadisticas();
      setEstadisticas(data);
    } catch (err: any) {
      setError(err.message || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEstadisticas();
  }, []);

  return {
    estadisticas,
    loading,
    error,
    refetch: fetchEstadisticas,
  };
}
