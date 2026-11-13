import { useState, useEffect } from 'react';
import type { DatoOcupacionJornada, EspacioMasUsado } from '../../../models';
import { reporteOcupacionService, type EstadoHorarioReporte } from '../services/reporteOcupacionAPI';
import { getSessionCacheData, setSessionCacheData } from '../../../core/sessionCache';
import { REPORTES_OCUPACION_CACHE_KEY, datosOcupacionDefault, espaciosMasUsadosDefault } from './reportesConstantes';

/** Datos del reporte de ocupación por jornada y espacios más usados. */
export function useOcupacionReporte(estadoReporte: EstadoHorarioReporte) {
    const [datosOcupacion, setDatosOcupacion] = useState<DatoOcupacionJornada[]>(datosOcupacionDefault);
    const [espaciosMasUsados, setEspaciosMasUsados] = useState<EspacioMasUsado[]>(espaciosMasUsadosDefault);
    const [cargandoOcupacion, setCargandoOcupacion] = useState(false);
    const [errorOcupacion, setErrorOcupacion] = useState<string | null>(null);

    // Cargar datos de ocupación cuando el componente monta
    useEffect(() => {
        const cargarOcupacionReporte = async () => {
            setCargandoOcupacion(true);
            setErrorOcupacion(null);
            try {
                const activeToken = localStorage.getItem('auth_token');
                const cachedData = getSessionCacheData<{
                    datosOcupacion: DatoOcupacionJornada[];
                    espaciosMasUsados: EspacioMasUsado[];
                }>(`${REPORTES_OCUPACION_CACHE_KEY}-${estadoReporte}`, activeToken);

                if (cachedData) {
                    setDatosOcupacion(cachedData.datosOcupacion);
                    setEspaciosMasUsados(cachedData.espaciosMasUsados);
                    return;
                }

                const response = await reporteOcupacionService.getOcupacionReporte(0, estadoReporte);
                
                // Mapear datos con colores
                const datosConColor = response.ocupacion_por_jornada.map((dato, index) => ({
                    ...dato,
                    color: index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-red-600' : 'bg-yellow-600'
                }));
                
                setDatosOcupacion(datosConColor);
                setEspaciosMasUsados(response.espacios_mas_usados);
                setSessionCacheData(`${REPORTES_OCUPACION_CACHE_KEY}-${estadoReporte}`, activeToken, {
                    datosOcupacion: datosConColor,
                    espaciosMasUsados: response.espacios_mas_usados
                });
            } catch (error) {
                console.error('Error al cargar datos de ocupación:', error);
                setErrorOcupacion('Error al cargar los datos de ocupación');
                // Mantener datos por defecto en caso de error
            } finally {
                setCargandoOcupacion(false);
            }
        };

        cargarOcupacionReporte();
    }, [estadoReporte]);

    return { datosOcupacion, espaciosMasUsados, cargandoOcupacion, errorOcupacion };
}
