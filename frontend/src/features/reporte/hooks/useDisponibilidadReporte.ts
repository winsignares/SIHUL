import { useState, useEffect } from 'react';
import type { DisponibilidadEspacio } from '../../../models';
import type { EstadoHorarioReporte } from '../services/reporteOcupacionAPI';
import { disponibilidadService } from '../services/disponibilidadAPI';
import { getSessionCacheData, setSessionCacheData } from '../../../core/sessionCache';
import { REPORTES_DISPONIBILIDAD_CACHE_KEY, disponibilidadEspaciosDefault } from './reportesConstantes';
import { useActualizacionEnVivo } from '../../../hooks/useActualizacionEnVivo';

/** Datos del reporte de disponibilidad de espacios. */
export function useDisponibilidadReporte(estadoReporte: EstadoHorarioReporte) {
    // Alguien más cambió los datos del reporte: se vuelve a calcular.
    const [recarga, setRecarga] = useState(0);
    useActualizacionEnVivo(['horarios', 'horarios-fusionados', 'espacios', 'espacios-permitidos', 'tipos-espacio', 'periodos', 'sedes', 'prestamos-espacio'], () => setRecarga((n) => n + 1));

    const [disponibilidadEspacios, setDisponibilidadEspacios] = useState<DisponibilidadEspacio[]>(disponibilidadEspaciosDefault);
    const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
    const [errorDisponibilidad, setErrorDisponibilidad] = useState<string | null>(null);

    // Cargar datos de disponibilidad cuando el componente monta
    useEffect(() => {
        const cargarDisponibilidadReporte = async () => {
            setCargandoDisponibilidad(true);
            setErrorDisponibilidad(null);
            try {
                const activeToken = localStorage.getItem('auth_token');
                const cachedData = getSessionCacheData<{ disponibilidadEspacios: DisponibilidadEspacio[] }>(
                    `${REPORTES_DISPONIBILIDAD_CACHE_KEY}-${estadoReporte}`,
                    activeToken
                );

                if (cachedData) {
                    setDisponibilidadEspacios(cachedData.disponibilidadEspacios);
                    return;
                }

                const response = await disponibilidadService.getDisponibilidad(0, estadoReporte);
                setDisponibilidadEspacios(response.disponibilidad);
                setSessionCacheData(`${REPORTES_DISPONIBILIDAD_CACHE_KEY}-${estadoReporte}`, activeToken, {
                    disponibilidadEspacios: response.disponibilidad
                });
            } catch (error) {
                console.error('Error al cargar datos de disponibilidad:', error);
                setErrorDisponibilidad('Error al cargar los datos de disponibilidad');
            } finally {
                setCargandoDisponibilidad(false);
            }
        };

        cargarDisponibilidadReporte();
    }, [estadoReporte, recarga]);

    return { disponibilidadEspacios, cargandoDisponibilidad, errorDisponibilidad };
}
