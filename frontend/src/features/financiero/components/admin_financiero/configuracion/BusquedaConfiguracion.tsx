import { Card, CardContent } from '../../../../../components/ui/card';
import { Button } from '../../../../../components/ui/button';
import { Input } from '../../../../../components/ui/input';
import { Search } from 'lucide-react';
import type { useConfiguracionFinanciera } from '../../../hooks/admin_financiero/useConfiguracionFinanciera';

type Gestion = ReturnType<typeof useConfiguracionFinanciera>;

/** Búsqueda y filtros de los parámetros. */
export function BusquedaConfiguracion({ search, setSearch, categoriaActiva, setCategoriaActiva, categoriasConConteo }: Pick<Gestion, 'search' | 'setSearch' | 'categoriaActiva' | 'setCategoriaActiva' | 'categoriasConConteo'>) {
  return (
    <Card className="border-0 shadow-md">
      <CardContent className="pt-6">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="Buscar por nombre del ajuste, valor o descripción"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={categoriaActiva === 'todas' ? 'default' : 'outline'}
              className={categoriaActiva === 'todas' ? 'bg-slate-900 hover:bg-slate-800 text-white' : ''}
              onClick={() => setCategoriaActiva('todas')}
            >
              Todas
            </Button>

            {categoriasConConteo.map((categoria) => {
              const Icono = categoria.icono;
              return (
                <Button
                  key={categoria.categoria}
                  variant={categoriaActiva === categoria.categoria ? 'default' : 'outline'}
                  className={categoriaActiva === categoria.categoria ? 'bg-rose-700 hover:bg-rose-800 text-white' : ''}
                  onClick={() => setCategoriaActiva(categoria.categoria)}
                >
                  <Icono className="w-4 h-4 mr-2" />
                  {categoria.titulo} ({categoria.cantidad})
                </Button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
