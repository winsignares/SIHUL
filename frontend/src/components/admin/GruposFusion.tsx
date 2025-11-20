import { useState } from 'react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { Checkbox } from '../ui/checkbox';
import { GitMerge, AlertCircle, CheckCircle2, Users, MapPin, BookOpen, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface Grupo {
  id: string;
  codigo: string;
  programa: string;
  asignaturas: string[];
  estudiantes: number;
  estado: 'activo' | 'inactivo';
}

interface GrupoFusionado {
  id: string;
  grupos: string[];
  asignaturaComun: string;
  espacioAsignado: string;
  estudiantesTotal: number;
  programas: string[];
}

export default function GruposFusion() {
  const [isFusionDialogOpen, setIsFusionDialogOpen] = useState(false);
  const [selectedGrupos, setSelectedGrupos] = useState<string[]>([]);
  const [asignaturaComun, setAsignaturaComun] = useState('');
  const [espacioAsignado, setEspacioAsignado] = useState('');

  const [grupos] = useState<Grupo[]>([
    { id: '1', codigo: 'INSI-A', programa: 'Ingeniería de Sistemas', asignaturas: ['Programación I', 'Cálculo I', 'Física I'], estudiantes: 35, estado: 'activo' },
    { id: '2', codigo: 'INSI-B', programa: 'Ingeniería de Sistemas', asignaturas: ['Programación I', 'Bases de Datos', 'Álgebra'], estudiantes: 32, estado: 'activo' },
    { id: '3', codigo: 'INCI-A', programa: 'Ingeniería Civil', asignaturas: ['Física I', 'Cálculo I', 'Estática'], estudiantes: 30, estado: 'activo' },
    { id: '4', codigo: 'ADEM-A', programa: 'Administración de Empresas', asignaturas: ['Matemáticas', 'Contabilidad', 'Marketing'], estudiantes: 28, estado: 'activo' },
    { id: '5', codigo: 'ADEM-B', programa: 'Administración de Empresas', asignaturas: ['Matemáticas', 'Economía', 'Estadística'], estudiantes: 25, estado: 'activo' }
  ]);

  const [gruposFusionados, setGruposFusionados] = useState<GrupoFusionado[]>([
    {
      id: 'f1',
      grupos: ['INSI-A', 'INCI-A'],
      asignaturaComun: 'Física I',
      espacioAsignado: 'Auditorio Central',
      estudiantesTotal: 65,
      programas: ['Ingeniería de Sistemas', 'Ingeniería Civil']
    }
  ]);

  const espacios = [
    { id: 'aud1', nombre: 'Auditorio Central', capacidad: 200 },
    { id: 'aud2', nombre: 'Auditorio Norte', capacidad: 150 },
    { id: 'lab1', nombre: 'Laboratorio 401', capacidad: 50 },
    { id: 'aula1', nombre: 'Aula Magna 501', capacidad: 100 }
  ];

  // Obtener asignaturas comunes entre grupos seleccionados
  const getAsignaturasComunes = () => {
    if (selectedGrupos.length < 2) return [];
    
    const gruposSeleccionados = grupos.filter(g => selectedGrupos.includes(g.id));
    const primerasAsignaturas = gruposSeleccionados[0].asignaturas;
    
    return primerasAsignaturas.filter(asignatura =>
      gruposSeleccionados.every(grupo => grupo.asignaturas.includes(asignatura))
    );
  };

  const asignaturasComunes = getAsignaturasComunes();
  
  // Calcular total de estudiantes
  const getTotalEstudiantes = () => {
    const gruposSeleccionados = grupos.filter(g => selectedGrupos.includes(g.id));
    return gruposSeleccionados.reduce((sum, g) => sum + g.estudiantes, 0);
  };

  const totalEstudiantes = getTotalEstudiantes();

  // Validar capacidad del espacio
  const validarCapacidad = () => {
    if (!espacioAsignado) return null;
    const espacio = espacios.find(e => e.id === espacioAsignado);
    if (!espacio) return null;
    
    return {
      suficiente: espacio.capacidad >= totalEstudiantes,
      capacidad: espacio.capacidad,
      diferencia: espacio.capacidad - totalEstudiantes
    };
  };

  const capacidadValidacion = validarCapacidad();

  // Validar conflictos de estado
  const validarEstadoGrupos = () => {
    const gruposSeleccionados = grupos.filter(g => selectedGrupos.includes(g.id));
    const todosActivos = gruposSeleccionados.every(g => g.estado === 'activo');
    const algunoInactivo = gruposSeleccionados.some(g => g.estado === 'inactivo');
    
    return { todosActivos, algunoInactivo };
  };

  const estadoValidacion = validarEstadoGrupos();

  const handleToggleGrupo = (grupoId: string) => {
    if (selectedGrupos.includes(grupoId)) {
      setSelectedGrupos(selectedGrupos.filter(id => id !== grupoId));
    } else {
      setSelectedGrupos([...selectedGrupos, grupoId]);
    }
    // Reset asignatura y espacio cuando cambian los grupos
    setAsignaturaComun('');
    setEspacioAsignado('');
  };

  const handleCrearFusion = () => {
    // Validaciones
    if (selectedGrupos.length < 2) {
      toast.error('Debe seleccionar al menos 2 grupos para fusionar');
      return;
    }

    if (!asignaturaComun) {
      toast.error('Debe seleccionar una asignatura común');
      return;
    }

    if (!espacioAsignado) {
      toast.error('Debe asignar un espacio físico');
      return;
    }

    if (capacidadValidacion && !capacidadValidacion.suficiente) {
      toast.error('El espacio seleccionado no tiene capacidad suficiente');
      return;
    }

    if (!estadoValidacion.todosActivos) {
      toast.error('No se pueden fusionar grupos inactivos');
      return;
    }

    // Crear fusión
    const gruposSeleccionados = grupos.filter(g => selectedGrupos.includes(g.id));
    const espacioSeleccionado = espacios.find(e => e.id === espacioAsignado);
    
    const nuevaFusion: GrupoFusionado = {
      id: `f${gruposFusionados.length + 1}`,
      grupos: gruposSeleccionados.map(g => g.codigo),
      asignaturaComun,
      espacioAsignado: espacioSeleccionado?.nombre || '',
      estudiantesTotal: totalEstudiantes,
      programas: [...new Set(gruposSeleccionados.map(g => g.programa))]
    };

    setGruposFusionados([...gruposFusionados, nuevaFusion]);
    toast.success('Fusión de grupos creada exitosamente');
    
    // Reset
    setSelectedGrupos([]);
    setAsignaturaComun('');
    setEspacioAsignado('');
    setIsFusionDialogOpen(false);
  };

  const handleEliminarFusion = (fusionId: string) => {
    setGruposFusionados(gruposFusionados.filter(f => f.id !== fusionId));
    toast.success('Fusión eliminada exitosamente');
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Fusión de Grupos</h1>
          <p className="text-slate-600">Fusiona grupos de distintas carreras que compartan asignaturas para optimizar recursos</p>
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
                      className={`cursor-pointer transition-all ${
                        selectedGrupos.includes(grupo.id)
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

      {/* Info Card */}
      <Alert className="bg-blue-50 border-blue-200">
        <Info className="h-5 w-5 text-blue-600" />
        <AlertTitle className="text-blue-900">¿Qué es la fusión de grupos?</AlertTitle>
        <AlertDescription className="text-blue-700">
          La fusión permite que grupos de diferentes programas académicos compartan una misma asignatura en un espacio común, optimizando el uso de recursos y facilitando la interacción entre estudiantes de distintas carreras.
        </AlertDescription>
      </Alert>

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
