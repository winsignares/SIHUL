import { Button } from '../../../../components/ui/button';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { AlertTriangle } from 'lucide-react';


import type { useFacultadesPrograms } from '../../hooks/useFacultadesPrograms';

interface Props {
  hook: ReturnType<typeof useFacultadesPrograms>;
}

/** Modales de crear, editar y eliminar programa. */
export function ProgramaModales({ hook }: Props) {
  const {
    showCreatePrograma,
    setShowCreatePrograma,
    showEditPrograma,
    setShowEditPrograma,
    showDeletePrograma,
    setShowDeletePrograma,
    programaForm,
    setProgramaForm,
    selectedPrograma,
    setSelectedPrograma,
    handleCreatePrograma,
    handleEditPrograma,
    handleDeletePrograma,
    getFacultadNombre,
    activeFacultades,
  } = hook;

  return (
    <>
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
              {activeFacultades.map(f => (
                <SelectItem key={f.id} value={f.id?.toString() || ''}>{f.nombre}</SelectItem>
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
              {activeFacultades.map(f => (
                <SelectItem key={f.id} value={f.id?.toString() || ''}>{f.nombre}</SelectItem>
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
    </>
  );
}
