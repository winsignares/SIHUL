import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Badge } from '../../../../components/ui/badge';
import { MapPin, RefreshCw, AlertCircle, Clock, Users, BookOpen, CalendarDays, Check } from 'lucide-react';
import { Pagination } from '../../../../components/common/Pagination';
import { EspaciosDisponiblesTable } from '../../../horarios/components/EspaciosDisponiblesTable';
import type { useAsignacionEspaciosSeccionalPagina } from '../../hooks/useAsignacionEspaciosSeccionalPagina';

type Gestion = ReturnType<typeof useAsignacionEspaciosSeccionalPagina>;

/** Diálogo para elegir y confirmar el espacio de un horario. */
export function DialogoAsignarEspacio({ modalOpen, setModalOpen, currentPageEspacios, setCurrentPageEspacios, itemsPerPageEspacios, setItemsPerPageEspacios, filtroEspacioId, setFiltroEspacioId, espaciosDisponibles, horarioSeleccionado, espacioSeleccionado, loadingEspacios, loadingAsignacion, consultarEspaciosDisponibles, setEspacioSeleccionado, handleCerrarModal, handleConfirmar }: Pick<Gestion, 'modalOpen' | 'setModalOpen' | 'currentPageEspacios' | 'setCurrentPageEspacios' | 'itemsPerPageEspacios' | 'setItemsPerPageEspacios' | 'filtroEspacioId' | 'setFiltroEspacioId' | 'espaciosDisponibles' | 'horarioSeleccionado' | 'espacioSeleccionado' | 'loadingEspacios' | 'loadingAsignacion' | 'consultarEspaciosDisponibles' | 'setEspacioSeleccionado' | 'handleCerrarModal' | 'handleConfirmar'>) {
  return (
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
  );
}
