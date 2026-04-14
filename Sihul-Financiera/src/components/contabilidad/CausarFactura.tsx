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
  FileText, Building2, DollarSign, ArrowLeft, Send, Hash
} from 'lucide-react';

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  proveedor: string;
  valorTotal: number;
  fechaFactura: string;
  fechaRecepcion: string;
  fechaRadicacion: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
}

export default function CausarFactura() {
  const [facturasRadicadas] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      numeroRadicado: 'RAD-2026-00145',
      proveedor: 'Tecnología Global SAS',
      valorTotal: 8900000,
      fechaFactura: '2026-03-25',
      fechaRecepcion: '2026-03-28',
      fechaRadicacion: '2026-03-29',
      areaSolicitante: 'Sistemas',
      estado: 'Radicada',
      diasTranscurridos: 2,
      descripcion: 'Equipos de cómputo para área administrativa'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-152',
      numeroRadicado: 'RAD-2026-00152',
      proveedor: 'Servicios Médicos Especializados',
      valorTotal: 12500000,
      fechaFactura: '2026-03-27',
      fechaRecepcion: '2026-03-30',
      fechaRadicacion: '2026-03-31',
      areaSolicitante: 'Enfermería',
      estado: 'Radicada',
      diasTranscurridos: 1,
      descripcion: 'Servicios médicos especializados mes de marzo'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-161',
      numeroRadicado: 'RAD-2026-00161',
      proveedor: 'Mantenimiento y Obras SAS',
      valorTotal: 15400000,
      fechaFactura: '2026-03-28',
      fechaRecepcion: '2026-03-31',
      fechaRadicacion: '2026-03-31',
      areaSolicitante: 'Infraestructura',
      estado: 'Radicada',
      diasTranscurridos: 0,
      descripcion: 'Mantenimiento de infraestructura física'
    }
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'causar' | 'devolver' | null>(null);
  const [cuentaContable, setCuentaContable] = useState('');
  const [centroCosto, setCentroCosto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);

  // Opciones de cuentas contables
  const cuentasContables = [
    '5105 - Gastos de Personal',
    '5110 - Honorarios',
    '5115 - Servicios',
    '5120 - Arrendamientos',
    '5135 - Servicios Públicos',
    '5140 - Mantenimiento y Reparaciones',
    '5145 - Adecuación e Instalación',
    '5195 - Diversos',
    '5205 - Gastos de Viaje'
  ];

  const centrosCosto = [
    'CC-100 - Administración General',
    'CC-200 - Académico',
    'CC-300 - Investigación',
    'CC-400 - Extensión',
    'CC-500 - Bienestar',
    'CC-600 - Infraestructura',
    'CC-700 - Tecnología'
  ];

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setAccion(null);
    setObservaciones('');
    setCuentaContable('');
    setCentroCosto('');
  };

  const iniciarCausacion = () => {
    setAccion('causar');
  };

  const iniciarDevolucion = () => {
    setAccion('devolver');
    setObservaciones('');
  };

  const confirmarCausacion = () => {
    if (!cuentaContable) {
      alert('❌ ERROR\n\nDebe seleccionar una cuenta contable para causar la factura.');
      return;
    }

    if (!centroCosto) {
      alert('❌ ERROR\n\nDebe seleccionar un centro de costo para causar la factura.');
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(`✅ FACTURA CAUSADA EXITOSAMENTE\n\nFactura: ${facturaSeleccionada?.numeroFactura}\nRadicado: ${facturaSeleccionada?.numeroRadicado}\nProveedor: ${facturaSeleccionada?.proveedor}\n\n📊 Cuenta Contable: ${cuentaContable}\n🏢 Centro de Costo: ${centroCosto}\n📅 Fecha de Causación: ${new Date().toISOString().split('T')[0]}\n\nEstado: CAUSADA\nSiguiente etapa: Alistamiento en Tesorería`);
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
      alert(`✅ FACTURA DEVUELTA\n\nFactura: ${facturaSeleccionada?.numeroFactura}\nRadicado: ${facturaSeleccionada?.numeroRadicado}\nProveedor: ${facturaSeleccionada?.proveedor}\n\nMotivo de devolución:\n${observaciones}\n\n📧 Se ha notificado al funcionario para que corrija la información.\n\nEstado: DEVUELTA\nVuelve a: Funcionario (${facturaSeleccionada?.areaSolicitante})\n\nDebe volver a pasar por Radicación antes de poder Causarse nuevamente.`);
      setFacturaSeleccionada(null);
      setAccion(null);
      setObservaciones('');
    }, 1500);
  };

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Causación Contable</h1>
          <p className="text-slate-600">
            Registre contablemente las facturas radicadas y asigne las cuentas correspondientes
          </p>
        </div>

        {/* Vista de lista */}
        {!facturaSeleccionada && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-slate-800">Facturas Pendientes de Causación</CardTitle>
                  <CardDescription>
                    {facturasRadicadas.length} factura(s) en estado "Radicada"
                  </CardDescription>
                </div>
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  Estado: Radicada
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
                      <TableHead className="font-semibold text-slate-700">Área</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">F. Radicación</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasRadicadas.map((factura) => (
                      <TableRow key={factura.id} className="hover:bg-slate-50">
                        <TableCell className="font-medium text-slate-800">
                          {factura.numeroFactura}
                        </TableCell>
                        <TableCell className="text-blue-600 font-medium">
                          {factura.numeroRadicado}
                        </TableCell>
                        <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                        <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                        <TableCell className="font-semibold text-slate-800">
                          ${factura.valorTotal.toLocaleString('es-CO')}
                        </TableCell>
                        <TableCell className="text-slate-600">{factura.fechaRadicacion}</TableCell>
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
                  Causación Contable - {facturaSeleccionada.numeroFactura}
                </CardTitle>
                <CardDescription>
                  Asigne la cuenta contable y centro de costo correspondiente
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
                      <p className="text-sm text-slate-500 mb-1">Número de Radicado</p>
                      <div className="flex items-center gap-2">
                        <Hash className="w-4 h-4 text-blue-600" />
                        <p className="font-semibold text-blue-600">{facturaSeleccionada.numeroRadicado}</p>
                      </div>
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
                        <p className="text-xs text-slate-500 mb-1">Fecha Emisión</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          <p className="text-sm font-semibold text-slate-800">{facturaSeleccionada.fechaFactura}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-red-600 mb-1">Fecha Recepción (SLA)</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-red-600" />
                          <p className="text-sm font-semibold text-red-600">{facturaSeleccionada.fechaRecepcion}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-green-600 mb-1">Fecha Radicación</p>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-green-600" />
                          <p className="text-sm font-semibold text-green-600">{facturaSeleccionada.fechaRadicacion}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Descripción</p>
                    <p className="text-slate-800">{facturaSeleccionada.descripcion}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Estado Actual</p>
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      Radicada
                    </Badge>
                  </div>
                </div>

                {/* Acciones */}
                {!accion && (
                  <div className="flex gap-4 pt-4">
                    <Button
                      onClick={iniciarCausacion}
                      className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      <FileCheck className="w-4 h-4 mr-2" />
                      Causar Factura
                    </Button>
                    <Button
                      onClick={iniciarDevolucion}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Devolver (Error en Información)
                    </Button>
                  </div>
                )}

                {/* Formulario de causación */}
                <AnimatePresence>
                  {accion === 'causar' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-t border-slate-200 pt-6 space-y-4"
                    >
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex gap-3">
                          <CheckCircle2 className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <h3 className="font-semibold text-purple-700 mb-1">Causación Contable</h3>
                            <p className="text-sm text-purple-600">
                              Al confirmar, se reconocerá contablemente la obligación y la factura pasará a estado "Causada".
                              La fecha de causación quedará registrada en el sistema.
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="cuentaContable" className="text-slate-700 font-medium">
                          Cuenta Contable <span className="text-red-600">*</span>
                        </Label>
                        <select
                          id="cuentaContable"
                          value={cuentaContable}
                          onChange={(e) => setCuentaContable(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-700"
                        >
                          <option value="">Seleccione una cuenta contable</option>
                          {cuentasContables.map(cuenta => (
                            <option key={cuenta} value={cuenta}>{cuenta}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="centroCosto" className="text-slate-700 font-medium">
                          Centro de Costo <span className="text-red-600">*</span>
                        </Label>
                        <select
                          id="centroCosto"
                          value={centroCosto}
                          onChange={(e) => setCentroCosto(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-700"
                        >
                          <option value="">Seleccione un centro de costo</option>
                          {centrosCosto.map(centro => (
                            <option key={centro} value={centro}>{centro}</option>
                          ))}
                        </select>
                      </div>

                      <div className="bg-slate-100 rounded-lg p-4">
                        <p className="text-sm text-slate-700">
                          📅 <strong>Fecha de Causación:</strong> {new Date().toISOString().split('T')[0]}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="observacionesCausacion" className="text-slate-700 font-medium">
                          Observaciones (Opcional)
                        </Label>
                        <Textarea
                          id="observacionesCausacion"
                          value={observaciones}
                          onChange={(e) => setObservaciones(e.target.value)}
                          placeholder="Observaciones adicionales sobre la causación"
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
                          onClick={confirmarCausacion}
                          disabled={procesando}
                          className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
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
                              Confirmar Causación
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
                              La factura será devuelta al origen para corrección. Debe especificar OBLIGATORIAMENTE
                              el motivo de la devolución. El proceso deberá volver a pasar por Radicación y Causación.
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
                          placeholder="Especifique claramente qué información debe corregirse o qué documentos adicionales se requieren..."
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
