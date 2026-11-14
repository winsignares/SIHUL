import { Button } from '../../../components/ui/button';
import { Calendar, Plus, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { NotificationBanner } from '../../../components/ui/notificationBanner';
import { useCrearHorarios } from '../hooks/useCrearHorarios';
import { FiltrosGruposSinHorario } from '../components/crearHorarios/FiltrosGruposSinHorario';
import { TablaGruposSinHorario } from '../components/crearHorarios/TablaGruposSinHorario';
import { GrillaSemanalHorario } from '../components/crearHorarios/GrillaSemanalHorario';
import { ListaAsignaturasAsignadas } from '../components/crearHorarios/ListaAsignaturasAsignadas';
import { ModalAsignarAsignatura } from '../components/crearHorarios/ModalAsignarAsignatura';
import { AvisoCambios } from '../../../components/common/AvisoCambios';

interface CrearHorariosProps {
  onHorarioCreado?: () => void;
}

export default function CrearHorarios({ onHorarioCreado }: CrearHorariosProps = {}) {
  const {
    loading,
    facultades,
    docentes,
    filtroFacultad, setFiltroFacultad,
    filtroPrograma, setFiltroPrograma,
    filtroSemestre, setFiltroSemestre,
    filtroGrupo, setFiltroGrupo,
    filtroPeriodo, setFiltroPeriodo,
    filtroAsignatura, setFiltroAsignatura,
    filtroDocente, setFiltroDocente,
    filtroEspacio, setFiltroEspacio,
    filtroDia, setFiltroDia,
    vistaActual,
    grupoSeleccionado,
    horariosAsignados,
    showModalAsignar, setShowModalAsignar,
    asignaturaSeleccionada, setAsignaturaSeleccionada,
    docenteSeleccionado, setDocenteSeleccionado,
    espacioSeleccionado, setEspacioSeleccionado,
    cantidadEstudiantes, setCantidadEstudiantes,
    diasSeleccionados,
    horasPorDia,
    handleAsignarHorario,
    handleVolverALista,
    handleAbrirModalAsignar,
    handleToggleDia,
    handleHoraChange,
    handleGuardarAsignacion,
    handleEliminarHorarioAsignado,
    handleMoverHorario,
    limpiarFiltros,
    loadData,
    gruposSinHorarioFiltrados,
    paginatedGrupos,
    programasFiltrados,
    gruposFiltroDisponibles,
    periodosDisponibles,
    asignaturasFiltroDisponibles,
    docentesFiltroDisponibles,
    espaciosFiltroDisponibles,
    diasFiltroDisponibles,
    // Paginación
    currentPage,
    totalPages,
    goToPage,
    goToNextPage,
    goToPrevPage,
    getAsignaturasByProgramaYSemestre,
    getEspaciosDisponibles,
    diasSemana,
    semestres,
    horas,
    obtenerClaseEnHora,
    notification,
    role,
    avisoCambios,
  } = useCrearHorarios({ onHorarioCreado });

  // Obtener asignaturas filtradas por programa y semestre del grupo seleccionado
  const asignaturasFiltradas = (grupoSeleccionado?.programa_id && grupoSeleccionado?.semestre)
    ? getAsignaturasByProgramaYSemestre(grupoSeleccionado.programa_id, grupoSeleccionado.semestre)
    : [];

  // Obtener espacios disponibles según la cantidad de estudiantes
  const espaciosDisponibles = getEspaciosDisponibles(cantidadEstudiantes as number);


  // VISTA LISTA DE GRUPOS SIN HORARIO
  if (vistaActual === 'lista') {
    return (
      <div className="p-6 space-y-6">
        <NotificationBanner notification={notification} />
        {/* Encabezado */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-slate-900">Crear Horarios</h2>
          <p className="text-slate-600 mt-1">Crear y gestionar horarios académicos por grupo</p>
        </motion.div>

        {/* Filtros */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <FiltrosGruposSinHorario
            facultades={facultades}
            filtroFacultad={filtroFacultad} setFiltroFacultad={setFiltroFacultad}
            filtroPrograma={filtroPrograma} setFiltroPrograma={setFiltroPrograma}
            filtroSemestre={filtroSemestre} setFiltroSemestre={setFiltroSemestre}
            filtroGrupo={filtroGrupo} setFiltroGrupo={setFiltroGrupo}
            filtroPeriodo={filtroPeriodo} setFiltroPeriodo={setFiltroPeriodo}
            filtroAsignatura={filtroAsignatura} setFiltroAsignatura={setFiltroAsignatura}
            filtroDocente={filtroDocente} setFiltroDocente={setFiltroDocente}
            filtroEspacio={filtroEspacio} setFiltroEspacio={setFiltroEspacio}
            filtroDia={filtroDia} setFiltroDia={setFiltroDia}
            limpiarFiltros={limpiarFiltros}
            loadData={loadData}
            programasFiltrados={programasFiltrados}
            gruposFiltroDisponibles={gruposFiltroDisponibles}
            periodosDisponibles={periodosDisponibles}
            asignaturasFiltroDisponibles={asignaturasFiltroDisponibles}
            docentesFiltroDisponibles={docentesFiltroDisponibles}
            espaciosFiltroDisponibles={espaciosFiltroDisponibles}
            diasFiltroDisponibles={diasFiltroDisponibles}
            semestres={semestres}
          />
        </motion.div>

        {/* Tabla de grupos sin horarios */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <TablaGruposSinHorario
            loading={loading}
            gruposSinHorarioFiltrados={gruposSinHorarioFiltrados}
            paginatedGrupos={paginatedGrupos}
            handleAsignarHorario={handleAsignarHorario}
            currentPage={currentPage}
            totalPages={totalPages}
            goToPage={goToPage}
            goToNextPage={goToNextPage}
            goToPrevPage={goToPrevPage}
          />
        </motion.div>
      </div>
    );
  }

  // VISTA DE ASIGNACIÓN DE HORARIOS
  return (
    <div className="h-full flex flex-col">
      <div className="px-6 pt-4 empty:hidden"><AvisoCambios {...avisoCambios} /></div>
      <NotificationBanner notification={notification} />
      {/* Header fijo - NO scrolleable */}
      <div className="bg-white border-b border-slate-200 shadow-sm p-6 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-slate-900">Horario del Grupo — {grupoSeleccionado?.nombre}</h2>
            <p className="text-slate-600 mt-1">
              {grupoSeleccionado?.programa_nombre} • Semestre {grupoSeleccionado?.semestre}
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleAbrirModalAsignar}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              {role?.nombre === 'admin' ? 'Añadir Espacio' : 'Solicitar Espacio'}
            </Button>
            <Button
              variant="outline"
              onClick={handleVolverALista}
              className="border-slate-300"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Button>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable */}
      <div className="flex-1 overflow-y-auto p-6">
        {horariosAsignados.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Calendar className="w-20 h-20 text-slate-300 mb-4" />
            <h3 className="text-slate-700 mb-2">No hay asignaturas asignadas</h3>
            <p className="text-slate-500 mb-6">Comienza asignando la primera asignatura a este grupo</p>
            <Button
              onClick={handleAbrirModalAsignar}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Plus className="w-4 h-4 mr-2" />
              Asignar Primera Asignatura
            </Button>
          </motion.div>
        ) : (
          <div className="space-y-6">
            {/* Grid semanal mejorado */}
            <GrillaSemanalHorario
              diasSemana={diasSemana}
              horas={horas}
              obtenerClaseEnHora={obtenerClaseEnHora}
              handleMoverHorario={handleMoverHorario}
              handleEliminarHorarioAsignado={handleEliminarHorarioAsignado}
            />

            {/* Lista de asignaturas */}
            <ListaAsignaturasAsignadas
              horariosAsignados={horariosAsignados}
              handleEliminarHorarioAsignado={handleEliminarHorarioAsignado}
            />
          </div>
        )}
      </div>

      {/* Modal de Asignar Asignatura */}
      <ModalAsignarAsignatura
        showModalAsignar={showModalAsignar} setShowModalAsignar={setShowModalAsignar}
        role={role} grupoSeleccionado={grupoSeleccionado}
        asignaturaSeleccionada={asignaturaSeleccionada} setAsignaturaSeleccionada={setAsignaturaSeleccionada}
        cantidadEstudiantes={cantidadEstudiantes} setCantidadEstudiantes={setCantidadEstudiantes}
        docentes={docentes} docenteSeleccionado={docenteSeleccionado} setDocenteSeleccionado={setDocenteSeleccionado}
        espacioSeleccionado={espacioSeleccionado} setEspacioSeleccionado={setEspacioSeleccionado}
        diasSemana={diasSemana} diasSeleccionados={diasSeleccionados} handleToggleDia={handleToggleDia}
        horasPorDia={horasPorDia} handleHoraChange={handleHoraChange} handleGuardarAsignacion={handleGuardarAsignacion}
        asignaturasFiltradas={asignaturasFiltradas} espaciosDisponibles={espaciosDisponibles}
      />
    </div>
  );
}
