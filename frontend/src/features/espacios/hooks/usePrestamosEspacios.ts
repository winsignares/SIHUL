import { useState } from 'react';
import type { PrestamoEspacioUI as PrestamoEspacio } from '../../../models';
import { useAuth } from '../../../context/AuthContext';
import { hasNextPageWindow, hasPrevPageWindow } from '../../gestionAcademica/hooks/paginacion';
import { usePrestamosCatalogos } from './usePrestamosCatalogos';
import { usePrestamosCarga } from './usePrestamosCarga';
import { usePrestamosAcciones } from './usePrestamosAcciones';
import { usePrestamosFiltrados } from './usePrestamosFiltrados';
import { usePrestamosPaginacion } from './usePrestamosPaginacion';

export function usePrestamosEspacios() {
    const PAGE_SIZE = 5;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterFechaHora, setFilterFechaHora] = useState('todos');
    const [filterFechaEspecifica, setFilterFechaEspecifica] = useState('');
    const [filterPeriodo, setFilterPeriodo] = useState('todos');
    const [verSolicitudDialog, setVerSolicitudDialog] = useState<string | null>(null);
    const [comentariosAccion, setComentariosAccion] = useState('');
    const [modoEdicion, setModoEdicion] = useState(false);
    const [prestamoEditando, setPrestamoEditando] = useState<PrestamoEspacio | null>(null);
    const [prestamos, setPrestamos] = useState<PrestamoEspacio[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const { user, areas } = useAuth();

    const { espaciosDisponibles, tiposActividad, recursosDisponibles, periodos } = usePrestamosCatalogos();

    const { loadData } = usePrestamosCarga({ user, areas, setPrestamos, setLoading });

    const { aprobarSolicitud, rechazarSolicitud, iniciarEdicion, cancelarEdicion, guardarEdicion, eliminarSolicitud } = usePrestamosAcciones({
        user, loadData, setLoading, setVerSolicitudDialog, setComentariosAccion, setModoEdicion,
        setPrestamoEditando, prestamoEditando, verSolicitudDialog,
    });

    const { filteredPrestamos, statsData } = usePrestamosFiltrados({
        prestamos, searchTerm, filterEstado, filterFechaHora, filterFechaEspecifica, filterPeriodo,
    });

    // ==================== PAGINACIÓN ====================

    const {
        totalFilteredPrestamos, totalPages, pageNumbers, paginatedPrestamos,
        goToPage, goToNextPage, goToPrevPage, goToPrevPageWindow, goToNextPageWindow,
    } = usePrestamosPaginacion({
        filteredPrestamos, currentPage, setCurrentPage, PAGE_SIZE,
        searchTerm, filterEstado, filterFechaHora, filterFechaEspecifica, filterPeriodo,
    });

    return {
        searchTerm,
        setSearchTerm,
        filterEstado,
        setFilterEstado,
        filterFechaHora,
        setFilterFechaHora,
        filterFechaEspecifica,
        setFilterFechaEspecifica,
        filterPeriodo,
        setFilterPeriodo,
        periodos,
        verSolicitudDialog,
        setVerSolicitudDialog,
        comentariosAccion,
        setComentariosAccion,
        modoEdicion,
        prestamoEditando,
        setPrestamoEditando,
        espaciosDisponibles,
        tiposActividad,
        recursosDisponibles,
        prestamos,
        filteredPrestamos,
        paginatedPrestamos,
        totalFilteredPrestamos,
        currentPage,
        totalPages,
        pageNumbers,
        pageSize: PAGE_SIZE,
        goToPage,
        goToNextPage,
        goToPrevPage,
        hasPrevPageWindow: hasPrevPageWindow(currentPage, totalPages),
        hasNextPageWindow: hasNextPageWindow(currentPage, totalPages),
        goToPrevPageWindow,
        goToNextPageWindow,
        statsData,
        aprobarSolicitud,
        rechazarSolicitud,
        iniciarEdicion,
        cancelarEdicion,
        guardarEdicion,
        eliminarSolicitud,
        loading,
        reloadData: () => loadData({ force: true })
    };
}
