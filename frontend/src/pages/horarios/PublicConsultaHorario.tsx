import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Download, Calendar, FileSpreadsheet, Eye, Clock, MapPin, Search } from 'lucide-react';
import { Badge } from '../../share/badge';
import { Toaster } from '../../share/sonner';
import { motion } from 'motion/react';
import { useConsultaHorario } from '../../hooks/horarios/useConsultaHorario';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function PublicConsultaHorario() {
  const isMobile = useIsMobile();
  const {
    periodoActual,
    tipoConsulta,
    setTipoConsulta,
    filtroDocente,
    setFiltroDocente,
    filtroPrograma,
    setFiltroPrograma,
    horariosDocente,
    horariosPrograma,
    docentes,
    programas,
    exportarPDF,
    exportarExcel,
    showHorarioModal,
    setShowHorarioModal,
    grupoSeleccionado,
    handleVerHorarioGrupo,
    obtenerHorariosGrupo,
    docenteSeleccionado,
    showHorarioDocenteModal,
    setShowHorarioDocenteModal,
    handleVerHorarioDocente,
    obtenerHorariosDocente
  } = useConsultaHorario();

  const renderContent = () => {
    if (tipoConsulta === 'horarios-docente') {
      // Agrupar horarios por docente y filtrar
      const docentesAgrupados = horariosDocente
        .filter(horario => 
          filtroDocente === 'Todos' || 
          horario.docente.toLowerCase() === filtroDocente.toLowerCase()
        )
        .reduce((acc, horario) => {
          const key = horario.docente;
          if (!acc[key]) {
            acc[key] = {
              docente: horario.docente,
              facultad: horario.facultad,
              horarios: []
            };
          }
          acc[key].horarios.push(horario);
          return acc;
        }, {} as Record<string, { docente: string; facultad?: string; horarios: any[] }>);

      const docentesListaAgrupada = Object.values(docentesAgrupados);

      return (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Docente</CardTitle>
              <Select value={filtroDocente} onValueChange={setFiltroDocente}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Seleccionar docente" />
                </SelectTrigger>
                <SelectContent>
                  {docentes.map(doc => (
                    <SelectItem key={doc} value={doc}>{doc}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            {docentesListaAgrupada.length === 0 ? (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 dark:text-slate-400 mb-2">No se encontraron docentes</p>
                <p className="text-slate-500 dark:text-slate-500">Intenta ajustar los filtros de búsqueda</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Facultad</th>
                      <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Nombre Docente</th>
                      <th className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {docentesListaAgrupada.map((item) => (
                      <tr key={item.docente} className="border-t border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{item.facultad || 'N/A'}</td>
                        <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{item.docente}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-2 justify-center">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
                              onClick={() => handleVerHorarioDocente(item.docente)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver Horario
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      );
    }

    // horarios-programa
    const horariosAgrupados = horariosPrograma
      .filter(horario => 
        filtroPrograma === 'Todos' || 
        horario.programa?.toLowerCase() === filtroPrograma.toLowerCase()
      )
      .reduce((acc, horario) => {
        const key = `${horario.programa}-${horario.grupo}`;
        if (!acc[key]) {
          acc[key] = {
            programa: horario.programa,
            grupo: horario.grupo,
            horarios: []
          };
        }
        acc[key].horarios.push(horario);
        return acc;
      }, {} as Record<string, { programa?: string; grupo: string; horarios: any[] }>);

    const gruposAgrupados = Object.values(horariosAgrupados);

    return (
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Programa</CardTitle>
            <Select value={filtroPrograma} onValueChange={setFiltroPrograma}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Seleccionar programa" />
              </SelectTrigger>
              <SelectContent>
                {programas.map(prog => (
                  <SelectItem key={prog} value={prog}>{prog}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {gruposAgrupados.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-2">No se encontraron grupos</p>
              <p className="text-slate-500 dark:text-slate-500">Intenta ajustar los filtros de búsqueda</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Programa</th>
                    <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Grupo</th>
                    <th className="px-4 py-3 text-left text-slate-700 dark:text-slate-300">Semestre</th>
                    <th className="px-4 py-3 text-center text-slate-700 dark:text-slate-300">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {gruposAgrupados.map((grupo) => (
                    <tr key={`${grupo.programa}-${grupo.grupo}`} className="border-t border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700">
                      <td className="px-4 py-3 text-slate-900 dark:text-slate-100">{grupo.programa || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400">
                          {grupo.grupo}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-700 dark:text-slate-300">
                        {grupo.horarios[0]?.semestre || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:border-blue-400 dark:text-blue-400 dark:hover:bg-blue-950"
                            onClick={() => handleVerHorarioGrupo(grupo.grupo)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Horario
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Consulta de Horarios</h1>
          <p className="text-slate-600 dark:text-slate-400">Visualiza horarios por programa o docente</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-900 dark:text-blue-100"><strong>{periodoActual}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={tipoConsulta} onValueChange={setTipoConsulta}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Tipo de consulta" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="horarios-programa">Horarios por Programa</SelectItem>
            <SelectItem value="horarios-docente">Horarios por Docente</SelectItem>
          </SelectContent>
        </Select>
        <Button
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
          onClick={exportarPDF}
        >
          <Download className="w-4 h-4 mr-2" />
          Descargar PDF
        </Button>
        <Button
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
          onClick={exportarExcel}
        >
          <FileSpreadsheet className="w-4 h-4 mr-2" />
          Descargar Excel
        </Button>
      </div>

      {/* Main Content */}
      <motion.div
        key={tipoConsulta}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderContent()}
      </motion.div>

      {/* Modal de Horario por Grupo */}
      <Dialog open={showHorarioModal} onOpenChange={setShowHorarioModal}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Horario Completo del Grupo {grupoSeleccionado}
            </DialogTitle>
          </DialogHeader>
          {grupoSeleccionado && (
            <div className="space-y-6 py-4">
              {/* Información del Grupo */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Grupo</p>
                      <Badge className="bg-blue-600">{grupoSeleccionado}</Badge>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total de Clases</p>
                      <p className="text-slate-900 dark:text-slate-100">{obtenerHorariosGrupo(grupoSeleccionado).length} clases</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid Semanal */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                        <th className="border-2 border-slate-300 dark:border-slate-600 p-4 text-white w-32">
                          <Clock className="w-5 h-5 mx-auto mb-1" />
                          Hora
                        </th>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dia) => (
                          <th key={dia} className="border-2 border-slate-300 dark:border-slate-600 p-4 text-white">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((hora) => {
                        const horaNum = parseInt(hora.split(':')[0]);
                        const horaFin = horaNum + 1;
                        const horaRango = `${hora} - ${horaFin.toString().padStart(2, '0')}:00`;
                        
                        return (
                        <tr key={hora} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <td className="border-2 border-slate-300 dark:border-slate-600 p-3 bg-slate-100 dark:bg-slate-800 text-center text-slate-700 dark:text-slate-300 text-xs font-medium">
                            <div>{horaRango}</div>
                          </td>
                          {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'].map((dia) => {
                            const horariosDelGrupo = obtenerHorariosGrupo(grupoSeleccionado);
                            const clase = horariosDelGrupo.find(h => {
                              const diaMatch = h.dia.toLowerCase() === dia;
                              if (!diaMatch) return false;
                              
                              const [horaInicio, horaFin] = h.hora.split('-');
                              const horaActual = parseInt(hora.split(':')[0]);
                              const horaInicioNum = parseInt(horaInicio.split(':')[0]);
                              const horaFinNum = parseInt(horaFin.split(':')[0]);
                              
                              return horaActual >= horaInicioNum && horaActual < horaFinNum;
                            });
                            
                            return (
                              <td
                                key={dia}
                                className={`border-2 border-slate-300 dark:border-slate-600 p-2 transition-all ${clase
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer'
                                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                              >
                                {clase ? (
                                  <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="h-full min-h-[120px] flex flex-col justify-center items-center text-white p-3 rounded-lg"
                                  >
                                    <div className="text-center space-y-2 w-full">
                                      <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm mb-2">
                                        <p className="text-sm mb-1">{clase.asignatura}</p>
                                        <p className="text-xs text-yellow-200">{clase.docente}</p>
                                      </div>
                                      <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                        <MapPin className="w-4 h-4 text-yellow-300" />
                                        <span className="text-sm">{clase.espacio}</span>
                                      </div>
                                      <div className="text-xs text-yellow-100 mt-1">
                                        {clase.hora}
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <div className="h-full min-h-[120px] flex items-center justify-center">
                                    <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                  </div>
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
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>
                  <span className="text-slate-600 dark:text-slate-400">Clase asignada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded"></div>
                  <span className="text-slate-600 dark:text-slate-400">Hora libre</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowHorarioModal(false)} className="bg-blue-600 hover:bg-blue-700">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Horario por Docente */}
      <Dialog open={showHorarioDocenteModal} onOpenChange={setShowHorarioDocenteModal}>
        <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6 text-blue-600" />
              Horario Completo del Docente {docenteSeleccionado}
            </DialogTitle>
          </DialogHeader>
          {docenteSeleccionado && (
            <div className="space-y-6 py-4">
              {/* Información del Docente */}
              <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30 border-blue-200 dark:border-blue-800">
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Docente</p>
                      <Badge className="bg-blue-600">{docenteSeleccionado}</Badge>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400 text-sm mb-1">Total de Clases</p>
                      <p className="text-slate-900 dark:text-slate-100">{obtenerHorariosDocente(docenteSeleccionado).length} clases</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Grid Semanal */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gradient-to-r from-slate-800 to-slate-900">
                        <th className="border-2 border-slate-300 dark:border-slate-600 p-4 text-white w-24">
                          <Clock className="w-5 h-5 mx-auto mb-1" />
                          Hora
                        </th>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map((dia) => (
                          <th key={dia} className="border-2 border-slate-300 dark:border-slate-600 p-4 text-white">
                            {dia}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'].map((hora) => (
                        <tr key={hora} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                          <td className="border-2 border-slate-300 dark:border-slate-600 p-3 bg-slate-100 dark:bg-slate-800 text-center text-slate-700 dark:text-slate-300">
                            {hora}
                          </td>
                          {['lunes', 'martes', 'miercoles', 'jueves', 'viernes'].map((dia) => {
                            const horariosDelDocente = obtenerHorariosDocente(docenteSeleccionado);
                            const clase = horariosDelDocente.find(h => {
                              const diaMatch = h.dia.toLowerCase() === dia;
                              if (!diaMatch) return false;
                              
                              const [horaInicio, horaFin] = h.hora.split('-');
                              const horaActual = parseInt(hora.split(':')[0]);
                              const horaInicioNum = parseInt(horaInicio.split(':')[0]);
                              const horaFinNum = parseInt(horaFin.split(':')[0]);
                              
                              return horaActual >= horaInicioNum && horaActual < horaFinNum;
                            });
                            
                            return (
                              <td
                                key={dia}
                                className={`border-2 border-slate-300 dark:border-slate-600 p-2 transition-all ${clase
                                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 cursor-pointer'
                                  : 'bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800'
                                  }`}
                              >
                                {clase ? (
                                  <motion.div
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    className="h-full min-h-[120px] flex flex-col justify-center items-center text-white p-3 rounded-lg"
                                  >
                                    <div className="text-center space-y-2 w-full">
                                      <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm mb-2">
                                        <p className="text-sm mb-1">{clase.asignatura}</p>
                                        <p className="text-xs text-yellow-200">{clase.grupo}</p>
                                      </div>
                                      <div className="flex items-center justify-center gap-2 bg-white/10 rounded-md p-1.5">
                                        <MapPin className="w-4 h-4 text-yellow-300" />
                                        <span className="text-sm">{clase.espacio}</span>
                                      </div>
                                      <div className="text-xs text-yellow-100 mt-1">
                                        {clase.hora}
                                      </div>
                                    </div>
                                  </motion.div>
                                ) : (
                                  <div className="h-full min-h-[120px] flex items-center justify-center">
                                    <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Leyenda */}
              <div className="flex items-center justify-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-gradient-to-br from-blue-500 to-blue-600 rounded"></div>
                  <span className="text-slate-600 dark:text-slate-400">Clase asignada</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-white dark:bg-slate-900 border-2 border-slate-300 dark:border-slate-600 rounded"></div>
                  <span className="text-slate-600 dark:text-slate-400">Hora libre</span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowHorarioDocenteModal(false)} className="bg-blue-600 hover:bg-blue-700">
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  );
}
