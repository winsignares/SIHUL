import { Badge } from '../../../../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { motion } from 'motion/react';
import { useState } from 'react';
import { Calendar, User, Clock, GripVertical, X } from 'lucide-react';
import type { useCrearHorarios } from '../../hooks/useCrearHorarios';

type CrearHorarios = ReturnType<typeof useCrearHorarios>;

/** Vista semanal del grupo: las clases se pueden arrastrar para moverlas de día u hora. */
export function GrillaSemanalHorario({
  diasSemana,
  horas,
  obtenerClaseEnHora,
  handleMoverHorario,
  handleEliminarHorarioAsignado
}: Pick<CrearHorarios, 'diasSemana' | 'horas' | 'obtenerClaseEnHora' | 'handleMoverHorario' | 'handleEliminarHorarioAsignado'>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [draggedHorario, setDraggedHorario] = useState<any>(null);
  const [dragSource, setDragSource] = useState<{ dia: string; hora: string } | null>(null);
  const rowHeightClasses = [
    '',
    'h-[7.5rem]',
    'h-[12.5rem]',
    'h-[17.5rem]',
    'h-[22.5rem]',
    'h-[27.5rem]',
    'h-[32.5rem]',
    'h-[37.5rem]',
    'h-[42.5rem]',
    'h-[47.5rem]',
    'h-[52.5rem]',
    'h-[57.5rem]',
    'h-[62.5rem]'
  ];

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-red-50 via-slate-50 to-blue-50 border-b border-slate-200">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Calendar className="w-5 h-5 text-red-600" />
          Vista Semanal - Arrastra para reorganizar
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[900px]">
            <thead>
              <tr>
                <th className="border-2 border-slate-300 bg-gradient-to-r from-slate-100 to-slate-50 p-3 w-32 sticky left-0 z-10 font-semibold text-slate-700">Hora</th>
                {diasSemana.map(dia => (
                  <th key={dia} className="border-2 border-slate-300 bg-gradient-to-b from-red-50 to-slate-50 p-3 text-slate-900 font-bold">
                    {dia}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {horas.map(hora => {
                // Convertir hora a rango (ej: "6:00" -> "6:00 - 7:00")
                const horaNum = parseInt(hora.split(':')[0]);
                const horaFin = horaNum + 1;
                const horaRango = `${hora} - ${horaFin.toString().padStart(2, '0')}:00`;
                
                return (
                <tr key={hora}>
                  <td className="border-2 border-slate-300 bg-gradient-to-r from-slate-100 to-slate-50 p-3 text-slate-700 text-center font-semibold sticky left-0 z-10">
                    <div className="text-xs font-medium">{horaRango}</div>
                  </td>
                  {diasSemana.map(dia => {
                    const clase = obtenerClaseEnHora(dia, hora);
                    const horaActual = parseInt(hora.split(':')[0]);
                    
                    const esInicioClase = clase && parseInt(clase.hora_inicio.split(':')[0]) === horaActual;
                    
                    let rowspan = 1;
                    if (esInicioClase) {
                      const horaInicio = parseInt(clase.hora_inicio.split(':')[0]);
                      const horaFin = parseInt(clase.hora_fin.split(':')[0]);
                      rowspan = horaFin - horaInicio;
                    }
                    
                    const claseOcupante = obtenerClaseEnHora(dia, hora);
                    const estaOcupadaPorClaseAnterior = claseOcupante && 
                      parseInt(claseOcupante.hora_inicio.split(':')[0]) < horaActual;
                    
                    if (estaOcupadaPorClaseAnterior) {
                      return null;
                    }
                    
                    return (
                      <td 
                        key={`${dia}-${hora}`} 
                        className={`border-2 border-slate-300 p-2 align-top bg-slate-50 hover:bg-slate-100 transition-colors ${rowHeightClasses[esInicioClase ? rowspan : 1]}`}
                        rowSpan={esInicioClase ? rowspan : 1}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (draggedHorario && dragSource) {
                            handleMoverHorario(draggedHorario.id, dia, hora);
                            setDraggedHorario(null);
                            setDragSource(null);
                          }
                        }}
                      >
                        {esInicioClase && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            draggable={clase.estado !== 'pendiente'}
                            onDragStart={() => {
                              if (clase.estado !== 'pendiente') {
                                setDraggedHorario(clase);
                                setDragSource({ dia, hora });
                              }
                            }}
                            onDragEnd={() => {
                              setDraggedHorario(null);
                              setDragSource(null);
                            }}
                            className={`rounded-lg p-2 text-xs h-full relative group shadow-md hover:shadow-lg transition-shadow overflow-hidden ${
                              clase.estado === 'pendiente' || clase.es_solicitud
                                ? 'bg-gradient-to-br from-amber-100 via-yellow-50 to-orange-100 border-l-4 border-amber-500 cursor-default'
                                : 'bg-gradient-to-br from-red-100 via-yellow-50 to-orange-50 border-l-4 border-red-600 cursor-move'
                            }`}
                          >
                            <div className="flex items-start justify-between h-full gap-2">
                              <div className="flex-1 min-w-0 space-y-0.5">
                                <div className="flex items-center gap-1 flex-wrap">
                                  {clase.estado !== 'pendiente' && !clase.es_solicitud && (
                                    <GripVertical className="w-3 h-3 text-slate-400 flex-shrink-0" />
                                  )}
                                  <p className="text-slate-900 truncate font-bold leading-tight">{clase.asignatura_nombre}</p>
                                  {(clase.estado === 'pendiente' || clase.es_solicitud) && (
                                    <Badge className="bg-amber-500 text-white text-[10px] px-1.5 py-0 h-4">
                                      Pendiente
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-slate-600 text-xs truncate leading-tight">
                                  <User className="w-3 h-3 inline mr-1" />
                                  {clase.docente_nombre}
                                </p>
                                <p className="text-slate-600 text-xs truncate leading-tight">
                                  📍 {clase.espacio_nombre}
                                </p>
                                <p className="text-slate-600 text-xs truncate leading-tight font-semibold">
                                  <Clock className="w-3 h-3 inline mr-1" />
                                  {clase.hora_inicio} - {clase.hora_fin}
                                </p>
                              </div>
                              <button
                                onClick={() => handleEliminarHorarioAsignado(clase.id)}
                                aria-label="Eliminar horario"
                                title="Eliminar horario"
                                className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 text-red-600 hover:text-red-800 hover:bg-red-100 p-1 rounded"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </td>
                    );
                  })}
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
          💡 Puedes arrastrar las asignaturas para reorganizar el horario
        </div>
      </CardContent>
    </Card>
  );
}
