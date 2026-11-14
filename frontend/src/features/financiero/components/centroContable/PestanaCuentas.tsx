import { motion } from 'framer-motion';
import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { CUENTA_ESTADOS, CUENTA_TIPOS, NIVELES, NIVEL_LABEL } from '../../hooks/contabilidad/centroContableUtils';
import type { useCentroContable } from '../../hooks/contabilidad/useCentroContable';

type CentroContable = ReturnType<typeof useCentroContable>;

/** Pestaña de cuentas contables: filtros y tabla. */
export function PestanaCuentas({
  cuentaSearch,
  setCuentaSearch,
  cuentaTipoFilter,
  setCuentaTipoFilter,
  cuentaEstadoFilter,
  setCuentaEstadoFilter,
  cuentaNivelFilter,
  setCuentaNivelFilter,
  loadingCuentas,
  cuentasFiltradas,
  processingId,
  openNuevaCuenta,
  openEditarCuenta,
  eliminarCuenta
}: Pick<CentroContable, 'cuentaSearch' | 'setCuentaSearch' | 'cuentaTipoFilter' | 'setCuentaTipoFilter' | 'cuentaEstadoFilter' | 'setCuentaEstadoFilter' | 'cuentaNivelFilter' | 'setCuentaNivelFilter' | 'loadingCuentas' | 'cuentasFiltradas' | 'processingId' | 'openNuevaCuenta' | 'openEditarCuenta' | 'eliminarCuenta'>) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-700">Cuentas contables registradas</p>
        <Button onClick={openNuevaCuenta} className="bg-yellow-400 hover:bg-yellow-500 text-red-900">
          <Plus className="w-4 h-4 mr-2" />
          Nueva cuenta
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <div className="relative lg:col-span-5">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input
            value={cuentaSearch}
            onChange={(event) => setCuentaSearch(event.target.value)}
            className="pl-9"
            placeholder="Buscar por código, nombre, tipo o naturaleza"
          />
        </div>
        <div className="lg:col-span-2">
          <Select value={cuentaTipoFilter} onValueChange={setCuentaTipoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los tipos</SelectItem>
              {CUENTA_TIPOS.map((tipo) => (
                <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="lg:col-span-2">
          <Select value={cuentaNivelFilter} onValueChange={setCuentaNivelFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Nivel" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los niveles</SelectItem>
              {NIVELES.map((nivel) => (
                <SelectItem key={nivel} value={String(nivel)}>{NIVEL_LABEL[nivel]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="lg:col-span-2">
          <Select value={cuentaEstadoFilter} onValueChange={setCuentaEstadoFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los estados</SelectItem>
              {CUENTA_ESTADOS.map((estado, index) => {
                const value = estado ?? `estado-${index}`;
                return (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="lg:col-span-1">
          <Button variant="outline" className="w-full" onClick={() => {
            setCuentaSearch('');
            setCuentaTipoFilter('all');
            setCuentaNivelFilter('all');
            setCuentaEstadoFilter('all');
          }}>
            Limpiar
          </Button>
        </div>
      </div>

      {loadingCuentas ? (
        <p className="text-sm text-slate-500">Cargando cuentas contables...</p>
      ) : (
        <div className="rounded-xl border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Nivel</TableHead>
                <TableHead>Naturaleza</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cuentasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-slate-500 py-7">
                    No hay cuentas contables registradas.
                  </TableCell>
                </TableRow>
              ) : (
                cuentasFiltradas.map((cuenta) => (
                  <TableRow key={cuenta.id}>
                    <TableCell className="font-semibold text-slate-800">{cuenta.codigo}</TableCell>
                    <TableCell>{cuenta.nombre}</TableCell>
                    <TableCell>{cuenta.tipo_cuenta}</TableCell>
                    <TableCell>{NIVEL_LABEL[cuenta.nivel] ?? cuenta.nivel}</TableCell>
                    <TableCell>{cuenta.naturaleza}</TableCell>
                    <TableCell>
                      <Badge className={cuenta.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                        {cuenta.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditarCuenta(cuenta)}>
                          <Pencil className="w-3 h-3" />
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingId === cuenta.id}
                          onClick={() => void eliminarCuenta(cuenta)}
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
