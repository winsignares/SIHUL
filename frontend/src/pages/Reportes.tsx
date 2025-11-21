import { useState } from 'react';
import { Button } from '../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { FileText, Download, TrendingUp, Calendar, BarChart3, PieChart, FileSpreadsheet, User, Building } from 'lucide-react';
import { Badge } from '../share/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../share/table';
import { motion } from 'motion/react';

export default function Reportes() {
  const PERIODO_TRABAJO = '2025-1'; // Periodo activo de trabajo
  const [tipoReporte, setTipoReporte] = useState('ocupacion');
  const [filtroDocente, setFiltroDocente] = useState('todos');
  const [filtroPrograma, setFiltroPrograma] = useState('todos');

  const exportarPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      // Encabezado
      doc.setFontSize(18);
      doc.text(`Reporte: ${reportesDisponibles.find(r => r.id === tipoReporte)?.nombre || ''}`, 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Periodo: ${PERIODO_TRABAJO}`, 20, 30);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 37);
      
      doc.line(20, 42, 190, 42);

      let yPos = 52;

      // Contenido según tipo de reporte
      if (tipoReporte === 'ocupacion') {
        doc.setFontSize(14);
        doc.text('Ocupación por Jornada', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        datosOcupacion.forEach((dato) => {
          doc.text(`${dato.jornada}`, 25, yPos);
          doc.text(`Ocupación: ${dato.ocupacion}%`, 100, yPos);
          doc.text(`Espacios: ${dato.espacios}`, 150, yPos);
          yPos += 8;
        });

        yPos += 10;
        doc.setFontSize(14);
        doc.text('Espacios Más Utilizados', 20, yPos);
        yPos += 10;

        doc.setFontSize(11);
        espaciosMasUsados.forEach((espacio, index) => {
          doc.text(`${index + 1}. ${espacio.espacio}`, 25, yPos);
          doc.text(`${espacio.usos} clases/semana`, 100, yPos);
          doc.text(`${espacio.ocupacion}%`, 160, yPos);
          yPos += 8;
        });
      } else if (tipoReporte === 'horarios-docente') {
        doc.setFontSize(14);
        doc.text('Horarios por Docente', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        horariosDocente.forEach((horario) => {
          doc.text(`${horario.dia} ${horario.hora}`, 25, yPos);
          doc.text(`${horario.asignatura}`, 80, yPos);
          doc.text(`${horario.grupo}`, 130, yPos);
          doc.text(`${horario.espacio}`, 160, yPos);
          yPos += 8;
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
      } else if (tipoReporte === 'horarios-programa') {
        doc.setFontSize(14);
        doc.text('Horarios por Programa', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        horariosPrograma.forEach((horario) => {
          doc.text(`${horario.grupo}`, 25, yPos);
          doc.text(`${horario.dia} ${horario.hora}`, 60, yPos);
          doc.text(`${horario.asignatura}`, 110, yPos);
          doc.text(`${horario.docente}`, 150, yPos);
          yPos += 8;
          if (yPos > 270) {
            doc.addPage();
            yPos = 20;
          }
        });
      } else if (tipoReporte === 'disponibilidad') {
        doc.setFontSize(14);
        doc.text('Disponibilidad General de Espacios', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        disponibilidadEspacios.forEach((espacio) => {
          doc.text(`${espacio.nombre}`, 25, yPos);
          doc.text(`Disponible: ${espacio.horasDisponibles}h`, 100, yPos);
          doc.text(`Ocupado: ${espacio.horasOcupadas}h`, 150, yPos);
          yPos += 8;
        });
      } else if (tipoReporte === 'capacidad') {
        doc.setFontSize(14);
        doc.text('Capacidad Utilizada', 20, yPos);
        yPos += 10;
        
        doc.setFontSize(11);
        capacidadUtilizada.forEach((dato) => {
          doc.text(`${dato.tipo}`, 25, yPos);
          doc.text(`Capacidad: ${dato.capacidadTotal}`, 80, yPos);
          doc.text(`Utilizada: ${dato.capacidadUsada}`, 120, yPos);
          doc.text(`${dato.porcentaje}%`, 160, yPos);
          yPos += 8;
        });
      }

      // Pie de página
      doc.setFontSize(9);
      doc.text('Sistema de Planeación y Gestión de Espacios Académicos Universitarios', 20, 285);

      doc.save(`reporte-${tipoReporte}-${PERIODO_TRABAJO}.pdf`);
      toast.success('Reporte PDF descargado exitosamente');
    } catch (error) {
      console.error('Error al generar PDF:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const exportarExcel = async () => {
    try {
      const XLSX = await import('xlsx');
      const workbook = XLSX.utils.book_new();

      if (tipoReporte === 'ocupacion') {
        const datosJornada = datosOcupacion.map(d => ({
          'Jornada': d.jornada,
          'Ocupación (%)': d.ocupacion,
          'Espacios': d.espacios
        }));
        const ws1 = XLSX.utils.json_to_sheet(datosJornada);
        XLSX.utils.book_append_sheet(workbook, ws1, 'Ocupación por Jornada');

        const datosEspacios = espaciosMasUsados.map((e, i) => ({
          'Posición': i + 1,
          'Espacio': e.espacio,
          'Clases por Semana': e.usos,
          'Ocupación (%)': e.ocupacion
        }));
        const ws2 = XLSX.utils.json_to_sheet(datosEspacios);
        XLSX.utils.book_append_sheet(workbook, ws2, 'Espacios Más Usados');
      } else if (tipoReporte === 'horarios-docente') {
        const datos = horariosDocente.map(h => ({
          'Día': h.dia,
          'Hora': h.hora,
          'Asignatura': h.asignatura,
          'Grupo': h.grupo,
          'Espacio': h.espacio
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(workbook, ws, 'Horarios Docente');
      } else if (tipoReporte === 'horarios-programa') {
        const datos = horariosPrograma.map(h => ({
          'Grupo': h.grupo,
          'Día': h.dia,
          'Hora': h.hora,
          'Asignatura': h.asignatura,
          'Docente': h.docente,
          'Espacio': h.espacio
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(workbook, ws, 'Horarios Programa');
      } else if (tipoReporte === 'disponibilidad') {
        const datos = disponibilidadEspacios.map(e => ({
          'Espacio': e.nombre,
          'Tipo': e.tipo,
          'Horas Disponibles': e.horasDisponibles,
          'Horas Ocupadas': e.horasOcupadas,
          'Porcentaje Ocupación': e.porcentajeOcupacion
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(workbook, ws, 'Disponibilidad');
      } else if (tipoReporte === 'capacidad') {
        const datos = capacidadUtilizada.map(c => ({
          'Tipo de Espacio': c.tipo,
          'Capacidad Total': c.capacidadTotal,
          'Capacidad Usada': c.capacidadUsada,
          'Porcentaje': c.porcentaje
        }));
        const ws = XLSX.utils.json_to_sheet(datos);
        XLSX.utils.book_append_sheet(workbook, ws, 'Capacidad Utilizada');
      }

      XLSX.writeFile(workbook, `reporte-${tipoReporte}-${PERIODO_TRABAJO}.xlsx`);
      toast.success('Reporte Excel descargado exitosamente');
    } catch (error) {
      console.error('Error al generar Excel:', error);
      toast.error('Error al generar el Excel');
    }
  };

  const reportesDisponibles = [
    { id: 'ocupacion', nombre: 'Ocupación de Espacios', icon: BarChart3, color: 'text-blue-600', descripcion: 'Análisis de ocupación por jornada (RF20-1)' },
    { id: 'horarios-docente', nombre: 'Horarios por Docente', icon: User, color: 'text-red-600', descripcion: 'Horarios asignados a cada docente (RF20-2)' },
    { id: 'horarios-programa', nombre: 'Horarios por Programa', icon: Building, color: 'text-yellow-600', descripcion: 'Horarios por programa y grupo (RF20-2)' },
    { id: 'disponibilidad', nombre: 'Disponibilidad General', icon: PieChart, color: 'text-green-600', descripcion: 'Disponibilidad de espacios físicos (RF20-3)' },
    { id: 'capacidad', nombre: 'Capacidad Utilizada', icon: TrendingUp, color: 'text-purple-600', descripcion: 'Análisis de capacidad instalada (RF20-4)' }
  ];

  const datosOcupacion = [
    { jornada: 'Mañana (07:00 - 12:00)', ocupacion: 85, espacios: 45, color: 'bg-blue-600' },
    { jornada: 'Tarde (14:00 - 18:00)', ocupacion: 92, espacios: 38, color: 'bg-red-600' },
    { jornada: 'Noche (18:00 - 21:00)', ocupacion: 68, espacios: 22, color: 'bg-yellow-600' }
  ];

  const espaciosMasUsados = [
    { espacio: 'Aula 101', usos: 28, ocupacion: 95 },
    { espacio: 'Laboratorio 301', usos: 24, ocupacion: 88 },
    { espacio: 'Aula 205', usos: 22, ocupacion: 82 },
    { espacio: 'Auditorio Central', usos: 18, ocupacion: 75 },
    { espacio: 'Aula 102', usos: 16, ocupacion: 70 }
  ];

  const horariosDocente = [
    { dia: 'Lunes', hora: '07:00-09:00', asignatura: 'Programación I', grupo: 'INSI-A', espacio: 'Aula 101', docente: 'Dr. Juan Pérez' },
    { dia: 'Martes', hora: '07:00-09:00', asignatura: 'Bases de Datos', grupo: 'INSI-B', espacio: 'Lab 301', docente: 'Dr. Juan Pérez' },
    { dia: 'Martes', hora: '14:00-16:00', asignatura: 'Estadística', grupo: 'ADEM-B', espacio: 'Aula 103', docente: 'Dr. Juan Pérez' },
    { dia: 'Jueves', hora: '07:00-09:00', asignatura: 'Programación I', grupo: 'INSI-C', espacio: 'Aula 102', docente: 'Dr. Juan Pérez' },
    { dia: 'Viernes', hora: '09:00-11:00', asignatura: 'Algoritmos', grupo: 'INSI-A', espacio: 'Lab 401', docente: 'Dr. Juan Pérez' }
  ];

  const horariosPrograma = [
    { grupo: 'INSI-A', dia: 'Lunes', hora: '07:00-09:00', asignatura: 'Programación I', docente: 'Dr. Juan Pérez', espacio: 'Aula 101' },
    { grupo: 'INSI-A', dia: 'Lunes', hora: '09:00-11:00', asignatura: 'Cálculo I', docente: 'Dra. María López', espacio: 'Aula 101' },
    { grupo: 'INSI-A', dia: 'Miércoles', hora: '14:00-16:00', asignatura: 'Física I', docente: 'Dr. Pedro González', espacio: 'Lab 201' },
    { grupo: 'INSI-B', dia: 'Martes', hora: '07:00-09:00', asignatura: 'Bases de Datos', docente: 'Dr. Juan Pérez', espacio: 'Lab 301' },
    { grupo: 'INSI-B', dia: 'Jueves', hora: '09:00-11:00', asignatura: 'Estructuras de Datos', docente: 'Ing. Ana Martínez', espacio: 'Aula 205' }
  ];

  const disponibilidadEspacios = [
    { nombre: 'Aula 101', tipo: 'Aula', horasDisponibles: 12, horasOcupadas: 38, porcentajeOcupacion: 76 },
    { nombre: 'Lab 301', tipo: 'Laboratorio', horasDisponibles: 20, horasOcupadas: 30, porcentajeOcupacion: 60 },
    { nombre: 'Auditorio Central', tipo: 'Auditorio', horasDisponibles: 35, horasOcupadas: 15, porcentajeOcupacion: 30 },
    { nombre: 'Aula 205', tipo: 'Aula', horasDisponibles: 18, horasOcupadas: 32, porcentajeOcupacion: 64 },
    { nombre: 'Lab 401', tipo: 'Laboratorio', horasDisponibles: 25, horasOcupadas: 25, porcentajeOcupacion: 50 }
  ];

  const capacidadUtilizada = [
    { tipo: 'Aulas Estándar', capacidadTotal: 1500, capacidadUsada: 1230, porcentaje: 82 },
    { tipo: 'Laboratorios', capacidadTotal: 600, capacidadUsada: 420, porcentaje: 70 },
    { tipo: 'Auditorios', capacidadTotal: 800, capacidadUsada: 320, porcentaje: 40 },
    { tipo: 'Salas de Juntas', capacidadTotal: 200, capacidadUsada: 150, porcentaje: 75 }
  ];

  const docentes = ['Todos', 'Dr. Juan Pérez', 'Dra. María López', 'Mg. Carlos Ruiz', 'Ing. Ana Martínez', 'Dr. Pedro González'];
  const programas = ['Todos', 'Ingeniería de Sistemas', 'Administración de Empresas', 'Ingeniería Industrial', 'Contaduría Pública'];

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
    </div>
  );
}
