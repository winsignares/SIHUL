import { Badge } from '../../share/badge';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Clock, List, MapPin, Filter, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';

interface HorarioFusionadoExtendido {
  id: number;
  grupo1_id: number;
  grupo2_id: number;
  grupo3_id: number | null;
  grupo1_nombre: string;
  grupo2_nombre: string;
  grupo3_nombre: string | null;
  asignatura_id: number;
  asignatura_nombre: string;
  docente_id: number | null;
  docente_nombre: string;
  espacio_id: number;
  espacio_nombre: string;
  dia_semana: string;
  hora_inicio: string; 
  hora_fin: string;
  cantidad_estudiantes: number | null;
}

interface HorariosFusionadosProps {
  horariosFusionados: HorarioFusionadoExtendido[];
  loading: boolean;
  filtroFusionadoDia: string;
  setFiltroFusionadoDia: (value: string) => void;
  filtroFusionadoAsignatura: string;
  setFiltroFusionadoAsignatura: (value: string) => void;
  filtroFusionadoDocente: string;
  setFiltroFusionadoDocente: (value: string) => void;
  filtroFusionadoEspacio: string;
  setFiltroFusionadoEspacio: (value: string) => void;
  diasFusionadosUnicos: string[];
  asignaturasFusionadasUnicas: string[];
  docentesFusionadosUnicos: string[];
  espaciosFusionadosUnicos: string[];
  limpiarFiltrosFusionados: () => void;
}

export default function HorariosFusionados({ 
  horariosFusionados, 
  loading,
  filtroFusionadoDia,
  setFiltroFusionadoDia,
  filtroFusionadoAsignatura,
  setFiltroFusionadoAsignatura,
  filtroFusionadoDocente,
  setFiltroFusionadoDocente,
  filtroFusionadoEspacio,
  setFiltroFusionadoEspacio,
  diasFusionadosUnicos,
  asignaturasFusionadasUnicas,
  docentesFusionadosUnicos,
  espaciosFusionadosUnicos,
  limpiarFiltrosFusionados
}: HorariosFusionadosProps) {
  return (
    <>
      {/* Card de Filtros */}
      <Card className="border-slate-200 shadow-lg mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-red-600" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Filtro Día */}
            <div>
              <Label>Día de la semana</Label>
              <Select value={filtroFusionadoDia} onValueChange={setFiltroFusionadoDia}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {diasFusionadosUnicos.map(dia => (
                    <SelectItem key={dia} value={dia}>
                      {dia.charAt(0).toUpperCase() + dia.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Asignatura */}
            <div>
              <Label>Asignatura</Label>
              <Select value={filtroFusionadoAsignatura} onValueChange={setFiltroFusionadoAsignatura}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {asignaturasFusionadasUnicas.map(asig => (
                    <SelectItem key={asig} value={asig}>{asig}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Docente */}
            <div>
              <Label>Docente</Label>
              <Select value={filtroFusionadoDocente} onValueChange={setFiltroFusionadoDocente}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {docentesFusionadosUnicos.map(doc => (
                    <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Espacio */}
            <div>
              <Label>Espacio</Label>
              <Select value={filtroFusionadoEspacio} onValueChange={setFiltroFusionadoEspacio}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {espaciosFusionadosUnicos.map(esp => (
                    <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botón Limpiar Filtros */}
          <div className="flex justify-end">
            <Button
              onClick={limpiarFiltrosFusionados}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Limpiar Filtros
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Card de Resultados */}
      <Card className="border-slate-200 shadow-xl overflow-hidden bg-gradient-to-br from-white to-slate-50">
        <CardHeader className="bg-gradient-to-r from-red-600 to-yellow-500 text-white pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-lg backdrop-blur-sm">
              <List className="w-6 h-6" />
            </div>
            <div>
              <CardTitle className="text-2xl">Horarios Fusionados</CardTitle>
              <p className="text-white/90 text-sm mt-1">
                Clases compartidas por múltiples grupos
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white border-white/30 text-lg px-4 py-2">
            {horariosFusionados.length} fusionados
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : horariosFusionados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <List className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <p className="text-slate-500 text-lg">No hay horarios fusionados registrados</p>
            <p className="text-slate-400 text-sm mt-2">
              Los horarios fusionados se crean automáticamente cuando varios grupos comparten una clase
            </p>
          </motion.div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gradient-to-r from-slate-100 to-slate-200 border-b-2 border-slate-300">
                  <th className="px-4 py-3 text-left text-slate-900 font-semibold">Grupos</th>
                  <th className="px-4 py-3 text-left text-slate-900 font-semibold">Asignatura</th>
                  <th className="px-4 py-3 text-left text-slate-900 font-semibold">Docente</th>
                  <th className="px-4 py-3 text-center text-slate-900 font-semibold">Día</th>
                  <th className="px-4 py-3 text-center text-slate-900 font-semibold">Horario</th>
                  <th className="px-4 py-3 text-center text-slate-900 font-semibold">Espacio</th>
                  <th className="px-4 py-3 text-center text-slate-900 font-semibold">Estudiantes</th>
                </tr>
              </thead>
              <tbody>
                {horariosFusionados.map((fusionado, idx) => (
                  <motion.tr
                    key={fusionado.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="border-b border-slate-200 hover:bg-gradient-to-r hover:from-red-50 hover:to-yellow-50 transition-all duration-200"
                  >
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white">
                          {fusionado.grupo1_nombre}
                        </Badge>
                        <Badge className="bg-gradient-to-r from-yellow-600 to-yellow-700 text-white">
                          {fusionado.grupo2_nombre}
                        </Badge>
                        {fusionado.grupo3_nombre && (
                          <Badge className="bg-gradient-to-r from-orange-600 to-orange-700 text-white">
                            {fusionado.grupo3_nombre}
                          </Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-600"></div>
                        <span className="text-slate-900 font-medium">{fusionado.asignatura_nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{fusionado.docente_nombre}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="outline" className="border-red-600 text-red-700 font-medium">
                        {fusionado.dia_semana.charAt(0).toUpperCase() + fusionado.dia_semana.slice(1)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-700">
                        <Clock className="w-4 h-4 text-red-600" />
                        <span className="font-medium">{fusionado.hora_inicio}</span>
                        <span className="text-slate-400">-</span>
                        <span className="font-medium">{fusionado.hora_fin}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2 text-slate-700">
                        <MapPin className="w-4 h-4 text-yellow-600" />
                        <span>{fusionado.espacio_nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant="secondary" className="bg-slate-100 text-slate-900 font-semibold">
                        {fusionado.cantidad_estudiantes}
                      </Badge>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}
