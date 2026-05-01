import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import type { SharedFacturaDetail } from '../../../../share/factura-detail-modal';

export const SLA_DIAS_CONTABILIDAD = 12;

function nivelRiesgo(dias: number): 'verde' | 'amarillo' | 'naranja' | 'vencido' {
  if (dias > SLA_DIAS_CONTABILIDAD) return 'vencido';
  if (dias >= SLA_DIAS_CONTABILIDAD - 2) return 'naranja';
  if (dias >= SLA_DIAS_CONTABILIDAD - 5) return 'amarillo';
  return 'verde';
}

function accionRequerida(factura: Factura): string {
  if (factura.estado === 'Recibida') return 'Radicar factura y verificar documentos';
  if (factura.estado === 'Radicada') {
    if (factura.dias_transcurridos > SLA_DIAS_CONTABILIDAD) return 'URGENTE: Causar factura VENCIDA';
    return 'Causar factura y asignar cuenta contable';
  }
  return 'Revisar factura';
}

function facturaToDetail(factura: Factura, docs: DocumentoAdjunto[]): SharedFacturaDetail {
  return {
    id: String(factura.id),
    numeroFactura: factura.numero_factura,
    numeroRadicado: factura.numero_radicado,
    proveedor: factura.proveedor?.razon_social ?? '',
    nit: factura.proveedor?.nit ?? '',
    valorTotal: Number(factura.valor_total),
    fechaFactura: factura.fecha_factura,
    fechaRecepcion: factura.fecha_recepcion,
    areaSolicitante: factura.departamento?.nombre ?? '',
    estado: factura.estado,
    diasTranscurridos: factura.dias_transcurridos,
    descripcion: factura.descripcion,
    observaciones: factura.observaciones,
    nivelRiesgo:
      factura.indicador_riesgo === 'vencida'
        ? 'vencido'
        : factura.indicador_riesgo === 'atrasada'
          ? 'rojo'
          : factura.indicador_riesgo === 'atencion'
            ? 'amarillo'
            : 'verde',
    documentos: docs.map((d) => ({
      id: String(d.id),
      nombre: d.nombre_archivo,
      tipo: d.tipo_documento,
      verificado: d.verificado,
      url: d.archivo_url ?? d.url_storage ?? undefined,
    })),
  };
}

export function useContabilidadMisPendientes() {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [docsMap, setDocsMap] = useState<Record<number, DocumentoAdjunto[]>>({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [recibidas, registradas, radicadas] = await Promise.all([
        facturasService.getByEstado('Recibida'),
        facturasService.getByEstado('Registrada'),
        facturasService.getByEstado('Radicada'),
      ]);

      const mergedMap = new Map<number, Factura>();
      [...recibidas, ...registradas, ...radicadas].forEach((f) => {
        mergedMap.set(f.id, f);
      });
      const todas = Array.from(mergedMap.values());

      setFacturas(todas);
      const docsResults = await Promise.all(
        todas.map((f) =>
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
      setError('No se pudo cargar los pendientes. Verifique la conexion.');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const metrics = useMemo(() => {
    const vencidasCount = facturas.filter((f) => f.dias_transcurridos > SLA_DIAS_CONTABILIDAD).length;
    const proximasVencerCount = facturas.filter((f) => {
      const nivel = nivelRiesgo(f.dias_transcurridos);
      return nivel === 'amarillo' || nivel === 'naranja';
    }).length;
    const enTiempoCount = facturas.filter((f) => nivelRiesgo(f.dias_transcurridos) === 'verde').length;

    return { vencidasCount, proximasVencerCount, enTiempoCount };
  }, [facturas]);

  const openDetalle = (factura: Factura) => {
    setFacturaSeleccionada(facturaToDetail(factura, docsMap[factura.id] ?? []));
    setMostrarDetalle(true);
  };

  const closeDetalle = () => {
    setMostrarDetalle(false);
    setFacturaSeleccionada(null);
  };

  return {
    facturas,
    docsMap,
    cargando,
    error,
    facturaSeleccionada,
    mostrarDetalle,
    cargarDatos,
    openDetalle,
    closeDetalle,
    nivelRiesgo,
    accionRequerida,
    SLA_DIAS: SLA_DIAS_CONTABILIDAD,
    ...metrics,
  };
}
