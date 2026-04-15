import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import { Badge } from '../../../share/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../../../share/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../share/table';
import {
  FileCheck,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  FileText,
  User,
  Building2,
  DollarSign,
  ArrowLeft,
  Send,
  Upload,
  Download,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import TableFilters from '../../../share/table-filters';

type DocumentoAdjunto = {
  id: string;
  nombre: string;
  tipo: 'Factura' | 'Orden' | 'Certificacion' | 'Otro';
  tamano: number;
  url?: string;
};

const DOCUMENTOS_REQUERIDOS = [
  { tipo: 'Factura', label: 'Factura Original', icono: '📄' },
  { tipo: 'Orden', label: 'Orden de Compra / Contrato', icono: '📋' },
  { tipo: 'Certificacion', label: 'Certificación Bancaria del Proveedor', icono: '🏦' },
] as const;

interface Factura {
  id: string;
  numeroFactura: string;
  nit: string;
  proveedor: string;
  valorTotal: number;
  fechaFactura: string;
  fechaRecepcion: string;
  areaSolicitante: string;
  estado: string;
  diasTranscurridos: number;
  descripcion: string;
  documentosAdjuntos: DocumentoAdjunto[];
}

const getDaysBetween = (from: string) => {
  const fecha = new Date(from);
  const hoy = new Date();
  return Math.max(0, Math.floor((hoy.getTime() - fecha.getTime()) / (1000 * 60 * 60 * 24)));
};

export default function RadicarFacturas() {
  const [facturasPendientes] = useState<Factura[]>([
    {
      id: '1',
      numeroFactura: 'FAC-2026-150',
      nit: '900345678-9',
      proveedor: 'Editorial Académica Colombia',
      valorTotal: 3200000,
      fechaFactura: '2026-04-01',
      fechaRecepcion: '2026-04-02',
      areaSolicitante: 'Biblioteca',
      estado: 'Recibida',
      diasTranscurridos: 12,
      descripcion: 'Suscripción anual a bases de datos académicas',
      documentosAdjuntos: [
        {
          id: 'doc-1',
          nombre: 'Factura_FAC-2026-150.pdf',
          tipo: 'Factura',
          tamano: 462000,
        },
      ],
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-152',
      nit: '900789456-1',
      proveedor: 'Servicios Médicos Especializados',
      valorTotal: 12500000,
      fechaFactura: '2026-03-27',
      fechaRecepcion: '2026-03-30',
      areaSolicitante: 'Enfermería',
      estado: 'Recibida',
      diasTranscurridos: 1,
      descripcion: 'Servicios médicos especializados mes de marzo',
      documentosAdjuntos: [
        {
          id: 'doc-2',
          nombre: 'Factura_FAC-2026-152.pdf',
          tipo: 'Factura',
          tamano: 320000,
        },
        {
          id: 'doc-3',
          nombre: 'Contrato_Servicios_Medicos.pdf',
          tipo: 'Orden',
          tamano: 960000,
        },
        {
          id: 'doc-4',
          nombre: 'Certificacion_Bancaria_Proveedor.pdf',
          tipo: 'Certificacion',
          tamano: 250000,
        },
      ],
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-138',
      nit: '901112223-4',
      proveedor: 'Editorial Académica Colombia',
      valorTotal: 6750000,
      fechaFactura: '2026-03-20',
      fechaRecepcion: '2026-03-26',
      areaSolicitante: 'Biblioteca',
      estado: 'Recibida',
      diasTranscurridos: 4,
      descripcion: 'Libros académicos y material bibliográfico',
      documentosAdjuntos: [
        {
          id: 'doc-5',
          nombre: 'Factura_FAC-2026-138.pdf',
          tipo: 'Factura',
          tamano: 280000,
        },
        {
          id: 'doc-6',
          nombre: 'Orden_Compra_Biblioteca.pdf',
          tipo: 'Orden',
          tamano: 310000,
        },
      ],
    },
  ]);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [accion, setAccion] = useState<'radicar' | 'devolver' | null>(null);
  const [numeroRadicado, setNumeroRadicado] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: 'Recibida',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  });
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null);

  const facturasFiltradas = facturasPendientes.filter((factura) => {
    if (
      filtros.numeroFactura &&
      !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())
    ) {
      return false;
    }
    if (filtros.proveedor && factura.proveedor !== filtros.proveedor) {
      return false;
    }
    if (filtros.estado && factura.estado !== filtros.estado) {
      return false;
    }
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) {
      return false;
    }
    if (filtros.fechaInicio && factura.fechaRecepcion < filtros.fechaInicio) {
      return false;
    }
    if (filtros.fechaFin && factura.fechaRecepcion > filtros.fechaFin) {
      return false;
    }
    if (filtros.montoMin && factura.valorTotal < Number(filtros.montoMin)) {
      return false;
    }
    if (filtros.montoMax && factura.valorTotal > Number(filtros.montoMax)) {
      return false;
    }
    return true;
  });

  const esDocumentoTipo = (doc: DocumentoAdjunto, tipoRequerido: string): boolean => {
    if (doc.tipo === tipoRequerido) return true;
    const nombreLower = doc.nombre.toLowerCase();
    if (tipoRequerido === 'Factura' && nombreLower.includes('factura')) return true;
    if (tipoRequerido === 'Orden' && (nombreLower.includes('orden') || nombreLower.includes('contrato'))) return true;
    if (tipoRequerido === 'Certificacion' && (nombreLower.includes('certif') || nombreLower.includes('bancari'))) return true;
    return false;
  };

  const validarDocumentosCompletos = (factura: Factura): boolean => {
    return DOCUMENTOS_REQUERIDOS.every((req) =>
      factura.documentosAdjuntos.some((doc) => esDocumentoTipo(doc, req.tipo))
    );
  };

  const obtenerDocumentosFaltantes = (factura: Factura): string[] => {
    const faltantes: string[] = [];
    for (const req of DOCUMENTOS_REQUERIDOS) {
      const found = factura.documentosAdjuntos.some((doc) => esDocumentoTipo(doc, req.tipo));
      if (!found) faltantes.push(req.label);
    }
    return faltantes;
  };

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setAccion(null);
    setObservaciones('');
    setNumeroRadicado(
      `RAD-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(5, '0')}`
    );
  };

  const verPanelDetalle = (factura: Factura) => {
    setFacturaDetalle(factura);
    setMostrarDialogDetalle(true);
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
      alert(
        `✅ FACTURA RADICADA EXITOSAMENTE\n\nNúmero de Radicado: ${numeroRadicado}\nFactura: ${facturaSeleccionada?.numeroFactura}\nProveedor: ${facturaSeleccionada?.proveedor}\n\n📅 Fecha de Radicación: ${new Date().toISOString().split('T')[0]}\n\nEstado: RADICADA\nSiguiente etapa: Causación Contable`
      );
      setFacturaSeleccionada(null);
      setAccion(null);
    }, 1500);
  };

  const confirmarDevolucion = () => {
    if (!observaciones.trim()) {
      alert(
        '❌ ERROR\n\nLa observación es OBLIGATORIA cuando se devuelve una factura.\n\nDebe especificar claramente el motivo de la devolución.'
      );
      return;
    }

    if (observaciones.trim().length < 10) {
      alert(
        '❌ ERROR\n\nLa observación debe tener al menos 10 caracteres.\n\nSea específico sobre el motivo de la devolución.'
      );
      return;
    }

    setProcesando(true);
    setTimeout(() => {
      setProcesando(false);
      alert(
        `✅ FACTURA DEVUELTA\n\nFactura: ${facturaSeleccionada?.numeroFactura}\nProveedor: ${facturaSeleccionada?.proveedor}\n\nMotivo de devolución:\n${observaciones}\n\n📧 Se ha notificado al funcionario para que corrija la información.\n\nEstado: DEVUELTA\nVuelve a: Funcionario (${facturaSeleccionada?.areaSolicitante})`
      );
      setFacturaSeleccionada(null);
      setAccion(null);
      setObservaciones('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <FileCheck className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-2xl font-bold">Radicar Facturas</h1>
            <p className="text-red-100 text-sm">
              Formalizar la entrada de documentos al sistema institucional
            </p>
          </div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {/* Vista de lista */}
        {!facturaSeleccionada && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.1 }}
          >
            <div className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <TableFilters
                  filters={filtros}
                  onFilterChange={setFiltros}
                  estados={['Recibida']}
                  proveedores={Array.from(new Set(facturasPendientes.map((f) => f.proveedor)))}
                  areas={Array.from(new Set(facturasPendientes.map((f) => f.areaSolicitante)))}
                  showMontoFilter={true}
                  showFechaFilter={true}
                  showAreaFilter={true}
                />
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-slate-800">
                      Facturas Pendientes de Radicación
                    </CardTitle>
                    <CardDescription>
                      {facturasFiltradas.length} factura(s) en estado "Recibida"
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50">
                        <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                        <TableHead className="font-semibold text-slate-700">N° Factura</TableHead>
                        <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                        <TableHead className="font-semibold text-slate-700">NIT</TableHead>
                        <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                        <TableHead className="font-semibold text-slate-700">Área</TableHead>
                        <TableHead className="font-semibold text-slate-700">Fecha Recepción</TableHead>
                        <TableHead className="font-semibold text-slate-700">Días</TableHead>
                        <TableHead className="font-semibold text-slate-700">Documentos</TableHead>
                        <TableHead className="font-semibold text-slate-700">Descripción</TableHead>
                        <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {facturasFiltradas.map((factura) => {
                        const diasTranscurridos = getDaysBetween(factura.fechaRecepcion);
                        const docsCompletos = validarDocumentosCompletos(factura);
                        const docsFaltantes = obtenerDocumentosFaltantes(factura);
                        let nivelSla: 'verde' | 'amarillo' | 'naranja' | 'vencido' = 'verde';
                        if (diasTranscurridos >= 24) nivelSla = 'vencido';
                        else if (diasTranscurridos >= 18) nivelSla = 'naranja';
                        else if (diasTranscurridos >= 12) nivelSla = 'amarillo';

                        const dotClass =
                          nivelSla === 'vencido'
                            ? 'bg-purple-700'
                            : nivelSla === 'naranja'
                              ? 'bg-orange-500'
                              : nivelSla === 'amarillo'
                                ? 'bg-yellow-500'
                                : 'bg-green-500';

                        return (
                        <TableRow key={factura.id} className="hover:bg-slate-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${dotClass}`} />
                              {nivelSla === 'vencido' && <AlertCircle className="w-4 h-4 text-purple-700" />}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">
                            {factura.numeroFactura}
                          </TableCell>
                          <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                          <TableCell className="text-slate-500 text-sm font-mono">{factura.nit}</TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            ${factura.valorTotal.toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {factura.areaSolicitante}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {factura.fechaRecepcion}
                          </TableCell>
                          <TableCell>
                            <span
                              className={`font-medium ${
                                nivelSla === 'vencido'
                                  ? 'text-purple-700'
                                  : nivelSla === 'naranja'
                                    ? 'text-orange-600'
                                    : nivelSla === 'amarillo'
                                      ? 'text-yellow-700'
                                      : 'text-green-700'
                              }`}
                            >
                              {diasTranscurridos}d
                            </span>
                          </TableCell>
                          <TableCell>
                            {docsCompletos ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 border">
                                Completos ({factura.documentosAdjuntos.length}/3)
                              </Badge>
                            ) : (
                              <div className="space-y-1">
                                <Badge className="bg-red-100 text-red-700 border-red-200 border">
                                  Incompletos ({factura.documentosAdjuntos.length}/3)
                                </Badge>
                                <p className="text-xs text-red-600 max-w-[220px]">
                                  Faltan: {docsFaltantes.join(', ')}
                                </p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="text-slate-600 max-w-[260px] truncate" title={factura.descripcion}>
                            {factura.descripcion}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => verPanelDetalle(factura)}
                                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                              >
                                <FileText className="w-4 h-4 mr-1" />
                                Detalle
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setFacturaSeleccionada(factura);
                                  iniciarDevolucion();
                                }}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Devolver
                              </Button>
                              {docsCompletos && (
                                <Button
                                  size="sm"
                                  onClick={() => verDetalle(factura)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <FileCheck className="w-4 h-4 mr-1" />
                                  Radicar
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
            </div>
          </motion.div>
        )}

        {/* Vista de detalle */}
        {facturaSeleccionada && !accion && (
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Button
              onClick={() => {
                setFacturaSeleccionada(null);
                setAccion(null);
              }}
              variant="outline"
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
                      <p className="font-semibold text-red-600">
                        {facturaSeleccionada.fechaRecepcion}
                      </p>
                    </div>
                    <p className="text-xs text-red-600 mt-1">Inicio del SLA (17 días hábiles)</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Área Solicitante</p>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      <p className="font-semibold text-slate-800">
                        {facturaSeleccionada.areaSolicitante}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500 mb-1">Días Transcurridos</p>
                    <p
                      className={`font-semibold ${facturaSeleccionada.diasTranscurridos > 3 ? 'text-red-600' : 'text-slate-800'}`}
                    >
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
                        {facturaSeleccionada.documentosAdjuntos.length} archivos
                      </p>
                    </div>
                  </div>
                </div>

                {/* Botones de acción */}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <Button
                    onClick={iniciarRadicacion}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg h-auto"
                  >
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Radicar Factura
                  </Button>
                  <Button
                    onClick={iniciarDevolucion}
                    variant="outline"
                    className="flex-1 border-red-600 text-red-600 hover:bg-red-50 py-6 text-lg h-auto"
                  >
                    <XCircle className="w-5 h-5 mr-2" />
                    Devolver Factura
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Vista de radicación */}
        {facturaSeleccionada && accion === 'radicar' && (
          <motion.div
            key="radicar"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Button
              onClick={() => setAccion(null)}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>

            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 border-b border-green-200">
                <CardTitle className="text-green-800 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" />
                  Proceder con Radicación
                </CardTitle>
                <CardDescription>
                  Confirme los datos y el número de radicado antes de radicar la factura
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Resumen de la factura */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Resumen de la Factura</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Factura</p>
                      <p className="font-bold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Proveedor</p>
                      <p className="font-bold text-slate-800">
                        {facturaSeleccionada.proveedor}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Monto</p>
                      <p className="font-bold text-green-600 text-lg">
                        ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Área</p>
                      <p className="font-bold text-slate-800">
                        {facturaSeleccionada.areaSolicitante}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Número de Radicado */}
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">Número de Radicado</Label>
                  <div className="flex gap-2">
                    <Input
                      value={numeroRadicado}
                      readOnly
                      className="font-bold bg-slate-100 border-slate-300"
                    />
                    <Button
                      onClick={() =>
                        setNumeroRadicado(
                          `RAD-2026-${String(Math.floor(Math.random() * 900) + 100).padStart(5, '0')}`
                        )
                      }
                      variant="outline"
                    >
                      Generar Nuevo
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500">
                    Sistema genera automáticamente, puede regenerar si lo requiere
                  </p>
                </div>

                {/* Observaciones opcionales */}
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold">
                    Observaciones (Opcional)
                  </Label>
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Agregar cualquier observación importante sobre la radicación..."
                    className="min-h-24 border-slate-300"
                  />
                </div>

                {/* Botones finales */}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
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
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg h-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {procesando ? 'Procesando...' : 'Confirmar Radicación'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Vista de devolución */}
        {facturaSeleccionada && accion === 'devolver' && (
          <motion.div
            key="devolver"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
          >
            <Button
              onClick={() => setAccion(null)}
              variant="outline"
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>

            <Card className="border-0 shadow-lg border-red-200">
              <CardHeader className="bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
                <CardTitle className="text-red-800 flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Devolver Factura
                </CardTitle>
                <CardDescription>
                  Especifique el motivo de la devolución con claridad
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {/* Resumen de la factura */}
                <div className="bg-slate-50 rounded-lg p-6">
                  <h3 className="font-bold text-slate-800 mb-4">Datos de la Factura</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Factura</p>
                      <p className="font-bold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Proveedor</p>
                      <p className="font-bold text-slate-800">
                        {facturaSeleccionada.proveedor}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Motivo de devolución */}
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold text-red-700">
                    * Motivo de Devolución (Requerido)
                  </Label>
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Especifique claramente qué correcciones o documentos falta completar..."
                    className="min-h-32 border-red-300 focus:border-red-600 focus:ring-red-600"
                  />
                  <p className="text-xs text-slate-500">
                    Mínimo 10 caracteres. El funcionario recibirá esta observación.
                  </p>
                </div>

                {/* Botones finales */}
                <div className="flex gap-4 pt-4 border-t border-slate-200">
                  <Button
                    onClick={() => setAccion(null)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={confirmarDevolucion}
                    disabled={procesando}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6 text-lg h-auto"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {procesando ? 'Procesando...' : 'Confirmar Devolución'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={mostrarDialogDetalle}
        onOpenChange={(open) => {
          setMostrarDialogDetalle(open);
          if (!open) setFacturaDetalle(null);
        }}
      >
        <DialogContent className="max-w-5xl w-[95vw] max-h-[92vh] overflow-y-auto p-0 border-0 shadow-2xl">
          {facturaDetalle && (
            <div className="bg-gradient-to-b from-slate-50 to-white">
              <DialogHeader className="px-8 py-6 border-b border-slate-200 bg-white sticky top-0 z-10">
                <DialogTitle className="flex items-center gap-3 text-slate-800 text-2xl">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                  <span>Detalle de Factura - {facturaDetalle.numeroFactura}</span>
                </DialogTitle>
                <DialogDescription className="text-base">
                  Información completa y checklist documental para radicación
                </DialogDescription>
              </DialogHeader>

              <div className="p-8 space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold mb-1">Proveedor</p>
                      <h3 className="text-3xl font-bold text-slate-900 leading-tight">{facturaDetalle.proveedor}</h3>
                      <p className="text-sm text-slate-500 mt-1">NIT: <span className="font-mono font-semibold text-slate-700">{facturaDetalle.nit}</span></p>
                    </div>
                    <div className="text-left lg:text-right">
                      <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Valor Total</p>
                      <p className="text-4xl font-extrabold text-slate-900">${facturaDetalle.valorTotal.toLocaleString('es-CO')}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Área Solicitante</p>
                      <p className="text-2xl font-bold text-slate-800">{facturaDetalle.areaSolicitante}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Fecha Factura</p>
                      <p className="text-2xl font-bold text-slate-800">{facturaDetalle.fechaFactura}</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-4 bg-slate-50">
                      <p className="text-xs uppercase text-slate-500 font-semibold mb-1">Fecha Recepción</p>
                      <p className="text-2xl font-bold text-slate-800">{facturaDetalle.fechaRecepcion}</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className="p-5 rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
                >
                  <Label className="text-blue-900 text-xs uppercase font-semibold tracking-wide">Descripción</Label>
                  <p className="text-blue-900 mt-2 text-2xl leading-snug">{facturaDetalle.descripcion}</p>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <h3 className="font-bold text-slate-900 flex items-center gap-2 text-3xl">
                      <Upload className="w-5 h-5 text-blue-600" />
                      Checklist de Documentos Requeridos
                    </h3>
                    <Badge
                      className={
                        validarDocumentosCompletos(facturaDetalle)
                          ? 'bg-green-100 text-green-700 border-green-200 border'
                          : 'bg-red-100 text-red-700 border-red-200 border'
                      }
                    >
                      {validarDocumentosCompletos(facturaDetalle)
                        ? 'Documentos Completos'
                        : 'Documentos Incompletos'}
                    </Badge>
                  </div>

                  <div className="w-full bg-slate-100 rounded-full h-2 mb-5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${
                          (DOCUMENTOS_REQUERIDOS.filter((d) =>
                            facturaDetalle.documentosAdjuntos.some((doc) => esDocumentoTipo(doc, d.tipo))
                          ).length /
                            DOCUMENTOS_REQUERIDOS.length) *
                          100
                        }%`,
                      }}
                      transition={{ duration: 0.45 }}
                      className={`h-2 rounded-full ${
                        validarDocumentosCompletos(facturaDetalle) ? 'bg-green-500' : 'bg-amber-500'
                      }`}
                    />
                  </div>

                  <div className="space-y-3">
                    {DOCUMENTOS_REQUERIDOS.map((docReq, index) => {
                      const documento = facturaDetalle.documentosAdjuntos.find((doc) =>
                        esDocumentoTipo(doc, docReq.tipo)
                      );
                      const existe = !!documento;

                      return (
                        <motion.div
                          key={docReq.tipo}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.14 + index * 0.06 }}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            existe
                              ? 'bg-green-50 border-green-200 hover:border-green-300'
                              : 'bg-red-50 border-red-200 hover:border-red-300'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{docReq.icono}</span>
                              <div>
                                <p className={`font-semibold text-lg ${existe ? 'text-green-900' : 'text-red-900'}`}>
                                  {docReq.label}
                                </p>
                                <p className={`text-sm ${existe ? 'text-green-700' : 'text-red-700'}`}>
                                  {existe ? 'Documento adjunto' : 'Documento faltante'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {existe && documento && (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-blue-300 text-blue-700 hover:bg-blue-50"
                                  >
                                    <ExternalLink className="w-4 h-4 mr-1" />
                                    Ver
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                                  >
                                    <Download className="w-4 h-4 mr-1" />
                                    Descargar
                                  </Button>
                                </>
                              )}
                              {existe ? (
                                <CheckCircle2 className="w-6 h-6 text-green-600" />
                              ) : (
                                <AlertTriangle className="w-6 h-6 text-red-600" />
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {!validarDocumentosCompletos(facturaDetalle) && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg"
                    >
                      <p className="text-amber-800 text-sm font-semibold">
                        No se puede radicar esta factura hasta completar todos los documentos requeridos.
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
