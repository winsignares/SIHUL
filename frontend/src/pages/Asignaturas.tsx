import { useState, useMemo } from 'react';
import { Button } from '../share/button';
import { Input } from '../share/input';
import { Label } from '../share/label';
import { Card, CardContent } from '../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../share/select';
import { Badge } from '../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../share/table';
import { Plus, Edit, Trash2, Search, BookOpen, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useFacultades } from '../hooks/useFacultades';
import { useProgramas } from '../hooks/useProgramas';
import { useAsignaturas } from '../hooks/useAsignaturas';

export default function Asignaturas() {
  // Estado de filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFacultad, setSelectedFacultad] = useState<number | null>(null);
  const [selectedPrograma, setSelectedPrograma] = useState<number | null>(null);
  const [selectedSemestre, setSelectedSemestre] = useState<number | null>(null);

  // Hooks con lógica completa
  const { allFacultades: facultades, getFacultadNombre } = useFacultades();
  const { allProgramas: programas, getProgramasByFacultad, getProgramaNombre } = useProgramas();
  const {
    asignaturas,
    createAsignatura,
    updateAsignatura,
    deleteAsignatura,
    getSemestresDisponibles,
    error
  } = useAsignaturas(programas, {
    searchTerm,
    facultadId: selectedFacultad,
    programaId: selectedPrograma,
    semestre: selectedSemestre
  });
  
  // Estado UI
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedAsignatura, setSelectedAsignatura] = useState<any>(null);
  
  // Formulario
  const [asignaturaForm, setAsignaturaForm] = useState({
    codigo: '',
    nombre: '',
    programaId: '',
    creditos: '',
    horasSemana: '',
    semestre: '',
    tipo: 'obligatoria' as 'obligatoria' | 'electiva'
  });

  // Tipos de asignatura
  const tiposAsignatura = [
    { value: 'obligatoria', label: 'Obligatoria' },
    { value: 'electiva', label: 'Electiva' }
  ];

  // Programas filtrados
  const programasFiltrados = useMemo(() => {
    return getProgramasByFacultad(selectedFacultad);
  }, [selectedFacultad, programas]);

  // Semestres disponibles
  const semestresDisponibles = useMemo(() => {
    return getSemestresDisponibles(selectedPrograma);
  }, [selectedPrograma]);

  // Reset formulario
  const resetForm = () => {
    setAsignaturaForm({
      codigo: '',
      nombre: '',
      programaId: '',
      creditos: '',
      horasSemana: '',
      semestre: '',
      tipo: 'obligatoria'
    });
  };
  
  // ==================== HANDLERS ====================
  
  const handleCreateAsignatura = async () => {
    const success = await createAsignatura({
      codigo: asignaturaForm.codigo.trim(),
      nombre: asignaturaForm.nombre.trim(),
      programa_id: Number(asignaturaForm.programaId),
      creditos: Number(asignaturaForm.creditos),
      horas_semana: Number(asignaturaForm.horasSemana),
      semestre: Number(asignaturaForm.semestre),
      tipo: asignaturaForm.tipo
    });

    if (success) {
      resetForm();
      setShowCreateDialog(false);
      toast.success('✅ Asignatura registrada exitosamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (error) {
      toast.error(error);
    }
  };
  
  const openEditDialog = (asignatura: any) => {
    setSelectedAsignatura(asignatura);
    setAsignaturaForm({
      codigo: asignatura.codigo,
      nombre: asignatura.nombre,
      programaId: asignatura.programa_id.toString(),
      creditos: asignatura.creditos.toString(),
      horasSemana: asignatura.horas_semana.toString(),
      semestre: asignatura.semestre.toString(),
      tipo: asignatura.tipo
    });
    setShowEditDialog(true);
  };
  
  const handleEditAsignatura = async () => {
    if (!selectedAsignatura) return;

    const success = await updateAsignatura({
      id: selectedAsignatura.id,
      codigo: asignaturaForm.codigo.trim(),
      nombre: asignaturaForm.nombre.trim(),
      programa_id: Number(asignaturaForm.programaId),
      creditos: Number(asignaturaForm.creditos),
      horas_semana: Number(asignaturaForm.horasSemana),
      semestre: Number(asignaturaForm.semestre),
      tipo: asignaturaForm.tipo
    });

    if (success) {
      setShowEditDialog(false);
      setSelectedAsignatura(null);
      resetForm();
      toast.success('✅ Asignatura actualizada correctamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (error) {
      toast.error(error);
    }
  };
  
  const openDeleteDialog = (asignatura: any) => {
    setSelectedAsignatura(asignatura);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteAsignatura = async () => {
    if (!selectedAsignatura) return;

    const success = await deleteAsignatura(selectedAsignatura.id);

    if (success) {
      setShowDeleteDialog(false);
      setSelectedAsignatura(null);
      toast.success('✅ Asignatura eliminada correctamente', {
        duration: 3000,
        icon: <Check className="w-5 h-5 text-green-600" />
      });
    } else if (error) {
      toast.error(error);
    }
  };

  // ==================== RENDER ====================
  
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
            <Select 
              value={selectedFacultad?.toString() || 'all'} 
              onValueChange={(value) => {
                setSelectedFacultad(value === 'all' ? null : Number(value));
                setSelectedPrograma(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas las facultades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las facultades</SelectItem>
                {facultades.map(f => (
                  <SelectItem key={f.id} value={f.id.toString()}>{f.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtro Programa */}
            <Select 
              value={selectedPrograma?.toString() || 'all'} 
              onValueChange={(value) => {
                setSelectedPrograma(value === 'all' ? null : Number(value));
                setSelectedSemestre(null);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los programas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los programas</SelectItem>
                {programasFiltrados.map(p => (
                  <SelectItem key={p.id} value={p.id.toString()}>{p.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Filtro Semestre */}
            <Select 
              value={selectedSemestre?.toString() || 'all'} 
              onValueChange={(value) => setSelectedSemestre(value === 'all' ? null : Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos los semestres" />
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
              {asignaturas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                        <BookOpen className="w-8 h-8 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-slate-900 mb-1">No se encontraron asignaturas</p>
                        <p className="text-slate-500">Ajuste los filtros o cree una nueva asignatura</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                asignaturas.map((asignatura: any) => (
                  <TableRow key={asignatura.id}>
                    <TableCell>
                      <Badge variant="outline" className="border-red-600 text-red-600">
                        {asignatura.codigo}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-900">{asignatura.nombre}</TableCell>
                    <TableCell className="text-slate-600">{getProgramaNombre(asignatura.programa_id)}</TableCell>
                    <TableCell className="text-slate-600">Semestre {asignatura.semestre}</TableCell>
                    <TableCell className="text-slate-600">{asignatura.creditos} créditos</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline"
                        className={
                          asignatura.tipo === 'obligatoria' 
                            ? 'border-blue-600 text-blue-600'
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
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre} ({p.numero_semestres} semestres)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="creditos-edit">Créditos *</Label>
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
                    <SelectItem key={p.id} value={p.id.toString()}>
                      {p.nombre} ({p.numero_semestres} semestres)
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
