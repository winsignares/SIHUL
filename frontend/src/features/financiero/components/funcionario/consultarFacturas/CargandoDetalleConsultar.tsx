
import type { useConsultarFacturas } from '../../../hooks/funcionario/useConsultarFacturas';

type Gestion = ReturnType<typeof useConsultarFacturas>;

/** Indicador mientras se carga el detalle. */
export function CargandoDetalleConsultar({ detailLoading }: Pick<Gestion, 'detailLoading'>) {
  return (
    <>
      {detailLoading && (
        <div className="fixed inset-0 z-[110] bg-black/20 backdrop-blur-[1px] flex items-center justify-center">
          <div className="bg-white border border-slate-200 rounded-xl px-5 py-3 text-slate-700 text-sm shadow-lg">
            Cargando detalle y timeline de la factura...
          </div>
        </div>
      )}
    </>
  );
}
