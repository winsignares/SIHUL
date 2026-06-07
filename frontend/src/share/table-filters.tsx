import { Input } from './input';
import { Label } from './label';
import { Search, Calendar, X, Filter } from 'lucide-react';
import { Button } from './button';

interface TableFiltersProps {
  filters: {
    numeroFactura?: string;
    proveedor?: string;
    estado?: string;
    areaSolicitante?: string;
    fechaInicio?: string;
    fechaFin?: string;
    montoMin?: string;
    montoMax?: string;
  };
  onFilterChange: (filters: any) => void;
  estados?: string[];
  proveedores?: string[];
  areas?: string[];
  showFechaFilter?: boolean;
  showAreaFilter?: boolean;
}

export default function TableFilters({
  filters,
  onFilterChange,
  estados = [],
  proveedores = [],
  areas = [],
  showFechaFilter = false,
  showAreaFilter = false,
}: TableFiltersProps) {
  const handleReset = () => {
    onFilterChange({
      numeroFactura: '',
      proveedor: '',
      estado: '',
      areaSolicitante: '',
      fechaInicio: '',
      fechaFin: '',
      montoMin: '',
      montoMax: '',
    });
  };

  const handleInputChange = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const filtrosActivos = Object.values(filters || {}).filter((v) => v !== '').length;

  return (
    <div className="bg-gradient-to-br from-slate-50 to-white p-6 rounded-xl border-2 border-slate-200 shadow-sm">
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
            <Filter className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800">Filtros de Busqueda</h3>
            <p className="text-xs text-slate-500">
              {filtrosActivos > 0
                ? `${filtrosActivos} filtro${filtrosActivos > 1 ? 's' : ''} activo${filtrosActivos > 1 ? 's' : ''}`
                : 'Sin filtros aplicados'}
            </p>
          </div>
        </div>
        {filtrosActivos > 0 && (
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <X className="w-4 h-4 mr-2" />
            Limpiar Todo
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-2 min-w-0 flex-1 max-w-xs">
          <Label htmlFor="filter-numero" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
            <Search className="w-3 h-3 text-red-600" />
            Numero de Factura
          </Label>
          <div className="relative">
            <Input
              id="filter-numero"
              placeholder="Ej: FAC-2024-001"
              value={filters.numeroFactura || ''}
              onChange={(e) => handleInputChange('numeroFactura', e.target.value)}
              className="border-slate-300 focus:border-red-600 focus:ring-red-600"
            />
            {filters.numeroFactura && (
              <button
                onClick={() => handleInputChange('numeroFactura', '')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="space-y-2 min-w-0 flex-1 max-w-xs">
          <Label htmlFor="filter-proveedor" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
            <Search className="w-3 h-3 text-red-600" />
            Proveedor
          </Label>
          <select
            id="filter-proveedor"
            value={filters.proveedor || ''}
            onChange={(e) => handleInputChange('proveedor', e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-700 focus:border-red-600 focus:ring-red-600"
          >
            <option value="">Todos los proveedores</option>
            {proveedores.map((prov, idx) => (
              <option key={idx} value={prov}>
                {prov}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2 min-w-0 flex-1 max-w-xs">
          <Label htmlFor="filter-estado" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
            <Search className="w-3 h-3 text-red-600" />
            Estado
          </Label>
          <select
            id="filter-estado"
            value={filters.estado || ''}
            onChange={(e) => handleInputChange('estado', e.target.value)}
            className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-700 focus:border-red-600 focus:ring-red-600"
          >
            <option value="">Todos los estados</option>
            {estados.map((estado, idx) => (
              <option key={idx} value={estado}>
                {estado}
              </option>
            ))}
          </select>
        </div>

        {showAreaFilter && (
          <div className="space-y-2 min-w-0 flex-1 max-w-xs">
            <Label htmlFor="filter-area" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Search className="w-3 h-3 text-red-600" />
              Area Solicitante
            </Label>
            <select
              id="filter-area"
              value={filters.areaSolicitante || ''}
              onChange={(e) => handleInputChange('areaSolicitante', e.target.value)}
              className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-700 focus:border-red-600 focus:ring-red-600"
            >
              <option value="">Todas las areas</option>
              {areas.map((area, idx) => (
                <option key={idx} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </div>
        )}

        {showFechaFilter && (
          <div className="space-y-2 min-w-0 flex-1 max-w-xs">
            <Label htmlFor="filter-fecha-inicio" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              Desde
            </Label>
              <Input
                id="filter-fecha-inicio"
                type="date"
                value={filters.fechaInicio || ''}
                onChange={(e: any) => handleInputChange('fechaInicio', e.target.value)}
                className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
              />
            </div>
        )}

        {showFechaFilter && (
          <div className="space-y-2 min-w-0 flex-1 max-w-xs">
            <Label htmlFor="filter-fecha-fin" className="text-slate-700 text-xs font-semibold flex items-center gap-1">
              <Calendar className="w-3 h-3 text-blue-600" />
              Hasta
            </Label>
            <Input
              id="filter-fecha-fin"
              type="date"
              value={filters.fechaFin || ''}
              onChange={(e: any) => handleInputChange('fechaFin', e.target.value)}
              className="border-slate-300 focus:border-blue-600 focus:ring-blue-600"
            />
          </div>
        )}
      </div>
    </div>
  );
}
