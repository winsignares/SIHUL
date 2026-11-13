import { Button } from '../../../../components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import { Input } from '../../../../components/ui/input';
import { Label } from '../../../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { Save, ShieldCheck, UserRound } from 'lucide-react';
import {
  ESTADO_OPTIONS,
  REGIMEN_OPTIONS,
  TIPO_PERSONA_OPTIONS,
  TIPO_PROVEEDOR_OPTIONS,
  type ProveedorFormState,
} from '../../hooks/admin_financiero/gestionProveedoresUtils';
import type { Proveedor } from '../../models/core.models';
import type { useGestionProveedores } from '../../hooks/admin_financiero/useGestionProveedores';

type GestionProveedores = ReturnType<typeof useGestionProveedores>;

/** Diálogo para crear o editar un proveedor. */
export function DialogoProveedor({
  dialogOpen, setDialogOpen, editingId, form, setForm, syncPaisDepartamentoCiudad,
  paises, departamentosDisponibles, ciudadesDisponibles, bancos, tiposCuenta, saving, guardar,
}: Pick<GestionProveedores, 'dialogOpen' | 'setDialogOpen' | 'editingId' | 'form' | 'setForm' | 'syncPaisDepartamentoCiudad' | 'paises' | 'departamentosDisponibles' | 'ciudadesDisponibles' | 'bancos' | 'tiposCuenta' | 'saving' | 'guardar'>) {
  return (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogContent className="max-h-[92vh] w-[96vw] overflow-y-auto sm:!max-w-[94vw] xl:!max-w-[84vw]">
        <DialogHeader>
          <DialogTitle className="text-xl text-slate-900">{editingId ? 'Editar proveedor' : 'Nuevo proveedor'}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm xl:col-span-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <UserRound className="h-4 w-4 text-red-700" />
              Acceso del proveedor
            </p>
            <div className="space-y-2">
              <Label>Nombre del usuario {editingId ? '' : <span className="text-red-600">*</span>}</Label>
              <Input value={form.nombreUsuario} onChange={(e) => setForm((prev) => ({ ...prev, nombreUsuario: e.target.value }))} placeholder="Representante o nombre de acceso" />
            </div>
            <div className="space-y-2">
              <Label>Correo de acceso {editingId ? '' : <span className="text-red-600">*</span>}</Label>
              <Input type="email" value={form.correoUsuario} onChange={(e) => setForm((prev) => ({ ...prev, correoUsuario: e.target.value }))} placeholder="usuario@empresa.com" />
            </div>
            <div className="space-y-2">
              <Label>{editingId ? 'Nueva contraseña' : 'Contraseña'} {!editingId && <span className="text-red-600">*</span>}</Label>
              <Input type="password" value={form.nuevaContrasena} onChange={(e) => setForm((prev) => ({ ...prev, nuevaContrasena: e.target.value }))} placeholder={editingId ? 'Solo si deseas cambiarla' : 'Contraseña inicial'} />
            </div>
            <div className="rounded-lg border bg-slate-50 px-3 py-2 text-xs text-slate-600">
              {editingId
                ? form.usuario
                  ? 'Este proveedor tiene usuario vinculado y puedes actualizar su acceso desde aquí.'
                  : 'El proveedor no tiene usuario vinculado; solo se actualizarán sus datos maestros.'
                : 'Al guardar, se creará automáticamente el usuario con rol Proveedor.'}
            </div>
          </div>

          <div className="space-y-4 rounded-xl border bg-white p-4 shadow-sm xl:col-span-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
              <ShieldCheck className="h-4 w-4 text-red-700" />
              Datos del proveedor
            </p>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div className="space-y-2">
                <Label>NIT <span className="text-red-600">*</span></Label>
                <Input value={form.nit} onChange={(e) => setForm((prev) => ({ ...prev, nit: e.target.value }))} placeholder="900123456-7" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Razón social <span className="text-red-600">*</span></Label>
                <Input value={form.razon_social} onChange={(e) => setForm((prev) => ({ ...prev, razon_social: e.target.value }))} placeholder="Proveedor S.A.S." />
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-1">
                <Label>Nombre comercial</Label>
                <Input value={form.nombre_comercial} onChange={(e) => setForm((prev) => ({ ...prev, nombre_comercial: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo de persona <span className="text-red-600">*</span></Label>
                <Select value={form.tipo_persona} onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_persona: value as ProveedorFormState['tipo_persona'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_PERSONA_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de proveedor <span className="text-red-600">*</span></Label>
                <Select value={form.tipo_proveedor} onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_proveedor: value as Proveedor['tipo_proveedor'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_PROVEEDOR_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Estado</Label>
                <Select value={form.estado} onValueChange={(value) => setForm((prev) => ({ ...prev, estado: value as Proveedor['estado'] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADO_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 xl:col-span-3">
                <Label>Dirección</Label>
                <Input value={form.direccion} onChange={(e) => setForm((prev) => ({ ...prev, direccion: e.target.value }))} placeholder="Calle 123 # 45-67" />
              </div>
              <div className="space-y-2">
                <Label>País</Label>
                <Select value={form.pais_id || undefined} onValueChange={(value) => syncPaisDepartamentoCiudad({ pais_id: value, departamento_geo_id: '', ciudad_id: '' })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona país" /></SelectTrigger>
                  <SelectContent>
                    {paises.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Departamento</Label>
                <Select value={form.departamento_geo_id || undefined} onValueChange={(value) => syncPaisDepartamentoCiudad({ departamento_geo_id: value, ciudad_id: '' })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
                  <SelectContent>
                    {departamentosDisponibles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ciudad</Label>
                <Select value={form.ciudad_id || undefined} onValueChange={(value) => syncPaisDepartamentoCiudad({ ciudad_id: value })}>
                  <SelectTrigger><SelectValue placeholder="Selecciona ciudad" /></SelectTrigger>
                  <SelectContent>
                    {ciudadesDisponibles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input value={form.telefono} onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Correo empresa</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="facturacion@empresa.com" />
              </div>
              <div className="space-y-2">
                <Label>Contacto principal</Label>
                <Input value={form.contacto_principal} onChange={(e) => setForm((prev) => ({ ...prev, contacto_principal: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Teléfono contacto</Label>
                <Input value={form.telefono_contacto} onChange={(e) => setForm((prev) => ({ ...prev, telefono_contacto: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Banco</Label>
                <Select value={form.banco_id || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, banco_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona banco" /></SelectTrigger>
                  <SelectContent>
                    {bancos.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de cuenta</Label>
                <Select value={form.tipo_cuenta_id || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, tipo_cuenta_id: value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                  <SelectContent>
                    {tiposCuenta.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Número de cuenta</Label>
                <Input value={form.numero_cuenta} onChange={(e) => setForm((prev) => ({ ...prev, numero_cuenta: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Régimen tributario</Label>
                <Select value={form.regimen_tributario || undefined} onValueChange={(value) => setForm((prev) => ({ ...prev, regimen_tributario: value }))}>
                  <SelectTrigger><SelectValue placeholder="Selecciona régimen" /></SelectTrigger>
                  <SelectContent>
                    {REGIMEN_OPTIONS.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2 xl:col-span-3">
                <Label>Observaciones</Label>
                <textarea
                  rows={4}
                  value={form.observaciones}
                  onChange={(e) => setForm((prev) => ({ ...prev, observaciones: e.target.value }))}
                  className="w-full resize-none rounded-md border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-600/30"
                  placeholder="Notas administrativas o tributarias del proveedor"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
          <Button onClick={() => void guardar()} disabled={saving} className="bg-red-700 text-white hover:bg-red-800">
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear proveedor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
