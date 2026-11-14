import { useEffect, useState } from 'react';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Eye, Search, ArrowLeft } from 'lucide-react';
import { Toaster } from '../../../components/ui/sonner';
import { toast } from 'sonner';
import { useDocentePrestamos } from '../hooks/useDocentePrestamos';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { useAuth } from '../../../context/AuthContext';
import { isSpaceSupervisorRole } from '../../../context/spaceSupervisorRole';
import ConsultaEspacios from '../../espacios/pages/ConsultaEspacios';
import { DialogoNuevaSolicitud } from '../components/docentePrestamos/DialogoNuevaSolicitud';
import { EstadisticasPrestamos } from '../components/docentePrestamos/EstadisticasPrestamos';
import { TablaPrestamos } from '../components/docentePrestamos/TablaPrestamos';
import { PaginacionPrestamos } from '../components/docentePrestamos/PaginacionPrestamos';
import { DialogoDetallePrestamo } from '../components/docentePrestamos/DialogoDetallePrestamo';

export default function DocentePrestamos() {
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const [mostrarConsulta, setMostrarConsulta] = useState(false);
  const docentePrestamos = useDocentePrestamos();
  const { searchTerm, setSearchTerm, filterEstado, setFilterEstado, estadisticas, error } = docentePrestamos;

  // Mostrar error con toast cuando cambie
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Si está mostrando consulta de espacios, renderizar ese componente
  if (mostrarConsulta) {
    return (
      <div>
        {!isSpaceSupervisorRole(user?.rol) && (
          <div className="p-6 pb-0">
            <Button
              variant="outline"
              onClick={() => setMostrarConsulta(false)}
              className="mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Mis Préstamos
            </Button>
          </div>
        )}
        <ConsultaEspacios />
      </div>
    );
  }

  return (
    <div className={`${isMobile ? 'p-4' : 'p-6'} space-y-6`}>
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Préstamos de Espacios</h1>
          <p className="text-slate-600 dark:text-slate-400">Solicita espacios para clases adicionales, tutorías y eventos académicos</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setMostrarConsulta(true)}
            className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <Eye className="w-4 h-4 mr-2" />
            Consultar Disponibilidad
          </Button>
          <DialogoNuevaSolicitud {...docentePrestamos} />
        </div>
      </div>

      {/* Statistics */}
      <EstadisticasPrestamos estadisticas={estadisticas} isMobile={isMobile} />

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            id="buscar-prestamos"
            aria-label="Buscar préstamos"
            placeholder="Buscar por espacio, tipo de actividad o motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterEstado} onValueChange={setFilterEstado}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="aprobado">Aprobadas</SelectItem>
            <SelectItem value="rechazado">Rechazadas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Préstamos Table */}
      <TablaPrestamos {...docentePrestamos} />

      <PaginacionPrestamos {...docentePrestamos} />

      {/* Dialog de Detalles del Préstamo */}
      <DialogoDetallePrestamo {...docentePrestamos} />

      <Toaster />
    </div>
  );
}
