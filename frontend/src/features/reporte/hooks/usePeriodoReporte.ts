import { useState, useEffect } from 'react';
import { periodoActivoService } from '../../gestionAcademica/services/periodos/periodoActivoAPI';
import { PERIODO_EMPTY, PERIODO_LOADING } from './reportesConstantes';
import { useActualizacionEnVivo } from '../../../hooks/useActualizacionEnVivo';

/** Nombre del período académico activo. */
export function usePeriodoReporte() {
    // Alguien más cambió los datos del reporte: se vuelve a calcular.
    const [recarga, setRecarga] = useState(0);
    useActualizacionEnVivo(['horarios', 'horarios-fusionados', 'espacios', 'espacios-permitidos', 'tipos-espacio', 'periodos', 'sedes', 'prestamos-espacio'], () => setRecarga((n) => n + 1));

    const [periodoActual, setPeriodoActual] = useState(PERIODO_LOADING);

    // Cargar período académico activo
    useEffect(() => {
        const cargarPeriodo = async () => {
            try {
                const periodo = await periodoActivoService.getPeriodoActivo();
                setPeriodoActual(periodo?.nombre || PERIODO_EMPTY);
            } catch (error) {
                console.error('Error al cargar período activo:', error);
                setPeriodoActual(PERIODO_EMPTY);
            }
        };

        cargarPeriodo();
    }, [recarga]);

    return { periodoActual };
}
