
import type { useConsultaEspaciosPagina } from '../../hooks/useConsultaEspaciosPagina';

type Gestion = ReturnType<typeof useConsultaEspaciosPagina>;

/** Título de la página de disponibilidad. */
export function EncabezadoConsulta({ isMobile, espacioSeleccionado }: Pick<Gestion, 'isMobile' | 'espacioSeleccionado'>) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className={`text-slate-900 dark:text-slate-100 mb-2 ${isMobile ? 'text-xl' : ''}`}>
          {espacioSeleccionado ? `Cronograma: ${espacioSeleccionado.nombre}` : 'Disponibilidad de Espacios'}
        </h1>
        <p className={`text-slate-600 dark:text-slate-400 ${isMobile ? 'text-sm' : ''}`}>
          {espacioSeleccionado 
            ? 'Vista individual del espacio seleccionado'
            : 'Consulta la disponibilidad de aulas, laboratorios y espacios'}
        </p>
      </div>
    </div>
  );
}
