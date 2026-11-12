import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Badge } from '../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '../../../components/ui/tooltip';
import { Calendar, Clock, MapPin, Check, X, Search, User, Mail, Phone, FileText, Users, Package, Sparkles, AlertCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, LayoutGrid, List } from 'lucide-react';
import { motion } from 'motion/react';
import { usePrestamosEspacios } from '../hooks/usePrestamosEspacios';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useAuth } from '../../../context/AuthContext';
import { Loading } from '../../../components/common/Loading';
import { useState, useEffect } from 'react';
import { periodoService, type PeriodoAcademico } from '../../gestionAcademica/services/periodos/periodoAPI';
import {
  maxIntervaloPermitido,
  maxOcurrenciasEnPeriodo,
  diasPorOcurrencia,
  diasRestantesEnPeriodo,
  mesesRestantesEnPeriodo,
  type CustomPeriod,
} from '../../../utils/recurrenceLimits';

import { SolicitudDialog } from '../components/prestamos/SolicitudDialog';
export default function PrestamosEspacios() {
  const isMobile = useIsMobile();
  const { user, hasEditPermission } = useAuth();
  const puedeGestionarPrestamos = hasEditPermission('Préstamos de Espacios');
  const [periodoEdicion, setPeriodoEdicion] = useState<PeriodoAcademico | null>(null);
  const [vista, setVista] = useState<'lista' | 'cuadricula'>('lista');
  const [detalleGridId, setDetalleGridId] = useState<string | null>(null);
  const {
    searchTerm,
    setSearchTerm,
    filterEstado,
    setFilterEstado,
    filterFechaHora,
    setFilterFechaHora,
    filterFechaEspecifica,
    setFilterFechaEspecifica,
    filterPeriodo,
    setFilterPeriodo,
    periodos,
    verSolicitudDialog,
    setVerSolicitudDialog,
    comentariosAccion,
    setComentariosAccion,
    modoEdicion,
    prestamoEditando,
    setPrestamoEditando,
    espaciosDisponibles,
    tiposActividad,
    recursosDisponibles,
    paginatedPrestamos,
    filteredPrestamos,
    totalFilteredPrestamos,
    currentPage,
    totalPages,
    pageNumbers,
    pageSize,
    goToPage,
    goToNextPage,
    goToPrevPage,
    hasPrevPageWindow,
    hasNextPageWindow,
    goToPrevPageWindow,
    goToNextPageWindow,
    statsData,
    aprobarSolicitud,
    rechazarSolicitud,
    iniciarEdicion,
    cancelarEdicion,
    guardarEdicion,
    eliminarSolicitud,
    loading
  } = usePrestamosEspacios();

  const fechaEnEdicion = prestamoEditando?.fecha;
  useEffect(() => {
    if (!fechaEnEdicion) {
      setPeriodoEdicion(null);
      return;
    }
    let cancelado = false;
    periodoService.periodoPorRangoFechas(fechaEnEdicion, fechaEnEdicion)
      .then((response) => {
        if (!cancelado) setPeriodoEdicion(response.periodos?.[0] ?? null);
      })
      .catch(() => {
        if (!cancelado) setPeriodoEdicion(null);
      });
    return () => { cancelado = true; };
  }, [fechaEnEdicion]);

  const frecuenciaAMaxIntervalo = (frecuencia: string | undefined): number | null => {
    if (!fechaEnEdicion || !periodoEdicion) return null;
    const customPeriod: CustomPeriod =
      frecuencia === 'daily' || frecuencia === 'weekdays' ? 'day'
        : frecuencia === 'weekly' ? 'week'
        : 'month';
    return maxIntervaloPermitido(customPeriod, fechaEnEdicion, periodoEdicion);
  };

  const frecuenciaCabeEnPeriodo = (frecuencia: string): boolean => {
    if (!fechaEnEdicion || !periodoEdicion) return true;
    if (frecuencia === 'none') return true;
    if (frecuencia === 'daily' || frecuencia === 'weekdays') return diasRestantesEnPeriodo(fechaEnEdicion, periodoEdicion) >= 1;
    if (frecuencia === 'weekly') return diasRestantesEnPeriodo(fechaEnEdicion, periodoEdicion) >= 7;
    if (frecuencia === 'monthly') return mesesRestantesEnPeriodo(fechaEnEdicion, periodoEdicion) >= 1;
    return true;
  };

  const frecuenciaAMaxOcurrencias = (frecuencia: string | undefined, intervalo: number): number | null => {
    if (!fechaEnEdicion || !periodoEdicion) return null;
    const dias = frecuencia === 'daily' || frecuencia === 'weekdays' ? diasPorOcurrencia('daily', intervalo)
      : frecuencia === 'weekly' ? diasPorOcurrencia('weekly', intervalo)
      : diasPorOcurrencia('monthly', intervalo);
    return maxOcurrenciasEnPeriodo(dias, fechaEnEdicion, periodoEdicion);
  };

  const FRECUENCIA_LABELS: Record<string, string> = {
    none: 'No se repite',
    daily: 'Diario',
    weekly: 'Semanal',
    monthly: 'Mensual',
    yearly: 'Anual',
    weekdays: 'Días laborales'
  };

  const FIN_LABELS: Record<string, string> = {
    never: 'Nunca',
    until_date: 'Hasta una fecha',
    count: 'Después de N repeticiones'
  };

  const DIAS_LABELS: Record<number, string> = {
    0: 'Lunes',
    1: 'Martes',
    2: 'Miércoles',
    3: 'Jueves',
    4: 'Viernes',
    5: 'Sábado',
    6: 'Domingo'
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recurrenceSummary = (prestamo: any) => {
    if (!prestamo?.es_recurrente) return 'No se repite';
    const freq = FRECUENCIA_LABELS[prestamo.frecuencia || 'none']?.toLowerCase() || 'semanal';
    const interval = prestamo.intervalo || 1;
    const cada = `Cada ${interval} ${freq}`;
    const dias = prestamo.frecuencia === 'weekly' && Array.isArray(prestamo.dias_semana) && prestamo.dias_semana.length > 0
      ? ` (${prestamo.dias_semana.map((d: number) => DIAS_LABELS[d]).join(', ')})`
      : '';
    let fin = FIN_LABELS[prestamo.fin_repeticion_tipo || 'never'] || 'Nunca';
    if (prestamo.fin_repeticion_tipo === 'until_date' && prestamo.fin_repeticion_fecha) {
      fin = `Hasta ${new Date(prestamo.fin_repeticion_fecha + 'T00:00:00').toLocaleDateString('es-CO')}`;
    }
    if (prestamo.fin_repeticion_tipo === 'count' && prestamo.fin_repeticion_ocurrencias) {
      fin = `${prestamo.fin_repeticion_ocurrencias} repeticiones`;
    }
    return `${cada}${dias}. ${fin}.`;
  };

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Clock className="w-3 h-3 mr-1" />Pendiente</Badge>;
      case 'aprobado':
        return <Badge className="bg-green-100 text-green-800 border-green-300"><Check className="w-3 h-3 mr-1" />Aprobado</Badge>;
      case 'rechazado':
        return <Badge className="bg-red-100 text-red-800 border-red-300"><X className="w-3 h-3 mr-1" />Rechazado</Badge>;
      default:
        return null;
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'pendiente':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'aprobado':
        return <Check className="w-5 h-5 text-green-600" />;
      case 'rechazado':
        return <X className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Préstamos de Espacios</h1>
        <p className="text-slate-600 dark:text-slate-400">Gestiona las solicitudes de préstamos temporales de espacios para eventos especiales</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">{stat.title}</p>
                    <p className="text-3xl text-slate-900 dark:text-slate-100">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} ${stat.textColor} p-3 rounded-xl`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                </div>
                <div className={`mt-4 h-1 rounded-full bg-gradient-to-r ${stat.color}`} />
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px] relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar por solicitante, espacio o tipo de evento..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select
              value={filterFechaHora}
              onValueChange={(value) => {
                setFilterFechaHora(value);
                if (value !== 'fecha-especifica') setFilterFechaEspecifica('');
              }}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Fecha y Hora" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las fechas</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="esta-semana">Esta semana</SelectItem>
                <SelectItem value="este-mes">Este mes</SelectItem>
                <SelectItem value="proximos">Próximos</SelectItem>
                <SelectItem value="pasados">Pasados</SelectItem>
                <SelectItem value="fecha-especifica">Fecha específica</SelectItem>
              </SelectContent>
            </Select>
            {filterFechaHora === 'fecha-especifica' && (
              <Input
                type="date"
                value={filterFechaEspecifica}
                onChange={(e) => setFilterFechaEspecifica(e.target.value)}
                className="w-[200px]"
              />
            )}
            <Select value={filterEstado} onValueChange={setFilterEstado}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="aprobado">Aprobados</SelectItem>
                <SelectItem value="rechazado">Rechazados</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPeriodo} onValueChange={setFilterPeriodo}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Periodo académico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los periodos</SelectItem>
                {periodos.map((periodo) => (
                  <SelectItem key={periodo.id} value={String(periodo.id)}>
                    {periodo.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1 border border-slate-200 dark:border-slate-700 rounded-lg p-1">
              <Button
                type="button"
                variant={vista === 'lista' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVista('lista')}
                title="Vista lista"
              >
                <List className="w-4 h-4 mr-2" />
                Vista Lista
              </Button>
              <Button
                type="button"
                variant={vista === 'cuadricula' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setVista('cuadricula')}
                title="Vista cuadrícula"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Vista Cuadrícula
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Solicitudes Lista */}
      {vista === 'lista' && (
      <div className="grid grid-cols-1 gap-4">
        {loading && totalFilteredPrestamos === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent>
              <Loading message="Cargando solicitudes de préstamo..." />
            </CardContent>
          </Card>
        ) : totalFilteredPrestamos === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No hay solicitudes que mostrar</p>
            </CardContent>
          </Card>
        ) : (
          paginatedPrestamos.map((prestamo) => (
            <motion.div
              key={prestamo.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  {(() => {
                    const solicitanteEsAdmin = Boolean(
                      user?.correo &&
                      prestamo.email &&
                      prestamo.email.toLowerCase() === user.correo.toLowerCase()
                    );
                    // La edición ya no está restringida por estado (incluye 'aprobado'):
                    // el backend decide si el préstamo permanece Aprobado o vuelve a Pendiente
                    // según si quien edita tiene permiso EDITAR en "Disponibilidad de Espacios".
                    const puedeEditarEliminar = puedeGestionarPrestamos || solicitanteEsAdmin;

                    return (
                  <div className="flex items-start justify-between gap-6">
                    {/* Left Section */}
                    <div className="flex-1 space-y-4">
                      {/* Header con Solicitante y Estado */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                            <User className="w-6 h-6" />
                          </div>
                          <div>
                            <h3 className="text-slate-900 dark:text-slate-100">{prestamo.solicitante}</h3>
                            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                              <Mail className="w-3 h-3" />
                              {prestamo.email}
                            </div>
                            {prestamo.telefono && (
                              <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                <Phone className="w-3 h-3" />
                                {prestamo.telefono}
                              </div>
                            )}
                          </div>
                        </div>
                        {getEstadoBadge(prestamo.estado)}
                      </div>

                      {/* Detalles del Evento */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-950/20 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Espacio</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.espacio}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-950/20 flex items-center justify-center">
                            <Calendar className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Fecha</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.fecha}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-orange-50 dark:bg-orange-950/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Horario</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-950/20 flex items-center justify-center">
                            <Users className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Asistentes</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.asistentes}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tipo de Evento y Recursos */}
                      <div className="flex items-center gap-4 flex-wrap">
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100">
                          <Sparkles className="w-3 h-3 mr-1" />
                          {prestamo.tipoEvento}
                        </Badge>
                        {prestamo.recursosNecesarios.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <Package className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <div className="flex flex-wrap gap-1">
                              {prestamo.recursosNecesarios.map((recurso, idx) => (
                                <Badge
                                  key={idx}
                                  variant="outline"
                                  className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs"
                                >
                                  {recurso}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Motivo */}
                      <div className="bg-slate-50 dark:bg-slate-900/30 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
                        <div className="flex items-start gap-2">
                          <FileText className="w-4 h-4 text-slate-400 mt-0.5" />
                          <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Motivo</p>
                            <p className="text-sm text-slate-900 dark:text-slate-100">{prestamo.motivo}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Ver Solicitud Button */}
                    <div className="flex flex-col items-end gap-2">
                      <SolicitudDialog prestamo={prestamo} aprobarSolicitud={aprobarSolicitud} cancelarEdicion={cancelarEdicion} comentariosAccion={comentariosAccion} eliminarSolicitud={eliminarSolicitud} espaciosDisponibles={espaciosDisponibles} guardarEdicion={guardarEdicion} iniciarEdicion={iniciarEdicion} modoEdicion={modoEdicion} prestamoEditando={prestamoEditando} rechazarSolicitud={rechazarSolicitud} recursosDisponibles={recursosDisponibles} setComentariosAccion={setComentariosAccion} setPrestamoEditando={setPrestamoEditando} setVerSolicitudDialog={setVerSolicitudDialog} tiposActividad={tiposActividad} verSolicitudDialog={verSolicitudDialog} DIAS_LABELS={DIAS_LABELS} frecuenciaAMaxIntervalo={frecuenciaAMaxIntervalo} frecuenciaCabeEnPeriodo={frecuenciaCabeEnPeriodo} frecuenciaAMaxOcurrencias={frecuenciaAMaxOcurrencias} recurrenceSummary={recurrenceSummary} getEstadoBadge={getEstadoBadge} getEstadoIcon={getEstadoIcon} periodoEdicion={periodoEdicion} puedeEditarEliminar={puedeEditarEliminar} puedeGestionarPrestamos={puedeGestionarPrestamos} />

                      <span className="text-xs text-slate-500 dark:text-slate-400">
                        {prestamo.fechaSolicitud}
                      </span>
                    </div>
                  </div>
                    );
                  })()}
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
      )}

      {/* Solicitudes Cuadrícula */}
      {vista === 'cuadricula' && (
        loading && totalFilteredPrestamos === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent>
              <Loading message="Cargando solicitudes de préstamo..." />
            </CardContent>
          </Card>
        ) : totalFilteredPrestamos === 0 ? (
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-12 text-center">
              <AlertCircle className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No hay solicitudes que mostrar</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {[...filteredPrestamos]
              .sort((a, b) => {
                const fechaHoraA = `${a.fecha}T${a.horaInicio}`;
                const fechaHoraB = `${b.fecha}T${b.horaInicio}`;
                return fechaHoraA.localeCompare(fechaHoraB);
              })
              .map((prestamo) => (
                <Tooltip key={prestamo.id}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => setDetalleGridId(prestamo.id)}
                      className={`text-left p-3 rounded-lg border transition-shadow hover:shadow-md bg-white dark:bg-slate-800 ${
                        prestamo.estado === 'pendiente'
                          ? 'border-yellow-300 dark:border-yellow-700'
                          : prestamo.estado === 'aprobado'
                            ? 'border-green-300 dark:border-green-700'
                            : 'border-red-300 dark:border-red-700'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        {getEstadoIcon(prestamo.estado)}
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          {new Date(`${prestamo.fecha}T00:00:00`).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                        </span>
                      </div>
                      <p className="text-xs text-slate-900 dark:text-slate-100 truncate">{prestamo.espacio}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{prestamo.solicitante}</p>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <p className="font-medium">{prestamo.tipoEvento}</p>
                    <p>{prestamo.espacio} · {prestamo.fecha} · {prestamo.horaInicio}-{prestamo.horaFin}</p>
                    <p>{prestamo.solicitante}</p>
                    {prestamo.motivo && <p className="opacity-80">{prestamo.motivo}</p>}
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
        )
      )}

      {/* Detalle de solicitud (vista cuadrícula) */}
      <Dialog open={detalleGridId !== null} onOpenChange={(open) => { if (!open) setDetalleGridId(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {(() => {
            const prestamo = filteredPrestamos.find((p) => p.id === detalleGridId);
            if (!prestamo) return null;
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="text-2xl flex items-center gap-2">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${prestamo.estado === 'pendiente' ? 'bg-yellow-50 dark:bg-yellow-950/20' :
                        prestamo.estado === 'aprobado' ? 'bg-green-50 dark:bg-green-950/20' :
                          'bg-red-50 dark:bg-red-950/20'
                      }`}>
                      {getEstadoIcon(prestamo.estado)}
                    </div>
                    Detalles de la Solicitud
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                    <span className="text-sm text-slate-600 dark:text-slate-400">Estado actual</span>
                    {getEstadoBadge(prestamo.estado)}
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <User className="w-5 h-5 text-blue-600" />
                      Información del Solicitante
                    </h3>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Nombre</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.solicitante}</p>
                      </div>
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Email</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.email}</p>
                      </div>
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Teléfono</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.telefono}</p>
                      </div>
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Fecha de Solicitud</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.fechaSolicitud}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      Detalles del Evento
                    </h3>
                    <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Espacio Solicitado</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.espacio}</p>
                      </div>
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Tipo de Evento</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.tipoEvento}</p>
                      </div>
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Fecha</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.fecha}</p>
                      </div>
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Horario</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.horaInicio} - {prestamo.horaFin}</p>
                      </div>
                      <div>
                        <Label className="text-slate-600 dark:text-slate-400 text-xs">Asistentes</Label>
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.asistentes}</p>
                      </div>
                      {prestamo.periodo_nombre && (
                        <div>
                          <Label className="text-slate-600 dark:text-slate-400 text-xs">Periodo académico</Label>
                          <p className="text-slate-900 dark:text-slate-100">{prestamo.periodo_nombre}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {prestamo.recursosNecesarios.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Package className="w-5 h-5 text-blue-600" />
                        Recursos Necesarios
                      </h3>
                      <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        {prestamo.recursosNecesarios.map((recurso, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200"
                          >
                            {recurso}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {prestamo.motivo && (
                    <div className="space-y-3">
                      <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-slate-600" />
                        Motivo
                      </h3>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-900 dark:text-slate-100">{prestamo.motivo}</p>
                      </div>
                    </div>
                  )}

                  {prestamo.es_recurrente && (
                    <div className="space-y-3">
                      <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                        Repetición
                      </h3>
                      <div className="p-4 bg-slate-50 dark:bg-slate-900/30 rounded-lg border border-slate-200 dark:border-slate-700">
                        <p className="text-slate-900 dark:text-slate-100 text-sm">{recurrenceSummary(prestamo)}</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

      {vista === 'lista' && totalFilteredPrestamos > 0 && (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando {totalFilteredPrestamos === 0 ? 0 : (currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalFilteredPrestamos)} de {totalFilteredPrestamos} solicitudes
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPageWindow}
                    disabled={!hasPrevPageWindow}
                    className="px-2"
                    title="Ver números de página anteriores"
                    aria-label="Grupo anterior de páginas"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1 flex-wrap">
                    {pageNumbers.map((page) => (
                      <Button
                        key={page}
                        type="button"
                        variant={page === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={goToNextPageWindow}
                    disabled={!hasNextPageWindow}
                    className="px-2"
                    title="Ver números de página siguientes"
                    aria-label="Grupo siguiente de páginas"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage >= totalPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
