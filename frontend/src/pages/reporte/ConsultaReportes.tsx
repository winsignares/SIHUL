import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { BarChart3, TrendingUp, Calendar, Download, FileSpreadsheet } from 'lucide-react';
import { Toaster } from '../../share/sonner';
import { useConsultaReportes } from '../../hooks/reporte/useConsultaReportes';

export default function ConsultaReportes() {
  const {
    periodo,
    setPeriodo,
    datosOcupacion,
    espaciosMasUsados,
    exportarPDF,
    exportarExcel
  } = useConsultaReportes();

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
      <Toaster />
    </div>
  );
}
