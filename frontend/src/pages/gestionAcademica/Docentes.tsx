import { useState, useEffect } from 'react';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Search, User, AlertTriangle, Check, X, Eye, Mail, Phone, GraduationCap } from 'lucide-react';
import { motion } from 'motion/react';
import { Toaster } from '../../share/sonner';
import { db } from '../../hooks/database';
import type { Facultad, Asignatura } from '../../hooks/models';

// Interfaz extendida para Docente
export interface DocenteExtendido {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  especialidad?: string;
  facultades: string[]; // IDs de facultades
  asignaturas: string[]; // IDs de asignaturas
  estado: 'activo' | 'inactivo' | 'licencia';
  fechaCreacion: string;
}

export default function Docentes() {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de datos
  const [facultades, setFacultades] = useState<Facultad[]>([]);
  const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
  const [docentes, setDocentes] = useState<DocenteExtendido[]>([]);
  
  // Filtros
  const [selectedFacultad, setSelectedFacultad] = useState<string>('all');
  const [selectedEstado, setSelectedEstado] = useState<string>('all');
  
  // Modales
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDetallesDialog, setShowDetallesDialog] = useState(false);
  
  // Formulario
  const [docenteForm, setDocenteForm] = useState({
    nombre: '',
    email: '',
    telefono: '',
    especialidad: '',
    estado: 'activo' as 'activo' | 'inactivo' | 'licencia'
  });
  
  // Facultades y asignaturas seleccionadas
  const [facultadesSeleccionadas, setFacultadesSeleccionadas] = useState<string[]>([]);
  const [asignaturasSeleccionadas, setAsignaturasSeleccionadas] = useState<string[]>([]);
  const [facultadActual, setFacultadActual] = useState<string>('');
  const [asignaturaActual, setAsignaturaActual] = useState<string>('');
  
  const [selectedDocente, setSelectedDocente] = useState<DocenteExtendido | null>(null);
  
  // Cargar datos
  useEffect(() => {
    loadFacultades();
    loadAsignaturas();
    loadDocentes();
  }, []);
  
  const loadFacultades = () => {
    setFacultades(db.getFacultades());
  };
  
  const loadAsignaturas = () => {
    setAsignaturas(db.getAsignaturas());
  };
  
  const loadDocentes = () => {
    const docentesData = db.getDocentes();
    setDocentes(docentesData);
  };
  
  // Obtener nombre de entidades
  const getFacultadNombre = (facultadId: string) => {
    const facultad = facultades.find(f => f.id === facultadId);
    return facultad?.nombre || 'Sin facultad';
  };
  
  const getAsignaturaNombre = (asignaturaId: string) => {
    const asignatura = asignaturas.find(a => a.id === asignaturaId);
    return asignatura?.nombre || 'Sin asignatura';
  };
  
  // Estados del docente
  const estadosDocente = [
    { value: 'activo', label: 'Activo', color: 'bg-green-100 text-green-800' },
    { value: 'inactivo', label: 'Inactivo', color: 'bg-red-100 text-red-800' },
    { value: 'licencia', label: 'En Licencia', color: 'bg-yellow-100 text-yellow-800' }
  ];
  
  const getEstadoColor = (estado: string) => {
    const estadoObj = estadosDocente.find(e => e.value === estado);
    return estadoObj?.color || 'bg-gray-100 text-gray-800';
  };
  
  const getEstadoLabel = (estado: string) => {
    const estadoObj = estadosDocente.find(e => e.value === estado);
    return estadoObj?.label || estado;
  };
  
  // ==================== FACULTADES ====================
  
  const agregarFacultad = () => {
    if (!facultadActual) {
      // Mostrar notificación: Debe seleccionar una facultad
      return;
    }
    
    if (facultadesSeleccionadas.includes(facultadActual)) {
      // Mostrar notificación: Esta facultad ya ha sido agregada
      return;
    }
    
    setFacultadesSeleccionadas(prev => [...prev, facultadActual]);
    setFacultadActual('');
    
    // Mostrar notificación: ✅ Facultad agregada correctamente
  };
  
  const eliminarFacultad = (facultadId: string) => {
    setFacultadesSeleccionadas(prev => prev.filter(f => f !== facultadId));
    // Mostrar notificación: Facultad eliminada
  };
  
  // ==================== ASIGNATURAS ====================
  
  const agregarAsignatura = () => {
    if (!asignaturaActual) {
      // Mostrar notificación: Debe seleccionar una asignatura
      return;
    }
    
    if (asignaturasSeleccionadas.includes(asignaturaActual)) {
      // Mostrar notificación: Esta asignatura ya ha sido agregada
      return;
    }
    
    setAsignaturasSeleccionadas(prev => [...prev, asignaturaActual]);
    setAsignaturaActual('');
    
    // Mostrar notificación: ✅ Asignatura agregada correctamente
  };
  
  const eliminarAsignatura = (asignaturaId: string) => {
    setAsignaturasSeleccionadas(prev => prev.filter(a => a !== asignaturaId));
    // Mostrar notificación: Asignatura eliminada
  };
  
  // ==================== CREAR DOCENTE ====================
  
  const handleCreateDocente = () => {
    // Validaciones
    if (!docenteForm.nombre.trim()) {
      // Mostrar notificación: El nombre es obligatorio
      return;
    }
    
    if (!docenteForm.email.trim()) {
      // Mostrar notificación: El email es obligatorio
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(docenteForm.email)) {
      // Mostrar notificación: El email no tiene un formato válido
      return;
    }
    
    if (facultadesSeleccionadas.length === 0) {
      // Mostrar notificación: Debe seleccionar al menos una facultad
      return;
    }
    
    if (asignaturasSeleccionadas.length === 0) {
      // Mostrar notificación: Debe seleccionar al menos una asignatura
      return;
    }
    
    // Crear docente
    const newDocente: DocenteExtendido = {
      id: `DOC-${Date.now()}`,
      nombre: docenteForm.nombre.trim(),
      email: docenteForm.email.trim(),
      telefono: docenteForm.telefono.trim(),
      especialidad: docenteForm.especialidad.trim(),
      facultades: facultadesSeleccionadas,
      asignaturas: asignaturasSeleccionadas,
      estado: docenteForm.estado,
      fechaCreacion: new Date().toISOString()
    };
    
    db.createDocente(newDocente);
    
    // Actualizar lista
    loadDocentes();
    
    // Limpiar formulario
    resetForm();
    setShowCreateDialog(false);
    
    // Mostrar notificación: ✅ Docente registrado exitosamente
  };
  
  // ==================== EDITAR DOCENTE ====================
  
  const openEditDialog = (docente: DocenteExtendido) => {
    setSelectedDocente(docente);
    setDocenteForm({
      nombre: docente.nombre,
      email: docente.email,
      telefono: docente.telefono || '',
      especialidad: docente.especialidad || '',
      estado: docente.estado
    });
    setFacultadesSeleccionadas(docente.facultades);
    setAsignaturasSeleccionadas(docente.asignaturas);
    setShowEditDialog(true);
  };
  
  const handleEditDocente = () => {
    if (!selectedDocente) return;
    
    // Validaciones
    if (!docenteForm.nombre.trim()) {
      // Mostrar notificación: El nombre es obligatorio
      return;
    }
    
    if (!docenteForm.email.trim()) {
      // Mostrar notificación: El email es obligatorio
      return;
    }
    
    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(docenteForm.email)) {
      // Mostrar notificación: El email no tiene un formato válido
      return;
    }
    
    if (facultadesSeleccionadas.length === 0) {
      // Mostrar notificación: Debe seleccionar al menos una facultad
      return;
    }
    
    if (asignaturasSeleccionadas.length === 0) {
      // Mostrar notificación: Debe seleccionar al menos una asignatura
      return;
    }
    
    // Actualizar docente
    const updatedDocente: DocenteExtendido = {
      ...selectedDocente,
      nombre: docenteForm.nombre.trim(),
      email: docenteForm.email.trim(),
      telefono: docenteForm.telefono.trim(),
      especialidad: docenteForm.especialidad.trim(),
      facultades: facultadesSeleccionadas,
      asignaturas: asignaturasSeleccionadas,
      estado: docenteForm.estado
    };
    
    db.updateDocente(selectedDocente.id, updatedDocente);
    
    // Actualizar lista
    loadDocentes();
    
    // Cerrar modal
    setShowEditDialog(false);
    resetForm();
    setSelectedDocente(null);
    
    // Mostrar notificación: ✅ Docente actualizado correctamente
  };
  
  // ==================== ELIMINAR DOCENTE ====================
  
  const openDeleteDialog = (docente: DocenteExtendido) => {
    setSelectedDocente(docente);
    setShowDeleteDialog(true);
  };
  
  const handleDeleteDocente = () => {
    if (!selectedDocente) return;
    
    db.deleteDocente(selectedDocente.id);
    
    // Actualizar lista
    loadDocentes();
    
    // Cerrar modal
    setShowDeleteDialog(false);
    setSelectedDocente(null);
    
    // Mostrar notificación: ✅ Docente eliminado correctamente
  };
  
  // ==================== VER DETALLES ====================
  
  const openDetallesDialog = (docente: DocenteExtendido) => {
    setSelectedDocente(docente);
    setShowDetallesDialog(true);
  };
  
  // ==================== UTILIDADES ====================
  
  const resetForm = () => {
    setDocenteForm({
      nombre: '',
      email: '',
      telefono: '',
      especialidad: '',
      estado: 'activo'
    });
    setFacultadesSeleccionadas([]);
    setAsignaturasSeleccionadas([]);
    setFacultadActual('');
    setAsignaturaActual('');
  };
  
  const openCreateDialog = () => {
    resetForm();
    setShowCreateDialog(true);
  };
  
  // ==================== FILTROS ====================
  
  const docentesFiltrados = docentes.filter(docente => {
    const matchSearch = docente.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       docente.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                       docente.especialidad?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchFacultad = selectedFacultad === 'all' || 
                         docente.facultades.includes(selectedFacultad);
    
    const matchEstado = selectedEstado === 'all' || docente.estado === selectedEstado;
    
    return matchSearch && matchFacultad && matchEstado;
  });
  
  // ==================== RENDER ====================
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-slate-900 mb-1">Gestión de Docentes</h2>
          <p className="text-slate-600">Administra los docentes, sus facultades y asignaturas asignadas</p>
        </div>
        <Button onClick={openCreateDialog} className="bg-red-600 hover:bg-red-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Agregar Docente
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="md:col-span-2">
              <Label className="text-slate-700 mb-2">Buscar Docente</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <Input
                  placeholder="Nombre, email o especialidad..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtro Facultad */}
            <div>
              <Label className="text-slate-700 mb-2">Facultad</Label>
              <Select value={selectedFacultad} onValueChange={setSelectedFacultad}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las facultades</SelectItem>
                  {facultades.map(facultad => (
                    <SelectItem key={facultad.id} value={facultad.id}>
                      {facultad.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Estado */}
            <div>
              <Label className="text-slate-700 mb-2">Estado</Label>
              <Select value={selectedEstado} onValueChange={setSelectedEstado}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {estadosDocente.map(estado => (
                    <SelectItem key={estado.value} value={estado.value}>
                      {estado.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-slate-600">
              {docentesFiltrados.length} docente{docentesFiltrados.length !== 1 ? 's' : ''} encontrado{docentesFiltrados.length !== 1 ? 's' : ''}
            </p>
          </div>

          {docentesFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No se encontraron docentes</p>
              <p className="text-slate-500 text-sm mt-2">
                {searchTerm || selectedFacultad !== 'all' || selectedEstado !== 'all'
                  ? 'Intenta ajustar los filtros de búsqueda'
                  : 'Comienza agregando tu primer docente'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Especialidad</TableHead>
                    <TableHead>Facultades</TableHead>
                    <TableHead>Asignaturas</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docentesFiltrados.map((docente) => (
                    <motion.tr
                      key={docente.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="hover:bg-slate-50"
                    >
                      <TableCell>
                        <div>
                          <p className="text-slate-900">{docente.nombre}</p>
                          {docente.telefono && (
                            <p className="text-slate-500 text-sm flex items-center gap-1 mt-1">
                              <Phone className="w-3 h-3" />
                              {docente.telefono}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-slate-600">
                          <Mail className="w-4 h-4" />
                          {docente.email}
                        </div>
                      </TableCell>
                      <TableCell>
                        {docente.especialidad ? (
                          <div className="flex items-center gap-2 text-slate-600">
                            <GraduationCap className="w-4 h-4" />
                            {docente.especialidad}
                          </div>
                        ) : (
                          <span className="text-slate-400">Sin especialidad</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {docente.facultades.slice(0, 2).map(facultadId => (
                            <Badge key={facultadId} variant="outline" className="text-xs">
                              {getFacultadNombre(facultadId)}
                            </Badge>
                          ))}
                          {docente.facultades.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{docente.facultades.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {docente.asignaturas.slice(0, 2).map(asignaturaId => (
                            <Badge key={asignaturaId} variant="outline" className="text-xs">
                              {getAsignaturaNombre(asignaturaId)}
                            </Badge>
                          ))}
                          {docente.asignaturas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{docente.asignaturas.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getEstadoColor(docente.estado)}>
                          {getEstadoLabel(docente.estado)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetallesDialog(docente)}
                            className="text-slate-600 hover:text-slate-900"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(docente)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteDialog(docente)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Crear Docente */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Agregar Nuevo Docente</DialogTitle>
            <DialogDescription>
              Complete la información del docente, sus facultades y asignaturas asignadas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información Básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-700 mb-2">Nombre Completo *</Label>
                <Input
                  placeholder="Ej: Dr. Juan Pérez López"
                  value={docenteForm.nombre}
                  onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Email *</Label>
                <Input
                  type="email"
                  placeholder="docente@unilibre.edu.co"
                  value={docenteForm.email}
                  onChange={(e) => setDocenteForm({ ...docenteForm, email: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Teléfono</Label>
                <Input
                  placeholder="+57 300 123 4567"
                  value={docenteForm.telefono}
                  onChange={(e) => setDocenteForm({ ...docenteForm, telefono: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Especialidad</Label>
                <Input
                  placeholder="Ej: Matemáticas, Derecho Civil"
                  value={docenteForm.especialidad}
                  onChange={(e) => setDocenteForm({ ...docenteForm, especialidad: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Estado *</Label>
                <Select
                  value={docenteForm.estado}
                  onValueChange={(value: any) => setDocenteForm({ ...docenteForm, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosDocente.map(estado => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Facultades */}
            <div>
              <Label className="text-slate-700 mb-2">Facultades *</Label>
              <div className="flex gap-2 mb-3">
                <Select value={facultadActual} onValueChange={setFacultadActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione una facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultades.map(facultad => (
                      <SelectItem key={facultad.id} value={facultad.id}>
                        {facultad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={agregarFacultad} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {facultadesSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {facultadesSeleccionadas.map(facultadId => (
                    <Badge key={facultadId} variant="secondary" className="flex items-center gap-2">
                      {getFacultadNombre(facultadId)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => eliminarFacultad(facultadId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Asignaturas */}
            <div>
              <Label className="text-slate-700 mb-2">Asignaturas que puede dictar *</Label>
              <div className="flex gap-2 mb-3">
                <Select value={asignaturaActual} onValueChange={setAsignaturaActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturas.map(asignatura => (
                      <SelectItem key={asignatura.id} value={asignatura.id}>
                        {asignatura.nombre} - {asignatura.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={agregarAsignatura} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {asignaturasSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {asignaturasSeleccionadas.map(asignaturaId => (
                    <Badge key={asignaturaId} variant="secondary" className="flex items-center gap-2">
                      {getAsignaturaNombre(asignaturaId)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => eliminarAsignatura(asignaturaId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateDocente} className="bg-red-600 hover:bg-red-700 text-white">
              Guardar Docente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Editar Docente */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Docente</DialogTitle>
            <DialogDescription>
              Modifique la información del docente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Información Básica */}
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label className="text-slate-700 mb-2">Nombre Completo *</Label>
                <Input
                  placeholder="Ej: Dr. Juan Pérez López"
                  value={docenteForm.nombre}
                  onChange={(e) => setDocenteForm({ ...docenteForm, nombre: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Email *</Label>
                <Input
                  type="email"
                  placeholder="docente@unilibre.edu.co"
                  value={docenteForm.email}
                  onChange={(e) => setDocenteForm({ ...docenteForm, email: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Teléfono</Label>
                <Input
                  placeholder="+57 300 123 4567"
                  value={docenteForm.telefono}
                  onChange={(e) => setDocenteForm({ ...docenteForm, telefono: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Especialidad</Label>
                <Input
                  placeholder="Ej: Matemáticas, Derecho Civil"
                  value={docenteForm.especialidad}
                  onChange={(e) => setDocenteForm({ ...docenteForm, especialidad: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-slate-700 mb-2">Estado *</Label>
                <Select
                  value={docenteForm.estado}
                  onValueChange={(value: any) => setDocenteForm({ ...docenteForm, estado: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {estadosDocente.map(estado => (
                      <SelectItem key={estado.value} value={estado.value}>
                        {estado.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Facultades */}
            <div>
              <Label className="text-slate-700 mb-2">Facultades *</Label>
              <div className="flex gap-2 mb-3">
                <Select value={facultadActual} onValueChange={setFacultadActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione una facultad" />
                  </SelectTrigger>
                  <SelectContent>
                    {facultades.map(facultad => (
                      <SelectItem key={facultad.id} value={facultad.id}>
                        {facultad.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={agregarFacultad} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {facultadesSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {facultadesSeleccionadas.map(facultadId => (
                    <Badge key={facultadId} variant="secondary" className="flex items-center gap-2">
                      {getFacultadNombre(facultadId)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => eliminarFacultad(facultadId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Asignaturas */}
            <div>
              <Label className="text-slate-700 mb-2">Asignaturas que puede dictar *</Label>
              <div className="flex gap-2 mb-3">
                <Select value={asignaturaActual} onValueChange={setAsignaturaActual}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Seleccione una asignatura" />
                  </SelectTrigger>
                  <SelectContent>
                    {asignaturas.map(asignatura => (
                      <SelectItem key={asignatura.id} value={asignatura.id}>
                        {asignatura.nombre} - {asignatura.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" onClick={agregarAsignatura} variant="outline">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              
              {asignaturasSeleccionadas.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {asignaturasSeleccionadas.map(asignaturaId => (
                    <Badge key={asignaturaId} variant="secondary" className="flex items-center gap-2">
                      {getAsignaturaNombre(asignaturaId)}
                      <X
                        className="w-3 h-3 cursor-pointer hover:text-red-600"
                        onClick={() => eliminarAsignatura(asignaturaId)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditDocente} className="bg-red-600 hover:bg-red-700 text-white">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Eliminar */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Confirmar Eliminación
            </DialogTitle>
            <DialogDescription>
              ¿Está seguro de eliminar al docente <strong>{selectedDocente?.nombre}</strong>?
              <br />
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDeleteDocente} className="bg-red-600 hover:bg-red-700 text-white">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Detalles */}
      <Dialog open={showDetallesDialog} onOpenChange={setShowDetallesDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalles del Docente</DialogTitle>
          </DialogHeader>

          {selectedDocente && (
            <div className="space-y-4">
              {/* Información Personal */}
              <div className="border-b pb-4">
                <h3 className="text-slate-900 mb-3">Información Personal</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-500 text-sm">Nombre</Label>
                    <p className="text-slate-900">{selectedDocente.nombre}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-sm">Email</Label>
                    <p className="text-slate-900">{selectedDocente.email}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-sm">Teléfono</Label>
                    <p className="text-slate-900">{selectedDocente.telefono || 'No especificado'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-sm">Especialidad</Label>
                    <p className="text-slate-900">{selectedDocente.especialidad || 'No especificada'}</p>
                  </div>
                  <div>
                    <Label className="text-slate-500 text-sm">Estado</Label>
                    <Badge className={getEstadoColor(selectedDocente.estado)}>
                      {getEstadoLabel(selectedDocente.estado)}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Facultades */}
              <div className="border-b pb-4">
                <h3 className="text-slate-900 mb-3">Facultades Asignadas</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDocente.facultades.map(facultadId => (
                    <Badge key={facultadId} variant="outline">
                      {getFacultadNombre(facultadId)}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Asignaturas */}
              <div>
                <h3 className="text-slate-900 mb-3">Asignaturas que puede dictar</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedDocente.asignaturas.map(asignaturaId => (
                    <Badge key={asignaturaId} variant="secondary">
                      {getAsignaturaNombre(asignaturaId)}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDetallesDialog(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Toaster />
    </div>
  );
}
