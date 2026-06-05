import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../../share/factura-detail-modal';

export interface FacturaAutorizacion extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaEnvioRectoria: string;
  cuentaContable: string;
  centroCosto: string;
}

export function useAutorizarPagos() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

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

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaAutorizacion | null>(null);
  const [facturaDetalle, setFacturaDetalle] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDialogAccion, setMostrarDialogAccion] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [accion, setAccion] = useState<'aprobar' | 'rechazar'>('aprobar');
  const [motivo, setMotivo] = useState('');

  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const showToast = (tipo: 'ok' | 'err', msg: string) => {
    setToast({ tipo, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const mapFactura = (factura: Factura, docs: DocumentoAdjunto[]): FacturaAutorizacion => {
    const base = buildSharedFacturaDetail(factura);
    return {
      ...base,
      id: String(factura.id),
      nit: factura.proveedor?.nit ?? '',
      fechaEnvioRectoria: factura.fecha_recepcion ?? factura.fecha_creacion ?? '',
      cuentaContable: factura.cuenta_contable ? `${factura.cuenta_contable.codigo} - ${factura.cuenta_contable.nombre}` : '',
      centroCosto: factura.centro_costo ? `${factura.centro_costo.codigo} - ${factura.centro_costo.nombre}` : '',
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
      setError('No se pudieron cargar los pagos pendientes de autorización.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  const facturasFiltradas = useMemo(() => {
    return facturas
      .map((f) => mapFactura(f, docsMap[f.id] ?? []))
      .filter((factura) => {
        if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
        if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) return false;
        if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
        if (filtros.fechaInicio && factura.fechaEnvioRectoria < filtros.fechaInicio) return false;
        if (filtros.fechaFin && factura.fechaEnvioRectoria > filtros.fechaFin) return false;
        if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
        if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
        return true;
      });
  }, [facturas, docsMap, filtros]);

  const abrirDialog = (factura: FacturaAutorizacion, accionSeleccionada: 'aprobar' | 'rechazar') => {
    setFacturaSeleccionada(factura);
    setAccion(accionSeleccionada);
    setMotivo('');
    setMostrarDialogAccion(true);
  };

  const handleVerDetalle = (factura: FacturaAutorizacion) => {
    setFacturaDetalle(factura);
    setMostrarDialogDetalle(true);
  };

  const procesarAutorizacion = async () => {
    if (!facturaSeleccionada?.facturaId) return;

    if (accion === 'rechazar' && (!motivo.trim() || motivo.trim().length < 10)) {
      showToast('err', 'Debe registrar un motivo de rechazo (mínimo 10 caracteres).');
      return;
    }

    setIsProcessing(true);
    try {
      if (accion === 'aprobar') {
        await facturasService.autorizarRectoria(facturaSeleccionada.facturaId, motivo.trim() || undefined);
        showToast('ok', `Pago autorizado por Rectoría: ${facturaSeleccionada.numeroFactura}.`);
      } else {
        await facturasService.rechazarRectoria(facturaSeleccionada.facturaId, motivo.trim());
        showToast('ok', `Pago rechazado y devuelto a Dirección Financiera: ${facturaSeleccionada.numeroFactura}.`);
      }

      setMostrarDialogAccion(false);
      setFacturaSeleccionada(null);
      setMotivo('');
      await cargarFacturas();
    } catch {
      showToast('err', 'No fue posible procesar la decisión en Rectoría.');
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    filtros,
    facturasFiltradas,
    facturaSeleccionada,
    facturaDetalle,
    mostrarDialogAccion,
    mostrarDialogDetalle,
    accion,
    motivo,
    isProcessing,
    cargando,
    error,
    toast,
    setFiltros,
    setMostrarDialogAccion,
    setMostrarDialogDetalle,
    setMotivo,
    abrirDialog,
    handleVerDetalle,
    procesarAutorizacion,
    cargarFacturas,
  };
}
