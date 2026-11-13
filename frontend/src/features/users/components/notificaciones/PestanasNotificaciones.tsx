import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import type { CategoriaNotificacion } from '../../models/notification.model';
import { FiltrosNotificaciones } from './FiltrosNotificaciones';
import { ListaNotificaciones } from './ListaNotificaciones';
import type { useNotificacionesPagina } from '../../hooks/useNotificacionesPagina';

type Gestion = ReturnType<typeof useNotificacionesPagina>;

/** Pestañas pendientes y leídas, con sus filtros y el listado. */
export function PestanasNotificaciones(props: Gestion) {
  const {
    filterTab, setFilterTab, stats, busqueda, setBusqueda, filtroTiempo, setFiltroTiempo,
    filtroPrioridad, setFiltroPrioridad,
  } = props;

  return (
    <Tabs value={filterTab} onValueChange={(valor) => setFilterTab(valor as CategoriaNotificacion)} className="w-full">
      <TabsList className="grid grid-cols-2 w-full">
        <TabsTrigger value="pendientes">
          Pendientes
          {stats.pendientes > 0 && (
            <Badge className="ml-2 bg-red-600 text-white">{stats.pendientes}</Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="leidas">Leídas</TabsTrigger>
      </TabsList>

      <FiltrosNotificaciones
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        filtroTiempo={filtroTiempo}
        setFiltroTiempo={setFiltroTiempo}
        filtroPrioridad={filtroPrioridad}
        setFiltroPrioridad={setFiltroPrioridad}
      />

      <ListaNotificaciones {...props} />
    </Tabs>
  );
}
