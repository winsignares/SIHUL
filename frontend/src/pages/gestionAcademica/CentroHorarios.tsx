import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../share/tabs';
import { Checkbox } from '../../share/checkbox';
import { useState, useEffect, Fragment } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  User,
  MapPin,
  Edit,
  Trash2,
  Eye,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Eraser,
  ChevronDown,
  List,
  Plus
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from '../../share/sonner';
import { db } from '../../hooks/database';
import type { HorarioAcademico, Facultad, Programa, EspacioFisico, Grupo } from '../../models/academica';
import CrearHorarios from './CrearHorarios';
import { showNotification } from '../../context/ThemeContext';

interface HorarioExtendido extends HorarioAcademico {
  asignatura: string;
  docente: string;
  grupo: string;
  programaId: string;
  semestre: number;
}

// Interface para grupos agrupados
interface GrupoAgrupado {
  programaId: string;
  grupo: string;
  semestre: number;
  horarios: HorarioExtendido[];
}

export default function CentroHorarios() {
  const [searchParams] = useSearchParams();
  const modeParam = searchParams.get('mode');
  const initialMode = modeParam === 'crear' ? 'crear' : (modeParam === 'modificacion' ? 'modificacion' : 'consulta');
  const [activeTab, setActiveTab] = useState<'consulta' | 'crear' | 'modificacion'>(initialMode);
  const [horarios, setHorarios] = useState<HorarioAcademico[]>([]);
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
  
  // Filtros
  const [filtroFacultad, setFiltroFacultad] = useState<string>('all');
  const [filtroPrograma, setFiltroPrograma] = useState<string>('all');
  const [filtroGrupo, setFiltroGrupo] = useState<string>('all');
  const [filtroSemestre, setFiltroSemestre] = useState<string>('all');
  
  // Modal de edición
  const [showEditModal, setShowEditModal] = useState(false);
  const [horarioEditar, setHorarioEditar] = useState<HorarioAcademico | null>(null);
  
  // Modal de detalles - ahora maneja un grupo completo
  const [showDetallesModal, setShowDetallesModal] = useState(false);
  const [grupoDetalles, setGrupoDetalles] = useState<GrupoAgrupado | null>(null);
  
  // Estados para selección múltiple
  const [horariosSeleccionados, setHorariosSeleccionados] = useState<Set<string>>(new Set());
  const [seleccionarTodos, setSeleccionarTodos] = useState(false);
  
  // Estado para acordeón de grupos expandidos
  const [gruposExpandidos, setGruposExpandidos] = useState<Set<string>>(new Set());

  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  useEffect(() => {
    loadData();
  }, []);

  // Si cambian los query params, sincronizar la pestaña activa
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'crear' || mode === 'modificacion' || mode === 'consulta') {
      setActiveTab(mode as any);
    } else {
      setActiveTab('consulta');
    }
  }, [searchParams]);

  const loadData = () => {
    setHorarios(db.getHorariosExtendidos());
    setFacultades(db.getFacultades());
    setProgramas(db.getProgramas());
    setEspacios(db.getEspacios());
  };

  // Generar horas para el grid semanal
  const generarHoras = () => {
    const horas = [];
    for (let h = 6; h <= 21; h++) {
      horas.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return horas;
  };

  // Obtener clase en una hora específica
  const obtenerClaseEnHora = (dia: string, hora: string, horariosGrupo: HorarioExtendido[]) => {
    return horariosGrupo.find(h => {
      const diaMatch = h.diaSemana.toLowerCase() === dia.toLowerCase();
      
      // Convertir horas a números para comparación
      const horaActual = parseInt(hora.split(':')[0]);
      const horaInicio = parseInt(h.horaInicio.split(':')[0]);
      const horaFin = parseInt(h.horaFin.split(':')[0]);
      
      // Verificar si la hora actual está dentro del rango de la clase
      return diaMatch && horaActual >= horaInicio && horaActual < horaFin;
    });
  };

  // Agrupar horarios por programa + grupo + semestre
  const agruparHorarios = (horariosArray: HorarioAcademico[]): GrupoAgrupado[] => {
    const grupos = new Map<string, GrupoAgrupado>();
    
    horariosArray.forEach(horario => {
      const h = horario as HorarioExtendido;
      const key = `${h.programaId}-${h.grupo}-${h.semestre}`;
      
      if (!grupos.has(key)) {
        grupos.set(key, {
          programaId: h.programaId,
          grupo: h.grupo,
          semestre: h.semestre,
          horarios: []
        });
      }
      
      grupos.get(key)!.horarios.push(h);
    });
    
    return Array.from(grupos.values());
  };

  // Filtrar horarios
  const horariosFiltrados = horarios.filter(horario => {
    const h = horario as HorarioExtendido;
    const programa = programas.find(p => p.id === h.programaId);
    
    const matchFacultad = filtroFacultad === 'all' || programa?.facultadId === filtroFacultad;
    const matchPrograma = filtroPrograma === 'all' || h.programaId === filtroPrograma;
    const matchGrupo = filtroGrupo === 'all' || h.grupo === filtroGrupo;
    const matchSemestre = filtroSemestre === 'all' || h.semestre?.toString() === filtroSemestre;

    return matchFacultad && matchPrograma && matchGrupo && matchSemestre;
  });

  // Obtener grupos agrupados después de filtrar
  const gruposAgrupados = agruparHorarios(horariosFiltrados);

  // Obtener listas únicas para filtros
  const gruposUnicos = [...new Set(horarios.map(h => (h as any).grupo).filter(Boolean))].sort();
  const semestresUnicos = [...new Set(horarios.map(h => (h as any).semestre).filter(Boolean))].sort((a, b) => a - b);
  const programasFiltrados = programas.filter(p => 
    filtroFacultad === 'all' || p.facultadId === filtroFacultad
  );

  // Handlers
  const handleVerDetalles = (grupo: GrupoAgrupado) => {
    setGrupoDetalles(grupo);
    setShowDetallesModal(true);
  };

  const handleEditar = (horario: HorarioAcademico) => {
    setHorarioEditar({ ...horario });
    setShowEditModal(true);
  };

  const handleGuardarEdicion = () => {
    if (!horarioEditar) return;

    const success = db.updateHorario(horarioEditar.id, horarioEditar);
    if (success) {
      showNotification({ message: 'Horario actualizado correctamente', type: 'success' });
      loadData();
      setShowEditModal(false);
      setHorarioEditar(null);
    } else {
      showNotification({ message: 'Error al actualizar el horario', type: 'error' });
    }
  };

  const handleEliminar = (id: string) => {
    if (confirm('¿Está seguro de eliminar este horario?')) {
      const success = db.deleteHorario(id);
      if (success) {
        showNotification({ message: 'Horario eliminado correctamente', type: 'success' });
        loadData();
      } else {
        showNotification({ message: 'Error al eliminar el horario', type: 'error' });
      }
    }
  };

  const limpiarFiltros = () => {
    setFiltroFacultad('all');
    setFiltroPrograma('all');
    setFiltroGrupo('all');
    setFiltroSemestre('all');
  };

  // Funciones para selección múltiple
  const toggleSeleccion = (id: string) => {
    const nuevaSeleccion = new Set(horariosSeleccionados);
    if (nuevaSeleccion.has(id)) {
      nuevaSeleccion.delete(id);
    } else {
      nuevaSeleccion.add(id);
    }
    setHorariosSeleccionados(nuevaSeleccion);
  };

  const toggleSeleccionarTodos = () => {
    if (seleccionarTodos) {
      setHorariosSeleccionados(new Set());
      setSeleccionarTodos(false);
    } else {
      const todosLosIds = new Set(horariosFiltrados.map(h => h.id));
      setHorariosSeleccionados(todosLosIds);
      setSeleccionarTodos(true);
    }
  };

  const eliminarSeleccionados = () => {
    if (horariosSeleccionados.size === 0) {
      showNotification({ message: 'No hay horarios seleccionados', type: 'error' });
      return;
    }

    if (confirm(`¿Está seguro de eliminar ${horariosSeleccionados.size} horario(s)?`)) {
      let eliminados = 0;
      horariosSeleccionados.forEach(id => {
        const success = db.deleteHorario(id);
        if (success) eliminados++;
      });

      if (eliminados > 0) {
        showNotification({ message: `${eliminados} horario(s) eliminado(s) correctamente`, type: 'success' });
        loadData();
        setHorariosSeleccionados(new Set());
        setSeleccionarTodos(false);
      } else {
        showNotification({ message: 'Error al eliminar los horarios', type: 'error' });
      }
    }
  };

  const getNombrePrograma = (programaId: string) => {
    const programa = programas.find(p => p.id === programaId);
    return programa?.nombre || 'N/A';
  };

  const getNombreEspacio = (espacioId: string) => {
    const espacio = espacios.find(e => e.id === espacioId);
    return espacio?.nombre || 'N/A';
  };

  // Toggle para expandir/colapsar grupos en Modificación
  const toggleGrupoExpandido = (grupoKey: string) => {
    const nuevosExpandidos = new Set(gruposExpandidos);
    if (nuevosExpandidos.has(grupoKey)) {
      nuevosExpandidos.delete(grupoKey);
    } else {
      nuevosExpandidos.add(grupoKey);
    }
    setGruposExpandidos(nuevosExpandidos);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 mb-2">Centro de Horarios</h1>
        <p className="text-slate-600">Consulta, modifica y elimina horarios académicos</p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
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
                  <Select value={filtroFacultad} onValueChange={setFiltroFacultad}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {facultades.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
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
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
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
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Grupos Encontrados ({gruposAgrupados.length})
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
                        <th className="px-4 py-3 text-center text-slate-700">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gruposAgrupados.map((grupo, index) => (
                        <tr key={`${grupo.programaId}-${grupo.grupo}-${grupo.semestre}`} className="border-t border-slate-200 hover:bg-slate-50">
                          <td className="px-4 py-3 text-slate-900">{getNombrePrograma(grupo.programaId)}</td>
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
                  <Select value={filtroFacultad} onValueChange={setFiltroFacultad}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas</SelectItem>
                      {facultades.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
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
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
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
                              <td className="px-4 py-3 text-slate-900">{getNombrePrograma(grupo.programaId)}</td>
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
                                    onClick={() => {
                                      if (confirm(`¿Está seguro de eliminar todo el horario del grupo ${grupo.grupo}? Se eliminarán ${grupo.horarios.length} clases.`)) {
                                        let eliminados = 0;
                                        grupo.horarios.forEach(horario => {
                                          const success = db.deleteHorario(horario.id);
                                          if (success) eliminados++;
                                        });
                                        if (eliminados > 0) {
                                          showNotification({ message: `Grupo ${grupo.grupo} eliminado correctamente (${eliminados} clases)`, type: 'success' });
                                          loadData();
                                        } else {
                                          showNotification({ message: 'Error al eliminar el grupo', type: 'error' });
                                        }
                                      }
                                    }}
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
                                                  <td className="px-3 py-2 text-slate-900">{horario.asignatura}</td>
                                                  <td className="px-3 py-2 text-slate-700">{horario.docente}</td>
                                                  <td className="px-3 py-2 text-center">
                                                    <Badge variant="outline" className="border-slate-600 text-slate-700 text-xs">
                                                      {horario.diaSemana.charAt(0).toUpperCase() + horario.diaSemana.slice(1)}
                                                    </Badge>
                                                  </td>
                                                  <td className="px-3 py-2 text-center text-slate-700 text-sm">
                                                    {horario.horaInicio} - {horario.horaFin}
                                                  </td>
                                                  <td className="px-3 py-2 text-center text-slate-700 text-sm">
                                                    {getNombreEspacio(horario.espacioId)}
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
                      <p className="text-slate-900">{getNombrePrograma(grupoDetalles.programaId)}</p>
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
                        <th className="border-2 border-slate-300 p-4 text-white w-24">
                          <Clock className="w-5 h-5 mx-auto mb-1" />
                          Hora
                        </th>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia) => (
                          <th key={dia} className="border-2 border-slate-300 p-4 text-white">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {generarHoras().map((hora) => (
                        <tr key={hora} className="hover:bg-slate-50 transition-colors">
                          <td className="border-2 border-slate-300 p-3 bg-slate-100 text-center text-slate-700">
                            {hora}
                          </td>
                          {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => {
                            const clase = obtenerClaseEnHora(dia, hora, grupoDetalles.horarios);
                            return (
                              <td
                                key={dia}
                                className={`border-2 border-slate-300 p-2 transition-all ${
                                  clase
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
                                        <p className="text-sm mb-1">{clase.asignatura}</p>
                                        <p className="text-xs text-yellow-200">{clase.docente}</p>
                                      </div>
                                      <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                        <MapPin className="w-4 h-4 text-yellow-300" />
                                        <span className="text-sm">{getNombreEspacio(clase.espacioId)}</span>
                                      </div>
                                      <div className="text-xs text-yellow-100 mt-1">
                                        {clase.horaInicio} - {clase.horaFin}
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
                      ))}
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
                    value={(horarioEditar as any).asignatura || ''}
                    onChange={(e) => setHorarioEditar({ ...horarioEditar, asignatura: e.target.value } as any)}
                  />
                </div>
                <div>
                  <Label>Grupo</Label>
                  <Input
                    value={(horarioEditar as any).grupo || ''}
                    onChange={(e) => setHorarioEditar({ ...horarioEditar, grupo: e.target.value } as any)}
                  />
                </div>
                <div>
                  <Label>Docente</Label>
                  <Input
                    value={(horarioEditar as any).docente || ''}
                    onChange={(e) => setHorarioEditar({ ...horarioEditar, docente: e.target.value } as any)}
                  />
                </div>
                <div>
                  <Label>Día</Label>
                  <Select 
                    value={horarioEditar.diaSemana} 
                    onValueChange={(v) => setHorarioEditar({ ...horarioEditar, diaSemana: v as any })}
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
                    value={horarioEditar.horaInicio}
                    onChange={(e) => setHorarioEditar({ ...horarioEditar, horaInicio: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Hora Fin</Label>
                  <Input
                    type="time"
                    value={horarioEditar.horaFin}
                    onChange={(e) => setHorarioEditar({ ...horarioEditar, horaFin: e.target.value })}
                  />
                </div>
                <div className="col-span-2">
                  <Label>Espacio</Label>
                  <Select 
                    value={horarioEditar.espacioId} 
                    onValueChange={(v) => setHorarioEditar({ ...horarioEditar, espacioId: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {espacios.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.nombre} - {e.codigo}</SelectItem>
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
    </div>
  );
}