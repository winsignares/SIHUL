import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import { Badge } from '../../share/badge';
import { Toaster } from '../../share/sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { motion } from 'motion/react';
import { useReportes } from '../../hooks/reporte/useReportes';

export default function Reportes() {
  const {
    PERIODO_TRABAJO,
    tipoReporte,
    setTipoReporte,
    filtroDocente,
    setFiltroDocente,
    filtroPrograma,
    setFiltroPrograma,
    datosOcupacion,
    espaciosMasUsados,
    horariosDocente,
    horariosPrograma,
    disponibilidadEspacios,
    capacidadUtilizada,
    reportesDisponibles,
    docentes,
    programas,
    exportarPDF,
    exportarExcel
  } = useReportes();

  const renderReporteContent = () => {
    switch (tipoReporte) {
      case 'ocupacion':
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Ocupación por Jornada - Semana Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {datosOcupacion.map((dato, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <span className="text-slate-900 dark:text-slate-100">{dato.jornada}</span>
                        <p className="text-slate-600 dark:text-slate-400">{dato.espacios} espacios</p>
                      </div>
                      <span className="text-slate-900 dark:text-slate-100">{dato.ocupacion}%</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <motion.div
                        className={`${dato.color} h-3 rounded-full`}
                        initial={{ width: 0 }}
                        animate={{ width: `${dato.ocupacion}%` }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                      ></motion.div>
                    </div>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Espacios Más Utilizados</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {espaciosMasUsados.map((espacio, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-700 rounded-lg flex items-center justify-center">
                          <span className="text-white">{index + 1}</span>
                        </div>
                        <div>
                          <p className="text-slate-900 dark:text-slate-100">{espacio.espacio}</p>
                          <p className="text-slate-600 dark:text-slate-400">{espacio.usos} clases/semana</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                        {espacio.ocupacion}%
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'horarios-docente':
        return (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Docente</CardTitle>
                <Select value={filtroDocente} onValueChange={setFiltroDocente}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map(doc => (
                      <SelectItem key={doc} value={doc.toLowerCase()}>{doc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Espacio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {horariosDocente.map((horario, index) => (
                    <TableRow key={index}>
                      <TableCell className="text-slate-900 dark:text-slate-100">{horario.dia}</TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">{horario.hora}</TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">{horario.asignatura}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                          {horario.grupo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{horario.espacio}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'horarios-programa':
        return (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Programa</CardTitle>
                <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
                  <SelectTrigger className="w-[250px]">
                    <SelectValue placeholder="Seleccionar programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programas.map(prog => (
                      <SelectItem key={prog} value={prog.toLowerCase()}>{prog}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Grupo</TableHead>
                    <TableHead>Día</TableHead>
                    <TableHead>Horario</TableHead>
                    <TableHead>Asignatura</TableHead>
                    <TableHead>Docente</TableHead>
                    <TableHead>Espacio</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {horariosPrograma.map((horario, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                          {horario.grupo}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">{horario.dia}</TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">{horario.hora}</TableCell>
                      <TableCell className="text-slate-900 dark:text-slate-100">{horario.asignatura}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{horario.docente}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{horario.espacio}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );

      case 'disponibilidad':
        return (
          <div className="grid lg:grid-cols-2 gap-6">
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Disponibilidad de Espacios</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Espacio</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Disponible</TableHead>
                      <TableHead>Ocupado</TableHead>
                      <TableHead>%</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {disponibilidadEspacios.map((espacio, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-slate-900 dark:text-slate-100">{espacio.nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{espacio.tipo}</Badge>
                        </TableCell>
                        <TableCell className="text-green-600 dark:text-green-400">{espacio.horasDisponibles}h</TableCell>
                        <TableCell className="text-slate-600 dark:text-slate-400">{espacio.horasOcupadas}h</TableCell>
                        <TableCell>
                          <Badge className={`${espacio.porcentajeOcupacion > 70 ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'}`}>
                            {espacio.porcentajeOcupacion}%
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader>
                <CardTitle className="text-slate-900 dark:text-slate-100">Resumen de Disponibilidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                    <p className="text-green-600 dark:text-green-400 mb-1">Total Disponible</p>
                    <p className="text-green-900 dark:text-green-100">110 horas</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-blue-600 dark:text-blue-400 mb-1">Total Ocupado</p>
                    <p className="text-blue-900 dark:text-blue-100">135 horas</p>
                  </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  <p className="text-slate-600 dark:text-slate-400 mb-2">Promedio de Ocupación</p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full" style={{ width: '56%' }}></div>
                    </div>
                    <span className="text-slate-900 dark:text-slate-100">56%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'capacidad':
        return (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Capacidad Utilizada por Tipo de Espacio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {capacidadUtilizada.map((dato, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-900 dark:text-slate-100">{dato.tipo}</p>
                      <p className="text-slate-600 dark:text-slate-400">
                        {dato.capacidadUsada} de {dato.capacidadTotal} estudiantes
                      </p>
                    </div>
                    <Badge className={`${dato.porcentaje > 75 ? 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-400'}`}>
                      {dato.porcentaje}%
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-4">
                    <motion.div
                      className="bg-gradient-to-r from-purple-600 to-purple-700 h-4 rounded-full flex items-center justify-end pr-2"
                      initial={{ width: 0 }}
                      animate={{ width: `${dato.porcentaje}%` }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <span className="text-white text-xs">{dato.porcentaje}%</span>
                    </motion.div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Reportes y Estadísticas</h1>
          <p className="text-slate-600 dark:text-slate-400">Genera reportes personalizados del sistema diferenciados por rol (RF20)</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-900 dark:text-blue-100"><strong>{PERIODO_TRABAJO}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={tipoReporte} onValueChange={setTipoReporte}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Tipo de reporte" />
          </SelectTrigger>
          <SelectContent>
            {reportesDisponibles.map(reporte => (
              <SelectItem key={reporte.id} value={reporte.id}>
                {reporte.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          onClick={exportarPDF}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
        <Button
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          onClick={exportarExcel}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Descargar Excel
        </Button>
      </div>

      {/* Main Report View */}
      <motion.div
        key={tipoReporte}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderReporteContent()}
      </motion.div>
      <Toaster />
    </div>
  );
}
