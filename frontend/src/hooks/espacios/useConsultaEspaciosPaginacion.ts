import { useEffect, useMemo, useState } from 'react';
import {
  getPageNumbers,
  getPageSlice,
  getTargetPageForNextWindow,
  getTargetPageForPrevWindow,
  getTotalPages,
  hasNextPageWindow,
  hasPrevPageWindow,
  normalizePage,
  PAGE_SIZE_DEFAULT
} from '../gestionAcademica/paginacion';

export function useConsultaEspaciosPaginacion<T>(items: T[]) {
  const pageSize = PAGE_SIZE_DEFAULT;
  const [currentPage, setCurrentPage] = useState(1);

  const totalFilteredEspacios = items.length;
  const totalPages = getTotalPages(totalFilteredEspacios, pageSize);
  const pageNumbers = useMemo(() => getPageNumbers(totalPages, currentPage), [totalPages, currentPage]);

  const paginatedEspacios = useMemo(() => {
    return getPageSlice(items, currentPage, pageSize);
  }, [items, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [items]);

  useEffect(() => {
    setCurrentPage((prev) => normalizePage(prev, totalPages));
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
    currentPage,
    totalPages,
    pageNumbers,
    pageSize,
    paginatedEspacios,
    totalFilteredEspacios,
    hasPrevPageWindow: hasPrevPageWindow(currentPage, totalPages),
    hasNextPageWindow: hasNextPageWindow(currentPage, totalPages),
    goToPage,
    goToNextPage,
    goToPrevPage,
    goToPrevPageWindow,
    goToNextPageWindow
  };
}
