import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Button } from '../share/button';
import { Input } from '../share/input';
import { Label } from '../share/label';
import { Textarea } from '../share/textarea';
import { Badge } from '../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../share/table';
import { Calendar, Clock, MapPin, FileText, Search } from 'lucide-react';
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

export default function ConsultaPrestamos() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');

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

  const [prestamos] = useState<Prestamo[]>([
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
      estado: 'aprobado',
      fechaSolicitud: '2025-10-20 10:30',
      comentariosAdmin: 'Aprobado. El auditorio estará listo con todo el equipo necesario.'
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
      fecha: '2025-11-05',
      horaInicio: '09:00',
      horaFin: '12:00',
      motivo: 'Reunión de Comité de Investigación',
      tipoEvento: 'Reunión',
      asistentes: 12,
      recursosNecesarios: ['Proyector', 'Videoconferencia'],
      estado: 'pendiente',
      fechaSolicitud: '2025-10-21 09:15'
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
    'Proyector',
    'Micrófono',
    'Sonido',
    'Computadores',
    'Videoconferencia',
    'Grabación',
    'Pizarra Digital',
    'Aire Acondicionado'
  ];

  const crearSolicitud = () => {
    if (!nuevaSolicitud.solicitante || !nuevaSolicitud.email || !nuevaSolicitud.espacio || 
        !nuevaSolicitud.fecha || !nuevaSolicitud.horaInicio || !nuevaSolicitud.horaFin || 
        !nuevaSolicitud.motivo || !nuevaSolicitud.tipoEvento) {
      toast.error('Por favor complete todos los campos obligatorios');
      return;
    }

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
    toast.success('Solicitud enviada exitosamente. Será revisada por un administrador.');
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
    return matchesSearch && matchesEstado;
  });

  const estadisticas = {
    total: prestamos.length,
    aprobados: prestamos.filter(p => p.estado === 'aprobado').length,
    pendientes: prestamos.filter(p => p.estado === 'pendiente').length
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Consulta de Préstamos</h1>
          <p className="text-slate-600 dark:text-slate-400">Consulta los préstamos de espacios aprobados y solicita nuevos préstamos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <FileText className="w-4 h-4 mr-2" />
              Solicitar Préstamo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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
                <Label htmlFor="asistentes">Número de Asistentes</Label>
                <Input
                  id="asistentes"
                  type="number"
                  value={nuevaSolicitud.asistentes}
                  onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, asistentes: e.target.value })}
                  placeholder="Ej: 50"
                />
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

              <div className="space-y-2">
                <Label>Recursos Necesarios</Label>
                <div className="grid grid-cols-2 gap-2">
                  {recursosDisponibles.map(recurso => (
                    <label key={recurso} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={nuevaSolicitud.recursosNecesarios.includes(recurso)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNuevaSolicitud({
                              ...nuevaSolicitud,
                              recursosNecesarios: [...nuevaSolicitud.recursosNecesarios, recurso]
                            });
                          } else {
                            setNuevaSolicitud({
                              ...nuevaSolicitud,
                              recursosNecesarios: nuevaSolicitud.recursosNecesarios.filter(r => r !== recurso)
                            });
                          }
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-slate-700 dark:text-slate-300">{recurso}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={crearSolicitud} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                  Enviar Solicitud
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Total Préstamos</p>
                <p className="text-slate-900 dark:text-slate-100">{estadisticas.total}</p>
              </div>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 dark:text-green-400 mb-1">Aprobados</p>
                <p className="text-green-900 dark:text-green-100">{estadisticas.aprobados}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-600 dark:text-yellow-400 mb-1">Pendientes</p>
                <p className="text-yellow-900 dark:text-yellow-100">{estadisticas.pendientes}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
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

      {/* Préstamos Table */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Préstamos de Espacios</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Solicitante</TableHead>
                <TableHead>Espacio</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Tipo de Evento</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrestamos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No hay préstamos que mostrar
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
                    <TableCell>{getEstadoBadge(prestamo.estado)}</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            Ver Detalles
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Detalles del Préstamo</DialogTitle>
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
