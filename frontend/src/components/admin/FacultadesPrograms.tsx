import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Edit, Trash2, Building2, Search, Users, X, Check, AlertTriangle } from 'lucide-react';
import { Switch } from '../ui/switch';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { db } from '../../lib/database';
import type { Facultad, Programa } from '../../lib/models';

export default function FacultadesPrograms() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'facultades' | 'programas'>('facultades');
  
  // Estados de datos
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  
  // Estados de modales
  const [showCreateFacultad, setShowCreateFacultad] = useState(false);
  const [showEditFacultad, setShowEditFacultad] = useState(false);
  const [showDeleteFacultad, setShowDeleteFacultad] = useState(false);
  const [showCreatePrograma, setShowCreatePrograma] = useState(false);
  const [showEditPrograma, setShowEditPrograma] = useState(false);
  const [showDeletePrograma, setShowDeletePrograma] = useState(false);
  
  // Estados de formularios
  const [facultadForm, setFacultadForm] = useState({ nombre: '' });
  const [programaForm, setProgramaForm] = useState({ 
    nombre: '', 
    facultadId: '',
    semestres: '' 
  });
  
  // Estados de selección
  const [selectedFacultad, setSelectedFacultad] = useState<Facultad | null>(null);
  const [selectedPrograma, setSelectedPrograma] = useState<Programa | null>(null);
  const [selectedFacultadFilter, setSelectedFacultadFilter] = useState<string>('all');
  
  // Cargar datos
  useEffect(() => {
    loadFacultades();
    loadProgramas();
  }, []);
  
  const loadFacultades = () => {
    const data = db.getFacultades();
    setFacultades(data);
  };
  
  const loadProgramas = () => {
    const data = db.getProgramas();
    setProgramas(data);
  };
  
  // ==================== FACULTADES ====================
  
  const handleCreateFacultad = () => {
    // Validación
    if (!facultadForm.nombre.trim()) {
      toast.error('El nombre de la facultad es obligatorio');
      return;
    }
    
    // Crear facultad
    const newFacultad = db.createFacultad({
      codigo: `FAC-${Date.now().toString().slice(-4)}`,
      nombre: facultadForm.nombre.trim(),
      activa: true,
      fechaCreacion: new Date().toISOString()
    });
    
    // Actualizar lista
    loadFacultades();
    
    // Limpiar formulario y cerrar
    setFacultadForm({ nombre: '' });
    setShowCreateFacultad(false);
    
    // Mostrar notificación con animación
    toast.success('✅ Facultad registrada exitosamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  const handleEditFacultad = () => {
    if (!selectedFacultad) return;
    
    // Validación
    if (!facultadForm.nombre.trim()) {
      toast.error('El nombre de la facultad es obligatorio');
      return;
    }
    
    // Actualizar facultad
    db.updateFacultad(selectedFacultad.id, {
      nombre: facultadForm.nombre.trim()
    });
    
    // Actualizar lista
    loadFacultades();
    loadProgramas(); // Por si el nombre cambió en programas
    
    // Cerrar modal
    setShowEditFacultad(false);
    setSelectedFacultad(null);
    setFacultadForm({ nombre: '' });
    
    // Notificación
    toast.success('✅ Facultad actualizada correctamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  const handleDeleteFacultad = () => {
    if (!selectedFacultad) return;
    
    // Eliminar facultad (también elimina programas relacionados)
    db.deleteFacultad(selectedFacultad.id);
    
    // Actualizar listas
    loadFacultades();
    loadProgramas();
    
    // Cerrar modal
    setShowDeleteFacultad(false);
    setSelectedFacultad(null);
    
    // Notificación
    toast.success('✅ Facultad eliminada correctamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  const openEditFacultad = (facultad: Facultad) => {
    setSelectedFacultad(facultad);
    setFacultadForm({ nombre: facultad.nombre });
    setShowEditFacultad(true);
  };
  
  const openDeleteFacultad = (facultad: Facultad) => {
    setSelectedFacultad(facultad);
    setShowDeleteFacultad(true);
  };
  
  // ==================== PROGRAMAS ====================
  
  const handleCreatePrograma = () => {
    // Validaciones
    if (!programaForm.nombre.trim()) {
      toast.error('El nombre del programa es obligatorio');
      return;
    }
    
    if (!programaForm.facultadId) {
      toast.error('Debe seleccionar una facultad');
      return;
    }
    
    if (!programaForm.semestres || Number(programaForm.semestres) < 1) {
      toast.error('Debe especificar el número de semestres (mínimo 1)');
      return;
    }
    
    // Crear programa (siempre activo)
    const newPrograma = db.createPrograma({
      codigo: `PROG-${Date.now().toString().slice(-4)}`,
      nombre: programaForm.nombre.trim(),
      facultadId: programaForm.facultadId,
      modalidad: 'presencial',
      nivel: 'pregrado',
      semestres: Number(programaForm.semestres),
      activo: true, // Siempre activo al crear
      fechaCreacion: new Date().toISOString()
    });
    
    // Actualizar lista
    loadProgramas();
    
    // Limpiar y cerrar
    setProgramaForm({ nombre: '', facultadId: '', semestres: '' });
    setShowCreatePrograma(false);
    
    // Notificación
    toast.success('✅ Programa registrado exitosamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  const handleEditPrograma = () => {
    if (!selectedPrograma) return;
    
    // Validaciones
    if (!programaForm.nombre.trim()) {
      toast.error('El nombre del programa es obligatorio');
      return;
    }
    
    if (!programaForm.facultadId) {
      toast.error('Debe seleccionar una facultad');
      return;
    }
    
    if (!programaForm.semestres || Number(programaForm.semestres) < 1) {
      toast.error('Debe especificar el número de semestres (mínimo 1)');
      return;
    }
    
    // Actualizar programa
    db.updatePrograma(selectedPrograma.id, {
      nombre: programaForm.nombre.trim(),
      facultadId: programaForm.facultadId,
      semestres: Number(programaForm.semestres)
    });
    
    // Actualizar lista
    loadProgramas();
    
    // Cerrar modal
    setShowEditPrograma(false);
    setSelectedPrograma(null);
    setProgramaForm({ nombre: '', facultadId: '', semestres: '' });
    
    // Notificación
    toast.success('✅ Programa actualizado correctamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  const handleDeletePrograma = () => {
    if (!selectedPrograma) return;
    
    // Eliminar programa
    db.deletePrograma(selectedPrograma.id);
    
    // Actualizar lista
    loadProgramas();
    
    // Cerrar modal
    setShowDeletePrograma(false);
    setSelectedPrograma(null);
    
    // Notificación
    toast.success('✅ Programa eliminado correctamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  const openEditPrograma = (programa: Programa) => {
    setSelectedPrograma(programa);
    setProgramaForm({ 
      nombre: programa.nombre, 
      facultadId: programa.facultadId,
      semestres: programa.semestres?.toString() || '' 
    });
    setShowEditPrograma(true);
  };
  
  const openDeletePrograma = (programa: Programa) => {
    setSelectedPrograma(programa);
    setShowDeletePrograma(true);
  };
  
  const toggleProgramaActivo = (programa: Programa) => {
    db.updatePrograma(programa.id, {
      activo: !programa.activo
    });
    loadProgramas();
    
    toast.success(
      programa.activo 
        ? 'Programa desactivado' 
        : 'Programa activado'
    );
  };
  
  // ==================== FILTROS ====================
  
  const filteredFacultades = facultades.filter(f => 
    f.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredProgramas = programas.filter(p => {
    const matchSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchFacultad = selectedFacultadFilter === 'all' || p.facultadId === selectedFacultadFilter;
    return matchSearch && matchFacultad;
  });
  
  // Contar programas por facultad
  const getProgramasCount = (facultadId: string) => {
    return programas.filter(p => p.facultadId === facultadId).length;
  };
  
  // Obtener nombre de facultad
  const getFacultadNombre = (facultadId: string) => {
    const facultad = facultades.find(f => f.id === facultadId);
    return facultad?.nombre || 'Sin facultad';
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Facultades y Programas Académicos</h1>
          <p className="text-slate-600">Gestiona la estructura académica de la universidad</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('facultades')}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'facultades'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-5 h-5 inline mr-2" />
          Facultades
        </button>
        <button
          onClick={() => setActiveTab('programas')}
          className={`px-6 py-3 border-b-2 transition-colors ${
            activeTab === 'programas'
              ? 'border-red-600 text-red-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Programas Académicos
        </button>
      </div>

      {/* Search and Actions */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={`Buscar ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Filtro de Facultad (solo en Programas) */}
        {activeTab === 'programas' && (
          <Select value={selectedFacultadFilter} onValueChange={setSelectedFacultadFilter}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todas las facultades" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las facultades</SelectItem>
              {facultades.map(f => (
                <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        <Button 
          onClick={() => activeTab === 'facultades' ? setShowCreateFacultad(true) : setShowCreatePrograma(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          {activeTab === 'facultades' ? 'Nueva Facultad' : 'Nuevo Programa'}
        </Button>
      </div>

      {/* Content */}
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-0">
          {activeTab === 'facultades' ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Programas</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFacultades.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                      No se encontraron facultades
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredFacultades.map((facultad) => (
                    <TableRow key={facultad.id}>
                      <TableCell className="text-slate-900">{facultad.nombre}</TableCell>
                      <TableCell className="text-slate-600">
                        {getProgramasCount(facultad.id)} programa(s)
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => openEditFacultad(facultad)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDeleteFacultad(facultad)}
                            className="border-red-600 text-red-600 hover:bg-red-50"
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
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Facultad</TableHead>
                  <TableHead>Semestres</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProgramas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                      No se encontraron programas
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProgramas.map((programa) => (
                    <TableRow key={programa.id}>
                      <TableCell className="text-slate-900">{programa.nombre}</TableCell>
                      <TableCell className="text-slate-600">{getFacultadNombre(programa.facultadId)}</TableCell>
                      <TableCell className="text-slate-600">{programa.semestres || 0} semestres</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch 
                            checked={programa.activo}
                            onCheckedChange={() => toggleProgramaActivo(programa)}
                          />
                          <span className={programa.activo ? 'text-green-600' : 'text-slate-400'}>
                            {programa.activo ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openEditPrograma(programa)}
                            className="border-blue-600 text-blue-600 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => openDeletePrograma(programa)}
                            className="border-red-600 text-red-600 hover:bg-red-50"
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
          )}
        </CardContent>
      </Card>

      {/* ==================== MODALES FACULTADES ==================== */}
      
      {/* Modal: Crear Facultad */}
      <Dialog open={showCreateFacultad} onOpenChange={setShowCreateFacultad}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Registrar Nueva Facultad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-facultad">Nombre de la Facultad</Label>
              <Input 
                id="nombre-facultad"
                placeholder="Ej: Facultad de Ingeniería"
                value={facultadForm.nombre}
                onChange={(e) => setFacultadForm({ nombre: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFacultad(false);
                setFacultadForm({ nombre: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreateFacultad}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Facultad */}
      <Dialog open={showEditFacultad} onOpenChange={setShowEditFacultad}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Facultad</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre-facultad">Nombre de la Facultad</Label>
              <Input 
                id="edit-nombre-facultad"
                placeholder="Ej: Facultad de Ingeniería"
                value={facultadForm.nombre}
                onChange={(e) => setFacultadForm({ nombre: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditFacultad(false);
                setSelectedFacultad(null);
                setFacultadForm({ nombre: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditFacultad}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Eliminar Facultad */}
      <Dialog open={showDeleteFacultad} onOpenChange={setShowDeleteFacultad}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Está seguro de eliminar la facultad?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también todos los programas asociados a esta facultad.
            </DialogDescription>
          </DialogHeader>
          {selectedFacultad && (
            <div className="py-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600">Facultad a eliminar:</p>
                <p className="text-slate-900">{selectedFacultad.nombre}</p>
                <p className="text-slate-500 mt-2">
                  Programas asociados: {getProgramasCount(selectedFacultad.id)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteFacultad(false);
                setSelectedFacultad(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteFacultad}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODALES PROGRAMAS ==================== */}
      
      {/* Modal: Crear Programa */}
      <Dialog open={showCreatePrograma} onOpenChange={setShowCreatePrograma}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Registrar Nuevo Programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-programa">Nombre del Programa</Label>
              <Input 
                id="nombre-programa"
                placeholder="Ej: Ingeniería de Sistemas"
                value={programaForm.nombre}
                onChange={(e) => setProgramaForm({ ...programaForm, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="facultad-programa">Facultad</Label>
              <Select 
                value={programaForm.facultadId}
                onValueChange={(value) => setProgramaForm({ ...programaForm, facultadId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar facultad" />
                </SelectTrigger>
                <SelectContent>
                  {facultades.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="semestres-programa">Número de Semestres</Label>
              <Input 
                id="semestres-programa"
                type="number"
                min="1"
                max="20"
                placeholder="Ej: 10"
                value={programaForm.semestres}
                onChange={(e) => setProgramaForm({ ...programaForm, semestres: e.target.value })}
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-blue-800">
                ℹ️ El programa se creará como <strong>Activo</strong> automáticamente
              </p>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreatePrograma(false);
                setProgramaForm({ nombre: '', facultadId: '', semestres: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreatePrograma}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Programa */}
      <Dialog open={showEditPrograma} onOpenChange={setShowEditPrograma}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Programa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre-programa">Nombre del Programa</Label>
              <Input 
                id="edit-nombre-programa"
                placeholder="Ej: Ingeniería de Sistemas"
                value={programaForm.nombre}
                onChange={(e) => setProgramaForm({ ...programaForm, nombre: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-facultad-programa">Facultad</Label>
              <Select 
                value={programaForm.facultadId}
                onValueChange={(value) => setProgramaForm({ ...programaForm, facultadId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar facultad" />
                </SelectTrigger>
                <SelectContent>
                  {facultades.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-semestres-programa">Número de Semestres</Label>
              <Input 
                id="edit-semestres-programa"
                type="number"
                min="1"
                max="20"
                placeholder="Ej: 10"
                value={programaForm.semestres}
                onChange={(e) => setProgramaForm({ ...programaForm, semestres: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditPrograma(false);
                setSelectedPrograma(null);
                setProgramaForm({ nombre: '', facultadId: '', semestres: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditPrograma}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Eliminar Programa */}
      <Dialog open={showDeletePrograma} onOpenChange={setShowDeletePrograma}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Está seguro de eliminar el programa?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminarán también todas las asignaturas asociadas.
            </DialogDescription>
          </DialogHeader>
          {selectedPrograma && (
            <div className="py-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600">Programa a eliminar:</p>
                <p className="text-slate-900">{selectedPrograma.nombre}</p>
                <p className="text-slate-500 mt-2">
                  Facultad: {getFacultadNombre(selectedPrograma.facultadId)}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeletePrograma(false);
                setSelectedPrograma(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeletePrograma}
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
