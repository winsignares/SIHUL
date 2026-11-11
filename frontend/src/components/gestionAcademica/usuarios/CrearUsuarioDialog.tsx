import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Badge } from '../../../share/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../../share/dialog';
import SearchableSelect from '../../../share/searchableSelect';
import { UserPlus, Plus, X, Eye, EyeOff, Mail, MapPin, User, Lock, Shield } from 'lucide-react';
import { isSpaceSupervisorRole } from '../../../context/spaceSupervisorRole';
import type { useGestionUsuarios } from '../../../hooks/gestionAcademica/useGestionUsuarios';

interface Props {
  hook: ReturnType<typeof useGestionUsuarios>;
  getRolActual: () => ReturnType<typeof useGestionUsuarios>['rolesDisponibles'][number] | undefined;
  getRolNombre: () => string;
  showPassword: boolean;
  setShowPassword: (valor: boolean | ((anterior: boolean) => boolean)) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (valor: boolean | ((anterior: boolean) => boolean)) => void;
  tiposEspacioOpcionesCreacion: { id: string; nombre: string }[];
}

/** Diálogo «Crear Usuario» de Gestión de Usuarios (con su botón). */
export function CrearUsuarioDialog({ hook, getRolActual, getRolNombre, showPassword, setShowPassword, showConfirmPassword, setShowConfirmPassword, tiposEspacioOpcionesCreacion }: Props) {
  const {
    dialogOpen,
    setDialogOpen,
    nuevoUsuario,
    setNuevoUsuario,
    crearUsuario,
    resetNuevoUsuario,
    rolesDisponibles,
    facultadesDisponibles,
    espaciosDisponibles,
    espaciosDisponiblesCreacion,
    sedesDisponibles,
    seccionalesDisponibles,
    tiposEspacioDisponibles,
    espacioSeleccionado,
    setEspacioSeleccionado,
    espaciosPermitidos,
    modoAsignacionSupervisor,
    setModoAsignacionSupervisor,
    tipoEspacioSeleccionado,
    setTipoEspacioSeleccionado,
    tiposEspacioPermitidos,
    asignarTodosEspaciosPorTipo,
    setAsignarTodosEspaciosPorTipo,
    agregarTipoEspacioPermitido,
    eliminarTipoEspacioPermitido,
    facultadSeleccionada,
    setFacultadSeleccionada,
    agregarEspacioPermitido,
    eliminarEspacioPermitido,
    confirmarCorreo,
    setConfirmarCorreo,
    confirmarPassword,
    setConfirmarPassword,
    sedeSeleccionada,
    setSedeSeleccionada,
    seccionalSeleccionada,
    setSeccionalSeleccionada,
  } = hook;

  return (
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
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
                <Input
                  placeholder="Ej: Juan Pérez García"
                  value={nuevoUsuario.nombre}
                  onChange={(e) => setNuevoUsuario({ ...nuevoUsuario, nombre: e.target.value })}
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
                  value={sedeSeleccionada}
                  onSelect={(sede) => setSedeSeleccionada(sede.id.toString())}
                  getItemId={(sede) => sede.id.toString()}
                  getItemLabel={(sede) => sede.nombre}
                  placeholder="Seleccione una sede"
                  searchPlaceholder="Buscar sede..."
                  emptyMessage="No se encontraron sedes."
                  clearable
                  onClear={() => setSedeSeleccionada('')}
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
                  value={
                    sedeSeleccionada
                      ? (sedesDisponibles.find((s) => s.id.toString() === sedeSeleccionada)?.seccional_id?.toString() ?? '')
                      : seccionalSeleccionada
                  }
                  onSelect={(seccional) => setSeccionalSeleccionada(seccional.id.toString())}
                  getItemId={(seccional) => seccional.id.toString()}
                  getItemLabel={(seccional) => seccional.ciudad}
                  placeholder="Seleccione una seccional"
                  searchPlaceholder="Buscar seccional..."
                  emptyMessage="No se encontraron seccionales."
                  disabled={Boolean(sedeSeleccionada)}
                  className="pl-10"
                />
              </div>
              <p className="text-xs text-slate-500">
                {sedeSeleccionada
                  ? 'La define la sede elegida.'
                  : 'Si la persona no tiene sede (por ejemplo, personal de bibliotecas), elige su seccional.'}
              </p>
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
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
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
                  aria-label="Mostrar/ocultar contraseña"
                  title="Mostrar/ocultar contraseña"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Confirmar Contraseña *</Label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors" />
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
                  aria-label="Mostrar/ocultar confirmación de contraseña"
                  title="Mostrar/ocultar confirmación de contraseña"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-red-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Rol *</Label>
              <div className="relative group">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-red-600 transition-colors z-10" />
                <SearchableSelect
                  items={rolesDisponibles}
                  value={nuevoUsuario.rol_id?.toString() || ''}
                  onSelect={(rol) => setNuevoUsuario({ ...nuevoUsuario, rol_id: rol.id })}
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

        {/* Espacios Permitidos (roles con supervisión de espacios) */}
        {isSpaceSupervisorRole(getRolActual()) && (
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 border-b pb-2">Espacios Permitidos</h3>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant={modoAsignacionSupervisor === 'individual' ? 'default' : 'outline'}
                onClick={() => setModoAsignacionSupervisor('individual')}
                className={modoAsignacionSupervisor === 'individual' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                Asignacion Individual{espaciosPermitidos.length > 0 ? ` (${espaciosPermitidos.length})` : ''}
              </Button>
              <Button
                type="button"
                variant={modoAsignacionSupervisor === 'tipo' ? 'default' : 'outline'}
                onClick={() => setModoAsignacionSupervisor('tipo')}
                className={modoAsignacionSupervisor === 'tipo' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
              >
                Asignacion por Tipo{asignarTodosEspaciosPorTipo ? ' (todos)' : tiposEspacioPermitidos.length > 0 ? ` (${tiposEspacioPermitidos.length})` : ''}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Puedes combinar ambas: los tipos dan acceso a todos sus espacios (también los que se creen después) y permiten crear espacios de esos tipos; los espacios individuales añaden espacios sueltos que solo podrá gestionar, sin crear más.
            </p>

            {modoAsignacionSupervisor === 'individual' && (
              <>
                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <SearchableSelect
                      items={espaciosDisponiblesCreacion.filter(e => !espaciosPermitidos.includes(e.id))}
                      value={espacioSeleccionado}
                      onSelect={(espacio) => setEspacioSeleccionado(espacio.id.toString())}
                      getItemId={(espacio) => espacio.id.toString()}
                      getItemLabel={(espacio) => espacio.nombre}
                      placeholder={sedeSeleccionada ? 'Seleccione un espacio...' : 'Seleccione primero una sede'}
                      searchPlaceholder={sedeSeleccionada ? 'Buscar espacio...' : 'Primero seleccione una sede'}
                      emptyMessage={
                        sedeSeleccionada
                          ? 'No hay espacios disponibles para la sede seleccionada.'
                          : 'Primero seleccione una sede universitaria para asignar espacios.'
                      }
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
                  {espacioSeleccionado && (
                    <p className="text-xs text-amber-700">Pulsa «+» para añadirlo. Si guardas sin pulsarlo, también se añadirá.</p>
                  )}
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

            {modoAsignacionSupervisor === 'tipo' && (
              <>
                <div className="space-y-3 bg-slate-50 border border-slate-200 rounded-lg p-3">
                  <div className="flex gap-2">
                    <SearchableSelect
                      items={tiposEspacioOpcionesCreacion.filter((tipo) => {
                        if (tipo.id === 'todos') return !asignarTodosEspaciosPorTipo;
                        return !tiposEspacioPermitidos.includes(parseInt(tipo.id, 10));
                      })}
                      value={tipoEspacioSeleccionado}
                      onSelect={(tipo) => setTipoEspacioSeleccionado(tipo.id)}
                      getItemId={(tipo) => tipo.id}
                      getItemLabel={(tipo) => tipo.nombre}
                      placeholder={sedeSeleccionada ? 'Seleccione un tipo de espacio...' : 'Seleccione primero una sede'}
                      searchPlaceholder={sedeSeleccionada ? 'Buscar tipo de espacio...' : 'Primero seleccione una sede'}
                      emptyMessage={
                        sedeSeleccionada
                          ? 'No hay tipos con espacios disponibles para la sede seleccionada.'
                          : 'Primero seleccione una sede universitaria para asignar espacios por tipo.'
                      }
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
                  {tipoEspacioSeleccionado && (
                    <p className="text-xs text-amber-700">Pulsa «+» para añadirlo. Si guardas sin pulsarlo, también se añadirá.</p>
                  )}
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
                            aria-label="Eliminar asignación de todos"
                            title="Eliminar asignación de todos"
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
  );
}
