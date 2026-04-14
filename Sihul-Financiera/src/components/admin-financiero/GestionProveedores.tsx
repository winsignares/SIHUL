import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import {
  Building2, Plus, Search, Edit, Trash2, Save, X,
  Phone, Mail, MapPin, CreditCard, User, FileText,
  CheckCircle2, AlertCircle, Building
} from 'lucide-react';
import { useFacturas } from '../../contexts/FacturasContext';

interface ProveedorFormData {
  id?: string;
  nombre: string;
  nit: string;
  tipoPersona: 'Natural' | 'Jurídica';
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
  const { proveedores, agregarProveedor } = useFacturas();
  const [busqueda, setBusqueda] = useState('');
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [proveedorEditando, setProveedorEditando] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  const [formData, setFormData] = useState<ProveedorFormData>({
    nombre: '',
    nit: '',
    tipoPersona: 'Jurídica',
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
    activo: true
  });

  const proveedoresFiltrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    p.nit.includes(busqueda)
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const limpiarFormulario = () => {
    setFormData({
      nombre: '',
      nit: '',
      tipoPersona: 'Jurídica',
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
      activo: true
    });
    setProveedorEditando(null);
    setMostrarFormulario(false);
  };

  const editarProveedor = (proveedor: any) => {
    setFormData({
      id: proveedor.id,
      nombre: proveedor.nombre,
      nit: proveedor.nit,
      tipoPersona: proveedor.tipoPersona || 'Jurídica',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || '',
      telefono: proveedor.telefono || '',
      email: proveedor.email || '',
      cuentaBancaria: proveedor.cuentaBancaria || '',
      banco: proveedor.banco || '',
      tipoCuenta: proveedor.tipoCuenta || 'Ahorros',
      nombreCuenta: proveedor.nombreCuenta || proveedor.nombre,
      contactoNombre: proveedor.contactoNombre || '',
      contactoTelefono: proveedor.contactoTelefono || '',
      contactoEmail: proveedor.contactoEmail || '',
      observaciones: proveedor.observaciones || '',
      activo: proveedor.activo !== false
    });
    setProveedorEditando(proveedor.id);
    setMostrarFormulario(true);
  };

  const guardarProveedor = () => {
    setGuardando(true);

    setTimeout(() => {
      const nuevoProveedor = {
        id: formData.id || `PROV-${Date.now()}`,
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
        fechaCreacion: new Date().toISOString()
      };

      agregarProveedor(nuevoProveedor);

      setGuardando(false);
      setExito(true);

      setTimeout(() => {
        setExito(false);
        limpiarFormulario();
      }, 2000);
    }, 1000);
  };

  const ciudadesColombia = [
    'Bogotá', 'Medellín', 'Cali', 'Barranquilla', 'Cartagena',
    'Cúcuta', 'Bucaramanga', 'Pereira', 'Santa Marta', 'Ibagué',
    'Pasto', 'Manizales', 'Neiva', 'Villavicencio', 'Armenia'
  ];

  const bancosColombia = [
    'Bancolombia', 'Banco de Bogotá', 'Davivienda', 'BBVA Colombia',
    'Banco Popular', 'Banco Occidente', 'Banco Caja Social',
    'Banco AV Villas', 'Banco Agrario', 'Bancoomeva', 'Banco Falabella',
    'Banco Pichincha', 'Scotiabank Colpatria', 'Banco GNB Sudameris'
  ];

  if (exito) {
    return (
      <div className="p-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-2xl mx-auto"
        >
          <Card className="border-green-200 bg-green-50">
            <CardContent className="pt-8 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
                className="mb-6"
              >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-12 h-12 text-white" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                ¡Proveedor Guardado Exitosamente!
              </h2>
              <p className="text-green-600">
                {proveedorEditando ? 'El proveedor ha sido actualizado' : 'El nuevo proveedor ha sido agregado'} correctamente al sistema.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">Gestión de Proveedores</h1>
            <p className="text-slate-600">
              Administre el catálogo de proveedores del sistema
            </p>
          </div>
          <Button
            onClick={() => setMostrarFormulario(true)}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Proveedor
          </Button>
        </div>

        {/* Formulario */}
        <AnimatePresence>
          {mostrarFormulario && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              <Card className="border-2 border-red-200">
                <CardHeader className="bg-gradient-to-r from-red-50 to-orange-50">
                  <CardTitle className="text-slate-800 flex items-center gap-2">
                    <Building2 className="w-6 h-6 text-red-600" />
                    {proveedorEditando ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  {/* Información Básica */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Building className="w-5 h-5 text-red-600" />
                      Información Básica
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="nombre">
                          Razón Social / Nombre Completo <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="nombre"
                          name="nombre"
                          value={formData.nombre}
                          onChange={handleInputChange}
                          placeholder="Nombre del proveedor"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nit">
                          NIT / Cédula <span className="text-red-600">*</span>
                        </Label>
                        <Input
                          id="nit"
                          name="nit"
                          value={formData.nit}
                          onChange={handleInputChange}
                          placeholder="123456789-0"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tipoPersona">
                          Tipo de Persona <span className="text-red-600">*</span>
                        </Label>
                        <select
                          id="tipoPersona"
                          name="tipoPersona"
                          value={formData.tipoPersona}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white"
                        >
                          <option value="Jurídica">Persona Jurídica</option>
                          <option value="Natural">Persona Natural</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contacto */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      Información de Contacto
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <Label htmlFor="direccion">Dirección</Label>
                        <Input
                          id="direccion"
                          name="direccion"
                          value={formData.direccion}
                          onChange={handleInputChange}
                          placeholder="Calle 123 # 45-67"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ciudad">Ciudad</Label>
                        <select
                          id="ciudad"
                          name="ciudad"
                          value={formData.ciudad}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white"
                        >
                          <option value="">Seleccione una ciudad</option>
                          {ciudadesColombia.map(ciudad => (
                            <option key={ciudad} value={ciudad}>{ciudad}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="telefono">Teléfono</Label>
                        <Input
                          id="telefono"
                          name="telefono"
                          value={formData.telefono}
                          onChange={handleInputChange}
                          placeholder="(601) 123-4567"
                        />
                      </div>
                      <div className="col-span-2">
                        <Label htmlFor="email">Correo Electrónico</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="contacto@proveedor.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Información Bancaria */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-green-600" />
                      Información Bancaria
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="banco">Banco</Label>
                        <select
                          id="banco"
                          name="banco"
                          value={formData.banco}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white"
                        >
                          <option value="">Seleccione un banco</option>
                          {bancosColombia.map(banco => (
                            <option key={banco} value={banco}>{banco}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="tipoCuenta">Tipo de Cuenta</Label>
                        <select
                          id="tipoCuenta"
                          name="tipoCuenta"
                          value={formData.tipoCuenta}
                          onChange={handleInputChange}
                          className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white"
                        >
                          <option value="Ahorros">Ahorros</option>
                          <option value="Corriente">Corriente</option>
                        </select>
                      </div>
                      <div>
                        <Label htmlFor="cuentaBancaria">Número de Cuenta</Label>
                        <Input
                          id="cuentaBancaria"
                          name="cuentaBancaria"
                          value={formData.cuentaBancaria}
                          onChange={handleInputChange}
                          placeholder="0000000000"
                        />
                      </div>
                      <div>
                        <Label htmlFor="nombreCuenta">Titular de la Cuenta</Label>
                        <Input
                          id="nombreCuenta"
                          name="nombreCuenta"
                          value={formData.nombreCuenta}
                          onChange={handleInputChange}
                          placeholder="Nombre del titular"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Persona de Contacto */}
                  <div>
                    <h3 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5 text-purple-600" />
                      Persona de Contacto
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="contactoNombre">Nombre Completo</Label>
                        <Input
                          id="contactoNombre"
                          name="contactoNombre"
                          value={formData.contactoNombre}
                          onChange={handleInputChange}
                          placeholder="Nombre del contacto"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactoTelefono">Teléfono</Label>
                        <Input
                          id="contactoTelefono"
                          name="contactoTelefono"
                          value={formData.contactoTelefono}
                          onChange={handleInputChange}
                          placeholder="320 123 4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="contactoEmail">Correo</Label>
                        <Input
                          id="contactoEmail"
                          name="contactoEmail"
                          type="email"
                          value={formData.contactoEmail}
                          onChange={handleInputChange}
                          placeholder="contacto@correo.com"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Observaciones */}
                  <div>
                    <Label htmlFor="observaciones">Observaciones</Label>
                    <Textarea
                      id="observaciones"
                      name="observaciones"
                      value={formData.observaciones}
                      onChange={handleInputChange}
                      placeholder="Notas adicionales sobre el proveedor..."
                      rows={3}
                    />
                  </div>

                  {/* Botones */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <Button
                      variant="outline"
                      onClick={limpiarFormulario}
                      className="border-slate-300"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancelar
                    </Button>
                    <Button
                      onClick={guardarProveedor}
                      disabled={guardando || !formData.nombre || !formData.nit}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {guardando ? (
                        <>
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                            className="w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"
                          />
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

        {/* Barra de búsqueda */}
        {!mostrarFormulario && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o NIT..."
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Lista de Proveedores */}
        {!mostrarFormulario && (
          <div className="grid gap-4">
            {proveedoresFiltrados.length === 0 ? (
              <Card>
                <CardContent className="pt-12 pb-12 text-center">
                  <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500 text-lg">
                    {busqueda ? 'No se encontraron proveedores' : 'No hay proveedores registrados'}
                  </p>
                  <p className="text-slate-400 text-sm mt-2">
                    {!busqueda && 'Agregue el primer proveedor haciendo clic en "Nuevo Proveedor"'}
                  </p>
                </CardContent>
              </Card>
            ) : (
              proveedoresFiltrados.map((proveedor, index) => (
                <motion.div
                  key={proveedor.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="hover:shadow-lg transition-all border-l-4 border-l-red-600">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-slate-500 mb-1">Razón Social</p>
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
                            <Badge className={proveedor.activo !== false ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}>
                              {proveedor.activo !== false ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => editarProveedor(proveedor)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
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
