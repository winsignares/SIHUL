import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';
import { 
  Calculator, Search, Filter, CheckCircle2, XCircle, FileText, Calendar,
  TrendingUp, Building, ChevronDown, Check, Sparkles
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '../ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '../ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { toast } from 'sonner@2.0.3';

// CATÁLOGO DE CUENTAS CONTABLES (PUC Colombiano - Sector Educación)
const CUENTAS_CONTABLES = [
  { codigo: '2335-001', nombre: 'Costos y Gastos por Pagar - Servicios Públicos', activa: true, categoria: 'Servicios' },
  { codigo: '2335-002', nombre: 'Costos y Gastos por Pagar - Honorarios', activa: true, categoria: 'Servicios' },
  { codigo: '2335-003', nombre: 'Costos y Gastos por Pagar - Arrendamientos', activa: true, categoria: 'Servicios' },
  { codigo: '2335-004', nombre: 'Costos y Gastos por Pagar - Servicios Técnicos', activa: true, categoria: 'Servicios' },
  { codigo: '2335-005', nombre: 'Costos y Gastos por Pagar - Servicios de Mantenimiento', activa: true, categoria: 'Mantenimiento' },
  { codigo: '2335-006', nombre: 'Costos y Gastos por Pagar - Servicios de Aseo y Vigilancia', activa: true, categoria: 'Servicios' },
  { codigo: '2335-007', nombre: 'Costos y Gastos por Pagar - Servicios de Alimentación', activa: true, categoria: 'Servicios' },
  { codigo: '2370-001', nombre: 'Retención en la Fuente - Honorarios', activa: true, categoria: 'Retenciones' },
  { codigo: '2370-002', nombre: 'Retención en la Fuente - Servicios', activa: true, categoria: 'Retenciones' },
  { codigo: '5105-001', nombre: 'Gastos de Personal - Sueldos', activa: true, categoria: 'Nómina' },
  { codigo: '5110-001', nombre: 'Honorarios Profesionales', activa: true, categoria: 'Servicios' },
  { codigo: '5115-001', nombre: 'Servicios Públicos', activa: true, categoria: 'Servicios' },
  { codigo: '5120-001', nombre: 'Arrendamientos', activa: true, categoria: 'Servicios' },
  { codigo: '5125-001', nombre: 'Mantenimiento y Reparaciones', activa: true, categoria: 'Mantenimiento' },
  { codigo: '5130-001', nombre: 'Seguros', activa: true, categoria: 'Seguros' },
  { codigo: '5135-001', nombre: 'Servicios de Aseo y Vigilancia', activa: true, categoria: 'Servicios' },
  { codigo: '5140-001', nombre: 'Gastos de Viaje', activa: true, categoria: 'Administrativos' },
  { codigo: '5145-001', nombre: 'Útiles y Papelería', activa: true, categoria: 'Suministros' },
  { codigo: '5150-001', nombre: 'Elementos de Aseo y Cafetería', activa: true, categoria: 'Suministros' },
  { codigo: '5155-001', nombre: 'Libros y Publicaciones', activa: true, categoria: 'Biblioteca' },
  { codigo: '5160-001', nombre: 'Gastos de Publicidad', activa: true, categoria: 'Marketing' },
  { codigo: '5165-001', nombre: 'Servicios de Tecnología e Informática', activa: true, categoria: 'Sistemas' },
  { codigo: '5170-001', nombre: 'Gastos Médicos y Laboratorio', activa: true, categoria: 'Enfermería' },
  { codigo: '1435-001', nombre: 'Inventario de Suministros', activa: true, categoria: 'Inventarios' },
  { codigo: '1520-001', nombre: 'Equipos de Cómputo', activa: true, categoria: 'Activos' },
  { codigo: '1524-001', nombre: 'Equipos de Oficina', activa: true, categoria: 'Activos' },
  { codigo: '2335-008', nombre: 'Costos y Gastos por Pagar - Otros Servicios', activa: true, categoria: 'Servicios' },
  { codigo: '9999-999', nombre: 'Cuenta de Prueba Inactiva', activa: false, categoria: 'Test' }
];

// CATÁLOGO DE CENTROS DE COSTOS
const CENTROS_COSTOS = [
  { codigo: 'CC-001', nombre: 'Rectoría', activa: true },
  { codigo: 'CC-002', nombre: 'Vicerrectoría Académica', activa: true },
  { codigo: 'CC-003', nombre: 'Vicerrectoría Administrativa', activa: true },
  { codigo: 'CC-004', nombre: 'Facultad de Ingeniería', activa: true },
  { codigo: 'CC-005', nombre: 'Facultad de Ciencias Sociales', activa: true },
  { codigo: 'CC-006', nombre: 'Biblioteca Central', activa: true },
  { codigo: 'CC-007', nombre: 'Sistemas e Informática', activa: true },
  { codigo: 'CC-008', nombre: 'Mantenimiento y Servicios Generales', activa: true },
  { codigo: 'CC-009', nombre: 'Talento Humano', activa: true },
  { codigo: 'CC-010', nombre: 'Enfermería y Bienestar', activa: true },
  { codigo: 'CC-011', nombre: 'Investigación', activa: true },
  { codigo: 'CC-012', nombre: 'Laboratorios', activa: true },
  { codigo: 'CC-013', nombre: 'Infraestructura', activa: true },
  { codigo: 'CC-014', nombre: 'Marketing y Comunicaciones', activa: true }
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

export default function CausarFacturas() {
  const [filtros, setFiltros] = useState({
    busqueda: '',
    proveedor: ''
  });

  const [facturaSeleccionada, setFacturaSeleccionada] = useState<Factura | null>(null);
  const [mostrarDialogCausar, setMostrarDialogCausar] = useState(false);
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

  // Facturas en estado "Radicada" listas para causar
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
      estado: 'Radicada'
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
      estado: 'Radicada'
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
      estado: 'Radicada'
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
      estado: 'Radicada'
    }
  ];

  // FUNCIÓN DE SUGERENCIA AUTOMÁTICA DE CUENTA CONTABLE
  const sugerirCuentaContable = (factura: Factura): string => {
    const area = factura.areaSolicitante.toLowerCase();
    const proveedor = factura.proveedor.toLowerCase();

    // Reglas de sugerencia basadas en área y proveedor
    if (area.includes('sistemas') || area.includes('tecnología') || proveedor.includes('ti') || proveedor.includes('tecnología')) {
      return '5165-001'; // Servicios de Tecnología e Informática
    }
    if (area.includes('mantenimiento') || proveedor.includes('mantenimiento')) {
      return '5125-001'; // Mantenimiento y Reparaciones
    }
    if (area.includes('biblioteca') || proveedor.includes('editorial') || proveedor.includes('libros')) {
      return '5155-001'; // Libros y Publicaciones
    }
    if (area.includes('aseo') || area.includes('servicios generales') || proveedor.includes('aseo') || proveedor.includes('limpieza')) {
      return '5135-001'; // Servicios de Aseo y Vigilancia
    }
    if (area.includes('enfermería') || proveedor.includes('médico') || proveedor.includes('laboratorio')) {
      return '5170-001'; // Gastos Médicos y Laboratorio
    }
    if (proveedor.includes('honorarios') || proveedor.includes('consultoría')) {
      return '5110-001'; // Honorarios Profesionales
    }
    
    // Default: Otros servicios
    return '2335-008';
  };

  // Obtener cuenta sugerida cuando se abre el dialog
  const cuentaSugerida = useMemo(() => {
    if (facturaSeleccionada && accion === 'aprobar') {
      return sugerirCuentaContable(facturaSeleccionada);
    }
    return '';
  }, [facturaSeleccionada, accion]);

  // Filtrar cuentas contables activas
  const cuentasActivas = CUENTAS_CONTABLES.filter(c => c.activa);
  
  // Filtrar cuentas según búsqueda
  const cuentasFiltradas = cuentasActivas.filter(cuenta => 
    cuenta.codigo.toLowerCase().includes(busquedaCuenta.toLowerCase()) ||
    cuenta.nombre.toLowerCase().includes(busquedaCuenta.toLowerCase()) ||
    cuenta.categoria.toLowerCase().includes(busquedaCuenta.toLowerCase())
  );

  // Filtrar centros de costo activos y según búsqueda
  const centrosCostosActivos = CENTROS_COSTOS.filter(c => c.activa);
  const centrosCostosFiltrados = centrosCostosActivos.filter(centro =>
    centro.codigo.toLowerCase().includes(busquedaCentroCosto.toLowerCase()) ||
    centro.nombre.toLowerCase().includes(busquedaCentroCosto.toLowerCase())
  );

  const facturasFiltradas = facturasRadicadas.filter(factura => {
    if (filtros.busqueda && !factura.numeroFactura.toLowerCase().includes(filtros.busqueda.toLowerCase()) &&
        !factura.proveedor.toLowerCase().includes(filtros.busqueda.toLowerCase()) &&
        !factura.numeroRadicado.toLowerCase().includes(filtros.busqueda.toLowerCase())) {
      return false;
    }
    if (filtros.proveedor && factura.proveedor !== filtros.proveedor) {
      return false;
    }
    return true;
  });

  const abrirDialogCausar = (factura: Factura, accionSeleccionada: 'aprobar' | 'devolver') => {
    setFacturaSeleccionada(factura);
    setAccion(accionSeleccionada);
    setCuentaContableSeleccionada('');
    setCentroCostoSeleccionado('');
    setObservaciones('');
    setMostrarDialogCausar(true);
  };

  const procesarCausacion = () => {
    if (!facturaSeleccionada) return;

    // Validaciones
    if (accion === 'aprobar' && !cuentaContableSeleccionada) {
      toast.error('Cuenta contable requerida', {
        description: 'Debe seleccionar la cuenta contable para causar la factura'
      });
      return;
    }

    if (accion === 'devolver' && !observaciones.trim()) {
      toast.error('Observación requerida', {
        description: 'Debe ingresar una observación obligatoria para devolver la factura'
      });
      return;
    }

    setIsProcessing(true);

    // Simular proceso de causación
    setTimeout(() => {
      if (accion === 'aprobar') {
        const cuentaObj = CUENTAS_CONTABLES.find(c => c.codigo === cuentaContableSeleccionada);
        const centroObj = CENTROS_COSTOS.find(c => c.codigo === centroCostoSeleccionado);
        
        toast.success('¡Factura causada exitosamente!', {
          description: `${facturaSeleccionada.numeroFactura} - Cuenta: ${cuentaObj?.codigo} ${cuentaObj?.nombre}`
        });
      } else {
        toast.warning('Factura devuelta', {
          description: `${facturaSeleccionada.numeroFactura} - Estado: Devuelta a origen`
        });
      }

      setIsProcessing(false);
      setMostrarDialogCausar(false);
      setFacturaSeleccionada(null);
      setCuentaContableSeleccionada('');
      setCentroCostoSeleccionado('');
      setObservaciones('');
    }, 1500);
  };

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
            <Calculator className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1">Causar Facturas</h1>
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
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-slate-800">
              <Filter className="w-5 h-5 text-red-600" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Buscar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Factura, radicado o proveedor..."
                    value={filtros.busqueda}
                    onChange={(e) => setFiltros({ ...filtros, busqueda: e.target.value })}
                    className="pl-10 border-slate-300 focus:border-red-600 focus:ring-red-600"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full border-red-600 text-red-600 hover:bg-red-50"
                  onClick={() => setFiltros({ busqueda: '', proveedor: '' })}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabla de Facturas Radicadas */}
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
              <Badge className="bg-green-100 text-green-700 border-green-200 border text-lg px-4 py-2">
                {facturasFiltradas.length} Por Causar
              </Badge>
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
                    <TableHead className="font-semibold text-slate-700">Fecha Radicación</TableHead>
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
                      <TableCell className="font-medium text-slate-800">{factura.numeroFactura}</TableCell>
                      <TableCell className="text-slate-600">
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200 border">
                          {factura.numeroRadicado}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600">{factura.proveedor}</TableCell>
                      <TableCell className="font-semibold text-slate-800">
                        ${factura.valorTotal.toLocaleString('es-CO')}
                      </TableCell>
                      <TableCell className="text-slate-600">{factura.areaSolicitante}</TableCell>
                      <TableCell className="text-slate-600">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {factura.fechaRadicacion}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => abrirDialogCausar(factura, 'aprobar')}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Causar
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => abrirDialogCausar(factura, 'devolver')}
                            className="border-red-600 text-red-600 hover:bg-red-50"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Devolver
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

      {/* Dialog Causar/Devolver */}
      <Dialog open={mostrarDialogCausar} onOpenChange={setMostrarDialogCausar}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-800">
              {accion === 'aprobar' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  Causar Factura - {facturaSeleccionada?.numeroFactura}
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  Devolver Factura - {facturaSeleccionada?.numeroFactura}
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {accion === 'aprobar' 
                ? 'Registrar el reconocimiento contable de la obligación'
                : 'Devolver la factura a origen con observaciones'}
            </DialogDescription>
          </DialogHeader>
          
          {facturaSeleccionada && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <Label className="text-slate-500 text-sm">Número de Radicado</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.numeroRadicado}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Proveedor</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.proveedor}</p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Valor Total</Label>
                  <p className="font-semibold text-slate-800">
                    ${facturaSeleccionada.valorTotal.toLocaleString('es-CO')}
                  </p>
                </div>
                <div>
                  <Label className="text-slate-500 text-sm">Área Solicitante</Label>
                  <p className="font-semibold text-slate-800">{facturaSeleccionada.areaSolicitante}</p>
                </div>
              </div>

              {accion === 'aprobar' ? (
                <>
                  {/* SELECTOR INTELIGENTE DE CUENTA CONTABLE */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      Cuenta Contable <span className="text-red-600">*</span>
                      {cuentaSugerida && !cuentaContableSeleccionada && (
                        <Badge className="bg-amber-100 text-amber-700 border-amber-300 border text-xs">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Sugerida disponible
                        </Badge>
                      )}
                    </Label>
                    
                    <Popover open={openCuentaContable} onOpenChange={setOpenCuentaContable}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCuentaContable}
                          className="w-full justify-between h-auto min-h-[44px] border-slate-300 hover:border-green-600 focus:border-green-600 focus:ring-green-600"
                        >
                          {cuentaContableSeleccionada ? (
                            <div className="flex items-start gap-2 text-left">
                              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-mono font-semibold text-slate-800">
                                  {CUENTAS_CONTABLES.find(c => c.codigo === cuentaContableSeleccionada)?.codigo}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {CUENTAS_CONTABLES.find(c => c.codigo === cuentaContableSeleccionada)?.nombre}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Seleccione una cuenta contable...</span>
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[600px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar por código, nombre o categoría..." 
                            value={busquedaCuenta}
                            onValueChange={setBusquedaCuenta}
                            className="border-none focus:ring-0"
                          />
                          <CommandList>
                            <CommandEmpty>No se encontraron cuentas contables.</CommandEmpty>
                            <CommandGroup>
                              {/* Cuenta Sugerida primero */}
                              {cuentaSugerida && (
                                <>
                                  {CUENTAS_CONTABLES.filter(c => c.codigo === cuentaSugerida).map((cuenta) => (
                                    <CommandItem
                                      key={cuenta.codigo}
                                      value={`${cuenta.codigo} ${cuenta.nombre}`}
                                      onSelect={() => {
                                        setCuentaContableSeleccionada(cuenta.codigo);
                                        setOpenCuentaContable(false);
                                        setBusquedaCuenta('');
                                      }}
                                      className="bg-amber-50 border border-amber-200 mb-2"
                                    >
                                      <div className="flex items-start gap-3 flex-1">
                                        <Sparkles className="w-4 h-4 text-amber-600 mt-1 flex-shrink-0" />
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2 mb-1">
                                            <p className="font-mono font-bold text-amber-800">{cuenta.codigo}</p>
                                            <Badge className="bg-amber-200 text-amber-800 border-amber-300 border text-xs">
                                              Sugerida
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-amber-700">{cuenta.nombre}</p>
                                          <p className="text-xs text-amber-600 mt-1">
                                            Categoría: {cuenta.categoria}
                                          </p>
                                        </div>
                                        {cuentaContableSeleccionada === cuenta.codigo && (
                                          <Check className="w-4 h-4 text-amber-600 flex-shrink-0" />
                                        )}
                                      </div>
                                    </CommandItem>
                                  ))}
                                  <div className="px-2 py-1 text-xs text-slate-500 font-semibold border-b">
                                    Otras cuentas disponibles
                                  </div>
                                </>
                              )}
                              
                              {/* Resto de cuentas */}
                              {cuentasFiltradas.filter(c => c.codigo !== cuentaSugerida).map((cuenta) => (
                                <CommandItem
                                  key={cuenta.codigo}
                                  value={`${cuenta.codigo} ${cuenta.nombre}`}
                                  onSelect={() => {
                                    setCuentaContableSeleccionada(cuenta.codigo);
                                    setOpenCuentaContable(false);
                                    setBusquedaCuenta('');
                                  }}
                                >
                                  <div className="flex items-start gap-3 flex-1">
                                    <div className="w-4 h-4 rounded border-2 border-slate-300 mt-1 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-mono font-semibold text-slate-800">{cuenta.codigo}</p>
                                      <p className="text-sm text-slate-600">{cuenta.nombre}</p>
                                      <p className="text-xs text-slate-500 mt-1">
                                        Categoría: {cuenta.categoria}
                                      </p>
                                    </div>
                                    {cuentaContableSeleccionada === cuenta.codigo && (
                                      <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      {cuentaSugerida && !cuentaContableSeleccionada 
                        ? 'Sistema sugiere una cuenta basada en el área y tipo de servicio'
                        : 'Seleccione la cuenta contable correspondiente al gasto'}
                    </p>
                  </div>

                  {/* SELECTOR DE CENTRO DE COSTOS */}
                  <div className="space-y-2">
                    <Label className="text-slate-700 flex items-center gap-2">
                      Centro de Costos (Opcional)
                    </Label>
                    
                    <Popover open={openCentroCosto} onOpenChange={setOpenCentroCosto}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCentroCosto}
                          className="w-full justify-between h-auto min-h-[44px] border-slate-300 hover:border-blue-600 focus:border-blue-600 focus:ring-blue-600"
                        >
                          {centroCostoSeleccionado ? (
                            <div className="flex items-start gap-2 text-left">
                              <Building className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-mono font-semibold text-slate-800">
                                  {CENTROS_COSTOS.find(c => c.codigo === centroCostoSeleccionado)?.codigo}
                                </p>
                                <p className="text-xs text-slate-600">
                                  {CENTROS_COSTOS.find(c => c.codigo === centroCostoSeleccionado)?.nombre}
                                </p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-slate-500">Seleccione un centro de costos...</span>
                          )}
                          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[500px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Buscar por código o nombre..." 
                            value={busquedaCentroCosto}
                            onValueChange={setBusquedaCentroCosto}
                            className="border-none focus:ring-0"
                          />
                          <CommandList>
                            <CommandEmpty>No se encontraron centros de costos.</CommandEmpty>
                            <CommandGroup>
                              {centrosCostosFiltrados.map((centro) => (
                                <CommandItem
                                  key={centro.codigo}
                                  value={`${centro.codigo} ${centro.nombre}`}
                                  onSelect={() => {
                                    setCentroCostoSeleccionado(centro.codigo);
                                    setOpenCentroCosto(false);
                                    setBusquedaCentroCosto('');
                                  }}
                                >
                                  <div className="flex items-center gap-3 flex-1">
                                    <Building className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    <div className="flex-1">
                                      <p className="font-mono font-semibold text-slate-800">{centro.codigo}</p>
                                      <p className="text-sm text-slate-600">{centro.nombre}</p>
                                    </div>
                                    {centroCostoSeleccionado === centro.codigo && (
                                      <Check className="w-4 h-4 text-blue-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <Building className="w-3 h-3" />
                      Asignar el área o proyecto que asumirá el costo
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700">Observaciones (Opcional)</Label>
                    <Textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Observaciones sobre la causación..."
                      className="min-h-[100px] border-slate-300 focus:border-green-600 focus:ring-green-600"
                    />
                  </div>

                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-green-900 text-sm">Proceso de Causación</p>
                        <p className="text-xs text-green-700 mt-1">
                          • Se registrará la cuenta contable {cuentaContableSeleccionada && `(${cuentaContableSeleccionada})`}<br />
                          {centroCostoSeleccionado && `• Centro de costos asignado: ${centroCostoSeleccionado}\n`}
                          • El estado cambiará a "Causada"<br />
                          • Se enviará notificación a Tesorería<br />
                          • La factura pasará al proceso de alistamiento
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label className="text-slate-700">
                      Observaciones de Devolución <span className="text-red-600">*</span>
                    </Label>
                    <Textarea
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Indique el motivo de la devolución (obligatorio)..."
                      className="min-h-[120px] border-slate-300 focus:border-red-600 focus:ring-red-600"
                    />
                    <p className="text-xs text-slate-500">
                      La observación es obligatoria para devolver una factura
                    </p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-start gap-2">
                      <FileText className="w-5 h-5 text-red-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-red-900 text-sm">Proceso de Devolución</p>
                        <p className="text-xs text-red-700 mt-1">
                          • El estado cambiará a "Devuelta a origen"<br />
                          • La observación quedará registrada en la trazabilidad<br />
                          • Se enviará notificación al funcionario<br />
                          • La factura deberá ser corregida y registrada nuevamente
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMostrarDialogCausar(false)}
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={procesarCausacion}
              disabled={isProcessing}
              className={accion === 'aprobar' 
                ? "bg-green-600 hover:bg-green-700 text-white"
                : "bg-red-600 hover:bg-red-700 text-white"
              }
            >
              {isProcessing ? (
                <>Procesando...</>
              ) : accion === 'aprobar' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Causación
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmar Devolución
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
