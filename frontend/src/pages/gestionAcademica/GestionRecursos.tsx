import { Card, CardContent } from '../../share/card';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Button } from '../../share/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '../../share/dialog';
import { Badge } from '../../share/badge';
import { Plus, Search, Boxes, ChevronLeft, ChevronRight } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useGestionRecursos } from '../../hooks/gestionAcademica/useGestionRecursos';

export default function GestionRecursos() {
  const isMobile = useIsMobile();
  const {
    searchTerm,
    setSearchTerm,
    loading,
    paginaActualRecursos,
    totalRecursos,
    currentPage,
    totalPages,
    pageSize,
    goToNextPage,
    goToPrevPage,
    showCrearRecursoModal,
    setShowCrearRecursoModal,
    abrirCrearRecursoModal,
    cerrarCrearRecursoModal,
    creatingRecurso,
    nuevoRecurso,
    actualizarNuevoRecurso,
    crearNuevoRecurso
  } = useGestionRecursos();

  const firstItemIndex = totalRecursos === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const lastItemIndex = Math.min(currentPage * pageSize, totalRecursos);

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 text-lg font-semibold">Gestion de Recursos</h2>
          <p className="text-slate-600">Administra y consulta todos los recursos registrados</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={abrirCrearRecursoModal}
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo recurso
        </Button>
      </div>

      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="max-w-lg relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Filtrar por nombre..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-10 text-center text-slate-600">Cargando recursos...</div>
          ) : paginaActualRecursos.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Boxes className="w-14 h-14 mx-auto mb-3 text-slate-300" />
              <p className="text-slate-700 mb-1">No hay recursos para mostrar</p>
              <p>Ajusta el filtro o crea un nuevo recurso.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm text-slate-700">Nombre</th>
                      <th className="text-left px-6 py-4 text-sm text-slate-700">Descripcion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginaActualRecursos.map((recurso, index) => (
                      <tr key={`${recurso.id || 'temp'}-${index}`} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-6 py-4 text-slate-900">
                          <div className="flex items-center gap-2">
                            <Boxes className="w-4 h-4 text-blue-600" />
                            <span>{recurso.nombre || 'Sin nombre'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-700">
                          {recurso.descripcion ? (
                            recurso.descripcion
                          ) : (
                            <Badge variant="secondary" className="bg-slate-200 text-slate-600">
                              Sin descripcion
                            </Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-t border-slate-200">
                <p className="text-sm text-slate-600">
                  Mostrando {firstItemIndex}-{lastItemIndex} de {totalRecursos} recursos
                </p>

                <div className="flex items-center gap-2">
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

                  <span className="text-sm text-slate-700 px-2">
                    Pagina {currentPage} de {totalPages}
                  </span>

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
            </>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={showCrearRecursoModal}
        onOpenChange={(open) => {
          if (!open) {
            cerrarCrearRecursoModal();
            return;
          }
          setShowCrearRecursoModal(true);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Crear nuevo recurso</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="gestion-recurso-nombre">Nombre</Label>
              <Input
                id="gestion-recurso-nombre"
                value={nuevoRecurso.nombre}
                onChange={(event) => actualizarNuevoRecurso('nombre', event.target.value)}
                placeholder="Ej: Proyector laser"
                maxLength={255}
                disabled={creatingRecurso}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gestion-recurso-descripcion">Descripcion (opcional)</Label>
              <Input
                id="gestion-recurso-descripcion"
                value={nuevoRecurso.descripcion}
                onChange={(event) => actualizarNuevoRecurso('descripcion', event.target.value)}
                placeholder="Detalles del recurso"
                maxLength={255}
                disabled={creatingRecurso}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={cerrarCrearRecursoModal}
              disabled={creatingRecurso}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={crearNuevoRecurso}
              disabled={creatingRecurso}
              className="bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800"
            >
              {creatingRecurso ? 'Creando...' : 'Crear recurso'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
