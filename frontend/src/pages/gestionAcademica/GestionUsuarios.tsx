import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../share/dialog';
import SearchableSelect from '../../share/searchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Switch } from '../../share/switch';
import { Search, UserPlus, Edit, Trash2, UserCog, Users, BookOpen, CheckCircle, XCircle, Plus, X, Eye, EyeOff, Mail, MapPin } from 'lucide-react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useGestionUsuarios } from '../../hooks/gestionAcademica/useGestionUsuarios';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useState } from 'react';

export default function GestionUsuarios() {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
    sedesDisponibles,
    tiposEspacioDisponibles,
    espacioSeleccionado, setEspacioSeleccionado,
    espaciosPermitidos,
    modoAsignacionSupervisor, setModoAsignacionSupervisor,
    tipoEspacioSeleccionado, setTipoEspacioSeleccionado,
    tiposEspacioPermitidos,
    asignarTodosEspaciosPorTipo, setAsignarTodosEspaciosPorTipo,
    agregarTipoEspacioPermitido,
    eliminarTipoEspacioPermitido,
    espacioSeleccionadoEdit, setEspacioSeleccionadoEdit,
    espaciosPermitidosEdit,
    modoAsignacionSupervisorEdit, setModoAsignacionSupervisorEdit,
    tipoEspacioSeleccionadoEdit, setTipoEspacioSeleccionadoEdit,
    tiposEspacioPermitidosEdit,
    asignarTodosEspaciosPorTipoEdit, setAsignarTodosEspaciosPorTipoEdit,
    agregarTipoEspacioPermitidoEdit,
    eliminarTipoEspacioPermitidoEdit,
    facultadSeleccionada, setFacultadSeleccionada,
    facultadSeleccionadaEdit, setFacultadSeleccionadaEdit,
    agregarEspacioPermitido,
    eliminarEspacioPermitido,
    agregarEspacioPermitidoEdit,
    eliminarEspacioPermitidoEdit,
    confirmarCorreo, setConfirmarCorreo,
    confirmarPassword, setConfirmarPassword,
    sedeSeleccionada, setSedeSeleccionada
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

  const tiposEspacioOpciones = [
    { id: 'todos', nombre: 'Todos' },
    ...tiposEspacioDisponibles.map((tipo) => ({ id: tipo.id.toString(), nombre: tipo.nombre }))
  ];

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
          if (!open) {
            resetNuevoUsuario();
            setShowPassword(false);
            setShowConfirmPassword(false);
          }
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
                    <div className="relative group">
                      <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                      <Input
                        placeholder="Juan Pérez García"
                        value={nuevoUsuario.nombre}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Sede Universitaria *</Label>
                    <div className="relative group">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors z-10" />
                      <SearchableSelect
                        items={sedesDisponibles}
                        value={sedeSeleccionada}
                        onSelect={(sede) => setSedeSeleccionada(sede.id.toString())}
                        getItemId={(sede) => sede.id.toString()}
                        getItemLabel={(sede) => sede.nombre}
                        placeholder="Seleccione una sede"
                        searchPlaceholder="Buscar sede..."
                        emptyMessage="No se encontraron sedes."
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Correo Institucional *</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                      <Input
                        type="email"
                        placeholder="correo@unilibre.edu.co"
                        value={nuevoUsuario.correo}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, correo: e.target.value })}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Correo *</Label>
                    <div className="relative group">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                      <Input
                        type="email"
                        placeholder="correo@unilibre.edu.co"
                        value={confirmarCorreo}
                        onChange={(e) => setConfirmarCorreo(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Contraseña *</Label>
                    <div className="relative group">
                      <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={nuevoUsuario.contrasena}
                        onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, contrasena: e.target.value })}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Confirmar Contraseña *</Label>
                    <div className="relative group">
                      <UserCog className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                      <Input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmarPassword}
                        onChange={(e) => setConfirmarPassword(e.target.value)}
                        className="pl-10 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Rol *</Label>
                    <SearchableSelect
                      items={rolesDisponibles}
                      value={nuevoUsuario.rol_id?.toString() || ''}
                      onSelect={(rol) => setNuevoUsuario({ ...nuevoUsuario, rol_id: rol.id })}
                      getItemId={(rol) => rol.id.toString()}
                      getItemLabel={(rol) => rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).replace('_', ' ')}
                      placeholder="Seleccione un rol"
                      searchPlaceholder="Buscar rol..."
                      emptyMessage="No se encontraron roles."
                    />
                  </div>
                </div>
              </div>

              {/* Facultad (solo para planeacion_facultad) */}
              {getRolNombre() === 'planeacion_facultad' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Facultad</h3>
                  <div className="space-y-2">
                    <Label>Facultad Asignada *</Label>
                    <SearchableSelect
                      items={facultadesDisponibles}
                      value={facultadSeleccionada?.toString() || ''}
                      onSelect={(facultad) => setFacultadSeleccionada(facultad.id)}
                      getItemId={(facultad) => facultad.id.toString()}
                      getItemLabel={(facultad) => facultad.nombre}
                      placeholder="Seleccione una facultad"
                      searchPlaceholder="Buscar facultad..."
                      emptyMessage="No se encontraron facultades."
                    />
                  </div>
                </div>
              )}

              {/* Espacios Permitidos (solo para supervisor_general) */}
              {getRolNombre() === 'supervisor_general' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Espacios Permitidos</h3>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={modoAsignacionSupervisor === 'individual' ? 'default' : 'outline'}
                      onClick={() => setModoAsignacionSupervisor('individual')}
                      className={modoAsignacionSupervisor === 'individual' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    >
                      Asignacion Individual
                    </Button>
                    <Button
                      type="button"
                      variant={modoAsignacionSupervisor === 'tipo' ? 'default' : 'outline'}
                      onClick={() => setModoAsignacionSupervisor('tipo')}
                      className={modoAsignacionSupervisor === 'tipo' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    >
                      Asignacion por Tipo
                    </Button>
                  </div>

                  {modoAsignacionSupervisor === 'individual' && (
                    <>
                      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex gap-2">
                          <SearchableSelect
                            items={espaciosDisponibles.filter(e => !espaciosPermitidos.includes(e.id))}
                            value={espacioSeleccionado}
                            onSelect={(espacio) => setEspacioSeleccionado(espacio.id.toString())}
                            getItemId={(espacio) => espacio.id.toString()}
                            getItemLabel={(espacio) => espacio.nombre}
                            placeholder="Seleccione un espacio..."
                            searchPlaceholder="Buscar espacio..."
                            emptyMessage="No hay espacios disponibles."
                            className="flex-1"
                          />
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
                    </>
                  )}

                  {modoAsignacionSupervisor === 'tipo' && (
                    <>
                      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex gap-2">
                          <SearchableSelect
                            items={tiposEspacioOpciones.filter((tipo) => {
                              if (tipo.id === 'todos') return !asignarTodosEspaciosPorTipo;
                              return !tiposEspacioPermitidos.includes(parseInt(tipo.id, 10));
                            })}
                            value={tipoEspacioSeleccionado}
                            onSelect={(tipo) => setTipoEspacioSeleccionado(tipo.id)}
                            getItemId={(tipo) => tipo.id}
                            getItemLabel={(tipo) => tipo.nombre}
                            placeholder="Seleccione un tipo de espacio..."
                            searchPlaceholder="Buscar tipo de espacio..."
                            emptyMessage="No hay tipos disponibles."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={agregarTipoEspacioPermitido}
                            disabled={!tipoEspacioSeleccionado}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {(asignarTodosEspaciosPorTipo || tiposEspacioPermitidos.length > 0) && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                          <p className="text-xs text-slate-600 mb-2">Tipos asignados (Click en X para eliminar)</p>
                          <div className="flex flex-wrap gap-2">
                            {asignarTodosEspaciosPorTipo && (
                              <Badge className="bg-emerald-600 text-white px-3 py-2">
                                Todos
                                <button
                                  type="button"
                                  onClick={() => setAsignarTodosEspaciosPorTipo(false)}
                                  className="ml-2 hover:text-red-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            )}
                            {tiposEspacioPermitidos.map((tipoId) => {
                              const tipo = tiposEspacioDisponibles.find(t => t.id === tipoId);
                              return tipo ? (
                                <Badge key={tipoId} className="bg-blue-600 text-white px-3 py-2">
                                  {tipo.nombre}
                                  <button
                                    type="button"
                                    onClick={() => eliminarTipoEspacioPermitido(tipoId)}
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
                    </>
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setDialogOpen(false);
                resetNuevoUsuario();
                setShowPassword(false);
                setShowConfirmPassword(false);
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
        <div className="flex-[3] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex-[1]">
          <SearchableSelect
            items={[
              { id: 'todos', nombre: 'Todos los roles' },
              ...rolesDisponibles.map(rol => ({
                id: rol.nombre,
                nombre: rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).replace('_', ' ')
              }))
            ]}
            value={filterRol}
            onSelect={(item) => setFilterRol(item.id)}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nombre}
            placeholder="Filtrar por rol"
            searchPlaceholder="Buscar rol..."
            emptyMessage="No se encontraron roles."
            className="w-full"
          />
        </div>
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
                    <SearchableSelect
                      items={rolesDisponibles}
                      value={editingUser.rol_id?.toString() || ''}
                      onSelect={(rol) => setEditingUser({ ...editingUser, rol_id: rol.id })}
                      getItemId={(rol) => rol.id.toString()}
                      getItemLabel={(rol) => rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).replace('_', ' ')}
                      placeholder="Seleccione un rol"
                      searchPlaceholder="Buscar rol..."
                      emptyMessage="No se encontraron roles."
                    />
                  </div>
                </div>
              </div>

              {/* Facultad (solo para planeacion_facultad) */}
              {getRolNombreEdit() === 'planeacion_facultad' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Facultad</h3>
                  <SearchableSelect
                    items={facultadesDisponibles}
                    value={facultadSeleccionadaEdit?.toString() || ''}
                    onSelect={(facultad) => setFacultadSeleccionadaEdit(facultad.id)}
                    getItemId={(facultad) => facultad.id.toString()}
                    getItemLabel={(facultad) => facultad.nombre}
                    placeholder="Seleccione una facultad"
                    searchPlaceholder="Buscar facultad..."
                    emptyMessage="No se encontraron facultades."
                  />
                </div>
              )}

              {/* Espacios Permitidos (solo para supervisor_general) */}
              {getRolNombreEdit() === 'supervisor_general' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Espacios Permitidos</h3>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant={modoAsignacionSupervisorEdit === 'individual' ? 'default' : 'outline'}
                      onClick={() => setModoAsignacionSupervisorEdit('individual')}
                      className={modoAsignacionSupervisorEdit === 'individual' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    >
                      Asignacion Individual
                    </Button>
                    <Button
                      type="button"
                      variant={modoAsignacionSupervisorEdit === 'tipo' ? 'default' : 'outline'}
                      onClick={() => setModoAsignacionSupervisorEdit('tipo')}
                      className={modoAsignacionSupervisorEdit === 'tipo' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                    >
                      Asignacion por Tipo
                    </Button>
                  </div>

                  {modoAsignacionSupervisorEdit === 'individual' && (
                    <>
                      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex gap-2">
                          <SearchableSelect
                            items={espaciosDisponibles.filter(e => !espaciosPermitidosEdit.includes(e.id))}
                            value={espacioSeleccionadoEdit}
                            onSelect={(espacio) => setEspacioSeleccionadoEdit(espacio.id.toString())}
                            getItemId={(espacio) => espacio.id.toString()}
                            getItemLabel={(espacio) => espacio.nombre}
                            placeholder="Seleccione un espacio..."
                            searchPlaceholder="Buscar espacio..."
                            emptyMessage="No hay espacios disponibles."
                            className="flex-1"
                          />
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
                    </>
                  )}

                  {modoAsignacionSupervisorEdit === 'tipo' && (
                    <>
                      <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex gap-2">
                          <SearchableSelect
                            items={tiposEspacioOpciones.filter((tipo) => {
                              if (tipo.id === 'todos') return !asignarTodosEspaciosPorTipoEdit;
                              return !tiposEspacioPermitidosEdit.includes(parseInt(tipo.id, 10));
                            })}
                            value={tipoEspacioSeleccionadoEdit}
                            onSelect={(tipo) => setTipoEspacioSeleccionadoEdit(tipo.id)}
                            getItemId={(tipo) => tipo.id}
                            getItemLabel={(tipo) => tipo.nombre}
                            placeholder="Seleccione un tipo de espacio..."
                            searchPlaceholder="Buscar tipo de espacio..."
                            emptyMessage="No hay tipos disponibles."
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={agregarTipoEspacioPermitidoEdit}
                            disabled={!tipoEspacioSeleccionadoEdit}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {(asignarTodosEspaciosPorTipoEdit || tiposEspacioPermitidosEdit.length > 0) && (
                        <div className="bg-white border border-slate-200 rounded-lg p-3">
                          <div className="flex flex-wrap gap-2">
                            {asignarTodosEspaciosPorTipoEdit && (
                              <Badge className="bg-emerald-600 text-white px-3 py-2">
                                Todos
                                <button
                                  type="button"
                                  onClick={() => setAsignarTodosEspaciosPorTipoEdit(false)}
                                  className="ml-2 hover:text-red-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            )}
                            {tiposEspacioPermitidosEdit.map((tipoId) => {
                              const tipo = tiposEspacioDisponibles.find(t => t.id === tipoId);
                              return tipo ? (
                                <Badge key={tipoId} className="bg-blue-600 text-white px-3 py-2">
                                  {tipo.nombre}
                                  <button
                                    type="button"
                                    onClick={() => eliminarTipoEspacioPermitidoEdit(tipoId)}
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
                    </>
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
