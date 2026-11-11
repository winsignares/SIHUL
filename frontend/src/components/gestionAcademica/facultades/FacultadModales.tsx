import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../share/dialog';
import { AlertTriangle } from 'lucide-react';


import type { useFacultadesPrograms } from '../../../hooks/gestionAcademica/useFacultadesPrograms';

interface Props {
  hook: ReturnType<typeof useFacultadesPrograms>;
}

/** Modales de crear, editar y eliminar facultad. */
export function FacultadModales({ hook }: Props) {
  const {
    showCreateFacultad,
    setShowCreateFacultad,
    showEditFacultad,
    setShowEditFacultad,
    showDeleteFacultad,
    setShowDeleteFacultad,
    facultadForm,
    setFacultadForm,
    selectedFacultad,
    setSelectedFacultad,
    handleCreateFacultad,
    handleEditFacultad,
    handleDeleteFacultad,
    getProgramasCount,
  } = hook;

  return (
    <>
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
              Programas asociados: {selectedFacultad.id ? getProgramasCount(selectedFacultad.id) : 0}
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
    </>
  );
}
