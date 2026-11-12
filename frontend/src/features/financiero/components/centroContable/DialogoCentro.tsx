import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import type { CentroCosto } from '../../models/core.models';
import { CENTRO_ESTADOS, CENTRO_TIPOS } from '../../hooks/contabilidad/centroContableUtils';
import type { useCentroContable } from '../../hooks/contabilidad/useCentroContable';

type CentroContable = ReturnType<typeof useCentroContable>;

/** Diálogo para crear o editar un centro de costo. */
export function DialogoCentro({
  centroDialogOpen,
  setCentroDialogOpen,
  centroForm,
  setCentroForm,
  guardarCentro,
  savingCentro,
  departamentos,
  loadingDepartamentos
}: Pick<CentroContable, 'centroDialogOpen' | 'setCentroDialogOpen' | 'centroForm' | 'setCentroForm' | 'guardarCentro' | 'savingCentro' | 'departamentos' | 'loadingDepartamentos'>) {
  return (
    <Dialog open={centroDialogOpen} onOpenChange={setCentroDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{centroForm.id ? 'Editar centro de costo' : 'Nuevo centro de costo'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Código</Label>
            <Input value={centroForm.codigo} onChange={(event) => setCentroForm((prev) => ({ ...prev, codigo: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={centroForm.nombre} onChange={(event) => setCentroForm((prev) => ({ ...prev, nombre: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Tipo</Label>
            <Select value={centroForm.tipo} onValueChange={(value) => setCentroForm((prev) => ({ ...prev, tipo: value as CentroCosto['tipo'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo" />
              </SelectTrigger>
              <SelectContent>
                {CENTRO_TIPOS.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Departamento</Label>
            <Select
              value={centroForm.departamento_id ? String(centroForm.departamento_id) : 'none'}
              onValueChange={(value) => setCentroForm((prev) => ({ ...prev, departamento_id: value === 'none' ? null : Number(value) }))}
              disabled={loadingDepartamentos}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sin departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin departamento</SelectItem>
                {departamentos.map((departamento) => (
                  <SelectItem key={departamento.id} value={String(departamento.id)}>{departamento.nombre}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Presupuesto asignado</Label>
            <Input
              type="number"
              inputMode="decimal"
              value={centroForm.presupuesto_asignado ?? ''}
              onChange={(event) => setCentroForm((prev) => ({ ...prev, presupuesto_asignado: event.target.value }))}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label>Estado</Label>
            <Select value={centroForm.estado} onValueChange={(value) => setCentroForm((prev) => ({ ...prev, estado: value as CentroCosto['estado'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {CENTRO_ESTADOS.map((estado, index) => {
                  const value = estado ?? `estado-centro-form-${index}`;
                  return (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCentroDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => void guardarCentro()} disabled={savingCentro} className="bg-red-700 hover:bg-red-800 text-white">
            {savingCentro ? 'Guardando...' : centroForm.id ? 'Actualizar centro' : 'Crear centro'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
