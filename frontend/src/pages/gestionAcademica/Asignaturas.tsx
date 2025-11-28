import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Search, BookOpen, AlertTriangle, Check, X, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { useAsignaturas, RECURSOS_DISPONIBLES, tiposAsignatura } from '../../hooks/gestionAcademica/useAsignaturas';

export default function Asignaturas() {
  const {
    searchTerm, setSearchTerm,
    facultades,
    programas,
    selectedFacultad, setSelectedFacultad,
    selectedPrograma, setSelectedPrograma,
    selectedSemestre, setSelectedSemestre,
    showCreateDialog, setShowCreateDialog,
    showEditDialog, setShowEditDialog,
    showDeleteDialog, setShowDeleteDialog,
    showRecursosDialog, setShowRecursosDialog,
    asignaturaForm, setAsignaturaForm,
    recursosSeleccionados,
    recursoActual, setRecursoActual,
    selectedAsignatura, setSelectedAsignatura,
    getProgramasByFacultad,
    getProgramaNombre,
    getFacultadNombre,
    agregarRecurso,
    eliminarRecurso,
    handleCreateAsignatura,
    openEditDialog,
    handleEditAsignatura,
    openDeleteDialog,
    handleDeleteAsignatura,
    resetForm,
    filteredAsignaturas,
    semestresDisponibles
  } = useAsignaturas();

  return (
    <div className="space-y-6">
      {/* Header con botón */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 text-lg font-semibold">Gestión de Asignaturas</h2>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Asignatura
        </Button>
      </div>

      {/* Filtros en Card */}
      <Card className="mb-6 border-slate-200 shadow-sm">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-1">
              <Label className="text-slate-700 mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar asignatura..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div>
              <Label className="text-slate-700 mb-2 block">Facultad</Label>
              <Select value={selectedFacultad} onValueChange={(value) => {
                setSelectedFacultad(value);
                setSelectedPrograma('all'); // Reset programa al cambiar facultad
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas las facultades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las facultades</SelectItem>
                  {facultades.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700 mb-2 block">Programa</Label>
              <Select value={selectedPrograma} onValueChange={(value) => {
                setSelectedPrograma(value);
                setSelectedSemestre('all'); // Reset semestre al cambiar programa
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los programas</SelectItem>
                  {getProgramasByFacultad(selectedFacultad).map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-slate-700 mb-2 block">Semestre</Label>
              <Select
                value={selectedSemestre}
                onValueChange={setSelectedSemestre}
                disabled={selectedPrograma === 'all' && semestresDisponibles.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder={selectedPrograma === 'all' ? 'Seleccione un programa' : 'Todos los semestres'} />
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
      {/* Tabla */}
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Recursos Necesarios</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsignaturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-900 mb-1">
                          {selectedPrograma !== 'all' && selectedSemestre !== 'all'
                            ? 'No se encontraron asignaturas registradas para este semestre'
                            : 'No se encontraron asignaturas'}
                        </p>
                        <p className="text-slate-500">
                          {selectedPrograma !== 'all' && selectedSemestre !== 'all'
                            ? 'Intente con otro semestre o cree una nueva asignatura'
                            : 'Ajuste los filtros o cree una nueva asignatura'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAsignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id}>
                    <TableCell>
                      <Badge variant="outline" className="border-red-600 text-red-600">
                        {asignatura.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-900">{asignatura.nombre}</TableCell>
                    <TableCell className="text-slate-600">{getProgramaNombre(asignatura.programaId)}</TableCell>
                    <TableCell className="text-slate-600">Semestre {asignatura.semestre}</TableCell>
                    <TableCell className="text-slate-600">{asignatura.creditos} créditos</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          asignatura.tipo === 'teorica'
                            ? 'border-blue-600 text-blue-600'
                            : asignatura.tipo === 'practica'
                              ? 'border-green-600 text-green-600'
                              : 'border-purple-600 text-purple-600'
                        }
                      >
                        {tiposAsignatura.find(t => t.value === asignatura.tipo)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {asignatura.recursosRequeridos && asignatura.recursosRequeridos.length > 0 ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAsignatura(asignatura);
                            setShowRecursosDialog(true);
                          }}
                          className="border-orange-500 text-orange-600 hover:bg-orange-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Ver Recursos ({asignatura.recursosRequeridos.length})
                        </Button>
                      ) : (
                        <span className="text-slate-400 text-sm">Sin recursos</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(asignatura)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(asignatura)}
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

      {/* ==================== MODAL: CREAR ASIGNATURA ==================== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Registrar Nueva Asignatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input
                  id="codigo"
                  placeholder="Ej: PROG101"
                  value={asignaturaForm.codigo}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semestre">Semestre *</Label>
                <Input
                  id="semestre"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Ej: 1"
                  value={asignaturaForm.semestre}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, semestre: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input
                id="nombre"
                placeholder="Ej: Programación I"
                value={asignaturaForm.nombre}
                onChange={(e) => setAsignaturaForm({ ...asignaturaForm, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="programa">Programa *</Label>
              <Select
                value={asignaturaForm.programaId}
                onValueChange={(value) => setAsignaturaForm({ ...asignaturaForm, programaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} ({p.semestres} semestres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditos">Créditos *</Label>
                <Input
                  id="creditos"
                  type="number"
                  min="1"
                  max="8"
                  placeholder="Ej: 4"
                  value={asignaturaForm.creditos}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, creditos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horas">Horas/Semana *</Label>
                <Input
                  id="horas"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Ej: 6"
                  value={asignaturaForm.horasSemana}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, horasSemana: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Asignatura *</Label>
              <Select
                value={asignaturaForm.tipo}
                onValueChange={(value: any) => setAsignaturaForm({ ...asignaturaForm, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAsignatura.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recursos Necesarios */}
            <div className="space-y-3">
              <Label>Recursos Necesarios (Opcional)</Label>

              {/* ComboBox + Botón Agregar */}
              <div className="flex gap-2">
                <Select value={recursoActual} onValueChange={setRecursoActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar recurso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURSOS_DISPONIBLES.filter(r => !recursosSeleccionados.includes(r)).map(recurso => (
                      <SelectItem key={recurso} value={recurso}>{recurso}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={agregarRecurso}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>

              {/* Lista de recursos agregados */}
              {recursosSeleccionados.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                  <p className="text-slate-700">Recursos agregados ({recursosSeleccionados.length}):</p>
                  <div className="space-y-2">
                    {recursosSeleccionados.map(recurso => (
                      <motion.div
                        key={recurso}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-slate-900">{recurso}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarRecurso(recurso)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAsignatura}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: EDITAR ASIGNATURA ==================== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Asignatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-codigo">Código *</Label>
                <Input
                  id="edit-codigo"
                  value={asignaturaForm.codigo}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-semestre">Semestre *</Label>
                <Input
                  id="edit-semestre"
                  type="number"
                  min="1"
                  max="12"
                  value={asignaturaForm.semestre}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, semestre: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input
                id="edit-nombre"
                value={asignaturaForm.nombre}
                onChange={(e) => setAsignaturaForm({ ...asignaturaForm, nombre: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-programa">Programa *</Label>
              <Select
                value={asignaturaForm.programaId}
                onValueChange={(value) => setAsignaturaForm({ ...asignaturaForm, programaId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} ({p.semestres} semestres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-creditos">Créditos *</Label>
                <Input
                  id="edit-creditos"
                  type="number"
                  min="1"
                  max="8"
                  value={asignaturaForm.creditos}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, creditos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-horas">Horas/Semana *</Label>
                <Input
                  id="edit-horas"
                  type="number"
                  min="1"
                  max="20"
                  value={asignaturaForm.horasSemana}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, horasSemana: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo de Asignatura *</Label>
              <Select
                value={asignaturaForm.tipo}
                onValueChange={(value: any) => setAsignaturaForm({ ...asignaturaForm, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAsignatura.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Recursos Necesarios */}
            <div className="space-y-3">
              <Label>Recursos Necesarios (Opcional)</Label>

              {/* ComboBox + Botón Agregar */}
              <div className="flex gap-2">
                <Select value={recursoActual} onValueChange={setRecursoActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccionar recurso..." />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURSOS_DISPONIBLES.filter(r => !recursosSeleccionados.includes(r)).map(recurso => (
                      <SelectItem key={recurso} value={recurso}>{recurso}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  onClick={agregarRecurso}
                  className="border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar
                </Button>
              </div>

              {/* Lista de recursos agregados */}
              {recursosSeleccionados.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                  <p className="text-slate-700">Recursos agregados ({recursosSeleccionados.length}):</p>
                  <div className="space-y-2">
                    {recursosSeleccionados.map(recurso => (
                      <motion.div
                        key={recurso}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-slate-900">{recurso}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => eliminarRecurso(recurso)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedAsignatura(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditAsignatura}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: ELIMINAR ASIGNATURA ==================== */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Está seguro de eliminar la asignatura?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {selectedAsignatura && (
            <div className="py-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-slate-600">Código:</p>
                  <p className="text-slate-900">{selectedAsignatura.codigo}</p>
                </div>
                <div>
                  <p className="text-slate-600">Asignatura:</p>
                  <p className="text-slate-900">{selectedAsignatura.nombre}</p>
                </div>
                <div>
                  <p className="text-slate-600">Programa:</p>
                  <p className="text-slate-900">{getProgramaNombre(selectedAsignatura.programaId)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedAsignatura(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAsignatura}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: VER RECURSOS ==================== */}
      <Dialog open={showRecursosDialog} onOpenChange={setShowRecursosDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Recursos Necesarios para {selectedAsignatura?.nombre}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedAsignatura?.recursosRequeridos && selectedAsignatura.recursosRequeridos.length > 0 ? (
              <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                <p className="text-slate-500">Recursos seleccionados para esta asignatura:</p>
                <div className="grid grid-cols-2 gap-2">
                  {selectedAsignatura.recursosRequeridos.map(recurso => (
                    <div
                      key={recurso.tipo}
                      className="flex items-center gap-2 px-3 py-2 border rounded-lg bg-orange-50 text-orange-700"
                    >
                      <div className="w-4 h-4 rounded border flex items-center justify-center border-orange-500 bg-orange-500">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span>{recurso.tipo}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-slate-400 text-sm">Esta asignatura no requiere recursos adicionales.</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowRecursosDialog(false);
                setSelectedAsignatura(null);
              }}
            >
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}