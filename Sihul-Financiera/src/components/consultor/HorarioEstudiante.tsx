import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Calendar, Clock, MapPin, User, Search, BookOpen, AlertCircle, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { db } from '../../lib/database';
import type { Facultad, Programa } from '../../lib/models';

interface HorarioCompleto {
  id: string;
  grupoNombre: string;
  facultadId: string;
  programaId: string;
  semestre: number;
  periodo: string;
  asignaturas: AsignaturaHorario[];
  fechaCreacion: string;
}

interface AsignaturaHorario {
  id: string;
  asignaturaId: string;
  asignaturaNombre: string;
  dia: string;
  horaInicio: string;
  horaFin: string;
  docente: string;
  espacioId: string;
  espacioNombre: string;
}

const PERIODO_ACTUAL = '2025-1';

// Horarios de ejemplo para diferentes programas
const HORARIOS_EJEMPLO: Record<string, HorarioCompleto[]> = {
  'sistemas': [
    {
      id: 'horario-sistemas-1',
      grupoNombre: 'A',
      facultadId: 'FAC-ING',
      programaId: 'sistemas',
      semestre: 1,
      periodo: '2025-1',
      asignaturas: [
        {
          id: 'h1',
          asignaturaId: 'calc1',
          asignaturaNombre: 'Cálculo I',
          dia: 'Lunes',
          horaInicio: '07:00',
          horaFin: '09:00',
          docente: 'Dr. Carlos Ramírez',
          espacioId: 'aula201',
          espacioNombre: 'Aula 201'
        },
        {
          id: 'h2',
          asignaturaId: 'prog1',
          asignaturaNombre: 'Programación I',
          dia: 'Lunes',
          horaInicio: '09:00',
          horaFin: '11:00',
          docente: 'Ing. María López',
          espacioId: 'lab101',
          espacioNombre: 'Lab. Sistemas 101'
        },
        {
          id: 'h3',
          asignaturaId: 'calc1',
          asignaturaNombre: 'Cálculo I',
          dia: 'Miércoles',
          horaInicio: '07:00',
          horaFin: '09:00',
          docente: 'Dr. Carlos Ramírez',
          espacioId: 'aula201',
          espacioNombre: 'Aula 201'
        },
        {
          id: 'h4',
          asignaturaId: 'prog1',
          asignaturaNombre: 'Programación I',
          dia: 'Miércoles',
          horaInicio: '09:00',
          horaFin: '11:00',
          docente: 'Ing. María López',
          espacioId: 'lab101',
          espacioNombre: 'Lab. Sistemas 101'
        },
        {
          id: 'h5',
          asignaturaId: 'intro',
          asignaturaNombre: 'Introducción a la Ingeniería',
          dia: 'Martes',
          horaInicio: '14:00',
          horaFin: '16:00',
          docente: 'Ing. Pedro Gómez',
          espacioId: 'aula305',
          espacioNombre: 'Aula 305'
        },
        {
          id: 'h6',
          asignaturaId: 'algebra',
          asignaturaNombre: 'Álgebra Lineal',
          dia: 'Jueves',
          horaInicio: '10:00',
          horaFin: '12:00',
          docente: 'Dra. Ana Torres',
          espacioId: 'aula202',
          espacioNombre: 'Aula 202'
        },
        {
          id: 'h7',
          asignaturaId: 'fisica',
          asignaturaNombre: 'Física I',
          dia: 'Viernes',
          horaInicio: '08:00',
          horaFin: '10:00',
          docente: 'Dr. Luis Hernández',
          espacioId: 'lab-fisica',
          espacioNombre: 'Lab. Física'
        }
      ],
      fechaCreacion: new Date().toISOString()
    }
  ],
  'derecho': [
    {
      id: 'horario-derecho-1',
      grupoNombre: 'A',
      facultadId: 'FAC-DER',
      programaId: 'derecho',
      semestre: 1,
      periodo: '2025-1',
      asignaturas: [
        {
          id: 'd1',
          asignaturaId: 'der-const',
          asignaturaNombre: 'Derecho Constitucional',
          dia: 'Lunes',
          horaInicio: '08:00',
          horaFin: '10:00',
          docente: 'Dra. Patricia Mendoza',
          espacioId: 'aula401',
          espacioNombre: 'Aula 401'
        },
        {
          id: 'd2',
          asignaturaId: 'der-civil',
          asignaturaNombre: 'Derecho Civil I',
          dia: 'Lunes',
          horaInicio: '14:00',
          horaFin: '16:00',
          docente: 'Dr. Jorge Silva',
          espacioId: 'aula402',
          espacioNombre: 'Aula 402'
        },
        {
          id: 'd3',
          asignaturaId: 'intro-der',
          asignaturaNombre: 'Introducción al Derecho',
          dia: 'Martes',
          horaInicio: '10:00',
          horaFin: '12:00',
          docente: 'Dr. Fernando Rojas',
          espacioId: 'aula403',
          espacioNombre: 'Aula 403'
        },
        {
          id: 'd4',
          asignaturaId: 'der-const',
          asignaturaNombre: 'Derecho Constitucional',
          dia: 'Miércoles',
          horaInicio: '08:00',
          horaFin: '10:00',
          docente: 'Dra. Patricia Mendoza',
          espacioId: 'aula401',
          espacioNombre: 'Aula 401'
        },
        {
          id: 'd5',
          asignaturaId: 'metodologia',
          asignaturaNombre: 'Metodología de la Investigación',
          dia: 'Jueves',
          horaInicio: '16:00',
          horaFin: '18:00',
          docente: 'Dra. Laura Pérez',
          espacioId: 'aula405',
          espacioNombre: 'Aula 405'
        },
        {
          id: 'd6',
          asignaturaId: 'hist-der',
          asignaturaNombre: 'Historia del Derecho',
          dia: 'Viernes',
          horaInicio: '14:00',
          horaFin: '16:00',
          docente: 'Dr. Andrés Castro',
          espacioId: 'aula404',
          espacioNombre: 'Aula 404'
        }
      ],
      fechaCreacion: new Date().toISOString()
    }
  ],
  'medicina': [
    {
      id: 'horario-medicina-1',
      grupoNombre: 'A',
      facultadId: 'FAC-SAL',
      programaId: 'medicina',
      semestre: 1,
      periodo: '2025-1',
      asignaturas: [
        {
          id: 'm1',
          asignaturaId: 'anatomia',
          asignaturaNombre: 'Anatomía Humana I',
          dia: 'Lunes',
          horaInicio: '07:00',
          horaFin: '10:00',
          docente: 'Dr. Ricardo Vargas',
          espacioId: 'lab-anatomia',
          espacioNombre: 'Lab. Anatomía'
        },
        {
          id: 'm2',
          asignaturaId: 'bioquimica',
          asignaturaNombre: 'Bioquímica',
          dia: 'Martes',
          horaInicio: '08:00',
          horaFin: '10:00',
          docente: 'Dra. Claudia Moreno',
          espacioId: 'aula-med1',
          espacioNombre: 'Aula Medicina 1'
        },
        {
          id: 'm3',
          asignaturaId: 'anatomia',
          asignaturaNombre: 'Anatomía Humana I',
          dia: 'Miércoles',
          horaInicio: '07:00',
          horaFin: '10:00',
          docente: 'Dr. Ricardo Vargas',
          espacioId: 'lab-anatomia',
          espacioNombre: 'Lab. Anatomía'
        },
        {
          id: 'm4',
          asignaturaId: 'fisiologia',
          asignaturaNombre: 'Fisiología I',
          dia: 'Jueves',
          horaInicio: '10:00',
          horaFin: '12:00',
          docente: 'Dr. Sebastián Ruiz',
          espacioId: 'aula-med2',
          espacioNombre: 'Aula Medicina 2'
        },
        {
          id: 'm5',
          asignaturaId: 'biologia',
          asignaturaNombre: 'Biología Celular',
          dia: 'Jueves',
          horaInicio: '14:00',
          horaFin: '16:00',
          docente: 'Dra. Elena Martínez',
          espacioId: 'lab-biologia',
          espacioNombre: 'Lab. Biología'
        },
        {
          id: 'm6',
          asignaturaId: 'histologia',
          asignaturaNombre: 'Histología',
          dia: 'Viernes',
          horaInicio: '08:00',
          horaFin: '11:00',
          docente: 'Dr. Miguel Ángel Díaz',
          espacioId: 'lab-histologia',
          espacioNombre: 'Lab. Histología'
        }
      ],
      fechaCreacion: new Date().toISOString()
    }
  ]
};

export default function HorarioEstudiante() {
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [horarios, setHorarios] = useState<HorarioCompleto[]>([]);
  
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
  const [semestreSeleccionado, setSemestreSeleccionado] = useState<string>('');
  
  const [horarioVisualizado, setHorarioVisualizado] = useState<HorarioCompleto | null>(null);
  
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

  useEffect(() => {
    loadData();
    
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('horariosUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('horariosUpdated', handleStorageChange);
    };
  }, []);

  const loadData = () => {
    setFacultades(db.getFacultades());
    setProgramas(db.getProgramas());
    
    const stored = localStorage.getItem('horariosCompletos');
    if (stored) {
      const horariosData = JSON.parse(stored);
      setHorarios(horariosData);
    }
  };

  // Obtener el programa actual para saber cuántos semestres tiene
  const programaActual = programas.find(p => p.id === programaSeleccionado);
  const semestresDisponibles = programaActual ? Array.from({ length: programaActual.semestres }, (_, i) => i + 1) : [];

  const visualizarHorario = () => {
    if (!programaSeleccionado || !semestreSeleccionado) {
      return;
    }

    // Primero buscar en horarios reales
    let horario = horarios.find(h =>
      h.programaId === programaSeleccionado &&
      h.semestre === Number(semestreSeleccionado)
    );

    // Si no hay horario real, buscar en ejemplos
    if (!horario) {
      const programaNombre = programas.find(p => p.id === programaSeleccionado)?.nombre.toLowerCase() || '';
      
      // Buscar por palabras clave
      let ejemploKey = '';
      if (programaNombre.includes('sistema') || programaNombre.includes('ingeniería de sistemas')) {
        ejemploKey = 'sistemas';
      } else if (programaNombre.includes('derecho')) {
        ejemploKey = 'derecho';
      } else if (programaNombre.includes('medicina')) {
        ejemploKey = 'medicina';
      }

      if (ejemploKey && HORARIOS_EJEMPLO[ejemploKey]) {
        const horariosPrograma = HORARIOS_EJEMPLO[ejemploKey];
        horario = horariosPrograma.find(h => h.semestre === Number(semestreSeleccionado));
      }
    }

    setHorarioVisualizado(horario || null);
  };

  // Resetear semestre al cambiar programa
  useEffect(() => {
    setSemestreSeleccionado('');
    setHorarioVisualizado(null);
  }, [programaSeleccionado]);

  const programaNombre = programas.find(p => p.id === programaSeleccionado)?.nombre || '';

  // Colores por asignatura
  const coloresAsignatura = [
    { bg: 'bg-blue-500', text: 'text-white', light: 'bg-blue-50', border: 'border-blue-500' },
    { bg: 'bg-emerald-500', text: 'text-white', light: 'bg-emerald-50', border: 'border-emerald-500' },
    { bg: 'bg-purple-500', text: 'text-white', light: 'bg-purple-50', border: 'border-purple-500' },
    { bg: 'bg-orange-500', text: 'text-white', light: 'bg-orange-50', border: 'border-orange-500' },
    { bg: 'bg-pink-500', text: 'text-white', light: 'bg-pink-50', border: 'border-pink-500' },
    { bg: 'bg-cyan-500', text: 'text-white', light: 'bg-cyan-50', border: 'border-cyan-500' },
    { bg: 'bg-indigo-500', text: 'text-white', light: 'bg-indigo-50', border: 'border-indigo-500' },
    { bg: 'bg-rose-500', text: 'text-white', light: 'bg-rose-50', border: 'border-rose-500' },
  ];

  const getColorAsignatura = (asignaturaId: string) => {
    if (!horarioVisualizado) return coloresAsignatura[0];
    const uniqueIds = Array.from(new Set(horarioVisualizado.asignaturas.map(a => a.asignaturaId)));
    const index = uniqueIds.indexOf(asignaturaId);
    return coloresAsignatura[index % coloresAsignatura.length];
  };

  // Agrupar asignaturas por día
  const getAsignaturasPorDia = (dia: string) => {
    if (!horarioVisualizado) return [];
    return horarioVisualizado.asignaturas
      .filter(a => a.dia === dia)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio));
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Mi Horario Académico</h1>
          <p className="text-slate-600 dark:text-slate-400">Consulta tu horario semanal - Periodo {PERIODO_ACTUAL}</p>
        </div>
        <Badge className="bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2">
          <Calendar className="w-4 h-4 mr-2" />
          {PERIODO_ACTUAL}
        </Badge>
      </div>

      {/* Filters Card */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <Search className="w-5 h-5 text-red-600" />
            Selecciona tu Información
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Programa */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Programa Académico</Label>
              <Select value={programaSeleccionado} onValueChange={setProgramaSeleccionado}>
                <SelectTrigger className="border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Selecciona tu programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(programa => (
                    <SelectItem key={programa.id} value={programa.id}>
                      {programa.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Ej: Ingeniería de Sistemas, Derecho, Medicina, etc.
              </p>
            </div>

            {/* Semestre */}
            <div className="space-y-2">
              <Label className="text-slate-700 dark:text-slate-300">Semestre</Label>
              <Select 
                value={semestreSeleccionado} 
                onValueChange={setSemestreSeleccionado}
                disabled={!programaSeleccionado}
              >
                <SelectTrigger className="border-slate-300 dark:border-slate-600">
                  <SelectValue placeholder="Selecciona tu semestre" />
                </SelectTrigger>
                <SelectContent>
                  {semestresDisponibles.map(sem => (
                    <SelectItem key={sem} value={String(sem)}>
                      Semestre {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Semestre que estás cursando actualmente
              </p>
            </div>

            {/* Botón Visualizar */}
            <div className="space-y-2">
              <Label className="opacity-0">Acción</Label>
              <Button
                onClick={visualizarHorario}
                disabled={!programaSeleccionado || !semestreSeleccionado}
                className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white h-11"
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver Mi Horario
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Horario Visualization */}
      {horarioVisualizado ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Info del horario */}
          <Card className="border-slate-200 dark:border-slate-700 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-slate-800 dark:to-slate-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <GraduationCap className="w-5 h-5 text-red-600" />
                    {programaNombre}
                  </h3>
                  <div className="flex items-center gap-4 text-slate-600 dark:text-slate-400 flex-wrap">
                    <span>Semestre {horarioVisualizado.semestre}</span>
                    <span>•</span>
                    <span>Grupo {horarioVisualizado.grupoNombre}</span>
                    <span>•</span>
                    <span>{Array.from(new Set(horarioVisualizado.asignaturas.map(a => a.asignaturaId))).length} asignaturas</span>
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
            {dias.map(dia => {
              const asignaturasDia = getAsignaturasPorDia(dia);
              return (
                <Card key={dia} className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                  <CardHeader className="pb-3 bg-slate-50 dark:bg-slate-700/50">
                    <CardTitle className="text-slate-900 dark:text-slate-100 flex items-center justify-between">
                      <span>{dia}</span>
                      {asignaturasDia.length > 0 && (
                        <Badge variant="outline" className="border-slate-300 dark:border-slate-600">
                          {asignaturasDia.length} {asignaturasDia.length === 1 ? 'clase' : 'clases'}
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
                              <div className="flex items-start justify-between gap-2">
                                <h4 className="text-slate-900 dark:text-slate-100 leading-tight">
                                  {asig.asignaturaNombre}
                                </h4>
                              </div>
                              
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-sm">{asig.horaInicio} - {asig.horaFin}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                                  <User className="w-3.5 h-3.5 flex-shrink-0" />
                                  <span className="text-sm">{asig.docente}</span>
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
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Array.from(new Set(horarioVisualizado.asignaturas.map(a => a.asignaturaId))).map(asigId => {
                  const asig = horarioVisualizado.asignaturas.find(a => a.asignaturaId === asigId);
                  const color = getColorAsignatura(asigId);
                  if (!asig) return null;
                  
                  return (
                    <div key={asigId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className={`w-3 h-3 rounded-full ${color.bg}`}></div>
                      <span className="text-slate-700 dark:text-slate-300">{asig.asignaturaNombre}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardContent className="p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h3 className="text-slate-900 dark:text-slate-100 mb-2">
              {programaSeleccionado && semestreSeleccionado ? 'No se encontró horario' : 'Selecciona tu programa y semestre'}
            </h3>
            <p className="text-slate-600 dark:text-slate-400">
              {programaSeleccionado && semestreSeleccionado 
                ? 'No hay un horario registrado para la selección actual.'
                : 'Por favor completa los filtros y haz clic en "Ver Mi Horario" para visualizar tu horario académico.'
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
