import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Badge } from '../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import SearchableSelect from '../../share/searchableSelect';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { FilaVaciaTabla } from '../../components/common/FilaVaciaTabla';
import { Search, Edit, Trash2, UserCog, CheckCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useGestionUsuarios } from '../../hooks/gestionAcademica/useGestionUsuarios';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useMemo, useState } from 'react';
import { isSpaceSupervisorRole } from '../../context/spaceSupervisorRole';

import { CrearUsuarioDialog } from '../../components/gestionAcademica/usuarios/CrearUsuarioDialog';
import { EditarUsuarioDialog } from '../../components/gestionAcademica/usuarios/EditarUsuarioDialog';
export default function GestionUsuarios() {
  const isMobile = useIsMobile();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const hook = useGestionUsuarios();
  const {
    searchTerm, setSearchTerm,
    filterRol, setFilterRol,
    deleteDialogOpen, setDeleteDialogOpen,
    userToDelete, setUserToDelete,
    editingUser,
    nuevoUsuario,
    abrirEdicion,
    cambiarEstadoUsuario,
    confirmarEliminarUsuario,
    paginatedUsuarios,
    totalFilteredUsuarios,
    cargandoUsuarios,
    currentUsuarioPage,
    totalUsuarioPages,
    usuarioPageNumbers,
    goToUsuarioPage,
    goToNextUsuarioPage,
    goToPrevUsuarioPage,
    hasPrevUsuarioPageWindow,
    hasNextUsuarioPageWindow,
    goToPrevUsuarioPageWindow,
    goToNextUsuarioPageWindow,
    pageSize,
    notification,
    rolesDisponibles,
    facultadesDisponibles,
    espaciosDisponiblesCreacion,
    espaciosDisponiblesEdicion,
    sedesDisponibles,
    seccionalesDisponibles,
    tiposEspacioDisponibles,
  } = hook;

  const firstUsuarioItemIndex = totalFilteredUsuarios === 0 ? 0 : (currentUsuarioPage - 1) * pageSize + 1;
  const lastUsuarioItemIndex = Math.min(currentUsuarioPage * pageSize, totalFilteredUsuarios);

  // Seccional que se muestra: la asignada al usuario o, si no, la de su sede
  const getSeccionalNombre = (usuario: { seccional_id?: number | null; sede_id?: number | null }) => {
    const seccionalId = usuario.seccional_id
      ?? sedesDisponibles.find((sede) => sede.id === usuario.sede_id)?.seccional_id
      ?? null;
    if (!seccionalId) return <span className="text-slate-400">Sin seccional</span>;
    return seccionalesDisponibles.find((seccional) => seccional.id === seccionalId)?.ciudad ?? `#${seccionalId}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    const rolActual = usuario.rol || rolesDisponibles.find(r => r.id === usuario.rol_id);

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

    return <Badge className={`${colors[rolNombre] || (isSpaceSupervisorRole(rolActual) ? 'bg-purple-600' : 'bg-gray-600')} text-white`}><UserCog className="w-3 h-3 mr-1" />{rolNombre}</Badge>;
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

  const getRolActual = () => rolesDisponibles.find(r => r.id === nuevoUsuario.rol_id);

  const getRolNombreEdit = () => {
    const rolId = editingUser?.rol_id || editingUser?.rol?.id;
    const rolActual = rolesDisponibles.find(r => r.id === rolId);
    return rolActual?.nombre || '';
  };

  const getRolActualEdit = () => {
    const rolId = editingUser?.rol_id || editingUser?.rol?.id;
    return rolesDisponibles.find(r => r.id === rolId) || editingUser?.rol;
  };

  const tiposEspacioOpcionesCreacion = useMemo(() => {
    const tiposConEspacios = new Set(espaciosDisponiblesCreacion.map((espacio) => espacio.tipo_id));
    const tipos = tiposEspacioDisponibles
      .filter((tipo) => tiposConEspacios.has(tipo.id))
      .map((tipo) => ({ id: tipo.id.toString(), nombre: tipo.nombre }));

    return espaciosDisponiblesCreacion.length > 0
      ? [{ id: 'todos', nombre: `Todos (${espaciosDisponiblesCreacion.length} espacios)` }, ...tipos]
      : [];
  }, [espaciosDisponiblesCreacion, tiposEspacioDisponibles]);

  const tiposEspacioOpcionesEdicion = useMemo(() => {
    const tiposConEspacios = new Set(espaciosDisponiblesEdicion.map((espacio) => espacio.tipo_id));
    const tipos = tiposEspacioDisponibles
      .filter((tipo) => tiposConEspacios.has(tipo.id))
      .map((tipo) => ({ id: tipo.id.toString(), nombre: tipo.nombre }));

    return espaciosDisponiblesEdicion.length > 0
      ? [{ id: 'todos', nombre: `Todos (${espaciosDisponiblesEdicion.length} espacios)` }, ...tipos]
      : [];
  }, [espaciosDisponiblesEdicion, tiposEspacioDisponibles]);

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
      <NotificationBanner notification={notification} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Gestión de Usuarios</h1>
          <p className="text-slate-600 dark:text-slate-400">Administra usuarios del sistema</p>
        </div>

        <CrearUsuarioDialog hook={hook} getRolActual={getRolActual} getRolNombre={getRolNombre} showPassword={showPassword} setShowPassword={setShowPassword} showConfirmPassword={showConfirmPassword} setShowConfirmPassword={setShowConfirmPassword} tiposEspacioOpcionesCreacion={tiposEspacioOpcionesCreacion} />
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
                <TableHead>Seccional</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {totalFilteredUsuarios === 0 || cargandoUsuarios ? (
                <FilaVaciaTabla colSpan={6} cargando={cargandoUsuarios} mensajeCargando="Cargando usuarios..." mensajeVacio="No se encontraron usuarios" />
              ) : (
                paginatedUsuarios.map((usuario) => (
                  <TableRow key={usuario.id}>
                    <TableCell>
                      <div>
                        <p className="text-slate-900">{usuario.nombre}</p> 
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-700">{usuario.correo}</TableCell>
                    <TableCell>{getRolBadge(usuario)}</TableCell>
                    <TableCell className="text-slate-700">{getSeccionalNombre(usuario)}</TableCell>
                    <TableCell>{getEstadoBadge(usuario.activo)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          onClick={() => abrirEdicion(usuario)}
                          aria-label="Editar usuario"
                          className="bg-blue-600 hover:bg-blue-700 text-white h-8 w-8 p-0"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => cambiarEstadoUsuario(usuario.id as number)}
                          aria-label={usuario.activo ? 'Desactivar usuario' : 'Activar usuario'}
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
                          aria-label="Eliminar usuario"
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

      {totalFilteredUsuarios > 0 && (
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <p className="text-sm text-slate-600">
                Mostrando {firstUsuarioItemIndex}-{lastUsuarioItemIndex} de {totalFilteredUsuarios} usuarios
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToPrevUsuarioPage}
                  disabled={currentUsuarioPage <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>

                <div className="flex items-center gap-1 flex-wrap">
                  {hasPrevUsuarioPageWindow && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={goToPrevUsuarioPageWindow}
                    >
                      ...
                    </Button>
                  )}

                  {usuarioPageNumbers.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      type="button"
                      size="sm"
                      variant={pageNumber === currentUsuarioPage ? 'default' : 'outline'}
                      className={pageNumber === currentUsuarioPage ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                      onClick={() => goToUsuarioPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  ))}

                  {hasNextUsuarioPageWindow && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={goToNextUsuarioPageWindow}
                    >
                      ...
                    </Button>
                  )}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={goToNextUsuarioPage}
                  disabled={currentUsuarioPage >= totalUsuarioPages}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog: Editar Usuario */}
      <EditarUsuarioDialog hook={hook} getRolActualEdit={getRolActualEdit} getRolNombreEdit={getRolNombreEdit} tiposEspacioOpcionesEdicion={tiposEspacioOpcionesEdicion} />

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
