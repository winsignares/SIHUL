import { useState, useEffect } from 'react';
import { Button } from '../../share/button';
import { Input } from '../../share/input';
import { Label } from '../../share/label';
import { Card, CardContent } from '../../share/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../share/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../share/table';
import { Plus, Edit, Trash2, Search, AlertTriangle, Check, MapPin, Power, PowerOff } from 'lucide-react';
import { Badge } from '../../share/badge';
import { Toaster } from '../../share/sonner';
import { showNotification } from '../../context/ThemeContext';
import { db } from '../../hooks/database';
import type { Sede } from '../../hooks/models';

export default function Sedes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sedes, setSedes] = useState<Sede[]>([]);
  
  // Estados de modales
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  
  // Estados de formulario
  const [sedeForm, setSedeForm] = useState({ nombre: '' });
  const [selectedSede, setSelectedSede] = useState<Sede | null>(null);
  
  // Cargar datos
  useEffect(() => {
    loadSedes();
  }, []);
  
  const loadSedes = () => {
    const data = db.getSedes();
    setSedes(data);
  };
  
  // Crear sede
  const handleCreate = () => {
    if (!sedeForm.nombre.trim()) {
      showNotification({ message: 'El nombre de la sede es obligatorio', type: 'error' });
      return;
    }
    
    db.createSede({
      codigo: `SEDE-${Date.now().toString().slice(-4)}`,
      nombre: sedeForm.nombre.trim(),
      activa: true,
      fechaCreacion: new Date().toISOString()
    });
    
    loadSedes();
    setSedeForm({ nombre: '' });
    setShowCreate(false);
    
    showNotification({ message: '✅ Sede registrada exitosamente', type: 'success' });
  };
  
  // Editar sede
  const handleEdit = () => {
    if (!selectedSede) return;
    
    if (!sedeForm.nombre.trim()) {
      showNotification({ message: 'El nombre de la sede es obligatorio', type: 'error' });
      return;
    }
    
    db.updateSede(selectedSede.id, {
      nombre: sedeForm.nombre.trim()
    });
    
    loadSedes();
    setShowEdit(false);
    setSelectedSede(null);
    setSedeForm({ nombre: '' });
    
    showNotification({ message: '✅ Sede actualizada correctamente', type: 'success' });
  };
  
  // Eliminar sede
  const handleDelete = () => {
    if (!selectedSede) return;
    
    db.deleteSede(selectedSede.id);
    
    loadSedes();
    setShowDelete(false);
    setSelectedSede(null);
    
    showNotification({ message: '✅ Sede eliminada correctamente', type: 'success' });
  };
  
  // Activar/Inactivar sede
  const toggleActiva = (sede: Sede) => {
    db.updateSede(sede.id, {
      activa: !sede.activa
    });
    loadSedes();
    
    showNotification({ message: sede.activa ? '✅ Sede inactivada correctamente' : '✅ Sede activada correctamente', type: 'success' });
  };
  
  const openEdit = (sede: Sede) => {
    setSelectedSede(sede);
    setSedeForm({ nombre: sede.nombre });
    setShowEdit(true);
  };
  
  const openDelete = (sede: Sede) => {
    setSelectedSede(sede);
    setShowDelete(true);
  };
  
  // Filtros
  const filteredSedes = sedes.filter(s => 
    s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Search and Actions */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Buscar sedes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Button 
          onClick={() => setShowCreate(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nueva Sede
        </Button>
      </div>

      <Card className="border-slate-200 shadow-lg">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSedes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                    No se encontraron sedes
                  </TableCell>
                </TableRow>
              ) : (
                filteredSedes.map((sede) => (
                  <TableRow key={sede.id}>
                    <TableCell className="text-slate-900">{sede.nombre}</TableCell>
                    <TableCell>
                      <Badge 
                        variant={sede.activa ? 'default' : 'secondary'}
                        className={sede.activa ? 'bg-green-600' : 'bg-slate-400'}
                      >
                        {sede.activa ? 'Activa' : 'Inactiva'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => openEdit(sede)}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => toggleActiva(sede)}
                          className={sede.activa 
                            ? "border-orange-600 text-orange-600 hover:bg-orange-50" 
                            : "border-green-600 text-green-600 hover:bg-green-50"
                          }
                        >
                          {sede.activa ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openDelete(sede)}
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

      {/* Modal: Crear Sede */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Registrar Nueva Sede</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nombre-sede">Nombre de la Sede</Label>
              <Input 
                id="nombre-sede"
                placeholder="Ej: Sede Norte"
                value={sedeForm.nombre}
                onChange={(e) => setSedeForm({ nombre: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setSedeForm({ nombre: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleCreate}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Sede */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900">Editar Sede</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-nombre-sede">Nombre de la Sede</Label>
              <Input 
                id="edit-nombre-sede"
                placeholder="Ej: Sede Norte"
                value={sedeForm.nombre}
                onChange={(e) => setSedeForm({ nombre: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowEdit(false);
                setSelectedSede(null);
                setSedeForm({ nombre: '' });
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleEdit}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Eliminar Sede */}
      <Dialog open={showDelete} onOpenChange={setShowDelete}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              ¿Está seguro de eliminar la sede?
            </DialogTitle>
            <DialogDescription>
              Esta acción no se puede deshacer. Se eliminará la sede permanentemente.
            </DialogDescription>
          </DialogHeader>
          {selectedSede && (
            <div className="py-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-slate-600">Sede a eliminar:</p>
                <p className="text-slate-900">{selectedSede.nombre}</p>
              </div>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setShowDelete(false);
                setSelectedSede(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleDelete}
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
