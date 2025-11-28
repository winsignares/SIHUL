import React, { useState, useEffect } from 'react';
import { Button } from '../share/button';
import { Input } from '../share/input';
import { Label } from '../share/label';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { Badge } from '../share/badge';
import { Checkbox } from '../share/checkbox';
import { Plus, Search, Clock, AlertCircle, Edit, Trash2, CheckCircle, X, Check, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'motion/react';
import { useFacultades } from '../hooks/useFacultades';
import { useProgramas } from '../hooks/useProgramas';
import { useAsignaturas } from '../hooks/useAsignaturas';
import { useEspacios } from '../hooks/useEspacios';
import { useHorarios } from '../hooks/useHorarios';
import type { Facultad } from '../models/facultad';
import type { Programa } from '../models/programa';
import type { Asignatura } from '../models/asignatura';
import type { Espacio } from '../models/espacio';

interface HorarioCompleto {
  id: string;
  grupoNombre: string; // ej: "1A", "1B"
  facultadId: string;
  programaId: string;
  semestre: number;
  periodo: string; // fijo "2025-1"
  asignaturas: AsignaturaHorario[];
  fechaCreacion: string;
}

interface AsignaturaHorario {
  id: string;
  asignaturaId: string;
  asignaturaNombre: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  docente: string;
  espacioId: string;
  espacioNombre: string;
}

export default function HorariosAcademicos() {
  // Hooks para datos desde BD
  const { facultades } = useFacultades();
  const { programas } = useProgramas();
  const { asignaturas } = useAsignaturas();
  const { espacios } = useEspacios();
  const { horarios: horariosFromHook, createHorario, updateHorario, deleteHorario } = useHorarios();
  
  // Filtros en cascada
  const [facultadSeleccionada, setFacultadSeleccionada] = useState<string>('');
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
  const [semestreSeleccionado, setSemestreSeleccionado] = useState<string>('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('');
  
  // Horarios
  const [horarios, setHorarios] = useState<HorarioCompleto[]>([]);
  const [horarioActual, setHorarioActual] = useState<HorarioCompleto | null>(null);
  
  // Modales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddAsignaturaDialog, setShowAddAsignaturaDialog] = useState(false);
  
  // Estado para nueva asignatura
  const [nuevaAsignatura, setNuevaAsignatura] = useState({
    asignaturaId: '',
    dias: [] as string[], // Cambio: ahora soporta múltiples días
    horaInicio: '',
    horaFin: '',
    docente: '',
    espacioId: ''
  });

  // Estado para nuevo horario
  const [nuevoHorarioForm, setNuevoHorarioForm] = useState({
    grupoNombre: '',
    facultadId: '',
    programaId: '',
    semestre: ''
  });

  const PERIODO_FIJO = '2025-1';
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  
  // Generar grupos dinámicamente basados en el semestre seleccionado
  const generarGruposPorSemestre = (semestre: string): string[] => {
    if (!semestre) return [];
    const semestreNum = semestre;
    return [`${semestreNum}A`, `${semestreNum}B`, `${semestreNum}C`, `${semestreNum}D`];
  };
  
  const gruposDisponibles = generarGruposPorSemestre(semestreSeleccionado);

  const loadHorarios = () => {
    // Cargar horarios desde localStorage o inicializar vacío
    const stored = localStorage.getItem('horariosCompletos');
    if (stored) {
      setHorarios(JSON.parse(stored));
    }
  };
  
  // Sincronizar con horarios del hook cuando cambien
  useEffect(() => {
    loadHorarios();
  }, [horariosFromHook]);

  const saveHorarios = (newHorarios: HorarioCompleto[]) => {
    localStorage.setItem('horariosCompletos', JSON.stringify(newHorarios));
    setHorarios(newHorarios);
    
    // Disparar evento personalizado para notificar a otros componentes
    window.dispatchEvent(new Event('horariosUpdated'));
  };

  // Programas filtrados por facultad
  const programasFiltrados = programas.filter(p => p.facultad_id.toString() === facultadSeleccionada);

  // Asignaturas filtradas por programa
  const asignaturasFiltradas = asignaturas.filter(a => a.programa_id.toString() === programaSeleccionado);

  // Semestres únicos del programa seleccionado
  const semestresDisponibles = [...new Set(asignaturasFiltradas.map(a => a.semestre))].sort((a, b) => a - b);

  // Asignaturas del semestre seleccionado para agregar al horario
  const asignaturasDelSemestre = asignaturasFiltradas.filter(a => a.semestre === Number(semestreSeleccionado));

  // Horario actual a mostrar
  const horarioAMostrar = horarios.find(h => 
    h.facultadId === facultadSeleccionada &&
    h.programaId === programaSeleccionado &&
    h.semestre === Number(semestreSeleccionado) &&
    h.grupoNombre === grupoSeleccionado
  );

  // Resetear filtros en cascada
  const handleFacultadChange = (value: string) => {
    setFacultadSeleccionada(value);
    setProgramaSeleccionado('');
    setSemestreSeleccionado('');
    setGrupoSeleccionado('');
  };

  const handleProgramaChange = (value: string) => {
    setProgramaSeleccionado(value);
    setSemestreSeleccionado('');
    setGrupoSeleccionado('');
  };

  const handleSemestreChange = (value: string) => {
    setSemestreSeleccionado(value);
    setGrupoSeleccionado('');
  };

  // Crear nuevo horario para un grupo
  const handleOpenCreateDialog = () => {
    setNuevoHorarioForm({
      grupoNombre: '',
      facultadId: '',
      programaId: '',
      semestre: ''
    });
    setShowCreateDialog(true);
  };

  const handleCreateHorario = () => {
    // Validaciones
    if (!nuevoHorarioForm.facultadId) {
      toast.error('Debe seleccionar una facultad');
      return;
    }
    if (!nuevoHorarioForm.programaId) {
      toast.error('Debe seleccionar un programa');
      return;
    }
    if (!nuevoHorarioForm.semestre) {
      toast.error('Debe seleccionar un semestre');
      return;
    }

    // Generar automáticamente el nombre del grupo
    const gruposExistentes = horarios
      .filter(h => 
        h.facultadId === nuevoHorarioForm.facultadId &&
        h.programaId === nuevoHorarioForm.programaId &&
        h.semestre === Number(nuevoHorarioForm.semestre)
      )
      .map(h => h.grupoNombre);
    
    // Obtener la siguiente letra disponible (A, B, C, etc.)
    const letras = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let nuevoGrupoNombre = '';
    
    for (let i = 0; i < letras.length; i++) {
      const grupoTemporal = `${nuevoHorarioForm.semestre}${letras[i]}`;
      if (!gruposExistentes.includes(grupoTemporal)) {
        nuevoGrupoNombre = grupoTemporal;
        break;
      }
    }

    if (!nuevoGrupoNombre) {
      toast.error('Se ha alcanzado el límite de grupos para este semestre');
      return;
    }

    // Crear horario
    const nuevoHorario: HorarioCompleto = {
      id: `horario-${Date.now()}`,
      grupoNombre: nuevoGrupoNombre,
      facultadId: nuevoHorarioForm.facultadId,
      programaId: nuevoHorarioForm.programaId,
      semestre: Number(nuevoHorarioForm.semestre),
      periodo: PERIODO_FIJO,
      asignaturas: [],
      fechaCreacion: new Date().toISOString()
    };

    const nuevosHorarios = [...horarios, nuevoHorario];
    saveHorarios(nuevosHorarios);
    setShowCreateDialog(false);
    
    const programa = programas.find(p => p.id.toString() === nuevoHorarioForm.programaId);
    toast.success(`✅ Horario creado: Grupo ${nuevoGrupoNombre}`, {
      duration: 4000,
      icon: <Check className="w-5 h-5 text-green-600" />,
      description: `Se ha creado el grupo ${nuevoGrupoNombre} para el semestre ${nuevoHorarioForm.semestre}`
    });
  };

  // Eliminar horario completo
  const handleOpenDeleteDialog = () => {
    if (!horarioAMostrar) return;
    setHorarioActual(horarioAMostrar);
    setShowDeleteDialog(true);
  };

  const handleDeleteHorario = () => {
    if (!horarioActual) return;
    
    const nuevosHorarios = horarios.filter(h => h.id !== horarioActual.id);
    saveHorarios(nuevosHorarios);
    setShowDeleteDialog(false);
    setHorarioActual(null);
    
    toast.success('✅ Horario eliminado correctamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };

  // Agregar asignatura al horario
  const handleOpenAddAsignatura = () => {
    if (!horarioAMostrar) return;
    setHorarioActual(horarioAMostrar);
    setNuevaAsignatura({
      asignaturaId: '',
      dias: [],
      horaInicio: '',
      horaFin: '',
      docente: '',
      espacioId: ''
    });
    setShowAddAsignaturaDialog(true);
  };

  const handleAddAsignatura = () => {
    if (!horarioActual) return;

    // Validaciones
    if (!nuevaAsignatura.asignaturaId) {
      toast.error('Debe seleccionar una asignatura');
      return;
    }
    if (nuevaAsignatura.dias.length === 0) {
      toast.error('Debe seleccionar al menos un día');
      return;
    }
    if (!nuevaAsignatura.horaInicio || !nuevaAsignatura.horaFin) {
      toast.error('Debe seleccionar hora de inicio y fin');
      return;
    }
    if (!nuevaAsignatura.docente.trim()) {
      toast.error('Debe ingresar el nombre del docente');
      return;
    }
    if (!nuevaAsignatura.espacioId) {
      toast.error('Debe seleccionar un espacio');
      return;
    }

    // Validar hora fin > hora inicio
    const [inicioH, inicioM] = nuevaAsignatura.horaInicio.split(':').map(Number);
    const [finH, finM] = nuevaAsignatura.horaFin.split(':').map(Number);
    const inicioMinutos = inicioH * 60 + inicioM;
    const finMinutos = finH * 60 + finM;
    
    // Permitir horarios que cruzan medianoche (ej: 20:00 a 06:00)
    if (finMinutos <= inicioMinutos && finH < 12) {
      // Es válido si cruza medianoche
    } else if (finMinutos <= inicioMinutos) {
      toast.error('La hora de fin debe ser posterior a la hora de inicio');
      return;
    }

    // Validar conflictos para cada día seleccionado
    for (const dia of nuevaAsignatura.dias) {
      // Validar solapamiento en el mismo grupo
      const conflictoGrupo = horarioActual.asignaturas.find(a =>
        a.dia === dia &&
        hayConflictoHorario(a.horaInicio, a.horaFin, nuevaAsignatura.horaInicio, nuevaAsignatura.horaFin)
      );

      if (conflictoGrupo) {
        toast.error(`Conflicto en ${dia}: El grupo ya tiene ${conflictoGrupo.asignaturaNombre} en este horario`);
        return;
      }

      // Validar espacio no ocupado
      const conflictoEspacio = horarios.some(h =>
        h.asignaturas.some(a =>
          a.espacioId === nuevaAsignatura.espacioId &&
          a.dia === dia &&
          hayConflictoHorario(a.horaInicio, a.horaFin, nuevaAsignatura.horaInicio, nuevaAsignatura.horaFin)
        )
      );

      if (conflictoEspacio) {
        const espacio = espacios.find(e => e.id.toString() === nuevaAsignatura.espacioId);
        toast.error(`Conflicto en ${dia}: El espacio ${espacio?.nombre} ya está ocupado en este horario`);
        return;
      }
    }

    // Agregar asignatura para cada día seleccionado
    const asignatura = asignaturas.find(a => a.id.toString() === nuevaAsignatura.asignaturaId);
    const espacio = espacios.find(e => e.id.toString() === nuevaAsignatura.espacioId);

    const nuevasAsignaturas = nuevaAsignatura.dias.map(dia => ({
      id: `asig-horario-${Date.now()}-${dia}`,
      asignaturaId: nuevaAsignatura.asignaturaId,
      asignaturaNombre: asignatura?.nombre || '',
      dia: dia,
      horaInicio: nuevaAsignatura.horaInicio,
      horaFin: nuevaAsignatura.horaFin,
      docente: nuevaAsignatura.docente.trim(),
      espacioId: nuevaAsignatura.espacioId,
      espacioNombre: espacio?.nombre || ''
    }));

    const nuevosHorarios = horarios.map(h => {
      if (h.id === horarioActual.id) {
        return {
          ...h,
          asignaturas: [...h.asignaturas, ...nuevasAsignaturas]
        };
      }
      return h;
    });

    saveHorarios(nuevosHorarios);
    setShowAddAsignaturaDialog(false);
    
    toast.success(`✅ Asignatura agregada en ${nuevaAsignatura.dias.length} día(s)`, {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />,
      description: `Días: ${nuevaAsignatura.dias.join(', ')}`
    });
  };

  // Eliminar asignatura del horario
  const handleDeleteAsignatura = (asignaturaId: string) => {
    if (!horarioAMostrar) return;

    const nuevosHorarios = horarios.map(h => {
      if (h.id === horarioAMostrar.id) {
        return {
          ...h,
          asignaturas: h.asignaturas.filter(a => a.id !== asignaturaId)
        };
      }
      return h;
    });

    saveHorarios(nuevosHorarios);
    
    toast.success('✅ Asignatura eliminada del horario', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };

  const hayConflictoHorario = (inicio1: string, fin1: string, inicio2: string, fin2: string): boolean => {
    const i1 = parseInt(inicio1.replace(':', ''));
    const f1 = parseInt(fin1.replace(':', ''));
    const i2 = parseInt(inicio2.replace(':', ''));
    const f2 = parseInt(fin2.replace(':', ''));
    return i1 < f2 && f1 > i2;
  };

  // Función para generar franjas horarias dinámicas
  const generarFranjasHorarias = (asignaturas: AsignaturaHorario[]) => {
    if (asignaturas.length === 0) {
      // Si no hay asignaturas, mostrar horario por defecto de 6:00 AM a 10:00 PM
      const franjas: { inicio: number, texto: string }[] = [];
      for (let i = 6; i <= 21; i++) {
        franjas.push({
          inicio: i,
          texto: `${String(i).padStart(2, '0')}:00 - ${String(i + 1).padStart(2, '0')}:00`
        });
      }
      return franjas;
    }

    // Obtener todas las horas únicas de las asignaturas
    const horasSet = new Set<number>();
    
    asignaturas.forEach(asig => {
      const [horaInicioH] = asig.horaInicio.split(':').map(Number);
      const [horaFinH] = asig.horaFin.split(':').map(Number);
      
      // Agregar hora de inicio
      horasSet.add(horaInicioH);
      
      // Agregar todas las horas intermedias
      let horaActual = horaInicioH + 1;
      const horaFinal = horaFinH;
      
      while (horaActual <= horaFinal) {
        horasSet.add(horaActual);
        horaActual++;
      }
    });

    // Convertir a array y ordenar
    const horasArray = Array.from(horasSet).sort((a, b) => a - b);
    
    // Crear franjas horarias
    const franjas: { inicio: number, texto: string }[] = [];
    for (let i = 0; i < horasArray.length - 1; i++) {
      const horaInicio = horasArray[i];
      const horaFin = horasArray[i + 1];
      
      franjas.push({
        inicio: horaInicio,
        texto: `${String(horaInicio).padStart(2, '0')}:00 - ${String(horaFin).padStart(2, '0')}:00`
      });
    }

    return franjas;
  };

  // Función para verificar si una asignatura está en una franja horaria
  const asignaturaEnFranja = (asignatura: AsignaturaHorario, franja: { inicio: number, texto: string }): boolean => {
    const [asigHoraH] = asignatura.horaInicio.split(':').map(Number);
    return asigHoraH === franja.inicio;
  };

  // Calcular cuántas franjas ocupa una asignatura
  const calcularFilasOcupadas = (asignatura: AsignaturaHorario, franjas: { inicio: number, texto: string }[]): number => {
    const [horaInicioH] = asignatura.horaInicio.split(':').map(Number);
    const [horaFinH] = asignatura.horaFin.split(':').map(Number);
    
    const duracionHoras = horaFinH - horaInicioH;
    return Math.max(1, duracionHoras); // Mínimo 1 fila
  };

  // Renderizar grid de horario
  const renderHorarioGrid = () => {
    if (!horarioAMostrar) {
      return (
        <div className="text-center py-16">
          <Clock className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">Seleccione todos los filtros para visualizar el horario</p>
        </div>
      );
    }

    const franjasHorarias = generarFranjasHorarias(horarioAMostrar.asignaturas);
    
    // Crear mapa de celdas ocupadas: key = "dia-franjaIdx", value = { asignatura, rowSpan, isStart }
    const celdasOcupadas = new Map<string, { asignatura: AsignaturaHorario, isStart: boolean }>();
    
    // Pre-calcular qué celdas están ocupadas
    horarioAMostrar.asignaturas.forEach(asignatura => {
      const franjaInicio = franjasHorarias.findIndex(f => asignaturaEnFranja(asignatura, f));
      if (franjaInicio === -1) return;
      
      const filasOcupadas = calcularFilasOcupadas(asignatura, franjasHorarias);
      
      for (let i = 0; i < filasOcupadas && franjaInicio + i < franjasHorarias.length; i++) {
        const key = `${asignatura.dia}-${franjaInicio + i}`;
        celdasOcupadas.set(key, {
          asignatura,
          isStart: i === 0
        });
      }
    });

    return (
      <div className="space-y-4">
        {/* Botones de acción del horario */}
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-slate-900 dark:text-slate-100">
              Horario: {programas.find(p => p.id.toString() === horarioAMostrar.programaId)?.nombre} - Semestre {horarioAMostrar.semestre} - Grupo {horarioAMostrar.grupoNombre}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">Periodo: {PERIODO_FIJO}</p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleOpenAddAsignatura}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!facultadSeleccionada || !programaSeleccionado || !semestreSeleccionado || !grupoSeleccionado}
            >
              <Plus className="w-4 h-4 mr-2" />
              Asignar Asignatura
            </Button>
            <Button
              onClick={handleOpenDeleteDialog}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar Horario
            </Button>
          </div>
        </div>

        {/* Grid del horario */}
        <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
          <div className="min-w-[800px]">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-4 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 min-w-[120px]">
                    <div className="flex items-center justify-center gap-2">
                      <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                      <p className="text-slate-700 dark:text-slate-300">Hora</p>
                    </div>
                  </th>
                  {dias.map((dia) => (
                    <th key={dia} className="p-4 bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-700">
                      <p className="tracking-wide">{dia}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {franjasHorarias.map((franja, franjaIdx) => (
                  <tr key={`franja-${franjaIdx}`} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                    <td className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 align-top">
                      <p className="text-slate-700 dark:text-slate-300 text-center whitespace-nowrap">{franja.texto}</p>
                    </td>
                    {dias.map(dia => {
                      const key = `${dia}-${franjaIdx}`;
                      const celdaInfo = celdasOcupadas.get(key);
                      
                      // Si la celda está ocupada pero no es el inicio, no renderizar
                      if (celdaInfo && !celdaInfo.isStart) {
                        return null;
                      }
                      
                      // Si es el inicio de una asignatura, renderizar con rowSpan
                      if (celdaInfo && celdaInfo.isStart) {
                        const asignatura = celdaInfo.asignatura;
                        const filasOcupadas = calcularFilasOcupadas(asignatura, franjasHorarias);
                        
                        return (
                          <td 
                            key={key}
                            rowSpan={filasOcupadas}
                            className="p-0 border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 align-top"
                          >
                            <motion.div 
                              className="p-3 h-full space-y-2"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              whileHover={{ scale: 1.01 }}
                              transition={{ duration: 0.2 }}
                            >
                              <div className="space-y-1.5">
                                <p className="text-slate-900 dark:text-slate-100 leading-tight">
                                  {asignatura.asignaturaNombre}
                                </p>
                                <div className="space-y-0.5 text-sm">
                                  <p className="text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                    <span className="text-xs">📍</span>
                                    {asignatura.espacioNombre}
                                  </p>
                                  <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                    <span className="text-xs">👤</span>
                                    {asignatura.docente}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-blue-200 dark:border-blue-800">
                                <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5 hover:bg-blue-700">
                                  <Clock className="w-3 h-3 mr-1" />
                                  {asignatura.horaInicio}-{asignatura.horaFin}
                                </Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 w-7 p-0 text-red-600 hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950"
                                  onClick={() => handleDeleteAsignatura(asignatura.id)}
                                  title="Eliminar asignatura"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </motion.div>
                          </td>
                        );
                      }
                      
                      // Celda vacía
                      return (
                        <td 
                          key={key}
                          className="p-3 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors min-h-[80px] align-top"
                        >
                          <div className="h-16"></div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const mostrarHorario = facultadSeleccionada && programaSeleccionado && semestreSeleccionado && grupoSeleccionado;

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Gestión de Horarios Académicos</h1>
          <p className="text-slate-600 dark:text-slate-400">Crea y administra los horarios de clases por programa, grupo y espacio</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 py-2 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Periodo {PERIODO_FIJO}
          </Badge>
          <Button 
            onClick={handleOpenCreateDialog}
            className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Crear Horario
          </Button>
        </div>
      </div>

      {/* Filtros en cascada */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Filtros de Visualización</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Filtro 1: Facultad */}
            <div>
              <Select value={facultadSeleccionada} onValueChange={handleFacultadChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Facultad" />
                </SelectTrigger>
                <SelectContent>
                  {facultades.map(f => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro 2: Programa */}
            <div>
              <Select 
                value={programaSeleccionado} 
                onValueChange={handleProgramaChange}
                disabled={!facultadSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Programa" />
                </SelectTrigger>
                <SelectContent>
                  {programasFiltrados.map(p => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro 3: Semestre */}
            <div>
              <Select 
                value={semestreSeleccionado} 
                onValueChange={handleSemestreChange}
                disabled={!programaSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Semestre" />
                </SelectTrigger>
                <SelectContent>
                  {semestresDisponibles.map(s => (
                    <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro 4: Grupo */}
            <div>
              <Select 
                value={grupoSeleccionado} 
                onValueChange={setGrupoSeleccionado}
                disabled={!semestreSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Grupo" />
                </SelectTrigger>
                <SelectContent>
                  {gruposDisponibles.map(g => (
                    <SelectItem key={g} value={g}>{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!mostrarHorario && (
            <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-900 dark:text-yellow-100">
                  Seleccione todos los filtros para gestionar el horario (asignar, modificar o eliminar asignaturas)
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Horario Grid */}
      {mostrarHorario && (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-6">
            {renderHorarioGrid()}
          </CardContent>
        </Card>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-300 dark:border-blue-800 rounded"></div>
          <span>Clase programada</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded"></div>
          <span>Espacio libre</span>
        </div>
      </div>

      {/* Dialog: Crear Horario */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Horario</DialogTitle>
            <DialogDescription>
              Complete la información del grupo para crear un horario. El sistema validará que no existan duplicados.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Facultad *</Label>
                <Select value={nuevoHorarioForm.facultadId} onValueChange={(v) => setNuevoHorarioForm({ ...nuevoHorarioForm, facultadId: v, programaId: '', semestre: '' })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultades.map(f => (
                      <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Programa *</Label>
                <Select 
                  value={nuevoHorarioForm.programaId} 
                  onValueChange={(v) => setNuevoHorarioForm({ ...nuevoHorarioForm, programaId: v, semestre: '' })}
                  disabled={!nuevoHorarioForm.facultadId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar programa" />
                  </SelectTrigger>
                  <SelectContent>
                    {programas.filter(p => p.facultad_id.toString() === nuevoHorarioForm.facultadId).map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Semestre *</Label>
              <Select 
                value={nuevoHorarioForm.semestre} 
                onValueChange={(v) => setNuevoHorarioForm({ ...nuevoHorarioForm, semestre: v })}
                disabled={!nuevoHorarioForm.programaId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar semestre" />
                </SelectTrigger>
                <SelectContent>
                  {[...new Set(asignaturas.filter(a => a.programa_id.toString() === nuevoHorarioForm.programaId).map(a => a.semestre))].sort((a, b) => a - b).map(s => (
                    <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {nuevoHorarioForm.semestre && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                  </div>
                  <div>
                    <p className="text-blue-900">
                      <strong>Creación automática de grupo</strong>
                    </p>
                    <p className="text-blue-700 mt-1">
                      El sistema creará automáticamente el siguiente grupo disponible para el semestre {nuevoHorarioForm.semestre} 
                      (ejemplo: {nuevoHorarioForm.semestre}A, {nuevoHorarioForm.semestre}B, etc.)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateHorario} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              Crear Horario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Agregar Asignatura */}
      <Dialog open={showAddAsignaturaDialog} onOpenChange={setShowAddAsignaturaDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar Asignatura al Horario</DialogTitle>
            <DialogDescription>
              Solo se mostrarán asignaturas del semestre {semestreSeleccionado} correspondiente al grupo seleccionado.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Asignatura *</Label>
              <Select value={nuevaAsignatura.asignaturaId} onValueChange={(v) => setNuevaAsignatura({ ...nuevaAsignatura, asignaturaId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar asignatura" />
                </SelectTrigger>
                <SelectContent>
                  {asignaturasDelSemestre.map(a => (
                    <SelectItem key={a.id} value={a.id.toString()}>{a.nombre} ({a.creditos} créditos)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Días de la Semana *
              </Label>
              <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                {dias.map(dia => (
                  <div key={dia} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dia-${dia}`}
                      checked={nuevaAsignatura.dias.includes(dia)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNuevaAsignatura({ 
                            ...nuevaAsignatura, 
                            dias: [...nuevaAsignatura.dias, dia] 
                          });
                        } else {
                          setNuevaAsignatura({ 
                            ...nuevaAsignatura, 
                            dias: nuevaAsignatura.dias.filter(d => d !== dia) 
                          });
                        }
                      }}
                    />
                    <label 
                      htmlFor={`dia-${dia}`} 
                      className="text-sm cursor-pointer text-slate-700 dark:text-slate-300"
                    >
                      {dia}
                    </label>
                  </div>
                ))}
              </div>
              {nuevaAsignatura.dias.length > 0 && (
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  {nuevaAsignatura.dias.length} día(s) seleccionado(s): {nuevaAsignatura.dias.join(', ')}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hora Inicio *</Label>
                <Input
                  type="time"
                  value={nuevaAsignatura.horaInicio}
                  onChange={(e) => setNuevaAsignatura({ ...nuevaAsignatura, horaInicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Hora Fin *</Label>
                <Input
                  type="time"
                  value={nuevaAsignatura.horaFin}
                  onChange={(e) => setNuevaAsignatura({ ...nuevaAsignatura, horaFin: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Docente *</Label>
              <Input
                placeholder="Nombre completo del docente"
                value={nuevaAsignatura.docente}
                onChange={(e) => setNuevaAsignatura({ ...nuevaAsignatura, docente: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Espacio *</Label>
              <Select value={nuevaAsignatura.espacioId} onValueChange={(v) => setNuevaAsignatura({ ...nuevaAsignatura, espacioId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar espacio" />
                </SelectTrigger>
                <SelectContent>
                  {espacios.map(e => (
                    <SelectItem key={e.id} value={e.id.toString()}>{e.nombre} - Capacidad: {e.capacidad}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-slate-600 dark:text-slate-400">
                <strong>Validaciones automáticas:</strong>
              </p>
              <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 space-y-1 mt-2">
                <li>No solapamiento de horarios del grupo</li>
                <li>No asignación duplicada de espacios</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddAsignaturaDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddAsignatura} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              Agregar Asignatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Eliminar Horario */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro que desea eliminar este horario completo? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {horarioActual && (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
              <p className="text-slate-900 dark:text-slate-100">
                <strong>Programa:</strong> {programas.find(p => p.id.toString() === horarioActual.programaId)?.nombre}
              </p>
              <p className="text-slate-900 dark:text-slate-100">
                <strong>Semestre:</strong> {horarioActual.semestre}
              </p>
              <p className="text-slate-900 dark:text-slate-100">
                <strong>Grupo:</strong> {horarioActual.grupoNombre}
              </p>
              <p className="text-slate-900 dark:text-slate-100">
                <strong>Asignaturas:</strong> {horarioActual.asignaturas.length}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleDeleteHorario}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
