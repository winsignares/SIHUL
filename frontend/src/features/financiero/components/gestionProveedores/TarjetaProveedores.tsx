import { Badge } from '../../../../components/ui/badge';
import { Button } from '../../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Building2, PauseCircle, PlayCircle, Plus, Search, Trash2 } from 'lucide-react';
import { ESTADO_OPTIONS, TIPO_PROVEEDOR_OPTIONS } from '../../hooks/admin_financiero/gestionProveedoresUtils';
import type { useGestionProveedores } from '../../hooks/admin_financiero/useGestionProveedores';

type GestionProveedores = ReturnType<typeof useGestionProveedores>;

/** Listado de proveedores con sus filtros y acciones. */
export function TarjetaProveedores({
  abrirNuevo, search, setSearch, estadoFilter, setEstadoFilter, tipoFilter, setTipoFilter,
  ciudadFilter, setCiudadFilter, ciudadesDisponiblesFiltro, limpiarFiltros, loading, filtered,
  accionProveedorId, abrirEdicion, toggleEstado, eliminarProveedor,
}: Pick<GestionProveedores, 'abrirNuevo' | 'search' | 'setSearch' | 'estadoFilter' | 'setEstadoFilter' | 'tipoFilter' | 'setTipoFilter' | 'ciudadFilter' | 'setCiudadFilter' | 'ciudadesDisponiblesFiltro' | 'limpiarFiltros' | 'loading' | 'filtered' | 'accionProveedorId' | 'abrirEdicion' | 'toggleEstado' | 'eliminarProveedor'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-slate-900">Proveedores registrados</CardTitle>
          <Button size="sm" onClick={abrirNuevo} className="bg-red-700 text-white hover:bg-red-800">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo proveedor
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="Buscar por NIT, razón social, correo o ciudad"
            />
          </div>

          <div className="lg:col-span-2">
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                {ESTADO_OPTIONS.map((estado) => (
                  <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select value={tipoFilter} onValueChange={setTipoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {TIPO_PROVEEDOR_OPTIONS.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select value={ciudadFilter} onValueChange={setCiudadFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Ciudad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las ciudades</SelectItem>
                {ciudadesDisponiblesFiltro.map((ciudad) => (
                  <SelectItem key={ciudad} value={ciudad}>{ciudad}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-1">
            <Button variant="outline" className="w-full" onClick={limpiarFiltros}>Limpiar</Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <p className="text-sm text-slate-500">Cargando proveedores...</p>
        ) : (
          <div className="overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-center">NIT</TableHead>
                  <TableHead className="text-center">Razón social</TableHead>
                  <TableHead className="text-center">Tipo</TableHead>
                  <TableHead className="text-center">Ciudad</TableHead>
                  <TableHead className="text-center">Correo empresa</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="py-7 text-center text-slate-500">
                      No hay proveedores para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((proveedor) => {
                    const isProcessing = accionProveedorId === proveedor.id;
                    return (
                      <TableRow key={proveedor.id}>
                        <TableCell className="text-center font-mono text-sm">{proveedor.nit}</TableCell>
                        <TableCell className="text-center font-medium text-slate-800">{proveedor.razon_social}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-slate-700">{proveedor.tipo_proveedor}</Badge>
                        </TableCell>
                        <TableCell className="text-center">{proveedor.ciudad || '—'}</TableCell>
                        <TableCell className="text-center">{proveedor.email || '—'}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={proveedor.estado === 'Activo' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                            {proveedor.estado}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => abrirEdicion(proveedor)} title="Editar proveedor">
                              <Building2 className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                              onClick={() => void toggleEstado(proveedor)}
                              title={proveedor.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                              className={proveedor.estado === 'Activo' ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}
                            >
                              {proveedor.estado === 'Activo' ? <PauseCircle className="h-4 w-4" /> : <PlayCircle className="h-4 w-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isProcessing}
                              onClick={() => void eliminarProveedor(proveedor)}
                              title="Eliminar proveedor"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
