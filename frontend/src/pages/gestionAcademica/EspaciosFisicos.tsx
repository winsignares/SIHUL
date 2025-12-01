import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Search, Check, Package, X } from 'lucide-react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useEspaciosFisicos } from '../../hooks/gestionAcademica/useEspaciosFisicos';

export default function EspaciosFisicos() {
  const {
    searchTerm, setSearchTerm,
    filterTipo, setFilterTipo,
    filterSede, setFilterSede,
    showCreateDialog, setShowCreateDialog,
    showEditDialog, setShowEditDialog,
    showDeleteDialog, setShowDeleteDialog,
    espacioForm, setEspacioForm,
    recursoSeleccionado, setRecursoSeleccionado,
    recursosAgregados, setRecursosAgregados,
    mostrandoRecursos, setMostrandoRecursos,
    tiposEspacio,
    sedes,
    recursosDisponibles,
    handleCreateEspacio,
    openEditDialog,
    handleEditEspacio,
    openDeleteDialog,
    handleDeleteEspacio,
    resetForm,
    filteredEspacios,
    getEstadoBadge,
    notification
  } = useEspaciosFisicos();

  return (
    <div className="p-8 space-y-6">
      <NotificationBanner notification={notification} />
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 dark:text-slate-100 text-lg font-semibold">Gestión de Espacios Físicos</h2>
        </div>
        <Button
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Espacio
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1️⃣ Búsqueda (primero) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar espacio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* 2️⃣ Filtro Sede (segundo) */}
            <Select value={filterSede} onValueChange={setFilterSede}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las sedes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sedes</SelectItem>
                {sedes.map(sede => (
                  <SelectItem key={sede.id} value={sede.id?.toString() || ''}>{sede.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* 3️⃣ Filtro Tipo (tercero) */}
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposEspacio.map(tipo => (
                  <SelectItem key={tipo.id} value={tipo.id?.toString() || ''}>{tipo.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Ubicación</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEspacios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    No se encontraron espacios
                  </TableCell>
                </TableRow>
              ) : (
                filteredEspacios.map((espacio) => {
                  const sede = sedes.find(s => s.id === espacio.sede_id);
                  return (
                    <TableRow key={espacio.id}>
                      <TableCell className="text-slate-900 dark:text-slate-100">{espacio.nombre}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {espacio.tipo_espacio?.nombre || 'Sin tipo'}
                      </TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{sede?.nombre || 'Sede desconocida'}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{espacio.capacidad} personas</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">{espacio.ubicacion || 'Sin ubicación'}</TableCell>
                      <TableCell className="text-slate-600 dark:text-slate-400">
                        {espacio.recursos && espacio.recursos.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {espacio.recursos.map(r => (
                              <Badge key={r.id} variant="outline" className="text-xs">{r.nombre}</Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Sin recursos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoBadge(espacio.estado || 'Disponible').className}>
                          {getEstadoBadge(espacio.estado || 'Disponible').label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(espacio)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDeleteDialog(espacio)}
                            className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ==================== MODAL: CREAR ESPACIO ==================== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Registrar Nuevo Espacio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Aula 101"
                  value={espacioForm.nombre}
                  onChange={(e) => setEspacioForm({ ...espacioForm, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad *</Label>
                <Input
                  id="capacidad"
                  type="number"
                  min="1"
                  placeholder="Ej: 40"
                  value={espacioForm.capacidad}
                  onChange={(e) => setEspacioForm({ ...espacioForm, capacidad: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select
                  value={espacioForm.tipo_id}
                  onValueChange={(value) => setEspacioForm({ ...espacioForm, tipo_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEspacio.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id?.toString() || ''}>{tipo.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sede">Sede *</Label>
                <Select
                  value={espacioForm.sede_id}
                  onValueChange={(value) => setEspacioForm({ ...espacioForm, sede_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedes.map(sede => (
                      <SelectItem key={sede.id} value={sede.id?.toString() || ''}>{sede.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubicacion">Ubicación *</Label>
              <Input
                id="ubicacion"
                placeholder="Ej: Edificio A, Pasillo 2"
                value={espacioForm.ubicacion}
                onChange={(e) => setEspacioForm({ ...espacioForm, ubicacion: e.target.value })}
              />
            </div>

            {/* Recursos Necesarios */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Recursos Disponibles
                </Label>
              </div>

              {mostrandoRecursos && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={recursoSeleccionado} onValueChange={setRecursoSeleccionado}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccione un recurso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recursosDisponibles.filter(r => !recursosAgregados.some(ra => ra.id === r.id)).map(recurso => (
                          <SelectItem key={recurso.id} value={recurso.id?.toString() || ''}>
                            {recurso.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const recurso = recursosDisponibles.find(r => r.id?.toString() === recursoSeleccionado);
                        if (recurso && !recursosAgregados.some(ra => ra.id === recurso.id)) {
                          setRecursosAgregados([...recursosAgregados, recurso]);
                          setRecursoSeleccionado('');
                        }
                      }}
                      disabled={!recursoSeleccionado}
                      className="whitespace-nowrap"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMostrandoRecursos(false)}
                    className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar Agregación
                  </Button>
                </div>
              )}

              {/* Lista de recursos agregados */}
              {recursosAgregados.length > 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <strong>Recursos agregados:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recursosAgregados.map(recurso => (
                      <Badge
                        key={recurso.id}
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                      >
                        {recurso.nombre}
                        <button
                          type="button"
                          onClick={() => {
                            setRecursosAgregados(recursosAgregados.filter(r => r.id !== recurso.id));
                            setMostrandoRecursos(true);
                          }}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {!mostrandoRecursos && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrandoRecursos(true)}
                      className="mt-2 w-full text-blue-600"
                    >
                      Agregar más recursos
                    </Button>
                  )}
                </div>
              ) : (
                !mostrandoRecursos && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMostrandoRecursos(true)}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar recursos
                  </Button>
                )
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
              onClick={handleCreateEspacio}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: EDITAR ESPACIO ==================== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Editar Espacio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nombre">Nombre *</Label>
                <Input
                  id="edit-nombre"
                  value={espacioForm.nombre}
                  onChange={(e) => setEspacioForm({ ...espacioForm, nombre: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacidad">Capacidad *</Label>
                <Input
                  id="edit-capacidad"
                  type="number"
                  min="1"
                  value={espacioForm.capacidad}
                  onChange={(e) => setEspacioForm({ ...espacioForm, capacidad: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo *</Label>
                <Select
                  value={espacioForm.tipo_id}
                  onValueChange={(value) => setEspacioForm({ ...espacioForm, tipo_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEspacio.map(tipo => (
                      <SelectItem key={tipo.id} value={tipo.id?.toString() || ''}>{tipo.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sede">Sede *</Label>
                <Select
                  value={espacioForm.sede_id}
                  onValueChange={(value) => setEspacioForm({ ...espacioForm, sede_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedes.map(sede => (
                      <SelectItem key={sede.id} value={sede.id?.toString() || ''}>{sede.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-ubicacion">Ubicación *</Label>
              <Input
                id="edit-ubicacion"
                placeholder="Ej: Edificio A, Pasillo 2"
                value={espacioForm.ubicacion}
                onChange={(e) => setEspacioForm({ ...espacioForm, ubicacion: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-estado">Estado *</Label>
              <Select
                value={espacioForm.estado}
                onValueChange={(value: any) => setEspacioForm({ ...espacioForm, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="No Disponible">No Disponible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recursos Necesarios */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Recursos Disponibles
                </Label>
              </div>

              {mostrandoRecursos && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={recursoSeleccionado} onValueChange={setRecursoSeleccionado}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccione un recurso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recursosDisponibles.filter(r => !recursosAgregados.some(ra => ra.id === r.id)).map(recurso => (
                          <SelectItem key={recurso.id} value={recurso.id?.toString() || ''}>
                            {recurso.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        const recurso = recursosDisponibles.find(r => r.id?.toString() === recursoSeleccionado);
                        if (recurso && !recursosAgregados.some(ra => ra.id === recurso.id)) {
                          setRecursosAgregados([...recursosAgregados, recurso]);
                          setRecursoSeleccionado('');
                        }
                      }}
                      disabled={!recursoSeleccionado}
                      className="whitespace-nowrap"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMostrandoRecursos(false)}
                    className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar Agregación
                  </Button>
                </div>
              )}

              {/* Lista de recursos agregados */}
              {recursosAgregados.length > 0 ? (
                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <strong>Recursos agregados:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recursosAgregados.map(recurso => (
                      <Badge
                        key={recurso.id}
                        variant="outline"
                        className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                      >
                        {recurso.nombre}
                        <button
                          type="button"
                          onClick={() => {
                            setRecursosAgregados(recursosAgregados.filter(r => r.id !== recurso.id));
                            setMostrandoRecursos(true);
                          }}
                          className="ml-2 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  {!mostrandoRecursos && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrandoRecursos(true)}
                      className="mt-2 w-full text-blue-600"
                    >
                      Agregar más recursos
                    </Button>
                  )}
                </div>
              ) : (
                !mostrandoRecursos && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMostrandoRecursos(true)}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Agregar recursos
                  </Button>
                )
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditEspacio}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: ELIMINAR ESPACIO ==================== */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Eliminar Espacio</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 dark:text-slate-400">
              ¿Estás seguro de que deseas eliminar este espacio? Esta acción no se puede deshacer.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteEspacio}
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
