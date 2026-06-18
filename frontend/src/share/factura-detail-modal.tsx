import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { FileText, Clock, DollarSign, Building, MapPin, Hash, CalendarDays, Paperclip, Eye, Download, ShieldCheck, CheckCircle2, AlertTriangle } from 'lucide-react';
import FacturaTimeline, { type TimelineEtapa } from './factura-timeline';
import { buildTimelineFromSeguimiento } from './timeline-builder';
import { displayDate, displayRadicado, displayText } from './field-placeholders';
import { facturasService, documentosService, parametrosSlaService } from '../services/financiero';
import { mapFacturaDetail } from './factura-details-helpers';
import { parseFacturaDescripcion } from './factura-description';
import { openDocumentosConsolidados, downloadDocumentoIndividual } from './documentos-consolidados';
import type { ItemFactura } from '../models/financiero/core.models';
import { useAuth } from '../context/AuthContext';
import { normalizeFinancialText, resolveCanonicalFinancialRole } from '../context/financialRoleUtils';

type SharedFacturaDocumento = {
  id?: string;
  nombre: string;
  tipo: string;
  fecha?: string;
  verificado?: boolean;
  url?: string | null;
};

export interface SharedFacturaDetail {
  id?: string;
  facturaId?: number;
  numeroFactura: string;
  proveedor: string;
  valorTotal: number;
  fechaFactura?: string;
  fechaRecepcion?: string;
  areaSolicitante?: string;
  estado: string;
  diasTranscurridos?: number;
  slaObjetivoDias?: number | null;
  numeroRadicado?: string;
  numeroProcesoPago?: string;
  numeroOperacionContable?: string;
  consecutivoOperacion?: string;
  descripcion?: string;
  observaciones?: string;
  identificacionFactura?: string;
  items?: ItemFactura[];
  tipoDocumento?: string;
  valorSubtotal?: number;
  valorIva?: number;
  fechaRadicacion?: string;
  fechaCausacion?: string;
  fechaAlistamiento?: string;
  fechaAprobacionAuditoria?: string;
  fechaCargue?: string;
  fechaAutorizacion?: string;
  fechaPagoAplicado?: string;
  fechaComprobante?: string;
  cuentaBancariaProveedor?: string;
  contactoProveedor?: string;
  nivelRiesgo?: 'verde' | 'amarillo' | 'rojo' | 'vencido';
  nit?: string;
  cuentaContable?: string;
  centroCosto?: string;
  documentos?: SharedFacturaDocumento[];
  etapasTimeline?: TimelineEtapa[];
  auditoriaView?: boolean;
  auditoriaNotas?: string;
}

const formatMoney = (val: number) =>
  `$${Number(val || 0).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

function StructuredItemsList({ items }: { items: ItemFactura[] }) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={item.id ?? idx} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
              {item.orden ?? idx + 1}
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold text-slate-800">{item.descripcion}</p>
              <p className="text-sm text-slate-500">
                {item.cantidad} x {formatMoney(item.valor_unitario)} | IVA {item.porcentaje_iva}%
              </p>
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-3 gap-2 text-sm min-w-[220px]">
              {[
                { key: 'subtotal', label: 'Subtotal', value: formatMoney(item.valor_subtotal) },
                { key: 'iva', label: `IVA / INC ${item.porcentaje_iva}%`, value: formatMoney(item.valor_iva) },
                { key: 'total', label: 'Total', value: formatMoney(item.valor_total) },
              ].map((metric) => (
                <div
                  key={metric.key}
                  className={`rounded-xl border px-3 py-2 text-right ${
                    metric.key === 'total'
                      ? 'bg-purple-50 border-purple-200 text-purple-700'
                      : 'bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <p className={`text-[11px] uppercase tracking-wide ${metric.key === 'total' ? 'text-purple-700' : 'text-slate-500'}`}>
                    {metric.label}
                  </p>
                  <p className={`font-semibold ${metric.key === 'total' ? 'text-lg' : ''}`}>
                    {metric.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SharedServiciosList({ items }: { items: ReturnType<typeof parseFacturaDescripcion>['items'] }) {
  return (
    <div className="space-y-3">
      {items.map((item, idx) => (
        <div key={`${item.rawLine}-${idx}`} className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-semibold">
              {item.index ?? idx + 1}
            </div>
            <div className="flex-1 min-w-[200px]">
              <p className="font-semibold text-slate-800">{item.servicio}</p>
              {(item.cantidad || item.unitario) && (
                <p className="text-sm text-slate-500">
                  {item.cantidad ? `${item.cantidad} x ` : ''}{item.unitario || 'Valor no especificado'}
                </p>
              )}
            </div>
            <div className="flex-1 grid grid-cols-2 lg:grid-cols-5 gap-2 text-sm min-w-[220px]">
              {[{ key: 'cantidad', label: 'Cantidad', value: item.cantidad || 'Sin dato' },
                { key: 'unitario', label: 'Valor unitario', value: item.unitario || 'Sin dato' },
                { key: 'subtotal', label: 'Subtotal', value: item.subtotal },
                { key: 'iva', label: `Tasa ${item.ivaPorcentaje ? `${item.ivaPorcentaje}%` : ''}`.trim(), value: item.ivaValor },
                { key: 'total', label: 'Total', value: item.total }]
                .filter((metric) => metric.value)
                .map((metric) => (
                  <div
                    key={metric.key}
                    className={`rounded-xl border px-3 py-2 text-right ${
                      metric.key === 'total'
                        ? 'bg-purple-50 border-purple-200 text-purple-700'
                        : metric.key === 'cantidad' || metric.key === 'unitario'
                          ? 'bg-white border-slate-200 text-slate-700'
                          : 'bg-slate-100 border-slate-200 text-slate-800'
                    }`}
                  >
                    <p className={`text-[11px] uppercase tracking-wide ${metric.key === 'total' ? 'text-purple-700' : 'text-slate-500'}`}>
                      {metric.label}
                    </p>
                    <p className={`font-semibold ${metric.key === 'total' ? 'text-lg' : ''}`}>
                      {metric.value}
                    </p>
                  </div>
                ))}
            </div>
          </div>
          {item.extraInfo && item.extraInfo.length > 0 && (
            <p className="mt-2 text-sm text-slate-500 whitespace-pre-line">
              {item.extraInfo.join('\n')}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

interface FacturaDetailModalProps {
  factura: SharedFacturaDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

function canViewSensitiveDocuments(roleName?: string, userName?: string, components?: { nombre: string }[]) {
  const role = resolveCanonicalFinancialRole({ roleName, userName, components });
  return role === 'auditoria' || role === 'direccion_financiera';
}

function isSensitiveDocument(doc: SharedFacturaDocumento) {
  const tipo = normalizeFinancialText(doc.tipo);
  const nombre = normalizeFinancialText(doc.nombre);
  return tipo === 'archivo plano bancario' || tipo === 'soporte causacion seven' || nombre.includes('archivo plano');
}

function buildDefaultTimeline(factura: SharedFacturaDetail): TimelineEtapa[] {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const mapEstado: Record<string, string> = {
    recibida: 'Recibida',
    registrada: 'Registrada',
    radicada: 'Radicada',
    causada: 'Radicada',
    alistada: 'Alistada',
    'aprobada auditoria': 'Aprobada Auditoría',
    'rechazada auditoria': 'Devuelta',
    'enviado a direccion financiera': 'Revisada Dir. Financiera',
    'enviado a dir. financiera': 'Revisada Dir. Financiera',
    'revisado por direccion financiera': 'Revisada Dir. Financiera',
    'revisada dir. financiera': 'Revisada Dir. Financiera',
    'enviada rectoria': 'Enviada Rectoría',
    'enviado a rectoria': 'Enviada Rectoría',
    'cargada para autorizacion': 'Cargada',
    cargada: 'Cargada',
    autorizada: 'Autorizada',
    'autorizada para pago': 'Autorizada',
    'rechazada por rectoria': 'Rechazada por Rectoría',
    devuelta: 'Devuelta',
    rechazada: 'Devuelta',
    detenida: 'Devuelta',
    anulada: 'Devuelta',
    'pago aplicado': 'Pagada',
    pagada: 'Pagada',
  };

  const current = mapEstado[normalize(factura.estado)] || factura.estado;
  const isRechazada = current === 'Rechazada por Rectoría';
  const isDevuelta = current === 'Devuelta';

  const fullBlueprint = [
    ['Recibida', 'Funcionario', 'Factura recibida del proveedor', 1, factura.fechaRecepcion || factura.fechaFactura],
    ['Registrada', 'Funcionario', 'Registro y validacion inicial completada', 1, factura.fechaRecepcion],
    ['Radicada', 'Contabilidad', 'Radicacion contable ejecutada', 3, factura.fechaRadicacion],
    ['Alistada', 'Tesoreria', 'Alistamiento previo a auditoria', 3, factura.fechaAlistamiento],
    ['Aprobada Auditoría', 'Auditoria', 'Control previo de auditoria aprobado', 4, factura.fechaAprobacionAuditoria],
    ['Revisada Dir. Financiera', 'Tesoreria', 'Envio a Direccion Financiera ejecutado', 2, factura.fechaAprobacionAuditoria],
    ['Cargada', 'Direccion Financiera', 'Cargue formal para autorizacion de Rectoría', 2, factura.fechaCargue],
    ['Enviada Rectoría', 'Direccion Financiera', 'Remitida para decision final institucional', 1, factura.fechaCargue],
    ['Rechazada por Rectoría', 'Rectoría', 'Rectoría rechaza el tramite y solicita recertificacion previa', 2, undefined],
    ['Devuelta', 'Direccion Financiera / Tesoreria', 'Tramite devuelto para ajustes operativos y documentales', 2, undefined],
    ['Autorizada', 'Rectoria', 'Pago autorizado por Rectoria', 1, factura.fechaAutorizacion],
    ['Pagada', 'Rectoria', 'Pago realizado por Rectoria', 1, factura.fechaPagoAplicado || factura.fechaComprobante],
  ] as const;

  // Los pasos negativos solo aparecen cuando la factura está efectivamente en ese estado
  const blueprint = fullBlueprint.filter(([nombre]) => {
    if (nombre === 'Rechazada por Rectoría') return isRechazada;
    if (nombre === 'Devuelta') return isDevuelta;
    return true;
  });

  const idx = blueprint.findIndex(([nombre]) => nombre === current);

  return blueprint.map(([nombre, responsable, observaciones, sla, fecha], i) => {
    let estado: TimelineEtapa['estado'];

    if (nombre === 'Rechazada por Rectoría') {
      estado = 'rechazado';
    } else if (nombre === 'Devuelta') {
      estado = 'devuelto';
    } else if (isRechazada || isDevuelta) {
      // Estado negativo: pasos anteriores completados, posteriores pendientes (sin "en-proceso")
      estado = i < idx ? 'completado' : 'pendiente';
    } else {
      // Estado normal: el paso actual y anteriores = completado, siguiente = en-proceso
      estado = i <= idx ? 'completado' : i === idx + 1 ? 'en-proceso' : 'pendiente';
    }

    return {
      id: String(i + 1),
      nombre,
      estado,
      fechaFin: fecha,
      usuarioResponsable: responsable,
      observaciones,
      diasMaximos: sla,
      diasTranscurridos: i === idx ? factura.diasTranscurridos : undefined,
      nivelRiesgo: i === idx ? factura.nivelRiesgo : undefined,
    } as TimelineEtapa;
  });
}

function getEstadoBadge(estado: string) {
  const map: Record<string, string> = {
    Recibida: 'bg-blue-100 text-blue-700 border-blue-200',
    Registrada: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    Radicada: 'bg-green-100 text-green-700 border-green-200',
    Causada: 'bg-purple-100 text-purple-700 border-purple-200',
    Alistada: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Enviada Rectoría': 'bg-pink-100 text-pink-700 border-pink-200',
    'Rechazada por Rectoría': 'bg-red-100 text-red-700 border-red-200',
    'Cargada para autorizacion': 'bg-cyan-100 text-cyan-700 border-cyan-200',
    Devuelta: 'bg-red-100 text-red-700 border-red-200',
    Pagada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return map[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function FacturaDetailModal({ factura, isOpen, onClose }: FacturaDetailModalProps) {
  const { user, components } = useAuth();
  const [detalleFactura, setDetalleFactura] = useState<SharedFacturaDetail | null>(factura ?? null);

  useEffect(() => {
    setDetalleFactura(factura ?? null);
  }, [factura]);

  useEffect(() => {
    if (!isOpen || !factura) return;
    const rawId = factura.facturaId ?? (factura.id ? Number(factura.id) : undefined);
    if (!rawId || Number.isNaN(rawId)) return;

    void (async () => {
      const [detail, docs, seguimiento, slaParams] = await Promise.all([
        facturasService.getById(rawId),
        documentosService.getByFactura(rawId),
        facturasService.getSeguimiento(rawId).catch(() => null),
        parametrosSlaService.listar().catch(() => []),
      ]);
      const mapped = mapFacturaDetail(detail, factura);
      // Siempre usamos el endpoint dedicado de documentos para garantizar la lista completa
      if (docs.length > 0) {
        // Deduplicar por tipo_documento: conservar el más reciente de cada tipo
        const byTipo = new Map<string, typeof docs[0]>();
        for (const d of docs) {
          byTipo.set(d.tipo_documento, d);
        }
        mapped.documentos = Array.from(byTipo.values()).map((d) => ({
          id: d.id ? String(d.id) : undefined,
          nombre: d.nombre_archivo,
          tipo: d.tipo_documento,
          fecha: d.fecha_carga,
          verificado: d.verificado,
          url: d.archivo_url ?? d.url_storage ?? null,
        }));
      }
      if (seguimiento) {
        mapped.etapasTimeline = buildTimelineFromSeguimiento(
          seguimiento as { factura?: { estado?: string }; historial?: { fecha_accion?: string; accion?: string; estado_nuevo?: string; usuario_nombre?: string; observacion?: string }[] },
          mapped.estado,
          slaParams
        );
      }
      setDetalleFactura(mapped);
    })();
  }, [factura, isOpen]);

  const currentFactura = detalleFactura ?? factura;
  if (!currentFactura) return null;

  const etapasTimeline = currentFactura.etapasTimeline && currentFactura.etapasTimeline.length > 0
    ? currentFactura.etapasTimeline
    : buildDefaultTimeline(currentFactura);
  const documentos = (currentFactura.documentos || []).filter((doc) => {
    if (canViewSensitiveDocuments(user?.rol?.nombre, user?.nombre, components)) {
      return true;
    }
    return !isSensitiveDocument(doc);
  });
  const hasDocumentos = documentos.length > 0;
  const showAuditoriaTab = Boolean(currentFactura.auditoriaView);
  const tabsCount = 2 + (hasDocumentos ? 1 : 0) + (showAuditoriaTab ? 1 : 0);
  const tabsClass = tabsCount === 4 ? 'grid-cols-4' : tabsCount === 3 ? 'grid-cols-3' : 'grid-cols-2';

  const auditoriaItems = [
    {
      title: 'Soportes completos',
      ok: documentos.length > 0,
      note: documentos.length > 0 ? `${documentos.length} soporte(s) cargado(s)` : 'Sin soportes adjuntos',
    },
  ];

  // Items del nuevo modelo (estructurado) tienen prioridad; si no existen, parseamos descripcion legacy
  const hasStructuredItems = (currentFactura.items?.length ?? 0) > 0;
  const parsedDescripcion = hasStructuredItems ? { items: [], remainingText: '' } : parseFacturaDescripcion(currentFactura.descripcion);
  const serviciosFactura = parsedDescripcion.items;
  const descripcionAdicional = (hasStructuredItems || serviciosFactura.length > 0) ? parsedDescripcion.remainingText : currentFactura.descripcion;
  const identificacionFactura = currentFactura.identificacionFactura;
  const showDescripcionCard = hasStructuredItems || serviciosFactura.length > 0 || Boolean(descripcionAdicional) || Boolean(identificacionFactura);
  const hasIdentificacion = Boolean(identificacionFactura);

  const openAllDocumentsPreview = () => {
    if (!currentFactura.facturaId) return;
    openDocumentosConsolidados(currentFactura.facturaId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] !max-w-[96vw] xl:!max-w-[92vw] max-h-[92vh] overflow-y-auto p-5 sm:p-6 lg:p-7">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-slate-800">
            <FileText className="w-6 h-6 text-red-600" />
            Detalles Completos del Tramite
          </DialogTitle>
          <DialogDescription>Informacion detallada de {currentFactura.numeroFactura}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className={`grid w-full ${tabsClass}`}>
            <TabsTrigger value="general">Informacion General</TabsTrigger>
            <TabsTrigger value="timeline">Timeline del Proceso</TabsTrigger>
            {hasDocumentos && <TabsTrigger value="documentos">Documentos ({documentos.length})</TabsTrigger>}
            {showAuditoriaTab && <TabsTrigger value="auditoria">Auditoria</TabsTrigger>}
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4 text-sm">
                <div className="flex items-center gap-3">
                  <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Estado actual</span>
                  <Badge className={`${getEstadoBadge(currentFactura.estado)} border text-xs px-3 py-1 rounded-full shadow-sm`}> 
                    {currentFactura.estado}
                  </Badge>
                </div>
                {currentFactura.diasTranscurridos !== undefined && (
                  <div className="flex items-center gap-3">
                    <span className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Días transcurridos</span>
                    <span className="flex items-center gap-1 text-base font-semibold text-slate-800">
                      <Clock className="w-4 h-4 text-amber-500" />
                      {Math.max(0, currentFactura.diasTranscurridos)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-5 h-5 text-red-600" />
                    <p className="font-semibold text-slate-800">Datos del Proveedor</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Razon Social</p>
                      <p className="font-semibold text-slate-800">{displayText(currentFactura.proveedor)}</p>
                    </div>
                    {currentFactura.nit && (
                      <div>
                        <p className="text-xs text-slate-500">NIT</p>
                        <p className="font-mono text-slate-800">{currentFactura.nit}</p>
                      </div>
                    )}
                    {currentFactura.contactoProveedor && (
                      <div>
                        <p className="text-xs text-slate-500">Contacto</p>
                        <p className="text-slate-800">{currentFactura.contactoProveedor}</p>
                      </div>
                    )}
                  </div>
                </div>

                {currentFactura.areaSolicitante && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-slate-800">Area Solicitante</h3>
                    </div>
                    <p className="text-slate-700">{displayText(currentFactura.areaSolicitante)}</p>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <CalendarDays className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-semibold text-slate-800">Fechas Clave</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div>
                      <p className="text-xs text-slate-500">Fecha de Factura</p>
                      <p className="text-slate-800">{displayDate(currentFactura.fechaFactura)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Fecha de Recepcion</p>
                      <p className="text-slate-800">{displayDate(currentFactura.fechaRecepcion)}</p>
                    </div>
                    {currentFactura.tipoDocumento && (
                      <div>
                        <p className="text-xs text-slate-500">Tipo de Documento</p>
                        <p className="text-slate-800">{currentFactura.tipoDocumento}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-slate-800">Valores</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    {currentFactura.valorSubtotal !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Subtotal</span>
                        <span className="font-semibold text-slate-800">${currentFactura.valorSubtotal.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    {currentFactura.valorIva !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500">Tasa</span>
                        <span className="font-semibold text-slate-800">${currentFactura.valorIva.toLocaleString('es-CO')}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between border-t border-slate-200 pt-2">
                      <span className="text-slate-700 font-semibold">Total</span>
                      <span className="text-xl font-bold text-green-700">${currentFactura.valorTotal.toLocaleString('es-CO')}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-800">Numeros de Tramite</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Numero de Factura</p>
                      <p className="font-mono text-slate-800">{displayText(currentFactura.numeroFactura)}</p>
                    </div>
                    {currentFactura.numeroRadicado && (
                      <div>
                        <p className="text-xs text-slate-500">Numero de Radicado</p>
                        <p className="font-mono text-slate-800">{displayRadicado(currentFactura.numeroRadicado)}</p>
                      </div>
                    )}
                    {currentFactura.numeroProcesoPago && (
                      <div>
                        <p className="text-xs text-slate-500">Numero de Proceso de Pago</p>
                        <p className="font-mono text-slate-800">{displayText(currentFactura.numeroProcesoPago)}</p>
                      </div>
                    )}
                  </div>
                </div>

                {currentFactura.cuentaBancariaProveedor && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Paperclip className="w-5 h-5 text-teal-600" />
                      <h3 className="font-semibold text-slate-800">Cuenta Bancaria para Pago</h3>
                    </div>
                    <p className="text-slate-800">{currentFactura.cuentaBancariaProveedor}</p>
                  </div>
                )}
              </div>
            </div>

            {showDescripcionCard && (
              <div className="bg-white border border-slate-200 rounded-lg p-4 space-y-5">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-semibold text-slate-800">Detalle del Servicio / Producto</h3>
                </div>

                {identificacionFactura && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-amber-600 font-semibold mb-1">Identificación factura</p>
                    <p className="text-sm text-amber-900 whitespace-pre-line">{identificacionFactura}</p>
                  </div>
                )}

                {hasStructuredItems && currentFactura.items && (
                  <div className={`space-y-4 ${hasIdentificacion ? 'border-t border-slate-100 pt-4' : ''}`}>
                    <StructuredItemsList items={currentFactura.items} />
                  </div>
                )}

                {!hasStructuredItems && serviciosFactura.length > 0 && (
                  <div className={`space-y-4 ${hasIdentificacion ? 'border-t border-slate-100 pt-4' : ''}`}>
                    <SharedServiciosList items={serviciosFactura} />
                  </div>
                )}

                {descripcionAdicional && (
                  <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Descripción textual</p>
                    <p className="text-sm text-slate-700 whitespace-pre-line">{descripcionAdicional}</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <FacturaTimeline
              numeroFactura={currentFactura.numeroFactura}
              proveedor={currentFactura.proveedor}
              valorTotal={currentFactura.valorTotal}
              etapas={etapasTimeline}
              fechaInicio={currentFactura.fechaRecepcion || currentFactura.fechaFactura || new Date().toISOString()}
            />
          </TabsContent>

          {hasDocumentos && (
            <TabsContent value="documentos" className="mt-4 space-y-3">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm text-slate-600">
                    Soportes cargados por el proveedor para esta factura. Use esta lista para validar completitud documental.
                  </p>
                  <button
                    type="button"
                    onClick={openAllDocumentsPreview}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-white px-3 py-1.5 text-xs font-semibold text-blue-700 transition-all hover:bg-blue-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Ver todos
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {documentos.map((doc, idx) => (
                  <div key={doc.id || `${doc.tipo}-${idx}`} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800">{doc.tipo}</p>
                        <p className="text-sm text-slate-500 truncate">{doc.nombre}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {doc.fecha ? `Cargado: ${doc.fecha.split('T')[0]}` : 'Fecha no registrada'}
                          {doc.verificado && <span className="ml-2 text-green-600 font-medium">✓ Verificado</span>}
                        </p>
                      </div>
                      {doc.url && (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              const isTxt = doc.nombre?.toLowerCase().endsWith('.txt') || doc.url!.toLowerCase().endsWith('.txt');
                              if (isTxt && currentFactura.facturaId && doc.id) {
                                openDocumentosConsolidados(currentFactura.facturaId, undefined, doc.id);
                              } else {
                                window.open(doc.url!, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-medium transition-all"
                          >
                            <Eye className="w-3.5 h-3.5" /> Ver
                          </button>
                          <button
                            type="button"
                            onClick={() => downloadDocumentoIndividual(doc.url!, doc.nombre || 'documento.pdf')}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-medium transition-all"
                          >
                            <Download className="w-3.5 h-3.5" /> Descargar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>
          )}

          {showAuditoriaTab && (
            <TabsContent value="auditoria" className="mt-4 space-y-4">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Checklist de control previo</p>
                    <p className="text-sm text-slate-600">
                      Validacion de soportes adjuntos al tramite.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {auditoriaItems.map((item) => (
                  <div key={item.title} className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800">{item.title}</p>
                      {item.ok ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                      )}
                    </div>
                    <p className="text-sm text-slate-600 mt-2">{item.note}</p>
                    <Badge className={`mt-3 ${item.ok ? 'bg-green-100 text-green-700 border-green-200' : 'bg-amber-100 text-amber-700 border-amber-200'} border`}>
                      {item.ok ? 'Validado' : 'Pendiente'}
                    </Badge>
                  </div>
                ))}
              </div>

              {currentFactura.auditoriaNotas && (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <p className="font-semibold text-blue-900 mb-2">Notas de auditoria</p>
                  <p className="text-blue-800 text-sm">{currentFactura.auditoriaNotas}</p>
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
