import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Button } from '../../share/button';
import { Badge } from '../../share/badge';
import { motion } from 'motion/react';
import { Calendar, Clock, BookOpen, MapPin, User, FileDown, FileSpreadsheet } from 'lucide-react';
import { useMiHorario } from '../../hooks/horarios/useMiHorario';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function MiHorario() {
  const isMobile = useIsMobile();
  const {
    horarios,
    diasSemana,
    esDocente,
    esEstudiante,
    horas,
    obtenerClaseEnHora,
    handleDescargarPDF,
    handleDescargarExcel,
    loading,
    notification
  } = useMiHorario();

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
      {/* Notificación */}
      {notification && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg text-white z-50 ${
          notification.type === 'error' ? 'bg-red-500' :
          notification.type === 'success' ? 'bg-green-500' :
          'bg-blue-500'
        }`}>
          {notification.message}
        </div>
      )}

      {/* Encabezado */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between flex-wrap gap-4"
      >
        <div>
          <h2 className="text-slate-900">Mi Horario</h2>
          <p className="text-slate-600 mt-1">
            {esDocente ? 'Horario asignado al docente' : 'Horario asignado al estudiante'}
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            onClick={handleDescargarPDF}
            className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Descargar en PDF
          </Button>
          <Button
            onClick={handleDescargarExcel}
            className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Descargar en Excel
          </Button>
        </div>
      </motion.div>


      {loading ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <motion.div
            className="w-16 h-16 border-4 border-red-500 border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-slate-600 mt-4">Cargando horario...</p>
        </motion.div>
      ) : horarios.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center py-20"
        >
          <Calendar className="w-20 h-20 text-slate-300 mb-4" />
          <h3 className="text-slate-700 mb-2">No hay horarios asignados</h3>
          <p className="text-slate-500">
            {esDocente
              ? 'No tienes clases asignadas en este momento'
              : 'No tienes un horario asignado para este periodo'}
          </p>
        </motion.div>
      ) : (
        <div className="space-y-6">
          {/* Grid semanal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <Calendar className="w-5 h-5 text-red-600" />
                  Vista Semanal
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[800px]">
                    <thead>
                      <tr>
                        <th className="border border-slate-200 bg-slate-50 p-2 w-20 sticky left-0 z-10">Hora</th>
                        {diasSemana.map(dia => (
                          <th key={dia} className="border border-slate-200 bg-slate-50 p-2 text-slate-700">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {horas.map(hora => (
                        <tr key={hora}>
                          <td className="border border-slate-200 bg-slate-50 p-2 text-slate-600 text-center sticky left-0 z-10">
                            {hora}
                          </td>
                          {diasSemana.map(dia => {
                            const clase = obtenerClaseEnHora(dia, hora);
                            return (
                              <td key={`${dia}-${hora}`} className="border border-slate-200 p-1 h-16 align-top">
                                {clase && parseInt(hora.split(':')[0]) === parseInt(clase.horaInicio.split(':')[0]) && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="bg-gradient-to-br from-red-100 to-yellow-50 border-l-4 border-red-600 rounded p-2 text-xs h-full"
                                  >
                                    <p className="text-slate-900 truncate">{clase.asignatura}</p>
                                    {esEstudiante && (
                                      <p className="text-slate-600 text-xs truncate mt-1">
                                        <User className="w-3 h-3 inline mr-1" />
                                        {clase.docente}
                                      </p>
                                    )}
                                    {esDocente && (
                                      <p className="text-slate-600 text-xs truncate mt-1">
                                        <BookOpen className="w-3 h-3 inline mr-1" />
                                        {clase.grupo}
                                      </p>
                                    )}
                                    <p className="text-slate-500 text-xs truncate">
                                      <MapPin className="w-3 h-3 inline mr-1" />
                                      {clase.espacio}
                                    </p>
                                    <p className="text-slate-500 text-xs truncate">
                                      <Clock className="w-3 h-3 inline mr-1" />
                                      {clase.horaInicio} - {clase.horaFin}
                                    </p>
                                  </motion.div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Lista detallada de clases */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <BookOpen className="w-5 h-5 text-red-600" />
                  Detalle de Clases ({horarios.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-3">
                  {horarios.map((horario, index) => (
                    <motion.div
                      key={horario.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="p-4 bg-slate-50 rounded-lg border border-slate-200 hover:shadow-md transition-shadow"
                    >
                      <div className={`grid ${esDocente ? 'grid-cols-5' : 'grid-cols-5'} gap-4`}>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Asignatura</p>
                          <p className="text-slate-900">{horario.asignatura}</p>
                        </div>
                        {esEstudiante && (
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Docente</p>
                            <p className="text-slate-700">{horario.docente}</p>
                          </div>
                        )}
                        {esDocente && (
                          <div>
                            <p className="text-slate-500 text-xs mb-1">Grupo</p>
                            <p className="text-slate-700">{horario.grupo}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Espacio</p>
                          <p className="text-slate-700">{horario.espacio}</p>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Día</p>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 capitalize">
                            {horario.diaSemana}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-slate-500 text-xs mb-1">Horario</p>
                          <p className="text-slate-700">{horario.horaInicio} - {horario.horaFin}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Resumen estadístico */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                      <BookOpen className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm">
                        {esDocente ? 'Asignaturas diferentes' : 'Total de clases'}
                      </p>
                      <p className="text-slate-900 text-2xl">
                        {esDocente
                          ? new Set(horarios.map(h => h.asignatura)).size
                          : horarios.length}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-100 to-yellow-50 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm">Horas semanales</p>
                      <p className="text-slate-900 text-2xl">
                        {horarios.reduce((acc, h) => {
                          const inicio = parseInt(h.horaInicio.split(':')[0]);
                          const fin = parseInt(h.horaFin.split(':')[0]);
                          return acc + (fin - inicio);
                        }, 0)}h
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                      <MapPin className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-slate-500 text-sm">Espacios diferentes</p>
                      <p className="text-slate-900 text-2xl">
                        {new Set(horarios.map(h => h.espacio)).size}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
