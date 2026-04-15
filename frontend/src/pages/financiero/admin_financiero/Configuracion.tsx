import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Switch } from '../../../share/switch';
import { Settings, Save, Database, Bell, Shield, Mail } from 'lucide-react';
import { toast } from 'sonner';

export default function Configuracion() {
  const handleSaveConfig = () => {
    toast.success('Configuracion guardada', {
      description: 'Los cambios se aplicaron correctamente',
    });
  };

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 via-red-700 to-red-800 rounded-2xl p-6 text-white shadow-xl"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
            <Settings className="w-7 h-7 text-yellow-400" />
          </div>
          <div>
            <h1 className="text-white mb-1 text-3xl font-bold">Configuracion del Sistema</h1>
            <p className="text-red-100 text-sm">Parametros generales y ajustes del sistema financiero</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Settings className="w-5 h-5 text-red-600" />
                Configuracion General
              </CardTitle>
              <CardDescription>Ajustes basicos del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-700">Nombre de la Institucion</Label>
                <Input defaultValue="Universidad Libre de Colombia" className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Dias Maximos para Proceso</Label>
                <Input type="number" defaultValue="15" className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Monto Maximo sin Autorizacion</Label>
                <Input type="number" defaultValue="5000000" className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Bell className="w-5 h-5 text-red-600" />
                Notificaciones
              </CardTitle>
              <CardDescription>Configurar alertas del sistema</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Alertas por Email</Label>
                  <p className="text-sm text-slate-500">Enviar notificaciones por correo</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Alertas de Facturas Atrasadas</Label>
                  <p className="text-sm text-slate-500">Notificar facturas con retraso</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Resumen Diario</Label>
                  <p className="text-sm text-slate-500">Enviar resumen al final del dia</p>
                </div>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Shield className="w-5 h-5 text-red-600" />
                Seguridad
              </CardTitle>
              <CardDescription>Configuracion de seguridad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Autenticacion de Dos Factores</Label>
                  <p className="text-sm text-slate-500">Requerir 2FA para todos los usuarios</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-slate-700">Cerrar Sesion Automatica</Label>
                  <p className="text-sm text-slate-500">Despues de 30 minutos de inactividad</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700">Tiempo de Sesion (minutos)</Label>
                <Input type="number" defaultValue="30" className="border-slate-300 focus:border-red-600 focus:ring-red-600" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-slate-800">
                <Database className="w-5 h-5 text-red-600" />
                Mantenimiento
              </CardTitle>
              <CardDescription>Respaldos y limpieza de datos</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                <Database className="w-4 h-4 mr-2" />
                Crear Respaldo de Base de Datos
              </Button>
              <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                <Mail className="w-4 h-4 mr-2" />
                Probar Envio de Notificaciones
              </Button>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-sm text-slate-700">
                  <strong>Ultimo respaldo:</strong> 14 de Abril 2026, 02:00 AM
                </p>
                <p className="text-xs text-slate-500 mt-1">Respaldo automatico programado diariamente</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex justify-end">
        <Button
          onClick={handleSaveConfig}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white shadow-lg px-8"
        >
          <Save className="w-4 h-4 mr-2" />
          Guardar Configuracion
        </Button>
      </motion.div>
    </div>
  );
}
