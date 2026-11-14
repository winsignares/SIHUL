import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Badge } from '../../../../components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../../../components/ui/dialog';
import SearchableSelect from '../../../../components/ui/searchableSelect';
import { Plus, X, Mail, MapPin, User, Lock, Shield } from 'lucide-react';
import { isSpaceSupervisorRole } from '../../../../context/spaceSupervisorRole';
import type { useGestionUsuarios } from '../../hooks/useGestionUsuarios';

interface Props {
  hook: ReturnType<typeof useGestionUsuarios>;
  getRolActualEdit: () => ReturnType<typeof useGestionUsuarios>['rolesDisponibles'][number] | NonNullable<ReturnType<typeof useGestionUsuarios>['editingUser']>['rol'];
  getRolNombreEdit: () => string;
  tiposEspacioOpcionesEdicion: { id: string; nombre: string }[];
}

/** Diálogo «Editar Usuario» de Gestión de Usuarios. */
export function EditarUsuarioDialog({ hook, getRolActualEdit, getRolNombreEdit, tiposEspacioOpcionesEdicion }: Props) {
  const {
    editDialogOpen,
    setEditDialogOpen,
    editingUser,
    setEditingUser,
    actualizarUsuario,
    resetEditStates,
    rolesDisponibles,
    facultadesDisponibles,
    espaciosDisponibles,
    espaciosDisponiblesEdicion,
    sedesDisponibles,
    seccionalesDisponibles,
    tiposEspacioDisponibles,
    espacioSeleccionadoEdit,
    setEspacioSeleccionadoEdit,
    espaciosPermitidosEdit,
    setEspaciosPermitidosEdit,
    modoAsignacionSupervisorEdit,
    setModoAsignacionSupervisorEdit,
    tipoEspacioSeleccionadoEdit,
    setTipoEspacioSeleccionadoEdit,
    tiposEspacioPermitidosEdit,
    setTiposEspacioPermitidosEdit,
    asignarTodosEspaciosPorTipoEdit,
    setAsignarTodosEspaciosPorTipoEdit,
    agregarTipoEspacioPermitidoEdit,
    eliminarTipoEspacioPermitidoEdit,
    facultadSeleccionadaEdit,
    setFacultadSeleccionadaEdit,
    agregarEspacioPermitidoEdit,
    eliminarEspacioPermitidoEdit,
  } = hook;

  return (
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
                <div className="relative group">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    placeholder="Ej: Juan Pérez"
                    value={editingUser.nombre}
                    onChange={(e) => setEditingUser({ ...editingUser, nombre: e.target.value })}
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
                    placeholder="usuario@unilibre.edu.co"
                    value={editingUser.correo}
                    onChange={(e) => setEditingUser({ ...editingUser, correo: e.target.value })}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Sede Universitaria</Label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors z-10" />
                  <SearchableSelect
                    items={sedesDisponibles}
                    value={editingUser.sede_id?.toString() || ''}
                    onSelect={(sede) => {
                      setEditingUser({ ...editingUser, sede_id: sede.id, seccional_id: sede.seccional_id ?? null });
                      setEspacioSeleccionadoEdit('');
                      setEspaciosPermitidosEdit(
                        espaciosPermitidosEdit.filter((espacioId) => {
                          const espacio = espaciosDisponibles.find((item) => item.id === espacioId);
                          return espacio?.sede_id === sede.id;
                        })
                      );
                      setTipoEspacioSeleccionadoEdit('');
                      setTiposEspacioPermitidosEdit([]);
                      setAsignarTodosEspaciosPorTipoEdit(false);
                    }}
                    getItemId={(sede) => sede.id.toString()}
                    getItemLabel={(sede) => sede.nombre}
                    placeholder="Seleccione una sede"
                    searchPlaceholder="Buscar sede..."
                    emptyMessage="No se encontraron sedes."
                    clearable
                    onClear={() => {
                      setEditingUser({ ...editingUser, sede_id: null });
                      setEspacioSeleccionadoEdit('');
                      setEspaciosPermitidosEdit([]);
                      setTipoEspacioSeleccionadoEdit('');
                      setTiposEspacioPermitidosEdit([]);
                      setAsignarTodosEspaciosPorTipoEdit(false);
                    }}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Seccional</Label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors z-10" />
                  <SearchableSelect
                    items={seccionalesDisponibles}
                    value={editingUser.seccional_id?.toString() || ''}
                    onSelect={(seccional) => setEditingUser({ ...editingUser, seccional_id: seccional.id })}
                    getItemId={(seccional) => seccional.id.toString()}
                    getItemLabel={(seccional) => seccional.ciudad}
                    placeholder="Seleccione una seccional"
                    searchPlaceholder="Buscar seccional..."
                    emptyMessage="No se encontraron seccionales."
                    disabled={Boolean(editingUser.sede_id)}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {editingUser.sede_id
                    ? 'La define la sede elegida. Quita la sede para asignar solo la seccional.'
                    : 'Sin sede, la seccional se asigna directamente (por ejemplo, personal de bibliotecas).'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Nueva Contraseña (opcional)</Label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                  <Input
                    type="password"
                    placeholder="Dejar vacío para no cambiar"
                    value={editingUser.contrasena || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, contrasena: e.target.value })}
                    className="pl-10"
                  />
                </div>
                <p className="text-xs text-slate-500">Solo ingrese una contraseña si desea cambiarla</p>
              </div>
              <div className="space-y-2">
                <Label>Rol *</Label>
                <div className="relative group">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors z-10" />
                  <SearchableSelect
                    items={rolesDisponibles}
                    value={editingUser.rol_id?.toString() || ''}
                    onSelect={(rol) => setEditingUser({ ...editingUser, rol_id: rol.id })}
                    getItemId={(rol) => rol.id.toString()}
                    getItemLabel={(rol) => rol.nombre.charAt(0).toUpperCase() + rol.nombre.slice(1).replace('_', ' ')}
                    placeholder="Seleccione un rol"
                    searchPlaceholder="Buscar rol..."
                    emptyMessage="No se encontraron roles."
                    className="pl-10"
                  />
                </div>
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

          {/* Espacios Permitidos (roles con supervisión de espacios) */}
          {isSpaceSupervisorRole(getRolActualEdit()) && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Espacios Permitidos</h3>

              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant={modoAsignacionSupervisorEdit === 'individual' ? 'default' : 'outline'}
                  onClick={() => setModoAsignacionSupervisorEdit('individual')}
                  className={modoAsignacionSupervisorEdit === 'individual' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                >
                  Asignacion Individual{espaciosPermitidosEdit.length > 0 ? ` (${espaciosPermitidosEdit.length})` : ''}
                </Button>
                <Button
                  type="button"
                  variant={modoAsignacionSupervisorEdit === 'tipo' ? 'default' : 'outline'}
                  onClick={() => setModoAsignacionSupervisorEdit('tipo')}
                  className={modoAsignacionSupervisorEdit === 'tipo' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
                >
                  Asignacion por Tipo{asignarTodosEspaciosPorTipoEdit ? ' (todos)' : tiposEspacioPermitidosEdit.length > 0 ? ` (${tiposEspacioPermitidosEdit.length})` : ''}
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                Puedes combinar ambas: los tipos dan acceso a todos sus espacios (también los que se creen después) y permiten crear espacios de esos tipos; los espacios individuales añaden espacios sueltos que solo podrá gestionar, sin crear más.
              </p>

              {modoAsignacionSupervisorEdit === 'individual' && (
                <>
                  <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                    <div className="flex gap-2">
                      <SearchableSelect
                        items={espaciosDisponiblesEdicion.filter(e => !espaciosPermitidosEdit.includes(e.id))}
                        value={espacioSeleccionadoEdit}
                        onSelect={(espacio) => setEspacioSeleccionadoEdit(espacio.id.toString())}
                        getItemId={(espacio) => espacio.id.toString()}
                        getItemLabel={(espacio) => espacio.nombre}
                        placeholder={editingUser?.sede_id ? 'Seleccione un espacio...' : 'Seleccione primero una sede'}
                        searchPlaceholder={editingUser?.sede_id ? 'Buscar espacio...' : 'Primero seleccione una sede'}
                        emptyMessage={
                          editingUser?.sede_id
                            ? 'No hay espacios disponibles para la sede seleccionada.'
                            : 'Primero seleccione una sede universitaria para asignar espacios.'
                        }
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
                    {espacioSeleccionadoEdit && (
                      <p className="text-xs text-amber-700">Pulsa «+» para añadirlo. Si guardas sin pulsarlo, también se añadirá.</p>
                    )}
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
                                aria-label="Eliminar espacio"
                                title="Eliminar espacio"
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
                        items={tiposEspacioOpcionesEdicion.filter((tipo) => {
                          if (tipo.id === 'todos') return !asignarTodosEspaciosPorTipoEdit;
                          return !tiposEspacioPermitidosEdit.includes(parseInt(tipo.id, 10));
                        })}
                        value={tipoEspacioSeleccionadoEdit}
                        onSelect={(tipo) => setTipoEspacioSeleccionadoEdit(tipo.id)}
                        getItemId={(tipo) => tipo.id}
                        getItemLabel={(tipo) => tipo.nombre}
                        placeholder={editingUser?.sede_id ? 'Seleccione un tipo de espacio...' : 'Seleccione primero una sede'}
                        searchPlaceholder={editingUser?.sede_id ? 'Buscar tipo de espacio...' : 'Primero seleccione una sede'}
                        emptyMessage={
                          editingUser?.sede_id
                            ? 'No hay tipos con espacios disponibles para la sede seleccionada.'
                            : 'Primero seleccione una sede universitaria para asignar espacios por tipo.'
                        }
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
                    {tipoEspacioSeleccionadoEdit && (
                      <p className="text-xs text-amber-700">Pulsa «+» para añadirlo. Si guardas sin pulsarlo, también se añadirá.</p>
                    )}
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
                              aria-label="Eliminar asignación de todos"
                              title="Eliminar asignación de todos"
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
                                aria-label="Eliminar tipo de espacio"
                                title="Eliminar tipo de espacio"
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
  );
}
