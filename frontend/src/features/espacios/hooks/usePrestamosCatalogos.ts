import { useState, useEffect } from 'react';
import { prestamosPublicAPI, type TipoActividadAPI } from '../../prestamos/services/prestamosPublicAPI';
import { espaciosAPI, type EspacioFisico } from '../services/espaciosAPI';
import { periodoService, type PeriodoAcademico } from '../../gestionAcademica/services/periodos/periodoAPI';
import { recursoService, type Recurso } from '../../../services/recursos/recursoAPI';
import { showNotification } from '../../../context/ThemeContext';

/** Catálogos usados en el formulario de edición de un préstamo. */
export function usePrestamosCatalogos() {
    const [espaciosDisponibles, setEspaciosDisponibles] = useState<EspacioFisico[]>([]);
    const [tiposActividad, setTiposActividad] = useState<TipoActividadAPI[]>([]);
    const [recursosDisponibles, setRecursosDisponibles] = useState<Recurso[]>([]);
    const [periodos, setPeriodos] = useState<PeriodoAcademico[]>([]);

    // Cargar catálogos usados en el formulario de edición (espacios, tipos de actividad, recursos, periodos)
    useEffect(() => {
        (async () => {
            try {
                const [espaciosResp, tiposResp, recursosResp, periodosResp] = await Promise.all([
                    espaciosAPI.list(),
                    prestamosPublicAPI.listarTiposActividad(),
                    recursoService.listarRecursos(),
                    periodoService.listarPeriodos()
                ]);
                setEspaciosDisponibles(espaciosResp.espacios);
                setTiposActividad(tiposResp.tipos_actividad);
                setRecursosDisponibles(recursosResp.recursos);
                setPeriodos(
                    [...periodosResp.periodos].sort((a, b) => b.fecha_inicio.localeCompare(a.fecha_inicio))
                );
            } catch (error) {
                showNotification({
                    message: `Error al cargar catálogos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                    type: 'error'
                });
            }
        })();
    }, []);

    return { espaciosDisponibles, tiposActividad, recursosDisponibles, periodos };
}
