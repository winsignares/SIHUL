import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Button } from '../../../../components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Edit3, PauseCircle, PlayCircle, Plus, Search, ShieldCheck, Trash2 } from 'lucide-react';
import { getRolNombre } from '../../hooks/admin_financiero/gestionUsuariosFinancieroUtils';
import type { useGestionUsuariosFinanciero } from '../../hooks/admin_financiero/useGestionUsuariosFinanciero';

type GestionUsuarios = ReturnType<typeof useGestionUsuariosFinanciero>;

/** Filtros y tabla de usuarios financieros. */
export function TarjetaUsuarios({
  loading,
  rolesById,
  rolesGestionables,
  sedesDisponibles,
  usuariosFiltrados,
  accionUsuarioId,
  search,
  setSearch,
  rolFilter,
  setRolFilter,
  estadoFilter,
  setEstadoFilter,
  sedeFilter,
  setSedeFilter,
  limpiarFiltros,
  setDialogOpen,
  iniciarEdicion,
  toggleEstadoUsuario,
  eliminarUsuario
}: Pick<GestionUsuarios, 'loading' | 'rolesById' | 'rolesGestionables' | 'sedesDisponibles' | 'usuariosFiltrados' | 'accionUsuarioId' | 'search' | 'setSearch' | 'rolFilter' | 'setRolFilter' | 'estadoFilter' | 'setEstadoFilter' | 'sedeFilter' | 'setSedeFilter' | 'limpiarFiltros' | 'setDialogOpen' | 'iniciarEdicion' | 'toggleEstadoUsuario' | 'eliminarUsuario'>) {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="space-y-3 border-b border-slate-100 bg-slate-50/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle className="text-slate-900">Gestión Usuarios</CardTitle>
          <Button size="sm" onClick={() => setDialogOpen(true)} className="bg-red-700 hover:bg-red-800 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo usuario
          </Button>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div className="relative lg:col-span-5">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              id="buscar-usuarios"
              aria-label="Buscar usuarios"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              placeholder="Buscar por ID, nombre, correo, rol o sede"
            />
          </div>

          <div className="lg:col-span-2">
            <Select value={rolFilter} onValueChange={setRolFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Rol" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los roles</SelectItem>
                {rolesGestionables.map((rol) => (
                  <SelectItem key={rol.id} value={rol.nombre}>{rol.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select value={estadoFilter} onValueChange={setEstadoFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="lg:col-span-2">
            <Select value={sedeFilter} onValueChange={setSedeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Sede" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sedes</SelectItem>
                {sedesDisponibles.map((sede) => (
                  <SelectItem key={sede} value={sede}>{sede}</SelectItem>
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
          <p className="text-sm text-slate-500">Cargando usuarios...</p>
        ) : (
          <div className="rounded-xl border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-center">Usuario</TableHead>
                  <TableHead className="text-center">Correo</TableHead>
                  <TableHead className="text-center">Rol</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {usuariosFiltrados.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-7">
                      No hay usuarios para mostrar.
                    </TableCell>
                  </TableRow>
                ) : (
                  usuariosFiltrados.map((usuario) => {
                    const rolNombre = getRolNombre(usuario, rolesById);
                    const isProcessing = accionUsuarioId === usuario.id;
                    return (
                      <TableRow key={usuario.id}>
                        <TableCell className="text-center font-medium text-slate-800">{usuario.nombre}</TableCell>
                        <TableCell className="text-center">{usuario.correo}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="text-slate-700">
                            <ShieldCheck className="w-3 h-3 mr-1" />
                            {rolNombre}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge className={usuario.activo ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}>
                            {usuario.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-center gap-2">
                            <Button size="sm" variant="outline" onClick={() => iniciarEdicion(usuario)} title="Editar">
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isProcessing}
                              onClick={() => void toggleEstadoUsuario(usuario)}
                              title={usuario.activo ? 'Desactivar' : 'Activar'}
                              className={usuario.activo ? 'border-amber-300 text-amber-600 hover:bg-amber-50' : 'border-emerald-300 text-emerald-600 hover:bg-emerald-50'}
                            >
                              {usuario.activo
                                ? <PauseCircle className="w-4 h-4" />
                                : <PlayCircle className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={isProcessing}
                              onClick={() => void eliminarUsuario(usuario)}
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
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
