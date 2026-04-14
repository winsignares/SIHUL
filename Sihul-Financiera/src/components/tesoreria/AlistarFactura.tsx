import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { 
  FileCheck, Eye, CheckCircle2, AlertTriangle, Calendar,
  FileText, Building2, DollarSign, ArrowLeft, Send, Upload, User
} from 'lucide-react';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  proveedor: string;
  valorTotal: number;
  fechaRecepcion: string;
  fechaRadicacion: string;
  fechaCausacion: string;
  areaSolicitante: string;
  cuentaBancaria: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function AlistarFactura() {
  const [facturasCausadas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      numeroRadicado: 'RAD-2026-00145',
      proveedor: 'Tecnología Global SAS',
      valorTotal: 8900000,
      fechaRecepcion: '2026-03-28',
      fechaRadicacion: '2026-03-29',
      fechaCausacion: '2026-03-30',
      areaSolicitante: 'Sistemas',
      cuentaBancaria: '1234567890 - Banco Popular',
      estado: 'Causada',
      diasTranscurridos: 1,
      descripcion: 'Equipos de cómputo para área administrativa'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-152',
      numeroRadicado: 'RAD-2026-00152',
      proveedor: 'Servicios Médicos Especializados',
      valorTotal: 12500000,
      fechaRecepcion: '2026-03-30',
      fechaRadicacion: '2026-03-31',
      fechaCausacion: '2026-03-31',
      areaSolicitante: 'Enfermería',
      cuentaBancaria: '9876543210 - Bancolombia',
      estado: 'Causada',
      diasTranscurridos: 0,
      descripcion: 'Servicios médicos especializados mes de marzo'
    }
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'alistar' | 'detener' | null>(null);
  const [numeroProcesoPago, setNumeroProcesoPago] = useState('');
  const [archivoPlanoGenerado, setArchivoPlanoGenerado] = useState(false);
  const [revisadoPorAsistente, setRevisadoPorAsistente] = useState(false);
  const [validadoPorTesorera, setValidadoPorTesorera] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setAccion(null);
    setObservaciones('');
    setNumeroProcesoPago(`PP-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(5, '0')}`);
    setArchivoPlanoGenerado(false);
    setRevisadoPorAsistente(false);
    setValidadoPorTesorera(false);
  };

  const iniciarAlistamiento = () => {
    setAccion('alistar');
  };

  const iniciarDetencion = () => {
    setAccion('detener');
    setObservaciones('');
  };

  const generarArchivoPlano = () => {
    setArchivoPlanoGenerado(true);
    alert('📄 ARCHIVO PLANO GENERADO\n\nSe ha generado el archivo plano para el aplicativo financiero y el portal bancario.\n\nArchivo: pago_' + facturaSeleccionada?.numeroFactura + '.txt');
  };

  const confirmarAlistamiento = () => {
    if (!numeroProcesoPago) {
      alert('❌ ERROR\n\nDebe generar un número de proceso de pago.');
      return;
    }

    if (!archivoPlanoGenerado) {
      alert('❌ ERROR\n\nDebe generar el archivo plano antes de continuar.');
      return;
    }

    if (!revisadoPorAsistente) {
      alert('❌ ERROR\n\nLa asistente de tesorería debe revisar y validar los soportes.');
      return;
    }

    if (!validadoPorTesorera) {
      alert('❌ ERROR\n\nLa tesorera debe validar el proceso para el portal bancario.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`✅ FACTURA ALISTADA EXITOSAMENTE\n\nFactura: ${facturaSeleccionada?.numeroFactura}\nRadicado: ${facturaSeleccionada?.numeroRadicado}\nProveedor: ${facturaSeleccionada?.proveedor}\n\n📋 Proceso de Pago: ${numeroProcesoPago}\n✅ Archivo plano generado\n✅ Revisado por asistente\n✅ Validado por tesorera\n\nEstado: ALISTADA\nSiguiente etapa: Control Previo de Auditoría\n\n⚠️ IMPORTANTE: El comprobante de egreso NO se genera en esta etapa. Se generará al FINAL del proceso, después del pago aplicado.`);
      setFacturaSeleccionada(null);
      setAccion(null);
    }, 1500);
  };

  const confirmarDetencion = () => {
    if (!observaciones.trim()) {
      alert('❌ ERROR\n\nLa observación es OBLIGATORIA cuando se detiene el trámite.\n\nDebe especificar claramente el motivo de la detención.');
      return;
    }

    if (observaciones.trim().length < 10) {
      alert('❌ ERROR\n\nLa observación debe tener al menos 10 caracteres.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`⚠️ TRÁMITE DETENIDO EN TESORERÍA\n\nFactura: ${facturaSeleccionada?.numeroFactura}\n\nMotivo:\n${observaciones}\n\nEl trámite queda detenido en Tesorería hasta que se corrija la inconsistencia detectada.\n\nEstado: DETENIDA EN TESORERÍA\n\n📧 Se notificará a las áreas correspondientes para ajuste.`);
      setFacturaSeleccionada(null);
      setAccion(null);
      setObservaciones('');
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Alistamiento de Facturas</h1>
          <p className="text-slate-600">
            Revise soportes, genere archivo plano y prepare el pago para el portal bancario
          </p>
        </div>

        {/* Vista de lista */}
        {!facturaSeleccionada && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Facturas Pendientes de Alistamiento</CardTitle>
                  <CardDescription>
                    {facturasCausadas.length} factura(s) en estado "Causada"
                  </CardDescription>
                </div>
                <Badge className="bg-purple-100 text-purple-700 border-purple-200">
                  Estado: Causada
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">N° Radicado</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Cuenta Bancaria</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">F. Causación</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasCausadas.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-800">
                          {factura.numeroFactura}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          {factura.numeroRadicado}
                        </TableCell>
                        <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                        <TableCell className="text-slate-600 text-sm">{factura.cuentaBancaria}</TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          ${factura.valorTotal.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-slate-600">{factura.fechaCausacion}</TableCell>
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
                            Alistar
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
                  Alistamiento - {facturaSeleccionada.numeroFactura}
                </CardTitle>
                <CardDescription>
                  Prepare el pago para el aplicativo financiero y portal bancario
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
                      <p className="text-sm text-slate-500 mb-1">Cuenta Bancaria</p>
                      <p className="font-semibold text-slate-800">{facturaSeleccionada.cuentaBancaria}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Área Solicitante</p>
                      <p className="font-semibold text-slate-800">{facturaSeleccionada.areaSolicitante}</p>
                    </div>
                  </div>

                  {/* Timeline de fechas */}
                  <div className="border-t border-slate-200 pt-4">
                    <p className="text-sm font-medium text-slate-700 mb-3">Trazabilidad de Fechas:</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-red-600 mb-1">Recepción (SLA)</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-red-600" />
                          <p className="text-sm font-semibold text-red-600">{facturaSeleccionada.fechaRecepcion}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 mb-1">Radicación</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-semibold text-green-600">{facturaSeleccionada.fechaRadicacion}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-purple-600 mb-1">Causación</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-purple-600" />
                          <p className="text-sm font-semibold text-purple-600">{facturaSeleccionada.fechaCausacion}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Descripción</p>
                    <p className="text-slate-800">{facturaSeleccionada.descripcion}</p>
                  </div>
                </div>

                {/* Información importante */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-yellow-700 mb-1">Importante - Comprobante de Egreso</h3>
                      <p className="text-sm text-yellow-600">
                        El comprobante de egreso NO se genera en esta etapa. Se generará al FINAL del proceso,
                        después de que el pago haya sido aplicado en el portal bancario.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                {!accion && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={iniciarAlistamiento}
                      className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      Iniciar Alistamiento
                    </Button>
                    <Button
                      onClick={iniciarDetencion}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Detener (Inconsistencia)
                    </Button>
                  </div>
                )}

                {/* Formulario de alistamiento */}
                <AnimatePresence>
                  {accion === 'alistar' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200 pt-6 space-y-4"
                    >
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-blue-700 mb-1">Proceso de Alistamiento</h3>
                            <p className="text-sm text-blue-600">
                              En esta etapa se revisan soportes, se genera el archivo plano y se prepara el pago.
                              Requiere revisión de la asistente y validación de la tesorera.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numeroProcesoPago" className="text-slate-700 font-medium">
                          Número de Proceso de Pago
                        </Label>
                        <Input
                          id="numeroProcesoPago"
                          value={numeroProcesoPago}
                          onChange={(e) => setNumeroProcesoPago(e.target.value)}
                          className="font-semibold"
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-slate-700 font-medium">Archivo Plano</Label>
                        <Button
                          onClick={generarArchivoPlano}
                          disabled={archivoPlanoGenerado}
                          className={`w-full ${archivoPlanoGenerado ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'} text-white`}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {archivoPlanoGenerado ? '✓ Archivo Plano Generado' : 'Generar Archivo Plano'}
                        </Button>
                      </div>

                      <div className="space-y-3 bg-slate-50 p-4 rounded-lg">
                        <Label className="text-slate-700 font-medium">Validaciones Requeridas</Label>
                        
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="asistente"
                            checked={revisadoPorAsistente}
                            onChange={(e) => setRevisadoPorAsistente(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label htmlFor="asistente" className="text-slate-700">
                            <User className="w-4 h-4 inline mr-2 text-blue-600" />
                            Revisado y validado por Asistente de Tesorería
                          </label>
                        </div>

                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            id="tesorera"
                            checked={validadoPorTesorera}
                            onChange={(e) => setValidadoPorTesorera(e.target.checked)}
                            className="w-4 h-4"
                          />
                          <label htmlFor="tesorera" className="text-slate-700">
                            <User className="w-4 h-4 inline mr-2 text-purple-600" />
                            Validado por Tesorera para Portal Bancario
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacionesAlistamiento" className="text-slate-700 font-medium">
                          Observaciones (Opcional)
                        </Label>
                        <Textarea
                          id="observacionesAlistamiento"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Observaciones adicionales sobre el alistamiento"
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
                          onClick={confirmarAlistamiento}
                          disabled={procesando}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white"
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
                              Confirmar Alistamiento
                            </>
                          )}
                        </Button>
                      </div>
                    </motion.div>
                  )}

                  {/* Formulario de detención */}
                  {accion === 'detener' && (
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
                            <h3 className="font-semibold text-red-700 mb-1">Detener Trámite</h3>
                            <p className="text-sm text-red-600">
                              El trámite quedará detenido en Tesorería hasta que se corrija la inconsistencia.
                              Debe especificar OBLIGATORIAMENTE el motivo de la detención.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacionesDetencion" className="text-slate-700 font-medium">
                          Motivo de Detención <span className="text-red-600">* OBLIGATORIO</span>
                        </Label>
                        <Textarea
                          id="observacionesDetencion"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Especifique claramente qué inconsistencia se detectó..."
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
                          onClick={confirmarDetencion}
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
                              Confirmar Detención
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
