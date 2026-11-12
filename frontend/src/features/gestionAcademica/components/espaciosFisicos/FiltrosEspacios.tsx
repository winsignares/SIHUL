import { Input } from '../../../../components/ui/input';
import { Card, CardContent } from '../../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Search } from 'lucide-react';
import type { useEspaciosFisicos } from '../../hooks/useEspaciosFisicos';

type EspaciosFisicos = ReturnType<typeof useEspaciosFisicos>;

/** Búsqueda y filtros por sede y tipo. */
export function FiltrosEspacios({
  searchTerm,
  setSearchTerm,
  filterTipo,
  setFilterTipo,
  filterSede,
  setFilterSede,
  sedes,
  tiposEspacio,
  isMobile
}: Pick<EspaciosFisicos, 'searchTerm' | 'setSearchTerm' | 'filterTipo' | 'setFilterTipo' | 'filterSede' | 'setFilterSede' | 'sedes' | 'tiposEspacio'> & { isMobile: boolean }) {
  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
      <CardContent className="p-6">
        <div className={`grid gap-4 ${isMobile ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 md:grid-cols-3'}`}>
          {/* 1️⃣ Búsqueda (primero) */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Buscar espacio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* 2️⃣ Filtro Sede (segundo) */}
          <Select value={filterSede} onValueChange={setFilterSede}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las sedes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las sedes</SelectItem>
              {sedes.map(sede => (
                <SelectItem key={sede.id} value={sede.id?.toString() || ''}>{sede.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* 3️⃣ Filtro Tipo (tercero) */}
          <Select value={filterTipo} onValueChange={setFilterTipo}>
            <SelectTrigger>
              <SelectValue placeholder="Todos los tipos" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {tiposEspacio.map(tipo => (
                <SelectItem key={tipo.id} value={tipo.id?.toString() || ''}>{tipo.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
