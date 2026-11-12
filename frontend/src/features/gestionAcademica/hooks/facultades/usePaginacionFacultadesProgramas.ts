import { useState, useEffect, useMemo } from 'react';
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
} from '../paginacion';
import type { Facultad, Programa } from './facultadesProgramsUtils';

interface Opciones {
    filteredFacultades: Facultad[];
    filteredProgramas: Programa[];
    searchTerm: string;
    selectedFacultadFilter: string;
}

/** Páginas de las tablas de facultades y de programas (se reinician al buscar o filtrar). */
export function usePaginacionFacultadesProgramas({ filteredFacultades, filteredProgramas, searchTerm, selectedFacultadFilter }: Opciones) {
    const PAGE_SIZE = PAGE_SIZE_DEFAULT;
    const [currentFacultadPage, setCurrentFacultadPage] = useState(1);
    const [currentProgramaPage, setCurrentProgramaPage] = useState(1);

    const totalFilteredFacultades = filteredFacultades.length;
    const totalFacultadPages = getTotalPages(totalFilteredFacultades, PAGE_SIZE);
    const facultadPageNumbers = useMemo(
        () => getPageNumbers(totalFacultadPages, currentFacultadPage),
        [totalFacultadPages, currentFacultadPage]
    );
    const paginatedFacultades = useMemo(() => {
        return getPageSlice(filteredFacultades, currentFacultadPage, PAGE_SIZE);
    }, [filteredFacultades, currentFacultadPage, PAGE_SIZE]);

    const totalFilteredProgramas = filteredProgramas.length;
    const totalProgramaPages = getTotalPages(totalFilteredProgramas, PAGE_SIZE);
    const programaPageNumbers = useMemo(
        () => getPageNumbers(totalProgramaPages, currentProgramaPage),
        [totalProgramaPages, currentProgramaPage]
    );
    const paginatedProgramas = useMemo(() => {
        return getPageSlice(filteredProgramas, currentProgramaPage, PAGE_SIZE);
    }, [filteredProgramas, currentProgramaPage, PAGE_SIZE]);

    useEffect(() => {
        setCurrentFacultadPage(1);
        setCurrentProgramaPage(1);
    }, [searchTerm]);

    useEffect(() => {
        setCurrentProgramaPage(1);
    }, [selectedFacultadFilter]);

    useEffect(() => {
        setCurrentFacultadPage((prev) => normalizePage(prev, totalFacultadPages));
    }, [totalFacultadPages]);

    useEffect(() => {
        setCurrentProgramaPage((prev) => normalizePage(prev, totalProgramaPages));
    }, [totalProgramaPages]);

    const goToFacultadPage = (page: number) => {
        setCurrentFacultadPage(normalizePage(page, totalFacultadPages));
    };

    const goToNextFacultadPage = () => {
        goToFacultadPage(currentFacultadPage + 1);
    };

    const goToPrevFacultadPage = () => {
        goToFacultadPage(currentFacultadPage - 1);
    };

    const goToProgramaPage = (page: number) => {
        setCurrentProgramaPage(normalizePage(page, totalProgramaPages));
    };

    const goToNextProgramaPage = () => {
        goToProgramaPage(currentProgramaPage + 1);
    };

    const goToPrevProgramaPage = () => {
        goToProgramaPage(currentProgramaPage - 1);
    };

    const goToPrevFacultadPageWindow = () => {
        const target = getTargetPageForPrevWindow(currentFacultadPage, totalFacultadPages);
        if (target != null) goToFacultadPage(target);
    };

    const goToNextFacultadPageWindow = () => {
        const target = getTargetPageForNextWindow(currentFacultadPage, totalFacultadPages);
        if (target != null) goToFacultadPage(target);
    };

    const goToPrevProgramaPageWindow = () => {
        const target = getTargetPageForPrevWindow(currentProgramaPage, totalProgramaPages);
        if (target != null) goToProgramaPage(target);
    };

    const goToNextProgramaPageWindow = () => {
        const target = getTargetPageForNextWindow(currentProgramaPage, totalProgramaPages);
        if (target != null) goToProgramaPage(target);
    };

    return {
        paginatedFacultades,
        totalFilteredFacultades,
        currentFacultadPage,
        totalFacultadPages,
        facultadPageNumbers,
        goToFacultadPage,
        goToNextFacultadPage,
        goToPrevFacultadPage,
        hasPrevFacultadPageWindow: hasPrevPageWindow(currentFacultadPage, totalFacultadPages),
        hasNextFacultadPageWindow: hasNextPageWindow(currentFacultadPage, totalFacultadPages),
        goToPrevFacultadPageWindow,
        goToNextFacultadPageWindow,
        paginatedProgramas,
        totalFilteredProgramas,
        currentProgramaPage,
        totalProgramaPages,
        programaPageNumbers,
        goToProgramaPage,
        goToNextProgramaPage,
        goToPrevProgramaPage,
        hasPrevProgramaPageWindow: hasPrevPageWindow(currentProgramaPage, totalProgramaPages),
        hasNextProgramaPageWindow: hasNextPageWindow(currentProgramaPage, totalProgramaPages),
        goToPrevProgramaPageWindow,
        goToNextProgramaPageWindow,
        pageSize: PAGE_SIZE,
    };
}
