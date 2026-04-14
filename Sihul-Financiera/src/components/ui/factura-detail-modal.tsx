import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './dialog';
import { Badge } from './badge';
import { Separator } from './separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
import { motion } from 'motion/react';
import { FileText, Calendar, DollarSign, Building, MapPin, Clock, User, Hash, TrendingUp } from 'lucide-react';
import FacturaTimeline from './factura-timeline';

interface Factura {
  id: string;
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
}

interface FacturaDetailModalProps {
  factura: Factura | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function FacturaDetailModal({ factura, isOpen, onClose }: FacturaDetailModalProps) {
  if (!factura) return null;

  const getEstadoBadge = (estado: string) => {
    const badges: { [key: string]: string } = {
      'Recibida': 'bg-blue-100 text-blue-700 border-blue-200',
      'Radicada': 'bg-green-100 text-green-700 border-green-200',
      'Causada': 'bg-purple-100 text-purple-700 border-purple-200',
      'Alistada': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Aprobada Auditoría': 'bg-teal-100 text-teal-700 border-teal-200',
      'Aprobada auditoría': 'bg-teal-100 text-teal-700 border-teal-200',
      'Enviado a dirección financiera': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Enviado a dir. financiera': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Revisado por dirección financiera': 'bg-sky-100 text-sky-700 border-sky-200',
      'Enviado a Rectoría': 'bg-violet-100 text-violet-700 border-violet-200',
      'Cargada': 'bg-orange-100 text-orange-700 border-orange-200',
      'Cargada para autorización': 'bg-orange-100 text-orange-700 border-orange-200',
      'Autorizada para pago': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Autorizada': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Pago aplicado': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Pagada': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Devuelta': 'bg-red-100 text-red-700 border-red-200',
      'Cancelada': 'bg-slate-100 text-slate-700 border-slate-200'
    };
    return badges[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  // Generar etapas para el Timeline basadas en el estado actual
  const generarEtapasTimeline = () => {
    // Lista ordenada de estados del flujo completo
    const estadosOrdenados = [
      'Recibida',
      'Radicada',
      'Causada',
      'Alistada',
      'Aprobada auditoría',
      'Enviado a dirección financiera',
      'Revisado por dirección financiera',
      'Enviado a Rectoría',
      'Cargada para autorización',
      'Autorizada para pago',
      'Pago aplicado',
      'Pagada'
    ];

    // Normalizar el estado actual para comparación
    const estadoActualNormalizado = factura.estado.toLowerCase().trim();
    
    // Mapear variaciones de nombres de estados
    const mapeoEstados: { [key: string]: string } = {
      'recibida': 'Recibida',
      'radicada': 'Radicada',
      'causada': 'Causada',
      'alistada': 'Alistada',
      'aprobada auditoría': 'Aprobada auditoría',
      'aprobada auditoria': 'Aprobada auditoría',
      'enviado a dirección financiera': 'Enviado a dirección financiera',
      'enviado a dir. financiera': 'Enviado a dirección financiera',
      'enviado a direccion financiera': 'Enviado a dirección financiera',
      'revisado por dirección financiera': 'Revisado por dirección financiera',
      'revisado por dir. financiera': 'Revisado por dirección financiera',
      'enviado a rectoría': 'Enviado a Rectoría',
      'enviado a rectoria': 'Enviado a Rectoría',
      'cargada para autorización': 'Cargada para autorización',
      'cargada para autorizacion': 'Cargada para autorización',
      'cargada': 'Cargada para autorización',
      'autorizada para pago': 'Autorizada para pago',
      'autorizada': 'Autorizada para pago',
      'pago aplicado': 'Pago aplicado',
      'pagada': 'Pagada'
    };

    const estadoActualMapeado = mapeoEstados[estadoActualNormalizado] || factura.estado;
    const indiceEstadoActual = estadosOrdenados.indexOf(estadoActualMapeado);

    // Si el estado es "Devuelta" o "Cancelada", manejarlo especialmente
    const esDevuelta = estadoActualNormalizado.includes('devuelta');
    const esCancelada = estadoActualNormalizado.includes('cancelada');

    const etapas = [
      {
        id: '1',
        nombre: 'Recibida',
        estado: indiceEstadoActual >= 0 ? 'completado' as const : 'pendiente' as const,
        fechaInicio: factura.fechaRecepcion || factura.fechaFactura,
        fechaFin: factura.fechaRecepcion || factura.fechaFactura,
        usuarioResponsable: 'Funcionario',
        observaciones: 'Factura recibida y registrada en el sistema',
        diasTranscurridos: 0,
        diasMaximos: 1
      },
      {
        id: '2',
        nombre: 'Radicada',
        estado: indiceEstadoActual >= 1 ? 'completado' as const : indiceEstadoActual === 0 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Contabilidad',
        observaciones: 'Radicación de factura en sistema contable',
        diasMaximos: 3
      },
      {
        id: '3',
        nombre: 'Causada',
        estado: indiceEstadoActual >= 2 ? 'completado' as const : indiceEstadoActual === 1 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Contabilidad',
        observaciones: 'Causación contable de la factura',
        diasMaximos: 2
      },
      {
        id: '4',
        nombre: 'Alistada',
        estado: indiceEstadoActual >= 3 ? 'completado' as const : indiceEstadoActual === 2 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Tesorería',
        observaciones: 'Alistamiento de pago - Generación de número de proceso',
        diasMaximos: 3
      },
      {
        id: '5',
        nombre: 'Aprobada Auditoría',
        estado: indiceEstadoActual >= 4 ? 'completado' as const : indiceEstadoActual === 3 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Auditoría',
        observaciones: 'Control previo de auditoría',
        diasMaximos: 4
      },
      {
        id: '6',
        nombre: 'Enviado a Dirección Financiera',
        estado: indiceEstadoActual >= 5 ? 'completado' as const : indiceEstadoActual === 4 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Tesorería',
        observaciones: 'Remitido a Dirección Financiera para revisión',
        diasMaximos: 1
      },
      {
        id: '7',
        nombre: 'Revisado por Dirección Financiera',
        estado: indiceEstadoActual >= 6 ? 'completado' as const : indiceEstadoActual === 5 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Dir. Financiera',
        observaciones: 'Revisión y validación financiera',
        diasMaximos: 2
      },
      {
        id: '8',
        nombre: 'Enviado a Rectoría',
        estado: indiceEstadoActual >= 7 ? 'completado' as const : indiceEstadoActual === 6 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Dir. Financiera',
        observaciones: 'Remitido a Rectoría para autorización',
        diasMaximos: 1
      },
      {
        id: '9',
        nombre: 'Cargada para Autorización',
        estado: indiceEstadoActual >= 8 ? 'completado' as const : indiceEstadoActual === 7 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Dir. Financiera / Rectoría',
        observaciones: 'Cargue formal para autorización de Rectoría',
        diasMaximos: 2,
        diasTranscurridos: indiceEstadoActual === 8 ? factura.diasTranscurridos : undefined,
        nivelRiesgo: indiceEstadoActual === 8 ? factura.nivelRiesgo : undefined
      },
      {
        id: '10',
        nombre: 'Autorizada para Pago',
        estado: indiceEstadoActual >= 9 ? 'completado' as const : indiceEstadoActual === 8 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Rectoría',
        observaciones: 'Autorización final de pago por Rectoría',
        diasMaximos: 3,
        diasTranscurridos: indiceEstadoActual === 9 ? factura.diasTranscurridos : undefined,
        nivelRiesgo: indiceEstadoActual === 9 ? factura.nivelRiesgo : undefined
      },
      {
        id: '11',
        nombre: 'Pago Aplicado',
        estado: indiceEstadoActual >= 10 ? 'completado' as const : indiceEstadoActual === 9 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Portal Bancario / Tesorería',
        observaciones: 'Pago ejecutado en portal bancario externo',
        diasMaximos: 1
      },
      {
        id: '12',
        nombre: 'Pagada (CE Generado)',
        estado: indiceEstadoActual >= 11 ? 'completado' as const : indiceEstadoActual === 10 ? 'en-proceso' as const : 'pendiente' as const,
        usuarioResponsable: 'Tesorería',
        observaciones: 'Comprobante de egreso generado - Proceso finalizado',
        diasMaximos: 1
      }
    ];

    // Si está devuelta o cancelada, agregar esa etapa
    if (esDevuelta) {
      etapas.push({
        id: 'devuelta',
        nombre: '⚠️ DEVUELTA',
        estado: 'devuelto' as const,
        usuarioResponsable: 'Sistema',
        observaciones: factura.observaciones || 'Factura devuelta para corrección',
        diasMaximos: 0
      });
    }

    if (esCancelada) {
      etapas.push({
        id: 'cancelada',
        nombre: '❌ CANCELADA',
        estado: 'rechazado' as const,
        usuarioResponsable: 'Sistema',
        observaciones: factura.observaciones || 'Proceso cancelado',
        diasMaximos: 0
      });
    }

    return etapas;
  };

  const etapasTimeline = generarEtapasTimeline();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl text-slate-800">
            <FileText className="w-6 h-6 text-red-600" />
            Detalles Completos del Trámite
          </DialogTitle>
          <DialogDescription>
            Información detallada de {factura.numeroFactura}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">Información General</TabsTrigger>
            <TabsTrigger value="timeline">Timeline del Proceso</TabsTrigger>
          </TabsList>

          {/* Tab: Información General */}
          <TabsContent value="general" className="space-y-4 mt-4">
            {/* Estado Actual */}
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
                    <p className="text-sm text-slate-600 mb-1">Días Transcurridos</p>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className={`font-bold text-2xl ${
                        factura.nivelRiesgo === 'vencido' ? 'text-purple-700' :
                        factura.nivelRiesgo === 'rojo' ? 'text-red-600' :
                        factura.nivelRiesgo === 'amarillo' ? 'text-yellow-600' :
                        'text-green-600'
                      }`}>
                        {factura.diasTranscurridos}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Información Principal */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Building className="w-5 h-5 text-red-600" />
                    <h3 className="font-semibold text-slate-800">Datos del Proveedor</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Razón Social</p>
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
                      <h3 className="font-semibold text-slate-800">Área Solicitante</h3>
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
                  <p className="text-3xl font-bold text-green-700">
                    ${factura.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Hash className="w-5 h-5 text-blue-600" />
                    <h3 className="font-semibold text-slate-800">Números de Trámite</h3>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Número de Factura</p>
                      <p className="font-mono text-slate-800">{factura.numeroFactura}</p>
                    </div>
                    {factura.numeroRadicado && (
                      <div>
                        <p className="text-xs text-slate-500">Número de Radicado</p>
                        <p className="font-mono text-slate-800">{factura.numeroRadicado}</p>
                      </div>
                    )}
                    {factura.numeroProcesoPago && (
                      <div>
                        <p className="text-xs text-slate-500">Proceso de Pago</p>
                        <p className="font-mono text-slate-800">{factura.numeroProcesoPago}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Información Contable */}
            {(factura.cuentaContable || factura.centroCosto) && (
              <div className="bg-white border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-3">Información Contable</h3>
                <div className="grid grid-cols-2 gap-4">
                  {factura.cuentaContable && (
                    <div>
                      <p className="text-xs text-slate-500">Cuenta Contable</p>
                      <p className="font-mono text-slate-800">{factura.cuentaContable}</p>
                    </div>
                  )}
                  {factura.centroCosto && (
                    <div>
                      <p className="text-xs text-slate-500">Centro de Costos</p>
                      <p className="font-mono text-slate-800">{factura.centroCosto}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Descripción */}
            {factura.descripcion && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">Descripción</h3>
                <p className="text-blue-800">{factura.descripcion}</p>
              </div>
            )}

            {/* Observaciones */}
            {factura.observaciones && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="font-semibold text-yellow-900 mb-2">Observaciones</h3>
                <p className="text-yellow-800">{factura.observaciones}</p>
              </div>
            )}
          </TabsContent>

          {/* Tab: Timeline */}
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
