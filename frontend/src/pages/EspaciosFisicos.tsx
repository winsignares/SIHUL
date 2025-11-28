import { useState, useEffect } from 'react';
import { Button } from '../share/button';
import { Input } from '../share/input';
import { Label } from '../share/label';
import { Textarea } from '../share/textarea';
import { Card, CardContent } from '../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { Badge } from '../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../share/table';
import { Plus, Edit, Trash2, MapPin, Search, Check, AlertTriangle, Package, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useEspacios } from '../hooks/useEspacios';
import type { Espacio } from '../models/espacio';

export default function EspaciosFisicos() {
  const { espacios, loading, createEspacio, updateEspacio, deleteEspacio } = useEspacios();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [filterSede, setFilterSede] = useState<string>('all');
  
  // Modales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Formulario
  const [espacioForm, setEspacioForm] = useState({
    codigo: '',
    nombre: '',
    tipo: '',
    capacidad: '',
    sede: '',
    piso: '',
    descripcion: '',
    estado: 'Disponible' as 'Disponible' | 'Mantenimiento' | 'No Disponible'
  });
  
  // Estado para recursos
  const [recursoSeleccionado, setRecursoSeleccionado] = useState('');
  const [recursosAgregados, setRecursosAgregados] = useState<string[]>([]);
  const [mostrandoRecursos, setMostrandoRecursos] = useState(true);
  
  const [selectedEspacio, setSelectedEspacio] = useState<Espacio | null>(null);
  
  // Tipos y Sedes
  // Debe coincidir con el union type del modelo: 'aula' | 'laboratorio' | 'auditorio' | 'sala' | 'otro'
  const tiposEspacio: Array<'aula' | 'laboratorio' | 'auditorio' | 'sala' | 'otro'> = ['aula', 'laboratorio', 'auditorio', 'sala', 'otro'];
  const sedesDisponibles = ['Sede Norte', 'Sede Centro']; // Solo estas dos
  
  // Recursos disponibles
  const recursosDisponibles = [
    { nombre: 'Proyector', icon: '📽️' },
    { nombre: 'Micrófono', icon: '🎤' },
    { nombre: 'Sonido', icon: '🔊' },
    { nombre: 'Computadores', icon: '💻' },
    { nombre: 'Videoconferencia', icon: '📹' },
    { nombre: 'Pizarra Digital', icon: '📊' },
    { nombre: 'Aire Acondicionado', icon: '❄️' },
    { nombre: 'Sillas Adicionales', icon: '🪑' },
    { nombre: 'Mesas', icon: '🪑' },
    { nombre: 'Atril', icon: '📖' },
    { nombre: 'Pantalla Extra', icon: '🖥️' },
    { nombre: 'Internet', icon: '🌐' }
  ];
  
  // ==================== CREAR ESPACIO ====================
  
  const handleCreateEspacio = () => {
    // Validaciones
    if (!espacioForm.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    
    if (!espacioForm.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    if (!espacioForm.tipo) {
      toast.error('Debe seleccionar un tipo');
      return;
    }
    
    if (!espacioForm.capacidad || Number(espacioForm.capacidad) < 1) {
      toast.error('La capacidad debe ser mayor a 0');
      return;
    }
    
    if (!espacioForm.sede) {
      toast.error('Debe seleccionar una sede');
      return;
    }
    
    if (!espacioForm.piso.trim()) {
      toast.error('El piso es obligatorio');
      return;
    }
    
    // Crear espacio usando el hook
    createEspacio({
      codigo: espacioForm.codigo.trim(),
      nombre: espacioForm.nombre.trim(),
      tipo: espacioForm.tipo as Espacio['tipo'],
      capacidad: Number(espacioForm.capacidad),
      sede_id: Number(espacioForm.sede) || 1, // Convertir a número o usar 1 por defecto
      piso: espacioForm.piso.trim(),
    });
    
    // Limpiar y cerrar
    resetForm();
    setShowCreateDialog(false);
    
    // Notificación
    toast.success('✅ Registro guardado exitosamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  // ==================== EDITAR ESPACIO ====================
  
  const openEditDialog = (espacio: Espacio) => {
    setSelectedEspacio(espacio);
    setEspacioForm({
      codigo: espacio.codigo,
      nombre: espacio.nombre,
      tipo: espacio.tipo,
      capacidad: espacio.capacidad.toString(),
      sede: espacio.sede_id.toString(),
      piso: espacio.piso || '',
      descripcion: '', // Campo no usado en backend
      estado: espacio.activo ? 'Disponible' : 'No Disponible'
    });
    setRecursosAgregados([]); // Backend no tiene recursos
    setMostrandoRecursos(false);
    setShowEditDialog(true);
  };
  
  const handleEditEspacio = () => {
    if (!selectedEspacio) return;
    
    // Validaciones (mismas que crear)
    if (!espacioForm.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    
    if (!espacioForm.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    if (!espacioForm.tipo) {
      toast.error('Debe seleccionar un tipo');
      return;
    }
    
    if (!espacioForm.capacidad || Number(espacioForm.capacidad) < 1) {
      toast.error('La capacidad debe ser mayor a 0');
      return;
    }
    
    if (!espacioForm.sede) {
      toast.error('Debe seleccionar una sede');
      return;
    }
    
    if (!espacioForm.piso.trim()) {
      toast.error('El piso es obligatorio');
      return;
    }
    
    // Actualizar usando el hook
    updateEspacio({
      id: selectedEspacio.id,
      codigo: espacioForm.codigo.trim(),
      nombre: espacioForm.nombre.trim(),
      tipo: espacioForm.tipo as Espacio['tipo'],
      capacidad: Number(espacioForm.capacidad),
      sede_id: Number(espacioForm.sede) || 1,
      piso: espacioForm.piso.trim(),
      activo: espacioForm.estado === 'Disponible'
    });
    
    // Cerrar y limpiar
    setShowEditDialog(false);
    setSelectedEspacio(null);
    resetForm();
    
    // Notificación
    toast.success('✅ Actualización exitosa', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  // ==================== ELIMINAR ESPACIO ====================
  
  const openDeleteDialog = (espacio: Espacio) => {
    setSelectedEspacio(espacio);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteEspacio = () => {
    if (!selectedEspacio) return;
    
    // Eliminar usando el hook
    deleteEspacio(selectedEspacio.id);
    
    // Cerrar
    setShowDeleteDialog(false);
    setSelectedEspacio(null);
    
    // Notificación
    toast.success('✅ Espacio eliminado correctamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  // ==================== UTILIDADES ====================
  
  const resetForm = () => {
    setEspacioForm({
      codigo: '',
      nombre: '',
      tipo: '',
      capacidad: '',
      sede: '',
      piso: '',
      descripcion: '',
      estado: 'Disponible'
    });
    setRecursosAgregados([]);
    setRecursoSeleccionado('');
    setMostrandoRecursos(true);
  };
  
  // ==================== FILTROS ====================
  
  const filteredEspacios = espacios.filter(espacio => {
    const matchSearch = 
      espacio.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      espacio.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
  const matchTipo = filterTipo === 'all' || espacio.tipo === filterTipo;
    const matchSede = filterSede === 'all' || espacio.sede_id.toString() === filterSede;
    
    return matchSearch && matchTipo && matchSede;
  });
  
  // Badge de estado
  const getEstadoBadge = (estado: string) => {
    switch (estado) {
      case 'Disponible':
        return <Badge className="bg-green-100 text-green-800 border-green-300 dark:bg-green-950/30 dark:text-green-400">Disponible</Badge>;
      case 'Mantenimiento':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-950/30 dark:text-yellow-400">Mantenimiento</Badge>;
      case 'No Disponible':
        return <Badge className="bg-red-100 text-red-800 border-red-300 dark:bg-red-950/30 dark:text-red-400">No Disponible</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 dark:text-slate-100 mb-2">Espacios Físicos</h1>
          <p className="text-slate-600 dark:text-slate-400">Gestiona aulas, laboratorios y espacios académicos</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Espacio
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1️⃣ Búsqueda (primero) */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar espacio..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* 2️⃣ Filtro Sede (segundo) */}
            <Select value={filterSede} onValueChange={setFilterSede}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las sedes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las sedes</SelectItem>
                {sedesDisponibles.map(sede => (
                  <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* 3️⃣ Filtro Tipo (tercero) */}
            <Select value={filterTipo} onValueChange={setFilterTipo}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los tipos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                {tiposEspacio.map(tipo => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-slate-200 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Sede</TableHead>
                <TableHead>Piso</TableHead>
                <TableHead>Capacidad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEspacios.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-slate-500 dark:text-slate-400 py-8">
                    No se encontraron espacios
                  </TableCell>
                </TableRow>
              ) : (
                filteredEspacios.map((espacio) => (
                  <TableRow key={espacio.id}>
                    <TableCell>
                      <Badge variant="outline" className="border-red-600 text-red-600 dark:border-red-400 dark:text-red-400">
                        {espacio.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-900 dark:text-slate-100">{espacio.nombre}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{espacio.tipo}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">Sede {espacio.sede_id}</TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">
                      Piso {espacio.piso}
                    </TableCell>
                    <TableCell className="text-slate-600 dark:text-slate-400">{espacio.capacidad} personas</TableCell>
                    <TableCell>{getEstadoBadge(espacio.activo ? 'Disponible' : 'No Disponible')}</TableCell>
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ==================== MODAL: CREAR ESPACIO ==================== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Registrar Nuevo Espacio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input 
                  id="codigo"
                  placeholder="Ej: A101"
                  value={espacioForm.codigo}
                  onChange={(e) => setEspacioForm({ ...espacioForm, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacidad">Capacidad *</Label>
                <Input 
                  id="capacidad"
                  type="number"
                  min="1"
                  placeholder="Ej: 40"
                  value={espacioForm.capacidad}
                  onChange={(e) => setEspacioForm({ ...espacioForm, capacidad: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input 
                id="nombre"
                placeholder="Ej: Aula 101"
                value={espacioForm.nombre}
                onChange={(e) => setEspacioForm({ ...espacioForm, nombre: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo *</Label>
                <Select 
                  value={espacioForm.tipo}
                  onValueChange={(value) => setEspacioForm({ ...espacioForm, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEspacio.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sede">Sede *</Label>
                <Select 
                  value={espacioForm.sede}
                  onValueChange={(value) => setEspacioForm({ ...espacioForm, sede: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedesDisponibles.map(sede => (
                      <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="piso">Piso *</Label>
              <Input 
                id="piso"
                placeholder="Ej: 1"
                value={espacioForm.piso}
                onChange={(e) => setEspacioForm({ ...espacioForm, piso: e.target.value })}
              />
            </div>

            {/* Recursos Necesarios */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Recursos Disponibles
                </Label>
              </div>
              
              {mostrandoRecursos && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={recursoSeleccionado} onValueChange={setRecursoSeleccionado}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccione un recurso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recursosDisponibles.filter(r => !recursosAgregados.includes(r.nombre)).map(recurso => (
                          <SelectItem key={recurso.nombre} value={recurso.nombre}>
                            {recurso.icon} {recurso.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (recursoSeleccionado && !recursosAgregados.includes(recursoSeleccionado)) {
                          setRecursosAgregados([...recursosAgregados, recursoSeleccionado]);
                          setRecursoSeleccionado('');
                          toast.success('Recurso agregado');
                        }
                      }}
                      disabled={!recursoSeleccionado}
                      className="whitespace-nowrap"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMostrandoRecursos(false)}
                    className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar Agregación
                  </Button>
                </div>
              )}
              
              {/* Lista de recursos agregados */}
              {recursosAgregados.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <strong>Recursos agregados:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recursosAgregados.map(recurso => {
                      const recursoInfo = recursosDisponibles.find(r => r.nombre === recurso);
                      return (
                        <Badge 
                          key={recurso} 
                          variant="outline" 
                          className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                        >
                          {recursoInfo?.icon} {recurso}
                          <button
                            type="button"
                            onClick={() => {
                              setRecursosAgregados(recursosAgregados.filter(r => r !== recurso));
                              setMostrandoRecursos(true);
                            }}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                  {!mostrandoRecursos && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrandoRecursos(true)}
                      className="mt-2 w-full text-blue-600"
                    >
                      Agregar más recursos
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateEspacio}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: EDITAR ESPACIO ==================== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100">Editar Espacio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-codigo">Código *</Label>
                <Input 
                  id="edit-codigo"
                  value={espacioForm.codigo}
                  onChange={(e) => setEspacioForm({ ...espacioForm, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacidad">Capacidad *</Label>
                <Input 
                  id="edit-capacidad"
                  type="number"
                  min="1"
                  value={espacioForm.capacidad}
                  onChange={(e) => setEspacioForm({ ...espacioForm, capacidad: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input 
                id="edit-nombre"
                value={espacioForm.nombre}
                onChange={(e) => setEspacioForm({ ...espacioForm, nombre: e.target.value })}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-tipo">Tipo *</Label>
                <Select 
                  value={espacioForm.tipo}
                  onValueChange={(value) => setEspacioForm({ ...espacioForm, tipo: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposEspacio.map(tipo => (
                      <SelectItem key={tipo} value={tipo}>{tipo.charAt(0).toUpperCase() + tipo.slice(1)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-sede">Sede *</Label>
                <Select 
                  value={espacioForm.sede}
                  onValueChange={(value) => setEspacioForm({ ...espacioForm, sede: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar sede" />
                  </SelectTrigger>
                  <SelectContent>
                    {sedesDisponibles.map(sede => (
                      <SelectItem key={sede} value={sede}>{sede}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-piso">Piso *</Label>
              <Input 
                id="edit-piso"
                placeholder="Ej: 1"
                value={espacioForm.piso}
                onChange={(e) => setEspacioForm({ ...espacioForm, piso: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-descripcion">Descripción</Label>
              <Textarea 
                id="edit-descripcion"
                placeholder="Descripción opcional del espacio..."
                value={espacioForm.descripcion}
                onChange={(e) => setEspacioForm({ ...espacioForm, descripcion: e.target.value })}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-estado">Estado *</Label>
              <Select 
                value={espacioForm.estado}
                onValueChange={(value: any) => setEspacioForm({ ...espacioForm, estado: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Disponible">Disponible</SelectItem>
                  <SelectItem value="Mantenimiento">Mantenimiento</SelectItem>
                  <SelectItem value="No Disponible">No Disponible</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Recursos Necesarios */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Recursos Disponibles
                </Label>
              </div>
              
              {mostrandoRecursos && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Select value={recursoSeleccionado} onValueChange={setRecursoSeleccionado}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Seleccione un recurso..." />
                      </SelectTrigger>
                      <SelectContent>
                        {recursosDisponibles.filter(r => !recursosAgregados.includes(r.nombre)).map(recurso => (
                          <SelectItem key={recurso.nombre} value={recurso.nombre}>
                            {recurso.icon} {recurso.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (recursoSeleccionado && !recursosAgregados.includes(recursoSeleccionado)) {
                          setRecursosAgregados([...recursosAgregados, recursoSeleccionado]);
                          setRecursoSeleccionado('');
                          toast.success('Recurso agregado');
                        }
                      }}
                      disabled={!recursoSeleccionado}
                      className="whitespace-nowrap"
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Agregar
                    </Button>
                  </div>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setMostrandoRecursos(false)}
                    className="w-full border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Finalizar Agregación
                  </Button>
                </div>
              )}
              
              {/* Lista de recursos agregados */}
              {recursosAgregados.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    <strong>Recursos agregados:</strong>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {recursosAgregados.map(recurso => {
                      const recursoInfo = recursosDisponibles.find(r => r.nombre === recurso);
                      return (
                        <Badge 
                          key={recurso} 
                          variant="outline" 
                          className="bg-blue-50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-800 text-blue-900 dark:text-blue-100"
                        >
                          {recursoInfo?.icon} {recurso}
                          <button
                            type="button"
                            onClick={() => {
                              setRecursosAgregados(recursosAgregados.filter(r => r !== recurso));
                              setMostrandoRecursos(true);
                            }}
                            className="ml-2 hover:text-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </Badge>
                      );
                    })}
                  </div>
                  {!mostrandoRecursos && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setMostrandoRecursos(true)}
                      className="mt-2 w-full text-blue-600"
                    >
                      Agregar más recursos
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedEspacio(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditEspacio}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              Actualizar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: ELIMINAR ESPACIO ==================== */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription className="text-slate-600 dark:text-slate-400">
              ¿Está seguro que desea eliminar el espacio <strong>{selectedEspacio?.nombre}</strong>? 
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedEspacio(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteEspacio}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
