import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Loader } from 'lucide-react';
import type { useReportes } from '../../hooks/useReportes';

type Reportes = ReturnType<typeof useReportes>;

/** Reporte de disponibilidad de espacios. */
export function ReporteDisponibilidad({
  errorDisponibilidad,
  cargandoDisponibilidad,
  disponibilidadEspacios
}: Pick<Reportes, 'errorDisponibilidad' | 'cargandoDisponibilidad' | 'disponibilidadEspacios'>) {
  return (
    <div className="grid lg:grid-cols-2 gap-6">
      {errorDisponibilidad && (
        <div className="lg:col-span-2 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-800 dark:text-red-200">{errorDisponibilidad}</p>
        </div>
      )}
      
      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Disponibilidad de Espacios</CardTitle>
        </CardHeader>
        <CardContent>
          {cargandoDisponibilidad ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-slate-400 animate-spin" />
              <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Espacio</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Disponible</TableHead>
                  <TableHead>Ocupado</TableHead>
                  <TableHead>%</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {disponibilidadEspacios.map((espacio, index) => (
                  <TableRow key={index}>
                    <TableCell className="text-slate-900 dark:text-slate-100">{espacio.nombre}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{espacio.tipo}</Badge>
                    </TableCell>
                    <TableCell className="text-green-600 dark:text-green-400">{espacio.horasDisponibles}h</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{espacio.horasOcupadas}h</TableCell>
                    <TableCell>
                      <Badge className={`${espacio.porcentajeOcupacion > 70 ? 'bg-red-100 text-red-800 dark:bg-red-950/30 dark:text-red-400' : 'bg-green-100 text-green-800 dark:bg-green-950/30 dark:text-green-400'}`}>
                        {espacio.porcentajeOcupacion}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-slate-100">Resumen de Disponibilidad</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {cargandoDisponibilidad ? (
            <div className="flex items-center justify-center py-8">
              <Loader className="w-6 h-6 text-slate-400 animate-spin" />
              <span className="ml-2 text-slate-600 dark:text-slate-400">Cargando datos...</span>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950/30 rounded-lg border border-green-200 dark:border-green-800">
                  <p className="text-green-600 dark:text-green-400 mb-1">Total Disponible</p>
                  <p className="text-green-900 dark:text-green-100">110 horas</p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-600 dark:text-blue-400 mb-1">Total Ocupado</p>
                  <p className="text-blue-900 dark:text-blue-100">135 horas</p>
                </div>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                <p className="text-slate-600 dark:text-slate-400 mb-2">Promedio de Ocupación</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-slate-200 dark:bg-slate-700 rounded-full h-3">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 h-3 rounded-full w-pct-55"></div>
                  </div>
                  <span className="text-slate-900 dark:text-slate-100">56%</span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
