import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { BarChart3, TrendingUp, Calendar, Download } from 'lucide-react';
import { Button } from '../../share/button';
import { Progress } from '../../share/progress';
import { motion } from 'motion/react';
import { Toaster } from '../../share/sonner';
import { useConsultaOcupacion } from '../../hooks/reporte/useConsultaOcupacion';

export default function ConsultaOcupacion() {
  const {
    periodo,
    setPeriodo,
    tipoEspacio,
    setTipoEspacio,
    espaciosFiltrados,
    estadisticas,
    exportarReporte,
    getColorPorOcupacion,
    getBarColor
  } = useConsultaOcupacion();

  const {
    promedioOcupacion,
    totalHorasOcupadas,
    totalHorasDisponibles,
    espaciosSobreocupados,
    espaciosSubutilizados
  } = estadisticas;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Ocupación de Espacios</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Consulta el estado de ocupación de salones y laboratorios
          </p>
        </div>
        <Button
          onClick={exportarReporte}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <Select value={periodo} onValueChange={setPeriodo}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Periodo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025-1">Periodo 2025-1</SelectItem>
            <SelectItem value="2024-2">Periodo 2024-2</SelectItem>
            <SelectItem value="2024-1">Periodo 2024-1</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tipoEspacio} onValueChange={setTipoEspacio}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Tipo de espacio" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            <SelectItem value="Aula">Aulas</SelectItem>
            <SelectItem value="Laboratorio">Laboratorios</SelectItem>
            <SelectItem value="Auditorio">Auditorios</SelectItem>
            <SelectItem value="Sala">Salas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Estadísticas Generales */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 dark:text-slate-400">Promedio Ocupación</p>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-slate-900 dark:text-slate-100 mb-1">{promedioOcupacion.toFixed(1)}%</p>
            <Progress value={promedioOcupacion} className="h-2" />
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 dark:text-slate-400">Total Horas</p>
              <Calendar className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-slate-900 dark:text-slate-100">{totalHorasOcupadas} / {totalHorasDisponibles}</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">horas ocupadas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 dark:text-slate-400">Total Espacios</p>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-slate-900 dark:text-slate-100">{espaciosFiltrados.length}</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">en análisis</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-700 dark:text-blue-300">Alta Ocupación</p>
              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
            </div>
            <p className="text-blue-900 dark:text-blue-100">{espaciosSobreocupados}</p>
            <p className="text-blue-600 dark:text-blue-400 text-sm">&gt;85% ocupación</p>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-yellow-700 dark:text-yellow-300">Baja Ocupación</p>
              <div className="w-2 h-2 bg-yellow-600 rounded-full"></div>
            </div>
            <p className="text-yellow-900 dark:text-yellow-100">{espaciosSubutilizados}</p>
            <p className="text-yellow-600 dark:text-yellow-400 text-sm">&lt;50% ocupación</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabla de Ocupación Detallada */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Ocupación Detallada por Espacio</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Espacio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Edificio</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Horas Ocupadas</TableHead>
                <TableHead>Ocupación Mañana</TableHead>
                <TableHead>Ocupación Tarde</TableHead>
                <TableHead>Ocupación Noche</TableHead>
                <TableHead>Total Semanal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {espaciosFiltrados.map((espacio) => (
                <TableRow key={espacio.id}>
                  <TableCell className="text-slate-900 dark:text-slate-100">{espacio.nombre}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="border-blue-600 text-blue-600">
                      {espacio.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">Edif. {espacio.edificio}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">{espacio.capacidad} pers.</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {espacio.horasOcupadas} / {espacio.horasDisponibles}h
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 w-20">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`${getBarColor(espacio.jornada.manana)} h-2 rounded-full transition-all`}
                            style={{ width: `${espacio.jornada.manana}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-10">{espacio.jornada.manana}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 w-20">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`${getBarColor(espacio.jornada.tarde)} h-2 rounded-full transition-all`}
                            style={{ width: `${espacio.jornada.tarde}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-10">{espacio.jornada.tarde}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 w-20">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className={`${getBarColor(espacio.jornada.noche)} h-2 rounded-full transition-all`}
                            style={{ width: `${espacio.jornada.noche}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-xs text-slate-600 dark:text-slate-400 w-10">{espacio.jornada.noche}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getColorPorOcupacion(espacio.porcentajeOcupacion)}>
                      {espacio.porcentajeOcupacion.toFixed(1)}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Gráfico de Barras Visual */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Visualización Comparativa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {espaciosFiltrados.slice(0, 10).map((espacio, index) => (
              <motion.div
                key={espacio.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-40 text-sm text-slate-900 dark:text-slate-100 truncate">
                    {espacio.nombre}
                  </div>
                  <div className="flex-1">
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-6 relative overflow-hidden">
                      <motion.div
                        className={`${getBarColor(espacio.porcentajeOcupacion)} h-6 rounded-full flex items-center justify-end px-2`}
                        initial={{ width: 0 }}
                        animate={{ width: `${espacio.porcentajeOcupacion}%` }}
                        transition={{ duration: 0.8, delay: index * 0.05 }}
                      >
                        <span className="text-xs text-white">{espacio.porcentajeOcupacion.toFixed(1)}%</span>
                      </motion.div>
                    </div>
                  </div>
                  <div className="w-24 text-xs text-slate-600 dark:text-slate-400">
                    {espacio.horasOcupadas}/{espacio.horasDisponibles}h
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
