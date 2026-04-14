import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '../ui/dialog';
import { motion } from 'motion/react';
import { Calendar, Clock, BookOpen, MapPin, User, AlertCircle, FileDown, FileSpreadsheet, Send, GraduationCap, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { db } from '../../lib/database';

interface HorarioDocente {
  id: string;
  docenteId: string;
  docenteNombre: string;
  periodo: string;
  asignaturas: AsignaturaHorarioDocente[];
  fechaCreacion: string;
}

interface AsignaturaHorarioDocente {
  id: string;
  asignaturaId: string;
  asignaturaNombre: string;
  programa: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  espacioId: string;
  espacioNombre: string;
}

const PERIODO_ACTUAL = '2025-1';
const DIAS_SEMANA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

// Horario de ejemplo para el docente
const HORARIO_EJEMPLO: HorarioDocente = {
  id: 'horario-docente-ejemplo',
  docenteId: 'docente-001',
  docenteNombre: 'Roberto Sánchez Torres',
  periodo: '2025-1',
  asignaturas: [
    {
      id: 'h1',
      asignaturaId: 'prog-avanzada',
      asignaturaNombre: 'Programación Avanzada',
      programa: 'Ingeniería de Sistemas',
      dia: 'Lunes',
      horaInicio: '07:00',
      horaFin: '09:00',
      espacioId: 'lab101',
      espacioNombre: 'Lab. Sistemas 101'
    },
    {
      id: 'h2',
      asignaturaId: 'prog-avanzada',
      asignaturaNombre: 'Programación Avanzada',
      programa: 'Ingeniería de Sistemas',
      dia: 'Miércoles',
      horaInicio: '07:00',
      horaFin: '09:00',
      espacioId: 'lab101',
      espacioNombre: 'Lab. Sistemas 101'
    },
    {
      id: 'h3',
      asignaturaId: 'base-datos',
      asignaturaNombre: 'Base de Datos II',
      programa: 'Ingeniería de Sistemas',
      dia: 'Martes',
      horaInicio: '10:00',
      horaFin: '12:00',
      espacioId: 'aula305',
      espacioNombre: 'Aula 305'
    },
    {
      id: 'h4',
      asignaturaId: 'base-datos',
      asignaturaNombre: 'Base de Datos II',
      programa: 'Ingeniería de Sistemas',
      dia: 'Jueves',
      horaInicio: '10:00',
      horaFin: '12:00',
      espacioId: 'aula305',
      espacioNombre: 'Aula 305'
    },
    {
      id: 'h5',
      asignaturaId: 'ing-software',
      asignaturaNombre: 'Ingeniería de Software',
      programa: 'Ingeniería de Sistemas',
      dia: 'Viernes',
      horaInicio: '14:00',
      horaFin: '16:00',
      espacioId: 'aula401',
      espacioNombre: 'Aula 401'
    },
    {
      id: 'h6',
      asignaturaId: 'algoritmos',
      asignaturaNombre: 'Algoritmos y Estructuras',
      programa: 'Ingeniería de Sistemas',
      dia: 'Lunes',
      horaInicio: '14:00',
      horaFin: '16:00',
      espacioId: 'aula302',
      espacioNombre: 'Aula 302'
    }
  ],
  fechaCreacion: new Date().toISOString()
};

export default function HorarioDocente() {
  const [miHorario, setMiHorario] = useState<HorarioDocente | null>(null);
  const [dialogPeticion, setDialogPeticion] = useState(false);
  const [motivoPeticion, setMotivoPeticion] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Cargar horario del docente desde localStorage o usar el ejemplo
    const stored = localStorage.getItem('horarioDocente');
    if (stored) {
      setMiHorario(JSON.parse(stored));
    } else {
      // Usar horario de ejemplo
      setMiHorario(HORARIO_EJEMPLO);
      localStorage.setItem('horarioDocente', JSON.stringify(HORARIO_EJEMPLO));
    }
  };

  const getAsignaturasPorDia = (dia: string) => {
    if (!miHorario) return [];
    return miHorario.asignaturas
      .filter(a => a.dia === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  };

  const coloresAsignatura = [
    { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-500', text: 'text-blue-700' },
    { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-700' },
    { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-700' },
    { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-500', text: 'text-orange-700' },
    { bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-500', text: 'text-pink-700' },
    { bg: 'bg-cyan-500', light: 'bg-cyan-50', border: 'border-cyan-500', text: 'text-cyan-700' },
  ];

  const getColorAsignatura = (asignaturaId: string) => {
    if (!miHorario) return coloresAsignatura[0];
    const uniqueIds = Array.from(new Set(miHorario.asignaturas.map(a => a.asignaturaId)));
    const index = uniqueIds.indexOf(asignaturaId);
    return coloresAsignatura[index % coloresAsignatura.length];
  };

  const enviarPeticion = () => {
    if (!motivoPeticion.trim()) {
      toast.error('Por favor describe el motivo de tu petición');
      return;
    }

    // Aquí se enviaría la petición al administrador
    toast.success('Petición enviada exitosamente. El administrador la revisará pronto.');
    setMotivoPeticion('');
    setDialogPeticion(false);
  };

  const exportarPDF = () => {
    toast.info('Función de exportar a PDF estará disponible próximamente');
  };

  const exportarExcel = () => {
    toast.info('Función de exportar a Excel estará disponible próximamente');
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Mi Horario Académico</h1>
          <p className="text-slate-600 dark:text-slate-400">Visualiza tu horario y solicita cambios - Periodo {PERIODO_ACTUAL}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2">
            <Calendar className="w-4 h-4 mr-2" />
            {PERIODO_ACTUAL}
          </Badge>
        </div>
      </div>

      {/* Actions Bar */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-red-600" />
              <span className="text-slate-700 dark:text-slate-300">
                {miHorario ? `${Array.from(new Set(miHorario.asignaturas.map(a => a.asignaturaId))).length} asignaturas asignadas` : 'Cargando...'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={exportarPDF}
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400"
              >
                <FileDown className="w-4 h-4 mr-2" />
                Exportar PDF
              </Button>
              <Button
                variant="outline"
                onClick={exportarExcel}
                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Dialog open={dialogPeticion} onOpenChange={setDialogPeticion}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white">
                    <Send className="w-4 h-4 mr-2" />
                    Solicitar Cambio
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Solicitar Cambio de Horario</DialogTitle>
                    <DialogDescription>
                      Describe el cambio que necesitas en tu horario. Un administrador revisará tu petición.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="motivo">Motivo del Cambio *</Label>
                      <Textarea
                        id="motivo"
                        value={motivoPeticion}
                        onChange={(e) => setMotivoPeticion(e.target.value)}
                        placeholder="Ej: Solicito cambio de horario de Programación Avanzada del lunes de 7:00-9:00 a martes de 10:00-12:00 debido a..."
                        rows={6}
                        className="resize-none"
                      />
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sé específico con el día, hora y asignatura que deseas modificar
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogPeticion(false)}>
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button onClick={enviarPeticion} className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar Petición
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {miHorario && miHorario.asignaturas.length > 0 ? (
        <>
          {/* Info Card */}
          <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-slate-800 dark:to-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <User className="w-5 h-5 text-red-600" />
                    {miHorario.docenteNombre}
                  </h3>
                  <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 flex-wrap">
                    <span>{Array.from(new Set(miHorario.asignaturas.map(a => a.asignaturaId))).length} asignaturas diferentes</span>
                    <span>•</span>
                    <span>{miHorario.asignaturas.length} sesiones semanales</span>
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-700 border border-green-300">
                  Periodo {PERIODO_ACTUAL}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Horario Semanal - Vista de Bloques */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {DIAS_SEMANA.map(dia => {
              const asignaturasDia = getAsignaturasPorDia(dia);
              return (
                <Card key={dia} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-700/50">
                    <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span>{dia}</span>
                      {asignaturasDia.length > 0 && (
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
                          {asignaturasDia.length}
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4">
                    {asignaturasDia.length > 0 ? (
                      <div className="space-y-3">
                        {asignaturasDia.map(asig => {
                          const color = getColorAsignatura(asig.asignaturaId);
                          return (
                            <motion.div
                              key={asig.id}
                              initial={{ scale: 0.95, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className={`rounded-lg border-l-4 ${color.border} ${color.light} p-3 space-y-2`}
                            >
                              <h4 className={`${color.text} leading-tight`}>
                                {asig.asignaturaNombre}
                              </h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">
                                {asig.programa}
                              </p>
                              
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-sm">{asig.horaInicio} - {asig.horaFin}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-sm">{asig.espacioNombre}</span>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-400 dark:text-slate-500">
                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Sin clases</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Legend */}
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardHeader>
              <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-red-600" />
                Mis Asignaturas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Array.from(new Set(miHorario.asignaturas.map(a => a.asignaturaId))).map(asigId => {
                  const asig = miHorario.asignaturas.find(a => a.asignaturaId === asigId);
                  const color = getColorAsignatura(asigId);
                  if (!asig) return null;
                  
                  const sesiones = miHorario.asignaturas.filter(a => a.asignaturaId === asigId).length;
                  
                  return (
                    <div key={asigId} className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-slate-200 dark:border-slate-700">
                      <div className={`w-3 h-3 rounded-full ${color.bg} flex-shrink-0`}></div>
                      <div className="flex-1">
                        <span className="text-slate-700 dark:text-slate-300">{asig.asignaturaNombre}</span>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{asig.programa} • {sesiones} sesión{sesiones > 1 ? 'es' : ''}/semana</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Info adicional */}
          <Card className="border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <h4 className="text-slate-900 dark:text-slate-100 mb-2">¿Necesitas modificar tu horario?</h4>
                  <p className="text-slate-700 dark:text-slate-300 mb-3">
                    Utiliza el botón "Solicitar Cambio" para enviar una petición al administrador académico. 
                    Describe claramente el cambio que necesitas y el motivo.
                  </p>
                  <ul className="space-y-1 text-slate-600 dark:text-slate-400 text-sm">
                    <li>• Las peticiones son revisadas en un plazo máximo de 48 horas</li>
                    <li>• Recibirás una notificación cuando tu petición sea procesada</li>
                    <li>• Para cambios urgentes, contacta directamente a coordinación académica</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-slate-900 dark:text-slate-100 mb-2">
              No tienes un horario asignado
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              Contacta con el administrador académico para que te asigne un horario de clases.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
