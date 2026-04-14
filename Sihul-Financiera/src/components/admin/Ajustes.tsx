import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Separator } from '../ui/separator';
import { 
  Sun, 
  Moon, 
  Bell, 
  Mail, 
  User, 
  Shield, 
  Palette, 
  Globe, 
  Save, 
  Edit, 
  Lock,
  Check,
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { useTheme } from '../ThemeContext';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { motion, AnimatePresence } from 'motion/react';
import { useUser } from '../../lib/UserContext';
import { AuthService } from '../../lib/auth';

export default function Ajustes() {
  const { theme, toggleTheme } = useTheme();
  const { usuario } = useUser();
  
  // Estados de edición
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingSystem, setIsEditingSystem] = useState(false);
  
  // Estados de modales
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [showSaveNotificationsModal, setShowSaveNotificationsModal] = useState(false);
  const [showSaveSystemModal, setShowSaveSystemModal] = useState(false);
  
  // Estados de contraseña
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [passwordError, setPasswordError] = useState('');
  
  const [perfil, setPerfil] = useState({
    nombre: usuario?.nombre || 'Administrador Principal',
    email: usuario?.email || 'admin@unilibre.edu.co',
    telefono: '+57 300 123 4567',
    cargo: 'Administrador de Planeación'
  });

  const [perfilOriginal, setPerfilOriginal] = useState({ ...perfil });

  const [notificaciones, setNotificaciones] = useState({
    emailNuevaSolicitud: true,
    emailConflicto: true,
    emailMensaje: false,
    pushNuevaSolicitud: true,
    pushConflicto: true,
    pushMensaje: true,
    sonido: true
  });

  const [sistema, setSistema] = useState({
    idioma: 'es',
    zonaHoraria: 'America/Bogota',
    formatoFecha: 'DD/MM/YYYY',
    formatoHora: '24h'
  });

  const [sistemaOriginal, setSistemaOriginal] = useState({ ...sistema });

  // Determinar si el usuario puede editar ciertos campos según su rol
  const canEditEmail = usuario?.rol === 'admin';
  const canEditCargo = usuario?.rol === 'admin';

  const handleEditProfile = () => {
    setIsEditingProfile(true);
  };

  const handleCancelEditProfile = () => {
    setPerfil({ ...perfilOriginal });
    setIsEditingProfile(false);
  };

  const guardarPerfil = () => {
    setPerfilOriginal({ ...perfil });
    setIsEditingProfile(false);
    toast.success('✅ Perfil actualizado correctamente');
  };

  const handleChangePassword = () => {
    setPasswordError('');
    
    // Validaciones
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      setPasswordError('Todos los campos son obligatorios');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('Las contraseñas nuevas no coinciden');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!usuario) {
      setPasswordError('Usuario no encontrado');
      return;
    }

    // Intentar cambiar contraseña
    const result = AuthService.changePassword(
      usuario.id,
      passwordData.currentPassword,
      passwordData.newPassword
    );

    if (result.success) {
      toast.success('✅ Contraseña actualizada correctamente');
      setShowChangePasswordModal(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } else {
      setPasswordError(result.error || 'Error al cambiar contraseña');
    }
  };

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotificaciones(prev => ({ ...prev, [key]: value }));
    
    // Mensajes personalizados según el tipo de notificación
    const messages: Record<string, string> = {
      emailNuevaSolicitud: value ? 'Notificaciones de nuevas solicitudes activadas' : 'Notificaciones de nuevas solicitudes desactivadas',
      emailConflicto: value ? 'Conflictos de horario activados' : 'Conflictos de horario desactivados',
      emailMensaje: value ? 'Notificaciones de mensajes activadas' : 'Notificaciones de mensajes desactivadas',
      pushNuevaSolicitud: value ? 'Push de solicitudes activado' : 'Push de solicitudes desactivado',
      pushConflicto: value ? 'Push de conflictos activado' : 'Push de conflictos desactivado',
      pushMensaje: value ? 'Push de mensajes activado' : 'Push de mensajes desactivado',
      sonido: value ? 'Sonido de notificaciones activado' : 'Sonido de notificaciones desactivado'
    };

    toast.info(messages[key] || 'Preferencia actualizada', {
      duration: 2000
    });
  };

  const confirmarGuardarNotificaciones = () => {
    setShowSaveNotificationsModal(false);
    toast.success('✅ Preferencias de notificaciones guardadas');
  };

  const handleEditSystem = () => {
    setIsEditingSystem(true);
  };

  const handleCancelEditSystem = () => {
    setSistema({ ...sistemaOriginal });
    setIsEditingSystem(false);
  };

  const confirmarGuardarSistema = () => {
    setSistemaOriginal({ ...sistema });
    setIsEditingSystem(false);
    setShowSaveSystemModal(false);
    toast.success('✅ Configuración del sistema actualizada');
  };

  const handleThemeChange = (newTheme: 'light' | 'dark') => {
    if (theme !== newTheme) {
      toggleTheme();
      toast.success(`Tema cambiado a modo ${newTheme === 'light' ? 'claro' : 'oscuro'}`, {
        duration: 2000
      });
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 mb-2">Configuración y Ajustes</h1>
        <p className="text-slate-600">Personaliza tu experiencia en el sistema</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100">
          <TabsTrigger value="perfil" className="data-[state=active]:bg-white data-[state=active]:text-red-600">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="apariencia" className="data-[state=active]:bg-white data-[state=active]:text-red-600">
            <Palette className="w-4 h-4 mr-2" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="notificaciones" className="data-[state=active]:bg-white data-[state=active]:text-red-600">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
          <TabsTrigger value="sistema" className="data-[state=active]:bg-white data-[state=active]:text-red-600">
            <Globe className="w-4 h-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* ==================== PERFIL ==================== */}
        <TabsContent value="perfil" className="space-y-6">
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
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
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
                  <Button 
                    variant="outline" 
                    className="border-red-600 text-red-600 hover:bg-red-50"
                    disabled={!isEditingProfile}
                  >
                    Cambiar Foto
                  </Button>
                  <p className="text-slate-600 mt-2">JPG, PNG. Máximo 2MB</p>
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
                  <Label htmlFor="cargo">
                    Cargo
                    {!canEditCargo && <span className="text-slate-500 ml-2">(Solo lectura)</span>}
                  </Label>
                  <Input
                    id="cargo"
                    value={perfil.cargo}
                    onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                    disabled={!isEditingProfile || !canEditCargo}
                    className={(!isEditingProfile || !canEditCargo) ? 'bg-slate-50 cursor-not-allowed' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">
                    Correo Electrónico
                    {!canEditEmail && <span className="text-slate-500 ml-2">(Solo lectura)</span>}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={perfil.email}
                    onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                    disabled={!isEditingProfile || !canEditEmail}
                    className={(!isEditingProfile || !canEditEmail) ? 'bg-slate-50 cursor-not-allowed' : ''}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={perfil.telefono}
                    onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                    disabled={!isEditingProfile}
                    className={!isEditingProfile ? 'bg-slate-50 cursor-not-allowed' : ''}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Seguridad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-900">Contraseña</p>
                  <p className="text-slate-600">Actualiza tu contraseña periódicamente</p>
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
        </TabsContent>

        {/* ==================== APARIENCIA ==================== */}
        <TabsContent value="apariencia" className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Tema de la Interfaz</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600 mb-6">Selecciona el tema de tu preferencia</p>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Modo Claro */}
                <motion.button
                  onClick={() => handleThemeChange('light')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    theme === 'light' 
                      ? 'border-red-600 bg-red-50 shadow-lg' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <Sun className={`w-8 h-8 ${theme === 'light' ? 'text-red-600' : 'text-slate-600'}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-900 mb-1">Modo Claro</p>
                      <p className="text-slate-600">Interfaz brillante y clara</p>
                    </div>
                    {theme === 'light' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Preview */}
                  <div className="mt-4 p-3 bg-white rounded-lg border border-slate-200">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-200 rounded"></div>
                      <div className="h-2 bg-slate-100 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-100 rounded w-1/2"></div>
                    </div>
                  </div>
                </motion.button>

                {/* Modo Oscuro */}
                <motion.button
                  onClick={() => handleThemeChange('dark')}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`relative p-6 rounded-2xl border-2 transition-all ${
                    theme === 'dark' 
                      ? 'border-red-600 bg-red-50 shadow-lg' 
                      : 'border-slate-200 hover:border-slate-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border-2 border-slate-600">
                      <Moon className={`w-8 h-8 ${theme === 'dark' ? 'text-red-400' : 'text-slate-300'}`} />
                    </div>
                    <div className="text-center">
                      <p className="text-slate-900 mb-1">Modo Oscuro</p>
                      <p className="text-slate-600">Interfaz oscura y elegante</p>
                    </div>
                    {theme === 'dark' && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-600 flex items-center justify-center"
                      >
                        <Check className="w-5 h-5 text-white" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Preview */}
                  <div className="mt-4 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="space-y-2">
                      <div className="h-2 bg-slate-700 rounded"></div>
                      <div className="h-2 bg-slate-600 rounded w-3/4"></div>
                      <div className="h-2 bg-slate-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </motion.button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== NOTIFICACIONES ==================== */}
        <TabsContent value="notificaciones" className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <CardTitle className="text-slate-900">Preferencias de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Notificaciones por Email */}
              <div>
                <h4 className="text-slate-900 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-red-600" />
                  Notificaciones por Correo
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-slate-900">Nueva Solicitud</p>
                      <p className="text-slate-600">Recibe email cuando haya nuevas solicitudes</p>
                    </div>
                    <Switch
                      checked={notificaciones.emailNuevaSolicitud}
                      onCheckedChange={(checked) => handleNotificationChange('emailNuevaSolicitud', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-slate-900">Conflictos de Horario</p>
                      <p className="text-slate-600">Alertas de solapamientos detectados</p>
                    </div>
                    <Switch
                      checked={notificaciones.emailConflicto}
                      onCheckedChange={(checked) => handleNotificationChange('emailConflicto', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-slate-900">Mensajes Directos</p>
                      <p className="text-slate-600">Notificaciones de chat interno</p>
                    </div>
                    <Switch
                      checked={notificaciones.emailMensaje}
                      onCheckedChange={(checked) => handleNotificationChange('emailMensaje', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Notificaciones Push */}
              <div>
                <h4 className="text-slate-900 mb-4 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-red-600" />
                  Notificaciones Push
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-slate-900">Nueva Solicitud</p>
                      <p className="text-slate-600">Notificación push inmediata</p>
                    </div>
                    <Switch
                      checked={notificaciones.pushNuevaSolicitud}
                      onCheckedChange={(checked) => handleNotificationChange('pushNuevaSolicitud', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-slate-900">Conflictos</p>
                      <p className="text-slate-600">Push de solapamientos</p>
                    </div>
                    <Switch
                      checked={notificaciones.pushConflicto}
                      onCheckedChange={(checked) => handleNotificationChange('pushConflicto', checked)}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div>
                      <p className="text-slate-900">Mensajes</p>
                      <p className="text-slate-600">Push de chat</p>
                    </div>
                    <Switch
                      checked={notificaciones.pushMensaje}
                      onCheckedChange={(checked) => handleNotificationChange('pushMensaje', checked)}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              {/* Sonido */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="text-slate-900">Sonido de Notificaciones</p>
                  <p className="text-slate-600">Reproducir sonido al recibir notificaciones</p>
                </div>
                <Switch
                  checked={notificaciones.sonido}
                  onCheckedChange={(checked) => handleNotificationChange('sonido', checked)}
                />
              </div>

              <Button 
                onClick={() => setShowSaveNotificationsModal(true)}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
              >
                <Save className="w-4 h-4 mr-2" />
                Guardar Preferencias
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ==================== SISTEMA ==================== */}
        <TabsContent value="sistema" className="space-y-6">
          <Card className="border-slate-200 bg-white shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-slate-900">Configuración Regional</CardTitle>
                {!isEditingSystem ? (
                  <Button 
                    onClick={handleEditSystem}
                    variant="outline" 
                    className="border-red-600 text-red-600 hover:bg-red-50"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Editar Configuración
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleCancelEditSystem}
                      variant="outline"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button 
                      onClick={() => setShowSaveSystemModal(true)}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Guardar
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idioma">Idioma</Label>
                  <Select 
                    value={sistema.idioma} 
                    onValueChange={(value) => setSistema({ ...sistema, idioma: value })}
                    disabled={!isEditingSystem}
                  >
                    <SelectTrigger className={!isEditingSystem ? 'bg-slate-50 cursor-not-allowed' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="pt">Português</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zona">Zona Horaria</Label>
                  <Select 
                    value={sistema.zonaHoraria} 
                    onValueChange={(value) => setSistema({ ...sistema, zonaHoraria: value })}
                    disabled={!isEditingSystem}
                  >
                    <SelectTrigger className={!isEditingSystem ? 'bg-slate-50 cursor-not-allowed' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fecha">Formato de Fecha</Label>
                  <Select 
                    value={sistema.formatoFecha} 
                    onValueChange={(value) => setSistema({ ...sistema, formatoFecha: value })}
                    disabled={!isEditingSystem}
                  >
                    <SelectTrigger className={!isEditingSystem ? 'bg-slate-50 cursor-not-allowed' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hora">Formato de Hora</Label>
                  <Select 
                    value={sistema.formatoHora} 
                    onValueChange={(value) => setSistema({ ...sistema, formatoHora: value })}
                    disabled={!isEditingSystem}
                  >
                    <SelectTrigger className={!isEditingSystem ? 'bg-slate-50 cursor-not-allowed' : ''}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Horas</SelectItem>
                      <SelectItem value="12h">12 Horas (AM/PM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== MODALES ==================== */}
      
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
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
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
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Actualizar Contraseña
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Guardar Notificaciones */}
      <Dialog open={showSaveNotificationsModal} onOpenChange={setShowSaveNotificationsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">¿Desea guardar estas preferencias?</DialogTitle>
            <DialogDescription>
              Las preferencias de notificaciones se aplicarán inmediatamente
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowSaveNotificationsModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarGuardarNotificaciones}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Guardar Configuración del Sistema */}
      <Dialog open={showSaveSystemModal} onOpenChange={setShowSaveSystemModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">¿Desea guardar esta configuración?</DialogTitle>
            <DialogDescription>
              Los cambios regionales se aplicarán en todo el sistema
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowSaveSystemModal(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmarGuardarSistema}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Aceptar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
