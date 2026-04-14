import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Badge } from './badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { FileText, Clock, DollarSign, Building, MapPin, Hash } from 'lucide-react';
import FacturaTimeline, { type TimelineEtapa } from './factura-timeline';

export interface SharedFacturaDetail {
  id?: string;
  numeroFactura: string;
  proveedor: string;
  valorTotal: number;
  fechaFactura?: string;
  fechaRecepcion?: string;
  areaSolicitante?: string;
  estado: string;
  diasTranscurridos?: number;
  numeroRadicado?: string;
  numeroProcesoPago?: string;
  descripcion?: string;
  observaciones?: string;
  nivelRiesgo?: 'verde' | 'amarillo' | 'rojo' | 'vencido';
  nit?: string;
  cuentaContable?: string;
  centroCosto?: string;
  etapasTimeline?: TimelineEtapa[];
}

interface FacturaDetailModalProps {
  factura: SharedFacturaDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

function buildDefaultTimeline(factura: SharedFacturaDetail): TimelineEtapa[] {
  const estadosOrdenados = [
    'Recibida',
    'Radicada',
    'Causada',
    'Alistada',
    'Aprobada auditoria',
    'Enviado a direccion financiera',
    'Revisado por direccion financiera',
    'Enviado a Rectoria',
    'Cargada para autorizacion',
    'Autorizada para pago',
    'Pago aplicado',
    'Pagada',
  ];

  const normalize = (value: string) =>
    value
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  const mapEstado: Record<string, string> = {
    recibida: 'Recibida',
    radicada: 'Radicada',
    causada: 'Causada',
    alistada: 'Alistada',
    'aprobada auditoria': 'Aprobada auditoria',
    'enviado a direccion financiera': 'Enviado a direccion financiera',
    'enviado a dir. financiera': 'Enviado a direccion financiera',
    'revisado por direccion financiera': 'Revisado por direccion financiera',
    'enviado a rectoria': 'Enviado a Rectoria',
    'cargada para autorizacion': 'Cargada para autorizacion',
    cargada: 'Cargada para autorizacion',
    autorizada: 'Autorizada para pago',
    'autorizada para pago': 'Autorizada para pago',
    'pago aplicado': 'Pago aplicado',
    pagada: 'Pagada',
  };

  const current = mapEstado[normalize(factura.estado)] || factura.estado;
  const idx = estadosOrdenados.indexOf(current);

  const blueprint = [
    ['Recibida', 'Funcionario', 'Factura registrada en el sistema', 1],
    ['Radicada', 'Contabilidad', 'Radicacion contable', 3],
    ['Causada', 'Contabilidad', 'Causacion contable', 2],
    ['Alistada', 'Tesoreria', 'Alistamiento de pago', 3],
    ['Aprobada auditoria', 'Auditoria', 'Control previo de auditoria', 4],
    ['Enviado a direccion financiera', 'Tesoreria', 'Remitido a Direccion Financiera', 1],
    ['Revisado por direccion financiera', 'Dir. Financiera', 'Revision financiera', 2],
    ['Enviado a Rectoria', 'Dir. Financiera', 'Enviado a Rectoria', 1],
    ['Cargada para autorizacion', 'Dir. Financiera / Rectoria', 'Cargue para autorizacion', 2],
    ['Autorizada para pago', 'Rectoria', 'Autorizacion final', 3],
    ['Pago aplicado', 'Portal bancario / Tesoreria', 'Aplicacion de pago', 1],
    ['Pagada', 'Tesoreria', 'Comprobante de egreso generado', 1],
  ] as const;

  return blueprint.map(([nombre, responsable, observaciones, sla], i) => {
    const estado = i < idx ? 'completado' : i === idx ? 'en-proceso' : 'pendiente';
    return {
      id: String(i + 1),
      nombre,
      estado,
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
    Radicada: 'bg-green-100 text-green-700 border-green-200',
    Causada: 'bg-purple-100 text-purple-700 border-purple-200',
    Alistada: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'Aprobada Auditoria': 'bg-teal-100 text-teal-700 border-teal-200',
    'Aprobada auditoria': 'bg-teal-100 text-teal-700 border-teal-200',
    Devuelta: 'bg-red-100 text-red-700 border-red-200',
    Pagada: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };
  return map[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
}

export default function FacturaDetailModal({ factura, isOpen, onClose }: FacturaDetailModalProps) {
  if (!factura) return null;

  const etapasTimeline = factura.etapasTimeline && factura.etapasTimeline.length > 0
    ? factura.etapasTimeline
    : buildDefaultTimeline(factura);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-slate-800">
            <FileText className="w-6 h-6 text-red-600" />
            Detalles Completos del Tramite
          </DialogTitle>
          <DialogDescription>Informacion detallada de {factura.numeroFactura}</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Informacion General</TabsTrigger>
            <TabsTrigger value="timeline">Timeline del Proceso</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 mt-4">
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-lg p-4 border border-slate-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Estado Actual</p>
                  <Badge className={`${getEstadoBadge(factura.estado)} border text-lg px-4 py-2`}>
                    {factura.estado}
                  </Badge>
                </div>
                {factura.diasTranscurridos !== undefined && (
                  <div className="text-right">
                    <p className="text-sm text-slate-600 mb-1">Dias Transcurridos</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="font-bold text-2xl text-amber-600">{factura.diasTranscurridos}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-slate-800">Datos del Proveedor</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Razon Social</p>
                      <p className="font-semibold text-slate-800">{factura.proveedor}</p>
                    </div>
                    {factura.nit && (
                      <div>
                        <p className="text-xs text-slate-500">NIT</p>
                        <p className="font-mono text-slate-800">{factura.nit}</p>
                      </div>
                    )}
                  </div>
                </div>

                {factura.areaSolicitante && (
                  <div className="bg-white border border-slate-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-5 h-5 text-red-600" />
                      <h3 className="font-semibold text-slate-800">Area Solicitante</h3>
                    </div>
                    <p className="text-slate-700">{factura.areaSolicitante}</p>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <DollarSign className="w-5 h-5 text-green-600" />
                    <h3 className="font-semibold text-slate-800">Valor</h3>
                  </div>
                  <p className="text-3xl font-bold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-800">Numeros de Tramite</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Numero de Factura</p>
                      <p className="font-mono text-slate-800">{factura.numeroFactura}</p>
                    </div>
                    {factura.numeroRadicado && (
                      <div>
                        <p className="text-xs text-slate-500">Numero de Radicado</p>
                        <p className="font-mono text-slate-800">{factura.numeroRadicado}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {factura.descripcion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Descripcion</h3>
                <p className="text-blue-800">{factura.descripcion}</p>
              </div>
            )}

            {factura.observaciones && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Observaciones</h3>
                <p className="text-yellow-800">{factura.observaciones}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="timeline" className="mt-4">
            <FacturaTimeline
              numeroFactura={factura.numeroFactura}
              proveedor={factura.proveedor}
              valorTotal={factura.valorTotal}
              etapas={etapasTimeline}
              fechaInicio={factura.fechaRecepcion || factura.fechaFactura || new Date().toISOString()}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
