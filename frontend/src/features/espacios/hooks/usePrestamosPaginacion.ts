import { useEffect, useMemo, type Dispatch, type SetStateAction } from 'react';
import type { PrestamoEspacioUI as PrestamoEspacio } from '../../../models';
import {
  getPageNumbers,
  getPageSlice,
  getTargetPageForNextWindow,
  getTargetPageForPrevWindow,
  getTotalPages,
  normalizePage
} from '../../gestionAcademica/hooks/paginacion';

/** Paginación de la lista de préstamos filtrados. */
export function usePrestamosPaginacion({
    filteredPrestamos, currentPage, setCurrentPage, PAGE_SIZE,
    searchTerm, filterEstado, filterFechaHora, filterFechaEspecifica, filterPeriodo,
}: {
    filteredPrestamos: PrestamoEspacio[];
    currentPage: number;
    setCurrentPage: Dispatch<SetStateAction<number>>;
    PAGE_SIZE: number;
    searchTerm: string;
    filterEstado: string;
    filterFechaHora: string;
    filterFechaEspecifica: string;
    filterPeriodo: string;
}) {
    const totalFilteredPrestamos = filteredPrestamos.length;
    const totalPages = getTotalPages(totalFilteredPrestamos, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages, currentPage), [totalPages, currentPage]);

    const paginatedPrestamos = useMemo(() => {
        return getPageSlice(filteredPrestamos, currentPage, PAGE_SIZE);
    }, [filteredPrestamos, currentPage, PAGE_SIZE]);

    useEffect(() => {
        setCurrentPage(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, filterEstado, filterFechaHora, filterFechaEspecifica, filterPeriodo]);

    useEffect(() => {
        setCurrentPage((prev) => normalizePage(prev, totalPages));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [totalPages]);

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
        totalFilteredPrestamos, totalPages, pageNumbers, paginatedPrestamos,
        goToPage, goToNextPage, goToPrevPage, goToPrevPageWindow, goToNextPageWindow,
    };
}
