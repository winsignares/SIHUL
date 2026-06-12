import { useCallback, useEffect, useMemo, useState } from 'react';
import { documentosService, facturasService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { type SharedFacturaDetail } from '../../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../../share/factura-details-helpers';

const facturaToDetail = (factura: Factura, docs: DocumentoAdjunto[]): SharedFacturaDetail => {
  const base = buildSharedFacturaDetail(factura);
  return {
    ...base,
    documentos: docs.map((d) => ({
      id: String(d.id),
      nombre: d.nombre_archivo,
      tipo: d.tipo_documento,
      verificado: d.verificado,
      url: d.archivo_url ?? d.url_storage ?? undefined,
    })),
  };
};

export function useContabilidadCausarFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'causar' | 'devolver' | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [soporteCausacion, setSoporteCausacion] = useState<File | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const [modalFactura, setModalFactura] = useState<SharedFacturaDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  });

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [lista] = await Promise.all([facturasService.getByEstado('Radicada')]);
      const filtradas = lista
        .filter((f) => f.etapa_actual !== 'Corrección Radicación')
        .sort((a, b) => (a.fecha_radicacion || '').localeCompare(b.fecha_radicacion || ''));

      setFacturas(filtradas);

      const docsResults = await Promise.all(
        filtradas.map((f) =>
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
      setError('No se pudo cargar las facturas. Verifique la conexion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const showToast = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const facturasFiltradas = useMemo(
    () =>
      facturas.filter((f) => {
        const proveedor = f.proveedor?.razon_social ?? '';
        const area = f.departamento?.nombre ?? '';
        if (
          filtros.numeroFactura &&
          !f.numero_factura.toLowerCase().includes(filtros.numeroFactura.toLowerCase()) &&
          !(f.numero_radicado ?? '').toLowerCase().includes(filtros.numeroFactura.toLowerCase())
        ) {
          return false;
        }
        if (filtros.proveedor && proveedor !== filtros.proveedor) return false;
        if (filtros.areaSolicitante && area !== filtros.areaSolicitante) return false;
        if (filtros.fechaInicio && f.fecha_radicacion && f.fecha_radicacion < filtros.fechaInicio) return false;
        if (filtros.fechaFin && f.fecha_radicacion && f.fecha_radicacion > filtros.fechaFin) return false;
        if (filtros.montoMin && Number(f.valor_total) < Number(filtros.montoMin)) return false;
        if (filtros.montoMax && Number(f.valor_total) > Number(filtros.montoMax)) return false;
        return true;
      }),
    [facturas, filtros]
  );

  const totalPages = Math.ceil(facturasFiltradas.length / itemsPerPage);
  const facturasPaginadas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return facturasFiltradas.slice(startIndex, endIndex);
  }, [facturasFiltradas, currentPage, itemsPerPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filtros.numeroFactura, filtros.proveedor, filtros.estado, filtros.areaSolicitante, filtros.fechaInicio, filtros.fechaFin]);

  const iniciarAccion = (factura: Factura, acc: 'causar' | 'devolver') => {
    setFacturaSeleccionada(factura);
    setAccion(acc);
    setObservaciones('');
    setSoporteCausacion(null);
  };

  const cancelar = () => {
    setFacturaSeleccionada(null);
    setAccion(null);
    setObservaciones('');
    setSoporteCausacion(null);
  };

  const confirmarCausacion = async () => {
    if (!facturaSeleccionada) return;
    if (!soporteCausacion) {
      showToast('err', 'Debe adjuntar el soporte PDF de causacion en Seven.');
      return;
    }

    if (!observaciones.trim() || observaciones.trim().length < 5) {
      showToast('err', 'Describe brevemente la causación (mínimo 5 caracteres).');
      return;
    }

    setProcesando(true);
    try {
      await facturasService.causar(facturaSeleccionada.id, {
        observaciones: observaciones.trim(),
        soporte_causacion: soporteCausacion,
      });
      showToast('ok', `Factura ${facturaSeleccionada.numero_factura} causada exitosamente.`);
      cancelar();
      cargarDatos();
    } catch {
      showToast('err', 'Error al causar la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const confirmarDevolucion = async () => {
    if (!facturaSeleccionada) return;
    if (!observaciones.trim() || observaciones.trim().length < 10) {
      showToast('err', 'El motivo de devolucion es requerido (minimo 10 caracteres).');
      return;
    }

    setProcesando(true);
    try {
      await facturasService.rechazar(facturaSeleccionada.id, observaciones.trim(), 'radicacion');
      showToast('ok', `Factura ${facturaSeleccionada.numero_factura} devuelta a radicacion.`);
      cancelar();
      cargarDatos();
    } catch {
      showToast('err', 'Error al devolver la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const openDetalle = (factura: Factura) => {
    setModalFactura(facturaToDetail(factura, docsMap[factura.id] ?? []));
  };

  const getDiasColor = (dias: number) =>
    dias >= 17 ? 'text-red-600 font-bold' : dias >= 10 ? 'text-orange-600 font-semibold' : 'text-green-700';

  return {
    facturas,
    docsMap,
    cargando,
    error,
    facturaSeleccionada,
    accion,
    observaciones,
    soporteCausacion,
    procesando,
    toast,
    modalFactura,
    filtros,
    facturasFiltradas,
    facturasPaginadas,
    currentPage,
    setCurrentPage,
    totalPages,
    itemsPerPage,
    setObservaciones,
    setSoporteCausacion,
    setModalFactura,
    setFiltros,
    cargarDatos,
    iniciarAccion,
    cancelar,
    confirmarCausacion,
    confirmarDevolucion,
    openDetalle,
    getDiasColor,
  };
}
