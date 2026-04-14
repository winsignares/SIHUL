import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { 
  FileCheck, CheckCircle2, FileText, Calendar, AlertCircle, XCircle, 
  Upload, Eye, Clock, AlertTriangle, Download, ExternalLink 
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import TableFilters from '../ui/table-filters';
import { useFacturas, type Factura } from '../../contexts/FacturasContext';

// Tipos de documentos requeridos (validación estricta)
const DOCUMENTOS_REQUERIDOS = [
  { tipo: 'Factura', label: 'Factura Original', icono: '📄' },
  { tipo: 'Orden', label: 'Orden de Compra / Contrato', icono: '📋' },
  { tipo: 'Certificacion', label: 'Certificación Bancaria del Proveedor', icono: '🏦' }
];

export default function RadicarFacturas() {
  const { facturas: todasLasFacturas, actualizarFactura } = useFacturas();
  
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: ''
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDialogRadicar, setMostrarDialogRadicar] = useState(false);
  const [mostrarDialogDetalle, setMostrarDialogDetalle] = useState(false);
  const [mostrarDialogDevolver, setMostrarDialogDevolver] = useState(false);
  const [observaciones, setObservaciones] = useState('');
  const [motivoDevolucion, setMotivoDevolucion] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Filtrar solo facturas en estado "Recibida"
  const facturasPendientes = todasLasFacturas.filter(f => f.estado === 'Recibida');

  // Función de validación estricta de documentos MEJORADA
  const validarDocumentosCompletos = (factura: Factura): boolean => {
    const documentos = factura.documentosAdjuntos || [];
    
    // Debug: Ver qué documentos tiene la factura
    console.log('🔍 VALIDANDO FACTURA:', factura.numeroFactura);
    console.log('📎 Documentos adjuntos:', documentos);
    
    // Verificar que haya al menos 3 documentos
    if (documentos.length < 3) {
      console.log('❌ Tiene menos de 3 documentos:', documentos.length);
      return false;
    }

    // Verificar que existan los 3 tipos requeridos
    const tiposEncontrados = {
      Factura: false,
      Orden: false,
      Certificacion: false
    };

    documentos.forEach(doc => {
      console.log(`  📄 Documento: ${doc.nombre} | Tipo: ${doc.tipo}`);
      
      // Validar por el campo 'tipo' directamente (más confiable)
      if (doc.tipo === 'Factura') {
        tiposEncontrados.Factura = true;
      } else if (doc.tipo === 'Orden') {
        tiposEncontrados.Orden = true;
      } else if (doc.tipo === 'Certificacion') {
        tiposEncontrados.Certificacion = true;
      }
      // Fallback: validar por nombre si el tipo no está definido
      else {
        const nombreLower = doc.nombre.toLowerCase();
        if (nombreLower.includes('factura')) {
          tiposEncontrados.Factura = true;
        } else if (nombreLower.includes('orden') || nombreLower.includes('contrato')) {
          tiposEncontrados.Orden = true;
        } else if (nombreLower.includes('certif') || nombreLower.includes('bancari')) {
          tiposEncontrados.Certificacion = true;
        }
      }
    });

    console.log('✅ Tipos encontrados:', tiposEncontrados);
    
    const completo = tiposEncontrados.Factura && tiposEncontrados.Orden && tiposEncontrados.Certificacion;
    console.log(completo ? '✅ DOCUMENTOS COMPLETOS' : '❌ DOCUMENTOS INCOMPLETOS');
    
    return completo;
  };

  // Obtener lista de documentos faltantes
  const obtenerDocumentosFaltantes = (factura: Factura): string[] => {
    const documentos = factura.documentosAdjuntos || [];
    const faltantes: string[] = [];

    const tiposEncontrados = {
      Factura: false,
      Orden: false,
      Certificacion: false
    };

    documentos.forEach(doc => {
      if (doc.tipo === 'Factura') {
        tiposEncontrados.Factura = true;
      } else if (doc.tipo === 'Orden') {
        tiposEncontrados.Orden = true;
      } else if (doc.tipo === 'Certificacion') {
        tiposEncontrados.Certificacion = true;
      } else {
        const nombreLower = doc.nombre.toLowerCase();
        if (nombreLower.includes('factura')) {
          tiposEncontrados.Factura = true;
        } else if (nombreLower.includes('orden') || nombreLower.includes('contrato')) {
          tiposEncontrados.Orden = true;
        } else if (nombreLower.includes('certif') || nombreLower.includes('bancari')) {
          tiposEncontrados.Certificacion = true;
        }
      }
    });

    if (!tiposEncontrados.Factura) faltantes.push('Factura Original');
    if (!tiposEncontrados.Orden) faltantes.push('Orden de Compra / Contrato');
    if (!tiposEncontrados.Certificacion) faltantes.push('Certificación Bancaria');

    return faltantes;
  };

  // Función para verificar si un documento es de un tipo específico
  const esDocumentoTipo = (doc: any, tipoRequerido: string): boolean => {
    // Primero verificar por el campo tipo directamente
    if (doc.tipo === tipoRequerido) return true;
    
    // Fallback: verificar por nombre
    const nombreLower = doc.nombre.toLowerCase();
    if (tipoRequerido === 'Factura' && nombreLower.includes('factura')) return true;
    if (tipoRequerido === 'Orden' && (nombreLower.includes('orden') || nombreLower.includes('contrato'))) return true;
    if (tipoRequerido === 'Certificacion' && (nombreLower.includes('certif') || nombreLower.includes('bancari'))) return true;
    
    return false;
  };

  // Función para ver/descargar documento
  const verDocumento = (doc: any) => {
    if (doc.url) {
      window.open(doc.url, '_blank');
    } else {
      toast.info('Vista previa', {
        description: `Documento: ${doc.nombre} (${(doc.tamano / 1024).toFixed(2)} KB)`
      });
    }
  };

  const descargarDocumento = (doc: any) => {
    if (doc.url) {
      const link = document.createElement('a');
      link.href = doc.url;
      link.download = doc.nombre;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Descarga iniciada', {
        description: doc.nombre
      });
    } else {
      toast.info('Descarga simulada', {
        description: `Descargando: ${doc.nombre}`
      });
    }
  };

  // Aplicar filtros
  const facturasFiltradas = facturasPendientes.filter(factura => {
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) {
      return false;
    }
    if (filtros.proveedor && !factura.proveedor.toLowerCase().includes(filtros.proveedor.toLowerCase())) {
      return false;
    }
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) {
      return false;
    }
    if (filtros.fechaInicio && new Date(factura.fechaRecepcion) < new Date(filtros.fechaInicio)) {
      return false;
    }
    if (filtros.fechaFin && new Date(factura.fechaRecepcion) > new Date(filtros.fechaFin)) {
      return false;
    }
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) {
      return false;
    }
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) {
      return false;
    }
    return true;
  });

  const abrirDialogRadicar = (factura: Factura) => {
    if (!validarDocumentosCompletos(factura)) {
      toast.error('Documentos incompletos', {
        description: 'La factura no tiene todos los documentos requeridos para radicar'
      });
      return;
    }
    setFacturaSeleccionada(factura);
    setObservaciones('');
    setMostrarDialogRadicar(true);
  };

  const abrirDialogDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDialogDetalle(true);
  };

  const abrirDialogDevolver = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMotivoDevolucion('');
    setMostrarDialogDevolver(true);
  };

  const radicarFactura = () => {
    if (!facturaSeleccionada) return;

    setIsProcessing(true);

    setTimeout(() => {
      const numeroRadicado = `RAD-2026-${String(Math.floor(Math.random() * 1000) + 100).padStart(3, '0')}`;
      const fechaActual = new Date().toISOString().split('T')[0];
      
      actualizarFactura(facturaSeleccionada.id, {
        estado: 'Radicada',
        numeroRadicado: numeroRadicado,
        fechaRadicacion: fechaActual,
        observaciones: observaciones || facturaSeleccionada.observaciones,
        historial: [
          ...facturaSeleccionada.historial,
          {
            fecha: new Date().toISOString(),
            accion: 'Radicación',
            responsable: 'Contabilidad - María González',
            observacion: observaciones || 'Radicación exitosa'
          }
        ]
      });
      
      toast.success('¡Factura radicada exitosamente!', {
        description: `N° Radicado: ${numeroRadicado} - Estado: Radicada`
      });

      setIsProcessing(false);
      setMostrarDialogRadicar(false);
      setFacturaSeleccionada(null);
      setObservaciones('');
    }, 1500);
  };

  const devolverFactura = () => {
    if (!facturaSeleccionada) return;
    if (!motivoDevolucion.trim()) {
      toast.error('Motivo obligatorio', {
        description: 'Debe indicar el motivo de la devolución'
      });
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const fechaActual = new Date().toISOString().split('T')[0];
      
      actualizarFactura(facturaSeleccionada.id, {
        estado: 'Devuelta',
        observaciones: `DEVUELTA: ${motivoDevolucion}`,
        historial: [
          ...facturaSeleccionada.historial,
          {
            fecha: new Date().toISOString(),
            accion: 'Devolución desde Contabilidad',
            responsable: 'Contabilidad - María González',
            observacion: motivoDevolucion
          }
        ]
      });
      
      toast.warning('Factura devuelta al Funcionario', {
        description: `Se ha notificado al área ${facturaSeleccionada.areaSolicitante}`
      });

      setIsProcessing(false);
      setMostrarDialogDevolver(false);
      setFacturaSeleccionada(null);
      setMotivoDevolucion('');
    }, 1200);
  };

  // Estadísticas
  const facturasCompletas = facturasFiltradas.filter(f => validarDocumentosCompletos(f)).length;
  const facturasIncompletas = facturasFiltradas.length - facturasCompletas;

  return (
    <div className="p-8 space-y-6">
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
            <h1 className="text-white mb-1">Radicar Facturas</h1>
            <p className="text-red-100 text-sm">
              Formalizar la entrada de documentos al sistema institucional
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filtros */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-0 shadow-lg">
          <CardContent className="pt-6">
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Recibida']}
              proveedores={Array.from(new Set(facturasPendientes.map(f => f.proveedor)))}
              areas={Array.from(new Set(facturasPendientes.map(f => f.areaSolicitante)))}
              showMontoFilter={true}
              showFechaFilter={true}
              showAreaFilter={true}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Facturas Pendientes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas Pendientes de Radicación</CardTitle>
                <CardDescription>
                  {facturasFiltradas.length} factura(s) en estado "Recibida"
                </CardDescription>
              </div>
              <div className="flex items-center gap-3">
                <Badge className="bg-green-100 text-green-700 border-green-200 border text-sm px-3 py-1.5">
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  {facturasCompletas} Completas
                </Badge>
                <Badge className="bg-red-100 text-red-700 border-red-200 border text-sm px-3 py-1.5">
                  <AlertCircle className="w-4 h-4 mr-1" />
                  {facturasIncompletas} Incompletas
                </Badge>
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
                    <TableHead className="font-semibold text-slate-700 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                        <div className="flex flex-col items-center gap-2">
                          <FileText className="w-12 h-12 text-slate-300" />
                          <p>No hay facturas pendientes de radicación</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    facturasFiltradas.map((factura, index) => {
                      const fechaRecepcion = new Date(factura.fechaRecepcion);
                      const hoy = new Date();
                      const diasTranscurridos = Math.floor((hoy.getTime() - fechaRecepcion.getTime()) / (1000 * 60 * 60 * 24));
                      
                      let riesgoSLA = 'verde';
                      if (diasTranscurridos >= 24) riesgoSLA = 'vencido';
                      else if (diasTranscurridos >= 18) riesgoSLA = 'naranja';
                      else if (diasTranscurridos >= 12) riesgoSLA = 'amarillo';
                      
                      const colorRiesgo = riesgoSLA === 'vencido' ? 'bg-purple-700' 
                                        : riesgoSLA === 'naranja' ? 'bg-orange-500'
                                        : riesgoSLA === 'amarillo' ? 'bg-yellow-500'
                                        : 'bg-green-500';
                      
                      const documentosCompletos = validarDocumentosCompletos(factura);
                      const documentosFaltantes = obtenerDocumentosFaltantes(factura);
                      
                      return (
                        <motion.tr
                          key={factura.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          {/* SLA */}
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${colorRiesgo}`} />
                              {riesgoSLA === 'vencido' && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                  <AlertCircle className="w-4 h-4 text-purple-700" />
                                </motion.div>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                          <TableCell className="text-slate-600 max-w-[160px] truncate" title={factura.proveedor}>
                            {factura.proveedor}
                          </TableCell>
                          <TableCell className="text-slate-500 text-sm font-mono">
                            {factura.nit}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            ${factura.valorTotal.toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                          <TableCell className="text-slate-600 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4 text-slate-400" />
                              {factura.fechaRecepcion}
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                              riesgoSLA === 'vencido' 
                                ? 'text-purple-700' 
                                : riesgoSLA === 'naranja'
                                ? 'text-orange-600'
                                : riesgoSLA === 'amarillo'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}>
                              {diasTranscurridos}d
                            </span>
                          </TableCell>
                          
                          {/* Badge de Documentos */}
                          <TableCell>
                            {documentosCompletos ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 border">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Completos ({factura.documentosAdjuntos.length})
                              </Badge>
                            ) : (
                              <div className="space-y-1">
                                <Badge className="bg-red-100 text-red-700 border-red-200 border">
                                  <AlertCircle className="w-3 h-3 mr-1" />
                                  Incompletos ({factura.documentosAdjuntos.length}/3)
                                </Badge>
                                {documentosFaltantes.length > 0 && (
                                  <p className="text-xs text-red-600 font-medium">
                                    Faltan: {documentosFaltantes.join(', ')}
                                  </p>
                                )}
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell className="text-slate-600 text-xs max-w-[200px] truncate" title={factura.descripcion}>
                            {factura.descripcion}
                          </TableCell>
                          
                          {/* Acciones */}
                          <TableCell>
                            <div className="flex items-center gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirDialogDetalle(factura)}
                                className="border-slate-300 text-slate-700 hover:bg-slate-100"
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Detalle
                              </Button>

                              {documentosCompletos && (
                                <Button
                                  size="sm"
                                  onClick={() => abrirDialogRadicar(factura)}
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  <FileCheck className="w-4 h-4 mr-1" />
                                  Radicar
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => abrirDialogDevolver(factura)}
                                className="border-red-300 text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Devolver
                              </Button>
                            </div>
                          </TableCell>
                        </motion.tr>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Dialog Detalle con Checklist de Documentos Y BOTONES VER/DESCARGAR */}
      <Dialog open={mostrarDialogDetalle} onOpenChange={setMostrarDialogDetalle}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <FileText className="w-5 h-5 text-blue-600" />
              Detalle de Factura - {facturaSeleccionada?.numeroFactura}
            </DialogTitle>
            <DialogDescription>
              Información completa y documentos adjuntos
            </DialogDescription>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-6 py-4">
              {/* Información General */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-slate-500 text-xs uppercase font-semibold">Proveedor</Label>
                  <p className="font-semibold text-slate-800 mt-1">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase font-semibold">NIT</Label>
                  <p className="font-semibold text-slate-800 mt-1 font-mono">{facturaSeleccionada.nit}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase font-semibold">Valor Total</Label>
                  <p className="font-semibold text-slate-800 mt-1 text-lg">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase font-semibold">Área Solicitante</Label>
                  <p className="font-semibold text-slate-800 mt-1">{facturaSeleccionada.areaSolicitante}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase font-semibold">Fecha Factura</Label>
                  <p className="font-semibold text-slate-800 mt-1">{facturaSeleccionada.fechaFactura}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-xs uppercase font-semibold">Fecha Recepción</Label>
                  <p className="font-semibold text-slate-800 mt-1">{facturaSeleccionada.fechaRecepcion}</p>
                </div>
              </div>

              {/* Descripción */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <Label className="text-blue-900 text-xs uppercase font-semibold">Descripción</Label>
                <p className="text-blue-800 mt-2">{facturaSeleccionada.descripcion}</p>
              </div>

              {/* Checklist de Documentos Requeridos */}
              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                    <Upload className="w-5 h-5 text-blue-600" />
                    Checklist de Documentos Requeridos
                  </h3>
                  <Badge className={validarDocumentosCompletos(facturaSeleccionada) 
                    ? "bg-green-100 text-green-700 border-green-200 border"
                    : "bg-red-100 text-red-700 border-red-200 border"
                  }>
                    {validarDocumentosCompletos(facturaSeleccionada) 
                      ? "✅ Documentos Completos" 
                      : "❌ Documentos Incompletos"}
                  </Badge>
                </div>

                <div className="space-y-3">
                  {DOCUMENTOS_REQUERIDOS.map((docRequerido) => {
                    const tieneDocumento = facturaSeleccionada.documentosAdjuntos.some(doc => 
                      esDocumentoTipo(doc, docRequerido.tipo)
                    );

                    return (
                      <div 
                        key={docRequerido.tipo}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                          tieneDocumento 
                            ? 'bg-green-50 border-green-300' 
                            : 'bg-red-50 border-red-300'
                        }`}
                      >
                        <div className="text-2xl">{docRequerido.icono}</div>
                        <div className="flex-1">
                          <p className={`font-medium ${tieneDocumento ? 'text-green-800' : 'text-red-800'}`}>
                            {docRequerido.label}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {tieneDocumento ? 'Documento adjunto ✓' : 'Documento faltante'}
                          </p>
                        </div>
                        {tieneDocumento ? (
                          <CheckCircle2 className="w-6 h-6 text-green-600" />
                        ) : (
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Lista de Documentos Adjuntos CON BOTONES VER/DESCARGAR */}
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  Documentos Adjuntos ({facturaSeleccionada.documentosAdjuntos.length})
                </h3>
                {facturaSeleccionada.documentosAdjuntos.length === 0 ? (
                  <p className="text-slate-500 text-sm italic">No hay documentos adjuntos</p>
                ) : (
                  <div className="space-y-2">
                    {facturaSeleccionada.documentosAdjuntos.map((doc, idx) => (
                      <div 
                        key={doc.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-blue-300 transition-colors group"
                      >
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-800 text-sm">{doc.nombre}</p>
                          <p className="text-xs text-slate-500">
                            Tipo: <span className="font-semibold text-blue-600">{doc.tipo}</span> • Tamaño: {(doc.tamano / 1024).toFixed(2)} KB
                          </p>
                        </div>
                        {/* BOTONES VER Y DESCARGAR */}
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => verDocumento(doc)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => descargarDocumento(doc)}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Descargar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Observaciones */}
              {facturaSeleccionada.observaciones && (
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <Label className="text-yellow-900 text-xs uppercase font-semibold flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    Observaciones
                  </Label>
                  <p className="text-yellow-800 mt-2">{facturaSeleccionada.observaciones}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarDialogDetalle(false)}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Radicar */}
      <Dialog open={mostrarDialogRadicar} onOpenChange={setMostrarDialogRadicar}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              <FileCheck className="w-5 h-5 text-blue-600" />
              Radicar Factura - {facturaSeleccionada?.numeroFactura}
            </DialogTitle>
            <DialogDescription>
              Se generará un número único de radicado y la factura pasará al estado "Radicada"
            </DialogDescription>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-slate-500 text-sm">Proveedor</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Valor Total</Label>
                  <p className="font-semibold text-slate-800">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Fecha Factura</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.fechaFactura}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Área Solicitante</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.areaSolicitante}</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Observaciones (Opcional)</Label>
                <Textarea
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Ingrese observaciones sobre la radicación..."
                  className="min-h-[100px] border-slate-300 focus:border-blue-600 focus:ring-blue-600"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-blue-900 text-sm">Proceso de Radicación</p>
                    <p className="text-xs text-blue-700 mt-1">
                      • Se generará un número único de radicado<br />
                      • Se registrará la fecha y hora actual<br />
                      • El estado cambiará a "Radicada"<br />
                      • La factura pasará a la etapa de Causación Contable
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarDialogRadicar(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={radicarFactura}
              disabled={isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isProcessing ? (
                <>Procesando...</>
              ) : (
                <>
                  <FileCheck className="w-4 h-4 mr-2" />
                  Confirmar Radicación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Devolver */}
      <Dialog open={mostrarDialogDevolver} onOpenChange={setMostrarDialogDevolver}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-700">
              <XCircle className="w-5 h-5" />
              Devolver Factura - {facturaSeleccionada?.numeroFactura}
            </DialogTitle>
            <DialogDescription>
              La factura será devuelta al Funcionario para corrección o complementación
            </DialogDescription>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-slate-500 text-sm">Proveedor</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Área Responsable</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.areaSolicitante}</p>
                </div>
              </div>

              {/* Documentos Faltantes */}
              {!validarDocumentosCompletos(facturaSeleccionada) && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-900 text-sm">Documentos Faltantes:</p>
                      <ul className="text-xs text-red-700 mt-1 list-disc list-inside">
                        {obtenerDocumentosFaltantes(facturaSeleccionada).map(doc => (
                          <li key={doc}>{doc}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-slate-700 flex items-center gap-1">
                  Motivo de Devolución <span className="text-red-600">*</span>
                </Label>
                <Textarea
                  value={motivoDevolucion}
                  onChange={(e) => setMotivoDevolucion(e.target.value)}
                  placeholder="Describa el motivo de la devolución (OBLIGATORIO)..."
                  className="min-h-[120px] border-red-300 focus:border-red-600 focus:ring-red-600"
                  required
                />
                <p className="text-xs text-slate-500">
                  Este motivo será visible para el Funcionario responsable
                </p>
              </div>

              <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium text-yellow-900 text-sm">Importante</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      • La factura volverá al estado "Devuelta"<br />
                      • Se notificará al área {facturaSeleccionada.areaSolicitante}<br />
                      • El Funcionario deberá corregir y volver a enviar
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarDialogDevolver(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={devolverFactura}
              disabled={isProcessing || !motivoDevolucion.trim()}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isProcessing ? (
                <>Procesando...</>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmar Devolución
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
