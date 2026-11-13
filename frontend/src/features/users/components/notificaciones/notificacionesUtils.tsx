import { Badge } from '../../../../components/ui/badge';
import { Bell, AlertCircle, MessageSquare, Calendar, Settings, X, AlertTriangle, CheckCircle, Edit, XCircle } from 'lucide-react';

export const getIcono = (tipo: string) => {
  switch (tipo.toLowerCase()) {
    case 'factura_etapa_actualizada':
    case 'factura_devuelta':
      return <Bell className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'solicitud':
      return <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'mensaje':
      return <MessageSquare className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    case 'alerta':
      return <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    case 'sistema':
      return <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
    case 'exito':
      return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'error':
      return <X className="w-5 h-5 text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-950 rounded-full p-0.5" />;
    case 'advertencia':
      return <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    case 'horario':
      return <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />;
    case 'prestamo':
      return <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
    case 'espacio':
      return <Settings className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
    case 'facultad':
      return <Bell className="w-5 h-5 text-violet-600 dark:text-violet-400" />;
    case 'solicitud_espacio':
      return <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
    case 'solicitud_aprobada':
      return <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />;
    case 'solicitud_rechazada':
      return <X className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'grupo':
      return <Bell className="w-5 h-5 text-teal-600 dark:text-teal-400" />;
    case 'cambio_nombre':
      return <Edit className="w-5 h-5 text-blue-600 dark:text-blue-400" />;
    case 'cambio_contrasena':
      return <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
    case 'licencia':
      return <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    case 'periodo_academico':
      return <Calendar className="w-5 h-5 text-orange-600 dark:text-orange-400" />;
    case 'profesor_sin_asignar':
      return <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />;
    case 'grupo_sin_espacio':
      return <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />;
    default:
      return <Bell className="w-5 h-5 text-slate-600 dark:text-slate-400" />;
  }
};

export const getTipoColor = (tipo: string) => {
  switch (tipo.toLowerCase()) {
    case 'factura_etapa_actualizada':
    case 'factura_devuelta':
      return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
    case 'solicitud':
      return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    case 'mensaje':
      return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800';
    case 'alerta':
      return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
    case 'sistema':
      return 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700';
    case 'exito':
      return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    case 'error':
      return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
    case 'advertencia':
      return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
    case 'horario':
      return 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800';
    case 'prestamo':
      return 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800';
    case 'espacio':
      return 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800';
    case 'facultad':
      return 'bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800';
    case 'solicitud_espacio':
      return 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800';
    case 'solicitud_aprobada':
      return 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800';
    case 'solicitud_rechazada':
      return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
    case 'grupo':
      return 'bg-teal-50 dark:bg-teal-950/30 border-teal-200 dark:border-teal-800';
    case 'cambio_nombre':
      return 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800';
    case 'cambio_contrasena':
      return 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800';
    case 'licencia':
      return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
    case 'periodo_academico':
      return 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800';
    case 'profesor_sin_asignar':
      return 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800';
    case 'grupo_sin_espacio':
      return 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800';
    default:
      return 'bg-slate-50 dark:bg-slate-900/30 border-slate-200 dark:border-slate-700';
  }
};

export const getPrioridadBadge = (prioridad: string) => {
  switch (prioridad) {
    case 'alta':
      return <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">Alta</Badge>;
    case 'media':
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-800">Media</Badge>;
    case 'baja':
      return <Badge className="bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800">Baja</Badge>;
    default:
      return null;
  }
};
