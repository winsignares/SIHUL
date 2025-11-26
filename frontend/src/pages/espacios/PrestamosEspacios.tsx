import { useState } from 'react';
import { Card, CardContent } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Textarea } from '../../share/textarea';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Calendar, Clock, MapPin, Check, X, Search, User, Mail, Phone, FileText, Users, Package, Sparkles, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster } from '../../share/sonner';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('todos');
  const [filterFechaHora, setFilterFechaHora] = useState('todos');
  const [verSolicitudDialog, setVerSolicitudDialog] = useState<string | null>(null);
  const [comentariosAccion, setComentariosAccion] = useState('');

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
      motivo: 'Conferencia sobre Inteligencia Artificial y Machine Learning para estudiantes de ingeniería',
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
      motivo: 'Taller de Robótica para estudiantes de primer semestre',
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
      motivo: 'Reunión de Comité de Investigación para revisión de proyectos',
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
      motivo: 'Simposio de Investigación con ponentes internacionales',
      tipoEvento: 'Simposio',
      asistentes: 250,
      recursosNecesarios: ['Proyector', 'Micrófono', 'Sonido', 'Grabación'],
      estado: 'rechazado',
      fechaSolicitud: '2025-10-19 16:45',
      comentariosAdmin: 'Rechazado. El espacio ya está reservado para exámenes finales ese día.'
    },
    {
      id: '5',
      solicitante: 'Laura Fernández',
      email: 'laura.fernandez@universidad.edu',
      telefono: '+57 300 444 5555',
      espacio: 'Cancha Deportiva 1',
      fecha: '2025-11-05',
      horaInicio: '15:00',
      horaFin: '18:00',
      motivo: 'Torneo Interuniversitario de Fútbol',
      tipoEvento: 'Evento Deportivo',
      asistentes: 100,
      recursosNecesarios: ['Sonido', 'Sillas Adicionales'],
      estado: 'pendiente',
      fechaSolicitud: '2025-10-22 11:00'
    }
  ]);

  const aprobarSolicitud = (id: string, comentarios: string) => {
    setPrestamos(prestamos.map(p => 
      p.id === id ? { ...p, estado: 'aprobado', comentariosAdmin: comentarios } : p
    ));
    setVerSolicitudDialog(null);
    setComentariosAccion('');
    // Mostrar notificación: ✅ Solicitud aprobada correctamente
  };

  const rechazarSolicitud = (id: string, comentarios: string) => {
    if (!comentarios.trim()) {
      // Mostrar notificación: Debe proporcionar un motivo de rechazo
      return;
    }
    setPrestamos(prestamos.map(p => 
      p.id === id ? { ...p, estado: 'rechazado', comentariosAdmin: comentarios } : p
    ));
    setVerSolicitudDialog(null);
    setComentariosAccion('');
    // Mostrar notificación: ✅ Solicitud rechazada correctamente
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><Check className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><X className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return null;
    }
  };

  const filteredPrestamos = prestamos.filter(p => {
    const matchesSearch = p.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.espacio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         p.tipoEvento.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
    
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

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'aprobado':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'rechazado':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const statsData = [
    {
      title: 'Pendientes',
      value: prestamos.filter(p => p.estado === 'pendiente').length,
      icon: <Clock className="w-6 h-6" />,
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
      textColor: 'text-yellow-600'
    },
    {
      title: 'Aprobadas',
      value: prestamos.filter(p => p.estado === 'aprobado').length,
      icon: <Check className="w-6 h-6" />,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-50 dark:bg-green-950/20',
      textColor: 'text-green-600'
    },
    {
      title: 'Rechazadas',
      value: prestamos.filter(p => p.estado === 'rechazado').length,
      icon: <X className="w-6 h-6" />,
      color: 'from-red-500 to-rose-500',
      bgColor: 'bg-red-50 dark:bg-red-950/20',
      textColor: 'text-red-600'
    },
    {
      title: 'Total Solicitudes',
      value: prestamos.length,
      icon: <TrendingUp className="w-6 h-6" />,
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'bg-blue-50 dark:bg-blue-950/20',
      textColor: 'text-blue-600'
    }
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Préstamos de Espacios</h1>
        <p className="text-slate-600 dark:text-slate-400">Gestiona las solicitudes de préstamos temporales de espacios para eventos especiales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
                    <p className="text-3xl text-slate-900 dark:text-slate-100">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} ${stat.textColor} p-3 rounded-xl`}>
                    {stat.icon}
                  </div>
                </div>
                <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${stat.color}`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-4">
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
        </CardContent>
      </Card>

      {/* Solicitudes Grid */}
      <div className="grid grid-cols-1 gap-4">
        {filteredPrestamos.length === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No hay solicitudes que mostrar</p>
            </CardContent>
          </Card>
        ) : (
          filteredPrestamos.map((prestamo) => (
            <motion.div
              key={prestamo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-6">
                    {/* Left Section */}
                    <div className="flex-1 space-y-4">
                      {/* Header con Solicitante y Estado */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-slate-900 dark:text-slate-100">{prestamo.solicitante}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Mail className="w-3 h-3" />
                              {prestamo.email}
                            </div>
                            {prestamo.telefono && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Phone className="w-3 h-3" />
                                {prestamo.telefono}
                              </div>
                            )}
                          </div>
                        </div>
                        {getEstadoBadge(prestamo.estado)}
                      </div>

                      {/* Detalles del Evento */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Espacio</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.espacio}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Fecha</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.fecha}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Horario</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Asistentes</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.asistentes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tipo de Evento y Recursos */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {prestamo.tipoEvento}
                        </Badge>
                        {prestamo.recursosNecesarios.length > 0 && (
                          <div className="flex items-center gap-2">
                            <Package className="w-4 h-4 text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-400">
                              {prestamo.recursosNecesarios.length} recurso{prestamo.recursosNecesarios.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Motivo */}
                      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Motivo</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.motivo}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Ver Solicitud Button */}
                    <div className="flex flex-col items-end gap-2">
                      <Dialog open={verSolicitudDialog === prestamo.id} onOpenChange={(open) => {
                        if (!open) {
                          setVerSolicitudDialog(null);
                          setComentariosAccion('');
                        }
                      }}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                            onClick={() => setVerSolicitudDialog(prestamo.id)}
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            Ver Solicitud
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl flex items-center gap-2">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                prestamo.estado === 'pendiente' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                                prestamo.estado === 'aprobado' ? 'bg-green-50 dark:bg-green-950/20' :
                                'bg-red-50 dark:bg-red-950/20'
                              }`}>
                                {getEstadoIcon(prestamo.estado)}
                              </div>
                              Detalles de la Solicitud
                            </DialogTitle>
                          </DialogHeader>
                          
                          <div className="space-y-6 py-4">
                            {/* Estado */}
                            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                              <span className="text-sm text-slate-600 dark:text-slate-400">Estado actual</span>
                              {getEstadoBadge(prestamo.estado)}
                            </div>

                            {/* Información del Solicitante */}
                            <div className="space-y-3">
                              <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-600" />
                                Información del Solicitante
                              </h3>
                              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Nombre</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.solicitante}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Email</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.email}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Teléfono</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.telefono}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Fecha de Solicitud</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.fechaSolicitud}</p>
                                </div>
                              </div>
                            </div>

                            {/* Detalles del Evento */}
                            <div className="space-y-3">
                              <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-600" />
                                Detalles del Evento
                              </h3>
                              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Espacio Solicitado</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.espacio}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Tipo de Evento</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.tipoEvento}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Fecha</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.fecha}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Horario</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                                </div>
                                <div>
                                  <Label className="text-slate-600 dark:text-slate-400 text-xs">Número de Asistentes</Label>
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.asistentes}</p>
                                </div>
                              </div>
                            </div>

                            {/* Motivo */}
                            <div className="space-y-3">
                              <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                <FileText className="w-5 h-5 text-orange-600" />
                                Motivo de la Solicitud
                              </h3>
                              <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                                <p className="text-slate-900 dark:text-slate-100">{prestamo.motivo}</p>
                              </div>
                            </div>

                            {/* Recursos Necesarios */}
                            {prestamo.recursosNecesarios.length > 0 && (
                              <div className="space-y-3">
                                <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  <Package className="w-5 h-5 text-green-600" />
                                  Recursos Necesarios
                                </h3>
                                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                                  {prestamo.recursosNecesarios.map((recurso) => (
                                    <Badge 
                                      key={recurso}
                                      variant="outline"
                                      className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                                    >
                                      {recurso}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Comentarios del Admin (si existen) */}
                            {prestamo.comentariosAdmin && (
                              <div className="space-y-3">
                                <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  <AlertCircle className="w-5 h-5 text-slate-600" />
                                  Comentarios del Administrador
                                </h3>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <p className="text-slate-900 dark:text-slate-100">{prestamo.comentariosAdmin}</p>
                                </div>
                              </div>
                            )}

                            {/* Acciones (solo para pendientes) */}
                            {prestamo.estado === 'pendiente' && (
                              <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                                <Label htmlFor="comentarios">Comentarios (opcional para aprobar, obligatorio para rechazar)</Label>
                                <Textarea
                                  id="comentarios"
                                  value={comentariosAccion}
                                  onChange={(e) => setComentariosAccion(e.target.value)}
                                  placeholder="Agregar comentarios o instrucciones..."
                                  rows={3}
                                  className="resize-none"
                                />
                                <div className="flex justify-end gap-3">
                                  <Button
                                    onClick={() => rechazarSolicitud(prestamo.id, comentariosAccion)}
                                    className="bg-red-600 hover:bg-red-700 text-white"
                                  >
                                    <X className="w-4 h-4 mr-2" />
                                    Rechazar
                                  </Button>
                                  <Button
                                    onClick={() => aprobarSolicitud(prestamo.id, comentariosAccion)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    <Check className="w-4 h-4 mr-2" />
                                    Confirmar
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {prestamo.fechaSolicitud}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      <Toaster />
    </div>
  );
}
