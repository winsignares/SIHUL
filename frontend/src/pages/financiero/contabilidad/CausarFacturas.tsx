import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../share/table';
import {
  Calculator,
  Filter,
  CheckCircle2,
  XCircle,
  FileText,
  Eye,
  ChevronDown,
  Check,
  Send,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../../share/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '../../../share/command';
import { Popover, PopoverContent, PopoverTrigger } from '../../../share/popover';
import TableFilters from '../../../share/table-filters';
import FacturaDetailModal, { type SharedFacturaDetail } from '../../../share/factura-detail-modal';

// CATÁLOGO DE CUENTAS CONTABLES
const CUENTAS_CONTABLES = [
  {
    codigo: '2335-001',
    nombre: 'Costos y Gastos por Pagar - Servicios Públicos',
    activa: true,
    categoria: 'Servicios',
  },
  {
    codigo: '2335-002',
    nombre: 'Costos y Gastos por Pagar - Honorarios',
    activa: true,
    categoria: 'Servicios',
  },
  {
    codigo: '2335-005',
    nombre: 'Costos y Gastos por Pagar - Servicios de Mantenimiento',
    activa: true,
    categoria: 'Mantenimiento',
  },
  {
    codigo: '5165-001',
    nombre: 'Servicios de Tecnología e Informática',
    activa: true,
    categoria: 'Sistemas',
  },
  {
    codigo: '5135-001',
    nombre: 'Servicios de Aseo y Vigilancia',
    activa: true,
    categoria: 'Servicios',
  },
  {
    codigo: '5155-001',
    nombre: 'Libros y Publicaciones',
    activa: true,
    categoria: 'Biblioteca',
  },
  {
    codigo: '5170-001',
    nombre: 'Gastos Médicos y Laboratorio',
    activa: true,
    categoria: 'Enfermería',
  },
];

// CATÁLOGO DE CENTROS DE COSTOS
const CENTROS_COSTOS = [
  { codigo: 'CC-001', nombre: 'Rectoría', activa: true },
  { codigo: 'CC-002', nombre: 'Vicerrectoría Académica', activa: true },
  { codigo: 'CC-007', nombre: 'Sistemas e Informática', activa: true },
  { codigo: 'CC-008', nombre: 'Mantenimiento y Servicios Generales', activa: true },
  { codigo: 'CC-006', nombre: 'Biblioteca Central', activa: true },
  { codigo: 'CC-010', nombre: 'Enfermería y Bienestar', activa: true },
];

interface Factura {
  id: string;
  numeroFactura: string;
  numeroRadicado: string;
  proveedor: string;
  valorTotal: number;
  fechaFactura: string;
  fechaRadicacion: string;
  areaSolicitante: string;
  estado: string;
}

type CausarFiltros = {
  numeroFactura: string;
  proveedor: string;
  estado: string;
  areaSolicitante: string;
  fechaInicio: string;
  fechaFin: string;
  montoMin: string;
  montoMax: string;
};

export default function CausarFacturas() {
  const [filtros, setFiltros] = useState({
    numeroFactura: '',
    proveedor: '',
    estado: 'Radicada',
    areaSolicitante: '',
    fechaInicio: '',
    fechaFin: '',
    montoMin: '',
    montoMax: '',
  } as CausarFiltros);

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDialog, setMostrarDialog] = useState(false);
  const [accion, setAccion] = useState<'aprobar' | 'devolver'>('aprobar');

  // Estados para Cuenta Contable
  const [cuentaContableSeleccionada, setCuentaContableSeleccionada] = useState('');
  const [openCuentaContable, setOpenCuentaContable] = useState(false);
  const [busquedaCuenta, setBusquedaCuenta] = useState('');

  // Estados para Centro de Costos
  const [centroCostoSeleccionado, setCentroCostoSeleccionado] = useState('');
  const [openCentroCosto, setOpenCentroCosto] = useState(false);
  const [busquedaCentroCosto, setBusquedaCentroCosto] = useState('');

  const [observaciones, setObservaciones] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [detalleFactura, setDetalleFactura] = useState<SharedFacturaDetail | null>(null);
  const [mostrarDetalle, setMostrarDetalle] = useState(false);

  // Facturas en estado "Radicada"
  const facturasRadicadas: Factura[] = [
    {
      id: '1',
      numeroFactura: 'FAC-2026-002',
      numeroRadicado: 'RAD-2026-087',
      proveedor: 'Servicios TI Colombia SAS',
      valorTotal: 8950000,
      fechaFactura: '2026-03-19',
      fechaRadicacion: '2026-03-23',
      areaSolicitante: 'Sistemas',
      estado: 'Radicada',
    },
    {
      id: '2',
      numeroFactura: 'FAC-2026-006',
      numeroRadicado: 'RAD-2026-089',
      proveedor: 'Servicios de Aseo Total',
      valorTotal: 4200000,
      fechaFactura: '2026-03-14',
      fechaRadicacion: '2026-03-23',
      areaSolicitante: 'Servicios Generales',
      estado: 'Radicada',
    },
    {
      id: '3',
      numeroFactura: 'FAC-2026-012',
      numeroRadicado: 'RAD-2026-090',
      proveedor: 'Mantenimiento Integral EU',
      valorTotal: 6750000,
      fechaFactura: '2026-03-20',
      fechaRadicacion: '2026-03-22',
      areaSolicitante: 'Mantenimiento',
      estado: 'Radicada',
    },
    {
      id: '4',
      numeroFactura: 'FAC-2026-013',
      numeroRadicado: 'RAD-2026-091',
      proveedor: 'Editorial Académica',
      valorTotal: 3890000,
      fechaFactura: '2026-03-21',
      fechaRadicacion: '2026-03-22',
      areaSolicitante: 'Biblioteca',
      estado: 'Radicada',
    },
  ];

  // FUNCIÓN DE SUGERENCIA AUTOMÁTICA
  const sugerirCuentaContable = (factura: Factura): string => {
    const area = factura.areaSolicitante.toLowerCase();
    const proveedor = factura.proveedor.toLowerCase();

    if (
      area.includes('sistemas') ||
      area.includes('tecnología') ||
      proveedor.includes('ti') ||
      proveedor.includes('tecnología')
    ) {
      return '5165-001';
    }
    if (area.includes('mantenimiento') || proveedor.includes('mantenimiento')) {
      return '2335-005';
    }
    if (
      area.includes('biblioteca') ||
      proveedor.includes('editorial') ||
      proveedor.includes('libros')
    ) {
      return '5155-001';
    }
    if (
      area.includes('aseo') ||
      area.includes('servicios generales') ||
      proveedor.includes('aseo') ||
      proveedor.includes('limpieza')
    ) {
      return '5135-001';
    }
    if (
      area.includes('enfermería') ||
      proveedor.includes('médico') ||
      proveedor.includes('laboratorio')
    ) {
      return '5170-001';
    }

    return '2335-001';
  };

  const cuentaSugerida = useMemo(() => {
    if (facturaSeleccionada && accion === 'aprobar') {
      return sugerirCuentaContable(facturaSeleccionada);
    }
    return '';
  }, [facturaSeleccionada, accion]);

  const cuentasActivas = CUENTAS_CONTABLES.filter((c) => c.activa);
  const cuentasFiltradas = cuentasActivas.filter(
    (cuenta) =>
      cuenta.codigo.toLowerCase().includes(busquedaCuenta.toLowerCase()) ||
      cuenta.nombre.toLowerCase().includes(busquedaCuenta.toLowerCase()) ||
      cuenta.categoria.toLowerCase().includes(busquedaCuenta.toLowerCase())
  );

  const centrosCostosActivos = CENTROS_COSTOS.filter((c) => c.activa);
  const centrosCostosFiltrados = centrosCostosActivos.filter(
    (centro) =>
      centro.codigo.toLowerCase().includes(busquedaCentroCosto.toLowerCase()) ||
      centro.nombre.toLowerCase().includes(busquedaCentroCosto.toLowerCase())
  );

  const facturasFiltradas = facturasRadicadas.filter((factura) => {
    if (
      filtros.numeroFactura &&
      !(
        factura.numeroFactura.toLowerCase().includes(filtros.numeroFactura.toLowerCase()) ||
        factura.numeroRadicado.toLowerCase().includes(filtros.numeroFactura.toLowerCase())
      )
    ) {
      return false;
    }

    if (filtros.proveedor && factura.proveedor !== filtros.proveedor) {
      return false;
    }

    if (filtros.estado && factura.estado !== filtros.estado) {
      return false;
    }

    if (filtros.areaSolicitante && factura.areaSolicitante !== filtros.areaSolicitante) {
      return false;
    }

    if (filtros.fechaInicio && factura.fechaRadicacion < filtros.fechaInicio) {
      return false;
    }

    if (filtros.fechaFin && factura.fechaRadicacion > filtros.fechaFin) {
      return false;
    }

    if (filtros.montoMin && factura.valorTotal < Number(filtros.montoMin)) {
      return false;
    }

    if (filtros.montoMax && factura.valorTotal > Number(filtros.montoMax)) {
      return false;
    }

    return true;
  });

  const abrirDetalle = (factura: Factura) => {
    setDetalleFactura({
      id: factura.id,
      numeroFactura: factura.numeroFactura,
      numeroRadicado: factura.numeroRadicado,
      proveedor: factura.proveedor,
      valorTotal: factura.valorTotal,
      fechaFactura: factura.fechaFactura,
      fechaRecepcion: factura.fechaRadicacion,
      areaSolicitante: factura.areaSolicitante,
      estado: factura.estado,
      diasTranscurridos: 2,
      descripcion: 'Factura en revisión para causación contable.',
      observaciones: 'Pendiente de asignación de cuenta contable y centro de costo.',
      nivelRiesgo: 'amarillo',
    });
    setMostrarDetalle(true);
  };

  const abrirDialog = (factura: Factura, accionSeleccionada: 'aprobar' | 'devolver') => {
    setFacturaSeleccionada(factura);
    setAccion(accionSeleccionada);
    setCuentaContableSeleccionada(sugerirCuentaContable(factura));
    setCentroCostoSeleccionado('');
    setObservaciones('');
    setMostrarDialog(true);
  };

  const procesarCausacion = () => {
    if (!facturaSeleccionada) return;

    if (accion === 'aprobar' && !cuentaContableSeleccionada) {
      alert('❌ ERROR\n\nDebe seleccionar una cuenta contable para causar la factura.');
      return;
    }

    if (accion === 'devolver' && !observaciones.trim()) {
      alert('❌ ERROR\n\nDebe ingresar una observación obligatoria para devolver la factura.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      if (accion === 'aprobar') {
        const cuentaObj = CUENTAS_CONTABLES.find(
          (c) => c.codigo === cuentaContableSeleccionada
        );
        alert(
          `✅ FACTURA CAUSADA EXITOSAMENTE\n\nFactura: ${facturaSeleccionada.numeroFactura}\nRadicado: ${facturaSeleccionada.numeroRadicado}\nProveedor: ${facturaSeleccionada.proveedor}\n\n📊 Cuenta Contable: ${cuentaObj?.codigo} ${cuentaObj?.nombre}\n📅 Fecha de Causación: ${new Date().toISOString().split('T')[0]}\n\nEstado: CAUSADA\nSiguiente etapa: Alistamiento en Tesorería`
        );
      } else {
        alert(
          `✅ FACTURA DEVUELTA\n\nFactura: ${facturaSeleccionada.numeroFactura}\nRadicado: ${facturaSeleccionada.numeroRadicado}\nProveedor: ${facturaSeleccionada.proveedor}\n\nMotivo de devolución:\n${observaciones}\n\n📧 Se ha notificado para correcciones.\n\nEstado: DEVUELTA`
        );
      }

      setIsProcessing(false);
      setMostrarDialog(false);
      setFacturaSeleccionada(null);
      setCuentaContableSeleccionada('');
      setCentroCostoSeleccionado('');
      setObservaciones('');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Calculator className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-2xl font-bold">Causar Facturas</h1>
            <p className="text-red-100 text-sm">
              Registrar el reconocimiento contable de las obligaciones
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
          <CardContent>
            <TableFilters
              filters={filtros}
              onFilterChange={setFiltros}
              estados={['Radicada']}
              proveedores={Array.from(new Set(facturasRadicadas.map((f) => f.proveedor)))}
              areas={Array.from(new Set(facturasRadicadas.map((f) => f.areaSolicitante)))}
              showMontoFilter={true}
              showFechaFilter={true}
              showAreaFilter={true}
            />
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Facturas */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-slate-800">Facturas Radicadas Pendientes</CardTitle>
                <CardDescription>
                  {facturasFiltradas.length} factura(s) en estado "Radicada"
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    <TableHead className="font-semibold text-slate-700">Nº Factura</TableHead>
                    <TableHead className="font-semibold text-slate-700">Nº Radicado</TableHead>
                    <TableHead className="font-semibold text-slate-700">Proveedor</TableHead>
                    <TableHead className="font-semibold text-slate-700">Monto</TableHead>
                    <TableHead className="font-semibold text-slate-700">Área</TableHead>
                    <TableHead className="font-semibold text-slate-700">
                      Fecha Radicación
                    </TableHead>
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
                      <TableCell className="font-medium text-slate-800">
                        {factura.numeroFactura}
                      </TableCell>
                      <TableCell className="text-blue-600 font-medium">
                        {factura.numeroRadicado}
                      </TableCell>
                      <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        ${factura.valorTotal.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                      <TableCell className="text-slate-600">{factura.fechaRadicacion}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => abrirDetalle(factura)}
                            variant="outline"
                            className="border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => abrirDialog(factura, 'aprobar')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => abrirDialog(factura, 'devolver')}
                            variant="outline"
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
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

      {/* Dialog de Causación */}
      <Dialog open={mostrarDialog} onOpenChange={setMostrarDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {accion === 'aprobar' ? '✅ Causar Factura' : '❌ Devolver Factura'}
            </DialogTitle>
            <DialogDescription>
              {accion === 'aprobar'
                ? 'Asigne la cuenta contable y centro de costo correspondiente'
                : 'Especifique el motivo de la devolución'}
            </DialogDescription>
          </DialogHeader>

          {facturaSeleccionada && (
            <div className="space-y-6 py-4">
              {/* Información de la factura */}
              <div className="bg-slate-50 rounded-lg p-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Factura</p>
                  <p className="font-bold text-slate-800">{facturaSeleccionada.numeroFactura}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Radicado</p>
                  <p className="font-bold text-blue-600">{facturaSeleccionada.numeroRadicado}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Proveedor</p>
                  <p className="font-bold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Monto</p>
                  <p className="font-bold text-green-600">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
              </div>

              {accion === 'aprobar' ? (
                <>
                  {/* Cuenta Contable */}
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-semibold">
                      * Cuenta Contable (Auto-sugerida)
                    </Label>
                    <Popover open={openCuentaContable} onOpenChange={setOpenCuentaContable}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-slate-300"
                        >
                          {cuentaContableSeleccionada
                            ? `${cuentaContableSeleccionada} - ${CUENTAS_CONTABLES.find((c) => c.codigo === cuentaContableSeleccionada)?.nombre}`
                            : 'Seleccionar cuenta...'}
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar cuenta..."
                            value={busquedaCuenta}
                            onValueChange={setBusquedaCuenta}
                          />
                          <CommandEmpty>No se encontraron cuentas.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {cuentasFiltradas.map((cuenta) => (
                                <CommandItem
                                  key={cuenta.codigo}
                                  value={cuenta.codigo}
                                  onSelect={(value) => {
                                    setCuentaContableSeleccionada(value);
                                    setOpenCuentaContable(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      cuentaContableSeleccionada === cuenta.codigo
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{cuenta.codigo}</span>
                                    <span className="text-xs text-slate-500">
                                      {cuenta.nombre}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Centro de Costo */}
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-semibold">Centro de Costo</Label>
                    <Popover open={openCentroCosto} onOpenChange={setOpenCentroCosto}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between border-slate-300"
                        >
                          {centroCostoSeleccionado
                            ? `${centroCostoSeleccionado} - ${CENTROS_COSTOS.find((c) => c.codigo === centroCostoSeleccionado)?.nombre}`
                            : 'Seleccionar centro de costo...'}
                          <ChevronDown className="w-4 h-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-full p-0" align="start">
                        <Command>
                          <CommandInput
                            placeholder="Buscar centro..."
                            value={busquedaCentroCosto}
                            onValueChange={setBusquedaCentroCosto}
                          />
                          <CommandEmpty>No se encontraron centros.</CommandEmpty>
                          <CommandList>
                            <CommandGroup>
                              {centrosCostosFiltrados.map((centro) => (
                                <CommandItem
                                  key={centro.codigo}
                                  value={centro.codigo}
                                  onSelect={(value) => {
                                    setCentroCostoSeleccionado(value);
                                    setOpenCentroCosto(false);
                                  }}
                                >
                                  <Check
                                    className={`mr-2 h-4 w-4 ${
                                      centroCostoSeleccionado === centro.codigo
                                        ? 'opacity-100'
                                        : 'opacity-0'
                                    }`}
                                  />
                                  <div className="flex flex-col">
                                    <span className="font-semibold">{centro.codigo}</span>
                                    <span className="text-xs text-slate-500">
                                      {centro.nombre}
                                    </span>
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Observaciones opcionales */}
                  <div className="space-y-3">
                    <Label className="text-slate-700 font-semibold">
                      Observaciones (Opcional)
                    </Label>
                    <Textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Agregar observaciones importantes..."
                      className="min-h-20 border-slate-300"
                    />
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <Label className="text-slate-700 font-semibold text-red-700">
                    * Motivo de Devolución (Requerido)
                  </Label>
                  <Textarea
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Especifique claramente qué debe corregirse..."
                    className="min-h-32 border-red-300 focus:border-red-600 focus:ring-red-600"
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setMostrarDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={procesarCausacion}
              disabled={isProcessing}
              className={`${accion === 'aprobar' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
            >
              <Send className="w-4 h-4 mr-2" />
              {isProcessing ? 'Procesando...' : accion === 'aprobar' ? 'Causar Factura' : 'Devolver Factura'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <FacturaDetailModal
        factura={detalleFactura}
        isOpen={mostrarDetalle}
        onClose={() => {
          setMostrarDetalle(false);
          setDetalleFactura(null);
        }}
      />
    </div>
  );
}
