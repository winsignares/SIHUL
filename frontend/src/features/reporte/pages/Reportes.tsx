import { Button } from '../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Download, Calendar, FileSpreadsheet } from 'lucide-react';
import { Toaster } from '../../../components/ui/sonner';
import { motion } from 'motion/react';
import { useReportes } from '../hooks/useReportes';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { ReporteOcupacion } from '../components/reportes/ReporteOcupacion';
import { ReporteHorariosDocente } from '../components/reportes/ReporteHorariosDocente';
import { ReporteHorariosPrograma } from '../components/reportes/ReporteHorariosPrograma';
import { ReporteDisponibilidad } from '../components/reportes/ReporteDisponibilidad';
import { ReporteCapacidad } from '../components/reportes/ReporteCapacidad';
import { ModalHorarioGrupo } from '../components/reportes/ModalHorarioGrupo';
import { ModalHorarioDocente } from '../components/reportes/ModalHorarioDocente';

export default function Reportes() {
  const isMobile = useIsMobile();
  const reportes = useReportes();
  const {
    periodoActual,
    tipoReporte,
    setTipoReporte,
    estadoReporte,
    setEstadoReporte,
    estadosReporte,
    reportesDisponibles,
    exportarPDF,
    exportarExcel
  } = reportes;

  const renderReporteContent = () => {
    switch (tipoReporte) {
      case 'ocupacion':
        return <ReporteOcupacion {...reportes} isMobile={isMobile} />;

      case 'horarios-docente':
        return <ReporteHorariosDocente {...reportes} />;

      case 'horarios-programa':
        return <ReporteHorariosPrograma {...reportes} />;

      case 'disponibilidad':
        return <ReporteDisponibilidad {...reportes} />;

      case 'capacidad':
        return <ReporteCapacidad {...reportes} />;

      default:
        return null;
    }
  };

  return (
    <div className={`${isMobile ? 'p-4' : 'p-8'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Reportes y Estadísticas</h1>
          <p className="text-slate-600 dark:text-slate-400">Genera reportes personalizados del sistema horarios y estadisticas</p>
        </div>
        <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-950/30 px-4 py-2 rounded-lg border border-blue-200 dark:border-blue-800">
          <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          <span className="text-blue-900 dark:text-blue-100"><strong>{periodoActual}</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={tipoReporte} onValueChange={setTipoReporte}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Tipo de reporte" />
          </SelectTrigger>
          <SelectContent>
            {reportesDisponibles.map(reporte => (
              <SelectItem key={reporte.id} value={reporte.id}>
                {reporte.nombre}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={estadoReporte} onValueChange={(value) => setEstadoReporte(value as typeof estadoReporte)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            {estadosReporte.map(estado => (
              <SelectItem key={estado.id} value={estado.id}>
                {estado.nombre}
              </SelectItem>
            ))}
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

      {/* Main Report View */}
      <motion.div
        key={`${tipoReporte}-${estadoReporte}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {renderReporteContent()}
      </motion.div>

      {/* Modal de Horario por Grupo */}
      <ModalHorarioGrupo {...reportes} />

      {/* Modal de Horario por Docente */}
      <ModalHorarioDocente {...reportes} />

      <Toaster />
    </div>
  );
}
