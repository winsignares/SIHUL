import { useState, useCallback } from 'react';
import { espacioRecursoService, type EspacioRecurso } from '../../../services/recursos/recursoAPI';
import type { EspacioConHorarios } from '../services/espaciosAPI';
import { toast } from 'sonner';
import type { RecursoCierrePendiente, ResultadoAccion } from './aperturaCierreTipos';

/** Ventana de revisión de los recursos de un salón al cerrarlo. */
export function useRevisionRecursos({ espacios, refrescar }: {
    espacios: EspacioConHorarios[];
    refrescar: () => Promise<void>;
}) {
    const [modalRecursosAbierto, setModalRecursosAbierto] = useState<boolean>(false);
    const [espacioEnRevision, setEspacioEnRevision] = useState<{ id: number; nombre: string } | null>(null);
    const [recursosPendientes, setRecursosPendientes] = useState<RecursoCierrePendiente[]>([]);
    const [cargandoRecursos, setCargandoRecursos] = useState<boolean>(false);
    const [guardandoRecursos, setGuardandoRecursos] = useState<boolean>(false);

    const abrirPopupRevisionRecursos = useCallback(async (espacioId: number) => {
        setCargandoRecursos(true);
        try {
            const espacio = espacios.find((item) => item.idEspacio === espacioId);
            const { recursos } = await espacioRecursoService.listarPorEspacio(espacioId);

            setEspacioEnRevision({
                id: espacioId,
                nombre: espacio?.nombreEspacio || `Espacio #${espacioId}`
            });
            setRecursosPendientes(
                recursos.map((recurso) => ({
                    ...recurso,
                    estadoOriginal: recurso.estado
                }))
            );
            setModalRecursosAbierto(true);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const message = err?.message || 'No fue posible cargar recursos del espacio';
            toast.error(message);
            setEspacioEnRevision({ id: espacioId, nombre: `Espacio #${espacioId}` });
            setRecursosPendientes([]);
            setModalRecursosAbierto(true);
        } finally {
            setCargandoRecursos(false);
        }
    }, [espacios]);

    const actualizarEstadoRecurso = useCallback((recursoId: number, estado: EspacioRecurso['estado']) => {
        setRecursosPendientes((prev) => prev.map((item) => (
            item.recurso_id === recursoId ? { ...item, estado } : item
        )));
    }, []);

    const cerrarPopupRecursos = useCallback(() => {
        setModalRecursosAbierto(false);
        setEspacioEnRevision(null);
        setRecursosPendientes([]);
    }, []);

    const confirmarRevisionRecursos = useCallback(async (): Promise<ResultadoAccion> => {
        if (!espacioEnRevision) {
            cerrarPopupRecursos();
            return { ok: true as const };
        }

        setGuardandoRecursos(true);
        try {
            const cambios = recursosPendientes.filter((item) => item.estado !== item.estadoOriginal);

            if (cambios.length > 0) {
                await Promise.all(cambios.map((item) => espacioRecursoService.actualizarEspacioRecurso({
                    espacio_id: item.espacio_id,
                    recurso_id: item.recurso_id,
                    estado: item.estado
                })));
            }

            cerrarPopupRecursos();
            await refrescar();
            return { ok: true as const };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            const message = err?.message || 'No fue posible guardar cambios de recursos';
            toast.error(message);
            return { ok: false as const, message };
        } finally {
            setGuardandoRecursos(false);
        }
    }, [cerrarPopupRecursos, espacioEnRevision, recursosPendientes, refrescar]);

    return {
        modalRecursosAbierto, setModalRecursosAbierto, espacioEnRevision, recursosPendientes,
        cargandoRecursos, guardandoRecursos, abrirPopupRevisionRecursos, actualizarEstadoRecurso,
        cerrarPopupRecursos, confirmarRevisionRecursos,
    };
}
