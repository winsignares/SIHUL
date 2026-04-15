import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Button } from '../../../share/button';
import { AlertCircle, Eye, ShieldCheck, FileSearch, CheckCircle2 } from 'lucide-react';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface FacturaPendiente {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  numeroProcesoPago: string;
  proveedor: string;
  valorTotal: number;
  fechaAlistamiento: string;
  diasTranscurridos: number;
  diasMaximos: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'naranja' | 'vencido';
  accionRequerida: string;
  areaSolicitante: string;
  cuentaContable: string;
  centroCosto: string;
  estado: string;
  descripcion?: string;
}

export default function MisPendientes() {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const facturasPendientes: FacturaPendiente[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      numeroRadicado: 'RAD-2026-00145',
      numeroProcesoPago: 'PP-2026-00078',
      proveedor: 'Tecnologia Global SAS',
      valorTotal: 8900000,
      fechaAlistamiento: '2026-03-31',
      diasTranscurridos: 5,
      diasMaximos: 24,
      nivelRiesgo: 'verde',
      accionRequerida: 'Realizar control previo de auditoria',
      areaSolicitante: 'Sistemas',
      cuentaContable: '5165-001',
      centroCosto: 'CC-007',
      estado: 'Alistada - Pendiente control previo',
      descripcion: 'Equipos de computo para area administrativa',
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-152',
      numeroRadicado: 'RAD-2026-00152',
      numeroProcesoPago: 'PP-2026-00079',
      proveedor: 'Servicios Medicos Especializados',
      valorTotal: 12500000,
      fechaAlistamiento: '2026-04-01',
      diasTranscurridos: 3,
      diasMaximos: 24,
      nivelRiesgo: 'verde',
      accionRequerida: 'Realizar control previo de auditoria',
      areaSolicitante: 'Enfermeria',
      cuentaContable: '5170-001',
      centroCosto: 'CC-010',
      estado: 'Alistada - Pendiente control previo',
      descripcion: 'Servicios medicos especializados mes de marzo',
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-158',
      numeroRadicado: 'RAD-2026-00158',
      numeroProcesoPago: 'PP-2026-00081',
      proveedor: 'Mantenimiento Pro EU',
      valorTotal: 6750000,
      fechaAlistamiento: '2026-04-01',
      diasTranscurridos: 4,
      diasMaximos: 24,
      nivelRiesgo: 'verde',
      accionRequerida: 'Realizar control previo de auditoria',
      areaSolicitante: 'Mantenimiento',
      cuentaContable: '5125-001',
      centroCosto: 'CC-008',
      estado: 'Alistada - Pendiente control previo',
      descripcion: 'Reparaciones de infraestructura fisica',
    },
  ];

  const handleVerDetalle = (factura: FacturaPendiente) => {
    setFacturaSeleccionada({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      numeroProcesoPago: factura.numeroProcesoPago,
      proveedor: factura.proveedor,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaAlistamiento,
      descripcion: factura.descripcion,
      observaciones: factura.accionRequerida,
      cuentaContable: factura.cuentaContable,
      centroCosto: factura.centroCosto,
      nivelRiesgo: factura.nivelRiesgo,
    });
    setMostrarDetalle(true);
  };

  const totalPendientes = facturasPendientes.length;
  const enTiempoCount = facturasPendientes.filter((f) => f.nivelRiesgo === 'verde').length;
  const proximasVencerCount = facturasPendientes.filter((f) => f.nivelRiesgo === 'amarillo' || f.nivelRiesgo === 'naranja').length;

  return (
    <>
      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
              <ShieldCheck className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Mis Pendientes</h1>
              <p className="text-red-100 text-sm">Facturas alistadas para control previo (SLA de proceso: 24 dias)</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Total Por Revisar</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{totalPendientes}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <FileSearch className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-lg border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-semibold">En Tiempo</p>
                    <p className="text-3xl font-bold text-green-800 mt-1">{enTiempoCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-700 text-sm font-semibold">Proximas a Vencer</p>
                    <p className="text-3xl font-bold text-orange-800 mt-1">{proximasVencerCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-lg bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-blue-900 mb-1">Mi responsabilidad en control previo</h3>
                  <p className="text-sm text-blue-700">
                    No revisa disponibilidad presupuestal. Si revisa causacion contable, soportes y distribucion correcta en rubro.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800">Facturas Pendientes de Control Previo</CardTitle>
              <CardDescription>Facturas alistadas para revisar antes del siguiente paso del flujo financiero</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                      <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proceso Pago</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                      <TableHead className="font-semibold text-slate-700">Centro Costo</TableHead>
                      <TableHead className="font-semibold text-slate-700">Area</TableHead>
                      <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                      <TableHead className="font-semibold text-slate-700">Accion</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasPendientes.map((factura, index) => {
                      const colorRiesgo =
                        factura.nivelRiesgo === 'vencido'
                          ? 'bg-purple-700'
                          : factura.nivelRiesgo === 'naranja'
                            ? 'bg-orange-500'
                            : factura.nivelRiesgo === 'amarillo'
                              ? 'bg-yellow-500'
                              : 'bg-green-500';

                      return (
                        <motion.tr key={factura.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="hover:bg-slate-50 transition-colors">
                          <TableCell><div className={`w-3 h-3 rounded-full ${colorRiesgo}`} /></TableCell>
                          <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                          <TableCell><Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 border font-mono text-xs">{factura.numeroProcesoPago}</Badge></TableCell>
                          <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                          <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                          <TableCell><Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">{factura.cuentaContable}</Badge></TableCell>
                          <TableCell><Badge className="bg-cyan-100 text-cyan-700 border-cyan-200 border font-mono text-xs">{factura.centroCosto}</Badge></TableCell>
                          <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                          <TableCell>
                            <span className="inline-flex items-center gap-1 font-bold text-sm text-green-700">{factura.diasTranscurridos}d / {factura.diasMaximos}d</span>
                          </TableCell>
                          <TableCell><Badge className="bg-blue-100 text-blue-800 border-blue-300 border text-xs">{factura.accionRequerida}</Badge></TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" onClick={() => handleVerDetalle(factura)} className="border-slate-300 text-slate-700 hover:bg-slate-100">
                              <Eye className="w-4 h-4 mr-1" />Revisar
                            </Button>
                          </TableCell>
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <FacturaDetailModal
        factura={facturaSeleccionada}
        isOpen={mostrarDetalle}
        onClose={() => {
          setMostrarDetalle(false);
          setFacturaSeleccionada(null);
        }}
      />
    </>
  );
}
