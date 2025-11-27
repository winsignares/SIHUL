import { Button } from '../../share/button';
import { Label } from '../../share/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Alert, AlertDescription, AlertTitle } from '../../share/alert';
import { Checkbox } from '../../share/checkbox';
import { GitMerge, AlertCircle, CheckCircle2, Users, MapPin, BookOpen, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { NotificationBanner } from '../../share/notificationBanner';
import { useGruposFusion } from '../../hooks/gestionAcademica/useGruposFusion';

export default function GruposFusion() {
  const {
    isFusionDialogOpen, setIsFusionDialogOpen,
    selectedGrupos,
    asignaturaComun, setAsignaturaComun,
    espacioAsignado, setEspacioAsignado,
    grupos,
    gruposFusionados,
    espacios,
    asignaturasComunes,
    totalEstudiantes,
    capacidadValidacion,
    estadoValidacion,
    handleToggleGrupo,
    handleCrearFusion,
    handleEliminarFusion,
    notification
  } = useGruposFusion();

  return (
    <div className="space-y-6">
      <NotificationBanner notification={notification} />
      {/* Header con botón */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-slate-900 text-lg font-semibold">Gestión de Fusiones</h2>
        </div>
        <Dialog open={isFusionDialogOpen} onOpenChange={setIsFusionDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 text-white">
              <GitMerge className="w-4 h-4 mr-2" />
              Nueva Fusión
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Crear Fusión de Grupos</DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Paso 1: Seleccionar grupos */}
              <div>
                <Label className="text-lg mb-3 block">Paso 1: Seleccionar Grupos a Fusionar</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {grupos.filter(g => g.estado === 'activo').map((grupo) => (
                    <Card
                      key={grupo.id}
                      className={`cursor-pointer transition-all ${selectedGrupos.includes(grupo.id)
                        ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-300'
                        : 'border-slate-200 hover:border-purple-300'
                        }`}
                      onClick={() => handleToggleGrupo(grupo.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Checkbox
                                checked={selectedGrupos.includes(grupo.id)}
                                onCheckedChange={() => handleToggleGrupo(grupo.id)}
                              />
                              <Badge className="bg-purple-600 text-white">{grupo.codigo}</Badge>
                            </div>
                            <p className="text-slate-900 mb-1">{grupo.programa}</p>
                            <p className="text-slate-600">
                              <Users className="w-4 h-4 inline mr-1" />
                              {grupo.estudiantes} estudiantes
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-slate-200">
                          <p className="text-slate-600 mb-1">Asignaturas:</p>
                          <div className="flex flex-wrap gap-1">
                            {grupo.asignaturas.map((asig, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {asig}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {selectedGrupos.length > 0 && (
                  <Alert className="mt-4 bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-700">
                      {selectedGrupos.length} grupo{selectedGrupos.length > 1 ? 's' : ''} seleccionado{selectedGrupos.length > 1 ? 's' : ''} • Total: {totalEstudiantes} estudiantes
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              {/* Paso 2: Asignatura común */}
              {selectedGrupos.length >= 2 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Label className="text-lg mb-3 block">Paso 2: Seleccionar Asignatura Común</Label>

                  {asignaturasComunes.length > 0 ? (
                    <Select value={asignaturaComun} onValueChange={setAsignaturaComun}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar asignatura común" />
                      </SelectTrigger>
                      <SelectContent>
                        {asignaturasComunes.map((asig) => (
                          <SelectItem key={asig} value={asig}>
                            <BookOpen className="w-4 h-4 inline mr-2" />
                            {asig}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Alert className="bg-red-50 border-red-200">
                      <AlertCircle className="h-4 w-4 text-red-600" />
                      <AlertTitle className="text-red-900">Sin Asignaturas Comunes</AlertTitle>
                      <AlertDescription className="text-red-700">
                        Los grupos seleccionados no comparten ninguna asignatura. Seleccione grupos diferentes.
                      </AlertDescription>
                    </Alert>
                  )}
                </motion.div>
              )}

              {/* Paso 3: Asignar espacio */}
              {asignaturaComun && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Label className="text-lg mb-3 block">Paso 3: Asignar Espacio Físico</Label>
                  <Select value={espacioAsignado} onValueChange={setEspacioAsignado}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar espacio" />
                    </SelectTrigger>
                    <SelectContent>
                      {espacios.map((espacio) => {
                        const suficiente = espacio.capacidad >= totalEstudiantes;
                        return (
                          <SelectItem key={espacio.id} value={espacio.id} disabled={!suficiente}>
                            <div className="flex items-center gap-2">
                              <MapPin className={`w-4 h-4 ${suficiente ? 'text-green-600' : 'text-red-600'}`} />
                              <span>{espacio.nombre}</span>
                              <span className={`ml-2 ${suficiente ? 'text-green-600' : 'text-red-600'}`}>
                                (Cap: {espacio.capacidad})
                              </span>
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>

                  {capacidadValidacion && (
                    <Alert className={`mt-3 ${capacidadValidacion.suficiente ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                      {capacidadValidacion.suficiente ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                          <AlertDescription className="text-green-700">
                            Capacidad suficiente: {capacidadValidacion.capacidad} personas ({capacidadValidacion.diferencia} espacios libres)
                          </AlertDescription>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            Capacidad insuficiente: Se necesitan {Math.abs(capacidadValidacion.diferencia)} espacios adicionales
                          </AlertDescription>
                        </>
                      )}
                    </Alert>
                  )}
                </motion.div>
              )}

              {/* Validación de estados */}
              {!estadoValidacion.todosActivos && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-900">Advertencia de Estado</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    Uno o más grupos seleccionados están inactivos. Solo se pueden fusionar grupos activos.
                  </AlertDescription>
                </Alert>
              )}

              {/* Resumen */}
              {selectedGrupos.length >= 2 && asignaturaComun && espacioAsignado && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="border-purple-200 bg-purple-50">
                    <CardHeader>
                      <CardTitle className="text-purple-900">Resumen de Fusión</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-purple-800">
                        <p>
                          <strong>Grupos:</strong> {grupos.filter(g => selectedGrupos.includes(g.id)).map(g => g.codigo).join(' + ')}
                        </p>
                        <p>
                          <strong>Asignatura:</strong> {asignaturaComun}
                        </p>
                        <p>
                          <strong>Espacio:</strong> {espacios.find(e => e.id === espacioAsignado)?.nombre}
                        </p>
                        <p>
                          <strong>Total Estudiantes:</strong> {totalEstudiantes}
                        </p>
                        <p>
                          <strong>Programas:</strong> {[...new Set(grupos.filter(g => selectedGrupos.includes(g.id)).map(g => g.programa))].join(', ')}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsFusionDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleCrearFusion}
                className="bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                disabled={
                  selectedGrupos.length < 2 ||
                  !asignaturaComun ||
                  !espacioAsignado ||
                  (capacidadValidacion && !capacidadValidacion.suficiente) ||
                  !estadoValidacion.todosActivos
                }
              >
                <GitMerge className="w-4 h-4 mr-2" />
                Crear Fusión
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Fusiones activas */}
      <div>
        <h2 className="text-slate-900 mb-4">Fusiones Activas ({gruposFusionados.length})</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {gruposFusionados.map((fusion) => (
              <motion.div
                key={fusion.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <Card className="border-purple-200">
                  <CardHeader className="bg-gradient-to-r from-purple-50 to-white">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-purple-900 flex items-center gap-2">
                          <GitMerge className="w-5 h-5" />
                          {fusion.grupos.join(' + ')}
                        </CardTitle>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-red-600 text-red-600 hover:bg-red-50"
                        onClick={() => handleEliminarFusion(fusion.id)}
                      >
                        Eliminar
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      <div className="flex items-start gap-2">
                        <BookOpen className="w-4 h-4 text-purple-600 mt-1" />
                        <div>
                          <p className="text-slate-600">Asignatura</p>
                          <p className="text-slate-900">{fusion.asignaturaComun}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <MapPin className="w-4 h-4 text-purple-600 mt-1" />
                        <div>
                          <p className="text-slate-600">Espacio</p>
                          <p className="text-slate-900">{fusion.espacioAsignado}</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <Users className="w-4 h-4 text-purple-600 mt-1" />
                        <div>
                          <p className="text-slate-600">Total Estudiantes</p>
                          <p className="text-slate-900">{fusion.estudiantesTotal}</p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-slate-200">
                        <p className="text-slate-600 mb-2">Programas participantes:</p>
                        <div className="flex flex-wrap gap-2">
                          {fusion.programas.map((prog, idx) => (
                            <Badge key={idx} className="bg-purple-100 text-purple-800 border-purple-300">
                              {prog}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {gruposFusionados.length === 0 && (
          <Card className="border-dashed border-2 border-slate-300">
            <CardContent className="p-12 text-center">
              <GitMerge className="w-16 h-16 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600 mb-2">No hay fusiones creadas</p>
              <p className="text-slate-500">Crea una fusión para optimizar el uso de espacios y recursos</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}