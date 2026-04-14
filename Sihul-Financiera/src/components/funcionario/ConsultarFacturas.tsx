import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { FileSearch, Download, Eye, Calendar, AlertTriangle, TrendingUp } from 'lucide-react';
import TableFilters from '../ui/table-filters';
import FacturaDetailModal from '../ui/factura-detail-modal';
import { useFacturas, type Factura as FacturaContext } from '../../contexts/FacturasContext';

// Interfaz local para compatibilidad con modal existente
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
  diasMaximos: number;
  etapaActual: string;
  nivelRiesgo: 'verde' | 'amarillo' | 'naranja' | 'vencido';
  numeroRadicado?: string;
  numeroProcesoPago?: string;
  descripcion?: string;
  observaciones?: string;
}

export default function ConsultarFacturas() {
  const { facturas: facturasContext } = useFacturas();
  
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
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // Convertir facturas del contexto al formato local
  const facturas: Factura[] = facturasContext.map(f => ({
    id: f.id,
    numeroFactura: f.numeroFactura,
    proveedor: f.proveedor,
    valorTotal: f.valorTotal,
    fechaFactura: f.fechaFactura,
    fechaRecepcion: f.fechaRecepcion,
    areaSolicitante: f.areaSolicitante,
    estado: f.estado,
    diasTranscurridos: f.diasTranscurridos,
    diasMaximos: 17, // SLA estándar
    etapaActual: f.etapaActual,
    nivelRiesgo: f.indicadorRiesgo === 'ok' ? 'verde' 
                  : f.indicadorRiesgo === 'atencion' ? 'amarillo'
                  : f.indicadorRiesgo === 'atrasada' ? 'naranja'
                  : 'vencido',
    numeroRadicado: f.numeroRadicado,
    numeroProcesoPago: f.numeroProcesoPago,
    descripcion: f.descripcion,
    observaciones: f.observaciones
  }));

  const getEstadoBadge = (estado: string) => {
    const badges: { [key: string]: string } = {
      'Recibida': 'bg-blue-100 text-blue-700 border-blue-200',
      'Radicada': 'bg-green-100 text-green-700 border-green-200',
      'Causada': 'bg-purple-100 text-purple-700 border-purple-200',
      'Alistada': 'bg-yellow-100 text-yellow-700 border-yellow-200',
      'Aprobada Auditoría': 'bg-teal-100 text-teal-700 border-teal-200',
      'Aprobada auditoría': 'bg-teal-100 text-teal-700 border-teal-200',
      'Cargada': 'bg-orange-100 text-orange-700 border-orange-200',
      'Autorizada': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Autorizada para Pago': 'bg-indigo-100 text-indigo-700 border-indigo-200',
      'Pago Aplicado': 'bg-cyan-100 text-cyan-700 border-cyan-200',
      'Pagada': 'bg-emerald-100 text-emerald-700 border-emerald-200',
      'Devuelta': 'bg-red-100 text-red-700 border-red-300 font-bold',
      'Rechazada': 'bg-red-100 text-red-700 border-red-300 font-bold'
    };
    return badges[estado] || 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getRiesgoColor = (nivel: string) => {
    switch (nivel) {
      case 'verde':
        return 'bg-green-500';
      case 'amarillo':
        return 'bg-yellow-500';
      case 'naranja':
        return 'bg-orange-500';
      case 'vencido':
        return 'bg-purple-700';
      default:
        return 'bg-slate-400';
    }
  };

  const handleEscalar = (factura: Factura) => {
    alert(`Escalamiento de factura ${factura.numeroFactura}\n\nSe notificará a:\n- Supervisor inmediato\n- Responsable de la siguiente etapa\n- Auditoría interna\n\nLa factura quedará marcada como URGENTE en el sistema.`);
  };

  // Filtrado con todos los criterios independientes
  const facturasFiltradas = facturas.filter(factura => {
    // Filtro por número de factura
    if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) {
      return false;
    }
    
    // Filtro por proveedor
    if (filtros.proveedor && factura.proveedor !== filtros.proveedor) {
      return false;
    }
    
    // Filtro por estado
    if (filtros.estado && factura.estado !== filtros.estado) {
      return false;
    }
    
    // Filtro por área solicitante
    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) {
      return false;
    }
    
    // Filtro por fecha inicio
    if (filtros.fechaInicio && factura.fechaFactura < filtros.fechaInicio) {
      return false;
    }
    
    // Filtro por fecha fin
    if (filtros.fechaFin && factura.fechaFactura > filtros.fechaFin) {
      return false;
    }
    
    // Filtro por monto mínimo
    if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) {
      return false;
    }
    
    // Filtro por monto máximo
    if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) {
      return false;
    }
    
    return true;
  });

  const verDetalle = (factura: Factura) => {
    setFacturaSeleccionada(factura);
    setMostrarDetalle(true);
  };

  // Obtener listas únicas para los filtros
  const proveedoresUnicos = Array.from(new Set(facturas.map(f => f.proveedor)));
  const estadosUnicos = Array.from(new Set(facturas.map(f => f.estado)));
  const areasUnicas = Array.from(new Set(facturas.map(f => f.areaSolicitante)));

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
            <FileSearch className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Consultar Facturas</h1>
            <p className="text-red-100 text-sm">
              Visualiza y realiza seguimiento del estado de las facturas registradas
            </p>
          </div>
        </div>
      </motion.div>

      {/* Filtros Independientes */}
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
              estados={estadosUnicos}
              proveedores={proveedoresUnicos}
              areas={areasUnicas}
              showMontoFilter={true}
              showFechaFilter={true}
              showAreaFilter={true}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Resultados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Resultados</CardTitle>
                <CardDescription>
                  {facturasFiltradas.length} factura(s) encontrada(s)
                </CardDescription>
              </div>
              <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Riesgo</TableHead>
                    <TableHead className="font-semibold text-slate-700">ID Trámite</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">Área</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Etapa</TableHead>
                    <TableHead className="font-semibold text-slate-700">N° Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Fecha</TableHead>
                    <TableHead className="font-semibold text-slate-700">Días</TableHead>
                    <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {facturasFiltradas.map((factura, index) => (
                    <motion.tr
                      key={factura.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      {/* Indicador de Riesgo */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${getRiesgoColor(factura.nivelRiesgo)}`} />
                          {factura.nivelRiesgo === 'vencido' && (
                            <motion.div
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1.5 }}
                            >
                              <AlertTriangle className="w-4 h-4 text-purple-700" />
                            </motion.div>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                      <TableCell className="text-slate-600 max-w-[180px] truncate" title={factura.proveedor}>
                        {factura.proveedor}
                      </TableCell>
                      <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        ${factura.valorTotal.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getEstadoBadge(factura.estado)} border`}>
                          {factura.estado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs">{factura.etapaActual}</TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {factura.numeroRadicado || '-'}
                      </TableCell>
                      <TableCell className="text-slate-600 text-sm">{factura.fechaFactura}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 font-medium ${
                          factura.nivelRiesgo === 'vencido' 
                            ? 'text-purple-700' 
                            : factura.nivelRiesgo === 'naranja'
                            ? 'text-orange-600'
                            : factura.nivelRiesgo === 'amarillo'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                        }`}>
                          <Calendar className="w-4 h-4" />
                          {factura.diasTranscurridos}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => verDetalle(factura)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          {factura.nivelRiesgo === 'vencido' && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEscalar(factura)}
                              className="text-purple-700 hover:text-purple-900 hover:bg-purple-50"
                            >
                              <TrendingUp className="w-4 h-4 mr-1" />
                              Escalar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Modal de Detalle */}
      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={mostrarDetalle}
        onClose={() => setMostrarDetalle(false)}
      />
    </div>
  );
}