import { useState, useEffect, useCallback } from 'react';
import { aperturaCierreService, type SalonAperturaCierre } from '../../services/espacios/espaciosAPI';
import { toast } from 'sonner';

/**
 * Hook para gestión de apertura y cierre de salones
 * TODA la lógica de negocio está en el backend
 * Este hook solo se encarga de llamar al servicio y manejar el estado de la UI
 */
export function useAperturaCierre() {
    const [aperturasPendientes, setAperturasPendientes] = useState<SalonAperturaCierre[]>([]);
    const [cierresPendientes, setCierresPendientes] = useState<SalonAperturaCierre[]>([]);
    const [horaActual, setHoraActual] = useState<string>('');
    const [diaActual, setDiaActual] = useState<string>('');
    const [fechaActual, setFechaActual] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    /**
     * Función para cargar datos desde el backend
     * El backend se encarga de:
     * - Obtener el usuario autenticado
     * - Consultar sus espacios permitidos
     * - Calcular las ventanas de tiempo (15 min antes apertura, 5 min antes cierre)
     * - Filtrar horarios y préstamos que apliquen
     */
    const cargarDatos = useCallback(async () => {
        try {
            setError(null);
            const data = await aperturaCierreService.getProximos();

            setAperturasPendientes(data.aperturasPendientes);
            setCierresPendientes(data.cierresPendientes);
            setHoraActual(data.horaActual);
            setDiaActual(data.diaActual);
            setFechaActual(data.fechaActual);
        } catch (err: any) {
            console.error('Error cargando datos de apertura/cierre:', err);
            const errorMsg = err?.message || 'Error al cargar los datos';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    }, []);

    // Cargar datos al montar el componente
    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    // Auto-refresh cada 1 minuto (60000 ms)
    useEffect(() => {
        const interval = setInterval(() => {
            cargarDatos();
        }, 60000);

        return () => clearInterval(interval);
    }, [cargarDatos]);

    /**
     * Función para refrescar manualmente
     */
    const refrescar = async () => {
        setLoading(true);
        await cargarDatos();
    };

    return {
        aperturasPendientes,
        cierresPendientes,
        horaActual,
        diaActual,
        fechaActual,
        loading,
        error,
        refrescar
    };
}
