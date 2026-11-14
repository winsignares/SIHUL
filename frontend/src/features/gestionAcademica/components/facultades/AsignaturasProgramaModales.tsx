import { Button } from '../../../../components/ui/button';
import { Label } from '../../../../components/ui/label';
import { Card, CardContent } from '../../../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '../../../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Badge } from '../../../../components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../../components/ui/table';
import { Plus, Trash2, BookOpen } from 'lucide-react';
import { SearchableSelect } from '../../../../components/ui/searchableSelect';


import type { useFacultadesPrograms } from '../../hooks/useFacultadesPrograms';

interface Props {
  hook: ReturnType<typeof useFacultadesPrograms>;
  semestresList: number[];
}

/** Modales para gestionar las asignaturas de un programa y agregar una. */
export function AsignaturasProgramaModales({ hook, semestresList }: Props) {
  const {
    showAsignaturasModal,
    setShowAsignaturasModal,
    showAddAsignaturaModal,
    setShowAddAsignaturaModal,
    asignaturaForm,
    setAsignaturaForm,
    selectedProgramaForAsignaturas,
    openAddAsignaturaModal,
    handleAddAsignatura,
    handleRemoveAsignatura,
    handleUpdateAsignaturaPrograma,
    availableAsignaturas,
    asignaturasBySemestre,
  } = hook;

  return (
    <>
  <Dialog open={showAsignaturasModal} onOpenChange={setShowAsignaturasModal}>
    <DialogContent className="sm:max-w-[60vw] max-h-[90vh] overflow-y-auto w-full">
      <DialogHeader>
        <DialogTitle className="text-slate-900 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-600" />
          Plan de Estudios - {selectedProgramaForAsignaturas?.nombre}
        </DialogTitle>
        <DialogDescription>
          Gestiona las asignaturas del plan de estudios del programa
        </DialogDescription>
      </DialogHeader>

      <div className="py-4 space-y-4">
        {/* Botón para agregar asignatura */}
        <div className="flex justify-end">
          <Button
            onClick={openAddAsignaturaModal}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Agregar Asignatura
          </Button>
        </div>

        {/* Asignaturas agrupadas por semestre */}
        {selectedProgramaForAsignaturas && (
          <div className="space-y-6">
            {Array.from({ length: selectedProgramaForAsignaturas.semestres }, (_, i) => i + 1).map(semestre => {
              const asignaturasDelSemestre = asignaturasBySemestre[semestre] || [];
            
              return (
                <Card key={semestre} className="border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-slate-900 font-semibold">
                        Semestre {semestre}
                      </h3>
                      <Badge variant="outline" className="border-purple-600 text-purple-600">
                        {asignaturasDelSemestre.length} asignaturas
                      </Badge>
                    </div>

                    {asignaturasDelSemestre.length === 0 ? (
                      <p className="text-slate-500 text-sm">No hay asignaturas en este semestre</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Asignatura</TableHead>
                            <TableHead>Créditos</TableHead>
                            <TableHead>Horas</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {asignaturasDelSemestre.map(ap => (
                            <TableRow key={ap.id}>
                              <TableCell>
                                <Badge variant="outline" className="border-purple-600 text-purple-600">
                                  {ap.asignatura_codigo}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-slate-900">{ap.asignatura_nombre}</TableCell>
                              <TableCell className="text-slate-600">{ap.creditos} créditos</TableCell>
                              <TableCell className="text-slate-600">{ap.horas || 0} horas</TableCell>
                              <TableCell>
                                <Select
                                  value={ap.componente_formativo}
                                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                  onValueChange={(value: any) => handleUpdateAsignaturaPrograma(ap, { componente_formativo: value })}
                                >
                                  <SelectTrigger className="w-40">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="básica">Básica</SelectItem>
                                    <SelectItem value="profesional">Profesional</SelectItem>
                                    <SelectItem value="electiva">Electiva</SelectItem>
                                    <SelectItem value="optativa">Optativa</SelectItem>
                                    <SelectItem value="humanística">Humanística</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRemoveAsignatura(ap)}
                                  className="border-red-600 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setShowAsignaturasModal(false)}>
          Cerrar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  {/* Modal: Agregar Asignatura al Programa */}
  <Dialog open={showAddAsignaturaModal} onOpenChange={setShowAddAsignaturaModal}>
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="text-slate-900">Agregar Asignatura al Plan de Estudios</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        {/* Asignatura - SearchableSelect */}
        <div className="space-y-2">
          <Label>Asignatura <span className="text-red-600">*</span></Label>
          <SearchableSelect
            items={availableAsignaturas}
            value={asignaturaForm.asignaturaId ? parseInt(asignaturaForm.asignaturaId) : null}
            onSelect={(asignatura) => setAsignaturaForm({ ...asignaturaForm, asignaturaId: asignatura.id?.toString() || '' })}
            getItemId={(a) => a.id || 0}
            getItemLabel={(a) => `${a.codigo} - ${a.nombre}`}
            placeholder="Seleccionar asignatura..."
            searchPlaceholder="Buscar por código o nombre..."
            emptyMessage="No se encontraron asignaturas"
          />
        </div>

        {/* Semestre - SearchableSelect */}
        <div className="space-y-2">
          <Label>Semestre <span className="text-red-600">*</span></Label>
          <SearchableSelect
            items={semestresList.map(s => ({ id: s, label: `Semestre ${s}` }))}
            value={asignaturaForm.semestre ? parseInt(asignaturaForm.semestre) : null}
            onSelect={(sem) => setAsignaturaForm({ ...asignaturaForm, semestre: sem.id.toString() })}
            getItemId={(s) => s.id}
            getItemLabel={(s) => s.label}
            placeholder="Seleccionar semestre..."
            searchPlaceholder="Buscar semestre..."
            emptyMessage="No se encontraron semestres"
          />
        </div>

        {/* Tipo */}
        <div className="space-y-2">
          <Label>Tipo de Asignatura <span className="text-red-600">*</span></Label>
          <Select value={asignaturaForm.componente_formativo}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onValueChange={(value: any) => setAsignaturaForm({ ...asignaturaForm, componente_formativo: value })}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="básica">Básica</SelectItem>
              <SelectItem value="profesional">Profesional</SelectItem>
              <SelectItem value="electiva">Electiva</SelectItem>
              <SelectItem value="optativa">Optativa</SelectItem>
              <SelectItem value="humanística">Humanística</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter className="gap-2 sm:gap-0">
        <Button variant="outline" onClick={() => {
          setShowAddAsignaturaModal(false);
          setAsignaturaForm({ asignaturaId: '', semestre: '', componente_formativo: 'profesional' });
        }}>Cancelar</Button>
        <Button onClick={handleAddAsignatura} className="bg-purple-600 hover:bg-purple-700">Agregar</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
    </>
  );
}
