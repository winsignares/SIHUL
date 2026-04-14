import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Button } from '../ui/button';
import { AlertCircle, Eye, Clock, TrendingUp, FileText } from 'lucide-react';
import FacturaDetailModal from '../ui/factura-detail-modal';

interface FacturaPendiente {
  id: string;
  numeroFactura: string;
  proveedor: string;
  valorTotal: number;
  fechaRecepcion: string;
  diasTranscurridos: number;
  diasMaximos: number;
  nivelRiesgo: 'verde' | 'amarillo' | 'naranja' | 'vencido';
  accionRequerida: string;
  areaSolicitante: string;
  estado: string;
  descripcion?: string;
}

export default function MisPendientes() {
  const [facturaSeleccionada, setFacturaSeleccionada] = useState<any>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // PENDIENTES ESPECÍFICOS DE FUNCIONARIO: Solo facturas que ÉL debe registrar
  const facturasPendientes: FacturaPendiente[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-145',
      proveedor: 'Tecnología Global SAS',
      valorTotal: 8900000,
      fechaRecepcion: '2026-03-30',
      diasTranscurridos: 1,
      diasMaximos: 2,
      nivelRiesgo: 'amarillo',
      accionRequerida: 'Registrar factura y subir documentos',
      areaSolicitante: 'Sistemas',
      estado: 'Recibida - Sin registrar',
      descripcion: 'Equipos de cómputo para área administrativa'
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-138',
      proveedor: 'Editorial Académica Colombia',
      valorTotal: 6750000,
      fechaRecepcion: '2026-03-26',
      diasTranscurridos: 4,
      diasMaximos: 2,
      nivelRiesgo: 'vencido',
      accionRequerida: 'URGENTE: Registrar factura VENCIDA',
      areaSolicitante: 'Biblioteca',
      estado: 'VENCIDA - Sin registrar',
      descripcion: 'Libros académicos y material bibliográfico'
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-152',
      proveedor: 'Servicios Médicos Especializados',
      valorTotal: 12500000,
      fechaRecepcion: '2026-03-31',
      diasTranscurridos: 0,
      diasMaximos: 2,
      nivelRiesgo: 'verde',
      accionRequerida: 'Registrar factura y subir documentos',
      areaSolicitante: 'Enfermería',
      estado: 'Recibida - Sin registrar',
      descripcion: 'Servicios médicos especializados mes de marzo'
    }
  ];

  const handleVerDetalle = (factura: FacturaPendiente) => {
    setFacturaSeleccionada({
      ...factura,
      numeroRadicado: undefined,
      fechaAsignacion: factura.fechaRecepcion,
      etapaActual: 'Registro y Recepción'
    });
    setMostrarDetalle(true);
  };

  const vencidasCount = facturasPendientes.filter(f => f.nivelRiesgo === 'vencido').length;
  const proximasVencerCount = facturasPendientes.filter(f => f.nivelRiesgo === 'amarillo' || f.nivelRiesgo === 'naranja').length;

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
              <h1 className="text-white mb-1">Mis Pendientes</h1>
              <p className="text-red-100 text-sm">
                Facturas recibidas que debo registrar en el sistema (SLA: 2 días)
              </p>
            </div>
          </div>
        </motion.div>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-0 shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-500 text-sm">Total Pendientes</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">{facturasPendientes.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
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
                    <p className="text-purple-700 text-sm font-semibold">Facturas VENCIDAS</p>
                    <p className="text-3xl font-bold text-purple-800 mt-1">{vencidasCount}</p>
                  </div>
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center"
                  >
                    <AlertCircle className="w-6 h-6 text-purple-700" />
                  </motion.div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-0 shadow-lg border-yellow-200 bg-yellow-50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-700 text-sm font-semibold">Próximas a Vencer</p>
                    <p className="text-3xl font-bold text-yellow-800 mt-1">{proximasVencerCount}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-yellow-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Tabla */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-800">Facturas Pendientes de Registro</CardTitle>
              <CardDescription>
                Facturas físicas recibidas que debo registrar en el sistema antes de 2 días
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
                      <TableHead className="font-semibold text-slate-700">Área</TableHead>
                      <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                      <TableHead className="font-semibold text-slate-700">Fecha Recepción</TableHead>
                      <TableHead className="font-semibold text-slate-700">Días</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acción Requerida</TableHead>
                      <TableHead className="font-semibold text-slate-700">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {facturasPendientes.map((factura, index) => {
                      const colorRiesgo = factura.nivelRiesgo === 'vencido' ? 'bg-purple-700' 
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
                                  <AlertCircle className="w-4 h-4 text-purple-700" />
                                </motion.div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                          <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                          <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            ${factura.valorTotal.toLocaleString('es-CO')}
                          </TableCell>
                          <TableCell className="text-slate-600 text-sm">{factura.fechaRecepcion}</TableCell>
                          <TableCell>
                            <span className={`inline-flex items-center gap-1 font-bold text-sm ${
                              factura.nivelRiesgo === 'vencido' 
                                ? 'text-purple-700' 
                                : factura.nivelRiesgo === 'naranja'
                                ? 'text-orange-600'
                                : factura.nivelRiesgo === 'amarillo'
                                ? 'text-yellow-600'
                                : 'text-green-600'
                            }`}>
                              {factura.diasTranscurridos}d / {factura.diasMaximos}d
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${
                              factura.nivelRiesgo === 'vencido'
                                ? 'bg-purple-100 text-purple-800 border-purple-300'
                                : 'bg-blue-100 text-blue-800 border-blue-300'
                            } border text-xs`}>
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
