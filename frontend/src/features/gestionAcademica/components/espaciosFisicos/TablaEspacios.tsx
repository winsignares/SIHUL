import { Button } from '../../../../components/ui/button';
import { Card, CardContent } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { FilaVaciaTabla } from '../../../../components/common/FilaVaciaTabla';
import { Edit, Trash2 } from 'lucide-react';
import type { useEspaciosFisicos } from '../../hooks/useEspaciosFisicos';

type EspaciosFisicos = ReturnType<typeof useEspaciosFisicos>;

/** Tabla de espacios físicos. */
export function TablaEspacios({
  filteredEspacios,
  cargando,
  paginatedEspacios,
  sedes,
  getEstadoBadge,
  openEditDialog,
  openDeleteDialog
}: Pick<EspaciosFisicos, 'filteredEspacios' | 'cargando' | 'paginatedEspacios' | 'sedes' | 'getEstadoBadge' | 'openEditDialog' | 'openDeleteDialog'>) {
  return (
    <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Sede</TableHead>
              <TableHead>Capacidad</TableHead>
              <TableHead>Ubicación</TableHead>
              <TableHead>Recursos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredEspacios.length === 0 ? (
              <FilaVaciaTabla colSpan={8} cargando={cargando} mensajeCargando="Cargando espacios..." mensajeVacio="No se encontraron espacios" />
            ) : (
              paginatedEspacios.map((espacio) => {
                const sede = sedes.find(s => s.id === espacio.sede_id);
                return (
                  <TableRow key={espacio.id}>
                    <TableCell className="text-slate-900 dark:text-slate-100">{espacio.nombre}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {espacio.tipo_espacio?.nombre || 'Sin tipo'}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{sede?.nombre || 'Sede desconocida'}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{espacio.capacidad} personas</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{espacio.ubicacion || 'Sin ubicación'}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      {espacio.recursos && espacio.recursos.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {espacio.recursos.map(r => (
                            <Badge key={r.id} variant="outline" className="text-xs">{r.nombre}</Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Sin recursos</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={getEstadoBadge(espacio.estado || 'Disponible').className}>
                        {getEstadoBadge(espacio.estado || 'Disponible').label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(espacio)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openDeleteDialog(espacio)}
                          className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
