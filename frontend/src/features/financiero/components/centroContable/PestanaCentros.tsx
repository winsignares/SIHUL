import { motion } from 'framer-motion';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { CENTRO_ESTADOS, CENTRO_TIPOS, formatCurrency } from '../../hooks/contabilidad/centroContableUtils';
import type { useCentroContable } from '../../hooks/contabilidad/useCentroContable';

type CentroContable = ReturnType<typeof useCentroContable>;

/** Pestaña de centros de costo: filtros y tabla. */
export function PestanaCentros({
  centroSearch,
  setCentroSearch,
  centroTipoFilter,
  setCentroTipoFilter,
  centroEstadoFilter,
  setCentroEstadoFilter,
  loadingCentros,
  centrosFiltrados,
  processingId,
  resolveDepartamentoNombre,
  openNuevoCentro,
  openEditarCentro,
  eliminarCentro
}: Pick<CentroContable, 'centroSearch' | 'setCentroSearch' | 'centroTipoFilter' | 'setCentroTipoFilter' | 'centroEstadoFilter' | 'setCentroEstadoFilter' | 'loadingCentros' | 'centrosFiltrados' | 'processingId' | 'resolveDepartamentoNombre' | 'openNuevoCentro' | 'openEditarCentro' | 'eliminarCentro'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">Centros de costo registrados</p>
        <Button onClick={openNuevoCentro} className="bg-amber-500 hover:bg-amber-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo centro
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="relative lg:col-span-6">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={centroSearch}
            onChange={(event) => setCentroSearch(event.target.value)}
            className="pl-9"
            placeholder="Buscar por código, nombre, tipo o departamento"
          />
        </div>
        <div className="lg:col-span-2">
          <Select value={centroTipoFilter} onValueChange={setCentroTipoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {CENTRO_TIPOS.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="lg:col-span-2">
          <Select value={centroEstadoFilter} onValueChange={setCentroEstadoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {CENTRO_ESTADOS.map((estado, index) => {
                const value = estado ?? `estado-centro-${index}`;
                return (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="lg:col-span-2">
          <Button variant="outline" className="w-full" onClick={() => {
            setCentroSearch('');
            setCentroTipoFilter('all');
            setCentroEstadoFilter('all');
          }}>
            Limpiar
          </Button>
        </div>
      </div>

      {loadingCentros ? (
        <p className="text-sm text-slate-500">Cargando centros de costo...</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Presupuesto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {centrosFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-7">
                    No hay centros de costo registrados.
                  </TableCell>
                </TableRow>
              ) : (
                centrosFiltrados.map((centro) => (
                  <TableRow key={centro.id}>
                    <TableCell className="font-semibold text-slate-800">{centro.codigo}</TableCell>
                    <TableCell>{centro.nombre}</TableCell>
                    <TableCell>{centro.tipo}</TableCell>
                    <TableCell>{resolveDepartamentoNombre(centro) || 'Sin departamento'}</TableCell>
                    <TableCell>{formatCurrency(centro.presupuesto_asignado)}</TableCell>
                    <TableCell>
                      <Badge className={centro.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                        {centro.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditarCentro(centro)}>
                          <Pencil className="w-3 h-3" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingId === centro.id}
                          onClick={() => void eliminarCentro(centro)}
                        >
                          <Trash2 className="w-3 h-3" />
                          Eliminar
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </motion.div>
  );
}
