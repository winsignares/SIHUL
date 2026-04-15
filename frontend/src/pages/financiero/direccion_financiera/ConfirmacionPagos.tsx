import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Label } from '../../../share/label';
import { Input } from '../../../share/input';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { CheckCircle, Filter, Calendar, Eye, Building, AlertCircle, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '../../../share/dialog';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface FacturaConfirmacion extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaAutorizacion: string;
}

const facturasAutorizadas: FacturaConfirmacion[] = [
  {
    id: '1',
    numeroFactura: 'FAC-2026-018',
    numeroRadicado: 'RAD-2026-00115',
    numeroProcesoPago: 'PP-2026-0092',
    proveedor: 'Construcciones Universitarias SAS',
    nit: '900123456-7',
    valorTotal: 45000000,
    fechaAutorizacion: '2026-04-01',
    fechaRecepcion: '2026-04-01',
    areaSolicitante: 'Infraestructura',
    estado: 'Autorizada para pago',
    diasTranscurridos: 1,
    descripcion: 'Obra construccion bloque D - Pago parcial',
  },
];

export default function ConfirmacionPagos() {
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
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaConfirmacion | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [confirmarAbierto, setConfirmarAbierto] = useState(false);
  const [numeroConfirmacion, setNumeroConfirmacion] = useState('');
  const [observaciones, setObservaciones] = useState('');

  const facturasFiltradas = useMemo(() => {
    return facturasAutorizadas.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.proveedor && factura.proveedor !== filtros.proveedor) return false;
      if (filtros.estado && factura.estado !== filtros.estado) return false;
      if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
      if (filtros.fechaInicio && factura.fechaAutorizacion < filtros.fechaInicio) return false;
      if (filtros.fechaFin && factura.fechaAutorizacion > filtros.fechaFin) return false;
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
            <CheckCircle className="w-7 h-7 text-yellow-400" />
          </div>
          <div className="flex-1">
            <h1 className="text-white mb-1 text-2xl font-bold">Confirmacion de Pagos</h1>
            <p className="text-red-100 text-sm">Control y confirmacion del proceso de pago (no ejecuta pagos)</p>
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
            estados={Array.from(new Set(facturasAutorizadas.map((f) => f.estado)))}
            proveedores={Array.from(new Set(facturasAutorizadas.map((f) => f.proveedor)))}
            areas={Array.from(new Set(facturasAutorizadas.map((f) => f.areaSolicitante || '').filter(Boolean)))}
            showMontoFilter
            showFechaFilter
            showAreaFilter
          />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Pagos Autorizados - Control de Proceso</CardTitle>
          <CardDescription>{facturasFiltradas.length} pago(s) autorizado(s) pendiente(s) de confirmacion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <ExternalLink className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-semibold">Control del proceso - NO ejecucion bancaria</p>
                <p className="mt-1">Este modulo confirma el control del proceso de pago. La ejecucion real del pago se realiza en el portal bancario externo.</p>
              </div>
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>N Factura</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>F. Autorizacion</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturasFiltradas.map((factura, index) => (
                <motion.tr key={factura.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Building className="w-4 h-4 text-slate-400" />{factura.proveedor}</div></TableCell>
                  <TableCell className="font-bold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                  <TableCell><Badge variant="outline">{factura.areaSolicitante}</Badge></TableCell>
                  <TableCell><Calendar className="w-3 h-3 inline mr-1" />{factura.fechaAutorizacion}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setFacturaSeleccionada(factura); setDetalleAbierto(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => { setFacturaSeleccionada(factura); setConfirmarAbierto(true); }}>
                        <CheckCircle className="w-4 h-4 mr-1" />Confirmar
                      </Button>
                    </div>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>

          {facturasFiltradas.length === 0 && (
            <div className="text-center py-10 text-slate-500">
              <AlertCircle className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              No se encontraron pagos con los filtros aplicados.
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmarAbierto} onOpenChange={setConfirmarAbierto}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Confirmar control de proceso</DialogTitle>
            <DialogDescription>Registra la confirmacion del control del proceso de pago</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Numero de confirmacion</Label>
              <Input value={numeroConfirmacion} onChange={(e) => setNumeroConfirmacion(e.target.value)} placeholder="Ej: CONF-2026-001" />
            </div>
            <div className="space-y-2">
              <Label>Observaciones</Label>
              <Textarea value={observaciones} onChange={(e) => setObservaciones(e.target.value)} rows={3} placeholder="Notas del control realizado" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmarAbierto(false)}>Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setConfirmarAbierto(false)}>Confirmar control</Button>
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
