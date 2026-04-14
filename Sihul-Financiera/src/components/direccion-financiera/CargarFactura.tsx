import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  FileCheck, Eye, CheckCircle2, XCircle, AlertTriangle, Calendar,
  Building2, DollarSign, ArrowLeft, Send, Upload
} from 'lucide-react';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  valorTotal: number;
  fechaRecepcion: string;
  fechaAprobacionAuditoria: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function CargarFactura() {
  const [facturasAprobadas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      numeroRadicado: 'RAD-2026-00145',
      numeroProcesoPago: 'PP-2026-00078',
      proveedor: 'Tecnología Global SAS',
      valorTotal: 8900000,
      fechaRecepcion: '2026-03-28',
      fechaAprobacionAuditoria: '2026-04-01',
      areaSolicitante: 'Sistemas',
      estado: 'Aprobada Auditoría',
      diasTranscurridos: 0,
      descripcion: 'Equipos de cómputo para área administrativa'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-152',
      numeroRadicado: 'RAD-2026-00152',
      numeroProcesoPago: 'PP-2026-00079',
      proveedor: 'Servicios Médicos Especializados',
      valorTotal: 12500000,
      fechaRecepcion: '2026-03-30',
      fechaAprobacionAuditoria: '2026-04-01',
      areaSolicitante: 'Enfermería',
      estado: 'Aprobada Auditoría',
      diasTranscurridos: 0,
      descripcion: 'Servicios médicos especializados mes de marzo'
    }
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'cargar' | 'devolver' | null>(null);
  const [procesoActualizado, setProcesoActualizado] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setAccion(null);
    setObservaciones('');
    setProcesoActualizado(false);
  };

  const iniciarCargue = () => {
    setAccion('cargar');
  };

  const iniciarDevolucion = () => {
    setAccion('devolver');
    setObservaciones('');
  };

  const actualizarProceso = () => {
    setProcesoActualizado(true);
    alert(`📋 PROCESO DE PAGO ACTUALIZADO\n\nSe ha actualizado el proceso de pago ${facturaSeleccionada?.numeroProcesoPago} en el sistema.\n\nLa factura está lista para el cargue formal.`);
  };

  const confirmarCargue = () => {
    if (!procesoActualizado) {
      alert('❌ ERROR\n\nDebe actualizar el proceso de pago antes de realizar el cargue formal.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`✅ CARGUE FORMAL COMPLETADO\n\nFactura: ${facturaSeleccionada?.numeroFactura}\nProceso de Pago: ${facturaSeleccionada?.numeroProcesoPago}\nProveedor: ${facturaSeleccionada?.proveedor}\n\n✓ Proceso de pago actualizado\n✓ Cargue formal realizado\n📅 Fecha de Cargue: ${new Date().toISOString().split('T')[0]}\n\nEstado: CARGADA PARA AUTORIZACIÓN\nSiguiente etapa: Autorización Final en Rectoría\n\n⚠️ NOTA: No se revisa presupuesto en esta etapa (ya verificado desde orden/contrato).`);
      setFacturaSeleccionada(null);
      setAccion(null);
    }, 1500);
  };

  const confirmarDevolucion = () => {
    if (!observaciones.trim()) {
      alert('❌ ERROR\n\nLa observación es OBLIGATORIA cuando se devuelve una factura.\n\nDebe especificar claramente el motivo de la devolución.');
      return;
    }

    if (observaciones.trim().length < 10) {
      alert('❌ ERROR\n\nLa observación debe tener al menos 10 caracteres.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`⚠️ FACTURA DEVUELTA A TESORERÍA\n\nFactura: ${facturaSeleccionada?.numeroFactura}\n\nMotivo:\n${observaciones}\n\nEstado: DEVUELTA\nVuelve a: TESORERÍA\n\n📧 Se ha notificado a Tesorería para que realice los ajustes necesarios.\n\nDespués de corregida, debe volver a pasar por Dirección Financiera.`);
      setFacturaSeleccionada(null);
      setAccion(null);
      setObservaciones('');
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Cargue Formal de Facturas</h1>
          <p className="text-slate-600">
            Actualice el proceso de pago y realice el cargue formal previo a autorización
          </p>
        </div>

        {/* Vista de lista */}
        {!facturaSeleccionada && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Facturas Aprobadas por Auditoría</CardTitle>
                  <CardDescription>
                    {facturasAprobadas.length} factura(s) pendiente(s) de cargue formal
                  </CardDescription>
                </div>
                <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                  Estado: Aprobada Auditoría
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              {/* Información importante */}
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex gap-3">
                  <Upload className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-blue-700 mb-1">Función de Dirección Financiera</h3>
                    <p className="text-sm text-blue-600">
                      Esta área NO revisa presupuesto. Actualiza el proceso de pago y realiza el cargue formal
                      porque Tesorería no tiene ese permiso en el sistema.
                    </p>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proceso de Pago</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Área</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">F. Aprobación</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasAprobadas.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-800">
                          {factura.numeroFactura}
                        </TableCell>
                        <TableCell className="text-yellow-600 font-medium">
                          {factura.numeroProcesoPago}
                        </TableCell>
                        <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                        <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          ${factura.valorTotal.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-slate-600">{factura.fechaAprobacionAuditoria}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            factura.diasTranscurridos > 3 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {factura.diasTranscurridos} días
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => verDetalle(factura)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Cargar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Vista de detalle */}
        {facturaSeleccionada && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Button
              onClick={() => {
                setFacturaSeleccionada(null);
                setAccion(null);
              }}
              variant="ghost"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a la lista
            </Button>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800">
                  Cargue Formal - {facturaSeleccionada.numeroFactura}
                </CardTitle>
                <CardDescription>
                  Actualice y cargue el proceso de pago para autorización
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información de la factura */}
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Proveedor</p>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Valor Total</p>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <p className="font-semibold text-green-600 text-xl">
                          ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                        </p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Proceso de Pago</p>
                      <p className="font-semibold text-yellow-600">{facturaSeleccionada.numeroProcesoPago}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Estado Actual</p>
                      <Badge className="bg-teal-100 text-teal-700 border-teal-200">
                        Aprobada Auditoría
                      </Badge>
                    </div>
                  </div>

                  {/* Timeline de fechas */}
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-sm font-medium text-slate-700 mb-3">Trazabilidad:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-red-600 mb-1">Recepción (SLA)</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-red-600" />
                          <p className="text-sm font-semibold text-red-600">{facturaSeleccionada.fechaRecepcion}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-teal-600 mb-1">Aprobación Auditoría</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-teal-600" />
                          <p className="text-sm font-semibold text-teal-600">{facturaSeleccionada.fechaAprobacionAuditoria}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Descripción</p>
                    <p className="text-slate-800">{facturaSeleccionada.descripcion}</p>
                  </div>
                </div>

                {/* Acciones */}
                {!accion && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={iniciarCargue}
                      className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Realizar Cargue Formal
                    </Button>
                    <Button
                      onClick={iniciarDevolucion}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Devolver a Tesorería
                    </Button>
                  </div>
                )}

                {/* Formulario de cargue */}
                <AnimatePresence>
                  {accion === 'cargar' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200 pt-6 space-y-4"
                    >
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <Upload className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-orange-700 mb-1">Cargue Formal</h3>
                            <p className="text-sm text-orange-600">
                              Actualice el proceso de pago y realice el cargue formal. Tesorería no tiene este permiso
                              en el sistema, por eso lo realiza Dirección Financiera.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-slate-700 font-medium">Actualización de Proceso de Pago</Label>
                        <Button
                          onClick={actualizarProceso}
                          disabled={procesoActualizado}
                          className={`w-full ${procesoActualizado ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        >
                          <FileCheck className="w-4 h-4 mr-2" />
                          {procesoActualizado ? '✓ Proceso Actualizado' : 'Actualizar Proceso de Pago'}
                        </Button>
                      </div>

                      <div className="bg-slate-100 rounded-lg p-4">
                        <p className="text-sm text-slate-700">
                          📅 <strong>Fecha de Cargue:</strong> {new Date().toISOString().split('T')[0]}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacionesCargue" className="text-slate-700 font-medium">
                          Observaciones (Opcional)
                        </Label>
                        <Textarea
                          id="observacionesCargue"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Observaciones adicionales sobre el cargue"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => setAccion(null)}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={confirmarCargue}
                          disabled={procesando}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          {procesando ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                              />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Confirmar Cargue
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Formulario de devolución */}
                  {accion === 'devolver' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200 pt-6 space-y-4"
                    >
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-red-700 mb-1">Devolver a Tesorería</h3>
                            <p className="text-sm text-red-600">
                              La factura será devuelta a Tesorería para ajuste. Debe especificar el motivo.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacionesDevolucion" className="text-slate-700 font-medium">
                          Motivo de Devolución <span className="text-red-600">* OBLIGATORIO</span>
                        </Label>
                        <Textarea
                          id="observacionesDevolucion"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Especifique claramente qué debe ajustarse..."
                          rows={4}
                          className="border-red-300"
                        />
                        <p className="text-xs text-red-600">
                          ⚠️ La observación es OBLIGATORIA. Mínimo 10 caracteres.
                        </p>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          onClick={() => {
                            setAccion(null);
                            setObservaciones('');
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          onClick={confirmarDevolucion}
                          disabled={procesando}
                          className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        >
                          {procesando ? (
                            <>
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                              />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 mr-2" />
                              Confirmar Devolución
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
