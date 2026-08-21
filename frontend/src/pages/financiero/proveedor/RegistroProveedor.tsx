import { ArrowLeft, Building2, CheckCircle2, LoaderCircle, LockKeyhole, Mail, ShieldCheck } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../share/select';
import { useRegistroProveedor } from '../../../hooks/financiero/proveedor/RegistroProveedor/useRegistroProveedor';

const REGIMENES = [
  'Responsable IVA',
  'No Responsable IVA',
  'Régimen Simple de Tributación',
  'Régimen Tributario Especial',
];

export default function RegistroProveedor() {
  const {
    form,
    catalogos,
    departamentosDisponibles,
    ciudadesDisponibles,
    cargandoCatalogos,
    enviando,
    error,
    exito,
    actualizarCampo,
    enviarRegistro,
    volverLogin,
  } = useRegistroProveedor();
  const feedbackRef = useRef<HTMLDivElement>(null);

  const camposDeshabilitados = cargandoCatalogos || enviando || Boolean(exito);

  useEffect(() => {
    if (error || exito) feedbackRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [error, exito]);

  if (exito) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-red-50 px-4">
        <section className="w-full max-w-xl rounded-3xl border border-emerald-200 bg-white p-8 text-center shadow-2xl shadow-emerald-900/10 sm:p-12">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 ring-8 ring-emerald-50">
            <CheckCircle2 size={58} strokeWidth={2.5} />
          </div>
          <p className="mt-8 text-sm font-bold uppercase tracking-[0.2em] text-emerald-700">Registro completado</p>
          <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">¡Tu cuenta de proveedor fue creada!</h1>
          <p className="mt-4 text-base leading-7 text-slate-600">{exito}</p>
          <p className="mt-7 flex items-center justify-center gap-2 text-sm font-medium text-slate-500"><LoaderCircle size={18} className="animate-spin text-red-700" /> Redirigiendo al inicio de sesión...</p>
          <Button type="button" onClick={volverLogin} className="mt-7 bg-red-700 px-6 text-white hover:bg-red-800">Ir ahora al inicio de sesión</Button>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/40 to-amber-50 px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <button
          type="button"
          onClick={volverLogin}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-red-700"
        >
          <ArrowLeft size={16} /> Volver al inicio de sesión
        </button>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">
          <header className="bg-gradient-to-r from-red-800 via-red-700 to-red-600 px-6 py-8 text-white sm:px-10">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
                <Building2 size={29} />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-200">Portal de proveedores</p>
                <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Crea tu cuenta de proveedor</h1>
                <p className="mt-2 max-w-3xl text-sm text-red-50 sm:text-base">
                  Registra tus datos de acceso, comerciales, bancarios y tributarios para gestionar facturas en la plataforma.
                </p>
              </div>
            </div>
          </header>

          <form onSubmit={enviarRegistro} className="space-y-8 p-6 sm:p-10">
            <div ref={feedbackRef} aria-live="polite" className="scroll-mt-8">
              {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}
            </div>

            <section>
              <SectionTitle icon={<LockKeyhole size={18} />} title="Datos de acceso" description="Usa tu correo institucional de la Universidad Libre para ingresar a la plataforma." />
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <Field label="Nombre para la cuenta" required className="md:col-span-2">
                  <Input value={form.nombre} onChange={(event) => actualizarCampo('nombre', event.target.value)} placeholder="Nombre completo" disabled={enviando} />
                </Field>
                <Field label="Correo de acceso" required>
                  <Input type="email" value={form.correo} onChange={(event) => actualizarCampo('correo', event.target.value)} placeholder="usuario@unilibre.edu.co" disabled={enviando} />
                </Field>
                <Field label="Confirmar correo" required>
                  <Input type="email" value={form.confirmarCorreo} onChange={(event) => actualizarCampo('confirmarCorreo', event.target.value)} placeholder="Repite el correo" disabled={enviando} />
                </Field>
                <Field label="Contraseña" required>
                  <Input type="password" value={form.contrasena} onChange={(event) => actualizarCampo('contrasena', event.target.value)} placeholder="Mínimo 6 caracteres" disabled={enviando} />
                </Field>
                <Field label="Confirmar contraseña" required>
                  <Input type="password" value={form.confirmarContrasena} onChange={(event) => actualizarCampo('confirmarContrasena', event.target.value)} placeholder="Repite la contraseña" disabled={enviando} />
                </Field>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <SectionTitle icon={<Building2 size={18} />} title="Datos del proveedor" description="Información comercial y de ubicación." />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="NIT" required><Input value={form.nit} onChange={(event) => actualizarCampo('nit', event.target.value)} placeholder="900123456-7" disabled={enviando} /></Field>
                <Field label="Razón social" required><Input value={form.razonSocial} onChange={(event) => actualizarCampo('razonSocial', event.target.value)} placeholder="Proveedor S.A.S." disabled={enviando} /></Field>
                <Field label="Nombre comercial" required><Input value={form.nombreComercial} onChange={(event) => actualizarCampo('nombreComercial', event.target.value)} placeholder="Nombre con el que opera" disabled={enviando} /></Field>
                <Field label="Tipo de persona" required>
                  <Select value={form.tipoPersona} onValueChange={(value) => actualizarCampo('tipoPersona', value as 'Jurídica' | 'Natural')} disabled={enviando}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Jurídica">Jurídica</SelectItem><SelectItem value="Natural">Natural</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Tipo de proveedor" required>
                  <Select value={form.tipoProveedor} onValueChange={(value) => actualizarCampo('tipoProveedor', value as 'Bienes' | 'Servicios')} disabled={enviando}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Bienes">Bienes</SelectItem><SelectItem value="Servicios">Servicios</SelectItem></SelectContent>
                  </Select>
                </Field>
                <Field label="Teléfono principal" required><Input type="tel" value={form.telefono} onChange={(event) => actualizarCampo('telefono', event.target.value)} placeholder="300 000 0000" disabled={enviando} /></Field>
                <Field label="Correo de contacto de la empresa" required className="md:col-span-2 xl:col-span-3"><Input type="email" value={form.correoEmpresa} onChange={(event) => actualizarCampo('correoEmpresa', event.target.value)} placeholder="contacto@empresa.com" disabled={enviando} /></Field>
                <div className="md:col-span-2 xl:col-span-3"><Field label="Dirección" required><Input value={form.direccion} onChange={(event) => actualizarCampo('direccion', event.target.value)} placeholder="Calle 123 # 45-67" disabled={enviando} /></Field></div>
                <Field label="País" required>
                  <Select value={form.paisId || undefined} onValueChange={(value) => actualizarCampo('paisId', value)} disabled={camposDeshabilitados}>
                    <SelectTrigger><SelectValue placeholder="Selecciona país" /></SelectTrigger>
                    <SelectContent>{catalogos.paises.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Departamento" required>
                  <Select value={form.departamentoId || undefined} onValueChange={(value) => actualizarCampo('departamentoId', value)} disabled={camposDeshabilitados || !form.paisId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona departamento" /></SelectTrigger>
                    <SelectContent>{departamentosDisponibles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Ciudad" required>
                  <Select value={form.ciudadId || undefined} onValueChange={(value) => actualizarCampo('ciudadId', value)} disabled={camposDeshabilitados || !form.departamentoId}>
                    <SelectTrigger><SelectValue placeholder="Selecciona ciudad" /></SelectTrigger>
                    <SelectContent>{ciudadesDisponibles.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            </section>

            <section className="border-t border-slate-200 pt-8">
              <SectionTitle icon={<ShieldCheck size={18} />} title="Información bancaria y tributaria" description="Necesaria para la validación y el pago de facturas." />
              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <Field label="Banco" required>
                  <Select value={form.bancoId || undefined} onValueChange={(value) => actualizarCampo('bancoId', value)} disabled={camposDeshabilitados}>
                    <SelectTrigger><SelectValue placeholder="Selecciona banco" /></SelectTrigger>
                    <SelectContent>{catalogos.bancos.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Tipo de cuenta" required>
                  <Select value={form.tipoCuentaId || undefined} onValueChange={(value) => actualizarCampo('tipoCuentaId', value)} disabled={camposDeshabilitados}>
                    <SelectTrigger><SelectValue placeholder="Selecciona tipo" /></SelectTrigger>
                    <SelectContent>{catalogos.tiposCuenta.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.nombre}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Número de cuenta" required><Input value={form.numeroCuenta} onChange={(event) => actualizarCampo('numeroCuenta', event.target.value)} disabled={enviando} /></Field>
                <Field label="Régimen tributario" required className="md:col-span-2 xl:col-span-3">
                  <Select value={form.regimenTributario || undefined} onValueChange={(value) => actualizarCampo('regimenTributario', value)} disabled={camposDeshabilitados}>
                    <SelectTrigger><SelectValue placeholder="Selecciona régimen" /></SelectTrigger>
                    <SelectContent>{REGIMENES.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
              </div>
            </section>

            <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={15} className="text-emerald-600" /> No solicitamos observaciones ni datos de contacto duplicados.</p>
              <Button type="submit" disabled={enviando || cargandoCatalogos || Boolean(exito)} className="bg-red-700 px-6 text-white hover:bg-red-800 disabled:cursor-not-allowed disabled:bg-slate-400 disabled:text-white">
                {enviando ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Mail className="mr-2 h-4 w-4" />}
                {enviando ? 'Registrando...' : 'Crear cuenta de proveedor'}
              </Button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}

function SectionTitle({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 text-red-700">{icon}</div>
      <div><h2 className="font-bold text-slate-900">{title}</h2><p className="mt-1 text-sm text-slate-500">{description}</p></div>
    </div>
  );
}

function Field({ label, required = false, children, className = '' }: { label: string; required?: boolean; children: ReactNode; className?: string }) {
  return <div className={`space-y-1.5 ${className}`}><Label>{label}{required && <span className="ml-1 text-red-600">*</span>}</Label>{children}</div>;
}
