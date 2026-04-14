import { useState } from 'react';
import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { 
  Upload, FileText, Save, AlertCircle, CheckCircle2, 
  Calendar, DollarSign, Building2, User, FileCheck, X, Plus
} from 'lucide-react';
import { useFacturas } from '../../contexts/FacturasContext';

interface DocumentoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
  tamano: number;
  url?: string;
}

export default function RegistrarFactura() {
  const { agregarFactura, proveedores, agregarProveedor } = useFacturas();
  const [paso, setPaso] = useState(1);
  const [guardando, setGuardando] = useState(false);
  const [exito, setExito] = useState(false);

  // Formulario
  const [formData, setFormData] = useState({
    proveedorId: '',
    proveedor: '',
    nit: '',
    cuentaBancaria: '',
    numeroFactura: '',
    valorTotal: '',
    fechaFactura: '',
    fechaRecepcion: new Date().toISOString().split('T')[0], // Fecha de HOY por defecto
    areaSolicitante: '',
    tipoDocumento: 'Factura',
    descripcion: '',
    observaciones: ''
  });

  const [documentos, setDocumentos] = useState<DocumentoAdjunto[]>([]);
  const [errores, setErrores] = useState<string[]>([]);

  // Áreas disponibles
  const areas = [
    'Administración',
    'Sistemas',
    'Mantenimiento',
    'Infraestructura',
    'Biblioteca',
    'Servicios Generales',
    'Enfermería',
    'Laboratorios',
    'Talento Humano',
    'Investigación',
    'Vicerrectoría Académica',
    'Rectoría'
  ];

  const tiposDocumento = [
    'Factura',
    'Factura Electrónica',
    'Cuenta de Cobro',
    'Nota Débito',
    'Documento Equivalente'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProveedorChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const proveedorId = e.target.value;
    
    if (proveedorId) {
      const proveedorSeleccionado = proveedores.find(p => p.id === proveedorId);
      if (proveedorSeleccionado) {
        setFormData(prev => ({
          ...prev,
          proveedorId: proveedorSeleccionado.id,
          proveedor: proveedorSeleccionado.nombre,
          nit: proveedorSeleccionado.nit,
          cuentaBancaria: proveedorSeleccionado.cuentaBancaria
        }));
      }
    } else {
      setFormData(prev => ({
        ...prev,
        proveedorId: '',
        proveedor: '',
        nit: '',
        cuentaBancaria: ''
      }));
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const nuevosDocumentos: DocumentoAdjunto[] = Array.from(files).map((file, index) => ({
        id: `doc-${Date.now()}-${index}`,
        nombre: file.name,
        tipo: file.type,
        tamano: file.size,
        url: URL.createObjectURL(file)
      }));
      setDocumentos(prev => [...prev, ...nuevosDocumentos]);
    }
  };

  const handleFileUploadTipo = (e: React.ChangeEvent<HTMLInputElement>, tipo: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const nuevoDocumento: DocumentoAdjunto = {
        id: `doc-${Date.now()}`,
        nombre: file.name,
        tipo: tipo,
        tamano: file.size,
        url: URL.createObjectURL(file)
      };
      setDocumentos(prev => [...prev, nuevoDocumento]);
    }
  };

  const eliminarDocumento = (id: string) => {
    setDocumentos(prev => prev.filter(doc => doc.id !== id));
  };

  const validarPaso1 = () => {
    const erroresTemp: string[] = [];
    
    if (!formData.proveedorId && !formData.proveedor) erroresTemp.push('Proveedor es obligatorio');
    if (!formData.nit) erroresTemp.push('NIT es obligatorio');
    if (!formData.numeroFactura) erroresTemp.push('Número de factura es obligatorio');
    if (!formData.valorTotal) erroresTemp.push('Valor total es obligatorio');
    if (!formData.fechaFactura) erroresTemp.push('Fecha de factura es obligatoria');
    if (!formData.fechaRecepcion) erroresTemp.push('Fecha de recepción es obligatoria');
    if (!formData.areaSolicitante) erroresTemp.push('Área solicitante es obligatoria');
    
    setErrores(erroresTemp);
    return erroresTemp.length === 0;
  };

  const validarPaso2 = () => {
    const erroresTemp: string[] = [];
    
    if (documentos.filter(d => ['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).length < 3) {
      erroresTemp.push('Debe adjuntar los 3 documentos obligatorios');
    }
    
    setErrores(erroresTemp);
    return erroresTemp.length === 0;
  };

  const avanzarPaso = () => {
    if (paso === 1 && validarPaso1()) {
      setPaso(2);
      setErrores([]);
    } else if (paso === 2 && validarPaso2()) {
      setPaso(3);
      setErrores([]);
    }
  };

  const guardarFactura = async () => {
    if (!validarPaso2()) return;

    setGuardando(true);
    
    // Generar ID único
    const nuevoId = `F${Date.now().toString().slice(-6)}`;
    
    // Crear objeto de factura
    const nuevaFactura = {
      id: nuevoId,
      numeroFactura: formData.numeroFactura,
      proveedor: formData.proveedor,
      nit: formData.nit,
      valorTotal: parseFloat(formData.valorTotal),
      fechaFactura: formData.fechaFactura,
      fechaRecepcion: formData.fechaRecepcion,
      areaSolicitante: formData.areaSolicitante,
      tipoDocumento: formData.tipoDocumento,
      descripcion: formData.descripcion,
      observaciones: formData.observaciones,
      estado: 'Recibida' as const,
      etapaActual: 'Radicación Contable',
      diasTranscurridos: 0,
      indicadorRiesgo: 'ok' as const,
      documentosAdjuntos: documentos,
      historial: [
        {
          fecha: formData.fechaRecepcion,
          accion: 'Factura Recibida',
          responsable: `Funcionario - ${formData.areaSolicitante}`,
          observacion: 'Factura registrada en el sistema'
        }
      ]
    };
    
    // Simulación de guardado
    setTimeout(() => {
      // Agregar factura al contexto global
      agregarFactura(nuevaFactura);
      
      setGuardando(false);
      setExito(true);
      
      // Mensaje de éxito
      setTimeout(() => {
        // Limpiar formulario
        setFormData({
          proveedorId: '',
          proveedor: '',
          nit: '',
          cuentaBancaria: '',
          numeroFactura: '',
          valorTotal: '',
          fechaFactura: '',
          fechaRecepcion: new Date().toISOString().split('T')[0],
          areaSolicitante: '',
          tipoDocumento: 'Factura',
          descripcion: '',
          observaciones: ''
        });
        setDocumentos([]);
        setPaso(1);
        setExito(false);
      }, 2000);
    }, 1500);
  };

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
                ¡Factura Registrada Exitosamente!
              </h2>
              <p className="text-green-600">
                La factura ha sido registrada en el sistema y está lista para continuar con el proceso de radicación.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">Registrar Nueva Factura</h1>
          <p className="text-slate-600">
            Complete la información de la factura recibida del proveedor
          </p>
        </div>

        {/* Indicador de pasos */}
        <div className="mb-8">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold transition-all ${
                    paso >= num 
                      ? 'bg-red-600 text-white' 
                      : 'bg-slate-200 text-slate-400'
                  }`}>
                    {num}
                  </div>
                  <span className={`text-sm mt-2 font-medium ${
                    paso >= num ? 'text-red-600' : 'text-slate-400'
                  }`}>
                    {num === 1 && 'Datos Generales'}
                    {num === 2 && 'Documentos'}
                    {num === 3 && 'Confirmación'}
                  </span>
                </div>
                {num < 3 && (
                  <div className={`h-1 flex-1 mx-4 ${
                    paso > num ? 'bg-red-600' : 'bg-slate-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Errores */}
        {errores.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-700 mb-2">Corrija los siguientes errores:</h3>
                    <ul className="list-disc list-inside text-red-600 text-sm space-y-1">
                      {errores.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PASO 1: Datos Generales */}
        {paso === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800">Paso 1: Datos Generales</CardTitle>
                <CardDescription>
                  Ingrese la información básica de la factura
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Selector de Proveedor */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label htmlFor="selectorProveedor" className="text-slate-700 font-medium">
                      Seleccionar Proveedor <span className="text-red-600">*</span>
                    </Label>
                  </div>
                  
                  <select
                    id="selectorProveedor"
                    onChange={handleProveedorChange}
                    value={formData.proveedorId}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-700"
                  >
                    <option value="">-- Seleccione un proveedor existente --</option>
                    {proveedores.map(prov => (
                      <option key={prov.id} value={prov.id}>
                        {prov.nombre} - {prov.nit}
                      </option>
                    ))}
                  </select>
                  
                  <p className="text-xs text-slate-500 mt-2">
                    ℹ️ Si el proveedor no existe, contacte al Administrador Financiero para agregarlo al sistema.
                  </p>
                </div>

                {/* Información del Proveedor */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="proveedor" className="text-slate-700 font-medium">
                      Nombre del Proveedor <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        id="proveedor"
                        name="proveedor"
                        value={formData.proveedor}
                        onChange={handleInputChange}
                        placeholder="Nombre del proveedor"
                        className="pl-10"
                        disabled={formData.proveedorId !== ''}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nit" className="text-slate-700 font-medium">
                      NIT <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        id="nit"
                        name="nit"
                        value={formData.nit}
                        onChange={handleInputChange}
                        placeholder="123456789-0"
                        className="pl-10"
                        disabled={formData.proveedorId !== ''}
                      />
                    </div>
                  </div>
                </div>

                {/* Información de la Factura */}
                <div className="grid grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="numeroFactura" className="text-slate-700 font-medium">
                      Número de Factura <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        id="numeroFactura"
                        name="numeroFactura"
                        value={formData.numeroFactura}
                        onChange={handleInputChange}
                        placeholder="FAC-2026-XXX"
                        className="pl-10"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipoDocumento" className="text-slate-700 font-medium">
                      Tipo de Documento <span className="text-red-600">*</span>
                    </Label>
                    <select
                      id="tipoDocumento"
                      name="tipoDocumento"
                      value={formData.tipoDocumento}
                      onChange={handleInputChange}
                      className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-700"
                    >
                      {tiposDocumento.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="valorTotal" className="text-slate-700 font-medium">
                      Valor Total <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        id="valorTotal"
                        name="valorTotal"
                        type="number"
                        value={formData.valorTotal}
                        onChange={handleInputChange}
                        placeholder="0"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Fechas CRÍTICAS */}
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="fechaFactura" className="text-slate-700 font-medium">
                      Fecha de Emisión de Factura <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
                      <Input
                        id="fechaFactura"
                        name="fechaFactura"
                        type="date"
                        value={formData.fechaFactura}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-slate-500">Fecha que aparece en la factura del proveedor</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fechaRecepcion" className="text-slate-700 font-medium">
                      Fecha de Recepción Universidad <span className="text-red-600">*</span>
                    </Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-3 w-5 h-5 text-red-600" />
                      <Input
                        id="fechaRecepcion"
                        name="fechaRecepcion"
                        type="date"
                        value={formData.fechaRecepcion}
                        onChange={handleInputChange}
                        className="pl-10 border-red-300 bg-red-50"
                      />
                    </div>
                    <p className="text-xs text-red-600 font-medium">
                      ⏰ Esta es la fecha desde la cual inician los 17 días hábiles del SLA
                    </p>
                  </div>
                </div>

                {/* Área Solicitante */}
                <div className="space-y-2">
                  <Label htmlFor="areaSolicitante" className="text-slate-700 font-medium">
                    Área Solicitante <span className="text-red-600">*</span>
                  </Label>
                  <select
                    id="areaSolicitante"
                    name="areaSolicitante"
                    value={formData.areaSolicitante}
                    onChange={handleInputChange}
                    className="w-full h-10 px-3 rounded-md border border-slate-300 bg-white text-slate-700"
                  >
                    <option value="">Seleccione un área</option>
                    {areas.map(area => (
                      <option key={area} value={area}>{area}</option>
                    ))}
                  </select>
                </div>

                {/* Descripción */}
                <div className="space-y-2">
                  <Label htmlFor="descripcion" className="text-slate-700 font-medium">
                    Descripción
                  </Label>
                  <Textarea
                    id="descripcion"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    placeholder="Descripción detallada del servicio o producto facturado"
                    rows={3}
                  />
                </div>

                {/* Observaciones */}
                <div className="space-y-2">
                  <Label htmlFor="observaciones" className="text-slate-700 font-medium">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observaciones"
                    name="observaciones"
                    value={formData.observaciones}
                    onChange={handleInputChange}
                    placeholder="Observaciones adicionales"
                    rows={2}
                  />
                </div>

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={avanzarPaso}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Continuar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PASO 2: Documentos */}
        {paso === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800">Paso 2: Documentos Soporte Obligatorios</CardTitle>
                <CardDescription>
                  Complete el checklist adjuntando los 3 documentos requeridos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Checklist de Documentos Requeridos */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-semibold text-blue-900 text-sm">Documentos Obligatorios</p>
                      <p className="text-xs text-blue-700 mt-1">
                        Para continuar debe adjuntar los 3 documentos especificados a continuación
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documento 1: Factura Original */}
                <div className={`border-2 rounded-lg p-5 transition-all ${
                  documentos.some(d => d.tipo === 'Factura')
                    ? 'bg-green-50 border-green-300'
                    : 'bg-slate-50 border-slate-300 hover:border-red-400'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📄</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            1. Factura Original
                            {documentos.some(d => d.tipo === 'Factura') && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Factura del proveedor en formato PDF o imagen
                          </p>
                        </div>
                      </div>

                      {documentos.find(d => d.tipo === 'Factura') ? (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 mt-3">
                          <div className="flex items-center gap-3">
                            <FileCheck className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-slate-700 text-sm">
                                {documentos.find(d => d.tipo === 'Factura')?.nombre}
                              </p>
                              <p className="text-xs text-slate-500">
                                {((documentos.find(d => d.tipo === 'Factura')?.tamano || 0) / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const doc = documentos.find(d => d.tipo === 'Factura');
                              if (doc) eliminarDocumento(doc.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <input
                            type="file"
                            id="fileFactura"
                            onChange={(e) => handleFileUploadTipo(e, 'Factura')}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <label htmlFor="fileFactura">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-slate-300 hover:bg-slate-100"
                              onClick={() => document.getElementById('fileFactura')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Adjuntar Factura Original
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documento 2: Orden de Compra / Contrato */}
                <div className={`border-2 rounded-lg p-5 transition-all ${
                  documentos.some(d => d.tipo === 'Orden')
                    ? 'bg-green-50 border-green-300'
                    : 'bg-slate-50 border-slate-300 hover:border-red-400'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">📋</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            2. Orden de Compra / Contrato
                            {documentos.some(d => d.tipo === 'Orden') && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Documento que respalda la autorización de compra
                          </p>
                        </div>
                      </div>

                      {documentos.find(d => d.tipo === 'Orden') ? (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 mt-3">
                          <div className="flex items-center gap-3">
                            <FileCheck className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-slate-700 text-sm">
                                {documentos.find(d => d.tipo === 'Orden')?.nombre}
                              </p>
                              <p className="text-xs text-slate-500">
                                {((documentos.find(d => d.tipo === 'Orden')?.tamano || 0) / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const doc = documentos.find(d => d.tipo === 'Orden');
                              if (doc) eliminarDocumento(doc.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <input
                            type="file"
                            id="fileOrden"
                            onChange={(e) => handleFileUploadTipo(e, 'Orden')}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                          />
                          <label htmlFor="fileOrden">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-slate-300 hover:bg-slate-100"
                              onClick={() => document.getElementById('fileOrden')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Adjuntar Orden de Compra / Contrato
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Documento 3: Certificación Bancaria */}
                <div className={`border-2 rounded-lg p-5 transition-all ${
                  documentos.some(d => d.tipo === 'Certificacion')
                    ? 'bg-green-50 border-green-300'
                    : 'bg-slate-50 border-slate-300 hover:border-red-400'
                }`}>
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">🏦</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                            3. Certificación Bancaria del Proveedor
                            {documentos.some(d => d.tipo === 'Certificacion') && (
                              <CheckCircle2 className="w-5 h-5 text-green-600" />
                            )}
                          </h3>
                          <p className="text-xs text-slate-600 mt-1">
                            Certificación de cuenta bancaria vigente del proveedor
                          </p>
                        </div>
                      </div>

                      {documentos.find(d => d.tipo === 'Certificacion') ? (
                        <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-green-200 mt-3">
                          <div className="flex items-center gap-3">
                            <FileCheck className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-slate-700 text-sm">
                                {documentos.find(d => d.tipo === 'Certificacion')?.nombre}
                              </p>
                              <p className="text-xs text-slate-500">
                                {((documentos.find(d => d.tipo === 'Certificacion')?.tamano || 0) / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              const doc = documentos.find(d => d.tipo === 'Certificacion');
                              if (doc) eliminarDocumento(doc.id);
                            }}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <input
                            type="file"
                            id="fileCertificacion"
                            onChange={(e) => handleFileUploadTipo(e, 'Certificacion')}
                            className="hidden"
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                          <label htmlFor="fileCertificacion">
                            <Button
                              type="button"
                              variant="outline"
                              className="w-full border-slate-300 hover:bg-slate-100"
                              onClick={() => document.getElementById('fileCertificacion')?.click()}
                            >
                              <Upload className="w-4 h-4 mr-2" />
                              Adjuntar Certificación Bancaria
                            </Button>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Indicador de progreso */}
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">Progreso de Documentos</p>
                    <Badge className={
                      documentos.filter(d => ['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).length === 3
                        ? "bg-green-100 text-green-700 border-green-200 border"
                        : "bg-yellow-100 text-yellow-700 border-yellow-200 border"
                    }>
                      {documentos.filter(d => ['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).length} / 3 Completos
                    </Badge>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(documentos.filter(d => ['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).length / 3) * 100}%`
                      }}
                    />
                  </div>
                </div>

                {/* Documentos adicionales opcionales */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-slate-700">Documentos Adicionales (Opcionales)</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Puede adjuntar otros documentos de soporte si lo requiere
                      </p>
                    </div>
                  </div>
                  
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-red-400 transition-colors">
                    <input
                      type="file"
                      id="fileAdicional"
                      multiple
                      onChange={handleFileUpload}
                      className="hidden"
                      accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                    />
                    <label htmlFor="fileAdicional" className="cursor-pointer">
                      <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-slate-700 font-medium text-sm mb-1">
                        Adjuntar documentos adicionales
                      </p>
                      <p className="text-xs text-slate-500">
                        PDF, JPG, PNG, Excel, Word
                      </p>
                    </label>
                  </div>

                  {/* Lista de documentos adicionales */}
                  {documentos.filter(d => !['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).length > 0 && (
                    <div className="space-y-2 mt-4">
                      <p className="text-xs font-semibold text-slate-600 uppercase">Documentos Adicionales:</p>
                      {documentos.filter(d => !['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).map(doc => (
                        <motion.div
                          key={doc.id}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                        >
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-slate-600" />
                            <div>
                              <p className="font-medium text-slate-700 text-sm">{doc.nombre}</p>
                              <p className="text-xs text-slate-500">
                                {(doc.tamano / 1024).toFixed(2)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => eliminarDocumento(doc.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={() => setPaso(1)}
                    variant="outline"
                    className="border-slate-300"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={avanzarPaso}
                    disabled={documentos.filter(d => ['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).length < 3}
                    className={
                      documentos.filter(d => ['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).length < 3
                        ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                        : "bg-red-600 hover:bg-red-700 text-white"
                    }
                  >
                    {documentos.filter(d => ['Factura', 'Orden', 'Certificacion'].includes(d.tipo)).length < 3 ? (
                      <>
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Complete los 3 documentos obligatorios
                      </>
                    ) : (
                      <>
                        Continuar
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* PASO 3: Confirmación */}
        {paso === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-slate-800">Paso 3: Confirmación</CardTitle>
                <CardDescription>
                  Revise la información antes de guardar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Resumen */}
                <div className="bg-slate-50 rounded-lg p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Proveedor</p>
                      <p className="font-semibold text-slate-800">{formData.proveedor}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">NIT</p>
                      <p className="font-semibold text-slate-800">{formData.nit}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Número de Factura</p>
                      <p className="font-semibold text-slate-800">{formData.numeroFactura}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Valor Total</p>
                      <p className="font-semibold text-green-600 text-lg">
                        ${parseFloat(formData.valorTotal).toLocaleString('es-CO')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Fecha Factura</p>
                      <p className="font-semibold text-slate-800">{formData.fechaFactura}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Fecha Recepción (INICIO SLA)</p>
                      <p className="font-semibold text-red-600 text-lg">{formData.fechaRecepcion}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Área Solicitante</p>
                      <p className="font-semibold text-slate-800">{formData.areaSolicitante}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Estado</p>
                      <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                        Recibida
                      </Badge>
                    </div>
                  </div>

                  {formData.descripcion && (
                    <div>
                      <p className="text-sm text-slate-500 mb-1">Descripción</p>
                      <p className="text-slate-700">{formData.descripcion}</p>
                    </div>
                  )}

                  <div>
                    <p className="text-sm text-slate-500 mb-1">Documentos adjuntos</p>
                    <p className="font-semibold text-slate-800">{documentos.length} archivo(s)</p>
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    onClick={() => setPaso(2)}
                    variant="outline"
                    className="border-slate-300"
                  >
                    Atrás
                  </Button>
                  <Button
                    onClick={guardarFactura}
                    disabled={guardando}
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
                        Guardar Factura
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}