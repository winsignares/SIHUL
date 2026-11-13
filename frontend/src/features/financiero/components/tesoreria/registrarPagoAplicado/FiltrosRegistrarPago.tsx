import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../../components/ui/card';
import TableFilters from '../../../../../components/ui/table-filters';
import { ORDER_OPTIONS } from '../../../hooks/tesoreria/registrarPagoAplicadoUtils';
import type { useRegistrarPagoAplicado } from '../../../hooks/tesoreria/useRegistrarPagoAplicado';

type Gestion = ReturnType<typeof useRegistrarPagoAplicado>;

/** Filtros y orden de los pagos confirmados. */
export function FiltrosRegistrarPago({ filtros, setFiltros, proveedores, areas }: Pick<Gestion, 'filtros' | 'setFiltros' | 'proveedores' | 'areas'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="text-slate-800">Filtros y orden de registro</CardTitle>
        <CardDescription>Consulta pagos confirmados por Dirección Financiera y prioriza los más antiguos o los de mayor criticidad.</CardDescription>
      </CardHeader>
      <CardContent>
        <TableFilters
          filters={filtros}
          onFilterChange={(updated) => setFiltros(updated)}
          proveedores={proveedores}
          areas={areas}
          showFechaFilter
          showAreaFilter
          showEstadoFilter={false}
          orderKey="orden"
          orderLabel="Ordenar lista"
          orderOptions={[...ORDER_OPTIONS]}
        />
      </CardContent>
    </Card>
  );
}
