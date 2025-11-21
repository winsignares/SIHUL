import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Label } from '../share/label';
import { Input } from '../share/input';
import { Button } from '../share/button';
import { Switch } from '../share/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../share/tabs';
import { Avatar, AvatarFallback } from '../share/avatar';
import { Separator } from '../share/separator';
import { Sun, Moon, Bell, Mail, User, Palette, Globe, Save } from 'lucide-react';
import { useTheme } from '../context/UserContext';
import { toast } from 'sonner';

export default function ConsultaAjustes() {
  const { theme, toggleTheme } = useTheme();
  
  const [perfil, setPerfil] = useState({
    nombre: 'Usuario Consultor',
    email: 'consultor@universidad.edu',
    telefono: '+57 300 987 6543',
    cargo: 'Coordinador Académico'
  });

  const [notificaciones, setNotificaciones] = useState({
    emailActualizaciones: true,
    emailMensajes: true,
    pushNotificaciones: true,
    sonido: false
  });

  const [sistema, setSistema] = useState({
    idioma: 'es',
    zonaHoraria: 'America/Bogota',
    formatoFecha: 'DD/MM/YYYY',
    formatoHora: '24h'
  });

  const guardarPerfil = () => {
    toast.success('Perfil actualizado correctamente');
  };

  const guardarNotificaciones = () => {
    toast.success('Preferencias de notificaciones guardadas');
  };

  const guardarSistema = () => {
    toast.success('Configuración del sistema actualizada');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-slate-900 dark:text-slate-100 mb-2">Configuración</h1>
        <p className="text-slate-600 dark:text-slate-400">Personaliza tu experiencia en el sistema</p>
      </div>

      <Tabs defaultValue="perfil" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="perfil">
            <User className="w-4 h-4 mr-2" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="apariencia">
            <Palette className="w-4 h-4 mr-2" />
            Apariencia
          </TabsTrigger>
          <TabsTrigger value="notificaciones">
            <Bell className="w-4 h-4 mr-2" />
            Notificaciones
          </TabsTrigger>
        </TabsList>

        {/* Perfil */}
        <TabsContent value="perfil" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Información Personal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-600 text-white text-2xl">
                    UC
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline" className="border-blue-600 text-blue-600">
                    Cambiar Foto
                  </Button>
                  <p className="text-slate-600 dark:text-slate-400 mt-2">JPG, PNG. Máximo 2MB</p>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={perfil.cargo}
                    onChange={(e) => setPerfil({ ...perfil, cargo: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    value={perfil.email}
                    onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefono">Teléfono</Label>
                  <Input
                    id="telefono"
                    value={perfil.telefono}
                    onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                  />
                </div>
              </div>

              <Button onClick={guardarPerfil} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Guardar Cambios
              </Button>
            </CardContent>
          </Card>

          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Configuración Regional</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="idioma">Idioma</Label>
                  <Select value={sistema.idioma} onValueChange={(v) => setSistema({ ...sistema, idioma: v })}>
                    <SelectTrigger>
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
                  <Select value={sistema.zonaHoraria} onValueChange={(v) => setSistema({ ...sistema, zonaHoraria: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Bogota">Bogotá (GMT-5)</SelectItem>
                      <SelectItem value="America/Mexico_City">Ciudad de México (GMT-6)</SelectItem>
                      <SelectItem value="America/New_York">Nueva York (GMT-5)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={guardarSistema} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Guardar Configuración
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Apariencia */}
        <TabsContent value="apariencia" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Tema del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg">
                <div className="flex items-center gap-3">
                  {theme === 'dark' ? (
                    <Moon className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Sun className="w-6 h-6 text-yellow-600" />
                  )}
                  <div>
                    <h4 className="text-slate-900 dark:text-slate-100">Modo {theme === 'dark' ? 'Oscuro' : 'Claro'}</h4>
                    <p className="text-slate-600 dark:text-slate-400">
                      {theme === 'dark' ? 'Actualmente en modo oscuro' : 'Actualmente en modo claro'}
                    </p>
                  </div>
                </div>
                <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="text-slate-900 dark:text-slate-100">Vista Previa del Tema</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`border rounded-lg p-4 ${theme === 'light' ? 'border-blue-600 border-2' : 'border-slate-200'}`}>
                    <div className="bg-white rounded-lg p-4 shadow-sm">
                      <div className="h-3 bg-slate-200 rounded w-3/4 mb-3"></div>
                      <div className="h-2 bg-slate-100 rounded w-full mb-2"></div>
                      <div className="h-2 bg-slate-100 rounded w-5/6"></div>
                    </div>
                    <p className="text-center mt-3 text-slate-900">Modo Claro</p>
                  </div>
                  <div className={`border rounded-lg p-4 ${theme === 'dark' ? 'border-blue-600 border-2' : 'border-slate-200'}`}>
                    <div className="bg-slate-800 rounded-lg p-4 shadow-sm">
                      <div className="h-3 bg-slate-700 rounded w-3/4 mb-3"></div>
                      <div className="h-2 bg-slate-600 rounded w-full mb-2"></div>
                      <div className="h-2 bg-slate-600 rounded w-5/6"></div>
                    </div>
                    <p className="text-center mt-3 text-slate-900 dark:text-slate-100">Modo Oscuro</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notificaciones */}
        <TabsContent value="notificaciones" className="space-y-6">
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100">Preferencias de Notificaciones</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-slate-900 dark:text-slate-100">Actualizaciones por Email</p>
                      <p className="text-slate-600 dark:text-slate-400">Recibir actualizaciones del sistema</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificaciones.emailActualizaciones}
                    onCheckedChange={(v) => setNotificaciones({ ...notificaciones, emailActualizaciones: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-slate-900 dark:text-slate-100">Mensajes por Email</p>
                      <p className="text-slate-600 dark:text-slate-400">Notificaciones de mensajería</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificaciones.emailMensajes}
                    onCheckedChange={(v) => setNotificaciones({ ...notificaciones, emailMensajes: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-slate-900 dark:text-slate-100">Notificaciones Push</p>
                      <p className="text-slate-600 dark:text-slate-400">Recibir notificaciones en el navegador</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificaciones.pushNotificaciones}
                    onCheckedChange={(v) => setNotificaciones({ ...notificaciones, pushNotificaciones: v })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Bell className="w-5 h-5 text-yellow-600" />
                    <div>
                      <p className="text-slate-900 dark:text-slate-100">Sonido de Notificaciones</p>
                      <p className="text-slate-600 dark:text-slate-400">Reproducir sonido al recibir notificaciones</p>
                    </div>
                  </div>
                  <Switch
                    checked={notificaciones.sonido}
                    onCheckedChange={(v) => setNotificaciones({ ...notificaciones, sonido: v })}
                  />
                </div>
              </div>

              <Button onClick={guardarNotificaciones} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                <Save className="w-4 h-4 mr-2" />
                Guardar Preferencias
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
