import { useEffect, useState, useCallback, useMemo } from 'react';
import { useAsignacionEspaciosSeccional } from '../../hooks/horarios/useAsignacionEspaciosSeccional';
import type { HorarioAsignacion } from '../../services/horarios/asignacionEspaciosService';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { SearchableSelect } from '../../share/searchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../share/dialog';
import { Alert, AlertDescription, AlertTitle } from '../../share/alert';
import { Badge } from '../../share/badge';
import { Checkbox } from '../../share/checkbox';
import { Label } from '../../share/label';
import { MapPin, RefreshCw, AlertCircle, Clock, Users, BookOpen, CalendarDays, Check } from 'lucide-react';
import { Pagination } from '../../components/common/Pagination';
import { EspaciosDisponiblesTable } from '../../components/horarios/EspaciosDisponiblesTable';

export default function AsignacionEspaciosSeccionalPage() {
  const isMobile = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);
  
  // Pagination state for horarios table
  const [currentPageHorarios, setCurrentPageHorarios] = useState(1);
  const [itemsPerPageHorarios, setItemsPerPageHorarios] = useState(10);

  // Pagination state for espacios table
  const [currentPageEspacios, setCurrentPageEspacios] = useState(1);
  const [itemsPerPageEspacios, setItemsPerPageEspacios] = useState(8);

  // Filter state for espacios
  const [filtroEspacioId, setFiltroEspacioId] = useState<string>('all');

  const {
    horarios,
    espaciosDisponibles,
    filtros,
    horarioSeleccionado,
    espacioSeleccionado,
    loadingHorarios,
    loadingEspacios,
    loadingAsignacion,
    error,
    successMessage,
    setFiltros,
    seleccionarHorario,
    consultarEspaciosDisponibles,
    asignarEspacio,
    limpiarSeleccion,
    recargarHorarios,
    setEspacioSeleccionado,
    programas,
    grupos,
    asignaturas,
    periodos,
    diasSemana,
  } = useAsignacionEspaciosSeccional();

  // Force reload function
  const handleForceReload = useCallback(async () => {
    // Clear cache and reload
    localStorage.removeItem('sihul_cache_asignacion-espacios-seccional-horarios');
    localStorage.removeItem('sihul_cache_asignacion-espacios-seccional-filtros');
    await recargarHorarios();
  }, [recargarHorarios]);

  useEffect(() => {
    if (!successMessage) return;
    setModalOpen(false);
    limpiarSeleccion();
    setCurrentPageHorarios(1);
    setCurrentPageEspacios(1);
    setFiltroEspacioId('all');
  }, [successMessage, limpiarSeleccion]);

  useEffect(() => {
    setCurrentPageHorarios(1);
  }, [filtros]);

  const handleAbrirAsignacion = async (horario: HorarioAsignacion) => {
    seleccionarHorario(horario);
    setModalOpen(true);
    await consultarEspaciosDisponibles(horario);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    setCurrentPageEspacios(1);
    setFiltroEspacioId('all');
    limpiarSeleccion();
  };

  const handleConfirmar = async () => {
    await asignarEspacio();
  };

  const resolveEstadoBadge = (estado?: string) => {
    if (!estado) return null;

    const normalized = estado.toLowerCase();
    if (normalized === 'aprobado') {
      return <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 font-medium">Aprobado</Badge>;
    }

    if (normalized === 'pendiente') {
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200 font-medium">Pendiente</Badge>;
    }

    if (normalized === 'rechazado') {
      return <Badge className="bg-red-100 text-red-700 border-red-200 font-medium">Rechazado</Badge>;
    }

    return <Badge variant="outline">{estado}</Badge>;
  };

  // Memoizar paginación para evitar recálculos
  const horariosPaginados = useMemo(() => {
    return horarios.slice(
      (currentPageHorarios - 1) * itemsPerPageHorarios,
      currentPageHorarios * itemsPerPageHorarios
    );
  }, [horarios, currentPageHorarios, itemsPerPageHorarios]);

  // Memoizar total de páginas
  const totalPagesHorarios = useMemo(() => {
    return Math.ceil(horarios.length / itemsPerPageHorarios);
  }, [horarios.length, itemsPerPageHorarios]);

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900">Asignación de espacios por seccional</h1>
        <p className="text-slate-600">Asigna espacios físicos a horarios académicos según período, programa, día y franja horaria.</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertTitle>Operación exitosa</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}

      <Card className="border-slate-200 shadow-md hover:shadow-lg transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white border-b-4 border-red-800 pb-4">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
            <div>
              <CardTitle className="text-white flex items-center gap-3 text-lg">
                <div className="w-1.5 h-7 bg-white rounded-full opacity-80"></div>
                Filtros de búsqueda avanzada
              </CardTitle>
              <p className="text-red-100 text-sm mt-2">Filtra horarios por programa, grupo, asignatura, período y día</p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-red-100 hover:text-white transition-colors cursor-pointer">
                <Checkbox
                  checked={!!filtros.soloSinEspacio}
                  onCheckedChange={(value) => setFiltros({ soloSinEspacio: Boolean(value) })}
                  className="cursor-pointer w-5 h-5 border-red-200 data-[state=checked]:bg-white data-[state=checked]:text-red-700"
                />
                <span className="font-semibold whitespace-nowrap">📌 Solo horarios sin espacio</span>
              </label>

              <Button
                onClick={handleForceReload}
                className="bg-white text-red-700 hover:bg-red-50 transition-all shadow-lg hover:shadow-xl font-semibold"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar resultados
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 bg-gradient-to-br from-white via-red-50/30 to-white">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Programa</Label>
              <SearchableSelect
                items={[{ id: null, nombre: 'Todos' }, ...programas]}
                value={filtros.programaId}
                onSelect={(item) => setFiltros({ programaId: item.id, grupoId: null })}
                getItemId={(item) => item.id ?? 'all'}
                getItemLabel={(item) => item.nombre}
                placeholder="Todos"
                searchPlaceholder="Buscar programa..."
                emptyMessage="No se encontró ningún programa."
                clearable
                onClear={() => setFiltros({ programaId: null, grupoId: null })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Grupo</Label>
              <SearchableSelect
                items={[{ id: null, nombre: 'Todos' }, ...grupos]}
                value={filtros.grupoId}
                onSelect={(item) => setFiltros({ grupoId: item.id })}
                getItemId={(item) => item.id ?? 'all'}
                getItemLabel={(item) => item.nombre}
                placeholder="Todos"
                searchPlaceholder="Buscar grupo..."
                emptyMessage="No se encontró ningún grupo."
                clearable
                onClear={() => setFiltros({ grupoId: null })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Asignatura</Label>
              <SearchableSelect
                items={[{ id: null, nombre: 'Todas' }, ...asignaturas]}
                value={filtros.asignaturaId}
                onSelect={(item) => setFiltros({ asignaturaId: item.id })}
                getItemId={(item) => item.id ?? 'all'}
                getItemLabel={(item) => item.nombre}
                placeholder="Todas"
                searchPlaceholder="Buscar asignatura..."
                emptyMessage="No se encontró ninguna asignatura."
                clearable
                onClear={() => setFiltros({ asignaturaId: null })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Día</Label>
              <SearchableSelect
                items={[{ valor: null, nombre: 'Todos' }, ...diasSemana.map(d => ({ valor: d, nombre: d }))]}
                value={filtros.diaSemana}
                onSelect={(item) => setFiltros({ diaSemana: item.valor })}
                getItemId={(item) => item.valor ?? 'all'}
                getItemLabel={(item) => item.nombre}
                placeholder="Todos"
                searchPlaceholder="Buscar día..."
                emptyMessage="No se encontró ningún día."
                clearable
                onClear={() => setFiltros({ diaSemana: null })}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-red-700 uppercase tracking-wider">Período</Label>
              <SearchableSelect
                items={[{ id: null, nombre: 'Todos' }, ...periodos]}
                value={filtros.periodoId}
                onSelect={(item) => setFiltros({ periodoId: item.id })}
                getItemId={(item) => item.id ?? 'all'}
                getItemLabel={(item) => item.nombre}
                placeholder="Todos"
                searchPlaceholder="Buscar período..."
                emptyMessage="No se encontró ningún período."
                clearable
                onClear={() => setFiltros({ periodoId: null })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-300 shadow-lg hover:shadow-xl transition-all duration-300">
        <CardHeader className="bg-gradient-to-r from-red-700 via-red-600 to-rose-700 text-white border-b-4 border-red-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-3 h-8 bg-white rounded-full opacity-80"></div>
              <div>
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <CalendarDays className="w-6 h-6" />
                  Horarios sin asignar
                </CardTitle>
                <p className="text-red-100 text-sm mt-1">
                  Total: <span className="font-bold text-white text-base">{horarios.length}</span> horarios encontrados
                </p>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="lg:hidden bg-white rounded-b-xl border-t border-red-100">
            {loadingHorarios && horarios.length === 0 ? (
              <div className="text-center text-slate-500 py-12 bg-white">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                  <span className="text-base font-medium">Cargando horarios...</span>
                </div>
              </div>
            ) : null}

            {!loadingHorarios && horarios.length === 0 ? (
              <div className="text-center text-slate-500 py-12 bg-white">
                <div className="text-base font-medium">No se encontraron horarios para los filtros seleccionados.</div>
              </div>
            ) : null}

            <div className="divide-y divide-red-100">
              {horariosPaginados.map((horario, idx) => (
                <div
                  key={horario.id}
                  className={`p-3 space-y-2 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}`}
                >
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div><span className="font-semibold text-slate-700">Seccional:</span> {horario.seccional_nombre || 'Sin seccional'}</div>
                    <div><span className="font-semibold text-slate-700">Sede:</span> {horario.sede_nombre || 'Sin sede'}</div>
                    <div><span className="font-semibold text-slate-700">Programa:</span> {horario.programa_nombre}</div>
                    <div><span className="font-semibold text-slate-700">Grupo:</span> {horario.grupo_nombre}</div>
                    <div className="col-span-2"><span className="font-semibold text-slate-700">Asignatura:</span> {horario.asignatura_nombre}</div>
                    <div className="col-span-2"><span className="font-semibold text-slate-700">Docente:</span> {horario.docente_nombre || 'Sin asignar'}</div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium text-[10px] px-1.5 py-0">
                      {horario.dia_semana}
                    </Badge>
                    <span className="text-[11px] font-mono text-slate-600">{horario.hora_inicio} - {horario.hora_fin}</span>
                    {horario.espacio_nombre ? (
                      <Badge className="bg-red-100 text-red-800 border-red-200 font-medium text-[10px] px-1.5 py-0">
                        {horario.espacio_nombre}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-medium text-[10px] px-1.5 py-0">
                        Sin asignar
                      </Badge>
                    )}
                    {resolveEstadoBadge(horario.estado)}
                  </div>

                  <Button
                    size="sm"
                    className="w-full h-8 px-2 text-[11px] whitespace-nowrap bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all shadow-sm hover:shadow font-semibold"
                    onClick={() => handleAbrirAsignacion(horario)}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1" />
                    {horario.espacio_id ? 'Cambiar espacio' : 'Asignar espacio'}
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block overflow-hidden bg-white rounded-b-xl border-t border-red-100">
            <Table className="w-full table-fixed text-[11px] leading-tight [&_th]:text-center [&_td]:text-center [&_th]:align-middle [&_td]:align-middle [&_th]:py-2 [&_td]:py-2 [&_th]:px-1 [&_td]:px-1.5 [&_td]:whitespace-normal [&_td]:break-words">
              <TableHeader>
                <TableRow className="bg-red-50 hover:bg-red-50 border-b border-red-200">
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Seccional</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Sede</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Programa</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Asignatura</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Grupo</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Docente</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Día</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Inicio</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Fin</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Espacio</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Estado</TableHead>
                  <TableHead className="text-red-900 font-semibold text-[10px] uppercase tracking-wide">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingHorarios && horarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-slate-500 py-12 bg-white">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin" />
                        <span className="text-base font-medium">Cargando horarios...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!loadingHorarios && horarios.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={12} className="text-center text-slate-500 py-12 bg-white">
                      <div className="text-base font-medium">No se encontraron horarios para los filtros seleccionados.</div>
                    </TableCell>
                  </TableRow>
                ) : null}

                {/* Skeleton loader para desktop */}
                {loadingHorarios && horarios.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={12} className="py-4">
                      <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <div key={idx} className="flex gap-2 animate-pulse">
                            <div className="h-8 bg-red-100 rounded flex-1"></div>
                            <div className="h-8 bg-red-50 rounded w-24"></div>
                            <div className="h-8 bg-red-50 rounded w-32"></div>
                            <div className="h-8 bg-red-50 rounded w-20"></div>
                            <div className="h-8 bg-red-50 rounded w-16"></div>
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                )}

                {horariosPaginados.map((horario, idx) => (
                  <TableRow
                    key={horario.id}
                    className={`transition-colors border-b border-slate-200 ${
                      idx % 2 === 0
                        ? 'bg-white hover:bg-red-50/70'
                        : 'bg-slate-50/60 hover:bg-red-50/70'
                    }`}
                  >
                    <TableCell className="text-slate-900 font-bold text-[11px]">
                      <span className="bg-red-100 text-red-800 border border-red-200 px-1.5 py-0.5 rounded-md font-semibold text-[10px]">
                        {horario.seccional_nombre || 'Sin seccional'}
                      </span>
                    </TableCell>
                    <TableCell className="text-slate-700 font-medium text-[11px]">{horario.sede_nombre || 'Sin sede'}</TableCell>
                    <TableCell className="text-slate-600 text-[11px]" title={horario.programa_nombre}>
                      {horario.programa_nombre}
                    </TableCell>
                    <TableCell className="text-slate-600 text-[11px]" title={horario.asignatura_nombre}>
                      {horario.asignatura_nombre}
                    </TableCell>
                    <TableCell className="text-slate-600 text-[11px] font-medium">{horario.grupo_nombre}</TableCell>
                    <TableCell className="text-slate-600 text-[11px] flex items-center justify-center gap-1.5">
                      <div className="w-2 h-2 bg-red-500 rounded-full" />
                      {horario.docente_nombre}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 font-medium text-[10px] px-1.5 py-0">
                        {horario.dia_semana}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600 text-[11px] font-mono">
                      <div className="flex items-center justify-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-red-500" />
                        {horario.hora_inicio}
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600 text-[11px] font-mono">
                      <div className="flex items-center justify-center">{horario.hora_fin}</div>
                    </TableCell>
                    <TableCell>
                      {horario.espacio_nombre ? (
                        <Badge className="bg-red-100 text-red-800 border-red-200 font-medium text-[10px] px-1.5 py-0">
                          {horario.espacio_nombre}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-300 font-medium text-[10px] px-1.5 py-0">
                          Sin asignar
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{resolveEstadoBadge(horario.estado)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[10px] whitespace-nowrap bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all shadow-sm hover:shadow font-semibold"
                        onClick={() => handleAbrirAsignacion(horario)}
                      >
                        <MapPin className="w-3.5 h-3.5 mr-1" />
                        {horario.espacio_id ? 'Cambiar' : 'Asignar'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {horarios.length > itemsPerPageHorarios && (
            <Pagination
              currentPage={currentPageHorarios}
              totalPages={totalPagesHorarios}
              onPageChange={setCurrentPageHorarios}
              itemsPerPage={itemsPerPageHorarios}
              onItemsPerPageChange={setItemsPerPageHorarios}
              totalItems={horarios.length}
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(value) => (value ? setModalOpen(true) : handleCerrarModal())}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="bg-gradient-to-r from-red-50 to-rose-50 -mx-6 -mt-6 px-6 pt-6 pb-4 mb-6 border-b border-slate-200">
            <DialogTitle className="flex items-center gap-2 text-lg">
              <MapPin className="w-5 h-5 text-red-600" />
              Asignar espacio disponible
            </DialogTitle>
          </DialogHeader>

          {horarioSeleccionado ? (
            <div className="space-y-6">
              <Card className="border-slate-200 bg-gradient-to-br from-red-50 to-rose-50">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Programa</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {horarioSeleccionado.programa_nombre}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-5 h-5 text-purple-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Asignatura</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {horarioSeleccionado.asignatura_nombre}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Users className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Grupo</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {horarioSeleccionado.grupo_nombre}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CalendarDays className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Día</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {horarioSeleccionado.dia_semana}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Hora</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {horarioSeleccionado.hora_inicio} - {horarioSeleccionado.hora_fin}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-slate-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-medium text-slate-600 uppercase tracking-wide">Espacio actual</p>
                        <p className="text-sm font-semibold text-slate-900 mt-0.5">
                          {horarioSeleccionado.espacio_nombre || (
                            <span className="text-orange-600">Sin asignar</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-red-600" />
                    Espacios disponibles
                    {!loadingEspacios && espaciosDisponibles.length > 0 && (
                      <Badge className="bg-red-100 text-red-800 ml-2">
                        {espaciosDisponibles.length} espacios
                      </Badge>
                    )}
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      consultarEspaciosDisponibles(horarioSeleccionado);
                      setFiltroEspacioId('all');
                    }}
                    disabled={loadingEspacios}
                    className="border-red-200 hover:bg-red-50"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${loadingEspacios ? 'animate-spin' : ''}`} />
                    {loadingEspacios ? 'Buscando...' : 'Actualizar'}
                  </Button>
                </div>

                {/* Filtro de espacios */}
                {!loadingEspacios && espaciosDisponibles.length > 0 && (
                  <div className="mb-4">
                    <SearchableSelect
                      items={[
                        { id: 'all', nombre: `Todos los espacios (${espaciosDisponibles.length})` },
                        ...espaciosDisponibles.map(e => ({
                          id: e.id.toString(),
                          nombre: `${e.nombre} - ${e.sede_nombre || 'Sin sede'} (Cap: ${e.capacidad})`
                        }))
                      ]}
                      value={filtroEspacioId}
                      onSelect={(item) => setFiltroEspacioId(item.id)}
                      getItemId={(item) => item.id}
                      getItemLabel={(item) => item.nombre}
                      placeholder="Filtrar espacio por nombre..."
                      searchPlaceholder="Buscar espacio..."
                      emptyMessage="No se encontró ningún espacio"
                    />
                  </div>
                )}

                <EspaciosDisponiblesTable
                  espacios={(filtroEspacioId === 'all' 
                    ? espaciosDisponibles 
                    : espaciosDisponibles.filter(e => e.id.toString() === filtroEspacioId)
                  ).slice(
                    (currentPageEspacios - 1) * itemsPerPageEspacios,
                    currentPageEspacios * itemsPerPageEspacios
                  )}
                  espacioSeleccionado={espacioSeleccionado}
                  onSelectEspacio={setEspacioSeleccionado}
                  loading={loadingEspacios}
                />

                {espaciosDisponibles.length > itemsPerPageEspacios && (
                  <div className="mt-4">
                    <Pagination
                      currentPage={currentPageEspacios}
                      totalPages={Math.ceil(espaciosDisponibles.length / itemsPerPageEspacios)}
                      onPageChange={setCurrentPageEspacios}
                      itemsPerPage={itemsPerPageEspacios}
                      onItemsPerPageChange={setItemsPerPageEspacios}
                      totalItems={espaciosDisponibles.length}
                    />
                  </div>
                )}

                {espacioSeleccionado && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-semibold text-red-900">Espacio seleccionado:</p>
                      <p className="text-red-800">
                        {espacioSeleccionado.nombre} ({espacioSeleccionado.sede_nombre || 'Sin sede'}) •{' '}
                        <span className="font-medium">Capacidad: {espacioSeleccionado.capacidad}</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0 bg-slate-50 -mx-6 -mb-6 px-6 py-4 border-t border-slate-200 mt-6">
            <Button
              variant="outline"
              onClick={handleCerrarModal}
              className="border-slate-300 hover:bg-slate-100"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={!horarioSeleccionado || !espacioSeleccionado || loadingAsignacion}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white transition-all shadow-md hover:shadow-lg disabled:opacity-50"
            >
              {loadingAsignacion ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Asignando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar asignación
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
