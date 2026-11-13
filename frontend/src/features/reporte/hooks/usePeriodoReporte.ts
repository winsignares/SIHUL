import { useState, useEffect } from 'react';
import { periodoActivoService } from '../../gestionAcademica/services/periodos/periodoActivoAPI';
import { PERIODO_EMPTY, PERIODO_LOADING } from './reportesConstantes';

/** Nombre del período académico activo. */
export function usePeriodoReporte() {
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
    }, []);

    return { periodoActual };
}
