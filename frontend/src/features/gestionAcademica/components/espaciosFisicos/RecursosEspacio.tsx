import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';
import { Badge } from '../../../../components/ui/badge';
import { Check, Package, Plus, X } from 'lucide-react';
import type { useEspaciosFisicos } from '../../hooks/useEspaciosFisicos';

type EspaciosFisicos = ReturnType<typeof useEspaciosFisicos>;

/** Selector y lista de recursos del espacio (crear y editar). */
export function RecursosEspacio({
  mostrandoRecursos,
  setMostrandoRecursos,
  recursosDisponibles,
  recursosAgregados,
  setRecursosAgregados,
  recursoSeleccionado,
  setRecursoSeleccionado
}: Pick<EspaciosFisicos, 'mostrandoRecursos' | 'setMostrandoRecursos' | 'recursosDisponibles' | 'recursosAgregados' | 'setRecursosAgregados' | 'recursoSeleccionado' | 'setRecursoSeleccionado'>) {
const recursosDisponiblesParaAgregar = recursosDisponibles.filter(
  (recurso) => recurso.id != null && !recursosAgregados.some((agregado) => agregado.id === recurso.id)
);

const agregarRecursoSeleccionado = () => {
  if (recursoSeleccionado == null) return;

  const recurso = recursosDisponibles.find((item) => item.id === recursoSeleccionado);
  if (!recurso || recursosAgregados.some((item) => item.id === recurso.id)) return;

  setRecursosAgregados([...recursosAgregados, recurso]);
  setRecursoSeleccionado(null);
};

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="flex items-center gap-2">
          <Package className="w-4 h-4" />
          Recursos Disponibles
        </Label>
      </div>

      {mostrandoRecursos && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <div className="flex-1">
              <SearchableSelect
                items={recursosDisponiblesParaAgregar}
                value={recursoSeleccionado}
                onSelect={(recurso) => setRecursoSeleccionado(recurso.id ?? null)}
                getItemId={(recurso) => recurso.id ?? recurso.nombre}
                getItemLabel={(recurso) => recurso.nombre}
                getItemSecondary={(recurso) => recurso.descripcion || undefined}
                placeholder="Seleccione un recurso..."
                searchPlaceholder="Buscar recurso..."
                emptyMessage="No hay recursos disponibles para agregar."
                clearable
                onClear={() => setRecursoSeleccionado(null)}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={agregarRecursoSeleccionado}
              disabled={recursoSeleccionado == null}
              className="whitespace-nowrap"
            >
              <Package className="w-4 h-4 mr-2" />
              Agregar
            </Button>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => setMostrandoRecursos(false)}
            className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
          >
            <Check className="w-4 h-4 mr-2" />
            Finalizar Agregación
          </Button>
        </div>
      )}

      {/* Lista de recursos agregados */}
      {recursosAgregados.length > 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
            <strong>Recursos agregados:</strong>
          </p>
          <div className="flex flex-wrap gap-2">
            {recursosAgregados.map(recurso => (
              <Badge
                key={recurso.id}
                variant="outline"
                className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
              >
                {recurso.nombre}
                <button
                  type="button"
                  onClick={() => {
                    setRecursosAgregados(recursosAgregados.filter(r => r.id !== recurso.id));
                    setMostrandoRecursos(true);
                  }}
                  aria-label="Eliminar recurso"
                  title="Eliminar recurso"
                  className="ml-2 hover:text-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
          {!mostrandoRecursos && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMostrandoRecursos(true)}
              className="mt-2 w-full text-blue-600"
            >
              Agregar más recursos
            </Button>
          )}
        </div>
      ) : (
        !mostrandoRecursos && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setMostrandoRecursos(true)}
            className="w-full border-dashed"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar recursos
          </Button>
        )
      )}
    </div>
  );
}
