
import type { useMisPendientesFuncionario } from '../../../hooks/funcionario/useMisPendientesFuncionario';

type Gestion = ReturnType<typeof useMisPendientesFuncionario>;

/** Indicador mientras se carga el detalle. */
export function CargandoDetallePendientes({ openDetail, detailLoading }: Pick<Gestion, 'openDetail' | 'detailLoading'>) {
  return (
    <>
      {openDetail && detailLoading && (
        <div className="text-sm text-slate-500">Cargando detalles completos de la factura...</div>
      )}
    </>
  );
}
