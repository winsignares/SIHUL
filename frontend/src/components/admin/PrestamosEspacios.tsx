import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Calendar, Clock, MapPin, Check, X, AlertCircle, FileText, Filter, Search, Package, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface Prestamo {
  id: string;
  solicitante: string;
  email: string;
  telefono: string;
  espacio: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  motivo: string;
  tipoEvento: string;
  asistentes: number;
  recursosNecesarios: string[];
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  fechaSolicitud: string;
  comentariosAdmin?: string;
}

export default function PrestamosEspacios() {
  const [activeTab, setActiveTab] = useState('solicitudes');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterFechaHora, setFilterFechaHora] = useState('todos');
  const [aprobarDialogOpen, setAprobarDialogOpen] = useState<string | null>(null);
  const [rechazarDialogOpen, setRechazarDialogOpen] = useState<string | null>(null);

  // Estado para nueva solicitud
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    solicitante: '',
    email: '',
    telefono: '',
    espacio: '',
    fecha: '',
    horaInicio: '',
    horaFin: '',
    motivo: '',
    tipoEvento: '',
    asistentes: '',
    recursosNecesarios: [] as string[]
  });

  // Estado para agregar recursos dinámicamente
  const [recursoSeleccionado, setRecursoSeleccionado] = useState('');
  const [mostrandoRecursos, setMostrandoRecursos] = useState(true);

  const [prestamos, setPrestamos] = useState<Prestamo[]>([
    {
      id: '1',
      solicitante: 'María González',
      email: 'maria.gonzalez@universidad.edu',
      telefono: '+57 300 123 4567',
      espacio: 'Auditorio Central',
      fecha: '2025-10-28',
      horaInicio: '14:00',
      horaFin: '18:00',
      motivo: 'Conferencia sobre Inteligencia Artificial',
      tipoEvento: 'Conferencia',
      asistentes: 150,
      recursosNecesarios: ['Proyector', 'Micrófono', 'Sonido'],
      estado: 'pendiente',
      fechaSolicitud: '2025-10-20 10:30'
    },
    {
      id: '2',
      solicitante: 'Carlos Ruiz',
      email: 'carlos.ruiz@universidad.edu',
      telefono: '+57 300 987 6543',
      espacio: 'Laboratorio 301',
      fecha: '2025-10-25',
      horaInicio: '18:00',
      horaFin: '20:00',
      motivo: 'Taller de Robótica',
      tipoEvento: 'Taller',
      asistentes: 20,
      recursosNecesarios: ['Computadores', 'Proyector'],
      estado: 'aprobado',
      fechaSolicitud: '2025-10-18 14:20',
      comentariosAdmin: 'Aprobado. Asegurar que el laboratorio esté preparado con los kits de robótica.'
    },
    {
      id: '3',
      solicitante: 'Ana Martínez',
      email: 'ana.martinez@universidad.edu',
      telefono: '+57 300 555 1234',
      espacio: 'Sala de Juntas 1',
      fecha: '2025-10-24',
      horaInicio: '09:00',
      horaFin: '12:00',
      motivo: 'Reunión de Comité de Investigación',
      tipoEvento: 'Reunión',
      asistentes: 12,
      recursosNecesarios: ['Proyector', 'Videoconferencia'],
      estado: 'aprobado',
      fechaSolicitud: '2025-10-17 09:15',
      comentariosAdmin: 'Aprobado. Verificar configuración de videoconferencia.'
    },
    {
      id: '4',
      solicitante: 'Juan Pérez',
      email: 'juan.perez@universidad.edu',
      telefono: '+57 300 777 8888',
      espacio: 'Auditorio Central',
      fecha: '2025-10-26',
      horaInicio: '08:00',
      horaFin: '18:00',
      motivo: 'Simposio de Investigación',
      tipoEvento: 'Simposio',
      asistentes: 250,
      recursosNecesarios: ['Proyector', 'Micrófono', 'Sonido', 'Grabación'],
      estado: 'rechazado',
      fechaSolicitud: '2025-10-19 16:45',
      comentariosAdmin: 'Rechazado. El espacio ya está reservado para exámenes finales ese día.'
    }
  ]);

  const espaciosDisponibles = [
    'Auditorio Central',
    'Laboratorio 301',
    'Laboratorio 401',
    'Sala de Juntas 1',
    'Sala de Juntas 2',
    'Aula 101',
    'Aula 205',
    'Cancha Deportiva 1'
  ];

  const tiposEvento = [
    'Conferencia',
    'Taller',
    'Reunión',
    'Simposio',
    'Evento Cultural',
    'Evento Deportivo',
    'Examen Especial',
    'Otro'
  ];

  const recursosDisponibles = [
    { nombre: 'Proyector', icon: '📽️' },
    { nombre: 'Micrófono', icon: '🎤' },
    { nombre: 'Sonido', icon: '🔊' },
    { nombre: 'Computadores', icon: '💻' },
    { nombre: 'Videoconferencia', icon: '📹' },
    { nombre: 'Grabación', icon: '🎥' },
    { nombre: 'Pizarra Digital', icon: '📊' },
    { nombre: 'Aire Acondicionado', icon: '❄️' },
    { nombre: 'Sillas Adicionales', icon: '🪑' },
    { nombre: 'Mesas', icon: '🪑' },
    { nombre: 'Atril', icon: '📖' },
    { nombre: 'Pantalla Extra', icon: '🖥️' }
  ];

  const validarDisponibilidad = (espacio: string, fecha: string, horaInicio: string, horaFin: string): boolean => {
    // Verificar conflictos con préstamos aprobados
    const conflictos = prestamos.filter(p => 
      p.espacio === espacio && 
      p.fecha === fecha && 
      p.estado === 'aprobado' &&
      p.id !== nuevaSolicitud.espacio // Excluir la misma solicitud en caso de edición
    );

    for (const conflicto of conflictos) {
      const inicioNuevo = parseInt(horaInicio.replace(':', ''));
      const finNuevo = parseInt(horaFin.replace(':', ''));
      const inicioConflicto = parseInt(conflicto.horaInicio.replace(':', ''));
      const finConflicto = parseInt(conflicto.horaFin.replace(':', ''));

      if (inicioNuevo < finConflicto && finNuevo > inicioConflicto) {
        return false;
      }
    }
    return true;
  };

  const crearSolicitud = () => {
    // Validaciones
    if (!nuevaSolicitud.solicitante || !nuevaSolicitud.email || !nuevaSolicitud.espacio || 
        !nuevaSolicitud.fecha || !nuevaSolicitud.horaInicio || !nuevaSolicitud.horaFin || 
        !nuevaSolicitud.motivo || !nuevaSolicitud.tipoEvento) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

    // Validar disponibilidad
    if (!validarDisponibilidad(nuevaSolicitud.espacio, nuevaSolicitud.fecha, 
                                nuevaSolicitud.horaInicio, nuevaSolicitud.horaFin)) {
      toast.error('El espacio no está disponible en el horario seleccionado');
      return;
    }

    const nuevoPrestamo: Prestamo = {
      id: String(prestamos.length + 1),
      ...nuevaSolicitud,
      asistentes: parseInt(nuevaSolicitud.asistentes) || 0,
      estado: 'pendiente',
      fechaSolicitud: new Date().toLocaleString('es-ES')
    };

    setPrestamos([nuevoPrestamo, ...prestamos]);
    setDialogOpen(false);
    setNuevaSolicitud({
      solicitante: '',
      email: '',
      telefono: '',
      espacio: '',
      fecha: '',
      horaInicio: '',
      horaFin: '',
      motivo: '',
      tipoEvento: '',
      asistentes: '',
      recursosNecesarios: []
    });
    setRecursoSeleccionado('');
    setMostrandoRecursos(true);
    toast.success('Solicitud de préstamo creada exitosamente');
  };

  const aprobarSolicitud = (id: string, comentarios: string) => {
    setPrestamos(prestamos.map(p => 
      p.id === id ? { ...p, estado: 'aprobado', comentariosAdmin: comentarios } : p
    ));
    setAprobarDialogOpen(null);
    toast.success('✅ Solicitud aprobada correctamente', {
      duration: 3000
    });
  };

  const rechazarSolicitud = (id: string, comentarios: string) => {
    setPrestamos(prestamos.map(p => 
      p.id === id ? { ...p, estado: 'rechazado', comentariosAdmin: comentarios } : p
    ));
    setRechazarDialogOpen(null);
    toast.success('✅ Solicitud rechazada correctamente', {
      duration: 3000
    });
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>;
      default:
        return null;
    }
  };

  const filteredPrestamos = prestamos.filter(p => {
    const matchesSearch = p.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.espacio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.tipoEvento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
    
    // Filtro por Fecha y Hora
    let matchesFechaHora = true;
    if (filterFechaHora !== 'todos') {
      const now = new Date();
      const prestamoFecha = new Date(p.fecha + ' ' + p.horaInicio);
      
      if (filterFechaHora === 'hoy') {
        matchesFechaHora = prestamoFecha.toDateString() === now.toDateString();
      } else if (filterFechaHora === 'esta-semana') {
        const inicioSemana = new Date(now);
        inicioSemana.setDate(now.getDate() - now.getDay());
        const finSemana = new Date(inicioSemana);
        finSemana.setDate(inicioSemana.getDate() + 6);
        matchesFechaHora = prestamoFecha >= inicioSemana && prestamoFecha <= finSemana;
      } else if (filterFechaHora === 'este-mes') {
        matchesFechaHora = prestamoFecha.getMonth() === now.getMonth() && prestamoFecha.getFullYear() === now.getFullYear();
      } else if (filterFechaHora === 'proximos') {
        matchesFechaHora = prestamoFecha >= now;
      } else if (filterFechaHora === 'pasados') {
        matchesFechaHora = prestamoFecha < now;
      }
    }
    
    return matchesSearch && matchesEstado && matchesFechaHora;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Préstamos de Espacios</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona las solicitudes de préstamos temporales de espacios para eventos especiales</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <FileText className="w-4 h-4 mr-2" />
              Nueva Solicitud
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="solicitante">Nombre del Solicitante *</Label>
                  <Input
                    id="solicitante"
                    value={nuevaSolicitud.solicitante}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, solicitante: e.target.value })}
                    placeholder="Nombre completo"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={nuevaSolicitud.email}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, email: e.target.value })}
                    placeholder="correo@universidad.edu"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={nuevaSolicitud.telefono}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, telefono: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="espacio">Espacio Solicitado *</Label>
                  <Select value={nuevaSolicitud.espacio} onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, espacio: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar espacio" />
                    </SelectTrigger>
                    <SelectContent>
                      {espaciosDisponibles.map(espacio => (
                        <SelectItem key={espacio} value={espacio}>{espacio}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tipoEvento">Tipo de Evento *</Label>
                  <Select value={nuevaSolicitud.tipoEvento} onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, tipoEvento: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposEvento.map(tipo => (
                        <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="asistentes">Número de Asistentes *</Label>
                  <Input
                    id="asistentes"
                    type="number"
                    value={nuevaSolicitud.asistentes}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, asistentes: e.target.value })}
                    placeholder="Ej: 50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fecha">Fecha *</Label>
                  <Input
                    id="fecha"
                    type="date"
                    value={nuevaSolicitud.fecha}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, fecha: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaInicio">Hora Inicio *</Label>
                  <Input
                    id="horaInicio"
                    type="time"
                    value={nuevaSolicitud.horaInicio}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, horaInicio: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="horaFin">Hora Fin *</Label>
                  <Input
                    id="horaFin"
                    type="time"
                    value={nuevaSolicitud.horaFin}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, horaFin: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivo">Motivo del Préstamo *</Label>
                <Textarea
                  id="motivo"
                  value={nuevaSolicitud.motivo}
                  onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, motivo: e.target.value })}
                  placeholder="Describa el motivo de la solicitud y detalles del evento"
                  rows={3}
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Package className="w-4 h-4" />
                    Recursos Necesarios
                  </Label>
                </div>
                
                {mostrandoRecursos && (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Select value={recursoSeleccionado} onValueChange={setRecursoSeleccionado}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccione un recurso..." />
                        </SelectTrigger>
                        <SelectContent>
                          {recursosDisponibles.filter(r => !nuevaSolicitud.recursosNecesarios.includes(r.nombre)).map(recurso => (
                            <SelectItem key={recurso.nombre} value={recurso.nombre}>
                              {recurso.icon} {recurso.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          if (recursoSeleccionado && !nuevaSolicitud.recursosNecesarios.includes(recursoSeleccionado)) {
                            setNuevaSolicitud({
                              ...nuevaSolicitud,
                              recursosNecesarios: [...nuevaSolicitud.recursosNecesarios, recursoSeleccionado]
                            });
                            setRecursoSeleccionado('');
                            toast.success('Recurso agregado');
                          }
                        }}
                        disabled={!recursoSeleccionado}
                        className="whitespace-nowrap"
                      >
                        <Package className="w-4 h-4 mr-2" />
                        Agregar Recurso
                      </Button>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setMostrandoRecursos(false)}
                      className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Finalizar Agregación
                    </Button>
                  </div>
                )}
                
                {/* Lista de recursos agregados */}
                {nuevaSolicitud.recursosNecesarios.length > 0 && (
                  <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                      <strong>Recursos agregados:</strong>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {nuevaSolicitud.recursosNecesarios.map(recurso => {
                        const recursoInfo = recursosDisponibles.find(r => r.nombre === recurso);
                        return (
                          <Badge 
                            key={recurso} 
                            variant="outline" 
                            className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                          >
                            {recursoInfo?.icon} {recurso}
                            <button
                              type="button"
                              onClick={() => {
                                setNuevaSolicitud({
                                  ...nuevaSolicitud,
                                  recursosNecesarios: nuevaSolicitud.recursosNecesarios.filter(r => r !== recurso)
                                });
                                setMostrandoRecursos(true);
                              }}
                              className="ml-2 hover:text-red-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        );
                      })}
                    </div>
                    {!mostrandoRecursos && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setMostrandoRecursos(true)}
                        className="mt-2 w-full text-blue-600"
                      >
                        Agregar más recursos
                      </Button>
                    )}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={crearSolicitud} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  Crear Solicitud
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por solicitante, espacio o tipo de evento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterFechaHora} onValueChange={setFilterFechaHora}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Fecha y Hora" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas las fechas</SelectItem>
            <SelectItem value="hoy">Hoy</SelectItem>
            <SelectItem value="esta-semana">Esta semana</SelectItem>
            <SelectItem value="este-mes">Este mes</SelectItem>
            <SelectItem value="proximos">Próximos</SelectItem>
            <SelectItem value="pasados">Pasados</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="aprobado">Aprobados</SelectItem>
            <SelectItem value="rechazado">Rechazados</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Solicitudes Table */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Solicitudes de Préstamo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitante</TableHead>
                <TableHead>Espacio</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Tipo de Evento</TableHead>
                <TableHead>Asistentes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrestamos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No hay solicitudes que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrestamos.map((prestamo) => (
                  <TableRow key={prestamo.id}>
                    <TableCell>
                      <div>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.solicitante}</p>
                        <p className="text-slate-500 dark:text-slate-400">{prestamo.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-blue-600" />
                        <span className="text-slate-900 dark:text-slate-100">{prestamo.espacio}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-900 dark:text-slate-100">{prestamo.fecha}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600 dark:text-slate-400">{prestamo.horaInicio} - {prestamo.horaFin}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-slate-900 dark:text-slate-100">{prestamo.tipoEvento}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-900 dark:text-slate-100">{prestamo.asistentes}</TableCell>
                    <TableCell>{getEstadoBadge(prestamo.estado)}</TableCell>
                    <TableCell>
                      {prestamo.estado === 'pendiente' ? (
                        <div className="flex gap-1">
                          <Dialog open={aprobarDialogOpen === prestamo.id} onOpenChange={(open) => !open && setAprobarDialogOpen(null)}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                                onClick={() => setAprobarDialogOpen(prestamo.id)}
                              >
                                <Check className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Aprobar Solicitud</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Comentarios (opcional)</Label>
                                  <Textarea
                                    id={`comentarios-aprobar-${prestamo.id}`}
                                    placeholder="Agregar instrucciones o comentarios..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end gap-3">
                                  <Button variant="outline" onClick={() => setAprobarDialogOpen(null)}>Cancelar</Button>
                                  <Button
                                    onClick={() => {
                                      const textarea = document.getElementById(`comentarios-aprobar-${prestamo.id}`) as HTMLTextAreaElement;
                                      aprobarSolicitud(prestamo.id, textarea?.value || '');
                                    }}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    Aprobar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                          <Dialog open={rechazarDialogOpen === prestamo.id} onOpenChange={(open) => !open && setRechazarDialogOpen(null)}>
                            <DialogTrigger asChild>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                                onClick={() => setRechazarDialogOpen(prestamo.id)}
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Rechazar Solicitud</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label>Motivo del rechazo *</Label>
                                  <Textarea
                                    id={`comentarios-rechazar-${prestamo.id}`}
                                    placeholder="Explique el motivo del rechazo..."
                                    rows={3}
                                  />
                                </div>
                                <div className="flex justify-end gap-3">
                                  <Button variant="outline" onClick={() => setRechazarDialogOpen(null)}>Cancelar</Button>
                                  <Button
                                    onClick={() => {
                                      const textarea = document.getElementById(`comentarios-rechazar-${prestamo.id}`) as HTMLTextAreaElement;
                                      if (textarea?.value) {
                                        rechazarSolicitud(prestamo.id, textarea.value);
                                      } else {
                                        toast.error('Debe proporcionar un motivo de rechazo');
                                      }
                                    }}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    Rechazar
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      ) : (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-8 px-3 hover:bg-blue-50 hover:text-blue-600">
                              <Eye className="w-4 h-4 mr-1" />
                              Ver Detalles
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl">
                            <DialogHeader>
                              <DialogTitle>Detalles de la Solicitud</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Solicitante</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.solicitante}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Email</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.email}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Teléfono</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.telefono}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Espacio</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.espacio}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Fecha</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.fecha}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Horario</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Tipo de Evento</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.tipoEvento}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Asistentes</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.asistentes}</p>
                                </div>
                              </div>
                              <div>
                                <Label className="text-slate-600 dark:text-slate-400">Motivo</Label>
                                <p className="text-slate-900 dark:text-slate-100">{prestamo.motivo}</p>
                              </div>
                              <div>
                                <Label className="text-slate-600 dark:text-slate-400">Recursos Necesarios</Label>
                                <div className="flex flex-wrap gap-2 mt-2">
                                  {prestamo.recursosNecesarios.map(recurso => (
                                    <Badge key={recurso} variant="outline">{recurso}</Badge>
                                  ))}
                                </div>
                              </div>
                              {prestamo.comentariosAdmin && (
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400">Comentarios del Administrador</Label>
                                  <p className="text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg mt-2">
                                    {prestamo.comentariosAdmin}
                                  </p>
                                </div>
                              )}
                              <div>
                                <Label className="text-slate-600 dark:text-slate-400">Estado</Label>
                                <div className="mt-2">{getEstadoBadge(prestamo.estado)}</div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
