import { Input } from '../../share/input';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../share/dialog';
import { Label } from '../../share/label';
import { Textarea } from '../../share/textarea';
import { Alert, AlertDescription } from '../../share/alert';
import { Search, MapPin, Users, Home, Grid3x3, CalendarDays, FileDown, FileSpreadsheet, Plus, Trash2, AlertCircle, ArrowLeft, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../share/tooltip';
import { useConsultaEspacios } from '../../hooks/espacios/useConsultaEspacios';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useAuth } from '../../context/AuthContext';
import { useState, useEffect } from 'react';
import { tipoActividadService, type TipoActividad } from '../../services/prestamos/tipoActividadAPI';
import { recursoService, type Recurso } from '../../services/recursos/recursoAPI';
import { sedeService } from '../../services/sedes/sedeAPI';
import { prestamosPublicAPI, type EspacioDisponibleAPI } from '../../services/prestamos/prestamosPublicAPI';
import { prestamoService, type RecursoPrestamo } from '../../services/prestamos/prestamoAPI';
import { toast } from 'sonner';
import type { Sede } from '../../services/sedes/sedeAPI';

export default function ConsultaEspacios() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  
  const {
    searchTerm,
    setSearchTerm,
    filterTipo,
    setFilterTipo,
    filterEstado,
    setFilterEstado,
    filterSede,
    setFilterSede,
    filterFechaInicio,
    filterFechaFin,
    handleFechaInicioChange,
    handleFechaFinChange,
    vistaActual,
    setVistaActual,
    tiposEspacio,
    sedes,
    diasSemana,
    horas,
    filteredEspacios,
    estadisticas,
    horarios,
    prestamos,
    calcularProximaClaseYEstado,
    exportarCronogramaPDF,
    exportarCronogramaExcel,
    getOcupacionPorHora,
    // Drag-to-select
    isDragging,
    seleccionRango,
    iniciarSeleccion,
    actualizarSeleccion,
    finalizarSeleccion,
    esSupervisor,
    // Modal solicitud
    dialogSolicitudOpen,
    setDialogSolicitudOpen,
    nuevaSolicitudData,
    setNuevaSolicitudData,
    // Vista individual
    espacioSeleccionado,
    verCronogramaIndividual,
    volverALista,
    // Filtros
    limpiarFiltros
  } = useConsultaEspacios();

  // Estados para el formulario de solicitud
  const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
  const [recursosDisponibles, setRecursosDisponibles] = useState<Recurso[]>([]);
  const [sedesList, setSedesList] = useState<Sede[]>([]);
  const [espaciosDisponibles, setEspaciosDisponibles] = useState<EspacioDisponibleAPI[]>([]);
  const [recursosSeleccionados, setRecursosSeleccionados] = useState<RecursoPrestamo[]>([]);
  const [formData, setFormData] = useState({
    sede_id: 0,
    espacio_id: 0,
    tipo_actividad_id: 0,
    asistentes: '',
    motivo: '',
    telefono: ''
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Cargar datos para el formulario
  useEffect(() => {
    const loadFormData = async () => {
      try {
        const [tiposResp, recursosResp, sedesResp] = await Promise.all([
          tipoActividadService.listarTiposActividad(),
          recursoService.listarRecursos(),
          sedeService.listarSedes()
        ]);
        setTiposActividad(tiposResp.tipos_actividad);
        setRecursosDisponibles(recursosResp.recursos);
        setSedesList(sedesResp.sedes);
      } catch (err) {
        console.error('Error cargando datos del formulario:', err);
      }
    };
    loadFormData();
  }, []);

  // Cargar espacios disponibles cuando cambian sede/fecha/hora
  useEffect(() => {
    const loadEspaciosDisponibles = async () => {
      if (!nuevaSolicitudData?.fecha || !nuevaSolicitudData?.horaInicio || !nuevaSolicitudData?.horaFin) {
        return;
      }
      
      try {
        // Buscar el sede_id del espacio seleccionado
        const espacio = filteredEspacios.find(e => e.id === nuevaSolicitudData.espacio_id.toString());
        if (!espacio) return;
        
        const sede = sedesList.find(s => s.nombre === espacio.sede);
        if (!sede) return;

        const response = await prestamosPublicAPI.listarEspaciosDisponibles(
          nuevaSolicitudData.fecha,
          `${nuevaSolicitudData.horaInicio}:00`,
          `${nuevaSolicitudData.horaFin}:00`,
          sede.id
        );
        setEspaciosDisponibles(response.espacios || []);
        setFormData(prev => ({ 
          ...prev, 
          sede_id: sede.id,
          espacio_id: nuevaSolicitudData.espacio_id
        }));
      } catch (err) {
        console.error('Error cargando espacios disponibles:', err);
      }
    };
    
    if (dialogSolicitudOpen) {
      loadEspaciosDisponibles();
    }
  }, [dialogSolicitudOpen, nuevaSolicitudData, filteredEspacios, sedesList]);

  // Determinar qué espacios mostrar
  const espaciosToShow = espacioSeleccionado 
    ? filteredEspacios.filter(e => e.id === espacioSeleccionado.id)
    : filteredEspacios;

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'disponible':
        return <Badge className="bg-green-100 text-green-800 border-green-300 text-xs">Disponible</Badge>;
      case 'ocupado':
        return <Badge className="bg-red-100 text-red-800 border-red-300 text-xs">Ocupado</Badge>;
      case 'mantenimiento':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">Mantenimiento</Badge>;
      default:
        return null;
    }
  };

  const getDayColumnIndex = (dia: string) => {
    const index = diasSemana.indexOf(dia);
    return index !== -1 ? index + 2 : 1;
  };

  const getHourRowIndex = (hora: number) => {
    const row = hora - 5 + 1;
    return row;
  };

  // Funciones del formulario
  const agregarRecurso = (recurso_id: number) => {
    const recursoExistente = recursosSeleccionados.find(r => r.recurso_id === recurso_id);
    if (recursoExistente) return;
    
    const recurso = recursosDisponibles.find(r => r.id === recurso_id);
    setRecursosSeleccionados(prev => [...prev, {
      recurso_id,
      recurso_nombre: recurso?.nombre,
      cantidad: 1
    }]);
  };

  const eliminarRecurso = (recurso_id: number) => {
    setRecursosSeleccionados(prev => prev.filter(r => r.recurso_id !== recurso_id));
  };

  const handleSubmitSolicitud = async () => {
    if (!nuevaSolicitudData || !user?.id) return;

    // Validaciones
    if (!formData.espacio_id || !formData.tipo_actividad_id || !formData.motivo) {
      setFormError('Por favor complete todos los campos obligatorios');
      return;
    }

    const asistentesNum = parseInt(formData.asistentes) || 0;
    if (asistentesNum > 0) {
      const espacioSeleccionado = espaciosDisponibles.find(e => e.id === formData.espacio_id);
      if (espacioSeleccionado && asistentesNum > espacioSeleccionado.capacidad) {
        setFormError(`El número de asistentes (${asistentesNum}) excede la capacidad del espacio (${espacioSeleccionado.capacidad})`);
        return;
      }
    }

    setSubmitting(true);
    setFormError(null);

    try {
      await prestamoService.crearPrestamo({
        espacio_id: formData.espacio_id,
        usuario_id: user.id,
        administrador_id: null,
        tipo_actividad_id: formData.tipo_actividad_id,
        fecha: nuevaSolicitudData.fecha,
        hora_inicio: `${nuevaSolicitudData.horaInicio}:00`,
        hora_fin: `${nuevaSolicitudData.horaFin}:00`,
        motivo: formData.motivo,
        asistentes: asistentesNum,
        telefono: formData.telefono,
        estado: 'Pendiente',
        recursos: recursosSeleccionados.map(r => ({
          recurso_id: r.recurso_id,
          cantidad: r.cantidad
        }))
      });

      toast.success('Solicitud enviada exitosamente');
      setDialogSolicitudOpen(false);
      setNuevaSolicitudData(null);
      setFormData({
        sede_id: 0,
        espacio_id: 0,
        tipo_actividad_id: 0,
        asistentes: '',
        motivo: '',
        telefono: ''
      });
      setRecursosSeleccionados([]);
    } catch (err: any) {
      setFormError(err.message || 'Error al crear la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const estaEnRangoSeleccion = (espacioId: string, dia: string, hora: number) => {
    if (!seleccionRango) return false;
    return seleccionRango.espacioId === espacioId &&
           seleccionRango.dia === dia &&
           hora >= seleccionRango.horaInicio &&
           hora < seleccionRango.horaFin;
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-slate-900 dark:text-slate-100 mb-2 ${isMobile ? 'text-xl' : ''}`}>
            {espacioSeleccionado ? `Cronograma: ${espacioSeleccionado.nombre}` : 'Disponibilidad de Espacios'}
          </h1>
          <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? 'text-sm' : ''}`}>
            {espacioSeleccionado 
              ? 'Vista individual del espacio seleccionado'
              : 'Consulta la disponibilidad de aulas, laboratorios y espacios'}
          </p>
        </div>
        {espacioSeleccionado && (
          <Button
            variant="outline"
            onClick={volverALista}
            className="border-blue-600 text-blue-600 hover:bg-blue-50"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a la lista
          </Button>
        )}
      </div>

      {/* Estadísticas */}
      <div className={`grid gap-4 ${isMobile ? 'grid-cols-2 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-4'}`}>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Total Espacios</p>
                <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.total}</p>
              </div>
              <Home className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} text-blue-600 flex-shrink-0`} />
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Disponibles</p>
                <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.disponibles}</p>
              </div>
              <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-green-100 dark:bg-green-950 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-green-600`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className={`text-slate-600 dark:text-slate-400 mb-1 ${isMobile ? 'text-xs' : ''}`}>Ocupados</p>
                <p className={`text-slate-900 dark:text-slate-100 ${isMobile ? 'text-lg' : ''}`}>{estadisticas.ocupados}</p>
              </div>
              <div className={`${isMobile ? 'w-8 h-8' : 'w-10 h-10'} bg-red-100 dark:bg-red-950 rounded-lg flex items-center justify-center flex-shrink-0`}>
                <MapPin className={`${isMobile ? 'w-5 h-5' : 'w-6 h-6'} text-red-600`} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className={`${isMobile ? 'p-3' : 'p-6'}`}>
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-slate-600 dark:text-slate-400 mb-1">Mantenimiento</p>
                <p className="text-slate-900 dark:text-slate-100">{estadisticas.mantenimiento}</p>
              </div>
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-950 rounded-lg flex items-center justify-center">
                <MapPin className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Botones de vista */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex gap-2 w-full sm:w-auto">
          {!espacioSeleccionado && (
            <>
              <Button
                variant={vistaActual === 'tarjetas' ? 'default' : 'outline'}
                onClick={() => setVistaActual('tarjetas')}
                className={`flex-1 sm:flex-none ${vistaActual === 'tarjetas'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                  : 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
                } ${isMobile ? 'text-sm py-2 h-auto' : ''}`}
              >
                <Grid3x3 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                {isMobile ? 'Tarjetas' : 'Vista Tarjetas'}
              </Button>
              <Button
                variant={vistaActual === 'cronograma' ? 'default' : 'outline'}
                onClick={() => setVistaActual('cronograma')}
                className={`flex-1 sm:flex-none ${vistaActual === 'cronograma'
                  ? 'bg-gradient-to-r from-yellow-600 to-yellow-700 text-white'
                  : 'border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950'
                } ${isMobile ? 'text-sm py-2 h-auto' : ''}`}
              >
                <CalendarDays className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
                {isMobile ? 'Cronograma' : 'Vista Cronograma'}
              </Button>
            </>
          )}
        </div>
        {vistaActual === 'cronograma' && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              onClick={() => exportarCronogramaPDF(espacioSeleccionado ? [espacioSeleccionado] : undefined)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <FileDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
              {isMobile ? 'PDF' : 'Exportar PDF'}
            </Button>
            <Button
              onClick={() => exportarCronogramaExcel(espacioSeleccionado ? [espacioSeleccionado] : undefined)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              <FileSpreadsheet className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
              {isMobile ? 'Excel' : 'Exportar Excel'}
            </Button>
          </div>
        )}
      </div>

      {/* Filtros - ocultos cuando se selecciona un espacio */}
      {!espacioSeleccionado && (
        <div className="space-y-4">
          <div className={`flex ${isMobile ? 'flex-col' : 'flex-wrap items-end'} gap-4`}>
            <div className={`${isMobile ? 'w-full' : 'flex-1 min-w-[200px]'} relative`}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
              <Input
                placeholder="Buscar espacio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`pl-10 h-9 ${isMobile ? 'text-sm' : ''}`}
              />
            </div>
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los tipos</SelectItem>
                {tiposEspacio.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="disponible">Disponible</SelectItem>
                <SelectItem value="ocupado">Ocupado</SelectItem>
                <SelectItem value="mantenimiento">Mantenimiento</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterSede} onValueChange={setFilterSede}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas las sedes</SelectItem>
                {sedes.map(sede => (
                  <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className={`flex gap-2 ${isMobile ? 'w-full' : ''}`}>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Desde</Label>
                <Input
                  type="date"
                  value={filterFechaInicio}
                  onChange={(e) => handleFechaInicioChange(e.target.value)}
                  className={`${isMobile ? 'flex-1' : 'w-[150px]'} h-9 ${isMobile ? 'text-sm' : ''}`}
                  placeholder="Fecha inicio"
                  title="Fecha inicio del rango"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Hasta</Label>
                <Input
                  type="date"
                  value={filterFechaFin}
                  onChange={(e) => handleFechaFinChange(e.target.value)}
                  className={`${isMobile ? 'flex-1' : 'w-[150px]'} h-9 ${isMobile ? 'text-sm' : ''}`}
                  placeholder="Fecha fin"
                  title="Fecha fin del rango"
                />
              </div>
              <Button
                variant="outline"
                onClick={limpiarFiltros}
                className="border-slate-300 text-slate-600 hover:bg-slate-100 self-end h-9"
                title="Limpiar filtros"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
          {filterFechaInicio && (
            <div className="bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg p-3">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                <strong>Rango de fechas:</strong> Mostrando horarios académicos y préstamos aprobados del {new Date(filterFechaInicio + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} al {filterFechaFin ? new Date(filterFechaFin + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'sábado de esa semana'}
                {prestamos.length > 0 && <span className="ml-2">({prestamos.length} préstamo{prestamos.length !== 1 ? 's' : ''} aprobado{prestamos.length !== 1 ? 's' : ''})</span>}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Vista Tarjetas */}
      {vistaActual === 'tarjetas' && !espacioSeleccionado && (
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1' : 'md:grid-cols-2 lg:grid-cols-3'}`}>
          {filteredEspacios.map(espacio => {
            const { proximaClase, estado } = calcularProximaClaseYEstado(espacio.id);
            return (
              <motion.div
                key={espacio.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card 
                  className="border-slate-200 dark:border-slate-700 hover:shadow-lg transition-shadow bg-white dark:bg-slate-800 cursor-pointer"
                  onClick={() => verCronogramaIndividual(espacio)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-slate-900 dark:text-slate-100 mb-2">{espacio.nombre}</CardTitle>
                        <Badge variant="outline" className="border-blue-600 text-blue-600">
                          {espacio.tipo}
                        </Badge>
                      </div>
                      {getEstadoBadge(estado)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <Users className="w-4 h-4" />
                      <span>Capacidad: {espacio.capacidad} personas</span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                      <MapPin className="w-4 h-4" />
                      <span>{espacio.sede} - Edificio {espacio.edificio}</span>
                    </div>
                    {proximaClase && (
                      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                        <p className="text-slate-600 dark:text-slate-400">Próxima clase:</p>
                        <p className="text-blue-700 dark:text-blue-300">{proximaClase}</p>
                      </div>
                    )}
                    <div className="pt-2">
                      <Button variant="outline" className="w-full text-sm border-blue-600 text-blue-600 hover:bg-blue-50">
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Ver Cronograma
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Vista Cronograma */}
      {vistaActual === 'cronograma' && (
        <div className="space-y-6">
          {/* Leyenda */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-green-500 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Préstamo Aprobado</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-300 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Préstamo Pendiente</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-yellow-600 rounded"></div>
                  <span className="text-sm text-slate-700 dark:text-slate-300">Mantenimiento</span>
                </div>
                {esSupervisor && (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-purple-500 rounded border-2 border-purple-700"></div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">Seleccionar (drag para solicitud)</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Indicador de selección activa */}
          {isDragging && esSupervisor && (
            <div className="bg-purple-100 dark:bg-purple-900/30 border border-purple-300 dark:border-purple-700 rounded-lg p-3 text-center">
              <p className="text-purple-700 dark:text-purple-300 text-sm font-medium">
                Suelta el mouse para crear una nueva solicitud de préstamo
              </p>
            </div>
          )}

          {espaciosToShow.map((espacio) => (
            <motion.div
              key={espacio.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-slate-900 dark:text-slate-100">{espacio.nombre}</CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline" className="border-blue-600 text-blue-600">
                          {espacio.tipo}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-600">
                          Capacidad: {espacio.capacidad}
                        </Badge>
                        <Badge variant="outline" className="border-slate-600 text-slate-600">
                          Edificio {espacio.edificio}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div 
                    className="overflow-x-auto"
                    onMouseLeave={() => {
                      if (isDragging) finalizarSeleccion();
                    }}
                  >
                    <div className="min-w-[900px] grid grid-cols-[60px_repeat(6,1fr)] gap-1" style={{ gridAutoRows: '60px' }}>
                      <div className="p-2"></div>
                      {diasSemana.map((dia) => (
                        <div key={dia} className="text-sm text-center text-white font-semibold p-2 bg-slate-800 rounded">
                          {dia}
                        </div>
                      ))}

                      {horas.map((hora, idx) => (
                        <div
                          key={`time-${hora}`}
                          className="text-xs text-slate-500 flex items-center justify-end pr-2"
                          style={{
                            gridColumn: 1,
                            gridRow: idx + 2
                          }}
                        >
                          {hora}:00
                        </div>
                      ))}

                      {/* Celdas vacías / disponibles - con interacción de selección */}
                      {horas.flatMap((hora, horaIdx) =>
                        diasSemana.map((dia, diaIdx) => {
                          const ocupado = getOcupacionPorHora(espacio.id, dia, hora);
                          const estaSeleccionada = estaEnRangoSeleccion(espacio.id, dia, hora);
                          
                          return (
                            <div
                              key={`cell-${espacio.id}-${dia}-${hora}`}
                              className={`border rounded transition-all ${
                                ocupado 
                                  ? 'border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50' 
                                  : esSupervisor
                                    ? estaSeleccionada
                                      ? 'bg-purple-500 border-purple-700 cursor-grabbing'
                                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/20'
                                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                              }`}
                              style={{
                                gridColumn: diaIdx + 2,
                                gridRow: horaIdx + 2
                              }}
                              onMouseDown={() => {
                                if (!ocupado && esSupervisor) {
                                  iniciarSeleccion(espacio.id, dia, hora);
                                }
                              }}
                              onMouseEnter={() => {
                                if (!ocupado && esSupervisor) {
                                  actualizarSeleccion(espacio.id, dia, hora);
                                }
                              }}
                              onMouseUp={() => {
                                if (esSupervisor) {
                                  finalizarSeleccion();
                                }
                              }}
                            />
                          );
                        })
                      )}

                      {/* Horarios ocupados */}
                      {horarios
                        .filter(h => h.espacioId === espacio.id)
                        .map((ocupacion, idx) => {
                          const colStart = getDayColumnIndex(ocupacion.dia);
                          const rowStart = getHourRowIndex(ocupacion.horaInicio);
                          const rowSpan = ocupacion.horaFin - ocupacion.horaInicio;

                          if (rowStart < 2 || rowStart > 18) return null;

                          // Determinar si es un préstamo o un horario académico
                          const isPrestamo = ocupacion.tipo === 'prestamo';
                          const isPrestamoPendiente = isPrestamo && ocupacion.prestamo?.estado === 'Pendiente';
                          const isPrestamoAprobado = isPrestamo && ocupacion.prestamo?.estado === 'Aprobado';
                          
                          let colorClass = '';
                          let labelText = '';
                          
                          if (isPrestamoPendiente) {
                            colorClass = 'bg-gradient-to-br from-yellow-300 to-yellow-400 hover:from-yellow-400 hover:to-yellow-500 text-slate-900';
                            labelText = 'PENDIENTE';
                          } else if (isPrestamoAprobado) {
                            colorClass = 'bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white';
                            labelText = 'APROBADO';
                          } else if (ocupacion.estado === 'ocupado') {
                            colorClass = 'bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white';
                            labelText = '';
                          } else {
                            colorClass = 'bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white';
                            labelText = '';
                          }

                          return (
                            <TooltipProvider key={`ocup-${idx}`}>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className={`${colorClass} text-white rounded p-2 text-xs cursor-pointer shadow-sm flex flex-col justify-center items-center overflow-hidden h-full text-center`}
                                    style={{
                                      gridColumn: `${colStart} / span 1`,
                                      gridRow: `${rowStart} / span ${rowSpan}`,
                                      zIndex: 10,
                                      minHeight: `${rowSpan * 60}px`
                                    }}
                                  >
                                    {isPrestamo && labelText && (
                                      <p className="text-[8px] font-bold mb-1 bg-white/30 px-1.5 py-0.5 rounded">{labelText}</p>
                                    )}
                                    <p className="font-bold truncate text-xs leading-tight">{ocupacion.materia}</p>
                                    <p className="truncate opacity-90 text-[9px] leading-tight">{ocupacion.docente}</p>
                                    <p className="truncate opacity-75 text-[8px] leading-tight mt-1">{ocupacion.horaInicio}:00 - {ocupacion.horaFin}:00</p>
                                  </motion.div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    {isPrestamo ? (
                                      <>
                                        <p className={`font-semibold text-sm ${isPrestamoPendiente ? 'text-yellow-600' : 'text-green-600'}`}>
                                          PRÉSTAMO {isPrestamoPendiente ? 'PENDIENTE' : 'APROBADO'}
                                        </p>
                                        <p className="text-xs">Actividad: {ocupacion.materia}</p>
                                        <p className="text-xs">Solicitante: {ocupacion.docente || 'No especificado'}</p>
                                        {ocupacion.grupo && <p className="text-xs">Motivo: {ocupacion.grupo}</p>}
                                        {ocupacion.prestamo?.asistentes && (
                                          <p className="text-xs">Asistentes: {ocupacion.prestamo.asistentes}</p>
                                        )}
                                        {ocupacion.prestamo?.telefono && (
                                          <p className="text-xs">Teléfono: {ocupacion.prestamo.telefono}</p>
                                        )}
                                        <p className="text-xs">Horario: {ocupacion.horaInicio}:00 - {ocupacion.horaFin}:00</p>
                                        <p className="text-xs">Fecha: {ocupacion.prestamo?.fecha}</p>
                                      </>
                                    ) : (
                                      <>
                                        <p className="font-semibold text-sm">{ocupacion.materia}</p>
                                        <p className="text-xs">Docente: {ocupacion.docente || 'No asignado'}</p>
                                        <p className="text-xs">Grupo: {ocupacion.grupo || 'N/A'}</p>
                                        <p className="text-xs">Horario: {ocupacion.horaInicio}:00 - {ocupacion.horaFin}:00</p>
                                        <p className="text-xs capitalize">Estado: {ocupacion.estado}</p>
                                      </>
                                    )}
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          );
                        })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal de Nueva Solicitud */}
      <Dialog open={dialogSolicitudOpen} onOpenChange={setDialogSolicitudOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nueva Solicitud de Préstamo</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {formError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{formError}</AlertDescription>
              </Alert>
            )}

            {/* Información del horario seleccionado */}
            {nuevaSolicitudData && (
              <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  Horario Seleccionado
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Espacio:</span>
                    <p className="font-medium">{nuevaSolicitudData.espacio_nombre}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Día:</span>
                    <p className="font-medium">{nuevaSolicitudData.diaSemana}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Fecha:</span>
                    <p className="font-medium">{nuevaSolicitudData.fecha}</p>
                  </div>
                  <div>
                    <span className="text-slate-600 dark:text-slate-400">Horario:</span>
                    <p className="font-medium">{nuevaSolicitudData.horaInicio} - {nuevaSolicitudData.horaFin}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Información Personal */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Información del Solicitante
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nombre del Solicitante</Label>
                  <Input value={user?.nombre || ''} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input value={user?.correo || ''} disabled className="bg-slate-50 dark:bg-slate-800" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono de Contacto</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  placeholder="+57 300 123 4567"
                />
              </div>
            </div>

            {/* Selección de Espacio */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Selección de Espacio
              </h3>
              {espaciosDisponibles.length > 0 ? (
                <div className="space-y-2">
                  <Label>Espacio Disponible *</Label>
                  <Select
                    value={formData.espacio_id > 0 ? formData.espacio_id.toString() : ''}
                    onValueChange={(v) => setFormData({ ...formData, espacio_id: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar espacio disponible" />
                    </SelectTrigger>
                    <SelectContent>
                      {espaciosDisponibles.map(espacio => (
                        <SelectItem key={espacio.id} value={espacio.id.toString()}>
                          {espacio.nombre} - {espacio.tipo} (Capacidad: {espacio.capacidad})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-600 rounded-full"></span>
                    {espaciosDisponibles.length} espacio(s) disponible(s) para este horario
                  </p>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No hay espacios disponibles para la fecha y horario seleccionados.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Detalles de la Actividad */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Detalles de la Actividad
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tipo de Actividad *</Label>
                  <Select
                    value={formData.tipo_actividad_id > 0 ? formData.tipo_actividad_id.toString() : ''}
                    onValueChange={(v) => setFormData({ ...formData, tipo_actividad_id: parseInt(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposActividad.map(tipo => (
                        <SelectItem key={tipo.id} value={tipo.id.toString()}>{tipo.nombre}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Número de Asistentes</Label>
                  <Input
                    type="number"
                    value={formData.asistentes}
                    onChange={(e) => setFormData({ ...formData, asistentes: e.target.value })}
                    placeholder="Ej: 30"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Motivo del Préstamo *</Label>
                <Textarea
                  value={formData.motivo}
                  onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                  placeholder="Describa el motivo de la solicitud (clase adicional, tutoría, evento, etc.)"
                  rows={3}
                />
              </div>
            </div>

            {/* Recursos Adicionales */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 border-b pb-2">
                Recursos Adicionales (Opcional)
              </h3>
              <div className="space-y-4 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Agregar recursos necesarios</Label>
                  <Select onValueChange={(v) => agregarRecurso(parseInt(v))}>
                    <SelectTrigger className="w-[200px]">
                      <SelectValue placeholder="Agregar recurso..." />
                    </SelectTrigger>
                    <SelectContent>
                      {recursosDisponibles.map((recurso) => (
                        <SelectItem key={recurso.id} value={recurso.id!.toString()}>
                          {recurso.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {recursosSeleccionados.length > 0 ? (
                  <div className="space-y-2">
                    {recursosSeleccionados.map((item) => (
                      <div key={item.recurso_id} className="flex items-center justify-between bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {item.recurso_nombre}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarRecurso(item.recurso_id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-3 text-slate-500 dark:text-slate-400 text-sm italic">
                    No has seleccionado ningún recurso
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button variant="outline" onClick={() => setDialogSolicitudOpen(false)}>
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmitSolicitud} 
                disabled={submitting}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white"
              >
                {submitting ? 'Enviando...' : 'Enviar Solicitud'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
