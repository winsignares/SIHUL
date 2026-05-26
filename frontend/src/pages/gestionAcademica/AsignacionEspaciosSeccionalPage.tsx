import { useEffect, useState } from 'react';
import { useAsignacionEspaciosSeccional } from '../../hooks/horarios/useAsignacionEspaciosSeccional';
import type { HorarioAsignacion } from '../../services/horarios/asignacionEspaciosService';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../share/dialog';
import { Alert, AlertDescription, AlertTitle } from '../../share/alert';
import { Badge } from '../../share/badge';
import { Checkbox } from '../../share/checkbox';
import { Label } from '../../share/label';
import { MapPin, RefreshCw, AlertCircle } from 'lucide-react';

export default function AsignacionEspaciosSeccionalPage() {
  const isMobile = useIsMobile();
  const [modalOpen, setModalOpen] = useState(false);

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
    seccionales,
    programas,
    grupos,
    docentes,
    asignaturas,
    periodos,
    diasSemana,
  } = useAsignacionEspaciosSeccional();

  useEffect(() => {
    if (!successMessage) return;
    setModalOpen(false);
    limpiarSeleccion();
  }, [successMessage, limpiarSeleccion]);

  const handleAbrirAsignacion = async (horario: HorarioAsignacion) => {
    seleccionarHorario(horario);
    setModalOpen(true);
    await consultarEspaciosDisponibles(horario);
  };

  const handleCerrarModal = () => {
    setModalOpen(false);
    limpiarSeleccion();
  };

  const handleConfirmar = async () => {
    await asignarEspacio();
  };

  const resolveEstadoBadge = (estado?: string) => {
    if (!estado) return null;

    const normalized = estado.toLowerCase();
    if (normalized === 'aprobado') {
      return <Badge className="bg-green-100 text-green-800 border-green-300">Aprobado</Badge>;
    }

    if (normalized === 'pendiente') {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">Pendiente</Badge>;
    }

    if (normalized === 'rechazado') {
      return <Badge className="bg-red-100 text-red-800 border-red-300">Rechazado</Badge>;
    }

    return <Badge variant="outline">{estado}</Badge>;
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <div className="flex flex-col gap-2">
        <h1 className="text-slate-900">Asignación de espacios por seccional</h1>
        <p className="text-slate-600">Asigna espacios físicos a horarios académicos según seccional, día y franja horaria.</p>
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

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <div>
              <Label>Seccional</Label>
              <Select
                value={filtros.seccionalId ? String(filtros.seccionalId) : 'all'}
                onValueChange={(value) => setFiltros({ seccionalId: value === 'all' ? null : Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {seccionales.map((seccional) => (
                    <SelectItem key={seccional.id} value={String(seccional.id)}>
                      {seccional.ciudad}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Programa</Label>
              <Select
                value={filtros.programaId ? String(filtros.programaId) : 'all'}
                onValueChange={(value) => setFiltros({ programaId: value === 'all' ? null : Number(value), grupoId: null })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {programas.map((programa) => (
                    <SelectItem key={programa.id} value={String(programa.id)}>
                      {programa.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Grupo</Label>
              <Select
                value={filtros.grupoId ? String(filtros.grupoId) : 'all'}
                onValueChange={(value) => setFiltros({ grupoId: value === 'all' ? null : Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {grupos.map((grupo) => (
                    <SelectItem key={grupo.id} value={String(grupo.id)}>
                      {grupo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Docente</Label>
              <Select
                value={filtros.docenteId ? String(filtros.docenteId) : 'all'}
                onValueChange={(value) => setFiltros({ docenteId: value === 'all' ? null : Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {docentes.map((docente) => (
                    <SelectItem key={docente.id} value={String(docente.id)}>
                      {docente.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Asignatura</Label>
              <Select
                value={filtros.asignaturaId ? String(filtros.asignaturaId) : 'all'}
                onValueChange={(value) => setFiltros({ asignaturaId: value === 'all' ? null : Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {asignaturas.map((asignatura) => (
                    <SelectItem key={asignatura.id} value={String(asignatura.id)}>
                      {asignatura.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Día</Label>
              <Select
                value={filtros.diaSemana ?? 'all'}
                onValueChange={(value) => setFiltros({ diaSemana: value === 'all' ? null : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {diasSemana.map((dia) => (
                    <SelectItem key={dia} value={dia}>
                      {dia}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Período</Label>
              <Select
                value={filtros.periodoId ? String(filtros.periodoId) : 'all'}
                onValueChange={(value) => setFiltros({ periodoId: value === 'all' ? null : Number(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  {periodos.map((periodo) => (
                    <SelectItem key={periodo.id} value={String(periodo.id)}>
                      {periodo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <Checkbox
                checked={!!filtros.soloSinEspacio}
                onCheckedChange={(value) => setFiltros({ soloSinEspacio: Boolean(value) })}
              />
              Mostrar solo horarios sin espacio
            </label>

            <Button
              variant="outline"
              onClick={() => recargarHorarios()}
              className="border-slate-300"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Horarios</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Seccional</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Asignatura</TableHead>
                <TableHead>Grupo</TableHead>
                <TableHead>Docente</TableHead>
                <TableHead>Día</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Fin</TableHead>
                <TableHead>Espacio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingHorarios && horarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-slate-500 py-8">
                    Cargando horarios...
                  </TableCell>
                </TableRow>
              ) : null}

              {!loadingHorarios && horarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="text-center text-slate-500 py-8">
                    No se encontraron horarios para los filtros seleccionados.
                  </TableCell>
                </TableRow>
              ) : null}

              {horarios.map((horario) => (
                <TableRow key={horario.id}>
                  <TableCell>{horario.seccional_nombre || 'Sin seccional'}</TableCell>
                  <TableCell>{horario.sede_nombre || 'Sin sede'}</TableCell>
                  <TableCell>{horario.programa_nombre}</TableCell>
                  <TableCell>{horario.asignatura_nombre}</TableCell>
                  <TableCell>{horario.grupo_nombre}</TableCell>
                  <TableCell>{horario.docente_nombre}</TableCell>
                  <TableCell>{horario.dia_semana}</TableCell>
                  <TableCell>{horario.hora_inicio}</TableCell>
                  <TableCell>{horario.hora_fin}</TableCell>
                  <TableCell>{horario.espacio_nombre || 'Sin asignar'}</TableCell>
                  <TableCell>{resolveEstadoBadge(horario.estado)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
                      onClick={() => handleAbrirAsignacion(horario)}
                    >
                      <MapPin className="w-4 h-4 mr-2" />
                      {horario.espacio_id ? 'Cambiar espacio' : 'Asignar espacio'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={(value) => (value ? setModalOpen(true) : handleCerrarModal())}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Asignar espacio disponible</DialogTitle>
          </DialogHeader>

          {horarioSeleccionado ? (
            <div className="space-y-4">
              <Card className="border-slate-200">
                <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-slate-500">Programa</span>
                    <p className="text-slate-900">{horarioSeleccionado.programa_nombre}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Asignatura</span>
                    <p className="text-slate-900">{horarioSeleccionado.asignatura_nombre}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Grupo</span>
                    <p className="text-slate-900">{horarioSeleccionado.grupo_nombre}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Día</span>
                    <p className="text-slate-900">{horarioSeleccionado.dia_semana}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Hora</span>
                    <p className="text-slate-900">{horarioSeleccionado.hora_inicio} - {horarioSeleccionado.hora_fin}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Espacio actual</span>
                    <p className="text-slate-900">{horarioSeleccionado.espacio_nombre || 'Sin asignar'}</p>
                  </div>
                </CardContent>
              </Card>

              <div className="flex items-center justify-between">
                <h3 className="text-slate-900">Espacios disponibles</h3>
                <Button
                  variant="outline"
                  onClick={() => consultarEspaciosDisponibles(horarioSeleccionado)}
                  disabled={loadingEspacios}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {loadingEspacios ? 'Buscando...' : 'Actualizar'}
                </Button>
              </div>

              {loadingEspacios ? (
                <div className="text-center text-slate-500 py-6">Consultando espacios disponibles...</div>
              ) : espaciosDisponibles.length === 0 ? (
                <Alert>
                  <AlertTitle>No hay espacios disponibles</AlertTitle>
                  <AlertDescription>
                    No se encontraron espacios libres para el día y hora seleccionados.
                  </AlertDescription>
                </Alert>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Capacidad</TableHead>
                      <TableHead>Sede</TableHead>
                      <TableHead>Ubicación</TableHead>
                      <TableHead className="text-right">Seleccionar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {espaciosDisponibles.map((espacio) => {
                      const seleccionado = espacioSeleccionado?.id === espacio.id;
                      return (
                        <TableRow key={espacio.id} className={seleccionado ? 'bg-blue-50' : ''}>
                          <TableCell className="text-slate-900">{espacio.nombre}</TableCell>
                          <TableCell className="text-slate-600">{espacio.tipo}</TableCell>
                          <TableCell className="text-slate-600">{espacio.capacidad}</TableCell>
                          <TableCell className="text-slate-600">{espacio.sede_nombre || 'Sin sede'}</TableCell>
                          <TableCell className="text-slate-600">{espacio.ubicacion || 'Sin ubicación'}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant={seleccionado ? 'default' : 'outline'}
                              onClick={() => setEspacioSeleccionado(espacio)}
                              className={seleccionado ? 'bg-blue-600 text-white' : ''}
                            >
                              {seleccionado ? 'Seleccionado' : 'Elegir'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {espacioSeleccionado ? (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <AlertCircle className="w-4 h-4" />
                  Espacio seleccionado: {espacioSeleccionado.nombre} ({espacioSeleccionado.sede_nombre || 'Sin sede'})
                </div>
              ) : null}
            </div>
          ) : null}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCerrarModal}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmar}
              disabled={!horarioSeleccionado || !espacioSeleccionado || loadingAsignacion}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              {loadingAsignacion ? 'Asignando...' : 'Confirmar asignación'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
