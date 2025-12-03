import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Search, User, Check, X, Eye, Mail, Phone, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useDocentes } from '../../hooks/gestionAcademica/useDocentes';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function Docentes() {
  const isMobile = useIsMobile();
  const {
    searchTerm, setSearchTerm,
    facultades,
    asignaturas,
    selectedFacultad, setSelectedFacultad,
    selectedEstado, setSelectedEstado,
    showCreateDialog, setShowCreateDialog,
    showEditDialog, setShowEditDialog,
    showDeleteDialog, setShowDeleteDialog,
    showDetallesDialog, setShowDetallesDialog,
    docenteForm, setDocenteForm,
    facultadesSeleccionadas,
    asignaturasSeleccionadas,
    facultadActual, setFacultadActual,
    asignaturaActual, setAsignaturaActual,
    selectedDocente,
    getFacultadNombre,
    getAsignaturaNombre,
    getEstadoColor,
    getEstadoLabel,
    estadosDocente,
    agregarFacultad,
    eliminarFacultad,
    agregarAsignatura,
    eliminarAsignatura,
    handleCreateDocente,
    openEditDialog,
    handleEditDocente,
    openDeleteDialog,
    handleDeleteDocente,
    openDetallesDialog,
    openCreateDialog,
    docentesFiltrados,
    notification
  } = useDocentes();

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <NotificationBanner notification={notification} />
      {/* Header */}
      <div className={`flex ${isMobile ? 'flex-col gap-4' : 'items-center justify-between'}`}>
        <div>
          <h2 className={`${isMobile ? 'text-lg' : 'text-2xl'} font-bold text-slate-900 mb-1`}>Gestión de Docentes</h2>
        </div>
        <Button onClick={openCreateDialog} className={`bg-red-600 hover:bg-red-700 text-white ${isMobile ? 'w-full' : ''}`}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Docente
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-4'}`}>
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <Label className="text-slate-700 mb-2">Buscar Docente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Nombre, email o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro Facultad */}
            <div>
              <Label className="text-slate-700 mb-2">Facultad</Label>
              <Select value={selectedFacultad} onValueChange={setSelectedFacultad}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las facultades</SelectItem>
                  {facultades.map(facultad => (
                    <SelectItem key={facultad.id} value={facultad.id}>
                      {facultad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Estado */}
            <div>
              <Label className="text-slate-700 mb-2">Estado</Label>
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {estadosDocente.map(estado => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-slate-600">
              {docentesFiltrados.length} docente{docentesFiltrados.length !== 1 ? 's' : ''} encontrado{docentesFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>

          {docentesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No se encontraron docentes</p>
              <p className="text-slate-500 text-sm mt-2">
                {searchTerm || selectedFacultad !== 'all' || selectedEstado !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer docente'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Facultades</TableHead>
                    <TableHead>Asignaturas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docentesFiltrados.map((docente) => (
                    <motion.tr
                      key={docente.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <div>
                          <p className="text-slate-900">{docente.nombre}</p>
                          {docente.telefono && (
                            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {docente.telefono}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          {docente.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {docente.especialidad ? (
                          <div className="flex items-center gap-2 text-slate-600">
                            <GraduationCap className="w-4 h-4" />
                            {docente.especialidad}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin especialidad</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {docente.facultades.slice(0, 2).map(facultadId => (
                            <Badge key={facultadId} variant="outline" className="text-xs">
                              {getFacultadNombre(facultadId)}
                            </Badge>
                          ))}
                          {docente.facultades.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{docente.facultades.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {docente.asignaturas.slice(0, 2).map(asignaturaId => (
                            <Badge key={asignaturaId} variant="outline" className="text-xs">
                              {getAsignaturaNombre(asignaturaId)}
                            </Badge>
                          ))}
                          {docente.asignaturas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{docente.asignaturas.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(docente.estado)}>
                          {getEstadoLabel(docente.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetallesDialog(docente)}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(docente)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(docente)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear Docente */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Docente</DialogTitle>
            <DialogDescription>
              Complete la información del docente, sus facultades y asignaturas asignadas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información Básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-700 mb-2">Nombre Completo *</Label>
                <Input
                  placeholder="Ej: Dr. Juan Pérez López"
                  value={docenteForm.nombre}
                  onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Email *</Label>
                <Input
                  type="email"
                  placeholder="docente@unilibre.edu.co"
                  value={docenteForm.email}
                  onChange={(e) => setDocenteForm({ ...docenteForm, email: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Teléfono</Label>
                <Input
                  placeholder="+57 300 123 4567"
                  value={docenteForm.telefono}
                  onChange={(e) => setDocenteForm({ ...docenteForm, telefono: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Especialidad</Label>
                <Input
                  placeholder="Ej: Matemáticas, Derecho Civil"
                  value={docenteForm.especialidad}
                  onChange={(e) => setDocenteForm({ ...docenteForm, especialidad: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Estado *</Label>
                <Select
                  value={docenteForm.estado}
                  onValueChange={(value: any) => setDocenteForm({ ...docenteForm, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosDocente.map(estado => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Facultades */}
            <div>
              <Label className="text-slate-700 mb-2">Facultades *</Label>
              <div className="flex gap-2 mb-3">
                <Select value={facultadActual} onValueChange={setFacultadActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione una facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultades.map(facultad => (
                      <SelectItem key={facultad.id} value={facultad.id}>
                        {facultad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={agregarFacultad} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {facultadesSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {facultadesSeleccionadas.map(facultadId => (
                    <Badge key={facultadId} variant="secondary" className="flex items-center gap-2">
                      {getFacultadNombre(facultadId)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => eliminarFacultad(facultadId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Asignaturas */}
            <div>
              <Label className="text-slate-700 mb-2">Asignaturas que puede dictar *</Label>
              <div className="flex gap-2 mb-3">
                <Select value={asignaturaActual} onValueChange={setAsignaturaActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturas.map(asignatura => (
                      <SelectItem key={asignatura.id} value={asignatura.id}>
                        {asignatura.nombre} - {asignatura.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={agregarAsignatura} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {asignaturasSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {asignaturasSeleccionadas.map(asignaturaId => (
                    <Badge key={asignaturaId} variant="secondary" className="flex items-center gap-2">
                      {getAsignaturaNombre(asignaturaId)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => eliminarAsignatura(asignaturaId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDocente} className="bg-red-600 hover:bg-red-700 text-white">
              Guardar Docente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Docente */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Docente</DialogTitle>
            <DialogDescription>
              Modifique la información del docente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información Básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-700 mb-2">Nombre Completo *</Label>
                <Input
                  placeholder="Ej: Dr. Juan Pérez López"
                  value={docenteForm.nombre}
                  onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Email *</Label>
                <Input
                  type="email"
                  placeholder="docente@unilibre.edu.co"
                  value={docenteForm.email}
                  onChange={(e) => setDocenteForm({ ...docenteForm, email: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Teléfono</Label>
                <Input
                  placeholder="+57 300 123 4567"
                  value={docenteForm.telefono}
                  onChange={(e) => setDocenteForm({ ...docenteForm, telefono: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Especialidad</Label>
                <Input
                  placeholder="Ej: Matemáticas, Derecho Civil"
                  value={docenteForm.especialidad}
                  onChange={(e) => setDocenteForm({ ...docenteForm, especialidad: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Estado *</Label>
                <Select
                  value={docenteForm.estado}
                  onValueChange={(value: any) => setDocenteForm({ ...docenteForm, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosDocente.map(estado => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Facultades */}
            <div>
              <Label className="text-slate-700 mb-2">Facultades *</Label>
              <div className="flex gap-2 mb-3">
                <Select value={facultadActual} onValueChange={setFacultadActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione una facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultades.map(facultad => (
                      <SelectItem key={facultad.id} value={facultad.id}>
                        {facultad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={agregarFacultad} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {facultadesSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {facultadesSeleccionadas.map(facultadId => (
                    <Badge key={facultadId} variant="secondary" className="flex items-center gap-2">
                      {getFacultadNombre(facultadId)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => eliminarFacultad(facultadId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Asignaturas */}
            <div>
              <Label className="text-slate-700 mb-2">Asignaturas que puede dictar *</Label>
              <div className="flex gap-2 mb-3">
                <Select value={asignaturaActual} onValueChange={setAsignaturaActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturas.map(asignatura => (
                      <SelectItem key={asignatura.id} value={asignatura.id}>
                        {asignatura.nombre} - {asignatura.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={agregarAsignatura} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {asignaturasSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {asignaturasSeleccionadas.map(asignaturaId => (
                    <Badge key={asignaturaId} variant="secondary" className="flex items-center gap-2">
                      {getAsignaturaNombre(asignaturaId)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => eliminarAsignatura(asignaturaId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditDocente} className="bg-red-600 hover:bg-red-700 text-white">
              Actualizar Docente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar Docente */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar Docente</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar este docente? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDeleteDocente} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal Detalles Docente */}
      <Dialog open={showDetallesDialog} onOpenChange={setShowDetallesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Docente</DialogTitle>
          </DialogHeader>
          {selectedDocente && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{selectedDocente.nombre}</h3>
                  <p className="text-slate-500">{selectedDocente.especialidad || 'Sin especialidad'}</p>
                </div>
                <Badge className={getEstadoColor(selectedDocente.estado)}>
                  {getEstadoLabel(selectedDocente.estado)}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4" />
                  {selectedDocente.email}
                </div>
                {selectedDocente.telefono && (
                  <div className="flex items-center gap-2 text-slate-600">
                    <Phone className="w-4 h-4" />
                    {selectedDocente.telefono}
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Facultades</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDocente.facultades.map(facultadId => (
                    <Badge key={facultadId} variant="secondary">
                      {getFacultadNombre(facultadId)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-slate-900 mb-2">Asignaturas</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedDocente.asignaturas.map(asignaturaId => (
                    <Badge key={asignaturaId} variant="secondary">
                      {getAsignaturaNombre(asignaturaId)}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="text-xs text-slate-400 pt-4 border-t">
                Registrado el: {new Date(selectedDocente.fechaCreacion).toLocaleDateString()}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
