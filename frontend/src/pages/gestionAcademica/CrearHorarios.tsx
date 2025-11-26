import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { useState, useEffect } from 'react';
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
  Plus,
  ArrowLeft,
  Eraser,
  AlertCircle,
  CheckCircle2,
  BookOpen,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from '../../share/sonner';
import { db } from '../../hooks/database';
import type { Facultad, Programa, EspacioFisico, Grupo, Asignatura, Docente, HorarioAcademico } from '../../models/academica';
import { showNotification } from '../../context/ThemeContext';

interface GrupoSinHorario {
  id: string;
  nombre: string;
  programaId: string;
  programaNombre: string;
  semestre: number;
  facultadId: string;
}

interface HorarioDia {
  dia: string;
  horaInicio: string;
  horaFin: string;
}

interface NuevoHorario {
  asignaturaId: string;
  docenteId: string;
  espacioId: string;
  horarios: HorarioDia[];
}

interface CrearHorariosProps {
  onHorarioCreado?: () => void;
}

export default function CrearHorarios({ onHorarioCreado }: CrearHorariosProps = {}) {
  // Estados principales
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [docentes, setDocentes] = useState<Docente[]>([]);
  
  // Filtros
  const [filtroFacultad, setFiltroFacultad] = useState<string>('all');
  const [filtroPrograma, setFiltroPrograma] = useState<string>('all');
  const [filtroSemestre, setFiltroSemestre] = useState<string>('all');
  const [filtroGrupo, setFiltroGrupo] = useState<string>('all');
  
  // Estados de la UI
  const [vistaActual, setVistaActual] = useState<'lista' | 'asignar'>('lista');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<GrupoSinHorario | null>(null);
  const [horariosAsignados, setHorariosAsignados] = useState<HorarioAcademico[]>([]);
  
  // Modal de asignar asignatura
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [asignaturaSeleccionada, setAsignaturaSeleccionada] = useState<string>('');
  const [docenteSeleccionado, setDocenteSeleccionado] = useState<string>('');
  const [espacioSeleccionado, setEspacioSeleccionado] = useState<string>('');
  const [diasSeleccionados, setDiasSeleccionados] = useState<string[]>([]);
  const [horasPorDia, setHorasPorDia] = useState<{ [key: string]: { inicio: string; fin: string } }>({});

  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const semestres = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setFacultades(db.getFacultades());
    setProgramas(db.getProgramas());
    setGrupos(db.getGrupos());
    setEspacios(db.getEspacios());
    setAsignaturas(db.getAsignaturas());
    setDocentes(db.getDocentes());
  };

  // Obtener grupos sin horario
  const obtenerGruposSinHorario = (): GrupoSinHorario[] => {
    const todosLosHorarios = db.getHorarios();
    const gruposConHorario = new Set(todosLosHorarios.map(h => (h as any).grupoId));
    
    return grupos
      .filter(grupo => !gruposConHorario.has(grupo.id))
      .map(grupo => {
        const programa = programas.find(p => p.id === grupo.programaId);
        const facultad = facultades.find(f => f.id === programa?.facultadId);
        return {
          id: grupo.id,
          nombre: grupo.nombre,
          programaId: grupo.programaId,
          programaNombre: programa?.nombre || 'N/A',
          semestre: grupo.semestre,
          facultadId: programa?.facultadId || ''
        };
      });
  };

  // Filtrar grupos sin horario
  const gruposSinHorarioFiltrados = obtenerGruposSinHorario().filter(grupo => {
    const matchFacultad = filtroFacultad === 'all' || grupo.facultadId === filtroFacultad;
    const matchPrograma = filtroPrograma === 'all' || grupo.programaId === filtroPrograma;
    const matchSemestre = filtroSemestre === 'all' || (grupo.semestre && grupo.semestre.toString() === filtroSemestre);
    const matchGrupo = filtroGrupo === 'all' || (grupo.nombre && grupo.nombre.toLowerCase().includes(filtroGrupo.toLowerCase()));
    
    return matchFacultad && matchPrograma && matchSemestre && matchGrupo;
  });

  const programasFiltrados = programas.filter(p => 
    filtroFacultad === 'all' || p.facultadId === filtroFacultad
  );

  const limpiarFiltros = () => {
    setFiltroFacultad('all');
    setFiltroPrograma('all');
    setFiltroSemestre('all');
    setFiltroGrupo('all');
  };

  const handleAsignarHorario = (grupo: GrupoSinHorario) => {
    setGrupoSeleccionado(grupo);
    setHorariosAsignados([]);
    setVistaActual('asignar');
  };

  const handleVolverALista = () => {
    setVistaActual('lista');
    setGrupoSeleccionado(null);
    setHorariosAsignados([]);
  };

  const handleAbrirModalAsignar = () => {
    setShowModalAsignar(true);
    setAsignaturaSeleccionada('');
    setDocenteSeleccionado('');
    setEspacioSeleccionado('');
    setDiasSeleccionados([]);
    setHorasPorDia({});
  };

  const handleToggleDia = (dia: string) => {
    if (diasSeleccionados.includes(dia)) {
      setDiasSeleccionados(diasSeleccionados.filter(d => d !== dia));
      const newHoras = { ...horasPorDia };
      delete newHoras[dia];
      setHorasPorDia(newHoras);
    } else {
      setDiasSeleccionados([...diasSeleccionados, dia]);
      setHorasPorDia({ ...horasPorDia, [dia]: { inicio: '07:00', fin: '09:00' } });
    }
  };

  const handleHoraChange = (dia: string, tipo: 'inicio' | 'fin', valor: string) => {
    setHorasPorDia({
      ...horasPorDia,
      [dia]: {
        ...horasPorDia[dia],
        [tipo]: valor
      }
    });
  };

  // Validar conflictos
  const validarConflictos = (): { valido: boolean; mensaje: string } => {
    if (!asignaturaSeleccionada || !docenteSeleccionado || !espacioSeleccionado) {
      return { valido: false, mensaje: 'Todos los campos son obligatorios' };
    }

    if (diasSeleccionados.length === 0) {
      return { valido: false, mensaje: 'Debe seleccionar al menos un día' };
    }

    // Validar que todas las horas estén completas
    for (const dia of diasSeleccionados) {
      const horas = horasPorDia[dia];
      if (!horas || !horas.inicio || !horas.fin) {
        return { valido: false, mensaje: `Debe completar los horarios para ${dia}` };
      }
      if (horas.inicio >= horas.fin) {
        return { valido: false, mensaje: `La hora de fin debe ser mayor que la hora de inicio en ${dia}` };
      }
    }

    // Validar conflictos de docente
    const todosLosHorarios = db.getHorarios();
    for (const dia of diasSeleccionados) {
      const horas = horasPorDia[dia];
      const conflictoDocente = todosLosHorarios.find(h => 
        (h as any).docenteId === docenteSeleccionado &&
        h.diaSemana === dia &&
        ((horas.inicio >= h.horaInicio && horas.inicio < h.horaFin) ||
         (horas.fin > h.horaInicio && horas.fin <= h.horaFin) ||
         (horas.inicio <= h.horaInicio && horas.fin >= h.horaFin))
      );
      
      if (conflictoDocente) {
        const docente = docentes.find(d => d.id === docenteSeleccionado);
        return { 
          valido: false, 
          mensaje: `El docente ${docente?.nombre || ''} ya tiene una clase el ${dia} de ${conflictoDocente.horaInicio} a ${conflictoDocente.horaFin}` 
        };
      }

      // Validar conflictos de espacio
      const conflictoEspacio = todosLosHorarios.find(h => 
        h.espacioId === espacioSeleccionado &&
        h.diaSemana === dia &&
        ((horas.inicio >= h.horaInicio && horas.inicio < h.horaFin) ||
         (horas.fin > h.horaInicio && horas.fin <= h.horaFin) ||
         (horas.inicio <= h.horaInicio && horas.fin >= h.horaFin))
      );
      
      if (conflictoEspacio) {
        const espacio = espacios.find(e => e.id === espacioSeleccionado);
        return { 
          valido: false, 
          mensaje: `El espacio ${espacio?.nombre || ''} ya está ocupado el ${dia} de ${conflictoEspacio.horaInicio} a ${conflictoEspacio.horaFin}` 
        };
      }
    }

    return { valido: true, mensaje: '' };
  };

  const handleGuardarAsignacion = () => {
    const validacion = validarConflictos();
    
    if (!validacion.valido) {
      showNotification({ message: validacion.mensaje, type: 'error' });
      return;
    }

    if (!grupoSeleccionado) return;

    const asignatura = asignaturas.find(a => a.id === asignaturaSeleccionada);
    const docente = docentes.find(d => d.id === docenteSeleccionado);
    const espacio = espacios.find(e => e.id === espacioSeleccionado);

    // Crear un horario por cada día seleccionado
    const nuevosHorarios: any[] = diasSeleccionados.map(dia => {
      const horas = horasPorDia[dia];
      return {
        id: `horario-${Date.now()}-${Math.random()}`,
        asignaturaId: asignaturaSeleccionada,
        docenteId: docenteSeleccionado,
        espacioId: espacioSeleccionado,
        diaSemana: dia.toLowerCase(),
        horaInicio: horas.inicio,
        horaFin: horas.fin,
        grupoId: grupoSeleccionado.id,
        periodoId: db.getPeriodoActivo()?.id || 'periodo-1',
        activo: true,
        fechaCreacion: new Date().toISOString(),
        // Campos extendidos para visualización
        asignatura: asignatura?.nombre || '',
        docente: docente?.nombre || '',
        grupo: grupoSeleccionado.nombre,
        programaId: grupoSeleccionado.programaId,
        semestre: grupoSeleccionado.semestre
      };
    });

    // Guardar en la base de datos
    nuevosHorarios.forEach(horario => {
      db.createHorario(horario);
    });

    // Actualizar vista local
    setHorariosAsignados([...horariosAsignados, ...nuevosHorarios]);
    
    showNotification({ message: `Asignatura ${asignatura?.nombre || ''} asignada correctamente`, type: 'success' });
    setShowModalAsignar(false);

    // Llamar a la función de callback si está definida
    if (onHorarioCreado) {
      onHorarioCreado();
    }
  };

  const handleEliminarHorarioAsignado = (horarioId: string) => {
    if (confirm('¿Está seguro de eliminar esta asignación?')) {
      const success = db.deleteHorario(horarioId);
      if (success) {
        setHorariosAsignados(horariosAsignados.filter(h => h.id !== horarioId));
        showNotification({ message: 'Asignación eliminada correctamente', type: 'success' });
      }
    }
  };

  // Generar horario visual tipo grid
  const generarHoras = () => {
    const horas = [];
    for (let h = 6; h <= 21; h++) {
      horas.push(`${h.toString().padStart(2, '0')}:00`);
    }
    return horas;
  };

  const obtenerClaseEnHora = (dia: string, hora: string) => {
    return horariosAsignados.find(h => {
      const diaMatch = h.diaSemana.toLowerCase() === dia.toLowerCase();
      const horaActual = parseInt(hora.split(':')[0]);
      const horaInicio = parseInt(h.horaInicio.split(':')[0]);
      const horaFin = parseInt(h.horaFin.split(':')[0]);
      return diaMatch && horaActual >= horaInicio && horaActual < horaFin;
    });
  };

  const horas = generarHoras();

  // VISTA LISTA DE GRUPOS SIN HORARIO
  if (vistaActual === 'lista') {
    return (
      <div className="p-6 space-y-6">
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-slate-900">Crear Horarios</h2>
          <p className="text-slate-600 mt-1">Crear y gestionar horarios académicos por grupo</p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-yellow-50 border-b border-slate-200">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <Filter className="w-5 h-5 text-red-600" />
                Filtros de Búsqueda
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label>Facultad</Label>
                  <Select value={filtroFacultad} onValueChange={setFiltroFacultad}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas las facultades</SelectItem>
                      {facultades.map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Programa</Label>
                  <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los programas</SelectItem>
                      {programasFiltrados.map(p => (
                        <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Semestre</Label>
                  <Select value={filtroSemestre} onValueChange={setFiltroSemestre}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los semestres</SelectItem>
                      {semestres.map(s => (
                        <SelectItem key={s} value={s.toString()}>Semestre {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Grupo</Label>
                  <Input
                    placeholder="Buscar grupo..."
                    value={filtroGrupo === 'all' ? '' : filtroGrupo}
                    onChange={(e) => setFiltroGrupo(e.target.value || 'all')}
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={limpiarFiltros}
                  className="flex items-center gap-2"
                >
                  <Eraser className="w-4 h-4" />
                  Limpiar Filtros
                </Button>
                <Button
                  onClick={() => loadData()}
                  className="flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  <Search className="w-4 h-4" />
                  Buscar / Actualizar
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabla de grupos sin horarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
              <CardTitle className="flex items-center justify-between text-slate-900">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-red-600" />
                  Grupos sin horarios creados ({gruposSinHorarioFiltrados.length})
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-slate-700">Programa</th>
                      <th className="text-left px-6 py-4 text-slate-700">Grupo</th>
                      <th className="text-left px-6 py-4 text-slate-700">Semestre</th>
                      <th className="text-center px-6 py-4 text-slate-700">Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gruposSinHorarioFiltrados.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center py-12 text-slate-500">
                          <AlertCircle className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                          <p>No hay grupos sin horarios con los filtros seleccionados</p>
                        </td>
                      </tr>
                    ) : (
                      gruposSinHorarioFiltrados.map((grupo, index) => (
                        <motion.tr
                          key={grupo.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-slate-900">{grupo.programaNombre}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {grupo.nombre}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-slate-600">Semestre {grupo.semestre}</td>
                          <td className="px-6 py-4 text-center">
                            <Button
                              onClick={() => handleAsignarHorario(grupo)}
                              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Asignar Horario
                            </Button>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // VISTA DE ASIGNACIÓN DE HORARIOS
  return (
    <div className="h-full flex flex-col">
      {/* Header fijo - NO scrolleable */}
      <div className="bg-white border-b border-slate-200 shadow-sm p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900">Horario del Grupo — {grupoSeleccionado?.nombre}</h2>
            <p className="text-slate-600 mt-1">
              {grupoSeleccionado?.programaNombre} • Semestre {grupoSeleccionado?.semestre}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAbrirModalAsignar}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Asignar Asignatura
            </Button>
            <Button
              variant="outline"
              onClick={handleVolverALista}
              className="border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-6">
        {horariosAsignados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Calendar className="w-20 h-20 text-slate-300 mb-4" />
            <h3 className="text-slate-700 mb-2">No hay asignaturas asignadas</h3>
            <p className="text-slate-500 mb-6">Comienza asignando la primera asignatura a este grupo</p>
            <Button
              onClick={handleAbrirModalAsignar}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Asignar Primera Asignatura
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Grid semanal */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-slate-900">Vista Semanal</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="border border-slate-200 bg-slate-50 p-2 w-20 sticky left-0 z-10">Hora</th>
                        {diasSemana.map(dia => (
                          <th key={dia} className="border border-slate-200 bg-slate-50 p-2 text-slate-700">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {horas.map(hora => (
                        <tr key={hora}>
                          <td className="border border-slate-200 bg-slate-50 p-2 text-slate-600 text-center sticky left-0 z-10">
                            {hora}
                          </td>
                          {diasSemana.map(dia => {
                            const clase = obtenerClaseEnHora(dia, hora);
                            return (
                              <td key={`${dia}-${hora}`} className="border border-slate-200 p-1 h-16 align-top">
                                {clase && parseInt(hora.split(':')[0]) === parseInt(clase.horaInicio.split(':')[0]) && (
                                        <motion.div
                                          initial={{ opacity: 0, scale: 0.9 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          className="bg-gradient-to-br from-red-100 to-yellow-50 border-l-4 border-red-600 rounded p-2 text-xs h-full relative group"
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1 min-w-0">
                                              {(() => {
                                                const horarioAny = clase as any;
                                                const asignaturaNombre = asignaturas.find(a => a.id === horarioAny.asignaturaId)?.nombre || horarioAny.asignatura || '';
                                                const docenteNombre = docentes.find(d => d.id === horarioAny.docenteId)?.nombre || horarioAny.docente || '';
                                                return (
                                                  <>
                                                    <p className="text-slate-900 truncate">{asignaturaNombre}</p>
                                                    <p className="text-slate-600 text-xs truncate mt-1">
                                                      <User className="w-3 h-3 inline mr-1" />
                                                      {docenteNombre}
                                                    </p>
                                                    <p className="text-slate-500 text-xs truncate">
                                                      <Clock className="w-3 h-3 inline mr-1" />
                                                      {clase.horaInicio} - {clase.horaFin}
                                                    </p>
                                                  </>
                                                );
                                              })()}
                                            </div>
                                            <button
                                              onClick={() => handleEliminarHorarioAsignado(clase.id)}
                                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-red-600 hover:text-red-800"
                                            >
                                              <X className="w-4 h-4" />
                                            </button>
                                          </div>
                                        </motion.div>
                                      )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Lista de asignaturas */}
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100">
                <CardTitle className="text-slate-900">Asignaturas Asignadas ({horariosAsignados.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {horariosAsignados.map((horario, index) => {
                    const asignatura = asignaturas.find(a => a.id === horario.asignaturaId) || ("asignatura" in horario ? asignaturas.find(a => a.nombre === (horario as any).asignatura) : undefined);
                    const docente = docentes.find(d => d.id === horario.docenteId) || ("docente" in horario ? docentes.find(d => d.nombre === (horario as any).docente) : undefined);
                    const espacio = espacios.find(e => e.id === horario.espacioId);
                    return (
                      <motion.div
                        key={horario.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex-1 grid grid-cols-5 gap-4">
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Asignatura</p>
                            <p className="text-slate-900">{asignatura?.nombre || ((horario as any).asignatura || '')}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Docente</p>
                            <p className="text-slate-700">{docente?.nombre || ((horario as any).docente || '')}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Espacio</p>
                            <p className="text-slate-700">{espacio?.nombre}</p>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Día</p>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {horario.diaSemana}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Horario</p>
                            <p className="text-slate-700">{horario.horaInicio} - {horario.horaFin}</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEliminarHorarioAsignado(horario.id)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Modal de Asignar Asignatura */}
      <Dialog open={showModalAsignar} onOpenChange={setShowModalAsignar}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <BookOpen className="w-5 h-5 text-red-600" />
              Asignar Asignatura al Grupo {grupoSeleccionado?.nombre}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Información del grupo */}
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-600">Programa:</span>
                  <span className="text-slate-900 ml-2">{grupoSeleccionado?.programaNombre}</span>
                </div>
                <div>
                  <span className="text-slate-600">Semestre:</span>
                  <span className="text-slate-900 ml-2">{grupoSeleccionado?.semestre}</span>
                </div>
              </div>
            </div>

            {/* Campos del formulario */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label>
                  Asignatura <span className="text-red-600">*</span>
                </Label>
                <Select value={asignaturaSeleccionada} onValueChange={setAsignaturaSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturas
                      .filter(a => a.programaId === grupoSeleccionado?.programaId && a.semestre === grupoSeleccionado?.semestre)
                      .map(a => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.nombre} ({a.creditos} créditos)
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>
                  Docente <span className="text-red-600">*</span>
                </Label>
                <Select value={docenteSeleccionado} onValueChange={setDocenteSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar docente" />
                  </SelectTrigger>
                  <SelectContent>
                    {docentes.map(d => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="col-span-2">
                <Label>
                  Espacio Físico <span className="text-red-600">*</span>
                </Label>
                <Select value={espacioSeleccionado} onValueChange={setEspacioSeleccionado}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar espacio" />
                  </SelectTrigger>
                  <SelectContent>
                    {espacios.map(e => (
                      <SelectItem key={e.id} value={e.id}>
                        {e.nombre} - Capacidad: {e.capacidad}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selección de días */}
            <div>
              <Label className="mb-3 block">
                Días de Clase <span className="text-red-600">*</span>
              </Label>
              <div className="grid grid-cols-3 gap-3">
                {diasSemana.map(dia => (
                  <label
                    key={dia}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      diasSeleccionados.includes(dia)
                        ? 'border-red-600 bg-red-50'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={diasSeleccionados.includes(dia)}
                      onChange={() => handleToggleDia(dia)}
                      className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                    />
                    <span className="text-slate-900">{dia}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Horarios por día */}
            {diasSeleccionados.length > 0 && (
              <div className="space-y-4">
                <Label>Horarios por Día</Label>
                {diasSeleccionados.map(dia => (
                  <div key={dia} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                    <p className="text-slate-900 mb-3">{dia}</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs">Hora de Inicio</Label>
                        <Input
                          type="time"
                          value={horasPorDia[dia]?.inicio || ''}
                          onChange={(e) => handleHoraChange(dia, 'inicio', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Hora de Fin</Label>
                        <Input
                          type="time"
                          value={horasPorDia[dia]?.fin || ''}
                          onChange={(e) => handleHoraChange(dia, 'fin', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Mensaje de ayuda */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="mb-1">
                  El sistema validará automáticamente conflictos de horario con:
                </p>
                <ul className="list-disc list-inside space-y-1 text-blue-700">
                  <li>Disponibilidad del docente</li>
                  <li>Disponibilidad del espacio físico</li>
                  <li>Horarios del mismo grupo</li>
                </ul>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowModalAsignar(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleGuardarAsignacion}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Guardar Asignación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}