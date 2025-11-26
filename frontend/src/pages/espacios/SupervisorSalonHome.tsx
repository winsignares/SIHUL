import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Label } from '../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Input } from '../../share/input';
import { Badge } from '../../share/badge';
import { Checkbox } from '../../share/checkbox';
import { Textarea } from '../../share/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../share/dialog';
import { DoorOpen, DoorClosed, Building2, Clock, MapPin, Users, CheckCircle, Layers, AlertCircle, Search, LightbulbOff, Wind, Monitor, Armchair, Eraser, XCircle, Eye, ClipboardCheck, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../hooks/database';
import { Toaster } from 'sonner';

interface EstadoSalon {
  abierto: boolean;
  cerrado: boolean;
  horaApertura?: string;
  horaCierre?: string;
  checklistCierre?: ChecklistCierre;
}

interface ChecklistCierre {
  lucesApagadas: boolean;
  aireApagado: boolean;
  proyectorApagado: boolean;
  pupitresOrdenados: boolean;
  pizarraLimpia: boolean;
  ventanasCerradas: boolean;
  sinObjetosOlvidados: boolean;
  observaciones: string;
}

export default function SupervisorSalonHome() {
  const [espacios, setEspacios] = useState<any[]>([]);
  const [horarios, setHorarios] = useState<any[]>([]);
  const [salonesFiltrados, setSalonesFiltrados] = useState<any[]>([]);
  
  // Filtros
  const [sedeSeleccionada, setSedeSeleccionada] = useState('');
  const [pisoSeleccionado, setPisoSeleccionado] = useState('');
  const [horaSeleccionada, setHoraSeleccionada] = useState('08:00');
  const [busquedaActiva, setBusquedaActiva] = useState(false);
  
  // Estados de salones (apertura y cierre)
  const [estadosSalones, setEstadosSalones] = useState<Map<number, EstadoSalon>>(new Map());
  
  // Modal de cierre
  const [modalCierreAbierto, setModalCierreAbierto] = useState(false);
  const [salonParaCerrar, setSalonParaCerrar] = useState<any>(null);
  const [checklist, setChecklist] = useState<ChecklistCierre>({
    lucesApagadas: false,
    aireApagado: false,
    proyectorApagado: false,
    pupitresOrdenados: false,
    pizarraLimpia: false,
    ventanasCerradas: false,
    sinObjetosOlvidados: false,
    observaciones: ''
  });

  // Cargar datos
  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = () => {
    const espaciosDB = db.getEspacios();
    const horariosDB = db.getHorarios();
    setEspacios(espaciosDB);
    setHorarios(horariosDB);
  };

  // Obtener sedes y pisos únicos
  const sedes = Array.from(new Set(espacios.map(e => e.sede)));
  const pisos = sedeSeleccionada 
    ? Array.from(new Set(espacios.filter(e => e.sede === sedeSeleccionada).map(e => e.piso)))
    : [];

  // Obtener hora actual (simulada)
  const obtenerHoraActual = () => {
    return horaSeleccionada;
  };

  // Verificar si un salón tiene clase en la hora seleccionada
  const tieneClaseEnHora = (espacioId: number, hora: string) => {
    const horarioHoy = horarios.find(h => {
      if (h.espacioId !== espacioId || !h.activo) return false;
      
      const horaInicio = h.horaInicio;
      const horaFin = h.horaFin;
      
      // Verificar si la hora seleccionada está dentro del rango
      return hora >= horaInicio && hora < horaFin;
    });

    return horarioHoy;
  };

  // Verificar si la clase ya terminó (necesita cerrarse)
  const claseTerminada = (espacioId: number, hora: string) => {
    const horarioHoy = horarios.find(h => {
      if (h.espacioId !== espacioId || !h.activo) return false;
      return hora >= h.horaFin;
    });

    return horarioHoy;
  };

  // Obtener información del grupo que ocupa el salón
  const obtenerInfoGrupo = (horario: any) => {
    if (!horario) return null;
    
    const grupo = db.getGrupos().find(g => g.id === horario.grupoId);
    const asignatura = grupo ? db.getAsignaturas().find(a => a.id === grupo.asignaturaId) : null;
    
    return {
      grupo: grupo?.codigo || 'N/A',
      asignatura: asignatura?.nombre || 'N/A',
      docente: grupo?.docente || 'N/A',
      estudiantes: grupo?.cantidadEstudiantes || 0,
      horario: `${horario.horaInicio} - ${horario.horaFin}`,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin
    };
  };

  // Determinar el estado del salón
  const obtenerEstadoSalon = (espacioId: number) => {
    const estado = estadosSalones.get(espacioId);
    const horaActual = obtenerHoraActual();
    const tieneClase = tieneClaseEnHora(espacioId, horaActual);
    const claseFinalizada = claseTerminada(espacioId, horaActual);

    if (estado?.cerrado) {
      return 'cerrado';
    } else if (estado?.abierto && tieneClase) {
      return 'en-clase';
    } else if (estado?.abierto && claseFinalizada) {
      return 'por-cerrar';
    } else if (estado?.abierto) {
      return 'abierto';
    } else if (tieneClase) {
      return 'por-abrir';
    } else {
      return 'sin-clase';
    }
  };

  // Función para buscar salones
  const buscarSalones = () => {
    if (!sedeSeleccionada || !pisoSeleccionado) {
      // Mostrar notificación: Por favor selecciona Sede y Piso
      return;
    }
    setBusquedaActiva(true);
    // Mostrar notificación: Búsqueda realizada
  };

  // Filtrar salones
  useEffect(() => {
    if (!busquedaActiva) {
      setSalonesFiltrados([]);
      return;
    }

    let resultado = [...espacios];

    // Filtro por sede
    if (sedeSeleccionada) {
      resultado = resultado.filter(e => e.sede === sedeSeleccionada);
    }

    // Filtro por piso
    if (pisoSeleccionado) {
      resultado = resultado.filter(e => e.piso === pisoSeleccionado);
    }

    // Solo mostrar aulas y laboratorios
    resultado = resultado.filter(e => e.tipo === 'aula' || e.tipo === 'laboratorio');

    // Agregar información de horario y estado
    resultado = resultado.map(e => {
      const horario = tieneClaseEnHora(e.id, horaSeleccionada);
      const infoGrupo = obtenerInfoGrupo(horario);
      const estadoSalon = obtenerEstadoSalon(e.id);
      
      return {
        ...e,
        tieneClase: !!horario,
        infoGrupo,
        estadoSalon
      };
    });

    // Ordenar: primero los que tienen clase
    resultado.sort((a, b) => {
      const prioridad: any = {
        'por-abrir': 1,
        'en-clase': 2,
        'por-cerrar': 3,
        'abierto': 4,
        'cerrado': 5,
        'sin-clase': 6
      };
      return prioridad[a.estadoSalon] - prioridad[b.estadoSalon];
    });

    setSalonesFiltrados(resultado);
  }, [sedeSeleccionada, pisoSeleccionado, horaSeleccionada, espacios, horarios, estadosSalones, busquedaActiva]);

  // Abrir salón
  const abrirSalon = (espacioId: number, nombreSalon: string) => {
    const nuevoEstado = new Map(estadosSalones);
    nuevoEstado.set(espacioId, {
      abierto: true,
      cerrado: false,
      horaApertura: obtenerHoraActual()
    });
    setEstadosSalones(nuevoEstado);
    
    // Mostrar notificación: Salón abierto
  };

  // Abrir modal de cierre
  const abrirModalCierre = (salon: any) => {
    setSalonParaCerrar(salon);
    setChecklist({
      lucesApagadas: false,
      aireApagado: false,
      proyectorApagado: false,
      pupitresOrdenados: false,
      pizarraLimpia: false,
      ventanasCerradas: false,
      sinObjetosOlvidados: false,
      observaciones: ''
    });
    setModalCierreAbierto(true);
  };

  // Cerrar salón con checklist
  const cerrarSalon = () => {
    const todoCompleto = 
      checklist.lucesApagadas &&
      checklist.aireApagado &&
      checklist.proyectorApagado &&
      checklist.pupitresOrdenados &&
      checklist.pizarraLimpia &&
      checklist.ventanasCerradas &&
      checklist.sinObjetosOlvidados;

    if (!todoCompleto) {
      // Mostrar notificación: Checklist incompleto
      return;
    }

    const estadoActual = estadosSalones.get(salonParaCerrar.id);
    const nuevoEstado = new Map(estadosSalones);
    nuevoEstado.set(salonParaCerrar.id, {
      ...estadoActual,
      abierto: false,
      cerrado: true,
      horaCierre: obtenerHoraActual(),
      checklistCierre: { ...checklist }
    });
    setEstadosSalones(nuevoEstado);
    
    // Mostrar notificación: Salón cerrado correctamente

    setModalCierreAbierto(false);
    setSalonParaCerrar(null);
  };

  // Estadísticas
  const totalSalones = salonesFiltrados.length;
  const salonesConClase = salonesFiltrados.filter(s => s.tieneClase).length;
  const salonesAbiertos = salonesFiltrados.filter(s => s.estadoSalon === 'abierto' || s.estadoSalon === 'en-clase').length;
  const salonesCerrados = salonesFiltrados.filter(s => s.estadoSalon === 'cerrado').length;
  const salonesPorCerrar = salonesFiltrados.filter(s => s.estadoSalon === 'por-cerrar').length;

  // Configuración de badges por estado
  const getEstadoConfig = (estado: string) => {
    switch (estado) {
      case 'por-abrir':
        return {
          label: 'Por Abrir',
          className: 'bg-orange-100 text-orange-800 dark:bg-orange-950/30 dark:text-orange-400 border-orange-300',
          icon: <AlertCircle className="w-3 h-3" />
        };
      case 'abierto':
        return {
          label: 'Abierto',
          className: 'bg-blue-100 text-blue-800 dark:bg-blue-950/30 dark:text-blue-400 border-blue-300',
          icon: <DoorOpen className="w-3 h-3" />
        };
      case 'en-clase':
        return {
          label: 'En Clase',
          className: 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400 border-green-300',
          icon: <Users className="w-3 h-3" />
        };
      case 'por-cerrar':
        return {
          label: 'Por Cerrar',
          className: 'bg-purple-100 text-purple-800 dark:bg-purple-950/30 dark:text-purple-400 border-purple-300',
          icon: <Clock className="w-3 h-3" />
        };
      case 'cerrado':
        return {
          label: 'Cerrado',
          className: 'bg-slate-100 text-slate-800 dark:bg-slate-950/30 dark:text-slate-400 border-slate-300',
          icon: <Lock className="w-3 h-3" />
        };
      default:
        return {
          label: 'Sin Clase',
          className: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200',
          icon: <XCircle className="w-3 h-3" />
        };
    }
  };

  return (
    <div className="p-8 space-y-6 bg-gradient-to-br from-slate-50 via-blue-50/20 to-slate-100 dark:from-slate-900 dark:via-blue-950/10 dark:to-slate-800 min-h-full">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <DoorOpen className="w-8 h-8" />
            <h1 className="text-white">Gestión de Apertura y Cierre de Salones</h1>
          </div>
          <p className="text-blue-100">
            Control completo del ciclo de vida de los salones: apertura, seguimiento y cierre con verificación de condiciones
          </p>
        </div>
      </motion.div>

      {/* Estadísticas */}
      {busquedaActiva && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Total</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{totalSalones}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Con Clase</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{salonesConClase}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <DoorOpen className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Abiertos</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{salonesAbiertos}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Por Cerrar</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{salonesPorCerrar}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Cerrados</p>
                    <p className="text-slate-900 dark:text-slate-100 text-xl">{salonesCerrados}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Filtros con Botón Buscar */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg">
        <CardHeader className="border-b border-slate-200 dark:border-slate-700">
          <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Filtros de Búsqueda
          </CardTitle>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Selecciona sede, piso y hora para buscar los salones a gestionar
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            {/* Sede */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                Sede
              </Label>
              <Select value={sedeSeleccionada} onValueChange={(value) => {
                setSedeSeleccionada(value);
                setPisoSeleccionado('');
                setBusquedaActiva(false);
              }}>
                <SelectTrigger className="h-12 border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Selecciona una sede" />
                </SelectTrigger>
                <SelectContent>
                  {sedes.map(sede => (
                    <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Piso */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                Piso
              </Label>
              <Select 
                value={pisoSeleccionado} 
                onValueChange={(value) => {
                  setPisoSeleccionado(value);
                  setBusquedaActiva(false);
                }}
                disabled={!sedeSeleccionada}
              >
                <SelectTrigger className="h-12 border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder={sedeSeleccionada ? "Selecciona un piso" : "Primero selecciona una sede"} />
                </SelectTrigger>
                <SelectContent>
                  {pisos.map(piso => (
                    <SelectItem key={piso} value={piso}>Piso {piso}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Hora */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-purple-600" />
                Hora Actual
              </Label>
              <Select
                value={horaSeleccionada}
                onValueChange={(value) => {
                  setHoraSeleccionada(value);
                  setBusquedaActiva(false);
                }}
              >
                <SelectTrigger className="h-12 border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Selecciona una hora" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="06:00">6:00 AM</SelectItem>
                  <SelectItem value="07:00">7:00 AM</SelectItem>
                  <SelectItem value="08:00">8:00 AM</SelectItem>
                  <SelectItem value="09:00">9:00 AM</SelectItem>
                  <SelectItem value="10:00">10:00 AM</SelectItem>
                  <SelectItem value="11:00">11:00 AM</SelectItem>
                  <SelectItem value="12:00">12:00 PM</SelectItem>
                  <SelectItem value="13:00">1:00 PM</SelectItem>
                  <SelectItem value="14:00">2:00 PM</SelectItem>
                  <SelectItem value="15:00">3:00 PM</SelectItem>
                  <SelectItem value="16:00">4:00 PM</SelectItem>
                  <SelectItem value="17:00">5:00 PM</SelectItem>
                  <SelectItem value="18:00">6:00 PM</SelectItem>
                  <SelectItem value="19:00">7:00 PM</SelectItem>
                  <SelectItem value="20:00">8:00 PM</SelectItem>
                  <SelectItem value="21:00">9:00 PM</SelectItem>
                  <SelectItem value="22:00">10:00 PM</SelectItem>
                  <SelectItem value="23:00">11:00 PM</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Botón Buscar */}
            <div className="space-y-2">
              <Label className="text-transparent select-none">.</Label>
              <Button
                onClick={buscarSalones}
                disabled={!sedeSeleccionada || !pisoSeleccionado}
                className="w-full h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Search className="w-5 h-5 mr-2" />
                Buscar Salones
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Salones */}
      <AnimatePresence mode="wait">
        {!busquedaActiva ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-12">
                <div className="text-center">
                  <Search className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-slate-900 dark:text-slate-100 mb-2">Realiza una búsqueda</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    Selecciona sede, piso y hora, luego haz clic en "Buscar Salones" para ver los resultados
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : salonesFiltrados.length === 0 ? (
          <motion.div
            key="no-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-12">
                <div className="text-center">
                  <MapPin className="w-20 h-20 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <h3 className="text-slate-900 dark:text-slate-100 mb-2">No hay salones</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    No se encontraron salones en {sedeSeleccionada} - Piso {pisoSeleccionado}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardHeader className="border-b border-slate-200 dark:border-slate-700">
                <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center justify-between">
                  <span>Salones Encontrados ({salonesFiltrados.length})</span>
                  <Badge variant="outline" className="text-sm">
                    {sedeSeleccionada} - Piso {pisoSeleccionado} - {horaSeleccionada}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {salonesFiltrados.map((salon, index) => {
                    const estadoConfig = getEstadoConfig(salon.estadoSalon);
                    
                    return (
                      <motion.div
                        key={salon.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className={`border-2 transition-all hover:shadow-lg ${
                          salon.estadoSalon === 'cerrado' 
                            ? 'border-slate-300 bg-slate-50 dark:border-slate-700 dark:bg-slate-900/50'
                            : salon.estadoSalon === 'en-clase'
                            ? 'border-green-300 bg-green-50 dark:border-green-800 dark:bg-green-950/20'
                            : salon.estadoSalon === 'por-cerrar'
                            ? 'border-purple-300 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/20'
                            : salon.estadoSalon === 'abierto'
                            ? 'border-blue-300 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20'
                            : salon.estadoSalon === 'por-abrir'
                            ? 'border-orange-300 bg-orange-50 dark:border-orange-800 dark:bg-orange-950/20'
                            : 'border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-800'
                        }`}>
                          <CardContent className="p-6">
                            {/* Header del salón */}
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-slate-900 dark:text-slate-100">
                                    {salon.nombre}
                                  </h3>
                                  <Badge variant="outline" className="capitalize text-xs">
                                    {salon.tipo}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-2">
                                  <code className="text-xs bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded">
                                    {salon.codigo}
                                  </code>
                                  <Badge className={`${estadoConfig.className} border`}>
                                    {estadoConfig.icon}
                                    <span className="ml-1">{estadoConfig.label}</span>
                                  </Badge>
                                </div>
                              </div>
                            </div>

                            {/* Información de la clase */}
                            {salon.tieneClase && salon.infoGrupo && (
                              <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-900 dark:to-slate-800 rounded-xl p-4 mb-4 border border-slate-200 dark:border-slate-700">
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-200 dark:border-slate-700">
                                  <Clock className="w-4 h-4 text-blue-600" />
                                  <span className="text-slate-900 dark:text-slate-100">Clase en Curso</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Asignatura</p>
                                      <p className="text-sm text-slate-900 dark:text-slate-100">{salon.infoGrupo.asignatura}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Grupo</p>
                                      <p className="text-sm text-slate-900 dark:text-slate-100">{salon.infoGrupo.grupo}</p>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Horario</p>
                                      <p className="text-sm text-slate-900 dark:text-slate-100">{salon.infoGrupo.horario}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">Estudiantes</p>
                                      <p className="text-sm text-slate-900 dark:text-slate-100 flex items-center gap-1">
                                        <Users className="w-3 h-3" />
                                        {salon.infoGrupo.estudiantes} / {salon.capacidad}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700">
                                  <p className="text-xs text-slate-500 dark:text-slate-400">Docente</p>
                                  <p className="text-sm text-slate-900 dark:text-slate-100">{salon.infoGrupo.docente}</p>
                                </div>
                              </div>
                            )}

                            {/* Info del estado */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                                <div className="flex items-center gap-1">
                                  <Users className="w-4 h-4" />
                                  <span>Cap. {salon.capacidad}</span>
                                </div>
                                {estadosSalones.get(salon.id)?.horaApertura && (
                                  <div className="flex items-center gap-1">
                                    <DoorOpen className="w-4 h-4 text-blue-600" />
                                    <span className="text-xs">Abierto: {estadosSalones.get(salon.id)?.horaApertura}</span>
                                  </div>
                                )}
                                {estadosSalones.get(salon.id)?.horaCierre && (
                                  <div className="flex items-center gap-1">
                                    <Lock className="w-4 h-4 text-slate-600" />
                                    <span className="text-xs">Cerrado: {estadosSalones.get(salon.id)?.horaCierre}</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex gap-2">
                              {salon.estadoSalon === 'por-abrir' && (
                                <Button
                                  onClick={() => abrirSalon(salon.id, salon.nombre)}
                                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white"
                                >
                                  <DoorOpen className="w-4 h-4 mr-2" />
                                  Abrir Salón
                                </Button>
                              )}

                              {(salon.estadoSalon === 'por-cerrar') && (
                                <Button
                                  onClick={() => abrirModalCierre(salon)}
                                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white"
                                >
                                  <DoorClosed className="w-4 h-4 mr-2" />
                                  Cerrar Salón
                                </Button>
                              )}

                              {salon.estadoSalon === 'en-clase' && (
                                <Button
                                  disabled
                                  className="flex-1 bg-green-600 text-white cursor-not-allowed"
                                >
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Clase en Curso
                                </Button>
                              )}

                              {salon.estadoSalon === 'cerrado' && (
                                <Button
                                  disabled
                                  className="flex-1 bg-slate-600 text-white cursor-not-allowed"
                                >
                                  <Lock className="w-4 h-4 mr-2" />
                                  Cerrado
                                </Button>
                              )}

                              {salon.estadoSalon === 'sin-clase' && (
                                <Button
                                  disabled
                                  variant="outline"
                                  className="flex-1 cursor-not-allowed"
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Sin Clase Programada
                                </Button>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Checklist de Cierre */}
      <Dialog open={modalCierreAbierto} onOpenChange={setModalCierreAbierto}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <ClipboardCheck className="w-6 h-6 text-purple-600" />
              Checklist de Cierre - {salonParaCerrar?.nombre}
            </DialogTitle>
            <DialogDescription>
              Verifica que el salón quede en perfectas condiciones antes de cerrar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Checklist Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="luces"
                  checked={checklist.lucesApagadas}
                  onCheckedChange={(checked) => setChecklist({...checklist, lucesApagadas: checked as boolean})}
                />
                <label htmlFor="luces" className="flex items-center gap-2 cursor-pointer flex-1">
                  <LightbulbOff className="w-5 h-5 text-yellow-600" />
                  <span className="text-slate-700 dark:text-slate-300">Luces apagadas</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="aire"
                  checked={checklist.aireApagado}
                  onCheckedChange={(checked) => setChecklist({...checklist, aireApagado: checked as boolean})}
                />
                <label htmlFor="aire" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Wind className="w-5 h-5 text-blue-600" />
                  <span className="text-slate-700 dark:text-slate-300">Aire acondicionado apagado</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="proyector"
                  checked={checklist.proyectorApagado}
                  onCheckedChange={(checked) => setChecklist({...checklist, proyectorApagado: checked as boolean})}
                />
                <label htmlFor="proyector" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Monitor className="w-5 h-5 text-purple-600" />
                  <span className="text-slate-700 dark:text-slate-300">Proyector apagado</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="pupitres"
                  checked={checklist.pupitresOrdenados}
                  onCheckedChange={(checked) => setChecklist({...checklist, pupitresOrdenados: checked as boolean})}
                />
                <label htmlFor="pupitres" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Armchair className="w-5 h-5 text-orange-600" />
                  <span className="text-slate-700 dark:text-slate-300">Pupitres ordenados</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="pizarra"
                  checked={checklist.pizarraLimpia}
                  onCheckedChange={(checked) => setChecklist({...checklist, pizarraLimpia: checked as boolean})}
                />
                <label htmlFor="pizarra" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Eraser className="w-5 h-5 text-green-600" />
                  <span className="text-slate-700 dark:text-slate-300">Pizarra limpia</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                <Checkbox
                  id="ventanas"
                  checked={checklist.ventanasCerradas}
                  onCheckedChange={(checked) => setChecklist({...checklist, ventanasCerradas: checked as boolean})}
                />
                <label htmlFor="ventanas" className="flex items-center gap-2 cursor-pointer flex-1">
                  <Eye className="w-5 h-5 text-cyan-600" />
                  <span className="text-slate-700 dark:text-slate-300">Ventanas cerradas</span>
                </label>
              </div>

              <div className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors md:col-span-2">
                <Checkbox
                  id="objetos"
                  checked={checklist.sinObjetosOlvidados}
                  onCheckedChange={(checked) => setChecklist({...checklist, sinObjetosOlvidados: checked as boolean})}
                />
                <label htmlFor="objetos" className="flex items-center gap-2 cursor-pointer flex-1">
                  <CheckCircle className="w-5 h-5 text-emerald-600" />
                  <span className="text-slate-700 dark:text-slate-300">No hay objetos olvidados</span>
                </label>
              </div>
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones" className="text-slate-700 dark:text-slate-300">
                Observaciones (opcional)
              </Label>
              <Textarea
                id="observaciones"
                placeholder="Escribe cualquier observación sobre el estado del salón..."
                value={checklist.observaciones}
                onChange={(e) => setChecklist({...checklist, observaciones: e.target.value})}
                className="h-24 resize-none"
              />
            </div>

            {/* Progreso */}
            <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600 dark:text-slate-400">Progreso del checklist</span>
                <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                  {Object.values(checklist).filter((v, i) => i < 7 && v === true).length} / 7
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full transition-all"
                  style={{ width: `${(Object.values(checklist).filter((v, i) => i < 7 && v === true).length / 7) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setModalCierreAbierto(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={cerrarSalon}
              disabled={!Object.values(checklist).slice(0, 7).every(v => v === true)}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white"
            >
              <Lock className="w-4 h-4 mr-2" />
              Cerrar Salón
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  );
}