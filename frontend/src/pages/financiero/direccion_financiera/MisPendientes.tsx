import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Button } from '../../../share/button';
import { AlertCircle, Clock3, Eye, Search } from 'lucide-react';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';
import { Input } from '../../../share/input';

const pendientesBase: SharedFacturaDetail[] = [
  {
    numeroFactura: 'FAC-2026-005',
    numeroRadicado: 'RAD-2026-00132',
    numeroProcesoPago: 'PP-2026-0076',
    proveedor: 'Editorial Universitaria',
    valorTotal: 5670000,
    fechaFactura: '2026-03-15',
    fechaRecepcion: '2026-03-21',
    areaSolicitante: 'Biblioteca',
    estado: 'Aprobada Auditoria',
    diasTranscurridos: 5,
    descripcion: 'Adquisicion de libros academicos',
  },
  {
    numeroFactura: 'FAC-2026-011',
    numeroRadicado: 'RAD-2026-00147',
    numeroProcesoPago: 'PP-2026-0081',
    proveedor: 'Equipos de Laboratorio SAS',
    valorTotal: 14200000,
    fechaFactura: '2026-03-24',
    fechaRecepcion: '2026-03-25',
    areaSolicitante: 'Laboratorios',
    estado: 'Aprobada Auditoria',
    diasTranscurridos: 2,
    descripcion: 'Dotacion para laboratorio de quimica',
  },
  {
    numeroFactura: 'FAC-2026-014',
    numeroRadicado: 'RAD-2026-00152',
    numeroProcesoPago: 'PP-2026-0087',
    proveedor: 'Mantenimiento y Obras EU',
    valorTotal: 22100000,
    fechaFactura: '2026-03-27',
    fechaRecepcion: '2026-03-28',
    areaSolicitante: 'Infraestructura',
    estado: 'Aprobada Auditoria',
    diasTranscurridos: 1,
    descripcion: 'Adecuacion de cubierta del bloque B',
  },
];

export default function MisPendientes() {
  const [search, setSearch] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<SharedFacturaDetail | null>(null);

  const pendientes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return pendientesBase;
    return pendientesBase.filter(
      (f) =>
        f.numeroFactura.toLowerCase().includes(q) ||
        f.proveedor.toLowerCase().includes(q) ||
        (f.numeroRadicado || '').toLowerCase().includes(q)
    );
  }, [search]);

  const totalPendiente = pendientes.reduce((sum, item) => sum + item.valorTotal, 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-yellow-600 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-1">Mis Pendientes de Cargue</h1>
            <p className="text-yellow-100">Facturas aprobadas por auditoria listas para cargue y consolidacion</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-yellow-100">Total en cola</p>
            <p className="text-3xl font-bold">${totalPendiente.toLocaleString('es-CO')}</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Pendientes</p>
            <p className="text-3xl font-bold text-slate-800">{pendientes.length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Criticos (&gt; 3 dias)</p>
            <p className="text-3xl font-bold text-red-700">{pendientes.filter((p) => (p.diasTranscurridos || 0) > 3).length}</p>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-5">
            <p className="text-sm text-slate-500">Promedio de espera</p>
            <p className="text-3xl font-bold text-amber-700">{Math.round(pendientes.reduce((s, p) => s + (p.diasTranscurridos || 0), 0) / Math.max(1, pendientes.length))} dias</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Cola de Prioridades</CardTitle>
          <CardDescription>Filtra y abre el detalle para gestionar trazabilidad completa</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input className="pl-9" placeholder="Buscar por factura, proveedor o radicado" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>

          <div className="space-y-3">
            {pendientes.map((item) => (
              <motion.div
                key={item.numeroFactura}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-slate-800">{item.numeroFactura}</p>
                    <p className="text-sm text-slate-600">{item.proveedor}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline">{item.numeroRadicado}</Badge>
                      <Badge className="bg-orange-100 text-orange-700 border-orange-200">{item.estado}</Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-slate-800">${item.valorTotal.toLocaleString('es-CO')}</p>
                    <p className="text-xs text-slate-500 mt-1">{item.areaSolicitante}</p>
                    <div className="inline-flex items-center gap-1 mt-2 text-xs text-slate-600">
                      <Clock3 className="w-3 h-3" />
                      {item.diasTranscurridos} dias
                    </div>
                  </div>
                  <Button
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      setSelected(item);
                      setDetailOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" /> Ver detalle
                  </Button>
                </div>
                {(item.diasTranscurridos || 0) > 3 && (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-200 p-2 text-red-700 text-xs inline-flex items-center gap-2">
                    <AlertCircle className="w-3 h-3" />
                    Requiere atencion prioritaria por tiempo de permanencia.
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      <FacturaDetailModal
        factura={selected}
        isOpen={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelected(null);
        }}
      />
    </div>
  );
}
