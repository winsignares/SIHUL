import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Textarea } from '../../../share/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Badge } from '../../../share/badge';
import { Send, Filter, Calendar, Eye, Building, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../share/dialog';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface FacturaEnvio extends SharedFacturaDetail {
  id: string;
  nit: string;
  fechaRevision: string;
}

const facturasRevisadas: FacturaEnvio[] = [
  {
    id: '1',
    numeroFactura: 'FAC-2026-025',
    numeroRadicado: 'RAD-2026-00125',
    numeroProcesoPago: 'PP-2026-0100',
    proveedor: 'Servicios Integrales SA',
    nit: '900890123-4',
    valorTotal: 18500000,
    fechaRevision: '2026-04-02',
    fechaRecepcion: '2026-04-02',
    areaSolicitante: 'Servicios Generales',
    estado: 'Revisado por direccion financiera',
    diasTranscurridos: 0,
    descripcion: 'Servicios de aseo y cafeteria mensual',
  },
  {
    id: '2',
    numeroFactura: 'FAC-2026-031',
    numeroRadicado: 'RAD-2026-00131',
    numeroProcesoPago: 'PP-2026-0110',
    proveedor: 'Infraestructura Integral EU',
    nit: '900456789-0',
    valorTotal: 27800000,
    fechaRevision: '2026-04-03',
    fechaRecepcion: '2026-04-03',
    areaSolicitante: 'Infraestructura',
    estado: 'Revisado por direccion financiera',
    diasTranscurridos: 1,
    descripcion: 'Pago asociado a obra critica de seguridad',
  },
];

export default function EnviarRectoria() {
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
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<FacturaEnvio | null>(null);
  const [detalleAbierto, setDetalleAbierto] = useState(false);
  const [envioAbierto, setEnvioAbierto] = useState(false);
  const [observaciones, setObservaciones] = useState('');

  const facturasFiltradas = useMemo(() => {
    return facturasRevisadas.filter((factura) => {
      if (filtros.numeroFactura && !factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase())) return false;
      if (filtros.proveedor && factura.proveedor !== filtros.proveedor) return false;
      if (filtros.estado && factura.estado !== filtros.estado) return false;
      if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) return false;
      if (filtros.fechaInicio && factura.fechaRevision < filtros.fechaInicio) return false;
      if (filtros.fechaFin && factura.fechaRevision > filtros.fechaFin) return false;
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
            <Send className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-2xl font-bold">Enviar a Rectoria</h1>
            <p className="text-red-100 text-sm">Remitir pagos revisados para autorizacion final</p>
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
            estados={Array.from(new Set(facturasRevisadas.map((f) => f.estado)))}
            proveedores={Array.from(new Set(facturasRevisadas.map((f) => f.proveedor)))}
            areas={Array.from(new Set(facturasRevisadas.map((f) => f.areaSolicitante || '').filter(Boolean)))}
            showMontoFilter
            showFechaFilter
            showAreaFilter
          />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Pagos Revisados - Listos para Enviar</CardTitle>
          <CardDescription>{facturasFiltradas.length} pago(s) listo(s) para enviar a Rectoria</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>N Factura</TableHead>
                <TableHead>N Radicado</TableHead>
                <TableHead>N Proceso</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead>NIT</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>F. Revision</TableHead>
                <TableHead>Dias</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {facturasFiltradas.map((factura, index) => (
                <motion.tr key={factura.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                  <TableCell className="font-medium">{factura.numeroFactura}</TableCell>
                  <TableCell className="font-mono text-blue-700 text-xs">{factura.numeroRadicado}</TableCell>
                  <TableCell className="font-mono text-purple-700 text-xs">{factura.numeroProcesoPago}</TableCell>
                  <TableCell><div className="flex items-center gap-2"><Building className="w-4 h-4 text-slate-400" />{factura.proveedor}</div></TableCell>
                  <TableCell className="font-mono text-xs text-slate-600">{factura.nit}</TableCell>
                  <TableCell className="font-bold text-green-700">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                  <TableCell><Badge variant="outline">{factura.areaSolicitante}</Badge></TableCell>
                  <TableCell><Calendar className="w-3 h-3 inline mr-1" />{factura.fechaRevision}</TableCell>
                  <TableCell><Badge className={factura.diasTranscurridos && factura.diasTranscurridos >= 2 ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}>{factura.diasTranscurridos || 0}d</Badge></TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setFacturaSeleccionada(factura); setDetalleAbierto(true); }}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => { setFacturaSeleccionada(factura); setEnvioAbierto(true); }}>
                        <Send className="w-4 h-4 mr-1" />Enviar
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

      <Dialog open={envioAbierto} onOpenChange={setEnvioAbierto}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Enviar a Rectoria</DialogTitle>
            <DialogDescription>
              {facturaSeleccionada ? `Confirmar envio de ${facturaSeleccionada.numeroFactura} para autorizacion final.` : 'Selecciona una factura.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Observaciones para Rectoria</label>
            <Textarea rows={4} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Contexto de envio y prioridad" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEnvioAbierto(false)}>Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setEnvioAbierto(false)}>Confirmar envio</Button>
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
