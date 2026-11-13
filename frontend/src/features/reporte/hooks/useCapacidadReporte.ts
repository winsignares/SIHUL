import { useState, useEffect } from 'react';
import type { CapacidadUtilizada } from '../../../models';
import type { EstadoHorarioReporte } from '../services/reporteOcupacionAPI';
import { capacidadService } from '../services/capacidadAPI';
import { getSessionCacheData, setSessionCacheData } from '../../../core/sessionCache';
import { REPORTES_CAPACIDAD_CACHE_KEY, capacidadUtilizadaDefault } from './reportesConstantes';

/** Datos del reporte de capacidad utilizada. */
export function useCapacidadReporte(estadoReporte: EstadoHorarioReporte) {
    const [capacidadUtilizada, setCapacidadUtilizada] = useState<CapacidadUtilizada[]>(capacidadUtilizadaDefault);
    const [cargandoCapacidad, setCargandoCapacidad] = useState(false);
    const [errorCapacidad, setErrorCapacidad] = useState<string | null>(null);

    // Cargar datos de capacidad cuando el componente monta
    useEffect(() => {
        const cargarCapacidadReporte = async () => {
            setCargandoCapacidad(true);
            setErrorCapacidad(null);
            try {
                const activeToken = localStorage.getItem('auth_token');
                const cachedData = getSessionCacheData<{ capacidadUtilizada: CapacidadUtilizada[] }>(
                    `${REPORTES_CAPACIDAD_CACHE_KEY}-${estadoReporte}`,
                    activeToken
                );

                if (cachedData) {
                    setCapacidadUtilizada(cachedData.capacidadUtilizada);
                    return;
                }

                const response = await capacidadService.getCapacidad(0, estadoReporte);
                setCapacidadUtilizada(response.capacidad);
                setSessionCacheData(`${REPORTES_CAPACIDAD_CACHE_KEY}-${estadoReporte}`, activeToken, {
                    capacidadUtilizada: response.capacidad
                });
            } catch (error) {
                console.error('Error al cargar datos de capacidad:', error);
                setErrorCapacidad('Error al cargar los datos de capacidad');
            } finally {
                setCargandoCapacidad(false);
            }
        };

        cargarCapacidadReporte();
    }, [estadoReporte]);

    return { capacidadUtilizada, cargandoCapacidad, errorCapacidad };
}
