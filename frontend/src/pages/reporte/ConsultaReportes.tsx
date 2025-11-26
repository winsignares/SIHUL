import { useState } from 'react';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { BarChart3, TrendingUp, Calendar, Download, FileSpreadsheet } from 'lucide-react';
import { Toaster } from '../../share/sonner';

export default function ConsultaReportes() {
  const [periodo, setPeriodo] = useState('2025-1');

  const exportarPDF = async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const doc = new jsPDF();

      doc.setFontSize(18);
      doc.text('Reporte de Ocupación de Espacios', 20, 20);
      
      doc.setFontSize(12);
      doc.text(`Periodo: ${periodo}`, 20, 30);
      doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 20, 37);
      
      doc.line(20, 42, 190, 42);

      doc.setFontSize(14);
      doc.text('Ocupación por Jornada', 20, 52);
      
      doc.setFontSize(11);
      let yPos = 62;
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

      yPos += 10;
      doc.setFontSize(14);
      doc.text('Estadísticas Generales', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.text('Total de Clases: 342', 25, yPos);
      yPos += 7;
      doc.text('Ocupación Promedio: 82% (Óptimo)', 25, yPos);
      yPos += 7;
      doc.text('Espacios Activos: 128', 25, yPos);
      yPos += 7;
      doc.text('Programas Activos: 18', 25, yPos);

      doc.setFontSize(9);
      doc.text('Sistema de Planeación y Gestión de Espacios Académicos', 20, 285);

      doc.save(`reporte-consulta-${periodo}.pdf`);
      // pdf generado exitosamente notificación
    } catch (error) {
      console.error('Error al generar PDF:', error);
      // error al generar pdf notificación
    }
  };

  const exportarExcel = async () => {
    try {
      const XLSX = await import('xlsx');

      const workbook = XLSX.utils.book_new();

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

      const estadisticas = [
        { 'Métrica': 'Total de Clases', 'Valor': 342 },
        { 'Métrica': 'Ocupación Promedio', 'Valor': '82%' },
        { 'Métrica': 'Espacios Activos', 'Valor': 128 },
        { 'Métrica': 'Programas Activos', 'Valor': 18 }
      ];
      const ws3 = XLSX.utils.json_to_sheet(estadisticas);
      XLSX.utils.book_append_sheet(workbook, ws3, 'Estadísticas');

      const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
      const clasesSemanales = [68, 72, 65, 58, 45];
      const datosSemanales = diasSemana.map((dia, i) => ({
        'Día': dia,
        'Clases': clasesSemanales[i]
      }));
      const ws4 = XLSX.utils.json_to_sheet(datosSemanales);
      XLSX.utils.book_append_sheet(workbook, ws4, 'Distribución Semanal');

      XLSX.writeFile(workbook, `reporte-consulta-${periodo}.xlsx`);
      // reporte excel generado exitosamente notificación
    } catch (error) {
      console.error('Error al generar Excel:', error);
      // error al generar excel notificación
    }
  };

  const datosOcupacion = [
    { jornada: 'Mañana (07:00 - 12:00)', ocupacion: 85, espacios: 45, color: 'bg-blue-600' },
    { jornada: 'Tarde (14:00 - 18:00)', ocupacion: 92, espacios: 38, color: 'bg-yellow-600' },
    { jornada: 'Noche (18:00 - 21:00)', ocupacion: 68, espacios: 22, color: 'bg-red-600' }
  ];

  const espaciosMasUsados = [
    { espacio: 'Aula 101', usos: 28, ocupacion: 95 },
    { espacio: 'Laboratorio 301', usos: 24, ocupacion: 88 },
    { espacio: 'Aula 205', usos: 22, ocupacion: 82 },
    { espacio: 'Auditorio Central', usos: 18, ocupacion: 75 }
  ];

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Reportes y Estadísticas</h1>
          <p className="text-slate-600">Visualiza estadísticas y reportes del sistema</p>
        </div>
        <div className="flex gap-3">
          <Select value={periodo} onValueChange={setPeriodo}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Periodo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2025-1">Periodo 2025-1</SelectItem>
              <SelectItem value="2024-2">Periodo 2024-2</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            onClick={exportarPDF}
          >
            <Download className="w-4 h-4 mr-2" />
            PDF
          </Button>
          <Button 
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            onClick={exportarExcel}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Excel
          </Button>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 mb-2">Total de Clases</p>
                <p className="text-slate-900">342</p>
              </div>
              <Calendar className="w-10 h-10 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div>
              <p className="text-slate-600 mb-2">Ocupación Promedio</p>
              <p className="text-slate-900 mb-1">82%</p>
              <p className="text-blue-600">Óptimo</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div>
              <p className="text-slate-600 mb-2">Espacios Activos</p>
              <p className="text-slate-900">128</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200">
          <CardContent className="p-6">
            <div>
              <p className="text-slate-600 mb-2">Programas Activos</p>
              <p className="text-slate-900">18</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Reports */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Ocupación por Jornada */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <CardTitle className="text-slate-900">Ocupación por Jornada</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {datosOcupacion.map((dato, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-slate-900">{dato.jornada}</span>
                    <p className="text-slate-600">{dato.espacios} espacios</p>
                  </div>
                  <span className="text-slate-900">{dato.ocupacion}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div 
                    className={`${dato.color} h-3 rounded-full transition-all`} 
                    style={{ width: `${dato.ocupacion}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Espacios Más Usados */}
        <Card className="border-slate-200">
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-600" />
              <CardTitle className="text-slate-900">Espacios Más Utilizados</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {espaciosMasUsados.map((espacio, index) => (
                <div key={index} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                      <span className="text-blue-900">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-slate-900">{espacio.espacio}</p>
                      <p className="text-slate-600">{espacio.usos} clases/semana</p>
                    </div>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-300">
                    {espacio.ocupacion}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Distribución Semanal */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Distribución de Clases por Día</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-4">
            {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia, index) => {
              const clases = [68, 72, 65, 58, 45][index];
              return (
                <div key={dia} className="text-center">
                  <div className="bg-slate-100 rounded-lg p-4 mb-2">
                    <div 
                      className="bg-gradient-to-t from-yellow-600 to-yellow-400 rounded mx-auto transition-all"
                      style={{ height: `${clases}px`, width: '40px' }}
                    ></div>
                  </div>
                  <p className="text-slate-900 mb-1">{clases}</p>
                  <p className="text-slate-600">{dia}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
