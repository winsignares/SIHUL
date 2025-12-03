import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Badge } from '../../share/badge';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Search, MapPin, CheckCircle, XCircle, AlertTriangle, Users, Clock, Boxes, Filter, Building2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster } from '../../share/sonner';
import { useIsMobile } from '../../hooks/useIsMobile';
import { usePlazasDisponibles } from '../../hooks/prestamos/usePlazasDisponibles';

export default function PlazasDisponibles() {
  const isMobile = useIsMobile();
  const {
    espaciosFiltrados,
    busqueda,
    setBusqueda,
    sedeSeleccionada,
    setSedeSeleccionada,
    tipoSeleccionado,
    setTipoSeleccionado,
    diaSeleccionado,
    setDiaSeleccionado,
    horaInicio,
    setHoraInicio,
    horaFin,
    setHoraFin,
    capacidadMinima,
    setCapacidadMinima,
    sedes,
    totalEspacios,
    disponibles,
    ocupados,
    mantenimiento,
    limpiarFiltros
  } = usePlazasDisponibles();

  const getDisponibilidadBadge = (disponibilidad: string, estado: string) => {
    if (estado === 'Mantenimiento') {
      return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400">
        <AlertTriangle className="w-3 h-3 mr-1" />
        Mantenimiento
      </Badge>;
    }

    if (disponibilidad === 'disponible') {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400">
        <CheckCircle className="w-3 h-3 mr-1" />
        Disponible
      </Badge>;
    }

    return <Badge className="bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400">
      <XCircle className="w-3 h-3 mr-1" />
      Ocupado
    </Badge>;
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6 bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-slate-900 dark:via-blue-950/10 dark:to-slate-800 min-h-full`}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-8 h-8" />
            <h1 className="text-white">Plazas Disponibles</h1>
          </div>
          <p className="text-blue-100">
            Verifica disponibilidad de espacios en tiempo real antes de aprobar solicitudes
          </p>
        </div>
      </motion.div>

      {/* Estadísticas */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-4'}`}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <Building2 className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Total Espacios</p>
              <h3 className="text-slate-900 dark:text-slate-100">{totalEspacios}</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Disponibles</p>
              <h3 className="text-slate-900 dark:text-slate-100">{disponibles}</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shadow-lg">
                  <XCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Ocupados</p>
              <h3 className="text-slate-900 dark:text-slate-100">{ocupados}</h3>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-1">Mantenimiento</p>
              <h3 className="text-slate-900 dark:text-slate-100">{mantenimiento}</h3>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={limpiarFiltros}
              className="border-slate-300 text-slate-700 hover:bg-slate-100"
            >
              Limpiar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'md:grid-cols-3 lg:grid-cols-7'}`}>
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <Label>Buscar Espacio</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Código, nombre o sede..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Sede */}
            <div>
              <Label>Sede</Label>
              <Select value={sedeSeleccionada} onValueChange={setSedeSeleccionada}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas las sedes</SelectItem>
                  {sedes.map(sede => (
                    <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tipo */}
            <div>
              <Label>Tipo</Label>
              <Select value={tipoSeleccionado} onValueChange={setTipoSeleccionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="aula">Aula</SelectItem>
                  <SelectItem value="laboratorio">Laboratorio</SelectItem>
                  <SelectItem value="auditorio">Auditorio</SelectItem>
                  <SelectItem value="sala">Sala</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Día */}
            <div>
              <Label>Día</Label>
              <Select value={diaSeleccionado} onValueChange={setDiaSeleccionado}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lunes">Lunes</SelectItem>
                  <SelectItem value="martes">Martes</SelectItem>
                  <SelectItem value="miercoles">Miércoles</SelectItem>
                  <SelectItem value="jueves">Jueves</SelectItem>
                  <SelectItem value="viernes">Viernes</SelectItem>
                  <SelectItem value="sabado">Sábado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Hora Inicio */}
            <div>
              <Label>Hora Inicio</Label>
              <Input
                type="time"
                value={horaInicio}
                onChange={(e) => setHoraInicio(e.target.value)}
              />
            </div>

            {/* Hora Fin */}
            <div>
              <Label>Hora Fin</Label>
              <Input
                type="time"
                value={horaFin}
                onChange={(e) => setHoraFin(e.target.value)}
              />
            </div>

            {/* Capacidad Mínima */}
            <div>
              <Label>Capacidad Mín.</Label>
              <Input
                type="number"
                placeholder="Ej: 30"
                value={capacidadMinima}
                onChange={(e) => setCapacidadMinima(e.target.value)}
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Resultados */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">
            Resultados de Búsqueda ({espaciosFiltrados.length})
          </CardTitle>
          <p className="text-slate-500 dark:text-slate-400">
            Mostrando disponibilidad para {diaSeleccionado} de {horaInicio} a {horaFin}
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Sede</TableHead>
                  <TableHead>Piso</TableHead>
                  <TableHead>Capacidad</TableHead>
                  <TableHead>Recursos</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Disponibilidad</TableHead>
                  <TableHead>Ocupante</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {espaciosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-slate-500">
                      No se encontraron espacios con los criterios seleccionados
                    </TableCell>
                  </TableRow>
                ) : (
                  espaciosFiltrados.map((espacio, index) => (
                    <motion.tr
                      key={espacio.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-900"
                    >
                      <TableCell>
                        <code className="text-sm bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                          {espacio.codigo}
                        </code>
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">
                        {espacio.nombre}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {espacio.tipo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {espacio.sede}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {espacio.piso}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Users className="w-4 h-4" />
                          <span>{espacio.capacidad}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Boxes className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600 dark:text-slate-400 text-sm">
                            {espacio.recursos?.length || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {espacio.estado === 'Disponible' ? (
                          <Badge className="bg-green-100 text-green-800">Operativo</Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">Mantenimiento</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {getDisponibilidadBadge(espacio.disponibilidad, espacio.estado)}
                      </TableCell>
                      <TableCell>
                        {espacio.grupoOcupante ? (
                          <div className="text-sm">
                            <p className="text-slate-900 dark:text-slate-100 font-medium">
                              {espacio.grupoOcupante.grupo}
                            </p>
                            <p className="text-slate-500 dark:text-slate-400 text-xs">
                              {espacio.grupoOcupante.asignatura}
                            </p>
                            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-500 text-xs mt-1">
                              <Clock className="w-3 h-3" />
                              {espacio.grupoOcupante.horario}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-sm">—</span>
                        )}
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
