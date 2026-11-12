import { Button } from '../../../components/ui/button';
import { Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { useDashboardHome } from '../hooks/useDashboardHome';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { TarjetasEstadisticas } from '../components/dashboardHome/TarjetasEstadisticas';
import { EspaciosMasOcupados } from '../components/dashboardHome/EspaciosMasOcupados';
import { ActividadReciente } from '../components/dashboardHome/ActividadReciente';
import { AccesosRapidos } from '../components/dashboardHome/AccesosRapidos';
import { ModalGenerarReporte } from '../components/dashboardHome/ModalGenerarReporte';
import { ModalDetalleOcupacion } from '../components/dashboardHome/ModalDetalleOcupacion';
import { ModalActividades } from '../components/dashboardHome/ModalActividades';

export default function DashboardHome() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const {
    stats,
    recentActivities,
    activities,
    topEspaciosOcupados,
    periodoActivo,
    state,
    setters,
    handlers
  } = useDashboardHome();

  const {
    showReportModal,
    isGeneratingReport,
    reportGenerated,
    showOccupationDetails,
    showAllActivities,
    isLoadingOccupation,
    isLoadingActivities,
    isLoadingPeriodo
  } = state;

  const {
    setShowReportModal,
    setShowOccupationDetails,
    setShowAllActivities
  } = setters;

  const {
    handleGenerateReport
  } = handlers;

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      {/* Header */}
      <motion.div
        className={`${isMobile ? 'flex flex-col gap-4' : 'flex items-center justify-between'}`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className={`text-slate-900 mb-2 ${isMobile ? 'text-xl' : 'text-2xl'}`}>Bienvenido de nuevo! 👋</h1>
          <p className={`text-slate-600 ${isMobile ? 'text-sm' : ''}`}>Aquí está el resumen de tu gestión académica</p>
        </div>
        <div className={`flex gap-3 ${isMobile ? 'w-full' : ''}`}>
          <Button
            variant="outline"
            className={`border-slate-300 hover:border-red-500 hover:text-red-600 ${isMobile ? 'flex-1 text-sm' : ''}`}
            disabled={isLoadingPeriodo}
          >
            <Calendar className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
            {isLoadingPeriodo ? 'Cargando...' : periodoActivo ? `Período ${periodoActivo.nombre}` : 'Sin período activo'}
          </Button>

        </div>
      </motion.div>

      {/* Stats Cards */}
      <TarjetasEstadisticas stats={stats} isMobile={isMobile} />

      {/* Grid de 2 columnas - SIN panel de perfil */}
      <div className={`grid gap-6 ${isMobile ? 'grid-cols-1' : 'lg:grid-cols-2'}`}>
        {/* Espacios Más Ocupados */}
        <EspaciosMasOcupados
          topEspaciosOcupados={topEspaciosOcupados}
          isLoadingOccupation={isLoadingOccupation}
          setShowOccupationDetails={setShowOccupationDetails}
        />

        {/* Actividad Reciente */}
        <ActividadReciente
          recentActivities={recentActivities}
          isLoadingActivities={isLoadingActivities}
          setShowAllActivities={setShowAllActivities}
        />
      </div>

      {/* Quick Actions */}
      <AccesosRapidos navigate={navigate} />

      {/* Modal: Generar Reporte */}
      <ModalGenerarReporte
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        isGeneratingReport={isGeneratingReport}
        reportGenerated={reportGenerated}
        handleGenerateReport={handleGenerateReport}
      />

      {/* Modal: Detalles de Espacios Ocupados */}
      <ModalDetalleOcupacion
        showOccupationDetails={showOccupationDetails}
        setShowOccupationDetails={setShowOccupationDetails}
        topEspaciosOcupados={topEspaciosOcupados}
      />

      {/* Modal: Ver Todas las Actividades */}
      <ModalActividades
        showAllActivities={showAllActivities}
        setShowAllActivities={setShowAllActivities}
        activities={activities}
      />
    </div>
  );
}
