import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Textarea } from '../../share/textarea';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Calendar, Clock, MapPin, FileText, Search, Plus, Trash2, AlertCircle, Eye, ArrowLeft } from 'lucide-react';
import { Toaster } from '../../share/sonner';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../../share/alert';
import { useDocentePrestamos } from '../../hooks/prestamos/useDocentePrestamos';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAuth } from '../../context/AuthContext';
import ConsultaEspacios from '../espacios/ConsultaEspacios';

export default function DocentePrestamos() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [mostrarConsulta, setMostrarConsulta] = useState(false);
  const {
    dialogOpen,
    setDialogOpen,
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    nuevaSolicitud,
    setNuevaSolicitud,
    sedes,
    espaciosDisponibles,
    tiposActividad,
    recursosDisponibles,
    recursosSeleccionados,
    agregarRecurso,
    eliminarRecurso,
    actualizarCantidadRecurso,
    crearSolicitud,
    filteredPrestamos,
    estadisticas,
    error
  } = useDocentePrestamos();

  // Mostrar error con toast cuando cambie
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Si está mostrando consulta de espacios, renderizar ese componente
  if (mostrarConsulta) {
    return (
      <div>
        {String(user?.rol) !== 'supervisor_general' && (
          <div className="p-6 pb-0">
            <Button
              variant="outline"
              onClick={() => setMostrarConsulta(false)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Mis Préstamos
            </Button>
          </div>
        )}
        <ConsultaEspacios />
      </div>
    );
  }

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

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Préstamos de Espacios</h1>
          <p className="text-slate-600 dark:text-slate-400">Solicita espacios para clases adicionales, tutorías y eventos académicos</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setMostrarConsulta(true)}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Eye className="w-4 h-4 mr-2" />
            Consultar Disponibilidad
          </Button>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                <Plus className="w-4 h-4 mr-2" />
                Nueva Solicitud
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Información Personal */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                  Información del Solicitante
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="solicitante">Nombre del Solicitante</Label>
                    <Input
                      id="solicitante"
                      value={nuevaSolicitud.solicitante}
                      onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, solicitante: e.target.value })}
                      disabled
                      className="bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={nuevaSolicitud.email}
                      onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, email: e.target.value })}
                      disabled
                      className="bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono de Contacto</Label>
                  <Input
                    id="telefono"
                    value={nuevaSolicitud.telefono}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, telefono: e.target.value })}
                    placeholder="+57 300 123 4567"
                  />
                </div>
              </div>

              {/* Ubicación y Horario */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                  Ubicación y Horario
                </h3>
                <div className="space-y-2">
                  <Label htmlFor="sede">Sede *</Label>
                  <Select
                    value={nuevaSolicitud.sede_id > 0 ? nuevaSolicitud.sede_id.toString() : ''}
                    onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, sede_id: parseInt(v), espacio_id: 0 })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar sede" />
                    </SelectTrigger>
                    <SelectContent>
                      {sedes.map(sede => (
                        <SelectItem key={sede.id} value={sede.id.toString()}>{sede.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha">Fecha *</Label>
                    <Input
                      id="fecha"
                      type="date"
                      value={nuevaSolicitud.fecha}
                      onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, fecha: e.target.value, espacio_id: 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horaInicio">Hora Inicio *</Label>
                    <Input
                      id="horaInicio"
                      type="time"
                      value={nuevaSolicitud.horaInicio}
                      onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, horaInicio: e.target.value, espacio_id: 0 })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="horaFin">Hora Fin *</Label>
                    <Input
                      id="horaFin"
                      type="time"
                      value={nuevaSolicitud.horaFin}
                      onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, horaFin: e.target.value, espacio_id: 0 })}
                    />
                  </div>
                </div>
              </div>

              {/* Selección de Espacio */}
              {nuevaSolicitud.sede_id > 0 && nuevaSolicitud.fecha && nuevaSolicitud.horaInicio && nuevaSolicitud.horaFin && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                    Selección de Espacio
                  </h3>
                  {espaciosDisponibles.length > 0 ? (
                    <div className="space-y-2">
                      <Label htmlFor="espacio">Espacio Disponible *</Label>
                      <Select
                        value={nuevaSolicitud.espacio_id > 0 ? nuevaSolicitud.espacio_id.toString() : ''}
                        onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, espacio_id: parseInt(v) })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar espacio disponible" />
                        </SelectTrigger>
                        <SelectContent>
                          {espaciosDisponibles.map(espacio => (
                            <SelectItem key={espacio.id} value={espacio.id.toString()}>
                              {espacio.nombre} - {espacio.tipo} (Capacidad: {espacio.capacidad})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                        {espaciosDisponibles.length} espacio(s) disponible(s) para este horario
                      </p>
                    </div>
                  ) : (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        No hay espacios disponibles para la sede, fecha y horario seleccionados.
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Detalles de la Actividad */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                  Detalles de la Actividad
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tipoEvento">Tipo de Actividad *</Label>
                    <Select
                      value={nuevaSolicitud.tipo_actividad_id > 0 ? nuevaSolicitud.tipo_actividad_id.toString() : ''}
                      onValueChange={(v) => setNuevaSolicitud({ ...nuevaSolicitud, tipo_actividad_id: parseInt(v) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposActividad.map(tipo => (
                          <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.nombre}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="asistentes">Número de Asistentes</Label>
                    <Input
                      id="asistentes"
                      type="number"
                      value={nuevaSolicitud.asistentes}
                      onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, asistentes: e.target.value })}
                      placeholder="Ej: 30"
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="motivo">Motivo del Préstamo *</Label>
                  <Textarea
                    id="motivo"
                    value={nuevaSolicitud.motivo}
                    onChange={(e) => setNuevaSolicitud({ ...nuevaSolicitud, motivo: e.target.value })}
                    placeholder="Describa el motivo de la solicitud (clase adicional, tutoría, evento, etc.)"
                    rows={3}
                  />
                </div>
              </div>

              {/* Recursos Adicionales */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                  Recursos Adicionales (Opcional)
                </h3>
                <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Agregar recursos necesarios</Label>
                    <Select onValueChange={(v) => agregarRecurso(parseInt(v))}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Agregar recurso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recursosDisponibles.map((recurso) => (
                          <SelectItem key={recurso.id} value={recurso.id!.toString()}>
                            {recurso.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {recursosSeleccionados.length > 0 ? (
                    <div className="space-y-2">
                      {recursosSeleccionados.map((item) => (
                        <div key={item.recurso_id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {item.recurso_nombre}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => eliminarRecurso(item.recurso_id)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-3 text-slate-500 dark:text-slate-400 text-sm italic">
                      No has seleccionado ningún recurso
                    </div>
                  )}
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
      </div>

      {/* Statistics */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Total Solicitudes</p>
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
                <p className="text-green-600 dark:text-green-400 mb-1">Aprobadas</p>
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
            placeholder="Buscar por espacio, tipo de actividad o motivo..."
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
            <SelectItem value="aprobado">Aprobadas</SelectItem>
            <SelectItem value="rechazado">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Préstamos Table */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Mis Solicitudes de Préstamo</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espacio</TableHead>
                <TableHead>Fecha y Hora</TableHead>
                <TableHead>Tipo de Actividad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Detalles</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPrestamos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500 dark:text-slate-400">
                    No hay solicitudes que mostrar
                  </TableCell>
                </TableRow>
              ) : (
                filteredPrestamos.map((prestamo) => (
                  <TableRow key={prestamo.id}>
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
      <Toaster />
    </div>
  );
}
