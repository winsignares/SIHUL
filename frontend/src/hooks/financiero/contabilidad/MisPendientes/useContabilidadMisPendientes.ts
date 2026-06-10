import { useCallback, useEffect, useMemo, useState } from 'react';
import { facturasService, documentosService } from '../../../../services/financiero';
import type { DocumentoAdjunto, Factura } from '../../../../models/financiero/core.models';
import { type SharedFacturaDetail } from '../../../../share/factura-detail-modal';
import { buildSharedFacturaDetail } from '../../../../share/factura-details-helpers';

export const SLA_DIAS_CONTABILIDAD = 12;

function nivelRiesgo(dias: number): 'verde' | 'amarillo' | 'naranja' | 'vencido' {
  if (dias > SLA_DIAS_CONTABILIDAD) return 'vencido';
  if (dias >= SLA_DIAS_CONTABILIDAD - 2) return 'naranja';
  if (dias >= SLA_DIAS_CONTABILIDAD - 5) return 'amarillo';
  return 'verde';
}

function accionRequerida(factura: Factura): string {
  if (factura.estado === 'Recibida') return 'Radicar factura y verificar documentos';
  if (factura.estado === 'Registrada') return 'Radicar factura y verificar documentos';
  if (factura.estado === 'Radicada') {
    if (factura.dias_transcurridos > SLA_DIAS_CONTABILIDAD) return 'URGENTE: Causar factura VENCIDA';
    return 'Causar factura y cargar soporte Seven';
  }
  return 'Revisar factura';
}

function facturaToDetail(factura: Factura, docs: DocumentoAdjunto[]): SharedFacturaDetail {
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
      // Solo traer facturas en estado 'Registrada'
      const registradas = await facturasService.getByEstado('Registrada');

      // Mostrar únicamente las que no tienen radicado asignado (pendientes de radicar)
      const pendientes: Factura[] = (registradas as Factura[]).filter(
        (f: Factura) =>
          f.estado === 'Registrada' &&
          (!f.numero_radicado || String(f.numero_radicado).trim() === '') &&
          f.etapa_actual !== 'Corrección Funcionario'
      );

      pendientes.sort((a, b) => (a.fecha_recepcion || '').localeCompare(b.fecha_recepcion || ''));
      setFacturas(pendientes);
      const docsResults = await Promise.all(
        pendientes.map((f) =>
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
    const vencidasCount = facturas.filter((f: Factura) => f.dias_transcurridos > SLA_DIAS_CONTABILIDAD).length;
    const proximasVencerCount = facturas.filter((f: Factura) => {
      const nivel = nivelRiesgo(f.dias_transcurridos);
      return nivel === 'amarillo' || nivel === 'naranja';
    }).length;
    const enTiempoCount = facturas.filter((f: Factura) => nivelRiesgo(f.dias_transcurridos) === 'verde').length;

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
