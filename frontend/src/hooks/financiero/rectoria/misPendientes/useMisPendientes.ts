import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { type SharedFacturaDetail } from '../../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../../share/factura-details-helpers';

export interface FacturaPendienteRectoria extends SharedFacturaDetail {
  id: string;
  nit: string;
}

export function useMisPendientesRectoria() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<FacturaPendienteRectoria | null>(null);

  const mapFactura = (factura: Factura, docs: DocumentoAdjunto[]): FacturaPendienteRectoria => {
    const base = buildSharedFacturaDetail(factura);
    return {
      ...base,
      id: String(factura.id),
      nit: factura.proveedor?.nit ?? '',
      documentos: docs.map((d) => ({
        id: String(d.id),
        nombre: d.nombre_archivo,
        tipo: d.tipo_documento,
        verificado: d.verificado,
        url: d.archivo_url ?? d.url_storage ?? undefined,
      })),
    };
  };

  const cargarFacturas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const lista = await facturasService.getByEstado('Enviada Rectoría');
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
      setError('No se pudieron cargar las facturas pendientes de Rectoría.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  const pendientes = useMemo(() => {
    const mapped = facturas.map((f) => mapFactura(f, docsMap[f.id] ?? []));
    const q = search.trim().toLowerCase();
    if (!q) return mapped;
    return mapped.filter(
      (f) =>
        f.numeroFactura.toLowerCase().includes(q) ||
        f.proveedor.toLowerCase().includes(q) ||
        (f.numeroRadicado || '').toLowerCase().includes(q) ||
        (f.numeroProcesoPago || '').toLowerCase().includes(q)
    );
  }, [facturas, docsMap, search]);

  const totalPendiente = useMemo(() => pendientes.reduce((sum, item) => sum + item.valorTotal, 0), [pendientes]);

  const criticos = useMemo(() => pendientes.filter((p) => (p.diasTranscurridos || 0) > 3).length, [pendientes]);

  const promedioEspera = useMemo(
    () => Math.round(pendientes.reduce((s, p) => s + (p.diasTranscurridos || 0), 0) / Math.max(1, pendientes.length)),
    [pendientes]
  );

  const abrirDetalle = (item: FacturaPendienteRectoria) => {
    setSelected(item);
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
    setSelected,
    abrirDetalle,
    recargar: cargarFacturas,
  };
}
