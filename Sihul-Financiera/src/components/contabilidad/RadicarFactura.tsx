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
  FileCheck, Eye, CheckCircle2, XCircle, AlertTriangle, Calendar,
  FileText, User, Building2, DollarSign, ArrowLeft, Send
} from 'lucide-react';

interface Factura {
  id: string;
  numeroFactura: string;
  proveedor: string;
  valorTotal: number;
  fechaFactura: string;
  fechaRecepcion: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
  documentosAdjuntos: number;
}

export default function RadicarFactura() {
  const [facturasPendientes] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      proveedor: 'Tecnología Global SAS',
      valorTotal: 8900000,
      fechaFactura: '2026-03-25',
      fechaRecepcion: '2026-03-28',
      areaSolicitante: 'Sistemas',
      estado: 'Recibida',
      diasTranscurridos: 2,
      descripcion: 'Equipos de cómputo para área administrativa',
      documentosAdjuntos: 3
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-152',
      proveedor: 'Servicios Médicos Especializados',
      valorTotal: 12500000,
      fechaFactura: '2026-03-27',
      fechaRecepcion: '2026-03-30',
      areaSolicitante: 'Enfermería',
      estado: 'Recibida',
      diasTranscurridos: 1,
      descripcion: 'Servicios médicos especializados mes de marzo',
      documentosAdjuntos: 5
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-138',
      proveedor: 'Editorial Académica Colombia',
      valorTotal: 6750000,
      fechaFactura: '2026-03-20',
      fechaRecepcion: '2026-03-26',
      areaSolicitante: 'Biblioteca',
      estado: 'Recibida',
      diasTranscurridos: 4,
      descripcion: 'Libros académicos y material bibliográfico',
      documentosAdjuntos: 2
    }
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'radicar' | 'devolver' | null>(null);
  const [numeroRadicado, setNumeroRadicado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setAccion(null);
    setObservaciones('');
    setNumeroRadicado(`RAD-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(5, '0')}`);
  };

  const iniciarRadicacion = () => {
    setAccion('radicar');
  };

  const iniciarDevolucion = () => {
    setAccion('devolver');
    setObservaciones('');
  };

  const confirmarRadicacion = () => {
    if (!numeroRadicado) {
      alert('Debe generar un número de radicado');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`✅ FACTURA RADICADA EXITOSAMENTE\n\nNúmero de Radicado: ${numeroRadicado}\nFactura: ${facturaSeleccionada?.numeroFactura}\nProveedor: ${facturaSeleccionada?.proveedor}\n\n📅 Fecha de Radicación: ${new Date().toISOString().split('T')[0]}\n\nEstado: RADICADA\nSiguiente etapa: Causación Contable`);
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
      alert('❌ ERROR\n\nLa observación debe tener al menos 10 caracteres.\n\nSea específico sobre el motivo de la devolución.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`✅ FACTURA DEVUELTA\n\nFactura: ${facturaSeleccionada?.numeroFactura}\nProveedor: ${facturaSeleccionada?.proveedor}\n\nMotivo de devolución:\n${observaciones}\n\n📧 Se ha notificado al funcionario para que corrija la información.\n\nEstado: DEVUELTA\nVuelve a: Funcionario (${facturaSeleccionada?.areaSolicitante})`);
      setFacturaSeleccionada(null);
      setAccion(null);
      setObservaciones('');
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Radicación de Facturas</h1>
          <p className="text-slate-600">
            Revise las facturas recibidas y proceda con la radicación o devolución según corresponda
          </p>
        </div>

        {/* Vista de lista */}
        {!facturaSeleccionada && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Facturas Pendientes de Radicación</CardTitle>
                  <CardDescription>
                    {facturasPendientes.length} factura(s) en estado "Recibida"
                  </CardDescription>
                </div>
                <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                  Estado: Recibida
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Área</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">F. Recepción</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Documentos</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasPendientes.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-800">
                          {factura.numeroFactura}
                        </TableCell>
                        <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                        <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          ${factura.valorTotal.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-slate-600">{factura.fechaRecepcion}</TableCell>
                        <TableCell>
                          <span className={`font-medium ${
                            factura.diasTranscurridos > 3 ? 'text-red-600' : 'text-slate-600'
                          }`}>
                            {factura.diasTranscurridos} días
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-slate-600">{factura.documentosAdjuntos} archivos</span>
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => verDetalle(factura)}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Revisar
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
                  Detalle de Factura - {facturaSeleccionada.numeroFactura}
                </CardTitle>
                <CardDescription>
                  Revise la información y los documentos antes de radicar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Información de la factura */}
                <div className="bg-slate-50 rounded-lg p-6 grid grid-cols-2 gap-6">
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
                    <p className="text-sm text-slate-500 mb-1">Fecha Emisión Factura</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <p className="font-semibold text-slate-800">{facturaSeleccionada.fechaFactura}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Fecha Recepción Universidad</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-red-600" />
                      <p className="font-semibold text-red-600">{facturaSeleccionada.fechaRecepcion}</p>
                    </div>
                    <p className="text-xs text-red-600 mt-1">Inicio del SLA (17 días hábiles)</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Área Solicitante</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="font-semibold text-slate-800">{facturaSeleccionada.areaSolicitante}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Días Transcurridos</p>
                    <p className={`font-semibold ${
                      facturaSeleccionada.diasTranscurridos > 3 ? 'text-red-600' : 'text-slate-800'
                    }`}>
                      {facturaSeleccionada.diasTranscurridos} días
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-sm text-slate-500 mb-1">Descripción</p>
                    <p className="text-slate-800">{facturaSeleccionada.descripcion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Documentos Adjuntos</p>
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-blue-600" />
                      <p className="font-semibold text-blue-600">
                        {facturaSeleccionada.documentosAdjuntos} archivos
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Estado Actual</p>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      Recibida
                    </Badge>
                  </div>
                </div>

                {/* Acciones */}
                {!accion && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={iniciarRadicacion}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      Radicar Factura
                    </Button>
                    <Button
                      onClick={iniciarDevolucion}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Devolver (Información Incompleta)
                    </Button>
                  </div>
                )}

                {/* Formulario de radicación */}
                <AnimatePresence>
                  {accion === 'radicar' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200 pt-6 space-y-4"
                    >
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-green-700 mb-1">Radicar Factura</h3>
                            <p className="text-sm text-green-600">
                              Al confirmar, se generará el número de radicado y la factura pasará a estado "Radicada".
                              La fecha de radicación quedará registrada en el sistema.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="numeroRadicado" className="text-slate-700 font-medium">
                          Número de Radicado (Generado automáticamente)
                        </Label>
                        <Input
                          id="numeroRadicado"
                          value={numeroRadicado}
                          onChange={(e) => setNumeroRadicado(e.target.value)}
                          className="bg-slate-50 font-semibold"
                        />
                        <p className="text-xs text-slate-500">
                          📅 Fecha de Radicación: {new Date().toISOString().split('T')[0]}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacionesRadicacion" className="text-slate-700 font-medium">
                          Observaciones (Opcional)
                        </Label>
                        <Textarea
                          id="observacionesRadicacion"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Observaciones adicionales sobre la radicación"
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
                          onClick={confirmarRadicacion}
                          disabled={procesando}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
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
                              Confirmar Radicación
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
                            <h3 className="font-semibold text-red-700 mb-1">Devolver Factura</h3>
                            <p className="text-sm text-red-600">
                              La factura será devuelta al funcionario para corrección. Debe especificar OBLIGATORIAMENTE
                              el motivo de la devolución en las observaciones.
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
                          placeholder="Especifique claramente qué documentos faltan o qué información debe corregirse..."
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
