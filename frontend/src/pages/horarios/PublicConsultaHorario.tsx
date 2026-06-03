import { Button } from '../../share/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { SearchableSelect } from '../../share/searchableSelect';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../share/dialog';
import { Download, Calendar, FileSpreadsheet, Eye, Clock, MapPin, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Badge } from '../../share/badge';
import { Toaster } from '../../share/sonner';
import { motion } from 'motion/react';
import { useConsultaHorario } from '../../hooks/horarios/useConsultaHorario';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useState, useEffect } from 'react';
import { PAGE_SIZE_DEFAULT, getPageNumbers, getTotalPages, getPageSlice, hasPrevPageWindow, hasNextPageWindow, getTargetPageForPrevWindow, getTargetPageForNextWindow } from '../../hooks/gestionAcademica/paginacion';

export default function PublicConsultaHorario() {
  const isMobile = useIsMobile();
  const [currentPageDocente, setCurrentPageDocente] = useState(1);
  const [currentPagePrograma, setCurrentPagePrograma] = useState(1);
  const pageSize = PAGE_SIZE_DEFAULT;

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

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPageDocente(1);
  }, [filtroDocente]);

  useEffect(() => {
    setCurrentPagePrograma(1);
  }, [filtroPrograma]);

  useEffect(() => {
    setCurrentPageDocente(1);
    setCurrentPagePrograma(1);
  }, [tipoConsulta]);

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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }, {} as Record<string, { docente: string; facultad?: string; horarios: any[] }>);

      const docentesListaAgrupada = Object.values(docentesAgrupados);
      const totalDocentes = docentesListaAgrupada.length;
      const totalPagesDocente = getTotalPages(totalDocentes, pageSize);
      const paginatedDocentes = getPageSlice(docentesListaAgrupada, currentPageDocente, pageSize);
      const pageNumbersDocente = getPageNumbers(totalPagesDocente, currentPageDocente);

      const goToPageDocente = (page: number) => setCurrentPageDocente(page);
      const goToPrevPageDocente = () => setCurrentPageDocente(p => Math.max(1, p - 1));
      const goToNextPageDocente = () => setCurrentPageDocente(p => Math.min(totalPagesDocente, p + 1));
      const goToPrevPageWindowDocente = () => {
        const target = getTargetPageForPrevWindow(currentPageDocente, totalPagesDocente);
        if (target) setCurrentPageDocente(target);
      };
      const goToNextPageWindowDocente = () => {
        const target = getTargetPageForNextWindow(currentPageDocente, totalPagesDocente);
        if (target) setCurrentPageDocente(target);
      };

      return (
        <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Docente</CardTitle>
              <div className="w-[340px]">
                <SearchableSelect
                  items={docentes}
                  value={filtroDocente}
                  onSelect={(docente) => setFiltroDocente(docente.nombre)}
                  getItemId={(docente) => docente.nombre}
                  getItemLabel={(docente) => docente.nombre}
                  getItemSecondary={(docente) => docente.correo}
                  placeholder="Seleccionar docente..."
                  searchPlaceholder="Buscar docente..."
                  emptyMessage="No se encontró ningún docente"
                  clearable
                  onClear={() => setFiltroDocente('Todos')}
                />
              </div>
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
                    {paginatedDocentes.map((item) => (
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
            {/* Pagination Docentes */}
            {totalDocentes > pageSize && (
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                <div className="text-sm text-slate-600 dark:text-slate-400">
                  Mostrando {Math.min((currentPageDocente - 1) * pageSize + 1, totalDocentes)} - {Math.min(currentPageDocente * pageSize, totalDocentes)} de {totalDocentes} docentes
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPageDocente}
                    disabled={currentPageDocente <= 1}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Anterior
                  </Button>
                  {hasPrevPageWindow(currentPageDocente, totalPagesDocente) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToPrevPageWindowDocente}
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                  )}
                  {pageNumbersDocente.map((pageNumber) => (
                    <Button
                      key={pageNumber}
                      variant={pageNumber === currentPageDocente ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => goToPageDocente(pageNumber)}
                      className={pageNumber === currentPageDocente ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                    >
                      {pageNumber}
                    </Button>
                  ))}
                  {hasNextPageWindow(currentPageDocente, totalPagesDocente) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={goToNextPageWindowDocente}
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPageDocente}
                    disabled={currentPageDocente >= totalPagesDocente}
                  >
                    Siguiente
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, {} as Record<string, { programa?: string; grupo: string; horarios: any[] }>);

    const gruposAgrupados = Object.values(horariosAgrupados);
    const totalGrupos = gruposAgrupados.length;
    const totalPagesPrograma = getTotalPages(totalGrupos, pageSize);
    const paginatedGrupos = getPageSlice(gruposAgrupados, currentPagePrograma, pageSize);
    const pageNumbersPrograma = getPageNumbers(totalPagesPrograma, currentPagePrograma);

    const goToPagePrograma = (page: number) => setCurrentPagePrograma(page);
    const goToPrevPagePrograma = () => setCurrentPagePrograma(p => Math.max(1, p - 1));
    const goToNextPagePrograma = () => setCurrentPagePrograma(p => Math.min(totalPagesPrograma, p + 1));
    const goToPrevPageWindowPrograma = () => {
      const target = getTargetPageForPrevWindow(currentPagePrograma, totalPagesPrograma);
      if (target) setCurrentPagePrograma(target);
    };
    const goToNextPageWindowPrograma = () => {
      const target = getTargetPageForNextWindow(currentPagePrograma, totalPagesPrograma);
      if (target) setCurrentPagePrograma(target);
    };

    return (
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-slate-900 dark:text-slate-100">Horarios por Programa</CardTitle>
            <div className="w-[340px]">
              <SearchableSelect
                items={programas.map((prog, index) => ({ id: index, nombre: prog }))}
                value={filtroPrograma === 'Todos' ? null : filtroPrograma}
                onSelect={(item) => setFiltroPrograma(item.nombre)}
                getItemId={(item) => item.nombre}
                getItemLabel={(item) => item.nombre}
                placeholder="Seleccionar programa..."
                searchPlaceholder="Buscar programa..."
                emptyMessage="No se encontró ningún programa"
                clearable
                onClear={() => setFiltroPrograma('Todos')}
              />
            </div>
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
                  {paginatedGrupos.map((grupo) => (
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
          {/* Pagination Programas */}
          {totalGrupos > pageSize && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                Mostrando {Math.min((currentPagePrograma - 1) * pageSize + 1, totalGrupos)} - {Math.min(currentPagePrograma * pageSize, totalGrupos)} de {totalGrupos} grupos
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPagePrograma}
                  disabled={currentPagePrograma <= 1}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Anterior
                </Button>
                {hasPrevPageWindow(currentPagePrograma, totalPagesPrograma) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToPrevPageWindowPrograma}
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </Button>
                )}
                {pageNumbersPrograma.map((pageNumber) => (
                  <Button
                    key={pageNumber}
                    variant={pageNumber === currentPagePrograma ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => goToPagePrograma(pageNumber)}
                    className={pageNumber === currentPagePrograma ? 'bg-blue-600 hover:bg-blue-700 text-white' : ''}
                  >
                    {pageNumber}
                  </Button>
                ))}
                {hasNextPageWindow(currentPagePrograma, totalPagesPrograma) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={goToNextPageWindowPrograma}
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPagePrograma}
                  disabled={currentPagePrograma >= totalPagesPrograma}
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6 overflow-y-auto max-h-screen`}>
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
