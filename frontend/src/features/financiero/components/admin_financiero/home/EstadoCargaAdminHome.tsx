import { Card, CardContent } from '../../../../../components/ui/card';
import { Loader2 } from 'lucide-react';
import type { useAdminFinancieroHome } from '../../../hooks/admin_financiero/useAdminFinancieroHome';

type Gestion = ReturnType<typeof useAdminFinancieroHome>;

/** Indicador de carga y mensaje de error. */
export function EstadoCargaAdminHome({ loading, error }: Pick<Gestion, 'loading' | 'error'>) {
  return (
    <>
      {loading && (
        <Card>
          <CardContent className="flex items-center gap-3 p-6 text-slate-600">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando panel...
          </CardContent>
        </Card>
      )}
      {error && <Card><CardContent className="p-6 text-red-600">{error}</CardContent></Card>}
    </>
  );
}
