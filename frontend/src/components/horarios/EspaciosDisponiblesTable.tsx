import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Button } from '../../share/button';
import { Badge } from '../../share/badge';
import { Building2, Users, Check } from 'lucide-react';
import type { EspacioDisponible } from '../../services/horarios/asignacionEspaciosService';

interface Props {
  espacios: EspacioDisponible[];
  espacioSeleccionado?: EspacioDisponible | null;
  onSelectEspacio: (espacio: EspacioDisponible) => void;
  loading?: boolean;
}

export function EspaciosDisponiblesTable({ espacios, espacioSeleccionado, onSelectEspacio, loading = false }: Props) {
  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <p className="text-slate-600 font-medium">Buscando espacios disponibles...</p>
        </div>
      </div>
    );
  }

  if (espacios.length === 0) {
    return (
      <div className="py-12 text-center">
        <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="text-slate-600 font-medium text-base">No hay espacios disponibles</p>
        <p className="text-slate-500 text-sm mt-1">
          No se encontraron espacios libres para el día y hora seleccionados.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-blue-100 shadow-sm">
      <Table>
        <TableHeader>
          <TableRow className="bg-blue-50 border-b border-blue-200 hover:bg-blue-50">
            <TableHead className="text-blue-900 font-semibold text-xs uppercase tracking-wider">Nombre</TableHead>
            <TableHead className="text-blue-900 font-semibold text-xs uppercase tracking-wider">Tipo</TableHead>
            <TableHead className="text-blue-900 font-semibold text-xs uppercase tracking-wider">Capacidad</TableHead>
            <TableHead className="text-blue-900 font-semibold text-xs uppercase tracking-wider">Sede</TableHead>
            <TableHead className="text-blue-900 font-semibold text-xs uppercase tracking-wider">Ubicación</TableHead>
            <TableHead className="text-right text-blue-900 font-semibold text-xs uppercase tracking-wider">Seleccionar</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {espacios.map((espacio, idx) => {
            const seleccionado = espacioSeleccionado?.id === espacio.id;
            return (
              <TableRow
                key={espacio.id}
                className={`transition-colors border-b border-slate-200 cursor-pointer ${
                  seleccionado
                    ? 'bg-blue-100/70 border-blue-300'
                    : idx % 2 === 0
                      ? 'bg-white hover:bg-blue-50/70'
                      : 'bg-slate-50/50 hover:bg-blue-50/70'
                }`}
              >
                <TableCell className="text-slate-900 font-semibold text-sm py-3 px-4 flex items-center gap-2">
                  <Building2 className={`w-5 h-5 ${seleccionado ? 'text-blue-600' : 'text-slate-400'}`} />
                  <div>
                    <div>{espacio.nombre}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{espacio.sede_nombre || 'Sin sede'}</div>
                  </div>
                </TableCell>
                <TableCell className="text-slate-600 text-sm py-3 px-4">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">
                    {espacio.tipo}
                  </Badge>
                </TableCell>
                <TableCell className="text-slate-600 text-sm py-3 px-4 font-bold flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span className="bg-slate-100 border border-slate-200 px-2.5 py-1 rounded font-semibold">{espacio.capacidad}</span>
                </TableCell>
                <TableCell className="text-slate-600 text-sm py-3 px-4 font-medium">{espacio.sede_nombre || 'Sin sede'}</TableCell>
                <TableCell className="text-slate-600 text-sm py-3 px-4">{espacio.ubicacion || 'Sin ubicación'}</TableCell>
                <TableCell className="text-right py-3 px-4">
                  <Button
                    size="sm"
                    onClick={() => onSelectEspacio(espacio)}
                    className={`transition-all font-semibold ${
                      seleccionado
                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-md'
                        : 'bg-white text-blue-700 hover:bg-blue-50 border border-blue-200'
                    }`}
                  >
                    {seleccionado ? (
                      <>
                        <Check className="w-4 h-4 mr-1.5" />
                        Seleccionado
                      </>
                    ) : (
                      'Elegir'
                    )}
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
