import { useState, useMemo } from 'react';
import { Button } from '../share/button';
import { Input } from '../share/input';
import { Label } from '../share/label';
import { Card, CardContent } from '../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { Badge } from '../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../share/table';
import { Plus, Edit, Trash2, Building2, Search, Check, AlertTriangle, Users } from 'lucide-react';
import { Switch } from '../share/switch';
import { toast } from 'sonner';
import { useFacultades } from '../hooks/useFacultades';
import { useProgramas } from '../hooks/useProgramas';

export default function FacultadesPrograms() {
  // Estado local UI
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'facultades' | 'programas'>('facultades');
  const [selectedFacultadFilter, setSelectedFacultadFilter] = useState<string>('');
  
  // Hooks con lógica
  const { 
    facultades,
    loading: loadingFacultades, 
    createFacultad, 
    updateFacultad, 
    deleteFacultad,
    error: errorFacultades
  } = useFacultades({ searchTerm: activeTab === 'facultades' ? searchTerm : '' });
  
  const { 
    programas,
    loading: loadingProgramas, 
    createPrograma, 
    updatePrograma, 
    deletePrograma,
    error: errorProgramas
  } = useProgramas({ 
    searchTerm: activeTab === 'programas' ? searchTerm : '', 
    facultadId: selectedFacultadFilter ? Number(selectedFacultadFilter) : undefined
  });
  
  // Estados de modales
  const [showCreateFacultad, setShowCreateFacultad] = useState(false);
  const [showEditFacultad, setShowEditFacultad] = useState(false);
  const [showDeleteFacultad, setShowDeleteFacultad] = useState(false);
  const [showCreatePrograma, setShowCreatePrograma] = useState(false);
  const [showEditPrograma, setShowEditPrograma] = useState(false);
  const [showDeletePrograma, setShowDeletePrograma] = useState(false);
  
  // Estados de formularios
  const [facultadForm, setFacultadForm] = useState({ 
    nombre: '',
    codigo: ''
  });
  
  const [programaForm, setProgramaForm] = useState({ 
    nombre: '',
    codigo: '',
    facultadId: '',
    semestres: '' 
  });
  
  // Estados de selección
  const [selectedFacultad, setSelectedFacultad] = useState<any>(null);
  const [selectedPrograma, setSelectedPrograma] = useState<any>(null);
  
  // ==================== HANDLERS FACULTADES ====================
  
  const handleCreateFacultad = async () => {
    const success = await createFacultad({
      nombre: facultadForm.nombre.trim(),
      codigo: facultadForm.codigo.trim(),
      activo: true
    });
    
    if (success) {
      setFacultadForm({ nombre: '', codigo: '' });
      setShowCreateFacultad(false);
      toast.success('✅ Facultad registrada exitosamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (errorFacultades) {
      toast.error(errorFacultades);
    }
  };
  
  const handleEditFacultad = async () => {
    if (!selectedFacultad) return;
    
    const success = await updateFacultad({
      id: selectedFacultad.id,
      nombre: facultadForm.nombre.trim(),
      codigo: facultadForm.codigo.trim()
    });
    
    if (success) {
      setShowEditFacultad(false);
      setSelectedFacultad(null);
      setFacultadForm({ nombre: '', codigo: '' });
      toast.success('✅ Facultad actualizada correctamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (errorFacultades) {
      toast.error(errorFacultades);
    }
  };
  
  const handleDeleteFacultad = async () => {
    if (!selectedFacultad) return;
    
    const success = await deleteFacultad(selectedFacultad.id);
    
    if (success) {
      setShowDeleteFacultad(false);
      setSelectedFacultad(null);
      toast.success('✅ Facultad eliminada correctamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (errorFacultades) {
      toast.error(errorFacultades);
    }
  };
  
  const openEditFacultad = (facultad: any) => {
    setSelectedFacultad(facultad);
    setFacultadForm({ nombre: facultad.nombre, codigo: facultad.codigo });
    setShowEditFacultad(true);
  };
  
  const openDeleteFacultad = (facultad: any) => {
    setSelectedFacultad(facultad);
    setShowDeleteFacultad(true);
  };
  
  // ==================== HANDLERS PROGRAMAS ====================
  
  const handleCreatePrograma = async () => {
    const success = await createPrograma({
      nombre: programaForm.nombre.trim(),
      codigo: programaForm.codigo.trim(),
      facultad_id: Number(programaForm.facultadId),
      numero_semestres: Number(programaForm.semestres),
      activo: true
    });
    
    if (success) {
      setProgramaForm({ nombre: '', codigo: '', facultadId: '', semestres: '' });
      setShowCreatePrograma(false);
      toast.success('✅ Programa registrado exitosamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (errorProgramas) {
      toast.error(errorProgramas);
    }
  };
  
  const handleEditPrograma = async () => {
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
    
    const success = await updatePrograma({
      id: selectedPrograma.id,
      nombre: programaForm.nombre.trim(),
      codigo: programaForm.codigo.trim(),
      facultad_id: Number(programaForm.facultadId),
      numero_semestres: Number(programaForm.semestres)
    });
    
    if (success) {
      setShowEditPrograma(false);
      setSelectedPrograma(null);
      setProgramaForm({ nombre: '', codigo: '', facultadId: '', semestres: '' });
      toast.success('✅ Programa actualizado correctamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (errorProgramas) {
      toast.error(errorProgramas);
    }
  };
  
  const handleDeletePrograma = async () => {
    if (!selectedPrograma) return;
    
    const success = await deletePrograma(selectedPrograma.id);
    
    if (success) {
      setShowDeletePrograma(false);
      setSelectedPrograma(null);
      toast.success('✅ Programa eliminado correctamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (errorProgramas) {
      toast.error(errorProgramas);
    }
  };
  
  const openEditPrograma = (programa: any) => {
    setSelectedPrograma(programa);
    setProgramaForm({ 
      nombre: programa.nombre,
      codigo: programa.codigo,
      facultadId: programa.facultad_id.toString(),
      semestres: programa.numero_semestres?.toString() || '' 
    });
    setShowEditPrograma(true);
  };
  
  const openDeletePrograma = (programa: any) => {
    setSelectedPrograma(programa);
    setShowDeletePrograma(true);
  };

  // ==================== RENDER ====================
  
  // Filtrar facultades y programas basado en búsqueda
  const filteredFacultades = useMemo(() => {
    if (!searchTerm || activeTab !== 'facultades') return facultades;
    return facultades.filter(f => 
      f.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [facultades, searchTerm, activeTab]);
  
  const filteredProgramas = useMemo(() => {
    let filtered = programas;
    
    // Filtrar por facultad seleccionada
    if (selectedFacultadFilter) {
      filtered = filtered.filter(p => p.facultad_id === Number(selectedFacultadFilter));
    }
    
    // Filtrar por término de búsqueda
    if (searchTerm && activeTab === 'programas') {
      filtered = filtered.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [programas, selectedFacultadFilter, searchTerm, activeTab]);
  
  // Contar programas por facultad
  const getProgramasCount = (facultadId: number) => {
    return programas.filter(p => p.facultad_id === facultadId).length;
  };
  
  // Obtener nombre de facultad
  const getFacultadNombre = (facultadId: number) => {
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
              <SelectItem value="">Todas las facultades</SelectItem>
              {facultades.map(f => (
                <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
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
                      <TableCell className="text-slate-600">{getFacultadNombre(programa.facultad_id)}</TableCell>
                      <TableCell className="text-slate-600">{programa.numero_semestres || 0} semestres</TableCell>
                      <TableCell>
                        <Badge variant={programa.activo ? 'default' : 'secondary'}>
                          {programa.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
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
                onChange={(e) => setFacultadForm({ ...facultadForm, nombre: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateFacultad(false);
                setFacultadForm({ nombre: '', codigo: '' });
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
                onChange={(e) => setFacultadForm({ ...facultadForm, nombre: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditFacultad(false);
                setSelectedFacultad(null);
                setFacultadForm({ nombre: '', codigo: '' });
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
                    <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
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
                setProgramaForm({ nombre: '', codigo: '', facultadId: '', semestres: '' });
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
                    <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
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
                setProgramaForm({ nombre: '', codigo: '', facultadId: '', semestres: '' });
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
