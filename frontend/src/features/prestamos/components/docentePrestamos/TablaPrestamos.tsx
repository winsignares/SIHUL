import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Calendar, Clock, Edit, Eye, MapPin, Trash2 } from 'lucide-react';
import { FilaVaciaTabla } from '../../../../components/common/FilaVaciaTabla';
import { getEstadoBadge } from './EstadoPrestamoBadge';
import type { useDocentePrestamos } from '../../hooks/useDocentePrestamos';

type DocentePrestamos = ReturnType<typeof useDocentePrestamos>;

/** Tabla de solicitudes de préstamo del docente. */
export function TablaPrestamos({
  loading,
  totalFilteredPrestamos,
  paginatedPrestamos,
  setDialogPrestamoId,
  iniciarEdicion,
  eliminarPrestamo
}: Pick<DocentePrestamos, 'loading' | 'totalFilteredPrestamos' | 'paginatedPrestamos' | 'setDialogPrestamoId' | 'iniciarEdicion' | 'eliminarPrestamo'>) {
  return (
    <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
      <CardHeader>
        <CardTitle className="text-slate-900 dark:text-slate-100">Mis Solicitudes de Préstamo</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Espacio</TableHead>
              <TableHead>Fecha y Hora</TableHead>
              <TableHead>Tipo de Actividad</TableHead>
              <TableHead>Recursos</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {totalFilteredPrestamos === 0 ? (
              <FilaVaciaTabla colSpan={6} cargando={loading} mensajeCargando="Cargando solicitudes..." mensajeVacio="No hay solicitudes que mostrar" />
            ) : (
              paginatedPrestamos.map((prestamo) => (
                <TableRow key={prestamo.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-blue-600" />
                      <span className="text-slate-900 dark:text-slate-100">{prestamo.espacio}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-900 dark:text-slate-100">{prestamo.fecha}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-600 dark:text-slate-400">{prestamo.horaInicio} - {prestamo.horaFin}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-slate-900 dark:text-slate-100">{prestamo.tipoEvento}</Badge>
                  </TableCell>
                  <TableCell>
                    {prestamo.recursosNecesarios.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {prestamo.recursosNecesarios.map((recurso, idx) => (
                          <Badge
                            key={idx}
                            variant="outline"
                            className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 text-xs"
                          >
                            {recurso}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{getEstadoBadge(prestamo.estado)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setDialogPrestamoId(prestamo.id)}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Ver
                      </Button>
                      {(prestamo.estado === 'pendiente' || prestamo.estado === 'rechazado') && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => iniciarEdicion(prestamo)}
                            className="border-orange-600 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950"
                            title="Editar solicitud"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (window.confirm('¿Está seguro de eliminar esta solicitud de préstamo?')) {
                                eliminarPrestamo(prestamo.id);
                              }
                            }}
                            className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                            title="Eliminar solicitud"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                      {prestamo.estado === 'aprobado' && (
                        <span className="text-sm text-slate-500 dark:text-slate-400 italic">No editable</span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
