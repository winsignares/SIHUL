import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  centrosCostoService,
  cuentasContablesService,
  documentosService,
  facturasService,
} from '../../../../services/financiero';
import type { CentroCosto, CuentaContable, DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { buildSharedFacturaDetail, type SharedFacturaDetail } from '../../../../share/factura-detail-modal';

const facturaToDetail = (
  factura: Factura,
  docs: DocumentoAdjunto[]
): SharedFacturaDetail => {
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
  const [cuentasContables, setCuentasContables] = useState<CuentaContable[]>([]);
  const [centrosCosto, setCentrosCosto] = useState<CentroCosto[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'causar' | 'devolver' | null>(null);
  const [cuentaId, setCuentaId] = useState<string>('');
  const [centroId, setCentroId] = useState<string>('');
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [toast, setToast] = useState<{ tipo: 'ok' | 'err'; msg: string } | null>(null);

  const [modalFactura, setModalFactura] = useState<SharedFacturaDetail | null>(null);

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
      const [lista, cuentas, centros] = await Promise.all([
        facturasService.getByEstado('Radicada'),
        cuentasContablesService.getAll(),
        centrosCostoService.getAll(),
      ]);
      setFacturas(lista);
      setCuentasContables(Array.isArray(cuentas) ? cuentas : (cuentas as { results?: CuentaContable[] }).results ?? []);
      setCentrosCosto(Array.isArray(centros) ? centros : (centros as { results?: CentroCosto[] }).results ?? []);
      const docsResults = await Promise.all(lista.map((f) => documentosService.getByFactura(f.id).then((d) => ({ id: f.id, docs: d }))));
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
        if (filtros.numeroFactura && !f.numero_factura.toLowerCase().includes(filtros.numeroFactura.toLowerCase()) && !(f.numero_radicado ?? '').toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
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

  const iniciarAccion = (factura: Factura, acc: 'causar' | 'devolver') => {
    setFacturaSeleccionada(factura);
    setAccion(acc);
    setCuentaId('');
    setCentroId('');
    setObservaciones('');
  };

  const cancelar = () => {
    setFacturaSeleccionada(null);
    setAccion(null);
    setCuentaId('');
    setCentroId('');
    setObservaciones('');
  };

  const confirmarCausacion = async () => {
    if (!facturaSeleccionada) return;
    if (!cuentaId) {
      showToast('err', 'Debe seleccionar una cuenta contable.');
      return;
    }
    setProcesando(true);
    try {
      await facturasService.causar(facturaSeleccionada.id, {
        cuenta_contable_id: Number(cuentaId),
        centro_costo_id: centroId ? Number(centroId) : undefined,
        observaciones: observaciones || undefined,
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
      await facturasService.rechazar(facturaSeleccionada.id, observaciones.trim());
      showToast('ok', `Factura ${facturaSeleccionada.numero_factura} devuelta al funcionario.`);
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

  const getDiasColor = (dias: number) => (dias >= 17 ? 'text-red-600 font-bold' : dias >= 10 ? 'text-orange-600 font-semibold' : 'text-green-700');

  return {
    facturas,
    cuentasContables,
    centrosCosto,
    docsMap,
    cargando,
    error,
    facturaSeleccionada,
    accion,
    cuentaId,
    centroId,
    observaciones,
    procesando,
    toast,
    modalFactura,
    filtros,
    facturasFiltradas,
    setCuentaId,
    setCentroId,
    setObservaciones,
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
