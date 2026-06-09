import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../../share/factura-detail-modal';

export interface FacturaPendiente extends SharedFacturaDetail {
  id: string;
  totalPendiente?: number;
}

export function useMisPendientes() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<FacturaPendiente | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const lista = await facturasService.getByEstado('Revisada Dir. Financiera');
      setFacturas(lista);

      const docsResults = await Promise.all(
        lista.map((f) =>
          documentosService
            .getByFactura(f.id)
            .then((d) => ({ id: f.id, docs: d }))
            .catch(() => ({ id: f.id, docs: [] as DocumentoAdjunto[] }))
        )
      );
      const map: Record<number, DocumentoAdjunto[]> = {};
      docsResults.forEach(({ id, docs }) => {
        map[id] = docs;
      });
      setDocsMap(map);
    } catch {
      setError('No se pudo cargar las facturas pendientes. Verifique la conexion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pendientes = useMemo(() => {
    const mapped = facturas.map((factura) => {
      const docs = docsMap[factura.id] ?? [];
      return {
        ...buildSharedFacturaDetail(factura),
        id: String(factura.id),
        documentos: docs.map((d) => ({
          id: String(d.id),
          nombre: d.nombre_archivo,
          tipo: d.tipo_documento,
          verificado: d.verificado,
          url: d.archivo_url ?? d.url_storage ?? undefined,
        })),
      };
    });

    if (!search.trim()) return mapped;

    const term = search.toLowerCase();
    return mapped.filter((item) =>
      item.numeroFactura.toLowerCase().includes(term) ||
      item.proveedor.toLowerCase().includes(term) ||
      (item.numeroRadicado || '').toLowerCase().includes(term)
    );
  }, [facturas, docsMap, search]);

  const totalPendiente = useMemo(
    () => pendientes.reduce((acc, item) => acc + item.valorTotal, 0),
    [pendientes]
  );

  const criticos = useMemo(
    () => pendientes.filter((item) => (item.diasTranscurridos || 0) > 3).length,
    [pendientes]
  );

  const promedioEspera = useMemo(() => {
    if (pendientes.length === 0) return 0;
    const totalDias = pendientes.reduce((acc, item) => acc + (item.diasTranscurridos || 0), 0);
    return Math.round(totalDias / pendientes.length);
  }, [pendientes]);

  const abrirDetalle = (factura: FacturaPendiente) => {
    setSelected(factura);
    setDetailOpen(true);
  };

  return {
    pendientes,
    cargando,
    error,
    search,
    detailOpen,
    selected,
    totalPendiente,
    criticos,
    promedioEspera,
    setSearch,
    setDetailOpen,
    abrirDetalle,
    recargar: cargar,
  };
}
