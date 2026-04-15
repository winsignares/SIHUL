import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { FileCheck, Filter, Calendar, CheckCircle2, RotateCcw, Eye, Building } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface FacturaRevision extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaEnvio: string;
  cuentaContable: string;
}

const facturasRecibidas: FacturaRevision[] = [
  {
    id: '1',
    numeroFactura: 'FAC-2026-025',
    numeroRadicado: 'RAD-2026-00125',
    numeroProcesoPago: 'PP-2026-0100',
    proveedor: 'Servicios Integrales SA',
    nit: '900890123-4',
    valorTotal: 18500000,
    fechaEnvio: '2026-04-02',
    fechaRecepcion: '2026-04-02',
    areaSolicitante: 'Servicios Generales',
    cuentaContable: '5145-001',
    estado: 'Enviado a direccion financiera',
    diasTranscurridos: 0,
    descripcion: 'Servicios de aseo y cafeteria mensual',
  },
  {
    id: '2',
    numeroFactura: 'FAC-2026-026',
    numeroRadicado: 'RAD-2026-00126',
    numeroProcesoPago: 'PP-2026-0101',
    proveedor: 'Papeleria Universitaria',
    nit: '900901234-5',
    valorTotal: 3200000,
    fechaEnvio: '2026-04-01',
    fechaRecepcion: '2026-04-01',
    areaSolicitante: 'Suministros',
    cuentaContable: '5150-002',
    estado: 'Enviado a direccion financiera',
    diasTranscurridos: 1,
    descripcion: 'Material de oficina y papeleria',
  },
];

export default function RevisarPagos() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: '',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  });
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaRevision | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [decisionAbierta, setDecisionAbierta] = useState(false);
  const [decisionTipo, setDecisionTipo] = useState<'aprobar' | 'devolver'>('aprobar');

  const facturasFiltradas = useMemo(() => {
    return facturasRecibidas.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.proveedor && factura.proveedor !== filtros.proveedor) return false;
      if (filtros.estado && factura.estado !== filtros.estado) return false;
      if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
      if (filtros.fechaInicio && factura.fechaEnvio < filtros.fechaInicio) return false;
      if (filtros.fechaFin && factura.fechaEnvio > filtros.fechaFin) return false;
      if (filtros.montoMin && factura.valorTotal < parseFloat(filtros.montoMin)) return false;
      if (filtros.montoMax && factura.valorTotal > parseFloat(filtros.montoMax)) return false;
      return true;
    });
  }, [filtros]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <FileCheck className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-2xl font-bold">Revisar Pagos</h1>
            <p className="text-red-100 text-sm">Revision y validacion de pagos enviados por Tesoreria</p>
          </div>
        </div>
      </motion.div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-800">
            <Filter className="w-5 h-5 text-red-600" />
            Filtros de Busqueda Independientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableFilters
            filters={filtros}
            onFilterChange={setFiltros}
            estados={Array.from(new Set(facturasRecibidas.map((f) => f.estado)))}
            proveedores={Array.from(new Set(facturasRecibidas.map((f) => f.proveedor)))}
            areas={Array.from(new Set(facturasRecibidas.map((f) => f.areaSolicitante || '').filter(Boolean)))}
            showMontoFilter
            showFechaFilter
            showAreaFilter
          />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800">Pagos Recibidos de Tesoreria</CardTitle>
          <CardDescription>{facturasFiltradas.length} pago(s) pendiente(s) de revision</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>N Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>F. Envio</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturasFiltradas.map((factura, index) => (
                <motion.tr key={factura.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-slate-400" />
                      {factura.proveedor}
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                  <TableCell><Badge variant="outline">{factura.areaSolicitante}</Badge></TableCell>
                  <TableCell><Calendar className="w-3 h-3 inline mr-1" />{factura.fechaEnvio}</TableCell>
                  <TableCell><Badge className={factura.diasTranscurridos && factura.diasTranscurridos >= 2 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>{factura.diasTranscurridos || 0}d</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setFacturaSeleccionada(factura); setDetalleAbierto(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setFacturaSeleccionada(factura); setDecisionTipo('aprobar'); setDecisionAbierta(true); }}>
                        <CheckCircle2 className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => { setFacturaSeleccionada(factura); setDecisionTipo('devolver'); setDecisionAbierta(true); }}>
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={decisionAbierta} onOpenChange={setDecisionAbierta}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{decisionTipo === 'aprobar' ? 'Aprobar pago' : 'Devolver pago'}</DialogTitle>
            <DialogDescription>
              {decisionTipo === 'aprobar'
                ? `La factura ${facturaSeleccionada?.numeroFactura} quedara lista para envio a Rectoria.`
                : `La factura ${facturaSeleccionada?.numeroFactura} se devolvera a Tesoreria.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDecisionAbierta(false)}>Cancelar</Button>
            <Button variant={decisionTipo === 'aprobar' ? 'default' : 'destructive'} className={decisionTipo === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : ''} onClick={() => setDecisionAbierta(false)}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={detalleAbierto}
        onClose={() => {
          setDetalleAbierto(false);
          setFacturaSeleccionada(null);
        }}
      />
    </div>
  );
}
