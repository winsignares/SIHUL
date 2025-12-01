import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Label } from '../../share/label';
import { Input } from '../../share/input';
import { Button } from '../../share/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Avatar, AvatarFallback } from '../../share/avatar';
import { Separator } from '../../share/separator';
import {
  Save,
  Edit,
  Lock,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../share/dialog';
import { useAjustes } from '../../hooks/users/useAjustes';
import { Toaster } from 'sonner';

export default function Ajustes() {
  const {
    usuario,
    espaciosPermitidos,
    isEditingProfile,
    isSaving,
    showChangePasswordModal,
    setShowChangePasswordModal,
    passwordData,
    setPasswordData,
    showPasswords,
    setShowPasswords,
    passwordError,
    setPasswordError,
    perfil,
    setPerfil,
    canEditEmail,
    canEditRol,
    isSupervisorGeneral,
    handleEditProfile,
    handleCancelEditProfile,
    guardarPerfil,
    handleChangePassword,
  } = useAjustes();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Configuración de Perfil</h1>
        <p className="text-slate-600">Administra tu información personal y seguridad</p>
      </div>

      {/* Perfil Card */}
      <Card className="border-slate-200 bg-white shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900">Información Personal</CardTitle>
            {!isEditingProfile ? (
              <Button
                onClick={handleEditProfile}
                variant="outline"
                className="border-red-600 text-red-600 hover:bg-red-50"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Perfil
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  onClick={handleCancelEditProfile}
                  variant="outline"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  onClick={guardarPerfil}
                  disabled={isSaving}
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-slate-200">
              <AvatarFallback className="bg-gradient-to-br from-red-600 to-red-800 text-white text-2xl">
                {perfil.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{perfil.nombre}</h3>
              <p className="text-slate-600">{usuario?.rol?.nombre}</p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre Completo</Label>
              <Input
                id="nombre"
                value={perfil.nombre}
                onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
                disabled={!isEditingProfile}
                className={!isEditingProfile ? 'bg-slate-50 cursor-not-allowed' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="correo">Correo Electrónico</Label>
              <Input
                id="correo"
                type="email"
                value={perfil.correo}
                onChange={(e) => setPerfil({ ...perfil, correo: e.target.value })}
                disabled={!isEditingProfile || !canEditEmail}
                className={(!isEditingProfile || !canEditEmail) ? 'bg-slate-50 cursor-not-allowed' : ''}
              />
              {!canEditEmail && (
                <p className="text-xs text-slate-500">Solo administradores pueden editar el correo</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="rol">Rol</Label>
              <Input
                id="rol"
                value={usuario?.rol?.nombre || 'Sin rol asignado'}
                disabled
                className="bg-slate-50 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">El rol no se puede editar desde aquí</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="facultad">Facultad</Label>
              <Input
                id="facultad"
                value={usuario?.facultad?.nombre || 'Sin facultad asignada'}
                disabled
                className="bg-slate-50 cursor-not-allowed"
              />
              <p className="text-xs text-slate-500">La facultad no se puede editar desde aquí</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="activo">Estado de la Cuenta</Label>
              <Select
                value={perfil.activo ? 'true' : 'false'}
                onValueChange={(value) => setPerfil({ ...perfil, activo: value === 'true' })}
                disabled={!isEditingProfile || !canEditRol}
              >
                <SelectTrigger className={(!isEditingProfile || !canEditRol) ? 'bg-slate-50 cursor-not-allowed' : ''}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">✅ Activo</SelectItem>
                  <SelectItem value="false">❌ Inactivo</SelectItem>
                </SelectContent>
              </Select>
              {!canEditRol && (
                <p className="text-xs text-slate-500">Solo administradores pueden cambiar el estado</p>
              )}
            </div>
          </div>

          {/* Espacios Permitidos - Solo para Supervisor General */}
          {isSupervisorGeneral && espaciosPermitidos.length > 0 && (
            <>
              <Separator />
              <div className="space-y-3">
                <Label>Espacios Asignados</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {espaciosPermitidos.map((espacio) => (
                    <div key={espacio.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="font-medium text-slate-900">{espacio.nombre}</p>
                      <p className="text-sm text-slate-600">{espacio.tipo}</p>
                      {espacio.ubicacion && (
                        <p className="text-xs text-slate-500">{espacio.ubicacion}</p>
                      )}
                      {espacio.sede_nombre && (
                        <p className="text-xs text-slate-500">Sede: {espacio.sede_nombre}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="border-slate-200 bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="text-slate-900">Seguridad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900">Contraseña</p>
              <p className="text-sm text-slate-600">Actualiza tu contraseña periódicamente</p>
            </div>
            <Button
              onClick={() => setShowChangePasswordModal(true)}
              variant="outline"
              className="border-red-600 text-red-600 hover:bg-red-50"
            >
              <Lock className="w-4 h-4 mr-2" />
              Cambiar Contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Cambiar Contraseña */}
      <Dialog open={showChangePasswordModal} onOpenChange={setShowChangePasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Ingresa tu contraseña actual y la nueva contraseña
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showPasswords.current ? 'text' : 'password'}
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showPasswords.confirm ? 'text' : 'password'}
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {passwordError}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowChangePasswordModal(false);
                setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                setPasswordError('');
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              disabled={isSaving}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              {isSaving ? 'Actualizando...' : 'Actualizar Contraseña'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />
    </div>
  );
}
