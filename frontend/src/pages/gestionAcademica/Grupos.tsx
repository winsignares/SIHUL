import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Search, Users, AlertTriangle, Eye, Power, PowerOff } from 'lucide-react';
import { useGrupos } from '../../hooks/gestionAcademica/useGrupos';

export default function Grupos() {
  const {
    searchTerm, setSearchTerm,
    programas,
    selectedProgramaFilter, setSelectedProgramaFilter,
    selectedSemestreFilter, setSelectedSemestreFilter,
    showCreateGrupo, setShowCreateGrupo,
    showEditGrupo, setShowEditGrupo,
    showDeleteGrupo, setShowDeleteGrupo,
    showEstudiantes, setShowEstudiantes,
    grupoForm, setGrupoForm,
    selectedGrupo, setSelectedGrupo,
    estudiantesDelGrupo, setEstudiantesDelGrupo,
    handleCreateGrupo,
    openEditGrupo,
    handleEditGrupo,
    openDeleteGrupo,
    handleDeleteGrupo,
    toggleGrupoActivo,
    openVerEstudiantes,
    getProgramaNombre,
    filteredGrupos,
    getEstudiantesCount,
    semestresDisponibles
  } = useGrupos();

  return (
    <>
      {/* Header con botón */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 text-lg font-semibold">Gestión de Grupos</h2>
        </div>
        <Button
          onClick={() => setShowCreateGrupo(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Grupo
        </Button>
      </div>

      {/* Filtros en Card */}
      <Card className="mb-6 border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Label className="text-slate-700 mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar grupos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 mb-2 block">Programa</Label>
              <Select value={selectedProgramaFilter} onValueChange={setSelectedProgramaFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los programas</SelectItem>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700 mb-2 block">Semestre</Label>
              <Select value={selectedSemestreFilter} onValueChange={setSelectedSemestreFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los semestres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los semestres</SelectItem>
                  {semestresDisponibles.map(s => (
                    <SelectItem key={s} value={s.toString()}>Semestre {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Programa</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrupos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No se encontraron grupos
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrupos.map((grupo) => (
                  <TableRow key={grupo.id}>
                    <TableCell className="text-slate-600">{getProgramaNombre(grupo.programaId)}</TableCell>
                    <TableCell className="text-slate-600">Semestre {grupo.semestre || 'N/A'}</TableCell>
                    <TableCell>
                      <Badge className="bg-yellow-500 text-slate-900 hover:bg-yellow-600">
                        {grupo.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={grupo.activo ? 'default' : 'secondary'}
                        className={grupo.activo ? 'bg-green-600' : 'bg-slate-400'}
                      >
                        {grupo.activo ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditGrupo(grupo)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleGrupoActivo(grupo)}
                          className={grupo.activo
                            ? "border-orange-600 text-orange-600 hover:bg-orange-50"
                            : "border-green-600 text-green-600 hover:bg-green-50"
                          }
                        >
                          {grupo.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteGrupo(grupo)}
                          className="border-red-600 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ==================== MODALES ==================== */}

      {/* Modal: Crear Grupo */}
      <Dialog open={showCreateGrupo} onOpenChange={setShowCreateGrupo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Registrar Nuevo Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="programa-grupo">Programa Académico</Label>
              <Select
                value={grupoForm.programaId}
                onValueChange={(value) => setGrupoForm({ ...grupoForm, programaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semestre-grupo">Semestre</Label>
              <Input
                id="semestre-grupo"
                type="number"
                min="1"
                max="20"
                placeholder="Ej: 1, 2, 3..."
                value={grupoForm.semestre}
                onChange={(e) => setGrupoForm({ ...grupoForm, semestre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="codigo-grupo">Nombre del Grupo</Label>
              <Input
                id="codigo-grupo"
                placeholder="Ej: INSI-A, DERE-B"
                value={grupoForm.codigo}
                onChange={(e) => setGrupoForm({ ...grupoForm, codigo: e.target.value })}
              />
              <p className="text-slate-500">Formato recomendado: SIGLAS-LETRA</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800">
                ℹ️ El grupo se creará como <strong>Activo</strong> automáticamente
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateGrupo(false);
                setGrupoForm({ codigo: '', programaId: '', semestre: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateGrupo}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Grupo */}
      <Dialog open={showEditGrupo} onOpenChange={setShowEditGrupo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Grupo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-programa-grupo">Programa Académico</Label>
              <Select
                value={grupoForm.programaId}
                onValueChange={(value) => setGrupoForm({ ...grupoForm, programaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-semestre-grupo">Semestre</Label>
              <Input
                id="edit-semestre-grupo"
                type="number"
                min="1"
                max="20"
                placeholder="Ej: 1, 2, 3..."
                value={grupoForm.semestre}
                onChange={(e) => setGrupoForm({ ...grupoForm, semestre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-codigo-grupo">Nombre del Grupo</Label>
              <Input
                id="edit-codigo-grupo"
                placeholder="Ej: INSI-A, DERE-B"
                value={grupoForm.codigo}
                onChange={(e) => setGrupoForm({ ...grupoForm, codigo: e.target.value })}
              />
              <p className="text-slate-500">Formato recomendado: SIGLAS-LETRA</p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditGrupo(false);
                setSelectedGrupo(null);
                setGrupoForm({ codigo: '', programaId: '', semestre: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditGrupo}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Eliminar Grupo */}
      <Dialog open={showDeleteGrupo} onOpenChange={setShowDeleteGrupo}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Está seguro de eliminar el grupo?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Los estudiantes que tengan este grupo asignado lo mantendrán en su registro.
            </DialogDescription>
          </DialogHeader>
          {selectedGrupo && (
            <div className="py-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600">Grupo a eliminar:</p>
                <Badge className="bg-yellow-500 text-slate-900 hover:bg-yellow-600 mt-2">
                  {selectedGrupo.codigo}
                </Badge>
                <p className="text-slate-500 mt-2">
                  Programa: {getProgramaNombre(selectedGrupo.programaId)}
                </p>
                <p className="text-slate-500">
                  Semestre: {selectedGrupo.semestre || 'N/A'}
                </p>
                <p className="text-slate-500">
                  Estudiantes asignados: {getEstudiantesCount(selectedGrupo.codigo)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteGrupo(false);
                setSelectedGrupo(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteGrupo}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Ver Estudiantes */}
      <Dialog open={showEstudiantes} onOpenChange={setShowEstudiantes}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              Estudiantes del Grupo {selectedGrupo?.codigo}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {estudiantesDelGrupo.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-500">No hay estudiantes asignados a este grupo</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {estudiantesDelGrupo.map((estudiante, index) => (
                  <div
                    key={estudiante.id}
                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="text-slate-900">{estudiante.nombre}</p>
                      <p className="text-slate-500">{estudiante.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowEstudiantes(false);
                setSelectedGrupo(null);
                setEstudiantesDelGrupo([]);
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
