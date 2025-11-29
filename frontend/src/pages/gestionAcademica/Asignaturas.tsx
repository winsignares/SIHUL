import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Search, BookOpen, AlertTriangle, Check, X, Eye, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAsignaturas, tiposAsignatura } from '../../hooks/gestionAcademica/useAsignaturas';

export default function Asignaturas() {
  const {
    searchTerm, setSearchTerm,
    loading,
    showCreateDialog, setShowCreateDialog,
    showEditDialog, setShowEditDialog,
    showDeleteDialog, setShowDeleteDialog,
    asignaturaForm, setAsignaturaForm,
    selectedAsignatura, setSelectedAsignatura,
    handleCreateAsignatura,
    openEditDialog,
    handleEditAsignatura,
    openDeleteDialog,
    handleDeleteAsignatura,
    resetForm,
    filteredAsignaturas
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
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Label className="text-slate-700 mb-2 block">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar por código o nombre..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
                <TableHead>Créditos</TableHead>
                <TableHead>Horas</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsignaturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-900 mb-1">
                          No se encontraron asignaturas
                        </p>
                        <p className="text-slate-500">
                          Ajuste los filtros o cree una nueva asignatura
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
                    <TableCell className="text-slate-600">{asignatura.creditos} créditos</TableCell>
                    <TableCell className="text-slate-600">{asignatura.horas || 0} horas</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          asignatura.tipo === 'teórica'
                            ? 'border-blue-600 text-blue-600'
                            : asignatura.tipo === 'práctica'
                              ? 'border-green-600 text-green-600'
                              : 'border-purple-600 text-purple-600'
                        }
                      >
                        {tiposAsignatura.find(t => t.value === asignatura.tipo)?.label || asignatura.tipo}
                      </Badge>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Registrar Nueva Asignatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="codigo">
                Código <span className="text-red-600">*</span>
              </Label>
              <Input
                id="codigo"
                placeholder="Ej: PROG101"
                value={asignaturaForm.codigo}
                onChange={(e) => setAsignaturaForm({ ...asignaturaForm, codigo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nombre">
                Nombre <span className="text-red-600">*</span>
              </Label>
              <Input
                id="nombre"
                placeholder="Ej: Programación I"
                value={asignaturaForm.nombre}
                onChange={(e) => setAsignaturaForm({ ...asignaturaForm, nombre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditos">
                  Créditos <span className="text-red-600">*</span>
                </Label>
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
                <Label htmlFor="horas">
                  Horas Semanales
                </Label>
                <Input
                  id="horas"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Ej: 4"
                  value={asignaturaForm.horas}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, horas: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">
                Tipo de Asignatura <span className="text-red-600">*</span>
              </Label>
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
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateAsignatura}
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: EDITAR ASIGNATURA ==================== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Asignatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-codigo">
                Código <span className="text-red-600">*</span>
              </Label>
              <Input
                id="edit-codigo"
                placeholder="Ej: PROG101"
                value={asignaturaForm.codigo}
                onChange={(e) => setAsignaturaForm({ ...asignaturaForm, codigo: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-nombre">
                Nombre <span className="text-red-600">*</span>
              </Label>
              <Input
                id="edit-nombre"
                placeholder="Ej: Programación I"
                value={asignaturaForm.nombre}
                onChange={(e) => setAsignaturaForm({ ...asignaturaForm, nombre: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-creditos">
                  Créditos <span className="text-red-600">*</span>
                </Label>
                <Input
                  id="edit-creditos"
                  type="number"
                  min="1"
                  max="8"
                  placeholder="Ej: 4"
                  value={asignaturaForm.creditos}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, creditos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-horas">
                  Horas Semanales
                </Label>
                <Input
                  id="edit-horas"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Ej: 4"
                  value={asignaturaForm.horas}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, horas: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-tipo">
                Tipo de Asignatura <span className="text-red-600">*</span>
              </Label>
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
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedAsignatura(null);
                resetForm();
              }}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditAsignatura}
              disabled={loading}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Guardar'
              )}
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
                  <p className="text-slate-600">Créditos:</p>
                  <p className="text-slate-900">{selectedAsignatura.creditos}</p>
                </div>
                <div>
                  <p className="text-slate-600">Horas:</p>
                  <p className="text-slate-900">{selectedAsignatura.horas || 0}</p>
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


    </div>
  );
}