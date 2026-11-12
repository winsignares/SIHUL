import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Button } from '../../../components/ui/button';
import {
  Edit,
  Eye,
  List,
  Plus,
  FileDown,
  FileSpreadsheet
} from 'lucide-react';
import CrearHorarios from './CrearHorarios';
import HorariosFusionados from './HorariosFusionados';
import { NotificationBanner } from '../../../components/ui/notificationBanner';
import { useCentroHorarios } from '../hooks/useCentroHorarios';
import { useIsMobile } from '../../../hooks/useIsMobile';

import { ConsultaHorariosTab } from '../components/centroHorarios/ConsultaHorariosTab';
import { ModificacionHorariosTab } from '../components/centroHorarios/ModificacionHorariosTab';
import { HorariosModales } from '../components/centroHorarios/HorariosModales';
export default function CentroHorarios() {
  const isMobile = useIsMobile();
  const hook = useCentroHorarios();
  const {
    activeTab, setActiveTab,
    loading,
    facultades,
    loadData,
    // Paginación
    handleDescargarPDF,
    handleDescargarExcel,
    notification,
    // Filtros de horarios fusionados
    filtroFusionadoFacultad, setFiltroFusionadoFacultad,
    filtroFusionadoPrograma, setFiltroFusionadoPrograma,
    filtroFusionadoGrupo, setFiltroFusionadoGrupo,
    filtroFusionadoSemestre, setFiltroFusionadoSemestre,
    filtroFusionadoDia, setFiltroFusionadoDia,
    filtroFusionadoAsignatura, setFiltroFusionadoAsignatura,
    filtroFusionadoDocente, setFiltroFusionadoDocente,
    filtroFusionadoEspacio, setFiltroFusionadoEspacio,
    filtroFusionadoPeriodo, setFiltroFusionadoPeriodo,
    gruposFusionadosUnicos,
    semestresFusionadosUnicos,
    programasFusionadosFiltrados,
    diasFusionadosUnicos,
    asignaturasFusionadasUnicas,
    docentesFusionadosDisponibles,
    espaciosFusionadosDisponibles,
    periodosFusionadosDisponibles,
    horariosFusionadosFiltrados,
    limpiarFiltrosFusionados
  } = hook;

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      <NotificationBanner notification={notification} />
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-900 mb-2">Centro de Horarios</h1>
          <p className="text-slate-600">Consulta, modifica y elimina horarios académicos</p>
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
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="grid w-full max-w-4xl grid-cols-4">
          <TabsTrigger value="crear">
            <Plus className="w-4 h-4 mr-2" />
            Crear Horarios
          </TabsTrigger>
          <TabsTrigger value="modificacion">
            <Edit className="w-4 h-4 mr-2" />
            Modificación
          </TabsTrigger>
          <TabsTrigger value="consulta">
            <Eye className="w-4 h-4 mr-2" />
            Consulta de Horarios
          </TabsTrigger>
          <TabsTrigger value="fusionados">
            <List className="w-4 h-4 mr-2" />
            Horarios Fusionados
          </TabsTrigger>
        </TabsList>

        {/* Tab: Consulta de Horarios */}
        <ConsultaHorariosTab hook={hook} />

        {/* Tab: Crear Horarios */}
        <TabsContent value="crear" className="space-y-6">
          <CrearHorarios onHorarioCreado={loadData} />
        </TabsContent>

        {/* Tab: Modificación */}
        <ModificacionHorariosTab hook={hook} />

        {/* Tab de Horarios Fusionados */}
        <TabsContent value="fusionados" className="space-y-4">
          <HorariosFusionados 
            horariosFusionados={horariosFusionadosFiltrados}
            loading={loading}
            facultades={facultades}
            filtroFusionadoFacultad={filtroFusionadoFacultad}
            setFiltroFusionadoFacultad={setFiltroFusionadoFacultad}
            filtroFusionadoPrograma={filtroFusionadoPrograma}
            setFiltroFusionadoPrograma={setFiltroFusionadoPrograma}
            filtroFusionadoGrupo={filtroFusionadoGrupo}
            setFiltroFusionadoGrupo={setFiltroFusionadoGrupo}
            filtroFusionadoSemestre={filtroFusionadoSemestre}
            setFiltroFusionadoSemestre={setFiltroFusionadoSemestre}
            filtroFusionadoDia={filtroFusionadoDia}
            setFiltroFusionadoDia={setFiltroFusionadoDia}
            filtroFusionadoAsignatura={filtroFusionadoAsignatura}
            setFiltroFusionadoAsignatura={setFiltroFusionadoAsignatura}
            filtroFusionadoDocente={filtroFusionadoDocente}
            setFiltroFusionadoDocente={setFiltroFusionadoDocente}
            filtroFusionadoEspacio={filtroFusionadoEspacio}
            setFiltroFusionadoEspacio={setFiltroFusionadoEspacio}
            filtroFusionadoPeriodo={filtroFusionadoPeriodo}
            setFiltroFusionadoPeriodo={setFiltroFusionadoPeriodo}
            programasFusionadosFiltrados={programasFusionadosFiltrados}
            gruposFusionadosUnicos={gruposFusionadosUnicos}
            semestresFusionadosUnicos={semestresFusionadosUnicos}
            diasFusionadosUnicos={diasFusionadosUnicos}
            asignaturasFusionadasUnicas={asignaturasFusionadasUnicas}
            docentesFusionadosDisponibles={docentesFusionadosDisponibles}
            espaciosFusionadosDisponibles={espaciosFusionadosDisponibles}
            periodosFusionadosDisponibles={periodosFusionadosDisponibles}
            limpiarFiltrosFusionados={limpiarFiltrosFusionados}
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Detalles */}
      <HorariosModales hook={hook} />
    </div>
  );
}
