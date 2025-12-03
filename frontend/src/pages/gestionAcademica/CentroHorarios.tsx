import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../share/tabs';
import { Fragment } from 'react';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import {
  Clock,
  Search,
  Filter,
  Calendar,
  MapPin,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle2,
  ChevronDown,
  List,
  Plus,
  AlertTriangle,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CrearHorarios from './CrearHorarios';
import { NotificationBanner } from '../../share/notificationBanner';
import { useCentroHorarios } from '../../hooks/gestionAcademica/useCentroHorarios';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function CentroHorarios() {
  const isMobile = useIsMobile();
  const {
    activeTab, setActiveTab,
    loading,
    facultades,
    espacios,
    filtroFacultad, setFiltroFacultad,
    filtroPrograma, setFiltroPrograma,
    filtroGrupo, setFiltroGrupo,
    filtroSemestre, setFiltroSemestre,
    showEditModal, setShowEditModal,
    horarioEditar, setHorarioEditar,
    showDetallesModal, setShowDetallesModal,
    grupoDetalles,
    gruposExpandidos,
    loadData,
    generarHoras,
    obtenerClaseEnHora,
    gruposAgrupados,
    gruposUnicos,
    semestresUnicos,
    programasFiltrados,
    handleVerDetalles,
    handleEditar,
    handleGuardarEdicion,
    handleEliminar,
    limpiarFiltros,
    toggleGrupoExpandido,
    handleDescargarPDF,
    handleDescargarExcel,
    showDeleteGrupoModal, setShowDeleteGrupoModal,
    grupoAEliminar, setGrupoAEliminar,
    eliminandoGrupo,
    progresoEliminacion,
    handleAbrirModalEliminarGrupo,
    handleEliminarGrupoCompleto,
    dias,
    notification
  } = useCentroHorarios();

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <NotificationBanner notification={notification} />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-900 mb-2">Centro de Horarios</h1>
          <p className="text-slate-600">Consulta, modifica y elimina horarios académicos</p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDescargarPDF}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Descargar en PDF
          </Button>
          <Button
            onClick={handleDescargarExcel}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Descargar en Excel
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-3xl grid-cols-3">
          <TabsTrigger value="crear">
            <Plus className="w-4 h-4 mr-2" />
            Crear Horarios
          </TabsTrigger>
          <TabsTrigger value="modificacion">
            <Edit className="w-4 h-4 mr-2" />
            Modificación
          </TabsTrigger>
          <TabsTrigger value="consulta">
            <Eye className="w-4 h-4 mr-2" />
            Consulta de Horarios
          </TabsTrigger>
        </TabsList>

        {/* Tab: Consulta de Horarios */}
        <TabsContent value="consulta" className="space-y-6">
          {/* Filtros */}
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-600" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros en Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Facultad */}
                <div>
                  <Label>Facultad</Label>
                  <Select
                    value={filtroFacultad}
                    onValueChange={setFiltroFacultad}
                    disabled={facultades.length === 1}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {facultades.length > 1 && <SelectItem value="all">Todas</SelectItem>}
                      {facultades.map(f => (
                        <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Programa */}
                <div>
                  <Label>Programa</Label>
                  <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {programasFiltrados.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grupo */}
                <div>
                  <Label>Grupo</Label>
                  <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {gruposUnicos.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semestre */}
                <div>
                  <Label>Semestre</Label>
                  <Select value={filtroSemestre} onValueChange={setFiltroSemestre}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {semestresUnicos.map(s => (
                        <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  onClick={limpiarFiltros}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
                <Button
                  onClick={loadData}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resultados */}
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Grupos Encontrados ({gruposAgrupados.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gruposAgrupados.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">No se encontraron grupos</p>
                  <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-700">Programa</th>
                        <th className="px-4 py-3 text-left text-slate-700">Grupo</th>
                        <th className="px-4 py-3 text-left text-slate-700">Semestre</th>
                        <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gruposAgrupados.map((grupo) => (
                        <tr key={`${grupo.programaId}-${grupo.grupo}-${grupo.semestre}`} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{grupo.horarios[0]?.programa_nombre || 'N/A'}</td>
                          <td className="px-4 py-3">
                            <Badge variant="outline" className="border-blue-600 text-blue-600">{grupo.grupo}</Badge>
                          </td>
                          <td className="px-4 py-3 text-slate-700">{grupo.semestre}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2 justify-center">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                                onClick={() => handleVerDetalles(grupo)}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Ver Horario
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Crear Horarios */}
        <TabsContent value="crear" className="space-y-6">
          <CrearHorarios onHorarioCreado={loadData} />
        </TabsContent>

        {/* Tab: Modificación */}
        <TabsContent value="modificacion" className="space-y-6">
          {/* Filtros (reutilizados) */}
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5 text-orange-600" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Filtros en Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {/* Facultad */}
                <div>
                  <Label>Facultad</Label>
                  <Select
                    value={filtroFacultad}
                    onValueChange={setFiltroFacultad}
                    disabled={facultades.length === 1}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {facultades.length > 1 && <SelectItem value="all">Todas</SelectItem>}
                      {facultades.map(f => (
                        <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Programa */}
                <div>
                  <Label>Programa</Label>
                  <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {programasFiltrados.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Grupo */}
                <div>
                  <Label>Grupo</Label>
                  <Select value={filtroGrupo} onValueChange={setFiltroGrupo}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {gruposUnicos.map(g => (
                        <SelectItem key={g} value={g}>{g}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Semestre */}
                <div>
                  <Label>Semestre</Label>
                  <Select value={filtroSemestre} onValueChange={setFiltroSemestre}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      {semestresUnicos.map(s => (
                        <SelectItem key={s} value={s.toString()}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-2">
                <Button
                  onClick={limpiarFiltros}
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Limpiar Filtros
                </Button>
                <Button
                  onClick={loadData}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabla de Modificación */}
          <Card className="border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Edit className="w-5 h-5 text-orange-600" />
                  Modificación y Eliminación de Grupos ({gruposAgrupados.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {gruposAgrupados.length === 0 ? (
                <div className="text-center py-12">
                  <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-600 mb-2">No se encontraron grupos</p>
                  <p className="text-slate-500">Intenta ajustar los filtros de búsqueda</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-700">Programa</th>
                        <th className="px-4 py-3 text-left text-slate-700">Grupo</th>
                        <th className="px-4 py-3 text-left text-slate-700">Semestre</th>
                        <th className="px-4 py-3 text-center text-slate-700">Clases</th>
                        <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gruposAgrupados.map((grupo) => {
                        const grupoKey = `${grupo.programaId}-${grupo.grupo}-${grupo.semestre}`;
                        const estaExpandido = gruposExpandidos.has(grupoKey);

                        return (
                          <Fragment key={grupoKey}>
                            {/* Fila principal del grupo */}
                            <tr className="border-t border-slate-200 hover:bg-slate-50">
                              <td className="px-4 py-3 text-slate-900">{grupo.horarios[0]?.programa_nombre || 'N/A'}</td>
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="border-orange-600 text-orange-600">{grupo.grupo}</Badge>
                              </td>
                              <td className="px-4 py-3 text-slate-700">{grupo.semestre}</td>
                              <td className="px-4 py-3 text-center">
                                <Badge className="bg-slate-600">{grupo.horarios.length} clases</Badge>
                              </td>
                              <td className="px-4 py-3">
                                <div className="flex gap-2 justify-center">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-purple-600 text-purple-600 hover:bg-purple-50"
                                    onClick={() => toggleGrupoExpandido(grupoKey)}
                                  >
                                    <List className="w-4 h-4 mr-2" />
                                    Ver Asignaturas
                                    <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${estaExpandido ? 'rotate-180' : ''}`} />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-orange-600 text-orange-600 hover:bg-orange-50"
                                    onClick={() => handleVerDetalles(grupo)}
                                  >
                                    <Eye className="w-4 h-4 mr-2" />
                                    Ver Horario
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-600 text-red-600 hover:bg-red-50"
                                    onClick={() => handleAbrirModalEliminarGrupo(grupo)}
                                  >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Eliminar Grupo
                                  </Button>
                                </div>
                              </td>
                            </tr>

                            {/* Fila expandible con lista de asignaturas */}
                            <AnimatePresence>
                              {estaExpandido && (
                                <motion.tr
                                  key={`${grupoKey}-expandido`}
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="bg-gradient-to-r from-purple-50 to-orange-50"
                                >
                                  <td colSpan={5} className="px-4 py-4">
                                    <motion.div
                                      initial={{ height: 0 }}
                                      animate={{ height: 'auto' }}
                                      exit={{ height: 0 }}
                                      className="overflow-hidden"
                                    >
                                      <div className="bg-white rounded-lg border-2 border-purple-200 p-4">
                                        <div className="flex items-center gap-2 mb-4">
                                          <List className="w-5 h-5 text-purple-600" />
                                          <h3 className="text-slate-900">Asignaturas del Grupo {grupo.grupo}</h3>
                                          <Badge className="bg-purple-600">{grupo.horarios.length} asignaturas</Badge>
                                        </div>

                                        {/* Tabla interna de asignaturas */}
                                        <div className="overflow-x-auto">
                                          <table className="w-full">
                                            <thead className="bg-purple-100">
                                              <tr>
                                                <th className="px-3 py-2 text-left text-purple-900 text-sm">Asignatura</th>
                                                <th className="px-3 py-2 text-left text-purple-900 text-sm">Docente</th>
                                                <th className="px-3 py-2 text-center text-purple-900 text-sm">Día</th>
                                                <th className="px-3 py-2 text-center text-purple-900 text-sm">Horario</th>
                                                <th className="px-3 py-2 text-center text-purple-900 text-sm">Espacio</th>
                                                <th className="px-3 py-2 text-center text-purple-900 text-sm">Acciones</th>
                                              </tr>
                                            </thead>
                                            <tbody>
                                              {grupo.horarios.map((horario, idx) => (
                                                <motion.tr
                                                  key={horario.id}
                                                  initial={{ opacity: 0, x: -20 }}
                                                  animate={{ opacity: 1, x: 0 }}
                                                  transition={{ delay: idx * 0.05 }}
                                                  className="border-t border-purple-100 hover:bg-purple-50 transition-colors"
                                                >
                                                  <td className="px-3 py-2 text-slate-900">{horario.asignatura_nombre}</td>
                                                  <td className="px-3 py-2 text-slate-700">{horario.docente_nombre}</td>
                                                  <td className="px-3 py-2 text-center">
                                                    <Badge variant="outline" className="border-slate-600 text-slate-700 text-xs">
                                                      {horario.dia_semana.charAt(0).toUpperCase() + horario.dia_semana.slice(1)}
                                                    </Badge>
                                                  </td>
                                                  <td className="px-3 py-2 text-center text-slate-700 text-sm">
                                                    {horario.hora_inicio} - {horario.hora_fin}
                                                  </td>
                                                  <td className="px-3 py-2 text-center text-slate-700 text-sm">
                                                    {horario.espacio_nombre}
                                                  </td>
                                                  <td className="px-3 py-2">
                                                    <div className="flex gap-2 justify-center">
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-blue-600 text-blue-600 hover:bg-blue-50 h-8 px-2"
                                                        onClick={() => handleEditar(horario)}
                                                      >
                                                        <Edit className="w-3 h-3 mr-1" />
                                                        Editar
                                                      </Button>
                                                      <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-600 text-red-600 hover:bg-red-50 h-8 px-2"
                                                        onClick={() => handleEliminar(horario.id)}
                                                      >
                                                        <Trash2 className="w-3 h-3 mr-1" />
                                                        Eliminar
                                                      </Button>
                                                    </div>
                                                  </td>
                                                </motion.tr>
                                              ))}
                                            </tbody>
                                          </table>
                                        </div>
                                      </div>
                                    </motion.div>
                                  </td>
                                </motion.tr>
                              )}
                            </AnimatePresence>
                          </Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de Detalles */}
      <Dialog open={showDetallesModal} onOpenChange={setShowDetallesModal}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-red-600" />
              Horario Completo del Grupo {grupoDetalles?.grupo}
            </DialogTitle>
          </DialogHeader>
          {grupoDetalles && (
            <div className="space-y-6 py-4">
              {/* Información del Grupo */}
              <Card className="bg-gradient-to-r from-red-50 to-yellow-50 border-red-200">
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Programa</p>
                      <p className="text-slate-900">{grupoDetalles.horarios[0]?.programa_nombre || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Grupo</p>
                      <Badge className="bg-red-600">{grupoDetalles.grupo}</Badge>
                    </div>
                    <div>
                      <p className="text-slate-600 text-sm mb-1">Semestre</p>
                      <p className="text-slate-900">{grupoDetalles.semestre}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid Semanal - Estilo ROJO AsignacionAutomatica */}
              <div className="bg-white rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                        <th className="border-2 border-slate-300 p-4 text-white w-32">
                          <Clock className="w-5 h-5 mx-auto mb-1" />
                          Hora
                        </th>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dia) => (
                          <th key={dia} className="border-2 border-slate-300 p-4 text-white">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generarHoras().map((hora) => {
                        // Convertir hora a rango (ej: "6:00" -> "6:00 - 7:00")
                        const horaNum = parseInt(hora.split(':')[0]);
                        const horaFin = horaNum + 1;
                        const horaRango = `${hora} - ${horaFin.toString().padStart(2, '0')}:00`;
                        
                        return (
                        <tr key={hora} className="hover:bg-slate-50 transition-colors">
                          <td className="border-2 border-slate-300 p-3 bg-slate-100 text-center text-slate-700 text-xs font-medium">
                            <div>{horaRango}</div>
                          </td>
                          {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map((dia) => {
                            const clase = obtenerClaseEnHora(dia, hora, grupoDetalles.horarios);
                            return (
                              <td
                                key={dia}
                                className={`border-2 border-slate-300 p-2 transition-all ${clase
                                  ? 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 cursor-pointer'
                                  : 'bg-white hover:bg-slate-50'
                                  }`}
                              >
                                {clase ? (
                                  <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="h-full min-h-[120px] flex flex-col justify-center items-center text-white p-3 rounded-lg"
                                  >
                                    <div className="text-center space-y-2 w-full">
                                      <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm mb-2">
                                        <p className="text-sm mb-1">{clase.asignatura_nombre}</p>
                                        <p className="text-xs text-yellow-200">{clase.docente_nombre}</p>
                                      </div>
                                      <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                        <MapPin className="w-4 h-4 text-yellow-300" />
                                        <span className="text-sm">{clase.espacio_nombre}</span>
                                      </div>
                                      <div className="text-xs text-yellow-100 mt-1">
                                        {clase.hora_inicio} - {clase.hora_fin}
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <div className="h-full min-h-[120px] flex items-center justify-center">
                                    <span className="text-slate-300 text-xs">—</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-red-500 to-red-600 rounded"></div>
                  <span className="text-slate-600">Clase asignada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white border-2 border-slate-300 rounded"></div>
                  <span className="text-slate-600">Hora libre</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetallesModal(false)} className="bg-red-600 hover:bg-red-700">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Edición */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-orange-600" />
              Editar Horario
            </DialogTitle>
          </DialogHeader>
          {horarioEditar && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Asignatura</Label>
                  <Input
                    value={horarioEditar.asignatura_nombre || ''}
                    disabled
                    className="bg-slate-100"
                  />
                </div>
                <div>
                  <Label>Grupo</Label>
                  <Input
                    value={horarioEditar.grupo_nombre || ''}
                    disabled
                    className="bg-slate-100"
                  />
                </div>
                <div>
                  <Label>Docente</Label>
                  <Input
                    value={horarioEditar.docente_nombre || ''}
                    disabled
                    className="bg-slate-100"
                  />
                </div>
                <div>
                  <Label>Día</Label>
                  <Select
                    value={horarioEditar.dia_semana}
                    onValueChange={(v) => setHorarioEditar({ ...horarioEditar, dia_semana: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dias.map(d => (
                        <SelectItem key={d} value={d.toLowerCase()}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hora Inicio</Label>
                  <Input
                    type="time"
                    value={horarioEditar.hora_inicio}
                    onChange={(e) => setHorarioEditar({ ...horarioEditar, hora_inicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hora Fin</Label>
                  <Input
                    type="time"
                    value={horarioEditar.hora_fin}
                    onChange={(e) => setHorarioEditar({ ...horarioEditar, hora_fin: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Espacio</Label>
                  <Select
                    value={horarioEditar.espacio_id?.toString()}
                    onValueChange={(v) => setHorarioEditar({ ...horarioEditar, espacio_id: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {espacios.map(e => (
                        <SelectItem key={e.id} value={e.id.toString()}>{e.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarEdicion}
              className="bg-orange-600 hover:bg-orange-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmación de Eliminación de Grupo */}
      <Dialog open={showDeleteGrupoModal} onOpenChange={setShowDeleteGrupoModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <motion.div
                animate={{ rotate: eliminandoGrupo ? 360 : 0 }}
                transition={{ duration: 2, repeat: eliminandoGrupo ? Infinity : 0, ease: "linear" }}
              >
                <Trash2 className="w-6 h-6" />
              </motion.div>
              {eliminandoGrupo ? 'Eliminando Grupo...' : '¿Eliminar Grupo Completo?'}
            </DialogTitle>
          </DialogHeader>

          {grupoAEliminar && (
            <div className="space-y-6 py-4">
              {!eliminandoGrupo ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Advertencia */}
                  <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-100 rounded-full p-2 mt-0.5">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-red-900 mb-2">Esta acción no se puede deshacer</h4>
                        <p className="text-red-700 text-sm">
                          Se eliminarán <strong>{grupoAEliminar.horarios.length} clases</strong> del grupo <strong>{grupoAEliminar.grupo}</strong>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Información del Grupo */}
                  <Card className="border-slate-200">
                    <CardContent className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Programa</p>
                          <p className="text-slate-900">{grupoAEliminar.horarios[0]?.programa_nombre}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Semestre</p>
                          <Badge className="bg-slate-600">{grupoAEliminar.semestre}</Badge>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-500 text-xs mb-1">Grupo</p>
                        <Badge className="bg-red-600 text-lg px-3 py-1">{grupoAEliminar.grupo}</Badge>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Lista de Asignaturas */}
                  <div className="max-h-48 overflow-y-auto bg-slate-50 rounded-lg border border-slate-200 p-3">
                    <p className="text-slate-600 text-xs mb-2">Asignaturas a eliminar:</p>
                    <div className="space-y-1">
                      {grupoAEliminar.horarios.map((horario, idx) => (
                        <motion.div
                          key={horario.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-2 text-sm text-slate-700 bg-white rounded px-2 py-1"
                        >
                          <CheckCircle2 className="w-3 h-3 text-slate-400" />
                          <span>{horario.asignatura_nombre}</span>
                          <span className="text-slate-400 text-xs ml-auto">
                            {horario.dia_semana.charAt(0).toUpperCase() + horario.dia_semana.slice(1)} {horario.hora_inicio}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-6"
                >
                  {/* Animación de Progreso */}
                  <div className="flex flex-col items-center justify-center py-8">
                    <motion.div
                      animate={{
                        scale: [1, 1.1, 1],
                        rotate: [0, 180, 360]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="mb-6"
                    >
                      <Trash2 className="w-16 h-16 text-red-600" />
                    </motion.div>

                    <h3 className="text-slate-900 mb-2">Eliminando clases...</h3>
                    <p className="text-slate-500 text-sm mb-4">
                      Por favor espera mientras se eliminan las {grupoAEliminar.horarios.length} clases
                    </p>

                    {/* Barra de Progreso */}
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progresoEliminacion}%` }}
                        transition={{ duration: 0.3 }}
                        className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-end"
                      >
                        <motion.div
                          animate={{ opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
                        />
                      </motion.div>
                    </div>

                    {/* Porcentaje */}
                    <motion.p
                      key={progresoEliminacion}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-2xl mt-4 text-red-600"
                    >
                      {progresoEliminacion}%
                    </motion.p>

                    {/* Clases Eliminadas */}
                    <p className="text-slate-500 text-sm mt-2">
                      {Math.round((progresoEliminacion / 100) * grupoAEliminar.horarios.length)} de {grupoAEliminar.horarios.length} clases eliminadas
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {!eliminandoGrupo && (
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteGrupoModal(false);
                  setGrupoAEliminar(null);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEliminarGrupoCompleto}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Sí, Eliminar Grupo
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
