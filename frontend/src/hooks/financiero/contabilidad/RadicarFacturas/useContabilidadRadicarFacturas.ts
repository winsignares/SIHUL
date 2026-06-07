import { useCallback, useEffect, useMemo, useState } from 'react';
import { documentosService, facturasService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../../share/factura-detail-modal';

const DOCUMENTOS_REQUERIDOS = [
  { tipo: 'Factura', label: 'Factura Original' },
  { tipo: 'Orden de Compra', label: 'Orden de Compra / Contrato' },
  { tipo: 'Certificación Bancaria', label: 'Certificación Bancaria del Proveedor' },
] as const;

const TIPO_DOC_KEYWORDS: Record<string, string[]> = {
  Factura: ['factura'],
  'Orden de Compra': ['orden', 'compra', 'contrato'],
  'Certificación Bancaria': ['certif', 'bancari'],
};

const esDocumentoTipo = (doc: DocumentoAdjunto, tipoRequerido: string): boolean => {
  if (doc.tipo_documento === tipoRequerido) return true;
  const nombreLower = (doc.nombre_archivo || '').toLowerCase();
  const keywords = TIPO_DOC_KEYWORDS[tipoRequerido] || [];
  return keywords.some((kw) => nombreLower.includes(kw));
};

const validarDocumentosCompletos = (docs: DocumentoAdjunto[]): boolean =>
  DOCUMENTOS_REQUERIDOS.every((req) => docs.some((d) => esDocumentoTipo(d, req.tipo)));

const obtenerDocumentosFaltantes = (docs: DocumentoAdjunto[]): string[] =>
  DOCUMENTOS_REQUERIDOS.filter((req) => !docs.some((d) => esDocumentoTipo(d, req.tipo))).map((req) => req.label);

const getSlaLevel = (dias: number): 'verde' | 'amarillo' | 'naranja' | 'vencido' => {
  if (dias >= 17) return 'vencido';
  if (dias >= 12) return 'naranja';
  if (dias >= 8) return 'amarillo';
  return 'verde';
};

const facturaToSharedDetail = (factura: Factura, docs: DocumentoAdjunto[]): SharedFacturaDetail => {
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

export function useContabilidadRadicarFacturas() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'radicar' | 'devolver' | null>(null);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const [modalFactura, setModalFactura] = useState<SharedFacturaDetail | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const cargarFacturas = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [registradas] = await Promise.all([
        facturasService.getByEstado('Registrada'),
      ]);

      const lista = registradas.filter((f) => f.estado === 'Registrada' && f.etapa_actual !== 'Corrección Radicación');

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
      setError('No se pudo cargar las facturas. Verifique la conexión.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  const showToast = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const facturasFiltradas = useMemo(
    () =>
      facturas.filter((f) => {
        const proveedor = f.proveedor?.razon_social ?? '';
        const area = f.departamento?.nombre ?? '';
        if (filtros.numeroFactura && !f.numero_factura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
        if (filtros.proveedor && proveedor !== filtros.proveedor) return false;
        if (filtros.areaSolicitante && area !== filtros.areaSolicitante) return false;
        if (filtros.fechaInicio && f.fecha_recepcion < filtros.fechaInicio) return false;
        if (filtros.fechaFin && f.fecha_recepcion > filtros.fechaFin) return false;
        if (filtros.montoMin && Number(f.valor_total) < Number(filtros.montoMin)) return false;
        if (filtros.montoMax && Number(f.valor_total) > Number(filtros.montoMax)) return false;
        return true;
      }),
    [facturas, filtros]
  );

  // Paginación
  const totalPages = Math.ceil(facturasFiltradas.length / itemsPerPage);
  const facturasPaginadas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return facturasFiltradas.slice(startIndex, endIndex);
  }, [facturasFiltradas, currentPage, itemsPerPage]);

  // Resetear página cuando cambian los filtros
  useEffect(() => {
    setCurrentPage(1);
  }, [filtros.numeroFactura, filtros.proveedor, filtros.estado, filtros.areaSolicitante, filtros.fechaInicio, filtros.fechaFin]);

  const abrirDetalle = (factura: Factura) => {
    const docs = docsMap[factura.id] ?? [];
    setModalFactura(facturaToSharedDetail(factura, docs));
  };

  const iniciarAccion = (factura: Factura, acc: 'radicar' | 'devolver') => {
    setFacturaSeleccionada(factura);
    setAccion(acc);
    setObservaciones('');
  };

  const cancelarAccion = () => {
    setFacturaSeleccionada(null);
    setAccion(null);
    setObservaciones('');
  };

  const confirmarRadicacion = async () => {
    if (!facturaSeleccionada) return;

    const docs = docsMap[facturaSeleccionada.id] ?? [];
    if (!validarDocumentosCompletos(docs)) {
      const faltantes = obtenerDocumentosFaltantes(docs);
      showToast('err', `No se puede radicar. Faltan soportes: ${faltantes.join(', ')}.`);
      return;
    }

    setProcesando(true);
    try {
      await facturasService.radicar(facturaSeleccionada.id, observaciones || undefined);
      showToast('ok', `Factura ${facturaSeleccionada.numero_factura} radicada exitosamente.`);
      cancelarAccion();
      cargarFacturas();
    } catch {
      showToast('err', 'Error al radicar la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const confirmarDevolucion = async () => {
    if (!facturaSeleccionada) return;
    if (!observaciones.trim() || observaciones.trim().length < 10) {
      showToast('err', 'El motivo de devolución es requerido (mínimo 10 caracteres).');
      return;
    }
    setProcesando(true);
    try {
      await facturasService.rechazar(facturaSeleccionada.id, observaciones.trim(), 'funcionario');
      showToast('ok', `Factura ${facturaSeleccionada.numero_factura} devuelta. El funcionario fue notificado.`);
      cancelarAccion();
      cargarFacturas();
    } catch {
      showToast('err', 'Error al devolver la factura. Intente de nuevo.');
    } finally {
      setProcesando(false);
    }
  };

  const dotColor = (nivel: ReturnType<typeof getSlaLevel>) =>
    nivel === 'vencido' ? 'bg-purple-700' : nivel === 'naranja' ? 'bg-orange-500' : nivel === 'amarillo' ? 'bg-yellow-500' : 'bg-green-500';

  const diasColor = (nivel: ReturnType<typeof getSlaLevel>) =>
    nivel === 'vencido' ? 'text-purple-700' : nivel === 'naranja' ? 'text-orange-600' : nivel === 'amarillo' ? 'text-yellow-700' : 'text-green-700';

  return {
    facturas,
    docsMap,
    cargando,
    error,
    facturaSeleccionada,
    accion,
    observaciones,
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
    setFiltros,
    setModalFactura,
    cargarFacturas,
    abrirDetalle,
    iniciarAccion,
    cancelarAccion,
    confirmarRadicacion,
    confirmarDevolucion,
    validarDocumentosCompletos,
    obtenerDocumentosFaltantes,
    getSlaLevel,
    dotColor,
    diasColor,
  };
}
