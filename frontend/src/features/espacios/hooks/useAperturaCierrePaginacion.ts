import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import {
  getPageNumbers,
  getPageSlice,
  getTargetPageForNextWindow,
  getTargetPageForPrevWindow,
  getTotalPages,
  normalizePage
} from '../../gestionAcademica/hooks/paginacion';
import type { HorarioPendientePaginado } from './aperturaCierreTipos';

/** Paginación de los horarios pendientes de apertura o cierre. */
export function useAperturaCierrePaginacion({
    horariosPendientes, currentPage, setCurrentPage, PAGE_SIZE, searchTerm, filterTipo, filterEstado, filterSede,
}: {
    horariosPendientes: HorarioPendientePaginado[];
    currentPage: number;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    PAGE_SIZE: number;
    searchTerm: string;
    filterTipo: string;
    filterEstado: string;
    filterSede: string;
}) {
    const totalHorariosPendientes = horariosPendientes.length;
    const totalPages = getTotalPages(totalHorariosPendientes, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages, currentPage), [totalPages, currentPage]);

    const horariosPaginados = useMemo(() => {
        return getPageSlice(horariosPendientes, currentPage, PAGE_SIZE);
    }, [horariosPendientes, currentPage, PAGE_SIZE]);

    useEffect(() => {
        setCurrentPage((prev) => normalizePage(prev, totalPages));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);

    useEffect(() => {
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, filterTipo, filterEstado, filterSede]);

    const goToPage = (page: number) => {
        setCurrentPage(normalizePage(page, totalPages));
    };

    const goToNextPage = () => {
        goToPage(currentPage + 1);
    };

    const goToPrevPage = () => {
        goToPage(currentPage - 1);
    };

    const goToPrevPageWindow = () => {
        const target = getTargetPageForPrevWindow(currentPage, totalPages);
        if (target != null) goToPage(target);
    };

    const goToNextPageWindow = () => {
        const target = getTargetPageForNextWindow(currentPage, totalPages);
        if (target != null) goToPage(target);
    };


    return {
        totalHorariosPendientes, totalPages, pageNumbers, horariosPaginados,
        goToPage, goToNextPage, goToPrevPage, goToPrevPageWindow, goToNextPageWindow,
    };
}
