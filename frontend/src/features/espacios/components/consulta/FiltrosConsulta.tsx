import { Input } from '../../../../components/ui/input';
import { DatePickerField } from '../../../../components/ui/date-picker-field';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Label } from '../../../../components/ui/label';
import { Alert, AlertDescription } from '../../../../components/ui/alert';
import { Search, AlertCircle, X } from 'lucide-react';
import type { useConsultaEspaciosPagina } from '../../hooks/useConsultaEspaciosPagina';

type Gestion = ReturnType<typeof useConsultaEspaciosPagina>;

/** Filtros, mensajes y selector de período académico. */
export function FiltrosConsulta({ isMobile, searchTerm, setSearchTerm, filterTipo, setFilterTipo, filterApertura, setFilterApertura, filterSede, setFilterSede, filterPeriodo, filterFechaInicio, filterFechaFin, filterOcupacion, setFilterOcupacion, mensajeFiltroFecha, handleFechaInicioChange, handleFechaFinChange, tiposEspacio, sedes, prestamos, periodos, errorBusquedaPeriodo, espacioSeleccionado, limpiarFiltros, periodoSeleccionado, mensajeAutoPeriodo, aplicarPeriodoConIntervaloValido }: Pick<Gestion, 'isMobile' | 'searchTerm' | 'setSearchTerm' | 'filterTipo' | 'setFilterTipo' | 'filterApertura' | 'setFilterApertura' | 'filterSede' | 'setFilterSede' | 'filterPeriodo' | 'filterFechaInicio' | 'filterFechaFin' | 'filterOcupacion' | 'setFilterOcupacion' | 'mensajeFiltroFecha' | 'handleFechaInicioChange' | 'handleFechaFinChange' | 'tiposEspacio' | 'sedes' | 'prestamos' | 'periodos' | 'errorBusquedaPeriodo' | 'espacioSeleccionado' | 'limpiarFiltros' | 'periodoSeleccionado' | 'mensajeAutoPeriodo' | 'aplicarPeriodoConIntervaloValido'>) {
  return (
    <>
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
            {/* Filtro de ocupación - al lado del buscador */}
            <Select value={filterOcupacion} onValueChange={setFilterOcupacion}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[220px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Ocupación" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="solo_horario">Solo con horario</SelectItem>
                <SelectItem value="solo_prestamo">Solo con préstamos</SelectItem>
                <SelectItem value="sin_horario_ni_prestamo">Sin horario ni préstamos</SelectItem>
                <SelectItem value="sin_horario">Sin horario</SelectItem>
                <SelectItem value="sin_prestamo">Sin préstamo</SelectItem>
              </SelectContent>
            </Select>
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
      {/* Filtro de Apertura */}
            <Select value={filterApertura} onValueChange={setFilterApertura}>
              <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[180px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                <SelectValue placeholder="Apertura" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todos</SelectItem>
                <SelectItem value="abierto">Abierto</SelectItem>
                <SelectItem value="cerrado">Cerrado</SelectItem>
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
                <DatePickerField
                  value={filterFechaInicio}
                  onChange={handleFechaInicioChange}
                  className={`${isMobile ? 'flex-1' : 'w-[150px]'} h-9 ${isMobile ? 'text-sm' : ''}`}
                  placeholder="Fecha inicio"
                  title="Fecha inicio del rango"
                />
              </div>
              <div className="flex flex-col gap-1">
                <Label className="text-xs text-slate-500">Hasta</Label>
                <DatePickerField
                  value={filterFechaFin}
                  onChange={handleFechaFinChange}
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

          {mensajeFiltroFecha && (
            <Alert variant={mensajeFiltroFecha.tipo === 'error' ? 'destructive' : 'default'}>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{mensajeFiltroFecha.texto}</AlertDescription>
            </Alert>
          )}

          {mensajeAutoPeriodo && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{mensajeAutoPeriodo}</AlertDescription>
            </Alert>
          )}

          {/* Mensaje de error de búsqueda de período */}
          {errorBusquedaPeriodo && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errorBusquedaPeriodo}</AlertDescription>
            </Alert>
          )}

          {/* Información del período seleccionado */}
          {periodoSeleccionado && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-300 dark:border-green-700 rounded-lg p-3">
              <p className="text-green-700 dark:text-green-300 text-sm">
                <strong>Período académico encontrado:</strong> {periodoSeleccionado.nombre || 'Período'} ({new Date(periodoSeleccionado.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })} - {new Date(periodoSeleccionado.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })})
              </p>
            </div>
          )}

          {/* Selector de períodos disponibles */}
          {periodos.length > 0 && (
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-slate-600">Seleccionar período académico</Label>
              <Select
                value={filterPeriodo?.toString() || periodoSeleccionado?.id?.toString() || ''}
                onValueChange={(value) => {
                  const periodo = periodos.find(p => p.id?.toString() === value);
                  if (periodo) {
                    aplicarPeriodoConIntervaloValido(periodo);
                  }
                }}
              >
                <SelectTrigger className={`${isMobile ? 'w-full' : 'w-[250px]'} h-9 ${isMobile ? 'text-sm' : ''}`}>
                  <SelectValue placeholder="Seleccionar período..." />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map(periodo => (
                    <SelectItem key={periodo.id} value={periodo.id?.toString() || ''}>
                      {periodo.nombre || 'Período'} - {new Date(periodo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
    </>
  );
}
