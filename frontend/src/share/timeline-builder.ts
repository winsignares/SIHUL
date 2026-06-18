import type { TimelineEtapa } from './factura-timeline';

export type TimelineBlueprintStep = {
  id: string;
  nombre: string;
  estadoRef: string;
  estadosHistorial?: string[];
  responsable: string;
  diasMaximos: number;
  slaEtapa: string;
};

type SeguimientoHistorialItem = {
  fecha_accion?: string;
  accion?: string;
  estado_anterior?: string;
  estado_nuevo?: string;
  usuario_nombre?: string;
  observacion?: string;
};

export type SeguimientoLike = {
  factura?: { estado?: string };
  historial?: SeguimientoHistorialItem[];
};

export type ParametroSLALike = {
  etapa: string;
  dias_maximos: number;
  activo: boolean;
};

export const TIMELINE_BLUEPRINT: TimelineBlueprintStep[] = [
  { id: '1',   nombre: 'Recepción',                    estadoRef: 'Recibida',              responsable: 'Funcionario',          diasMaximos: 1, slaEtapa: 'Recepción y Registro' },
  { id: '1.5', nombre: 'Registro Completo',             estadoRef: 'Registrada',             responsable: 'Funcionario',          diasMaximos: 1, slaEtapa: 'Recepción y Registro' },
  { id: '2',   nombre: 'Radicación',                   estadoRef: 'Radicada',               responsable: 'Contabilidad',         diasMaximos: 3, slaEtapa: 'Radicación' },
  { id: '4',   nombre: 'Alistamiento',                 estadoRef: 'Alistada',               responsable: 'Tesorería',            diasMaximos: 3, slaEtapa: 'Alistamiento' },
  { id: '5',   nombre: 'Control Previo',                estadoRef: 'Aprobada Auditoría',      responsable: 'Auditoría',            diasMaximos: 4, slaEtapa: 'Control Previo' },
  { id: '5.5', nombre: 'Envío a Dirección Financiera', estadoRef: 'Revisada Dir. Financiera', responsable: 'Tesorería',            diasMaximos: 1, slaEtapa: 'Envío a Dirección Financiera' },
  { id: '6',   nombre: 'Cargue',                       estadoRef: 'Cargada',                 responsable: 'Dirección Financiera', diasMaximos: 2, slaEtapa: 'Cargue Formal' },
  { id: '8',   nombre: 'Envío a Rectoría',             estadoRef: 'Enviada Rectoría',        responsable: 'Dirección Financiera', diasMaximos: 1, slaEtapa: 'Envío a Rectoría' },
  { id: '10',  nombre: 'Factura Pagada',               estadoRef: 'Pagada',                 responsable: 'Tesorería',            diasMaximos: 1, slaEtapa: 'Aplicación de Pago' },
];

function findLatestHistorialForStep(
  historial: SeguimientoHistorialItem[],
  step: TimelineBlueprintStep
): SeguimientoHistorialItem | undefined {
  const estados = step.id === '10'
    ? [step.estadoRef, 'Pago Aplicado', 'Pagada']
    : [step.estadoRef, ...(step.estadosHistorial || [])];
  const matches = historial.filter((item) => item.estado_nuevo && estados.includes(item.estado_nuevo));
  return matches.length > 0 ? matches[matches.length - 1] : undefined;
}

export function buildTimelineFromSeguimiento(
  seguimiento: SeguimientoLike,
  fallbackEstado: string,
  slaParams: ParametroSLALike[] = []
): TimelineEtapa[] {
  const historial = Array.isArray(seguimiento?.historial) ? [...seguimiento.historial] : [];
  historial.sort((a, b) => new Date(a.fecha_accion || 0).getTime() - new Date(b.fecha_accion || 0).getTime());

  const estadoActual = seguimiento?.factura?.estado || fallbackEstado;
  const estadoIndex = TIMELINE_BLUEPRINT.findIndex((step) =>
    step.estadoRef === estadoActual || (step.id === '10' && ['Pago Aplicado', 'Pagada'].includes(estadoActual))
  );

  const isRejectedFlow = ['Rechazada', 'Rechazada Auditoría', 'Devuelta', 'Detenida', 'Anulada'].includes(estadoActual);

  const slaMap = new Map<string, number>(
    slaParams.filter((p) => p.activo).map((p) => [p.etapa, p.dias_maximos])
  );

  return TIMELINE_BLUEPRINT.map((step, index) => {
    const matchHistorial = findLatestHistorialForStep(historial, step);
    let estado: TimelineEtapa['estado'];

    if (isRejectedFlow && index === Math.max(estadoIndex, 0)) {
      estado = 'rechazado';
    } else if (estadoIndex >= 0 && index <= estadoIndex) {
      estado = 'completado';
    } else if (estadoIndex >= 0 && index === estadoIndex + 1) {
      estado = 'en-proceso';
    } else {
      estado = 'pendiente';
    }

    const diasMaximos = slaMap.get(step.slaEtapa) ?? step.diasMaximos;

    return {
      id: step.id,
      nombre: step.nombre,
      estado,
      fechaFin: matchHistorial?.fecha_accion,
      usuarioResponsable: matchHistorial?.usuario_nombre || step.responsable,
      observaciones: matchHistorial?.observacion || matchHistorial?.accion || undefined,
      diasMaximos,
    };
  });
}
