import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../share/select';
import { Badge } from '../../share/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Building2, Search, Users, AlertTriangle, BookOpen, GitMerge, MapPin, Boxes, Power, PowerOff } from 'lucide-react';

import { useFacultadesPrograms, type TabOption } from '../../hooks/gestionAcademica/useFacultadesPrograms';

import Asignaturas from './Asignaturas';
import GruposFusion from './GruposFusion';
import EspaciosFisicos from './EspaciosFisicos';
import EstadoRecursos from './EstadoRecursos';
import Grupos from './Grupos';
import Sedes from './Sedes';
import Docentes from './Docentes';

export default function FacultadesPrograms() {
  const {
    searchTerm, setSearchTerm,
    activeTab, setActiveTab,
    facultades,
    showCreateFacultad, setShowCreateFacultad,
    showEditFacultad, setShowEditFacultad,
    showDeleteFacultad, setShowDeleteFacultad,
    showCreatePrograma, setShowCreatePrograma,
    showEditPrograma, setShowEditPrograma,
    showDeletePrograma, setShowDeletePrograma,
    facultadForm, setFacultadForm,
    programaForm, setProgramaForm,
    selectedFacultad, setSelectedFacultad,
    selectedPrograma, setSelectedPrograma,
    selectedFacultadFilter, setSelectedFacultadFilter,
    reloadKey,
    handleCreateFacultad,
    handleEditFacultad,
    handleDeleteFacultad,
    openEditFacultad,
    openDeleteFacultad,
    toggleFacultadActiva,
    handleCreatePrograma,
    handleEditPrograma,
    handleDeletePrograma,
    openEditPrograma,
    openDeletePrograma,
    toggleProgramaActivo,
    filteredFacultades,
    filteredProgramas,
    getProgramasCount,
    getFacultadNombre
  } = useFacultadesPrograms();

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-slate-900 mb-2">Centro Institucional</h1>
          <p className="text-slate-600">Gestiona la estructura académica completa de la universidad</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('sedes')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'sedes'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <MapPin className="w-5 h-5 inline mr-2" />
          Sedes
        </button>
        <button
          onClick={() => setActiveTab('facultades')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'facultades'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Building2 className="w-5 h-5 inline mr-2" />
          Facultades
        </button>
        <button
          onClick={() => setActiveTab('programas')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'programas'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Programas Académicos
        </button>
        <button
          onClick={() => setActiveTab('asignaturas')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'asignaturas'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <BookOpen className="w-5 h-5 inline mr-2" />
          Asignaturas
        </button>
        <button
          onClick={() => setActiveTab('docentes')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'docentes'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Docentes
        </button>
        <button
          onClick={() => setActiveTab('grupos')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'grupos'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Users className="w-5 h-5 inline mr-2" />
          Grupos
        </button>
        <button
          onClick={() => setActiveTab('fusion')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'fusion'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <GitMerge className="w-5 h-5 inline mr-2" />
          Fusión de Grupos
        </button>
        <button
          onClick={() => setActiveTab('espacios')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'espacios'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <MapPin className="w-5 h-5 inline mr-2" />
          Espacios Físicos
        </button>
        <button
          onClick={() => setActiveTab('recursos')}
          className={`px-6 py-3 border-b-2 transition-colors ${activeTab === 'recursos'
            ? 'border-red-600 text-red-600'
            : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
        >
          <Boxes className="w-5 h-5 inline mr-2" />
          Estado de Recursos
        </button>
      </div>

      {/* Content */}
      {activeTab === 'sedes' ? (
        <Sedes key={reloadKey} />
      ) : activeTab === 'asignaturas' ? (
        <Asignaturas key={reloadKey} />
      ) : activeTab === 'docentes' ? (
        <Docentes key={reloadKey} />
      ) : activeTab === 'grupos' ? (
        <Grupos key={reloadKey} />
      ) : activeTab === 'fusion' ? (
        <GruposFusion key={reloadKey} />
      ) : activeTab === 'espacios' ? (
        <EspaciosFisicos key={reloadKey} />
      ) : activeTab === 'recursos' ? (
        <EstadoRecursos key={reloadKey} />
      ) : (
        <>
          {/* Search and Actions - Solo para Facultades y Programas */}
          {/* Header con botón */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-slate-900 text-lg font-semibold">
                {activeTab === 'facultades' ? 'Gestión de Facultades' : 'Gestión de Programas'}
              </h2>
            </div>
            <Button
              onClick={() => activeTab === 'facultades' ? setShowCreateFacultad(true) : setShowCreatePrograma(true)}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              {activeTab === 'facultades' ? 'Nueva Facultad' : 'Nuevo Programa'}
            </Button>
          </div>

          {/* Filtros en Card */}
          <Card className="mb-6 border-slate-200 shadow-sm">
            <CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-1 relative">
                  <Label className="text-slate-700 mb-2 block">Buscar</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                      placeholder={`Buscar ${activeTab}...`}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Filtro de Facultad (solo en Programas) */}
                {activeTab === 'programas' && (
                  <div className="w-64">
                    <Label className="text-slate-700 mb-2 block">Facultad</Label>
                    <Select value={selectedFacultadFilter} onValueChange={setSelectedFacultadFilter}>
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
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg">
            <CardContent className="p-0">
              {activeTab === 'facultades' ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Programas</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFacultades.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-slate-500 py-8">
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
                          <TableCell>
                            <Badge
                              variant={facultad.activa ? 'default' : 'secondary'}
                              className={facultad.activa ? 'bg-green-600' : 'bg-slate-400'}
                            >
                              {facultad.activa ? 'Activa' : 'Inactiva'}
                            </Badge>
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
                                onClick={() => toggleFacultadActiva(facultad)}
                                className={facultad.activa
                                  ? "border-orange-600 text-orange-600 hover:bg-orange-50"
                                  : "border-green-600 text-green-600 hover:bg-green-50"
                                }
                              >
                                {facultad.activa ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
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
                            <Badge
                              variant={programa.activo ? 'default' : 'secondary'}
                              className={programa.activo ? 'bg-green-600' : 'bg-slate-400'}
                            >
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
                                onClick={() => toggleProgramaActivo(programa)}
                                className={programa.activo
                                  ? "border-orange-600 text-orange-600 hover:bg-orange-50"
                                  : "border-green-600 text-green-600 hover:bg-green-50"
                                }
                              >
                                {programa.activo ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
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
        </>
      )}

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
                max="12"
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
                max="12"
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
              Esta acción no se puede deshacer.
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