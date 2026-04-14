import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { AlertCircle, Eye, Clock, FileCheck, Send, FileOutput } from 'lucide-react';
import FacturaDetailModal from '../ui/factura-detail-modal';

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
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // PENDIENTES ESPECÍFICOS DE TESORERÍA (FLUJO CORRECTO):
  // 1. Facturas causadas que debo alistar
  // 2. Facturas aprobadas por auditoría que debo enviar a Dirección Financiera
  // 3. Pagos aplicados para generar comprobante de egreso
  
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
      descripcion: 'Servicios de mantenimiento de infraestructura tecnológica'
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
      descripcion: 'Servicios de aseo y mantenimiento general'
    }
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
      accionRequerida: 'Enviar a Dirección Financiera',
      areaSolicitante: 'Mantenimiento',
      estado: 'Aprobada Auditoría - Enviar Dir. Financiera',
      cuentaContable: '5135-001',
      descripcion: 'Servicios de mantenimiento preventivo y correctivo'
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
      accionRequerida: 'Enviar a Dirección Financiera',
      areaSolicitante: 'Bienestar',
      estado: 'Aprobada Auditoría - Enviar Dir. Financiera',
      cuentaContable: '5140-002',
      descripcion: 'Servicio de transporte estudiantil mensual'
    }
  ];

  const pagosPendientesComprobante: FacturaPendiente[] = [
    {
      id: '5',
      numeroFactura: 'FAC-2026-012',
      numeroRadicado: 'RAD-2026-00110',
      proveedor: 'Papelería Central Ltda.',
      valorTotal: 2450000,
      fechaCausacion: '2026-03-15',
      diasTranscurridos: 18,
      diasMaximos: 24,
      nivelRiesgo: 'amarillo',
      accionRequerida: 'Generar comprobante de egreso',
      areaSolicitante: 'Administración',
      estado: 'Pago Aplicado - Pendiente comprobante',
      cuentaContable: '5145-001',
      descripcion: 'Suministros de oficina y papelería'
    },
    {
      id: '6',
      numeroFactura: 'FAC-2026-015',
      numeroRadicado: 'RAD-2026-00113',
      proveedor: 'Equipos de Laboratorio SAS',
      valorTotal: 5600000,
      fechaCausacion: '2026-03-16',
      diasTranscurridos: 17,
      diasMaximos: 24,
      nivelRiesgo: 'verde',
      accionRequerida: 'Generar comprobante de egreso',
      areaSolicitante: 'Laboratorios',
      estado: 'Pago Aplicado - Pendiente comprobante',
      cuentaContable: '5160-001',
      descripcion: 'Equipos especializados para laboratorios'
    }
  ];

  const todasFacturas = [...facturasPendientesAlistar, ...facturasAprobadasAuditoria, ...pagosPendientesComprobante];

  const handleVerDetalle = (factura: FacturaPendiente) => {
    setFacturaSeleccionada({
      ...factura,
      fechaAsignacion: factura.fechaCausacion,
      etapaActual: factura.estado
    });
    setMostrarDetalle(true);
  };

  const vencidasCount = todasFacturas.filter(f => f.nivelRiesgo === 'vencido').length;
  const proximasVencerCount = todasFacturas.filter(f => f.nivelRiesgo === 'amarillo' || f.nivelRiesgo === 'naranja').length;
  const porAlistarCount = facturasPendientesAlistar.length;
  const porEnviarCount = facturasAprobadasAuditoria.length;
  const porComprobanteCount = pagosPendientesComprobante.length;

  return (
    <>
      <div className="p-8 space-y-6">
        {/* Header */}
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
              <h1 className="text-white mb-1">Mis Pendientes - Tesorería</h1>
              <p className="text-red-100 text-sm">
                Alistamiento (SLA: 18d), Envío a Dir. Financiera, y Comprobantes de Egreso (SLA: 24d)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-700 text-sm font-semibold">Por Alistar</p>
                    <p className="text-3xl font-bold text-blue-800 mt-1">{porAlistarCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                    <FileCheck className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <Card className="border-0 shadow-lg border-purple-200 bg-purple-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-700 text-sm font-semibold">Por Enviar</p>
                    <p className="text-3xl font-bold text-purple-800 mt-1">{porEnviarCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center">
                    <Send className="w-6 h-6 text-purple-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg border-green-200 bg-green-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-700 text-sm font-semibold">Comprobantes</p>
                    <p className="text-3xl font-bold text-green-800 mt-1">{porComprobanteCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center">
                    <FileOutput className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <Card className="border-0 shadow-lg border-red-200 bg-red-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-700 text-sm font-semibold">VENCIDAS</p>
                    <p className="text-3xl font-bold text-red-800 mt-1">{vencidasCount}</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center"
                  >
                    <AlertCircle className="w-6 h-6 text-red-700" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-0 shadow-lg border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-700 text-sm font-semibold">Próximas</p>
                    <p className="text-3xl font-bold text-orange-800 mt-1">{proximasVencerCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-orange-200 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-orange-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* 1. Facturas Por Alistar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-600" />
                1. Facturas Pendientes de Alistamiento
              </CardTitle>
              <CardDescription>
                Facturas causadas por Contabilidad que debo alistar (generar proceso de pago y archivo plano) - SLA: 18 días
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nº Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasPendientesAlistar.map((factura, index) => {
                      const colorRiesgo = factura.nivelRiesgo === 'vencido' ? 'bg-red-700' 
                                        : factura.nivelRiesgo === 'naranja' ? 'bg-orange-500'
                                        : factura.nivelRiesgo === 'amarillo' ? 'bg-yellow-500'
                                        : 'bg-green-500';

                      return (
                        <motion.tr
                          key={factura.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <TableCell>
                            <div className={`w-3 h-3 rounded-full ${colorRiesgo}`} />
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                          <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            ${factura.valorTotal.toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">
                              {factura.cuentaContable}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                              factura.nivelRiesgo === 'vencido' ? 'text-red-700' 
                              : factura.nivelRiesgo === 'naranja' ? 'text-orange-600'
                              : factura.nivelRiesgo === 'amarillo' ? 'text-yellow-600'
                              : 'text-green-600'
                            }`}>
                              {factura.diasTranscurridos}d / {factura.diasMaximos}d
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-blue-100 text-blue-800 border-blue-300 border text-xs">
                              {factura.accionRequerida}
                            </Badge>
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

        {/* 2. Facturas Aprobadas por Auditoría para Enviar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-600" />
                2. Facturas Aprobadas para Enviar a Dirección Financiera
              </CardTitle>
              <CardDescription>
                Facturas aprobadas por Auditoría que debo enviar a Dirección Financiera para cargue formal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nº Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasAprobadasAuditoria.map((factura, index) => {
                      const colorRiesgo = factura.nivelRiesgo === 'vencido' ? 'bg-red-700' 
                                        : factura.nivelRiesgo === 'naranja' ? 'bg-orange-500'
                                        : factura.nivelRiesgo === 'amarillo' ? 'bg-yellow-500'
                                        : 'bg-green-500';

                      return (
                        <motion.tr
                          key={factura.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <TableCell>
                            <div className={`w-3 h-3 rounded-full ${colorRiesgo}`} />
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                          <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            ${factura.valorTotal.toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">
                              {factura.cuentaContable}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                              factura.nivelRiesgo === 'vencido' ? 'text-red-700' 
                              : factura.nivelRiesgo === 'naranja' ? 'text-orange-600'
                              : factura.nivelRiesgo === 'amarillo' ? 'text-yellow-600'
                              : 'text-green-600'
                            }`}>
                              {factura.diasTranscurridos}d / {factura.diasMaximos}d
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-800 border-purple-300 border text-xs">
                              {factura.accionRequerida}
                            </Badge>
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

        {/* 3. Pagos Aplicados Pendientes de Comprobante */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800 flex items-center gap-2">
                <FileOutput className="w-5 h-5 text-green-600" />
                3. Pagos Aplicados Pendientes de Comprobante de Egreso
              </CardTitle>
              <CardDescription>
                Facturas con pago ya aplicado que requieren generación de comprobante de egreso - SLA: 24 días total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50">
                      <TableHead className="font-semibold text-slate-700">SLA</TableHead>
                      <TableHead className="font-semibold text-slate-700">Nº Factura</TableHead>
                      <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Cuenta</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagosPendientesComprobante.map((factura, index) => {
                      const colorRiesgo = factura.nivelRiesgo === 'vencido' ? 'bg-red-700' 
                                        : factura.nivelRiesgo === 'naranja' ? 'bg-orange-500'
                                        : factura.nivelRiesgo === 'amarillo' ? 'bg-yellow-500'
                                        : 'bg-green-500';

                      return (
                        <motion.tr
                          key={factura.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className={`w-3 h-3 rounded-full ${colorRiesgo}`} />
                              {factura.nivelRiesgo === 'vencido' && (
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1] }}
                                  transition={{ repeat: Infinity, duration: 1.5 }}
                                >
                                  <AlertCircle className="w-4 h-4 text-red-700" />
                                </motion.div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                          <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                          <TableCell className="font-semibold text-green-700">
                            ${factura.valorTotal.toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-purple-100 text-purple-700 border-purple-200 border font-mono text-xs">
                              {factura.cuentaContable}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                              factura.nivelRiesgo === 'vencido' ? 'text-red-700' 
                              : factura.nivelRiesgo === 'naranja' ? 'text-orange-600'
                              : factura.nivelRiesgo === 'amarillo' ? 'text-yellow-600'
                              : 'text-green-600'
                            }`}>
                              {factura.diasTranscurridos}d / {factura.diasMaximos}d
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-green-100 text-green-800 border-green-300 border text-xs">
                              {factura.accionRequerida}
                            </Badge>
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
      </div>

      {/* Modal de Detalle */}
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
