import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Copy, Calendar, CheckCircle2, Clock, TrendingUp, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { NotificationBanner } from '../../share/notificationBanner';
import { usePeriodosAcademicos } from '../../hooks/gestionAcademica/usePeriodosAcademicos';

export default function PeriodosAcademicos() {
  const {
    loading,
    periodos,
    periodosOrdenados,
    periodoActivo,
    showCreateDialog, setShowCreateDialog,
    showEditDialog, setShowEditDialog,
    showCopyDialog, setShowCopyDialog,
    showDeleteDialog, setShowDeleteDialog,
    periodoForm, setPeriodoForm,
    periodoACopiar,
    periodoAEliminar,
    handleOpenCreateDialog,
    handleCreatePeriodo,
    handleOpenEditDialog,
    handleEditPeriodo,
    handleOpenCopyDialog,
    handleCopyPeriodo,
    handleOpenDeleteDialog,
    handleDeletePeriodo,
    notification
  } = usePeriodosAcademicos();

  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Activo':
        return <Badge className="bg-green-100 text-green-800 border-green-300">Activo</Badge>;
      case 'Próximo':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-300">Próximo</Badge>;
      case 'Finalizado':
        return <Badge className="bg-slate-100 text-slate-800 border-slate-300">Finalizado</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="p-8 space-y-6">
      <NotificationBanner notification={notification} />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Periodos Académicos</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona los periodos académicos de la universidad</p>
        </div>
        <Button
          onClick={handleOpenCreateDialog}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Periodo
        </Button>
      </div>

      {/* Current Period Card */}
      {periodoActivo && (
        <Card className="border-red-600 bg-gradient-to-br from-red-50 to-white dark:from-red-950/30 dark:to-slate-900">
          <CardContent className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-br from-red-600 to-red-700 rounded-xl flex items-center justify-center">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h2 className="text-slate-900 dark:text-slate-100">Periodo Actual: {periodoActivo.nombre}</h2>
                    <Badge className="bg-green-100 text-green-800 border-green-300">Activo</Badge>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 mb-2">
                    {new Date(periodoActivo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })} - {new Date(periodoActivo.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                      <span className="text-slate-700 dark:text-slate-300">{periodoActivo.programasActivos} Programas activos</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-600 rounded-full"></div>
                      <span className="text-slate-700 dark:text-slate-300">{periodoActivo.horariosRegistrados} Horarios registrados</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-slate-600 dark:text-slate-400 mb-1">Días restantes</p>
                <p className="text-slate-900 dark:text-slate-100">
                  {Math.ceil((new Date(periodoActivo.fecha_fin + 'T00:00:00').getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} días
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Periods Table */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-900">
                <TableHead className="text-slate-900 dark:text-slate-100">Periodo</TableHead>
                <TableHead className="text-slate-900 dark:text-slate-100">Fecha de Inicio</TableHead>
                <TableHead className="text-slate-900 dark:text-slate-100">Fecha de Fin</TableHead>
                <TableHead className="text-slate-900 dark:text-slate-100">Programas</TableHead>
                <TableHead className="text-slate-900 dark:text-slate-100">Estado</TableHead>
                <TableHead className="text-right text-slate-900 dark:text-slate-100">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {periodosOrdenados.map((periodo) => (
                <TableRow key={periodo.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <TableCell className="text-slate-900 dark:text-slate-100">{periodo.nombre}</TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {new Date(periodo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell className="text-slate-600 dark:text-slate-400">
                    {new Date(periodo.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                      <span className="text-slate-900 dark:text-slate-100">{periodo.programasActivos}</span>
                    </div>
                  </TableCell>
                  <TableCell>{getEstadoBadge(periodo.estado)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-blue-600 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
                        onClick={() => handleOpenEditDialog(periodo)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-yellow-600 text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-950"
                        onClick={() => handleOpenCopyDialog(periodo)}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={
                          periodo.estado === 'Activo'
                            ? 'border-slate-300 text-slate-400 cursor-not-allowed'
                            : 'border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-950'
                        }
                        onClick={() => handleOpenDeleteDialog(periodo)}
                        disabled={periodo.estado === 'Activo'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Timeline */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-gradient-to-br from-white to-slate-50 dark:from-slate-900 dark:to-slate-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-red-600" />
              Línea de Tiempo de Periodos
            </h3>
            <Badge variant="outline" className="border-red-200 text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
              {periodos.length} periodos registrados
            </Badge>
          </div>

          <div className="relative">
            {/* Línea central */}
            <div className="absolute left-6 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-green-200 to-slate-200 dark:from-blue-900 dark:via-green-900 dark:to-slate-700 rounded-full"></div>

            <div className="space-y-8">
              {periodosOrdenados.map((periodo, index) => (
                <motion.div
                  key={periodo.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative pl-16"
                >
                  {/* Icono */}
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 360 }}
                    transition={{ duration: 0.3 }}
                    className={`absolute left-0 w-12 h-12 rounded-full flex items-center justify-center shadow-lg ${periodo.estado === 'Activo'
                        ? 'bg-gradient-to-br from-green-500 to-green-600'
                        : periodo.estado === 'Próximo'
                          ? 'bg-gradient-to-br from-blue-500 to-blue-600'
                          : 'bg-gradient-to-br from-slate-400 to-slate-500'
                      }`}
                  >
                    <Calendar className="w-6 h-6 text-white" />
                  </motion.div>

                  {/* Tarjeta */}
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    className={`rounded-xl p-5 border-2 shadow-md transition-all ${periodo.estado === 'Activo'
                        ? 'bg-gradient-to-r from-green-50 to-white border-green-300 dark:from-green-950/30 dark:to-slate-900 dark:border-green-800'
                        : periodo.estado === 'Próximo'
                          ? 'bg-gradient-to-r from-blue-50 to-white border-blue-300 dark:from-blue-950/30 dark:to-slate-900 dark:border-blue-800'
                          : 'bg-gradient-to-r from-slate-50 to-white border-slate-300 dark:from-slate-800 dark:to-slate-900 dark:border-slate-700'
                      }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-slate-900 dark:text-slate-100">{periodo.nombre}</h4>
                          {getEstadoBadge(periodo.estado)}
                        </div>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(periodo.fecha_inicio + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                            {' → '}
                            {new Date(periodo.fecha_fin + 'T00:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                      {periodo.estado === 'Activo' && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="w-3 h-3 bg-green-500 rounded-full"
                        />
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-red-600" />
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Programas</p>
                          <p className="text-slate-900 dark:text-slate-100">{periodo.programasActivos}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <div>
                          <p className="text-slate-500 dark:text-slate-400">Duración</p>
                          <p className="text-slate-900 dark:text-slate-100">
                            {Math.ceil((new Date(periodo.fecha_fin + 'T00:00:00').getTime() - new Date(periodo.fecha_inicio + 'T00:00:00').getTime()) / (1000 * 60 * 60 * 24))} días
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleOpenEditDialog(periodo)}
                        >
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8"
                          onClick={() => handleOpenCopyDialog(periodo)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={`h-8 ${periodo.estado === 'Activo' ? 'text-slate-400 cursor-not-allowed' : 'text-red-600 hover:text-red-700'}`}
                          onClick={() => handleOpenDeleteDialog(periodo)}
                          disabled={periodo.estado === 'Activo'}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Crear Periodo */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-red-600 to-red-800 rounded-lg flex items-center justify-center">
                <Calendar className="w-4 h-4 text-yellow-400" />
              </div>
              Crear Nuevo Periodo Académico
            </DialogTitle>
            <DialogDescription>
              Complete los datos del nuevo periodo. El estado inicial será "Próximo".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Periodo *</Label>
              <Input
                placeholder="Ej: 2025-2"
                value={periodoForm.nombre}
                onChange={(e) => setPeriodoForm({ ...periodoForm, nombre: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio *</Label>
                <Input
                  type="date"
                  value={periodoForm.fecha_inicio}
                  onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin *</Label>
                <Input
                  type="date"
                  value={periodoForm.fecha_fin}
                  onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_fin: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePeriodo}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Periodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Periodo */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-blue-600" />
              Editar Periodo Académico
            </DialogTitle>
            <DialogDescription>
              Modifique los datos del periodo académico según sea necesario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nombre del Periodo *</Label>
              <Input
                placeholder="Ej: 2025-2"
                value={periodoForm.nombre}
                onChange={(e) => setPeriodoForm({ ...periodoForm, nombre: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio *</Label>
                <Input
                  type="date"
                  value={periodoForm.fecha_inicio}
                  onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin *</Label>
                <Input
                  type="date"
                  value={periodoForm.fecha_fin}
                  onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_fin: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditPeriodo}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
            >
              <Edit className="w-4 h-4 mr-2" />
              Actualizar Periodo
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Copiar Periodo */}
      <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Copy className="w-5 h-5 text-yellow-600" />
              Copiar Periodo Académico
            </DialogTitle>
            <DialogDescription>
              ¿Desea copiar el periodo <strong>{periodoACopiar?.nombre}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <p className="text-slate-900 dark:text-slate-100 font-semibold mb-2">
                ⚠️ Atención: Los grupos se moverán al nuevo periodo
              </p>
              <ul className="text-slate-600 dark:text-slate-400 space-y-1 ml-4">
                <li>• Se creará el nuevo periodo con las fechas especificadas</li>
                <li>• Los grupos del periodo <strong>{periodoACopiar?.nombre}</strong> se trasladarán al nuevo periodo</li>
                <li>• El periodo <strong>{periodoACopiar?.nombre}</strong> quedará sin grupos</li>
                <li className="text-amber-700 dark:text-amber-400 font-medium">⚠ Los horarios asociados se mantendrán con los grupos</li>
              </ul>
            </div>
            <div className="space-y-2">
              <Label>Nombre del Nuevo Periodo *</Label>
              <Input
                placeholder="Ej: 2025-2"
                value={periodoForm.nombre}
                onChange={(e) => setPeriodoForm({ ...periodoForm, nombre: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fecha de Inicio *</Label>
                <Input
                  type="date"
                  value={periodoForm.fecha_inicio}
                  onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_inicio: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Fecha de Fin *</Label>
                <Input
                  type="date"
                  value={periodoForm.fecha_fin}
                  onChange={(e) => setPeriodoForm({ ...periodoForm, fecha_fin: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCopyDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCopyPeriodo}
              className="bg-gradient-to-r from-yellow-600 to-yellow-700 hover:from-yellow-700 hover:to-yellow-800 text-white"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Eliminar Periodo */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="w-5 h-5" />
              Eliminar Periodo Académico
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-slate-900 dark:text-slate-100 font-semibold mb-2">
                ¿Está seguro de eliminar el periodo "{periodoAEliminar?.nombre}"?
              </p>
              <p className="text-slate-600 dark:text-slate-400 text-sm">
                Se eliminarán todos los datos asociados a este periodo académico.
              </p>
            </div>
            {periodoAEliminar?.programasActivos && periodoAEliminar.programasActivos > 0 && (
              <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-400 text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Este periodo tiene {periodoAEliminar.programasActivos} programas asociados
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleDeletePeriodo}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
