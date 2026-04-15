import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Badge } from '../../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../share/table';
import { Button } from '../../../share/button';
import { AlertCircle, Eye, Clock, FileCheck, Send, FileOutput } from 'lucide-react';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

interface FacturaPendiente {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  proveedor: string;
  valorTotal: number;
  fechaCausacion: string;
  diasTranscurridos: number;
  diasMaximos: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'naranja' | 'vencido';
  accionRequerida: string;
  areaSolicitante: string;
  estado: string;
  cuentaContable: string;
  descripcion?: string;
}

export default function MisPendientes() {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  const facturasPendientesAlistar: FacturaPendiente[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-002',
      numeroRadicado: 'RAD-2026-087',
      proveedor: 'Servicios TI Colombia SAS',
      valorTotal: 8950000,
      fechaCausacion: '2026-03-25',
      diasTranscurridos: 8,
      diasMaximos: 18,
      nivelRiesgo: 'verde',
      accionRequerida: 'Alistar pago y generar proceso',
      areaSolicitante: 'Sistemas',
      estado: 'Causada - Pendiente alistamiento',
      cuentaContable: '5165-001',
      descripcion: 'Servicios de mantenimiento de infraestructura tecnologica',
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-006',
      numeroRadicado: 'RAD-2026-089',
      proveedor: 'Servicios de Aseo Total',
      valorTotal: 4200000,
      fechaCausacion: '2026-03-24',
      diasTranscurridos: 13,
      diasMaximos: 18,
      nivelRiesgo: 'amarillo',
      accionRequerida: 'Alistar pago y generar proceso',
      areaSolicitante: 'Servicios Generales',
      estado: 'Causada - Pendiente alistamiento',
      cuentaContable: '5135-001',
      descripcion: 'Servicios de aseo y mantenimiento general',
    },
  ];

  const facturasAprobadasAuditoria: FacturaPendiente[] = [
    {
      id: '3',
      numeroFactura: 'FAC-2026-004',
      numeroRadicado: 'RAD-2026-00095',
      proveedor: 'Mantenimiento y Obras EU',
      valorTotal: 12500000,
      fechaCausacion: '2026-03-22',
      diasTranscurridos: 11,
      diasMaximos: 18,
      nivelRiesgo: 'verde',
      accionRequerida: 'Enviar a Direccion Financiera',
      areaSolicitante: 'Mantenimiento',
      estado: 'Aprobada Auditoria - Enviar Dir. Financiera',
      cuentaContable: '5135-001',
      descripcion: 'Servicios de mantenimiento preventivo y correctivo',
    },
    {
      id: '4',
      numeroFactura: 'FAC-2026-007',
      numeroRadicado: 'RAD-2026-00098',
      proveedor: 'Transporte Estudiantil SA',
      valorTotal: 7200000,
      fechaCausacion: '2026-03-23',
      diasTranscurridos: 10,
      diasMaximos: 18,
      nivelRiesgo: 'verde',
      accionRequerida: 'Enviar a Direccion Financiera',
      areaSolicitante: 'Bienestar',
      estado: 'Aprobada Auditoria - Enviar Dir. Financiera',
      cuentaContable: '5140-002',
      descripcion: 'Servicio de transporte estudiantil mensual',
    },
  ];

  const pagosPendientesComprobante: FacturaPendiente[] = [
    {
      id: '5',
      numeroFactura: 'FAC-2026-012',
      numeroRadicado: 'RAD-2026-00110',
      proveedor: 'Papeleria Central Ltda.',
      valorTotal: 2450000,
      fechaCausacion: '2026-03-15',
      diasTranscurridos: 18,
      diasMaximos: 24,
      nivelRiesgo: 'amarillo',
      accionRequerida: 'Generar comprobante de egreso',
      areaSolicitante: 'Administracion',
      estado: 'Pago Aplicado - Pendiente comprobante',
      cuentaContable: '5145-001',
      descripcion: 'Suministros de oficina y papeleria',
    },
  ];

  const todasFacturas = [...facturasPendientesAlistar, ...facturasAprobadasAuditoria, ...pagosPendientesComprobante];

  const handleVerDetalle = (factura: FacturaPendiente) => {
    setFacturaSeleccionada({
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      proveedor: factura.proveedor,
      valorTotal: factura.valorTotal,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: factura.diasTranscurridos,
      fechaRecepcion: factura.fechaCausacion,
      descripcion: factura.descripcion,
      observaciones: factura.accionRequerida,
      cuentaContable: factura.cuentaContable,
      nivelRiesgo:
        factura.nivelRiesgo === 'vencido'
          ? 'vencido'
          : factura.nivelRiesgo === 'naranja'
            ? 'rojo'
            : factura.nivelRiesgo === 'amarillo'
              ? 'amarillo'
              : 'verde',
    });
    setMostrarDetalle(true);
  };

  const vencidasCount = todasFacturas.filter((f) => f.nivelRiesgo === 'vencido').length;
  const proximasVencerCount = todasFacturas.filter((f) => f.nivelRiesgo === 'amarillo' || f.nivelRiesgo === 'naranja').length;

  const renderTabla = (titulo: string, descripcion: string, rows: FacturaPendiente[], icon: React.ReactNode, delay: number) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-800 flex items-center gap-2">{icon}{titulo}</CardTitle>
          <CardDescription>{descripcion}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                  <TableHead className="font-semibold text-slate-700">N Factura</TableHead>
                  <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                  <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                  <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                  <TableHead className="font-semibold text-slate-700">Dias</TableHead>
                  <TableHead className="font-semibold text-slate-700">Accion</TableHead>
                  <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((factura, index) => {
                  const colorRiesgo =
                    factura.nivelRiesgo === 'vencido'
                      ? 'bg-red-700'
                      : factura.nivelRiesgo === 'naranja'
                        ? 'bg-orange-500'
                        : factura.nivelRiesgo === 'amarillo'
                          ? 'bg-yellow-500'
                          : 'bg-green-500';

                  return (
                    <motion.tr
                      key={factura.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <TableCell><div className={`w-3 h-3 rounded-full ${colorRiesgo}`} /></TableCell>
                      <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                      <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                      <TableCell className="font-semibold text-slate-800">${factura.valorTotal.toLocaleString('es-CO')}</TableCell>
                      <TableCell>
                        <Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">{factura.cuentaContable}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 font-bold text-sm text-slate-700">{factura.diasTranscurridos}d / {factura.diasMaximos}d</span>
                      </TableCell>
                      <TableCell>
                        <Badge className="bg-blue-100 text-blue-800 border-blue-300 border text-xs">{factura.accionRequerida}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleVerDetalle(factura)}
                          className="border-slate-300 text-slate-700 hover:bg-slate-100"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver
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
  );

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
              <Clock className="w-7 h-7 text-yellow-400" />
            </div>
            <div>
              <h1 className="text-white mb-1 text-3xl font-bold">Mis Pendientes - Tesoreria</h1>
              <p className="text-red-100 text-sm">Alistamiento, envio a Direccion Financiera y cierre por comprobante</p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="border-0 shadow-lg border-blue-200 bg-blue-50">
            <CardContent className="p-6">
              <p className="text-blue-700 text-sm font-semibold">Por Alistar</p>
              <p className="text-3xl font-bold text-blue-800 mt-1">{facturasPendientesAlistar.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg border-purple-200 bg-purple-50">
            <CardContent className="p-6">
              <p className="text-purple-700 text-sm font-semibold">Por Enviar</p>
              <p className="text-3xl font-bold text-purple-800 mt-1">{facturasAprobadasAuditoria.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg border-green-200 bg-green-50">
            <CardContent className="p-6">
              <p className="text-green-700 text-sm font-semibold">Comprobantes</p>
              <p className="text-3xl font-bold text-green-800 mt-1">{pagosPendientesComprobante.length}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg border-red-200 bg-red-50">
            <CardContent className="p-6">
              <p className="text-red-700 text-sm font-semibold">Vencidas</p>
              <p className="text-3xl font-bold text-red-800 mt-1">{vencidasCount}</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-lg border-orange-200 bg-orange-50">
            <CardContent className="p-6">
              <p className="text-orange-700 text-sm font-semibold">Proximas</p>
              <p className="text-3xl font-bold text-orange-800 mt-1">{proximasVencerCount}</p>
            </CardContent>
          </Card>
        </div>

        {renderTabla(
          '1. Facturas Pendientes de Alistamiento',
          'Facturas causadas por Contabilidad para preparar proceso de pago',
          facturasPendientesAlistar,
          <FileCheck className="w-5 h-5 text-blue-600" />,
          0.2
        )}

        {renderTabla(
          '2. Facturas Aprobadas para Enviar a Direccion Financiera',
          'Facturas aprobadas por Auditoria pendientes de envio formal RF06',
          facturasAprobadasAuditoria,
          <Send className="w-5 h-5 text-purple-600" />,
          0.25
        )}

        {renderTabla(
          '3. Pagos Aplicados Pendientes de Comprobante',
          'Pagos ya ejecutados en banco para cierre con comprobante de egreso',
          pagosPendientesComprobante,
          <FileOutput className="w-5 h-5 text-green-600" />,
          0.3
        )}
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
