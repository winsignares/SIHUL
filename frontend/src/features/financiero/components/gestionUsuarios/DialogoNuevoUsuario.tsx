import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { useGestionUsuariosFinanciero } from '../../hooks/admin_financiero/useGestionUsuariosFinanciero';

type GestionUsuarios = ReturnType<typeof useGestionUsuariosFinanciero>;

/** Diálogo para crear un usuario financiero. */
export function DialogoNuevoUsuario({
  dialogOpen,
  setDialogOpen,
  nuevoUsuario,
  setNuevoUsuario,
  rolesGestionables,
  handleNuevoRolChange,
  componentesDelRolNuevo,
  componentesNuevoUsuario,
  toggleComponenteNuevo,
  crearUsuario,
  saving
}: Pick<GestionUsuarios, 'dialogOpen' | 'setDialogOpen' | 'nuevoUsuario' | 'setNuevoUsuario' | 'rolesGestionables' | 'handleNuevoRolChange' | 'componentesDelRolNuevo' | 'componentesNuevoUsuario' | 'toggleComponenteNuevo' | 'crearUsuario' | 'saving'>) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Crear nuevo usuario</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={nuevoUsuario.nombre}
              onChange={(e) => setNuevoUsuario((prev) => ({ ...prev, nombre: e.target.value }))}
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-1">
            <Label>Correo</Label>
            <Input
              type="email"
              value={nuevoUsuario.correo}
              onChange={(e) => setNuevoUsuario((prev) => ({ ...prev, correo: e.target.value }))}
              placeholder="correo@dominio.edu.co"
            />
          </div>

          <div className="space-y-1">
            <Label>Contraseña</Label>
            <Input
              type="password"
              value={nuevoUsuario.contrasena}
              onChange={(e) => setNuevoUsuario((prev) => ({ ...prev, contrasena: e.target.value }))}
              placeholder="••••••••"
            />
          </div>

          <div className="space-y-1">
            <Label>Rol</Label>
            <Select value={nuevoUsuario.rolId} onValueChange={handleNuevoRolChange}>
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

          <div className="flex items-center justify-between border rounded-lg px-3 py-2">
            <Label>Estado inicial</Label>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setNuevoUsuario((prev) => ({ ...prev, activo: !prev.activo }))}
            >
              {nuevoUsuario.activo ? 'Activo' : 'Inactivo'}
            </Button>
          </div>

          <div className="space-y-3 border rounded-xl p-4 bg-slate-50/70">
            <p className="text-sm font-semibold text-slate-900">Componentes para el nuevo usuario</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-52 overflow-auto pr-1">
              {componentesDelRolNuevo.length === 0 ? (
                <p className="text-xs text-slate-500 md:col-span-2">Selecciona un rol para configurar componentes.</p>
              ) : (
                componentesDelRolNuevo.map((componente) => {
                  const componenteId = componente.id || -1;
                  const activo = Boolean(componentesNuevoUsuario[componenteId]);
                  return (
                    <div key={componenteId} className="rounded-lg border bg-white p-3 space-y-2">
                      <p className="text-sm font-medium text-slate-800 truncate">{componente.nombre}</p>
                      <div className="flex items-center justify-between gap-2">
                        <Button size="sm" variant={activo ? 'default' : 'outline'} onClick={() => toggleComponenteNuevo(componenteId)}>
                          {activo ? 'Activo' : 'Inactivo'}
                        </Button>
                        <span className="text-xs text-slate-500">{activo ? 'Con acceso' : 'Sin acceso'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => void crearUsuario()} disabled={saving} className="bg-red-700 hover:bg-red-800 text-white">
            {saving ? 'Creando...' : 'Crear usuario'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
