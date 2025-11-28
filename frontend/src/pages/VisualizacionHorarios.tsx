import React, { useState, useEffect } from 'react';
import { Button } from '../share/button';
import { Label } from '../share/label';
import { Card, CardContent, CardHeader, CardTitle } from '../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { Badge } from '../share/badge';
import { Calendar, Clock, MapPin, User, Search, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useFacultades } from '../hooks/useFacultades';
import { useProgramas } from '../hooks/useProgramas';
import { useAsignaturas } from '../hooks/useAsignaturas';
import { useEspacios } from '../hooks/useEspacios';
import { useHorarios } from '../hooks/useHorarios';
import type { Facultad } from '../models/facultad';
import type { Programa } from '../models/programa';
import type { Asignatura } from '../models/asignatura';
import type { Espacio } from '../models/espacio';

interface HorarioCompleto {
  id: string;
  grupoNombre: string; // ej: "1A", "1B"
  facultadId: string;
  programaId: string;
  semestre: number;
  periodo: string; // fijo "2025-1"
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

export default function VisualizacionHorarios() {
  const { facultades } = useFacultades();
  const { programas } = useProgramas();
  const { asignaturas } = useAsignaturas();
  const { espacios } = useEspacios();
  const { horarios: horariosFromHook } = useHorarios();
  
  const [horarios, setHorarios] = useState<HorarioCompleto[]>([]);
  
  const [facultadSeleccionada, setFacultadSeleccionada] = useState<string>('');
  const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
  const [semestreSeleccionado, setSemestreSeleccionado] = useState<string>('');
  const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('');
  
  const [horarioVisualizado, setHorarioVisualizado] = useState<HorarioCompleto | null>(null);
  
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const horasDelDia = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
    '20:00', '21:00', '22:00'
  ];

  const loadData = () => {
    // Cargar horarios desde localStorage (mismo lugar que HorariosAcademicos)
    const stored = localStorage.getItem('horariosCompletos');
    if (stored) {
      const horariosData = JSON.parse(stored);
      setHorarios(horariosData);
      console.log('Horarios cargados:', horariosData);
    } else {
      console.log('No hay horarios en localStorage');
    }
  };

  useEffect(() => {
    loadData();
    
    // Escuchar cambios en localStorage para actualizar automáticamente
    const handleStorageChange = () => {
      loadData();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // También escuchar eventos personalizados para cambios en la misma pestaña
    window.addEventListener('horariosUpdated', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('horariosUpdated', handleStorageChange);
    };
  }, [horariosFromHook]);

  // Filtrar programas por facultad seleccionada
  const programasFiltrados = programas.filter(p => 
    p.facultad_id.toString() === facultadSeleccionada
  );

  // Obtener el programa actual para saber cuántos semestres tiene
  const programaActual = programas.find(p => p.id.toString() === programaSeleccionado);
  const semestresDisponibles = programaActual ? Array.from({ length: programaActual.numero_semestres || 0 }, (_, i) => i + 1) : [];

  // Generar grupos dinámicamente basados en el semestre seleccionado
  const generarGruposPorSemestre = (semestre: string): string[] => {
    if (!semestre) return [];
    
    console.log('Filtrando grupos con:', {
      facultadSeleccionada,
      programaSeleccionado,
      semestre,
      totalHorarios: horarios.length
    });
    
    // Buscar todos los horarios que coincidan con los filtros actuales
    const gruposExistentes = horarios
      .filter(h => {
        const match = h.facultadId === facultadSeleccionada &&
          h.programaId === programaSeleccionado &&
          h.semestre === Number(semestre);
        
        if (match) {
          console.log('Horario encontrado:', h);
        }
        
        return match;
      })
      .map(h => h.grupoNombre);
    
    console.log('Grupos disponibles:', gruposExistentes);
    
    return gruposExistentes;
  };
  
  const gruposDisponibles = generarGruposPorSemestre(semestreSeleccionado);

  const visualizarHorario = () => {
    if (!facultadSeleccionada || !programaSeleccionado || !semestreSeleccionado || !grupoSeleccionado) {
      return;
    }

    // Buscar el horario exacto que coincida con los filtros
    const horario = horarios.find(h =>
      h.facultadId === facultadSeleccionada &&
      h.programaId === programaSeleccionado &&
      h.semestre === Number(semestreSeleccionado) &&
      h.grupoNombre === grupoSeleccionado
    );

    setHorarioVisualizado(horario || null);
  };

  const obtenerAsignaturasEnCelda = (dia: string, hora: string) => {
    if (!horarioVisualizado) return [];

    return horarioVisualizado.asignaturas.filter(asig => {
      if (asig.dia !== dia) return false;

      const horaInicioNum = parseInt(asig.horaInicio.replace(':', ''));
      const horaFinNum = parseInt(asig.horaFin.replace(':', ''));
      const horaCeldaNum = parseInt(hora.replace(':', ''));

      return horaCeldaNum >= horaInicioNum && horaCeldaNum < horaFinNum;
    });
  };

  const calcularFilasSpan = (asignatura: AsignaturaHorario) => {
    const horaInicio = parseInt(asignatura.horaInicio.replace(':', ''));
    const horaFin = parseInt(asignatura.horaFin.replace(':', ''));
    const duracion = (horaFin - horaInicio) / 100;
    return duracion;
  };

  const facultadNombre = facultades.find(f => f.id.toString() === facultadSeleccionada)?.nombre || '';
  const programaNombre = programas.find(p => p.id.toString() === programaSeleccionado)?.nombre || '';

  return (
    <div className="p-8 space-y-6">
      {/* Header con periodo actual */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Visualización de Horarios</h1>
          <p className="text-slate-600 dark:text-slate-400">Consulta horarios académicos por grupo</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={loadData}
            variant="outline"
            size="sm"
            className="border-slate-300 dark:border-slate-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refrescar
          </Button>
          <Badge className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            Periodo {PERIODO_ACTUAL}
          </Badge>
        </div>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-slate-100">Filtros de Búsqueda</CardTitle>
            <Badge variant="outline" className="text-slate-600 dark:text-slate-400">
              {horarios.length} horarios en sistema
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Facultad *</Label>
              <Select
                value={facultadSeleccionada}
                onValueChange={(value) => {
                  setFacultadSeleccionada(value);
                  setProgramaSeleccionado('');
                  setSemestreSeleccionado('');
                  setGrupoSeleccionado('');
                  setHorarioVisualizado(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar facultad" />
                </SelectTrigger>
                <SelectContent>
                  {facultades.map(f => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Programa *</Label>
              <Select
                value={programaSeleccionado}
                onValueChange={(value) => {
                  setProgramaSeleccionado(value);
                  setSemestreSeleccionado('');
                  setGrupoSeleccionado('');
                  setHorarioVisualizado(null);
                }}
                disabled={!facultadSeleccionada}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {programasFiltrados.length === 0 ? (
                    <div className="p-2 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No hay programas disponibles
                    </div>
                  ) : (
                    programasFiltrados.map(p => (
                      <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Semestre *</Label>
              <Select
                value={semestreSeleccionado}
                onValueChange={(value) => {
                  setSemestreSeleccionado(value);
                  setGrupoSeleccionado('');
                  setHorarioVisualizado(null);
                }}
                disabled={!programaSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar semestre" />
                </SelectTrigger>
                <SelectContent>
                  {semestresDisponibles.map(s => (
                    <SelectItem key={s} value={String(s)}>Semestre {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Grupo *</Label>
              <Select
                value={grupoSeleccionado}
                onValueChange={(value) => {
                  setGrupoSeleccionado(value);
                  setHorarioVisualizado(null);
                }}
                disabled={!semestreSeleccionado}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar grupo" />
                </SelectTrigger>
                <SelectContent>
                  {gruposDisponibles.length === 0 ? (
                    <div className="p-2 text-center text-slate-500 dark:text-slate-400 text-sm">
                      No hay grupos disponibles
                    </div>
                  ) : (
                    gruposDisponibles.map(g => (
                      <SelectItem key={g} value={g}>{g}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                onClick={visualizarHorario}
                disabled={!grupoSeleccionado}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
              >
                <Search className="w-4 h-4 mr-2" />
                Visualizar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del horario */}
      {horarioVisualizado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-6 flex-wrap">
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Facultad</p>
                    <p className="text-blue-900 dark:text-blue-100">{facultadNombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Programa</p>
                    <p className="text-blue-900 dark:text-blue-100">{programaNombre}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Semestre</p>
                    <p className="text-blue-900 dark:text-blue-100">{semestreSeleccionado}</p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">Grupo</p>
                    <p className="text-blue-900 dark:text-blue-100">{grupoSeleccionado}</p>
                  </div>
                </div>
                <Badge className="bg-blue-700 text-white">
                  {horarioVisualizado.asignaturas.length} clases programadas
                </Badge>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Tabla de Horario */}
      {horarioVisualizado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-lg border border-slate-300 dark:border-slate-700">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="p-4 bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 min-w-[100px]">
                        <div className="flex items-center justify-center gap-2">
                          <Clock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                          <p className="text-slate-700 dark:text-slate-300">Hora</p>
                        </div>
                      </th>
                      {dias.map(dia => (
                        <th key={dia} className="p-4 bg-gradient-to-br from-red-600 to-red-700 text-white border border-red-700">
                          <p className="tracking-wide">{dia}</p>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {horasDelDia.map((hora) => (
                      <tr key={hora} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20">
                        <td className="p-4 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-300 text-center">
                          {hora}
                        </td>
                        {dias.map(dia => {
                          const asignaturasEnCelda = obtenerAsignaturasEnCelda(dia, hora);
                          
                          if (asignaturasEnCelda.length > 0) {
                            const asignatura = asignaturasEnCelda[0];
                            
                            // Solo renderizar si es la primera celda de la asignatura
                            if (asignatura.horaInicio === hora) {
                              return (
                                <td
                                  key={dia}
                                  rowSpan={calcularFilasSpan(asignatura)}
                                  className="p-0 border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/40 dark:to-blue-900/30 align-top"
                                >
                                  <motion.div 
                                    className="p-3 h-full space-y-2"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                  >
                                    <div className="space-y-1.5">
                                      <p className="text-slate-900 dark:text-slate-100 leading-tight">
                                        {asignatura.asignaturaNombre}
                                      </p>
                                      <div className="space-y-0.5 text-sm">
                                        <p className="text-blue-700 dark:text-blue-300 flex items-center gap-1">
                                          <span className="text-xs">📍</span>
                                          {asignatura.espacioNombre}
                                        </p>
                                        <p className="text-slate-600 dark:text-slate-400 flex items-center gap-1">
                                          <span className="text-xs">👤</span>
                                          {asignatura.docente}
                                        </p>
                                      </div>
                                    </div>
                                    
                                    <div className="pt-1 border-t border-blue-200 dark:border-blue-800">
                                      <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">
                                        <Clock className="w-3 h-3 mr-1" />
                                        {asignatura.horaInicio} - {asignatura.horaFin}
                                      </Badge>
                                    </div>
                                  </motion.div>
                                </td>
                              );
                            } else {
                              return null;
                            }
                          } else {
                            return (
                              <td
                                key={dia}
                                className="border border-slate-200 dark:border-slate-700 p-3 bg-white dark:bg-slate-900/20 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors"
                              >
                                <div className="h-12"></div>
                              </td>
                            );
                          }
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Mensaje cuando no hay horario después de buscar */}
      {!horarioVisualizado && grupoSeleccionado && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="p-8 text-center">
              <Calendar className="w-12 h-12 text-amber-600 dark:text-amber-400 mx-auto mb-4" />
              <p className="text-amber-900 dark:text-amber-100">
                No se encontró ningún horario con los criterios seleccionados
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-2">
                Grupo: <strong>{grupoSeleccionado}</strong> del semestre <strong>{semestreSeleccionado}</strong>
              </p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Verifique que el horario haya sido creado en el módulo de Horarios Académicos.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
