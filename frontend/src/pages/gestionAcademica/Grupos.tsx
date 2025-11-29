import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Search, AlertTriangle, Power, PowerOff } from 'lucide-react';
import { useGrupos } from '../../hooks/gestionAcademica/useGrupos';

export default function Grupos() {
  const {
    searchTerm, setSearchTerm,
    loading,
    grupos,
    programas,
    periodos,
    selectedProgramaFilter, setSelectedProgramaFilter,
    selectedSemestreFilter, setSelectedSemestreFilter,
    showCreateGrupo, setShowCreateGrupo,
    showEditGrupo, setShowEditGrupo,
    showDeleteGrupo, setShowDeleteGrupo,
    grupoForm, setGrupoForm,
    selectedGrupo, setSelectedGrupo,
    handleCreateGrupo,
    openEditGrupo,
    handleEditGrupo,
    openDeleteGrupo,
    handleDeleteGrupo,
    toggleGrupoActivo,
    resetForm,
    filteredGrupos,
    semestresDisponibles,
    getProgramaNombre,
    getPeriodoNombre,
    getSemestresDisponiblesPorPrograma
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
                    <SelectItem key={p.id} value={p.id?.toString() || ''}>
                      {p.nombre}
                    </SelectItem>
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
                  {getSemestresDisponiblesPorPrograma().map(s => (
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
                <TableHead>Nombre</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredGrupos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No se encontraron grupos
                  </TableCell>
                </TableRow>
              ) : (
                filteredGrupos.map((grupo) => (
                  <TableRow key={grupo.id}>
                    <TableCell>
                      <Badge className="bg-yellow-500 text-slate-900 hover:bg-yellow-600">
                        {grupo.nombre}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">{getProgramaNombre(grupo.programa_id)}</TableCell>
                    <TableCell className="text-slate-600">Semestre {grupo.semestre}</TableCell>
                    <TableCell className="text-slate-600">{getPeriodoNombre(grupo.periodo_id)}</TableCell>
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
              <Label htmlFor="nombre-grupo">
                Nombre del Grupo <span className="text-red-600">*</span>
              </Label>
              <Input
                id="nombre-grupo"
                placeholder="Ej: INSI-A, DERE-B"
                value={grupoForm.nombre}
                onChange={(e) => setGrupoForm({ ...grupoForm, nombre: e.target.value })}
              />
              <p className="text-slate-500 text-sm">Formato recomendado: SIGLAS-LETRA</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="programa-grupo">
                Programa Académico <span className="text-red-600">*</span>
              </Label>
              <Select
                value={grupoForm.programa_id}
                onValueChange={(value) => setGrupoForm({ ...grupoForm, programa_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id?.toString() || ''}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="periodo-grupo">
                Periodo Académico <span className="text-red-600">*</span>
              </Label>
              <Select
                value={grupoForm.periodo_id}
                onValueChange={(value) => setGrupoForm({ ...grupoForm, periodo_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map(p => (
                    <SelectItem key={p.id} value={p.id?.toString() || ''}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semestre-grupo">
                Semestre <span className="text-red-600">*</span>
              </Label>
              <Input
                id="semestre-grupo"
                type="number"
                min="1"
                max="10"
                placeholder="Ej: 1, 2, 3..."
                value={grupoForm.semestre}
                onChange={(e) => setGrupoForm({ ...grupoForm, semestre: e.target.value })}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800 text-sm">
                ℹ️ El grupo se creará como <strong>Activo</strong> automáticamente
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateGrupo(false);
                resetForm();
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
              <Label htmlFor="edit-nombre-grupo">
                Nombre del Grupo <span className="text-red-600">*</span>
              </Label>
              <Input
                id="edit-nombre-grupo"
                placeholder="Ej: INSI-A, DERE-B"
                value={grupoForm.nombre}
                onChange={(e) => setGrupoForm({ ...grupoForm, nombre: e.target.value })}
              />
              <p className="text-slate-500 text-sm">Formato recomendado: SIGLAS-LETRA</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-programa-grupo">
                Programa Académico <span className="text-red-600">*</span>
              </Label>
              <Select
                value={grupoForm.programa_id}
                onValueChange={(value) => setGrupoForm({ ...grupoForm, programa_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id?.toString() || ''}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-periodo-grupo">
                Periodo Académico <span className="text-red-600">*</span>
              </Label>
              <Select
                value={grupoForm.periodo_id}
                onValueChange={(value) => setGrupoForm({ ...grupoForm, periodo_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar periodo" />
                </SelectTrigger>
                <SelectContent>
                  {periodos.map(p => (
                    <SelectItem key={p.id} value={p.id?.toString() || ''}>
                      {p.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-semestre-grupo">
                Semestre <span className="text-red-600">*</span>
              </Label>
              <Input
                id="edit-semestre-grupo"
                type="number"
                min="1"
                max="10"
                placeholder="Ej: 1, 2, 3..."
                value={grupoForm.semestre}
                onChange={(e) => setGrupoForm({ ...grupoForm, semestre: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditGrupo(false);
                setSelectedGrupo(null);
                resetForm();
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
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {selectedGrupo && (
            <div className="py-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-slate-600">Grupo a eliminar:</p>
                  <Badge className="bg-yellow-500 text-slate-900 hover:bg-yellow-600 mt-2">
                    {selectedGrupo.nombre}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-600">Semestre:</p>
                  <p className="text-slate-900">{selectedGrupo.semestre}</p>
                </div>
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

    </>
  );
}
