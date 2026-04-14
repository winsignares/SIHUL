import { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { sedeService } from '../../services/sedes/sedeAPI';
import type { Sede } from '../../services/sedes/sedeAPI';
import type { Seccional } from '../../services/sedes/sedeAPI';
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
} from './paginacion';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const SEDES_CACHE_KEY = 'gestion-academica-sedes';

export function useSedes() {
    const PAGE_SIZE = PAGE_SIZE_DEFAULT;
    const [searchTerm, setSearchTerm] = useState('');
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [seccionales, setSeccionales] = useState<Seccional[]>([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    // Estados de modales
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    // Estados de formulario
    const [sedeForm, setSedeForm] = useState({ nombre: '', direccion: '', seccionalId: '' });
    const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

    // Cargar datos
    useEffect(() => {
        loadSedes();
        loadSeccionales();
    }, []);

    const loadSeccionales = async () => {
        try {
            const response = await sedeService.listarSeccionales();
            setSeccionales(response.seccionales.filter((seccional) => seccional.activa));
        } catch (error) {
            toast.error(`Error al cargar seccionales: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
    };

    const loadSedes = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedSedes = force ? null : getSessionCacheData<Sede[]>(SEDES_CACHE_KEY, activeToken);

            if (cachedSedes) {
                setSedes(cachedSedes);
                return;
            }

            setLoading(true);
            const response = await sedeService.listarSedes();
            setSedes(response.sedes);
            setSessionCacheData(SEDES_CACHE_KEY, activeToken, response.sedes);
        } catch (error) {
            toast.error(`Error al cargar sedes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Crear sede
    const handleCreate = async () => {
        if (!sedeForm.nombre.trim()) {
            toast.error('El nombre de la sede es obligatorio');
            return;
        }

        if (!sedeForm.seccionalId) {
            toast.error('Debe seleccionar una seccional');
            return;
        }

        try {
            setLoading(true);
            await sedeService.crearSede({
                nombre: sedeForm.nombre.trim(),
                direccion: sedeForm.direccion.trim() || undefined,
                seccional_id: Number(sedeForm.seccionalId),
                activa: true
            });

            await loadSedes({ force: true });
            setSedeForm({ nombre: '', direccion: '', seccionalId: '' });
            setShowCreate(false);

            toast.success('Sede registrada exitosamente');
        } catch (error) {
            toast.error(`Error al crear sede: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Editar sede
    const handleEdit = async () => {
        if (!selectedSede) return;

        if (!sedeForm.nombre.trim()) {
            toast.error('El nombre de la sede es obligatorio');
            return;
        }

        if (!sedeForm.seccionalId) {
            toast.error('Debe seleccionar una seccional');
            return;
        }

        try {
            setLoading(true);
            await sedeService.actualizarSede({
                id: selectedSede.id,
                nombre: sedeForm.nombre.trim(),
                direccion: sedeForm.direccion.trim() || undefined,
                seccional_id: Number(sedeForm.seccionalId),
                activa: selectedSede.activa
            });

            await loadSedes({ force: true });
            setShowEdit(false);
            setSelectedSede(null);
            setSedeForm({ nombre: '', direccion: '', seccionalId: '' });

            toast.info('Sede actualizada correctamente');
        } catch (error) {
            toast.error(`Error al actualizar sede: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Eliminar sede
    const handleDelete = async () => {
        if (!selectedSede || !selectedSede.id) return;

        try {
            setLoading(true);
            await sedeService.eliminarSede(selectedSede.id);

            await loadSedes({ force: true });
            setShowDelete(false);
            setSelectedSede(null);

            toast.error('Sede eliminada correctamente');
        } catch (error) {
            toast.error(`Error al eliminar sede: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Activar/Inactivar sede
    const toggleActiva = async (sede: Sede) => {
        if (!sede.id) return;

        try {
            setLoading(true);
            await sedeService.actualizarSede({
                ...sede,
                activa: !sede.activa
            });
            
            await loadSedes({ force: true });

            toast.warning(sede.activa ? 'Sede inactivada correctamente' : 'Sede activada correctamente');
        } catch (error) {
            toast.error(`Error al cambiar estado de sede: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (sede: Sede) => {
        setSelectedSede(sede);
        setSedeForm({ 
            nombre: sede.nombre,
            direccion: sede.direccion || '',
            seccionalId: sede.seccional_id?.toString() || ''
        });
        setShowEdit(true);
    };

    const openDelete = (sede: Sede) => {
        setSelectedSede(sede);
        setShowDelete(true);
    };

    // ==================== FILTROS ====================

    const filteredSedes = useMemo(() => {
        return sedes.filter(s =>
            s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [sedes, searchTerm]);

    const totalFilteredSedes = filteredSedes.length;
    const totalPages = getTotalPages(totalFilteredSedes, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages, currentPage), [totalPages, currentPage]);

    const paginatedSedes = useMemo(() => {
        return getPageSlice(filteredSedes, currentPage, PAGE_SIZE);
    }, [filteredSedes, currentPage, PAGE_SIZE]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

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
        searchTerm, setSearchTerm,
        sedes,
        seccionales,
        loading,
        showCreate, setShowCreate,
        showEdit, setShowEdit,
        showDelete, setShowDelete,
        sedeForm, setSedeForm,
        selectedSede, setSelectedSede,
        handleCreate,
        handleEdit,
        handleDelete,
        toggleActiva,
        openEdit,
        openDelete,
        filteredSedes,
        paginatedSedes,
        totalFilteredSedes,
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
        goToNextPageWindow
    };
}
