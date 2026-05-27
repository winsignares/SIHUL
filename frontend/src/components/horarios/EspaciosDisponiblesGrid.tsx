import { Button } from '../../share/button';
import { Card, CardContent } from '../../share/card';
import { Badge } from '../../share/badge';
import { Check, Building2, Users } from 'lucide-react';
import type { EspacioDisponible } from '../../services/horarios/asignacionEspaciosService';

interface EspaciosDisponiblesGridProps {
  espacios: EspacioDisponible[];
  espacioSeleccionado?: EspacioDisponible | null;
  onSelectEspacio: (espacio: EspacioDisponible) => void;
  loading?: boolean;
}

const tipoColors: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  'Aula': { bg: 'bg-blue-100', text: 'text-blue-800', icon: <Building2 className="w-4 h-4" /> },
  'Sala Cómputo': { bg: 'bg-purple-100', text: 'text-purple-800', icon: <Building2 className="w-4 h-4" /> },
  'Laboratorio': { bg: 'bg-green-100', text: 'text-green-800', icon: <Building2 className="w-4 h-4" /> },
  'Auditorio': { bg: 'bg-amber-100', text: 'text-amber-800', icon: <Users className="w-4 h-4" /> },
};

export function EspaciosDisponiblesGrid({
  espacios,
  espacioSeleccionado,
  onSelectEspacio,
  loading = false,
}: EspaciosDisponiblesGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 bg-slate-100 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (espacios.length === 0) {
    return (
      <div className="text-center py-12">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium">No hay espacios disponibles</p>
        <p className="text-slate-500 text-sm mt-1">
          No se encontraron espacios libres para el día y hora seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {espacios.map((espacio) => {
        const isSelected = espacioSeleccionado?.id === espacio.id;
        const tipoInfo = tipoColors[espacio.tipo] || {
          bg: 'bg-slate-100',
          text: 'text-slate-800',
          icon: <Building2 className="w-4 h-4" />,
        };

        return (
          <Card
            key={espacio.id}
            className={`overflow-hidden transition-all duration-300 cursor-pointer hover:shadow-lg border-2 ${
              isSelected
                ? 'border-blue-500 bg-blue-50'
                : 'border-slate-200 hover:border-blue-300'
            }`}
            onClick={() => onSelectEspacio(espacio)}
          >
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-900 flex-1">
                      {espacio.nombre}
                    </h4>
                    {isSelected && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-blue-500 text-white rounded-full">
                        <Check className="w-3 h-3" />
                        <span className="text-xs font-semibold">Seleccionado</span>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mb-2">{espacio.sede_nombre || 'Sin sede'}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    {tipoInfo.icon}
                    Tipo
                  </span>
                  <Badge className={`${tipoInfo.bg} ${tipoInfo.text}`}>
                    {espacio.tipo}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-600 flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    Capacidad
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold text-slate-900">
                      {espacio.capacidad}
                    </div>
                    <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all"
                        style={{
                          width: `${Math.min((espacio.capacidad / 300) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>

                {espacio.ubicacion && espacio.ubicacion !== 'N/A' && (
                  <div className="text-xs text-slate-600">
                    <span className="block font-medium text-slate-700">Ubicación:</span>
                    <span className="text-slate-500">{espacio.ubicacion}</span>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectEspacio(espacio);
                }}
                className={`w-full transition-all ${
                  isSelected
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-900'
                }`}
              >
                {isSelected ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Seleccionado
                  </>
                ) : (
                  'Elegir'
                )}
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
