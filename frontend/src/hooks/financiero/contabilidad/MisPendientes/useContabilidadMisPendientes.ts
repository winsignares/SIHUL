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
  const etapa = (factura.etapa_actual || '').trim();

  switch (etapa) {
    case 'Recepción y Registro':    return 'Registrar y radicar factura';
    case 'Radicación':              return 'Causar factura y cargar soporte Seven';
    case 'Causación':               return 'Auditoría: Causación en proceso';
    case 'Cargue Formal':           return 'Auditoría: Cargue formal en proceso';
    case 'Autorización Rectoría':   return 'Auditoría: Pendiente autorización Rectoría';
    case 'Control Previo':          return 'Auditoría: Control previo en curso';
    case 'Alistamiento':            return 'Tesorería: Factura en alistamiento de pago';
    case 'Control de Pago Bancario': return 'Tesorería: Control de pago bancario';
    case 'Tesorería - Ajustes internos': return 'Tesorería: Ajustes internos en proceso';
    case 'Envío a Dirección Financiera': return 'Dirección Financiera: Revisión pendiente';
    case 'Corrección Dirección Financiera': return 'Dirección Financiera: Corrección requerida';
    case 'Pago Aplicado':           return 'Pago aplicado — en seguimiento';
  }

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
  const [orden, setOrden] = useState<'recientes' | 'antiguos'>('antiguos');

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const registradas = await facturasService.getByEstado('Registrada');

      const pendientes: Factura[] = (registradas as Factura[]).filter(
        (f: Factura) => f.etapa_actual !== 'Corrección Funcionario'
      );

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

  const facturasSorted = useMemo(() => {
    return [...facturas].sort((a, b) => {
      const cmp = (a.fecha_recepcion || '').localeCompare(b.fecha_recepcion || '');
      return orden === 'antiguos' ? cmp : -cmp;
    });
  }, [facturas, orden]);

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
    facturas: facturasSorted,
    docsMap,
    orden,
    setOrden,
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
