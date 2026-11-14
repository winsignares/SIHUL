import { Bell } from 'lucide-react';
import type { useConsultarFacturas } from '../../../hooks/funcionario/useConsultarFacturas';

type Gestion = ReturnType<typeof useConsultarFacturas>;

/** Aviso de facturas que cambiaron de estado. */
export function AvisoCambiosEstado({ estadoChanges }: Pick<Gestion, 'estadoChanges'>) {
  return (
    <>
      {estadoChanges.length > 0 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-900 flex items-start gap-3">
          <Bell className="w-4 h-4 mt-0.5" />
          <div>
            <p className="font-semibold">Actualización de etapas detectada</p>
            <p>
              {estadoChanges[0].numeroFactura} pasó de {estadoChanges[0].estadoAnterior} a {estadoChanges[0].estadoNuevo}
              {estadoChanges.length > 1 ? ` y ${estadoChanges.length - 1} factura(s) más.` : '.'}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
