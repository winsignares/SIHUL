import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Switch } from '../../share/switch';
import { Search, UserPlus, Edit, Trash2, UserCog, Users, BookOpen, CheckCircle, XCircle, Plus, X } from 'lucide-react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useGestionUsuarios } from '../../hooks/gestionAcademica/useGestionUsuarios';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function GestionUsuarios() {
  const isMobile = useIsMobile();
  const {
    searchTerm, setSearchTerm,
    filterRol, setFilterRol,
    dialogOpen, setDialogOpen,
    editDialogOpen, setEditDialogOpen,
    deleteDialogOpen, setDeleteDialogOpen,
    userToDelete, setUserToDelete,
    editingUser, setEditingUser,
    nuevoUsuario, setNuevoUsuario,
    crearUsuario,
    resetNuevoUsuario,
    actualizarUsuario,
    resetEditStates,
    abrirEdicion,
    cambiarEstadoUsuario,
    confirmarEliminarUsuario,
    filteredUsuarios,
    notification,
    rolesDisponibles,
    facultadesDisponibles,
    espaciosDisponibles,
    espacioSeleccionado, setEspacioSeleccionado,
    espaciosPermitidos,
    espacioSeleccionadoEdit, setEspacioSeleccionadoEdit,
    espaciosPermitidosEdit,
    facultadSeleccionada, setFacultadSeleccionada,
    facultadSeleccionadaEdit, setFacultadSeleccionadaEdit,
    agregarEspacioPermitido,
    eliminarEspacioPermitido,
    agregarEspacioPermitidoEdit,
    eliminarEspacioPermitidoEdit
  } = useGestionUsuarios();

  const getRolBadge = (usuario: any) => {
    // Intentar obtener el nombre del rol del objeto anidado o buscarlo por ID
    let rolNombre = usuario.rol?.nombre;
    if (!rolNombre && usuario.rol_id) {
      const rolEncontrado = rolesDisponibles.find(r => r.id === usuario.rol_id);
      rolNombre = rolEncontrado?.nombre;
    }
    rolNombre = rolNombre || 'desconocido';

    const colors: Record<string, string> = {
      admin: 'bg-red-600',
      supervisor_general: 'bg-purple-600',
      planeacion_facultad: 'bg-blue-600',
      docente: 'bg-green-600',
      estudiante: 'bg-yellow-600'
    };

    // Para planeacion_facultad, mostrar "Planeacion (Facultad)"
    if (rolNombre === 'planeacion_facultad') {
      let facultadNombre = usuario.facultad?.nombre;
      if (!facultadNombre && usuario.facultad_id) {
        const facultadEncontrada = facultadesDisponibles.find(f => f.id === usuario.facultad_id);
        facultadNombre = facultadEncontrada?.nombre;
      }

      if (facultadNombre) {
        return (
          <Badge className={`${colors[rolNombre]} text-white`}>
            <UserCog className="w-3 h-3 mr-1" />
            Planeacion ({facultadNombre})
          </Badge>
        );
      }
    }

    return <Badge className={`${colors[rolNombre] || 'bg-gray-600'} text-white`}><UserCog className="w-3 h-3 mr-1" />{rolNombre}</Badge>;
  };

  const getEstadoBadge = (activo: boolean) => {
    return activo
      ? <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>
      : <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Inactivo</Badge>;
  };

  const getRolNombre = () => {
    const rolActual = rolesDisponibles.find(r => r.id === nuevoUsuario.rol_id);
    return rolActual?.nombre || '';
  };

  const getRolNombreEdit = () => {
    const rolId = editingUser?.rol_id || editingUser?.rol?.id;
    const rolActual = rolesDisponibles.find(r => r.id === rolId);
    return rolActual?.nombre || '';
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
      <NotificationBanner notification={notification} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Gestión de Usuarios</h1>
          <p className="text-slate-600 dark:text-slate-400">Administra usuarios del sistema</p>
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

          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                      value={nuevoUsuario.correo}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña *</Label>
                    <Input
                      type="password"
                      placeholder="********"
                      value={nuevoUsuario.contrasena}
                      onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contrasena: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Rol *</Label>
                    <Select
                      value={nuevoUsuario.rol_id?.toString() || ''}
                      onValueChange={(value) => setNuevoUsuario({ ...nuevoUsuario, rol_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione un rol" />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesDisponibles.map(rol => (
                          <SelectItem key={rol.id} value={rol.id.toString()}>
                            {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Facultad (solo para planeacion_facultad) */}
              {getRolNombre() === 'planeacion_facultad' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Facultad</h3>
                  <div className="space-y-2">
                    <Label>Facultad Asignada *</Label>
                    <Select
                      value={facultadSeleccionada?.toString() || ''}
                      onValueChange={(value) => setFacultadSeleccionada(parseInt(value))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una facultad" />
                      </SelectTrigger>
                      <SelectContent>
                        {facultadesDisponibles.map(facultad => (
                          <SelectItem key={facultad.id} value={facultad.id.toString()}>
                            {facultad.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              {/* Espacios Permitidos (solo para supervisor_general) */}
              {getRolNombre() === 'supervisor_general' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Espacios Permitidos</h3>

                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <Select value={espacioSeleccionado} onValueChange={setEspacioSeleccionado}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccione un espacio..." />
                        </SelectTrigger>
                        <SelectContent>
                          {espaciosDisponibles
                            .filter(e => !espaciosPermitidos.includes(e.id))
                            .map(espacio => (
                              <SelectItem key={espacio.id} value={espacio.id.toString()}>
                                {espacio.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={agregarEspacioPermitido}
                        disabled={!espacioSeleccionado}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {espaciosPermitidos.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <p className="text-xs text-slate-600 mb-2">Espacios asignados (Click en X para eliminar)</p>
                      <div className="flex flex-wrap gap-2">
                        {espaciosPermitidos.map(espacioId => {
                          const espacio = espaciosDisponibles.find(e => e.id === espacioId);
                          return espacio ? (
                            <Badge key={espacioId} className="bg-purple-600 text-white px-3 py-2">
                              {espacio.nombre}
                              <button
                                type="button"
                                onClick={() => eliminarEspacioPermitido(espacioId)}
                                className="ml-2 hover:text-red-200"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
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
            {rolesDisponibles.map(rol => (
              <SelectItem key={rol.id} value={rol.nombre}>
                {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).replace('_', ' ')}
              </SelectItem>
            ))}
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
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsuarios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
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
                    <TableCell className="text-slate-700">{usuario.correo}</TableCell>
                    <TableCell>{getRolBadge(usuario)}</TableCell>
                    <TableCell>{getEstadoBadge(usuario.activo)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => abrirEdicion(usuario)}
                          className="bg-blue-600 hover:bg-blue-700 text-white h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => cambiarEstadoUsuario(usuario.id as number)}
                          className={`h-8 w-8 p-0 ${usuario.activo
                            ? 'bg-orange-600 hover:bg-orange-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                            }`}
                          title={usuario.activo ? 'Desactivar' : 'Activar'}
                        >
                          {usuario.activo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setUserToDelete(usuario);
                            setDeleteDialogOpen(true);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white h-8 w-8 p-0"
                          title="Eliminar"
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
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
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
                    <Label>Nombre Completo *</Label>
                    <Input
                      placeholder="Ej: Juan Pérez"
                      value={editingUser.nombre}
                      onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Correo Institucional *</Label>
                    <Input
                      type="email"
                      placeholder="usuario@unilibre.edu.co"
                      value={editingUser.correo}
                      onChange={(e) => setEditingUser({ ...editingUser, correo: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nueva Contraseña (opcional)</Label>
                    <Input
                      type="password"
                      placeholder="Dejar vacío para no cambiar"
                      value={editingUser.contrasena || ''}
                      onChange={(e) => setEditingUser({ ...editingUser, contrasena: e.target.value })}
                    />
                    <p className="text-xs text-slate-500">Solo ingrese una contraseña si desea cambiarla</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Rol *</Label>
                    <Select
                      value={editingUser.rol_id?.toString() || ''}
                      onValueChange={(value) => setEditingUser({ ...editingUser, rol_id: parseInt(value) })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {rolesDisponibles.map(rol => (
                          <SelectItem key={rol.id} value={rol.id.toString()}>
                            {rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).replace('_', ' ')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Facultad (solo para planeacion_facultad) */}
              {getRolNombreEdit() === 'planeacion_facultad' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Facultad</h3>
                  <Select
                    value={facultadSeleccionadaEdit?.toString() || ''}
                    onValueChange={(value) => setFacultadSeleccionadaEdit(parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccione una facultad" />
                    </SelectTrigger>
                    <SelectContent>
                      {facultadesDisponibles.map(facultad => (
                        <SelectItem key={facultad.id} value={facultad.id.toString()}>
                          {facultad.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Espacios Permitidos (solo para supervisor_general) */}
              {getRolNombreEdit() === 'supervisor_general' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Espacios Permitidos</h3>

                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <Select value={espacioSeleccionadoEdit} onValueChange={setEspacioSeleccionadoEdit}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Seleccione un espacio..." />
                        </SelectTrigger>
                        <SelectContent>
                          {espaciosDisponibles
                            .filter(e => !espaciosPermitidosEdit.includes(e.id))
                            .map(espacio => (
                              <SelectItem key={espacio.id} value={espacio.id.toString()}>
                                {espacio.nombre}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={agregarEspacioPermitidoEdit}
                        disabled={!espacioSeleccionadoEdit}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {espaciosPermitidosEdit.length > 0 && (
                    <div className="bg-white border border-slate-200 rounded-lg p-3">
                      <div className="flex flex-wrap gap-2">
                        {espaciosPermitidosEdit.map(espacioId => {
                          const espacio = espaciosDisponibles.find(e => e.id === espacioId);
                          return espacio ? (
                            <Badge key={espacioId} className="bg-purple-600 text-white px-3 py-2">
                              {espacio.nombre}
                              <button
                                type="button"
                                onClick={() => eliminarEspacioPermitidoEdit(espacioId)}
                                className="ml-2 hover:text-red-200"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
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
          <p className="text-slate-600">
            ¿Está seguro que desea eliminar al usuario <strong>{userToDelete?.nombre}</strong>?
            Esta acción no se puede deshacer.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={confirmarEliminarUsuario}
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
