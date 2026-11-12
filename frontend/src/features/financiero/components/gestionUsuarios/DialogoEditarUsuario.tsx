import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Checkbox } from '../../../../components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { useGestionUsuariosFinanciero } from '../../hooks/admin_financiero/useGestionUsuariosFinanciero';

type GestionUsuarios = ReturnType<typeof useGestionUsuariosFinanciero>;

/** Diálogo para editar un usuario financiero y sus componentes. */
export function DialogoEditarUsuario({
  editDialogOpen,
  setEditDialogOpen,
  editarUsuario,
  setEditarUsuario,
  rolesGestionables,
  handleEditarRolChange,
  componentesDelRolSeleccionado,
  componentesEditarUsuario,
  toggleComponenteEditar,
  actualizarUsuario,
  updating
}: Pick<GestionUsuarios, 'editDialogOpen' | 'setEditDialogOpen' | 'editarUsuario' | 'setEditarUsuario' | 'rolesGestionables' | 'handleEditarRolChange' | 'componentesDelRolSeleccionado' | 'componentesEditarUsuario' | 'toggleComponenteEditar' | 'actualizarUsuario' | 'updating'>) {
  return (
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent className="w-[98vw] sm:!max-w-[96vw] xl:!max-w-[88vw] max-h-[90vh] overflow-hidden p-0">
        <DialogHeader className="border-b bg-slate-50 px-6 py-5">
          <DialogTitle className="text-xl text-slate-900">Editar usuario financiero</DialogTitle>
          <p className="text-sm text-slate-600">
            Actualiza datos principales del usuario y verifica los componentes habilitados por su rol.
          </p>
        </DialogHeader>

        <div className="px-6 py-5 overflow-y-auto max-h-[calc(90vh-150px)]">
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-4 space-y-4 rounded-xl border bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-slate-800">Información del usuario</p>

              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input
                  value={editarUsuario.nombre}
                  onChange={(e) => setEditarUsuario((prev) => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Nombre completo"
                />
              </div>

              <div className="space-y-2">
                <Label>Correo</Label>
                <Input
                  type="email"
                  value={editarUsuario.correo}
                  onChange={(e) => setEditarUsuario((prev) => ({ ...prev, correo: e.target.value }))}
                  placeholder="correo@dominio.edu.co"
                />
              </div>

              <div className="space-y-2">
                <Label>Rol</Label>
                <Select value={editarUsuario.rolId} onValueChange={handleEditarRolChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un rol" />
                  </SelectTrigger>
                  <SelectContent>
                    {rolesGestionables.map((rol) => (
                      <SelectItem key={rol.id} value={String(rol.id)}>{rol.nombre}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nueva contraseña (opcional)</Label>
                <Input
                  type="password"
                  value={editarUsuario.contrasena}
                  onChange={(e) => setEditarUsuario((prev) => ({ ...prev, contrasena: e.target.value }))}
                  placeholder="Solo si deseas cambiarla"
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border bg-slate-50 px-3 py-2">
                <Label className="text-slate-700">Estado del usuario</Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setEditarUsuario((prev) => ({ ...prev, activo: !prev.activo }))}
                >
                  {editarUsuario.activo ? 'Activo' : 'Inactivo'}
                </Button>
              </div>
            </div>

            <div className="xl:col-span-8 space-y-3 rounded-xl border bg-slate-50 p-4">
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Componentes habilitados para el rol seleccionado</p>
                <p className="text-xs text-slate-600">Activa/desactiva componentes y define permiso por usuario.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 max-h-[58vh] overflow-auto pr-1">
                {componentesDelRolSeleccionado.length === 0 ? (
                  <div className="md:col-span-2 xl:col-span-3 text-sm text-slate-500 rounded-lg border bg-white px-3 py-4">
                    Este rol no tiene componentes asociados en la configuración actual.
                  </div>
                ) : (
                  componentesDelRolSeleccionado.map((componente) => {
                    const componenteId = componente.id || -1;
                    const activo = Boolean(componentesEditarUsuario[componenteId]);
                    return (
                      <div key={componente.id} className="rounded-lg border bg-white p-3 shadow-sm space-y-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-800 truncate">{componente.nombre}</p>
                          <p className="text-xs text-slate-500 line-clamp-2">{componente.descripcion || 'Sin descripción'}</p>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 text-slate-600 cursor-pointer" onClick={() => toggleComponenteEditar(componenteId)}>
                            <Checkbox checked={activo} aria-label={`Permiso para ${componente.nombre}`} />
                            <span className="text-xs">{activo ? 'Habilitado' : 'Inactivo'}</span>
                          </div>
                          <span className="text-xs text-slate-500">{activo ? 'Con acceso' : 'Sin acceso'}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t bg-white px-6 py-4">
          <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => void actualizarUsuario()} disabled={updating} className="bg-red-700 hover:bg-red-800 text-white">
            {updating ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
