import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { facturasService } from '../../services';
import type { Factura } from '../../models/core.models';
import type { FuncionarioPendingRow } from '../../models/funcionario';
import type { SharedFacturaDetail } from '../../components/factura-detail-modal';
import { ITEMS_PER_PAGE, mapFacturaToPendingRow } from './misPendientesFuncionarioUtils';

/** Estado y acciones de las facturas pendientes de registro (funcionario). */
export function useMisPendientesFuncionario() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<FuncionarioPendingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<SharedFacturaDetail | null>(null);
  const [rechazarOpen, setRechazarOpen] = useState(false);
  const [rechazarRow, setRechazarRow] = useState<FuncionarioPendingRow | null>(null);
  const [rechazarMotivo, setRechazarMotivo] = useState('');
  const [rechazarError, setRechazarError] = useState<string | null>(null);
  const [rechazarLoading, setRechazarLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [orderBy, setOrderBy] = useState<'oldest' | 'newest'>('oldest');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await facturasService.getPendientes();
        const apiRows = Array.isArray(response) ? response.map(mapFacturaToPendingRow) : [];
        setRows(apiRows);
      } catch {
        setRows([]);
        setLoadError('No fue posible consultar pendientes del usuario.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const vencidas = useMemo(() => rows.filter(r => r.nivelRiesgo === 'vencido').length, [rows]);
  const proximas = useMemo(() => rows.filter(r => r.nivelRiesgo === 'amarillo').length, [rows]);
  const filteredRows = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    return rows
      .filter((row) => {
        if (!normalized) return true;
        return [
          row.numeroFactura,
          row.proveedor,
          row.nit,
          row.tipoDocumento,
          row.observaciones,
          row.areaSolicitante,
        ].some((value) => String(value || '').toLowerCase().includes(normalized));
      })
      .sort((a, b) => {
        const aTime = new Date(a.fechaRecepcion || a.fechaFactura || 0).getTime();
        const bTime = new Date(b.fechaRecepcion || b.fechaFactura || 0).getTime();
        return orderBy === 'oldest' ? aTime - bTime : bTime - aTime;
      });
  }, [orderBy, rows, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ITEMS_PER_PAGE));

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredRows.slice(start, start + ITEMS_PER_PAGE);
  }, [currentPage, filteredRows]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, orderBy]);

  useEffect(() => {
    setCurrentPage((prev) => Math.min(prev, totalPages));
  }, [totalPages]);

  const riskDotClass = (risk: FuncionarioPendingRow['nivelRiesgo']) => {
    if (risk === 'vencido') return 'bg-red-600';
    if (risk === 'amarillo') return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const selectedRow = rows.find((r) => r.id === selectedId) || null;

  useEffect(() => {
    if (!openDetail || !selectedId) return;

    const loadDetalle = async () => {
      setDetailLoading(true);
      try {
        const seguimiento = await facturasService.getSeguimiento(Number(selectedId));
        const factura = seguimiento?.factura as Factura | null;

        if (!factura) {
          setSelectedDetail(null);
          return;
        }

        const contactoProveedor = [factura.proveedor?.email, factura.proveedor?.telefono].filter(Boolean).join(' | ');

        setSelectedDetail({
          id: String(factura.id),
          facturaId: factura.id,
          numeroFactura: factura.numero_factura || `PEND-${factura.id}`,
          proveedor: factura.proveedor?.razon_social || 'Proveedor sin nombre',
          nit: factura.proveedor?.nit || 'Sin NIT',
          contactoProveedor,
          tipoDocumento: factura.tipo_documento,
          valorSubtotal: Number(factura.valor_subtotal || 0),
          valorIva: Number(factura.valor_iva || 0),
          valorTotal: Number(factura.valor_total || 0),
          fechaFactura: factura.fecha_factura || '',
          fechaRecepcion: factura.fecha_recepcion || '',
          areaSolicitante: factura.departamento?.nombre || 'Sin area asignada',
          estado: factura.estado || 'Recibida',
          diasTranscurridos: Math.max(0, Number(factura.dias_transcurridos || 0)),
          numeroRadicado: factura.numero_radicado || undefined,
          numeroProcesoPago: factura.numero_proceso_pago || undefined,
          observaciones: factura.observaciones || undefined,
          cuentaBancariaProveedor: factura.cuenta_bancaria_proveedor || undefined,
          nivelRiesgo:
            Number(factura.dias_transcurridos || 0) > 2
              ? 'vencido'
              : Number(factura.dias_transcurridos || 0) > 0
                ? 'amarillo'
                : 'verde',
          documentos: (factura.documentos || []).map((doc) => ({
            id: String(doc.id),
            tipo: doc.tipo_documento,
            nombre: doc.nombre_archivo,
            fecha: doc.fecha_carga,
            verificado: doc.verificado,
            url: doc.archivo_url || doc.url_storage || undefined,
          })),
        });
      } catch {
        if (selectedRow) {
          setSelectedDetail({
            id: selectedRow.id,
            facturaId: Number(selectedRow.id),
            numeroFactura: selectedRow.numeroFactura || `PEND-${selectedRow.id}`,
            proveedor: selectedRow.proveedor,
            valorTotal: selectedRow.valorTotal,
            fechaFactura: selectedRow.fechaFactura,
            fechaRecepcion: selectedRow.fechaRecepcion,
            areaSolicitante: selectedRow.areaSolicitante,
            estado: 'Recibida',
            diasTranscurridos: selectedRow.dias,
            nit: selectedRow.nit,
            nivelRiesgo:
              selectedRow.nivelRiesgo === 'vencido'
                ? 'vencido'
                : selectedRow.nivelRiesgo === 'amarillo'
                  ? 'amarillo'
                  : 'verde',
          });
        }
      } finally {
        setDetailLoading(false);
      }
    };

    void loadDetalle();
  }, [openDetail, selectedId, selectedRow]);

  const abrirRechazo = (row: FuncionarioPendingRow) => {
    setRechazarRow(row);
    setRechazarMotivo('');
    setRechazarError(null);
    setRechazarOpen(true);
  };

  const confirmarRechazo = async () => {
    if (!rechazarRow) return;

    const motivo = rechazarMotivo.trim();
    if (motivo.length < 10) {
      setRechazarError('Describe el motivo (mínimo 10 caracteres).');
      return;
    }

    setRechazarLoading(true);
    try {
      await facturasService.rechazar(Number(rechazarRow.id), motivo);
      setRows((prev) => prev.filter((row) => row.id !== rechazarRow.id));
      toast.success('Factura rechazada y enviada a corrección del proveedor.');
      setRechazarOpen(false);
      setRechazarRow(null);
      setRechazarMotivo('');
    } catch {
      setRechazarError('No fue posible rechazar la factura. Intenta nuevamente.');
    } finally {
      setRechazarLoading(false);
    }
  };


  return {
    navigate,
    rows,
    setRows,
    loading,
    setLoading,
    loadError,
    setLoadError,
    openDetail,
    setOpenDetail,
    selectedId,
    setSelectedId,
    detailLoading,
    setDetailLoading,
    selectedDetail,
    setSelectedDetail,
    rechazarOpen,
    setRechazarOpen,
    rechazarRow,
    setRechazarRow,
    rechazarMotivo,
    setRechazarMotivo,
    rechazarError,
    setRechazarError,
    rechazarLoading,
    setRechazarLoading,
    searchTerm,
    setSearchTerm,
    orderBy,
    setOrderBy,
    currentPage,
    setCurrentPage,
    vencidas,
    proximas,
    filteredRows,
    totalPages,
    paginatedRows,
    riskDotClass,
    selectedRow,
    abrirRechazo,
    confirmarRechazo,
  };
}
