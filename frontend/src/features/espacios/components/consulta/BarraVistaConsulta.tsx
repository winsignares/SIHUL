import { Button } from '../../../../components/ui/button';
import { Grid3x3, ArrowLeft, RefreshCw, FileDown, FileSpreadsheet } from 'lucide-react';
import type { useConsultaEspaciosPagina } from '../../hooks/useConsultaEspaciosPagina';

type Gestion = ReturnType<typeof useConsultaEspaciosPagina>;

/** Botones de vista, exportación y recarga. */
export function BarraVistaConsulta({ isMobile, vistaActual, setVistaActual, exportarCronogramaPDF, exportarCronogramaExcel, espacioSeleccionado, volverALista, loading, recargarDisponibilidad }: Pick<Gestion, 'isMobile' | 'vistaActual' | 'setVistaActual' | 'exportarCronogramaPDF' | 'exportarCronogramaExcel' | 'espacioSeleccionado' | 'volverALista' | 'loading' | 'recargarDisponibilidad'>) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
      <div className="flex gap-2 w-full sm:w-auto">
        {!espacioSeleccionado && (
          <>
            <Button
              variant={vistaActual === 'tarjetas' ? 'default' : 'outline'}
              onClick={() => setVistaActual('tarjetas')}
              className={`flex-1 sm:flex-none ${vistaActual === 'tarjetas'
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white'
                : 'border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950'
              } ${isMobile ? 'text-sm py-2 h-auto' : ''}`}
            >
              <Grid3x3 className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
              {isMobile ? 'Tarjetas' : 'Vista Tarjetas'}
            </Button>
          </>
        )}
      </div>
      <div className="flex gap-2 w-full sm:w-auto">
        {vistaActual === 'cronograma' && (
          <>
            <Button
              onClick={() => exportarCronogramaPDF(espacioSeleccionado ? [espacioSeleccionado] : undefined)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <FileDown className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
              {isMobile ? 'PDF' : 'Exportar PDF'}
            </Button>
            <Button
              onClick={() => exportarCronogramaExcel(espacioSeleccionado ? [espacioSeleccionado] : undefined)}
              className="flex-1 sm:flex-none bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white"
            >
              <FileSpreadsheet className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
              {isMobile ? 'Excel' : 'Exportar Excel'}
            </Button>
          </>
        )}
        <Button
          onClick={recargarDisponibilidad}
          variant="outline"
          className="flex-1 sm:flex-none border-purple-600 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950"
          title="Limpiar caché y recargar datos"
          disabled={loading}
        >
          <RefreshCw className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Recargando...' : isMobile ? 'Recargar' : 'Recargar Datos'}
        </Button>
        {espacioSeleccionado && (
          <Button
            variant="outline"
            onClick={volverALista}
            className="flex-1 sm:flex-none border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            <ArrowLeft className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} mr-2`} />
            {isMobile ? 'Volver' : 'Volver a la lista'}
          </Button>
        )}
      </div>
    </div>
  );
}
