import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Switch } from '../../share/switch';
import { Search, UserPlus, Edit, Trash2, UserCog, Users, BookOpen, CheckCircle, XCircle, Eye, Edit3, Plus, X, Check } from 'lucide-react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useGestionUsuarios, componentesDelSistema, programasDisponibles } from '../../hooks/gestionAcademica/useGestionUsuarios';

export default function GestionUsuarios() {
  const {
    searchTerm, setSearchTerm,
    filterRol, setFilterRol,
    dialogOpen, setDialogOpen,
    editDialogOpen, setEditDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    userToDelete, setUserToDelete,
    editingUser, setEditingUser,
    nuevoUsuario, setNuevoUsuario,
    componenteSeleccionado, setComponenteSeleccionado,
    permisoSeleccionado, setPermisoSeleccionado,

    componenteEnEdicion,
    programaSeleccionado, setProgramaSeleccionado,
    mostrandoProgramas, setMostrandoProgramas,
    accesoTodosProgramas, setAccesoTodosProgramas,
    componenteSeleccionadoEdit, setComponenteSeleccionadoEdit,
    permisoSeleccionadoEdit, setPermisoSeleccionadoEdit,

    componenteEnEdicionEdit,
    programaSeleccionadoEdit, setProgramaSeleccionadoEdit,
    mostrandoProgramasEdit, setMostrandoProgramasEdit,
    accesoTodosProgramasEdit, setAccesoTodosProgramasEdit,
    cargarPermisosPorRol,
    agregarComponente,
    eliminarComponente,
    iniciarEdicionComponente,
    guardarEdicionComponente,
    cancelarEdicionComponente,
    agregarPrograma,
    eliminarPrograma,
    agregarComponenteEdit,
    eliminarComponenteEdit,
    iniciarEdicionComponenteEdit,
    guardarEdicionComponenteEdit,
    cancelarEdicionComponenteEdit,
    agregarProgramaEdit,
    eliminarProgramaEdit,
    crearUsuario,
    resetNuevoUsuario,
    actualizarUsuario,
    resetEditStates,
    abrirEdicion,
    cambiarEstadoUsuario,
    confirmarEliminarUsuario,
    filteredUsuarios,
    notification
  } = useGestionUsuarios();

  const getRolBadge = (rol: string) => {
    switch (rol) {
      case 'admin':
        return <Badge className="bg-red-600 text-white"><UserCog className="w-3 h-3 mr-1" />Administrador</Badge>;
      case 'autorizado':
        return <Badge className="bg-purple-600 text-white"><Users className="w-3 h-3 mr-1" />Autorizado</Badge>;
      case 'consultor':
        return <Badge className="bg-blue-600 text-white"><BookOpen className="w-3 h-3 mr-1" />Consultor</Badge>;
      default:
        return null;
    }
  };

  const getEstadoBadge = (activo: boolean) => {
    return activo
      ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>
      : <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Inactivo</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <NotificationBanner notification={notification} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Gestión de Usuarios</h1>
          <p className="text-slate-600 dark:text-slate-400">Administra usuarios, componentes y permisos por programa</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) resetNuevoUsuario();
        }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white">
              <UserPlus className="w-4 h-4 mr-2" />
              Crear Usuario
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Usuario</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Información Básica */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Información Básica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo *</Label>
                    <Input
                      placeholder="Ej: Juan Pérez"
                      value={nuevoUsuario.nombre}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Correo Institucional *</Label>
                    <Input
                      type="email"
                      placeholder="usuario@unilibre.edu.co"
                      value={nuevoUsuario.email}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña *</Label>
                    <Input
                      type="password"
                      placeholder="********"
                      value={nuevoUsuario.password}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rol *</Label>
                    <Select value={nuevoUsuario.rol} onValueChange={(value) => cargarPermisosPorRol(value as typeof nuevoUsuario.rol)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="autorizado">Autorizado</SelectItem>
                        <SelectItem value="consultor">Consultor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Componentes Asignados */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Componentes Asignados</h3>

                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {componenteEnEdicion ? (
                      <>
                        <Input
                          value={componentesDelSistema.find(c => c.id === componenteEnEdicion.componenteId)?.nombre || ''}
                          disabled
                          className="flex-1 bg-white text-sm"
                        />
                        <div className="flex gap-2">
                          <Select value={permisoSeleccionado} onValueChange={(value: 'ver' | 'editar') => setPermisoSeleccionado(value)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ver">
                                <span className="flex items-center gap-1 text-xs">
                                  <Eye className="w-3 h-3" /> Ver
                                </span>
                              </SelectItem>
                              <SelectItem value="editar">
                                <span className="flex items-center gap-1 text-xs">
                                  <Edit3 className="w-3 h-3" /> Editar
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={guardarEdicionComponente}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelarEdicionComponente}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Select value={componenteSeleccionado} onValueChange={setComponenteSeleccionado}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccione componente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {componentesDelSistema
                              .filter(c => !nuevoUsuario.permisos?.find(p => p.componenteId === c.id))
                              .map(comp => (
                                <SelectItem key={comp.id} value={comp.id}>
                                  {comp.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Select value={permisoSeleccionado} onValueChange={(value: 'ver' | 'editar') => setPermisoSeleccionado(value)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ver">
                                <span className="flex items-center gap-1 text-xs">
                                  <Eye className="w-3 h-3" /> Ver
                                </span>
                              </SelectItem>
                              <SelectItem value="editar">
                                <span className="flex items-center gap-1 text-xs">
                                  <Edit3 className="w-3 h-3" /> Editar
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={agregarComponente}
                            disabled={!componenteSeleccionado}
                            className="whitespace-nowrap"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {nuevoUsuario.permisos && nuevoUsuario.permisos.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-2">Click para editar permiso, X para eliminar</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                      {nuevoUsuario.permisos.map(permiso => (
                        <Badge
                          key={permiso.componenteId}
                          variant="outline"
                          className={`px-2 py-1 text-xs cursor-pointer transition-colors ${permiso.permiso === 'editar'
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                            }`}
                          onClick={() => iniciarEdicionComponente(permiso)}
                        >
                          {permiso.permiso === 'editar' ? <Edit3 className="w-2.5 h-2.5 mr-1 inline" /> : <Eye className="w-2.5 h-2.5 mr-1 inline" />}
                          {componentesDelSistema.find(c => c.id === permiso.componenteId)?.nombre}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarComponente(permiso.componenteId);
                            }}
                            className="ml-1.5 hover:text-red-600"
                          >
                            <X className="w-2.5 h-2.5 inline" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Programas Asignados (Solo para Admin y Autorizado) */}
              {nuevoUsuario.rol !== 'consultor' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Programas Asignados</h3>

                  <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div>
                      <Label className="text-sm text-purple-900">Acceso a todos los programas</Label>
                      <p className="text-xs text-purple-700 mt-1">
                        Si está activado, el usuario tendrá acceso a todos los programas
                      </p>
                    </div>
                    <Switch
                      checked={accesoTodosProgramas}
                      onCheckedChange={setAccesoTodosProgramas}
                    />
                  </div>

                  {!accesoTodosProgramas && (
                    <>
                      {mostrandoProgramas && (
                        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex gap-2">
                            <Select value={programaSeleccionado} onValueChange={setProgramaSeleccionado}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Seleccione un programa..." />
                              </SelectTrigger>
                              <SelectContent>
                                {programasDisponibles
                                  .filter(p => !nuevoUsuario.programasRestringidos?.includes(p))
                                  .map(prog => (
                                    <SelectItem key={prog} value={prog}>{prog}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={agregarPrograma}
                              disabled={!programaSeleccionado}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMostrandoProgramas(false)}
                            className="w-full border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Finalizar Agregación
                          </Button>
                        </div>
                      )}

                      {nuevoUsuario.programasRestringidos && nuevoUsuario.programasRestringidos.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="flex flex-wrap gap-2">
                            {nuevoUsuario.programasRestringidos.map(prog => (
                              <Badge key={prog} className="bg-purple-600 text-white px-3 py-2 text-sm">
                                {prog}
                                <button
                                  type="button"
                                  onClick={() => eliminarPrograma(prog)}
                                  className="ml-2 hover:text-red-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          {!mostrandoProgramas && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMostrandoProgramas(true)}
                              className="mt-3 w-full text-blue-600"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar más programas
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {accesoTodosProgramas && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mb-2" />
                      <p className="text-sm text-blue-900">
                        El usuario tendrá acceso a <strong>todos los programas</strong> del sistema.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                resetNuevoUsuario();
              }}>
                Cancelar
              </Button>
              <Button onClick={crearUsuario} className="bg-red-600 hover:bg-red-700 text-white">
                Crear Usuario
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtros */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterRol} onValueChange={setFilterRol}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los roles</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="autorizado">Autorizado</SelectItem>
            <SelectItem value="consultor">Consultor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de Usuarios */}
      <Card className="border-slate-200">
        <CardHeader>
          <CardTitle className="text-slate-900">Usuarios Registrados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Permisos</TableHead>
                <TableHead>Programas</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div>
                        <p className="text-slate-900">{usuario.nombre}</p>
                        <p className="text-xs text-slate-500">ID: {usuario.id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700">{usuario.email}</TableCell>
                    <TableCell>{getRolBadge(usuario.rol)}</TableCell>
                    <TableCell>{getEstadoBadge(usuario.activo)}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                        {usuario.permisos.length} componentes
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {usuario.accesoTodosProgramas ? (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          Todos
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {usuario.programasRestringidos.length} programas
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-600 text-sm">{usuario.ultimoAcceso || 'Nunca'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => abrirEdicion(usuario)}
                          className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => cambiarEstadoUsuario(usuario.id)}
                          className={`h-8 w-8 p-0 ${usuario.activo ? 'hover:bg-red-50 hover:text-red-600' : 'hover:bg-green-50 hover:text-green-600'}`}
                        >
                          {usuario.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setUserToDelete(usuario);
                            setDeleteDialogOpen(true);
                          }}
                          className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
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

      {/* Dialog: Editar Usuario */}
      <Dialog open={editDialogOpen} onOpenChange={(open) => {
        setEditDialogOpen(open);
        if (!open) {
          setEditingUser(null);
          resetEditStates();
        }
      }}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Usuario: {editingUser?.nombre}</DialogTitle>
          </DialogHeader>

          {editingUser && (
            <div className="space-y-6 py-4">
              {/* Información básica */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Información Básica</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nombre Completo</Label>
                    <Input
                      value={editingUser.nombre}
                      onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      value={editingUser.email}
                      onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña</Label>
                    <Input
                      type="password"
                      value={editingUser.password}
                      onChange={(e) => setEditingUser({ ...editingUser, password: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rol</Label>
                    <Select
                      value={editingUser.rol}
                      onValueChange={(value) => setEditingUser({ ...editingUser, rol: value as typeof editingUser.rol })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="autorizado">Autorizado</SelectItem>
                        <SelectItem value="consultor">Consultor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Componentes Asignados */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Componentes Asignados</h3>

                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex flex-col sm:flex-row gap-2">
                    {componenteEnEdicionEdit ? (
                      <>
                        <Input
                          value={componentesDelSistema.find(c => c.id === componenteEnEdicionEdit.componenteId)?.nombre || ''}
                          disabled
                          className="flex-1 bg-white text-sm"
                        />
                        <div className="flex gap-2">
                          <Select value={permisoSeleccionadoEdit} onValueChange={(value: 'ver' | 'editar') => setPermisoSeleccionadoEdit(value)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ver">
                                <span className="flex items-center gap-1 text-xs">
                                  <Eye className="w-3 h-3" /> Ver
                                </span>
                              </SelectItem>
                              <SelectItem value="editar">
                                <span className="flex items-center gap-1 text-xs">
                                  <Edit3 className="w-3 h-3" /> Editar
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="default"
                            onClick={guardarEdicionComponenteEdit}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Check className="w-3 h-3" />
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={cancelarEdicionComponenteEdit}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Select value={componenteSeleccionadoEdit} onValueChange={setComponenteSeleccionadoEdit}>
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Seleccione componente..." />
                          </SelectTrigger>
                          <SelectContent>
                            {componentesDelSistema
                              .filter(c => !editingUser.permisos.find(p => p.componenteId === c.id))
                              .map(comp => (
                                <SelectItem key={comp.id} value={comp.id}>
                                  {comp.nombre}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                        <div className="flex gap-2">
                          <Select value={permisoSeleccionadoEdit} onValueChange={(value: 'ver' | 'editar') => setPermisoSeleccionadoEdit(value)}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ver">
                                <span className="flex items-center gap-1 text-xs">
                                  <Eye className="w-3 h-3" /> Ver
                                </span>
                              </SelectItem>
                              <SelectItem value="editar">
                                <span className="flex items-center gap-1 text-xs">
                                  <Edit3 className="w-3 h-3" /> Editar
                                </span>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={agregarComponenteEdit}
                            disabled={!componenteSeleccionadoEdit}
                            className="whitespace-nowrap"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {editingUser.permisos.length > 0 && (
                  <div className="bg-white border border-slate-200 rounded-lg p-3">
                    <p className="text-xs text-slate-600 mb-2">Click para editar permiso, X para eliminar</p>
                    <div className="flex flex-wrap gap-1.5 max-h-[200px] overflow-y-auto">
                      {editingUser.permisos.map(permiso => (
                        <Badge
                          key={permiso.componenteId}
                          variant="outline"
                          className={`px-2 py-1 text-xs cursor-pointer transition-colors ${permiso.permiso === 'editar'
                            ? 'bg-green-50 text-green-700 border-green-300 hover:bg-green-100'
                            : 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100'
                            }`}
                          onClick={() => iniciarEdicionComponenteEdit(permiso)}
                        >
                          {permiso.permiso === 'editar' ? <Edit3 className="w-2.5 h-2.5 mr-1 inline" /> : <Eye className="w-2.5 h-2.5 mr-1 inline" />}
                          {componentesDelSistema.find(c => c.id === permiso.componenteId)?.nombre}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              eliminarComponenteEdit(permiso.componenteId);
                            }}
                            className="ml-1.5 hover:text-red-600"
                          >
                            <X className="w-2.5 h-2.5 inline" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Programas Asignados */}
              {editingUser.rol !== 'consultor' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Programas Asignados</h3>

                  <div className="flex items-center justify-between p-4 bg-purple-50 border border-purple-200 rounded-lg">
                    <div>
                      <Label className="text-sm text-purple-900">Acceso a todos los programas</Label>
                      <p className="text-xs text-purple-700 mt-1">
                        Si está activado, el usuario tendrá acceso a todos los programas
                      </p>
                    </div>
                    <Switch
                      checked={accesoTodosProgramasEdit}
                      onCheckedChange={setAccesoTodosProgramasEdit}
                    />
                  </div>

                  {!accesoTodosProgramasEdit && (
                    <>
                      {mostrandoProgramasEdit && (
                        <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-4">
                          <div className="flex gap-2">
                            <Select value={programaSeleccionadoEdit} onValueChange={setProgramaSeleccionadoEdit}>
                              <SelectTrigger className="flex-1">
                                <SelectValue placeholder="Seleccione un programa..." />
                              </SelectTrigger>
                              <SelectContent>
                                {programasDisponibles
                                  .filter(p => !editingUser.programasRestringidos.includes(p))
                                  .map(prog => (
                                    <SelectItem key={prog} value={prog}>{prog}</SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={agregarProgramaEdit}
                              disabled={!programaSeleccionadoEdit}
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar
                            </Button>
                          </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setMostrandoProgramasEdit(false)}
                            className="w-full border-green-600 text-green-600 hover:bg-green-50"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Finalizar
                          </Button>
                        </div>
                      )}

                      {editingUser.programasRestringidos.length > 0 && (
                        <div className="bg-white border border-slate-200 rounded-lg p-4">
                          <div className="flex flex-wrap gap-2">
                            {editingUser.programasRestringidos.map(prog => (
                              <Badge key={prog} className="bg-purple-600 text-white px-3 py-2 text-sm">
                                {prog}
                                <button
                                  type="button"
                                  onClick={() => eliminarProgramaEdit(prog)}
                                  className="ml-2 hover:text-red-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                          {!mostrandoProgramasEdit && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setMostrandoProgramasEdit(true)}
                              className="mt-3 w-full text-blue-600"
                            >
                              <Plus className="w-4 h-4 mr-2" />
                              Agregar más programas
                            </Button>
                          )}
                        </div>
                      )}
                    </>
                  )}

                  {accesoTodosProgramasEdit && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-blue-600 mb-2" />
                      <p className="text-sm text-blue-900">
                        El usuario tendrá acceso a <strong>todos los programas</strong> del sistema.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingUser(null);
              resetEditStates();
            }}>
              Cancelar
            </Button>
            <Button onClick={actualizarUsuario} className="bg-red-600 hover:bg-red-700 text-white">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar Eliminación */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Eliminación</DialogTitle>
          </DialogHeader>
          <p className="text-slate-700">
            ¿Está seguro que desea eliminar al usuario <strong>{userToDelete?.nombre}</strong>? Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmarEliminarUsuario} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
