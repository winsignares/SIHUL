import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { BarChart3, TrendingUp, Calendar, Download, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { motion } from 'motion/react';
import { toast } from 'sonner';

interface EspacioOcupacion {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  horasOcupadas: number;
  horasDisponibles: number;
  porcentajeOcupacion: number;
  edificio: string;
  jornada: {
    manana: number;
    tarde: number;
    noche: number;
  };
}

export default function OcupacionSemanal() {
  const PERIODO_TRABAJO = '2025-1'; // Periodo activo de trabajo
  const [tipoEspacio, setTipoEspacio] = useState<string>('todos');
  const [calculando, setCalculando] = useState(false);
  const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());

  // Datos mock de ocupación de espacios (calculados automáticamente)
  const [espaciosOcupacion, setEspaciosOcupacion] = useState<EspacioOcupacion[]>([
    {
      id: '1',
      nombre: 'Aula 101',
      tipo: 'Aula',
      capacidad: 40,
      horasOcupadas: 38,
      horasDisponibles: 48,
      porcentajeOcupacion: 79.2,
      edificio: 'A',
      jornada: { manana: 85, tarde: 90, noche: 62 }
    },
    {
      id: '2',
      nombre: 'Laboratorio 301',
      tipo: 'Laboratorio',
      capacidad: 25,
      horasOcupadas: 44,
      horasDisponibles: 48,
      porcentajeOcupacion: 91.7,
      edificio: 'C',
      jornada: { manana: 95, tarde: 100, noche: 80 }
    },
    {
      id: '3',
      nombre: 'Auditorio Central',
      tipo: 'Auditorio',
      capacidad: 200,
      horasOcupadas: 18,
      horasDisponibles: 48,
      porcentajeOcupacion: 37.5,
      edificio: 'B',
      jornada: { manana: 45, tarde: 40, noche: 25 }
    },
    {
      id: '4',
      nombre: 'Aula 205',
      tipo: 'Aula',
      capacidad: 35,
      horasOcupadas: 42,
      horasDisponibles: 48,
      porcentajeOcupacion: 87.5,
      edificio: 'A',
      jornada: { manana: 90, tarde: 95, noche: 75 }
    },
    {
      id: '5',
      nombre: 'Sala de Juntas 1',
      tipo: 'Sala',
      capacidad: 15,
      horasOcupadas: 12,
      horasDisponibles: 48,
      porcentajeOcupacion: 25.0,
      edificio: 'D',
      jornada: { manana: 30, tarde: 25, noche: 15 }
    },
    {
      id: '6',
      nombre: 'Laboratorio 302',
      tipo: 'Laboratorio',
      capacidad: 30,
      horasOcupadas: 40,
      horasDisponibles: 48,
      porcentajeOcupacion: 83.3,
      edificio: 'C',
      jornada: { manana: 88, tarde: 90, noche: 70 }
    },
    {
      id: '7',
      nombre: 'Aula 102',
      tipo: 'Aula',
      capacidad: 40,
      horasOcupadas: 36,
      horasDisponibles: 48,
      porcentajeOcupacion: 75.0,
      edificio: 'A',
      jornada: { manana: 80, tarde: 85, noche: 55 }
    },
    {
      id: '8',
      nombre: 'Cancha Deportiva 1',
      tipo: 'Cancha',
      capacidad: 50,
      horasOcupadas: 15,
      horasDisponibles: 48,
      porcentajeOcupacion: 31.3,
      edificio: 'Zona Deportiva',
      jornada: { manana: 40, tarde: 35, noche: 15 }
    }
  ]);

  const recalcularOcupacion = () => {
    setCalculando(true);
    
    // Simulación de cálculo (en producción esto vendría del backend)
    setTimeout(() => {
      // Aquí se recalcularían los porcentajes basados en horarios reales
      toast.success('Ocupación recalculada exitosamente');
      setUltimaActualizacion(new Date());
      setCalculando(false);
    }, 1500);
  };

  const exportarReporte = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('Reporte de Ocupación Semanal', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Periodo: ${PERIODO_TRABAJO}`, 20, 30);
      doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 37);
      doc.text(`Tipo de Espacio: ${tipoEspacio === 'todos' ? 'Todos' : tipoEspacio}`, 20, 44);
      
      doc.line(20, 48, 190, 48);

      doc.setFontSize(14);
      doc.text('Ocupación por Espacio', 20, 58);
      
      doc.setFontSize(10);
      let yPos = 68;
      espaciosFiltrados.forEach((espacio) => {
        if (yPos > 270) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`${espacio.nombre}`, 25, yPos);
        doc.text(`${espacio.porcentajeOcupacion.toFixed(1)}%`, 100, yPos);
        doc.text(`${espacio.horasOcupadas}/${espacio.horasDisponibles}h`, 150, yPos);
        yPos += 7;
      });

      doc.save(`ocupacion-semanal-${PERIODO_TRABAJO}.pdf`);
      toast.success('Reporte descargado exitosamente');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al generar el reporte');
    }
  };

  const espaciosFiltrados = tipoEspacio === 'todos' 
    ? espaciosOcupacion 
    : espaciosOcupacion.filter(e => e.tipo === tipoEspacio);

  // Calcular estadísticas generales
  const promedioOcupacion = espaciosFiltrados.reduce((acc, e) => acc + e.porcentajeOcupacion, 0) / espaciosFiltrados.length;
  const totalHorasOcupadas = espaciosFiltrados.reduce((acc, e) => acc + e.horasOcupadas, 0);
  const totalHorasDisponibles = espaciosFiltrados.reduce((acc, e) => acc + e.horasDisponibles, 0);
  const espaciosSobreocupados = espaciosFiltrados.filter(e => e.porcentajeOcupacion > 85).length;
  const espaciosSubutilizados = espaciosFiltrados.filter(e => e.porcentajeOcupacion < 50).length;

  const getColorPorOcupacion = (porcentaje: number) => {
    if (porcentaje >= 85) return 'text-red-600 bg-red-100 border-red-300';
    if (porcentaje >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
    if (porcentaje >= 50) return 'text-green-600 bg-green-100 border-green-300';
    return 'text-slate-600 bg-slate-100 border-slate-300';
  };

  const getBarColor = (porcentaje: number) => {
    if (porcentaje >= 85) return 'bg-red-600';
    if (porcentaje >= 70) return 'bg-yellow-600';
    if (porcentaje >= 50) return 'bg-green-600';
    return 'bg-slate-400';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Ocupación Semanal de Espacios</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Análisis detallado del uso de salones y laboratorios
          </p>
          <p className="text-slate-500 dark:text-slate-500 text-sm mt-1">
            Última actualización: {ultimaActualizacion.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
            <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-900 dark:text-blue-100"><strong>{PERIODO_TRABAJO}</strong></span>
          </div>
          <Button 
            onClick={recalcularOcupacion}
            disabled={calculando}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${calculando ? 'animate-spin' : ''}`} />
            {calculando ? 'Calculando...' : 'Recalcular'}
          </Button>
          <Button 
            onClick={exportarReporte}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex items-center gap-4">
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
            <SelectItem value="Cancha">Canchas</SelectItem>
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
              <Calendar className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-slate-900 dark:text-slate-100">{totalHorasOcupadas} / {totalHorasDisponibles}</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">horas ocupadas</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-slate-600 dark:text-slate-400">Total Espacios</p>
              <TrendingUp className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-slate-900 dark:text-slate-100">{espaciosFiltrados.length}</p>
            <p className="text-slate-500 dark:text-slate-500 text-sm">en análisis</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-red-700 dark:text-red-300">Sobreocupados</p>
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            </div>
            <p className="text-red-900 dark:text-red-100">{espaciosSobreocupados}</p>
            <p className="text-red-600 dark:text-red-400 text-sm">&gt;85% ocupación</p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-blue-700 dark:text-blue-300">Subutilizados</p>
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
            </div>
            <p className="text-blue-900 dark:text-blue-100">{espaciosSubutilizados}</p>
            <p className="text-blue-600 dark:text-blue-400 text-sm">&lt;50% ocupación</p>
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
    </div>
  );
}
