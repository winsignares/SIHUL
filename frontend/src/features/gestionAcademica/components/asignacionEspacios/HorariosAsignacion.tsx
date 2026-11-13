import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Badge } from '../../../../components/ui/badge';
import { MapPin, Clock, CalendarDays } from 'lucide-react';
import { Pagination } from '../../../../components/common/Pagination';
import type { useAsignacionEspaciosSeccionalPagina } from '../../hooks/useAsignacionEspaciosSeccionalPagina';

type Gestion = ReturnType<typeof useAsignacionEspaciosSeccionalPagina>;

/** Listado paginado de horarios pendientes de espacio. */
export function HorariosAsignacion({ currentPageHorarios, setCurrentPageHorarios, itemsPerPageHorarios, setItemsPerPageHorarios, horarios, loadingHorarios, handleAbrirAsignacion, resolveEstadoBadge, horariosPaginados, totalPagesHorarios }: Pick<Gestion, 'currentPageHorarios' | 'setCurrentPageHorarios' | 'itemsPerPageHorarios' | 'setItemsPerPageHorarios' | 'horarios' | 'loadingHorarios' | 'handleAbrirAsignacion' | 'resolveEstadoBadge' | 'horariosPaginados' | 'totalPagesHorarios'>) {
  return (
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
  );
}
