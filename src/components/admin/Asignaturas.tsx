import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Edit, Trash2, Search, BookOpen, AlertTriangle, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { db } from '../../lib/database';
import type { Asignatura, Facultad, Programa } from '../../lib/models';

export default function Asignaturas() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de datos
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [programas, setProgramas] = useState<Programa[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  
  // Filtros
  const [selectedFacultad, setSelectedFacultad] = useState<string>('all');
  const [selectedPrograma, setSelectedPrograma] = useState<string>('all');
  const [selectedSemestre, setSelectedSemestre] = useState<string>('all');
  
  // Modales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  // Formulario
  const [asignaturaForm, setAsignaturaForm] = useState({
    codigo: '',
    nombre: '',
    programaId: '',
    creditos: '',
    horasSemana: '',
    semestre: '',
    tipo: 'teorica' as 'teorica' | 'practica' | 'teorico-practica'
  });
  
  const [selectedAsignatura, setSelectedAsignatura] = useState<Asignatura | null>(null);
  
  // Cargar datos
  useEffect(() => {
    loadFacultades();
    loadProgramas();
    loadAsignaturas();
  }, []);
  
  const loadFacultades = () => {
    setFacultades(db.getFacultades());
  };
  
  const loadProgramas = () => {
    setProgramas(db.getProgramas());
  };
  
  const loadAsignaturas = () => {
    setAsignaturas(db.getAsignaturas());
  };
  
  // Obtener programas filtrados por facultad
  const getProgramasByFacultad = (facultadId: string): Programa[] => {
    if (facultadId === 'all') return programas;
    return programas.filter(p => p.facultadId === facultadId);
  };
  
  // Obtener nombre de entidades
  const getProgramaNombre = (programaId: string) => {
    const programa = programas.find(p => p.id === programaId);
    return programa?.nombre || 'Sin programa';
  };
  
  const getFacultadNombre = (programaId: string) => {
    const programa = programas.find(p => p.id === programaId);
    if (!programa) return 'Sin facultad';
    const facultad = facultades.find(f => f.id === programa.facultadId);
    return facultad?.nombre || 'Sin facultad';
  };
  
  // Tipos de asignatura
  const tiposAsignatura = [
    { value: 'teorica', label: 'Teórica' },
    { value: 'practica', label: 'Práctica' },
    { value: 'teorico-practica', label: 'Teórico-Práctica' }
  ];
  
  // ==================== CREAR ASIGNATURA ====================
  
  const handleCreateAsignatura = () => {
    // Validaciones
    if (!asignaturaForm.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    
    if (!asignaturaForm.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    if (!asignaturaForm.programaId) {
      toast.error('Debe seleccionar un programa');
      return;
    }
    
    if (!asignaturaForm.creditos || Number(asignaturaForm.creditos) < 1) {
      toast.error('Los créditos deben ser mayor a 0');
      return;
    }
    
    if (!asignaturaForm.horasSemana || Number(asignaturaForm.horasSemana) < 1) {
      toast.error('Las horas semanales deben ser mayor a 0');
      return;
    }
    
    if (!asignaturaForm.semestre || Number(asignaturaForm.semestre) < 1) {
      toast.error('El semestre debe ser mayor a 0');
      return;
    }
    
    // Crear asignatura
    db.createAsignatura({
      codigo: asignaturaForm.codigo.trim(),
      nombre: asignaturaForm.nombre.trim(),
      programaId: asignaturaForm.programaId,
      creditos: Number(asignaturaForm.creditos),
      horasSemana: Number(asignaturaForm.horasSemana),
      semestre: Number(asignaturaForm.semestre),
      tipo: asignaturaForm.tipo,
      activa: true,
      fechaCreacion: new Date().toISOString()
    });
    
    // Actualizar lista
    loadAsignaturas();
    
    // Limpiar y cerrar
    resetForm();
    setShowCreateDialog(false);
    
    // Notificación
    toast.success('✅ Asignatura registrada exitosamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  // ==================== EDITAR ASIGNATURA ====================
  
  const openEditDialog = (asignatura: Asignatura) => {
    setSelectedAsignatura(asignatura);
    setAsignaturaForm({
      codigo: asignatura.codigo,
      nombre: asignatura.nombre,
      programaId: asignatura.programaId,
      creditos: asignatura.creditos.toString(),
      horasSemana: asignatura.horasSemana.toString(),
      semestre: asignatura.semestre.toString(),
      tipo: asignatura.tipo
    });
    setShowEditDialog(true);
  };
  
  const handleEditAsignatura = () => {
    if (!selectedAsignatura) return;
    
    // Validaciones (mismas que crear)
    if (!asignaturaForm.codigo.trim()) {
      toast.error('El código es obligatorio');
      return;
    }
    
    if (!asignaturaForm.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }
    
    if (!asignaturaForm.programaId) {
      toast.error('Debe seleccionar un programa');
      return;
    }
    
    if (!asignaturaForm.creditos || Number(asignaturaForm.creditos) < 1) {
      toast.error('Los créditos deben ser mayor a 0');
      return;
    }
    
    if (!asignaturaForm.horasSemana || Number(asignaturaForm.horasSemana) < 1) {
      toast.error('Las horas semanales deben ser mayor a 0');
      return;
    }
    
    if (!asignaturaForm.semestre || Number(asignaturaForm.semestre) < 1) {
      toast.error('El semestre debe ser mayor a 0');
      return;
    }
    
    // Actualizar
    db.updateAsignatura(selectedAsignatura.id, {
      codigo: asignaturaForm.codigo.trim(),
      nombre: asignaturaForm.nombre.trim(),
      programaId: asignaturaForm.programaId,
      creditos: Number(asignaturaForm.creditos),
      horasSemana: Number(asignaturaForm.horasSemana),
      semestre: Number(asignaturaForm.semestre),
      tipo: asignaturaForm.tipo
    });
    
    // Actualizar lista
    loadAsignaturas();
    
    // Cerrar y limpiar
    setShowEditDialog(false);
    setSelectedAsignatura(null);
    resetForm();
    
    // Notificación
    toast.success('✅ Asignatura actualizada correctamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  // ==================== ELIMINAR ASIGNATURA ====================
  
  const openDeleteDialog = (asignatura: Asignatura) => {
    setSelectedAsignatura(asignatura);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteAsignatura = () => {
    if (!selectedAsignatura) return;
    
    // Eliminar
    db.deleteAsignatura(selectedAsignatura.id);
    
    // Actualizar lista
    loadAsignaturas();
    
    // Cerrar
    setShowDeleteDialog(false);
    setSelectedAsignatura(null);
    
    // Notificación
    toast.success('✅ Asignatura eliminada correctamente', {
      duration: 3000,
      icon: <Check className="w-5 h-5 text-green-600" />
    });
  };
  
  // ==================== UTILIDADES ====================
  
  const resetForm = () => {
    setAsignaturaForm({
      codigo: '',
      nombre: '',
      programaId: '',
      creditos: '',
      horasSemana: '',
      semestre: '',
      tipo: 'teorica'
    });
  };
  
  // ==================== FILTROS ====================
  
  const filteredAsignaturas = asignaturas.filter(asignatura => {
    // Búsqueda por texto
    const matchSearch = 
      asignatura.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asignatura.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Filtro por programa
    const matchPrograma = selectedPrograma === 'all' || asignatura.programaId === selectedPrograma;
    
    // Filtro por facultad (indirecto a través de programa)
    let matchFacultad = true;
    if (selectedFacultad !== 'all') {
      const programa = programas.find(p => p.id === asignatura.programaId);
      matchFacultad = programa?.facultadId === selectedFacultad;
    }
    
    // Filtro por semestre
    const matchSemestre = selectedSemestre === 'all' || asignatura.semestre.toString() === selectedSemestre;
    
    return matchSearch && matchPrograma && matchFacultad && matchSemestre;
  });
  
  // Obtener semestres del programa seleccionado
  const getSemestresDisponibles = () => {
    if (selectedPrograma === 'all') {
      // Si no hay programa seleccionado, mostrar todos los semestres de todas las asignaturas
      return Array.from(new Set(asignaturas.map(a => a.semestre))).sort((a, b) => a - b);
    }
    
    // Si hay un programa seleccionado, obtener su número de semestres
    const programa = programas.find(p => p.id === selectedPrograma);
    if (programa && programa.semestres) {
      // Retornar un array del 1 al número de semestres del programa
      return Array.from({ length: programa.semestres }, (_, i) => i + 1);
    }
    
    return [];
  };
  
  const semestresDisponibles = getSemestresDisponibles();
  
  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Asignaturas</h1>
          <p className="text-slate-600">Gestiona las asignaturas de cada programa académico</p>
        </div>
        <Button 
          onClick={() => setShowCreateDialog(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Asignatura
        </Button>
      </div>

      {/* Filtros */}
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Buscar asignatura..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Filtro Facultad */}
            <Select value={selectedFacultad} onValueChange={(value) => {
              setSelectedFacultad(value);
              setSelectedPrograma('all'); // Reset programa al cambiar facultad
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Todas las facultades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las facultades</SelectItem>
                {facultades.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtro Programa */}
            <Select value={selectedPrograma} onValueChange={(value) => {
              setSelectedPrograma(value);
              setSelectedSemestre('all'); // Reset semestre al cambiar programa
            }}>
              <SelectTrigger>
                <SelectValue placeholder="Todos los programas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {getProgramasByFacultad(selectedFacultad).map(p => (
                  <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtro Semestre */}
            <Select 
              value={selectedSemestre} 
              onValueChange={setSelectedSemestre}
              disabled={selectedPrograma === 'all' && semestresDisponibles.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={selectedPrograma === 'all' ? 'Seleccione un programa' : 'Todos los semestres'} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los semestres</SelectItem>
                {semestresDisponibles.map(s => (
                  <SelectItem key={s} value={s.toString()}>Semestre {s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Programa</TableHead>
                <TableHead>Semestre</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAsignaturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <Search className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-900 mb-1">
                          {selectedPrograma !== 'all' && selectedSemestre !== 'all' 
                            ? 'No se encontraron asignaturas registradas para este semestre'
                            : 'No se encontraron asignaturas'}
                        </p>
                        <p className="text-slate-500">
                          {selectedPrograma !== 'all' && selectedSemestre !== 'all'
                            ? 'Intente con otro semestre o cree una nueva asignatura'
                            : 'Ajuste los filtros o cree una nueva asignatura'}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredAsignaturas.map((asignatura) => (
                  <TableRow key={asignatura.id}>
                    <TableCell>
                      <Badge variant="outline" className="border-red-600 text-red-600">
                        {asignatura.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-900">{asignatura.nombre}</TableCell>
                    <TableCell className="text-slate-600">{getProgramaNombre(asignatura.programaId)}</TableCell>
                    <TableCell className="text-slate-600">Semestre {asignatura.semestre}</TableCell>
                    <TableCell className="text-slate-600">{asignatura.creditos} créditos</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={
                          asignatura.tipo === 'teorica' 
                            ? 'border-blue-600 text-blue-600'
                            : asignatura.tipo === 'practica'
                            ? 'border-green-600 text-green-600'
                            : 'border-purple-600 text-purple-600'
                        }
                      >
                        {tiposAsignatura.find(t => t.value === asignatura.tipo)?.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openEditDialog(asignatura)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDeleteDialog(asignatura)}
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
        </CardContent>
      </Card>

      {/* ==================== MODAL: CREAR ASIGNATURA ==================== */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Registrar Nueva Asignatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="codigo">Código *</Label>
                <Input 
                  id="codigo"
                  placeholder="Ej: PROG101"
                  value={asignaturaForm.codigo}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="semestre">Semestre *</Label>
                <Input 
                  id="semestre"
                  type="number"
                  min="1"
                  max="12"
                  placeholder="Ej: 1"
                  value={asignaturaForm.semestre}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, semestre: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input 
                id="nombre"
                placeholder="Ej: Programación I"
                value={asignaturaForm.nombre}
                onChange={(e) => setAsignaturaForm({ ...asignaturaForm, nombre: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="programa">Programa *</Label>
              <Select 
                value={asignaturaForm.programaId}
                onValueChange={(value) => setAsignaturaForm({ ...asignaturaForm, programaId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} ({p.semestres} semestres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditos">Créditos *</Label>
                <Input 
                  id="creditos"
                  type="number"
                  min="1"
                  max="8"
                  placeholder="Ej: 4"
                  value={asignaturaForm.creditos}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, creditos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="horas">Horas/Semana *</Label>
                <Input 
                  id="horas"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="Ej: 6"
                  value={asignaturaForm.horasSemana}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, horasSemana: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Asignatura *</Label>
              <Select 
                value={asignaturaForm.tipo}
                onValueChange={(value: any) => setAsignaturaForm({ ...asignaturaForm, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAsignatura.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              onClick={handleCreateAsignatura}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: EDITAR ASIGNATURA ==================== */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Asignatura</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-codigo">Código *</Label>
                <Input 
                  id="edit-codigo"
                  value={asignaturaForm.codigo}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, codigo: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-semestre">Semestre *</Label>
                <Input 
                  id="edit-semestre"
                  type="number"
                  min="1"
                  max="12"
                  value={asignaturaForm.semestre}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, semestre: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-nombre">Nombre *</Label>
              <Input 
                id="edit-nombre"
                value={asignaturaForm.nombre}
                onChange={(e) => setAsignaturaForm({ ...asignaturaForm, nombre: e.target.value })}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-programa">Programa *</Label>
              <Select 
                value={asignaturaForm.programaId}
                onValueChange={(value) => setAsignaturaForm({ ...asignaturaForm, programaId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.nombre} ({p.semestres} semestres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-creditos">Créditos *</Label>
                <Input 
                  id="edit-creditos"
                  type="number"
                  min="1"
                  max="8"
                  value={asignaturaForm.creditos}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, creditos: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-horas">Horas/Semana *</Label>
                <Input 
                  id="edit-horas"
                  type="number"
                  min="1"
                  max="20"
                  value={asignaturaForm.horasSemana}
                  onChange={(e) => setAsignaturaForm({ ...asignaturaForm, horasSemana: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-tipo">Tipo de Asignatura *</Label>
              <Select 
                value={asignaturaForm.tipo}
                onValueChange={(value: any) => setAsignaturaForm({ ...asignaturaForm, tipo: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tiposAsignatura.map(t => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditDialog(false);
                setSelectedAsignatura(null);
                resetForm();
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEditAsignatura}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== MODAL: ELIMINAR ASIGNATURA ==================== */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Está seguro de eliminar la asignatura?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          {selectedAsignatura && (
            <div className="py-4">
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div>
                  <p className="text-slate-600">Código:</p>
                  <p className="text-slate-900">{selectedAsignatura.codigo}</p>
                </div>
                <div>
                  <p className="text-slate-600">Asignatura:</p>
                  <p className="text-slate-900">{selectedAsignatura.nombre}</p>
                </div>
                <div>
                  <p className="text-slate-600">Programa:</p>
                  <p className="text-slate-900">{getProgramaNombre(selectedAsignatura.programaId)}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteDialog(false);
                setSelectedAsignatura(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDeleteAsignatura}
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
