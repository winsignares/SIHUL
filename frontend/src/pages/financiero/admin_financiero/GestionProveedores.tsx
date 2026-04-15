import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '../../../share/card';
import { Button } from '../../../share/button';
import { Input } from '../../../share/input';
import { Label } from '../../../share/label';
import { Textarea } from '../../../share/textarea';
import { Badge } from '../../../share/badge';
import { Building2, Plus, Search, Edit, Save, X, CreditCard, User, CheckCircle2, Building } from 'lucide-react';

interface ProveedorFormData {
  id?: string;
  nombre: string;
  nit: string;
  tipoPersona: 'Natural' | 'Juridica';
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  cuentaBancaria: string;
  banco: string;
  tipoCuenta: 'Ahorros' | 'Corriente';
  nombreCuenta: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoEmail: string;
  observaciones: string;
  activo: boolean;
}

interface ProveedorListItem {
  id: string;
  nombre: string;
  nit: string;
  tipoPersona: 'Natural' | 'Juridica';
  direccion: string;
  ciudad: string;
  telefono: string;
  email: string;
  cuentaBancaria: string;
  banco: string;
  tipoCuenta: 'Ahorros' | 'Corriente';
  nombreCuenta: string;
  contactoNombre: string;
  contactoTelefono: string;
  contactoEmail: string;
  observaciones: string;
  activo: boolean;
}

export default function GestionProveedores() {
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  const [proveedores, setProveedores] = useState<ProveedorListItem[]>([
    {
      id: 'PROV-001',
      nombre: 'Servicios TI Colombia SAS',
      nit: '900123456-7',
      tipoPersona: 'Juridica',
      direccion: 'Calle 100 #12-45',
      ciudad: 'Bogota',
      telefono: '6015551234',
      email: 'facturacion@serviciosti.co',
      cuentaBancaria: '1234567890',
      banco: 'Bancolombia',
      tipoCuenta: 'Corriente',
      nombreCuenta: 'Servicios TI Colombia SAS',
      contactoNombre: 'Laura Perez',
      contactoTelefono: '3005551122',
      contactoEmail: 'laura.perez@serviciosti.co',
      observaciones: 'Proveedor estrategico del area de sistemas',
      activo: true,
    },
    {
      id: 'PROV-002',
      nombre: 'Mantenimiento Industrial EU',
      nit: '900345678-9',
      tipoPersona: 'Juridica',
      direccion: 'Av. 68 #45-98',
      ciudad: 'Barranquilla',
      telefono: '6053882211',
      email: 'pagos@mantenimientoeu.com',
      cuentaBancaria: '9988776655',
      banco: 'Banco de Bogota',
      tipoCuenta: 'Ahorros',
      nombreCuenta: 'Mantenimiento Industrial EU',
      contactoNombre: 'Jorge Rojas',
      contactoTelefono: '3102223344',
      contactoEmail: 'jorge.rojas@mantenimientoeu.com',
      observaciones: 'Atencion prioritaria para infraestructura',
      activo: true,
    },
  ]);

  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: '',
    nit: '',
    tipoPersona: 'Juridica',
    direccion: '',
    ciudad: '',
    telefono: '',
    email: '',
    cuentaBancaria: '',
    banco: '',
    tipoCuenta: 'Ahorros',
    nombreCuenta: '',
    contactoNombre: '',
    contactoTelefono: '',
    contactoEmail: '',
    observaciones: '',
    activo: true,
  });

  const proveedoresFiltrados = proveedores.filter(
    (p) => p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || p.nit.includes(busqueda)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      nit: '',
      tipoPersona: 'Juridica',
      direccion: '',
      ciudad: '',
      telefono: '',
      email: '',
      cuentaBancaria: '',
      banco: '',
      tipoCuenta: 'Ahorros',
      nombreCuenta: '',
      contactoNombre: '',
      contactoTelefono: '',
      contactoEmail: '',
      observaciones: '',
      activo: true,
    });
    setProveedorEditando(null);
    setMostrarFormulario(false);
  };

  const editarProveedor = (proveedor: ProveedorListItem) => {
    setFormData({ ...proveedor });
    setProveedorEditando(proveedor.id);
    setMostrarFormulario(true);
  };

  const guardarProveedor = () => {
    setGuardando(true);

    setTimeout(() => {
      if (proveedorEditando) {
        setProveedores((prev) => prev.map((p) => (p.id === proveedorEditando ? ({ ...p, ...formData, id: proveedorEditando } as ProveedorListItem) : p)));
      } else {
        const nuevoProveedor: ProveedorListItem = {
          id: `PROV-${Date.now()}`,
          nombre: formData.nombre,
          nit: formData.nit,
          tipoPersona: formData.tipoPersona,
          direccion: formData.direccion,
          ciudad: formData.ciudad,
          telefono: formData.telefono,
          email: formData.email,
          cuentaBancaria: formData.cuentaBancaria,
          banco: formData.banco,
          tipoCuenta: formData.tipoCuenta,
          nombreCuenta: formData.nombreCuenta,
          contactoNombre: formData.contactoNombre,
          contactoTelefono: formData.contactoTelefono,
          contactoEmail: formData.contactoEmail,
          observaciones: formData.observaciones,
          activo: formData.activo,
        };
        setProveedores((prev) => [nuevoProveedor, ...prev]);
      }

      setGuardando(false);
      setExito(true);

      setTimeout(() => {
        setExito(false);
        limpiarFormulario();
      }, 1500);
    }, 800);
  };

  const ciudadesColombia = ['Bogota', 'Medellin', 'Cali', 'Barranquilla', 'Cartagena', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibague'];

  const bancosColombia = [
    'Bancolombia',
    'Banco de Bogota',
    'Davivienda',
    'BBVA Colombia',
    'Banco Popular',
    'Banco Occidente',
    'Banco Caja Social',
    'Scotiabank Colpatria',
  ];

  if (exito) {
    return (
      <div>
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-2xl mx-auto">
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-8 text-center pb-8">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring' }} className="mb-6">
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">Proveedor guardado exitosamente</h2>
              <p className="text-green-600">{proveedorEditando ? 'El proveedor fue actualizado' : 'El nuevo proveedor fue agregado'} correctamente al sistema.</p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestion de Proveedores</h1>
            <p className="text-slate-600">Administre el catalogo de proveedores del sistema</p>
          </div>
          <Button onClick={() => setMostrarFormulario(true)} className="bg-red-600 hover:bg-red-700 text-white">
            <Plus className="w-4 h-4 mr-2" />Nuevo Proveedor
          </Button>
        </div>

        <AnimatePresence>
          {mostrarFormulario && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-8">
              <Card className="border-2 border-red-200">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-red-600" />
                    {proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-red-600" />Informacion Basica
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="nombre">Razon Social / Nombre Completo</Label>
                        <Input id="nombre" name="nombre" value={formData.nombre} onChange={handleInputChange} placeholder="Nombre del proveedor" />
                      </div>
                      <div>
                        <Label htmlFor="nit">NIT / Cedula</Label>
                        <Input id="nit" name="nit" value={formData.nit} onChange={handleInputChange} placeholder="123456789-0" />
                      </div>
                      <div>
                        <Label htmlFor="tipoPersona">Tipo de Persona</Label>
                        <select id="tipoPersona" name="tipoPersona" value={formData.tipoPersona} onChange={handleInputChange} className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white">
                          <option value="Juridica">Persona Juridica</option>
                          <option value="Natural">Persona Natural</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-600" />Informacion Bancaria
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="banco">Banco</Label>
                        <select id="banco" name="banco" value={formData.banco} onChange={handleInputChange} className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white">
                          <option value="">Seleccione un banco</option>
                          {bancosColombia.map((banco) => (
                            <option key={banco} value={banco}>{banco}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="tipoCuenta">Tipo de Cuenta</Label>
                        <select id="tipoCuenta" name="tipoCuenta" value={formData.tipoCuenta} onChange={handleInputChange} className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white">
                          <option value="Ahorros">Ahorros</option>
                          <option value="Corriente">Corriente</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="cuentaBancaria">Numero de Cuenta</Label>
                        <Input id="cuentaBancaria" name="cuentaBancaria" value={formData.cuentaBancaria} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="nombreCuenta">Titular de la Cuenta</Label>
                        <Input id="nombreCuenta" name="nombreCuenta" value={formData.nombreCuenta} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />Persona de Contacto
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="contactoNombre">Nombre Completo</Label>
                        <Input id="contactoNombre" name="contactoNombre" value={formData.contactoNombre} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="contactoTelefono">Telefono</Label>
                        <Input id="contactoTelefono" name="contactoTelefono" value={formData.contactoTelefono} onChange={handleInputChange} />
                      </div>
                      <div>
                        <Label htmlFor="contactoEmail">Correo</Label>
                        <Input id="contactoEmail" name="contactoEmail" type="email" value={formData.contactoEmail} onChange={handleInputChange} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="direccion">Direccion</Label>
                    <Input id="direccion" name="direccion" value={formData.direccion} onChange={handleInputChange} className="mb-3" />
                    <Label htmlFor="ciudad">Ciudad</Label>
                    <select id="ciudad" name="ciudad" value={formData.ciudad} onChange={handleInputChange} className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white">
                      <option value="">Seleccione una ciudad</option>
                      {ciudadesColombia.map((ciudad) => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea id="observaciones" name="observaciones" value={formData.observaciones} onChange={handleInputChange} rows={3} />
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button variant="outline" onClick={limpiarFormulario} className="border-slate-300">
                      <X className="w-4 h-4 mr-2" />Cancelar
                    </Button>
                    <Button onClick={guardarProveedor} disabled={guardando || !formData.nombre || !formData.nit} className="bg-green-600 hover:bg-green-700 text-white">
                      {guardando ? (
                        <>
                          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2" />
                          Guardando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          {proveedorEditando ? 'Actualizar Proveedor' : 'Guardar Proveedor'}
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {!mostrarFormulario && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input placeholder="Buscar por nombre o NIT..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-10" />
              </div>
            </CardContent>
          </Card>
        )}

        {!mostrarFormulario && (
          <div className="grid gap-4">
            {proveedoresFiltrados.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">{busqueda ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}</p>
                  <p className="text-slate-400 text-sm mt-2">{!busqueda && 'Agregue el primer proveedor con Nuevo Proveedor'}</p>
                </CardContent>
              </Card>
            ) : (
              proveedoresFiltrados.map((proveedor, index) => (
                <motion.div key={proveedor.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
                  <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-600">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Razon Social</p>
                            <p className="font-semibold text-slate-800">{proveedor.nombre}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">NIT</p>
                            <p className="font-mono text-slate-700">{proveedor.nit}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Cuenta Bancaria</p>
                            <p className="font-mono text-slate-700">{proveedor.cuentaBancaria || 'No registrada'}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Estado</p>
                            <Badge className={proveedor.activo ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>{proveedor.activo ? 'Activo' : 'Inactivo'}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button size="sm" variant="outline" onClick={() => editarProveedor(proveedor)} className="border-blue-300 text-blue-700 hover:bg-blue-50">
                            <Edit className="w-4 h-4 mr-1" />Editar
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
