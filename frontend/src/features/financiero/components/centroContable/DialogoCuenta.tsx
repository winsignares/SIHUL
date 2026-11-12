import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Switch } from '../../../../components/ui/switch';
import type { CuentaContable } from '../../models/core.models';
import { CUENTA_ESTADOS, CUENTA_NATURALEZAS, CUENTA_TIPOS, NIVELES, NIVEL_LABEL } from '../../hooks/contabilidad/centroContableUtils';
import type { useCentroContable } from '../../hooks/contabilidad/useCentroContable';

type CentroContable = ReturnType<typeof useCentroContable>;

/** Diálogo para crear o editar una cuenta contable. */
export function DialogoCuenta({
  cuentaDialogOpen,
  setCuentaDialogOpen,
  cuentaForm,
  setCuentaForm,
  guardarCuenta,
  savingCuenta
}: Pick<CentroContable, 'cuentaDialogOpen' | 'setCuentaDialogOpen' | 'cuentaForm' | 'setCuentaForm' | 'guardarCuenta' | 'savingCuenta'>) {
  return (
    <Dialog open={cuentaDialogOpen} onOpenChange={setCuentaDialogOpen}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{cuentaForm.id ? 'Editar cuenta contable' : 'Nueva cuenta contable'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label>Código</Label>
            <Input value={cuentaForm.codigo} onChange={(event) => setCuentaForm((prev) => ({ ...prev, codigo: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input value={cuentaForm.nombre} onChange={(event) => setCuentaForm((prev) => ({ ...prev, nombre: event.target.value }))} />
          </div>
          <div className="space-y-1">
            <Label>Tipo de cuenta</Label>
            <Select value={cuentaForm.tipo_cuenta} onValueChange={(value) => setCuentaForm((prev) => ({ ...prev, tipo_cuenta: value as CuentaContable['tipo_cuenta'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un tipo" />
              </SelectTrigger>
              <SelectContent>
                {CUENTA_TIPOS.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>{tipo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Nivel</Label>
            <Select value={String(cuentaForm.nivel)} onValueChange={(value) => setCuentaForm((prev) => ({ ...prev, nivel: Number(value) }))}>
              <SelectTrigger>
                <SelectValue placeholder="Nivel" />
              </SelectTrigger>
              <SelectContent>
                {NIVELES.map((nivel) => (
                  <SelectItem key={nivel} value={String(nivel)}>{NIVEL_LABEL[nivel]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Naturaleza</Label>
            <Select value={cuentaForm.naturaleza} onValueChange={(value) => setCuentaForm((prev) => ({ ...prev, naturaleza: value as CuentaContable['naturaleza'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Naturaleza" />
              </SelectTrigger>
              <SelectContent>
                {CUENTA_NATURALEZAS.map((item) => (
                  <SelectItem key={item} value={item}>{item}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Cuenta padre</Label>
            <Input value={cuentaForm.cuenta_padre || ''} onChange={(event) => setCuentaForm((prev) => ({ ...prev, cuenta_padre: event.target.value }))} placeholder="Opcional" />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Descripción</Label>
            <Input value={cuentaForm.descripcion || ''} onChange={(event) => setCuentaForm((prev) => ({ ...prev, descripcion: event.target.value }))} placeholder="Detalle breve (opcional)" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Controles operativos</Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className="text-sm text-slate-700">Acepta movimiento</span>
                <Switch checked={cuentaForm.acepta_movimiento} onCheckedChange={(checked) => setCuentaForm((prev) => ({ ...prev, acepta_movimiento: checked }))} />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className="text-sm text-slate-700">Requiere tercero</span>
                <Switch checked={cuentaForm.requiere_tercero} onCheckedChange={(checked) => setCuentaForm((prev) => ({ ...prev, requiere_tercero: checked }))} />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border px-3 py-2">
                <span className="text-sm text-slate-700">Centro de costo</span>
                <Switch checked={cuentaForm.requiere_centro_costo} onCheckedChange={(checked) => setCuentaForm((prev) => ({ ...prev, requiere_centro_costo: checked }))} />
              </div>
            </div>
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Estado</Label>
            <Select value={cuentaForm.estado} onValueChange={(value) => setCuentaForm((prev) => ({ ...prev, estado: value as CuentaContable['estado'] }))}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                {CUENTA_ESTADOS.map((estado, index) => {
                  const value = estado ?? `estado-form-${index}`;
                  return (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setCuentaDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => void guardarCuenta()} disabled={savingCuenta} className="bg-red-700 hover:bg-red-800 text-white">
            {savingCuenta ? 'Guardando...' : cuentaForm.id ? 'Actualizar cuenta' : 'Crear cuenta'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
