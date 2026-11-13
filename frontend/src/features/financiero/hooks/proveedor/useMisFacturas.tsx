import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../../context/AuthContext';
import { documentosService, proveedoresService } from '../../services';
import type { Factura } from '../../models/core.models';
import type { MisFacturasProps } from '../../models/proveedor';
import { toList, REJECTED_STATES, type FacturaDocumentoAdjunto } from './misFacturasUtils';

/** Estado y acciones de las facturas del proveedor. */
export function useMisFacturas({ miProveedor }: MisFacturasProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [documentosOpen, setDocumentosOpen] = useState(false);
  const [documentosLoading, setDocumentosLoading] = useState(false);
  const [documentosError, setDocumentosError] = useState<string | null>(null);
  const [selectedFacturaNumero, setSelectedFacturaNumero] = useState('');
  const [documentosProveedor, setDocumentosProveedor] = useState<FacturaDocumentoAdjunto[]>([]);
  const ITEMS_PER_PAGE = 5;

  const loadFacturas = useCallback(async (silent = false) => {
    if (!miProveedor) return;
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const resp = await proveedoresService.getMisFacturas(miProveedor.id);
      setFacturas(toList<Factura>(resp));
    } catch {
      if (!silent) setError('No se pudieron cargar tus facturas. Intenta nuevamente.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [miProveedor]);

  useEffect(() => {
    void loadFacturas();
  }, [loadFacturas]);

  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') void loadFacturas(true);
    };
    const intervalId = window.setInterval(refreshWhenVisible, 30000);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    window.addEventListener('focus', refreshWhenVisible);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
      window.removeEventListener('focus', refreshWhenVisible);
    };
  }, [loadFacturas]);

  // Sort by most recent date (recepcion or factura) and filter
  const sortedFilteredFacturas = useMemo(() => {
    const filtered = facturas.filter(f => {
      const matchSearch =
        !search ||
        f.numero_factura.toLowerCase().includes(search.toLowerCase()) ||
        (f.numero_radicado || '').toLowerCase().includes(search.toLowerCase()) ||
        (f.identificacion_factura || '').toLowerCase().includes(search.toLowerCase());
      const matchEstado = !estadoFiltro || (estadoFiltro === '__rechazadas' ? REJECTED_STATES.includes(f.estado) : f.estado === estadoFiltro);
      return matchSearch && matchEstado;
    });
    // Sort by fecha_recepcion (most recent first), fallback to fecha_factura
    return filtered.sort((a: Factura, b: Factura) => {
      const dateA = new Date(a.fecha_recepcion || a.fecha_factura || 0).getTime();
      const dateB = new Date(b.fecha_recepcion || b.fecha_factura || 0).getTime();
      return dateB - dateA;
    });
  }, [estadoFiltro, facturas, search]);

  // Pagination logic
  const totalPages = Math.ceil(sortedFilteredFacturas.length / ITEMS_PER_PAGE);
  const paginatedFacturas = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedFilteredFacturas.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedFilteredFacturas, currentPage]);

  const paginationItems = useMemo<(number | 'ellipsis')[]>(() => {
    if (totalPages <= 1) return [1];

    const baseSet = new Set<number>();
    baseSet.add(1);
    baseSet.add(2);
    baseSet.add(totalPages);
    baseSet.add(totalPages - 1);
    baseSet.add(currentPage);
    baseSet.add(currentPage - 1);
    baseSet.add(currentPage + 1);

    const orderedPages = [...baseSet]
      .filter((page) => page >= 1 && page <= totalPages)
      .sort((a, b) => a - b);

    const items: (number | 'ellipsis')[] = [];
    for (let i = 0; i < orderedPages.length; i += 1) {
      const page = orderedPages[i];
      items.push(page);
      const next = orderedPages[i + 1];
      if (next && next - page > 1) {
        items.push('ellipsis');
      }
    }

    return items;
  }, [currentPage, totalPages]);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, estadoFiltro]);

  const openProviderDocuments = useCallback(
    async (factura: Factura) => {
      setDocumentosOpen(true);
      setSelectedFacturaNumero(factura.numero_factura || `FAC-${factura.id}`);
      setDocumentosLoading(true);
      setDocumentosError(null);
      setDocumentosProveedor([]);

      try {
        const response = await documentosService.getByFactura(factura.id);
        const documentos = response as FacturaDocumentoAdjunto[];
        const documentosDelProveedor = documentos.filter((doc) => {
          const uploaderId =
            typeof doc.cargado_por === 'number'
              ? doc.cargado_por
              : (doc.cargado_por?.id ?? null);

          if (user?.id && uploaderId) {
            return uploaderId === user.id;
          }

          return uploaderId === null || uploaderId === undefined;
        });

        setDocumentosProveedor(documentosDelProveedor);
      } catch {
        setDocumentosError('No fue posible cargar los documentos del proveedor para esta factura.');
      } finally {
        setDocumentosLoading(false);
      }
    },
    [user?.id]
  );

  const estados = useMemo(() => {
    const base = ['Recibida', '__rechazadas'];
    const dynamic = facturas
      .map(f => f.estado)
      .filter((estado) => estado && !REJECTED_STATES.includes(estado) && estado !== 'Recibida');
    return [...base, ...Array.from(new Set(dynamic))];
  }, [facturas]);

  return {
    navigate,
    user,
    facturas,
    setFacturas,
    loading,
    setLoading,
    error,
    setError,
    search,
    setSearch,
    estadoFiltro,
    setEstadoFiltro,
    currentPage,
    setCurrentPage,
    documentosOpen,
    setDocumentosOpen,
    documentosLoading,
    setDocumentosLoading,
    documentosError,
    setDocumentosError,
    selectedFacturaNumero,
    setSelectedFacturaNumero,
    documentosProveedor,
    setDocumentosProveedor,
    ITEMS_PER_PAGE,
    loadFacturas,
    sortedFilteredFacturas,
    totalPages,
    paginatedFacturas,
    paginationItems,
    openProviderDocuments,
    estados,
    miProveedor,
  };
}
