import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { recursoService, type Recurso } from '../../services/recursos/recursoAPI';
import { getPageNumbers, getPageSlice, getTotalPages, normalizePage, PAGE_SIZE_DEFAULT } from './paginacion';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const PAGE_SIZE = PAGE_SIZE_DEFAULT;
const GESTION_RECURSOS_CACHE_KEY = 'gestion-academica-recursos';

export function useGestionRecursos() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const [showCrearRecursoModal, setShowCrearRecursoModal] = useState(false);
  const [creatingRecurso, setCreatingRecurso] = useState(false);
  const [nuevoRecurso, setNuevoRecurso] = useState({
    nombre: '',
    descripcion: ''
  });

  const loadRecursos = async ({ force = false }: { force?: boolean } = {}) => {
    try {
      const activeToken = localStorage.getItem('auth_token');
      const cachedRecursos = force ? null : getSessionCacheData<Recurso[]>(GESTION_RECURSOS_CACHE_KEY, activeToken);

      if (cachedRecursos) {
        setRecursos(cachedRecursos);
        return;
      }

      setLoading(true);
      const response = await recursoService.listarRecursos();
      setRecursos(response.recursos || []);
      setSessionCacheData(GESTION_RECURSOS_CACHE_KEY, activeToken, response.recursos || []);
    } catch (error) {
      toast.error(`Error al cargar recursos: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      setRecursos([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecursos();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const recursosFiltrados = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) {
      return recursos;
    }

    return recursos.filter((recurso) =>
      (recurso.nombre || '').toLowerCase().includes(term)
    );
  }, [recursos, searchTerm]);

  const totalRecursos = recursosFiltrados.length;
  const totalPages = getTotalPages(totalRecursos, PAGE_SIZE);
  const pageNumbers = useMemo(() => getPageNumbers(totalPages), [totalPages]);

  const paginaActualRecursos = useMemo(() => {
    return getPageSlice(recursosFiltrados, currentPage, PAGE_SIZE);
  }, [currentPage, recursosFiltrados]);

  const abrirCrearRecursoModal = () => {
    setNuevoRecurso({ nombre: '', descripcion: '' });
    setShowCrearRecursoModal(true);
  };

  const cerrarCrearRecursoModal = () => {
    if (creatingRecurso) return;
    setShowCrearRecursoModal(false);
  };

  const actualizarNuevoRecurso = (campo: 'nombre' | 'descripcion', valor: string) => {
    setNuevoRecurso((prev) => ({ ...prev, [campo]: valor }));
  };

  const crearNuevoRecurso = async () => {
    const nombre = nuevoRecurso.nombre.trim();
    const descripcion = nuevoRecurso.descripcion.trim();

    if (!nombre) {
      toast.error('El nombre del recurso es obligatorio');
      return;
    }

    try {
      setCreatingRecurso(true);
      await recursoService.crearRecurso({
        nombre,
        descripcion: descripcion || undefined
      });

      toast.success('Recurso creado correctamente');
      setShowCrearRecursoModal(false);
      setNuevoRecurso({ nombre: '', descripcion: '' });
      await loadRecursos({ force: true });
      setCurrentPage(1);
    } catch (error) {
      toast.error(`Error al crear recurso: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    } finally {
      setCreatingRecurso(false);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(normalizePage(page, totalPages));
  };

  const goToNextPage = () => {
    goToPage(currentPage + 1);
  };

  const goToPrevPage = () => {
    goToPage(currentPage - 1);
  };

  return {
    recursos,
    searchTerm,
    setSearchTerm,
    loading,
    loadRecursos,
    recursosFiltrados,
    paginaActualRecursos,
    totalRecursos,
    currentPage,
    totalPages,
    pageNumbers,
    pageSize: PAGE_SIZE,
    goToPage,
    goToNextPage,
    goToPrevPage,
    showCrearRecursoModal,
    setShowCrearRecursoModal,
    abrirCrearRecursoModal,
    cerrarCrearRecursoModal,
    creatingRecurso,
    nuevoRecurso,
    actualizarNuevoRecurso,
    crearNuevoRecurso
  };
}
