import { Card, CardContent } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Textarea } from '../../share/textarea';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Calendar, Clock, MapPin, Check, X, Search, User, Mail, Phone, FileText, Users, Package, Sparkles, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster } from '../../share/sonner';
import { usePrestamosEspacios } from '../../hooks/espacios/usePrestamosEspacios';

export default function PrestamosEspacios() {
  const {
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterFechaHora,
    setFilterFechaHora,
    verSolicitudDialog,
    setVerSolicitudDialog,
    comentariosAccion,
    setComentariosAccion,
    filteredPrestamos,
    statsData,
    aprobarSolicitud,
    rechazarSolicitud
  } = usePrestamosEspacios();

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
                    <stat.icon className="w-6 h-6" />
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
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${prestamo.estado === 'pendiente' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
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

                            {/* Información del Administrador (si existe) */}
                            {prestamo.administradorNombre && (prestamo.estado === 'aprobado' || prestamo.estado === 'rechazado') && (
                              <div className="space-y-3">
                                <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                  <User className="w-5 h-5 text-indigo-600" />
                                  {prestamo.estado === 'aprobado' ? 'Aprobado por' : 'Rechazado por'}
                                </h3>
                                <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                                  <p className="text-slate-900 dark:text-slate-100 font-medium">{prestamo.administradorNombre}</p>
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
