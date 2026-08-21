import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { catalogosProveedoresService, registroProveedorService } from '../../../../services/financiero';
import type {
  RegistroProveedorCatalogos,
  RegistroProveedorForm,
  RegistroProveedorPayload,
} from '../../../../models/financiero/proveedor/RegistroProveedor';

const initialForm: RegistroProveedorForm = {
  nombre: '',
  correo: '',
  confirmarCorreo: '',
  contrasena: '',
  confirmarContrasena: '',
  nit: '',
  razonSocial: '',
  nombreComercial: '',
  tipoProveedor: 'Servicios',
  tipoPersona: 'Jurídica',
  direccion: '',
  paisId: '',
  departamentoId: '',
  ciudadId: '',
  telefono: '',
  correoEmpresa: '',
  bancoId: '',
  tipoCuentaId: '',
  numeroCuenta: '',
  regimenTributario: '',
};

const emptyCatalogos: RegistroProveedorCatalogos = {
  paises: [], departamentos: [], ciudades: [], bancos: [], tiposCuenta: [],
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function useRegistroProveedor() {
  const navigate = useNavigate();
  const [form, setForm] = useState<RegistroProveedorForm>(initialForm);
  const [catalogos, setCatalogos] = useState<RegistroProveedorCatalogos>(emptyCatalogos);
  const [cargandoCatalogos, setCargandoCatalogos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const envioEnCurso = useRef(false);
  const redireccionExitosa = useRef<number | null>(null);

  useEffect(() => () => {
    if (redireccionExitosa.current !== null) window.clearTimeout(redireccionExitosa.current);
  }, []);

  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [paises, departamentos, ciudades, bancos, tiposCuenta] = await Promise.all([
          catalogosProveedoresService.getPaises(),
          catalogosProveedoresService.getDepartamentos(),
          catalogosProveedoresService.getCiudades(),
          catalogosProveedoresService.getBancos(),
          catalogosProveedoresService.getTiposCuenta(),
        ]);
        setCatalogos({ paises, departamentos, ciudades, bancos, tiposCuenta });
      } catch {
        setError('No fue posible cargar los catálogos. Recarga la página e intenta nuevamente.');
      } finally {
        setCargandoCatalogos(false);
      }
    };

    void cargarCatalogos();
  }, []);

  const departamentosDisponibles = useMemo(
    () => catalogos.departamentos.filter((item) => !form.paisId || String(item.pais_id) === form.paisId),
    [catalogos.departamentos, form.paisId],
  );

  const ciudadesDisponibles = useMemo(
    () => catalogos.ciudades.filter((item) => !form.departamentoId || String(item.departamento_id) === form.departamentoId),
    [catalogos.ciudades, form.departamentoId],
  );

  const actualizarCampo = <K extends keyof RegistroProveedorForm>(campo: K, valor: RegistroProveedorForm[K]) => {
    setForm((actual) => {
      const siguiente = { ...actual, [campo]: valor };
      if (campo === 'paisId') {
        siguiente.departamentoId = '';
        siguiente.ciudadId = '';
      }
      if (campo === 'departamentoId') {
        siguiente.ciudadId = '';
      }
      return siguiente;
    });
    if (error) setError('');
    if (exito) setExito('');
  };

  const validar = (): string | null => {
    const requeridos: Array<[keyof RegistroProveedorForm, string]> = [
      ['nombre', 'Indica el nombre para la cuenta de acceso.'],
      ['correo', 'Indica el correo de acceso.'],
      ['contrasena', 'Define una contraseña.'],
      ['nit', 'Indica el NIT del proveedor.'],
      ['razonSocial', 'Indica la razón social.'],
      ['nombreComercial', 'Indica el nombre comercial.'],
      ['direccion', 'Indica la dirección.'],
      ['paisId', 'Selecciona el país.'],
      ['departamentoId', 'Selecciona el departamento.'],
      ['ciudadId', 'Selecciona la ciudad.'],
      ['telefono', 'Indica el teléfono principal.'],
      ['correoEmpresa', 'Indica el correo de contacto de la empresa.'],
      ['bancoId', 'Selecciona el banco.'],
      ['tipoCuentaId', 'Selecciona el tipo de cuenta.'],
      ['numeroCuenta', 'Indica el número de cuenta.'],
      ['regimenTributario', 'Selecciona el régimen tributario.'],
    ];

    const faltante = requeridos.find(([campo]) => !String(form[campo]).trim());
    if (faltante) return faltante[1];
    if (!emailPattern.test(form.correo.trim())) return 'El correo de acceso no es válido.';
    if (!form.correo.trim().toLowerCase().endsWith('@unilibre.edu.co')) return 'El correo de acceso debe terminar en @unilibre.edu.co.';
    if (form.correo.trim().toLowerCase() !== form.confirmarCorreo.trim().toLowerCase()) return 'Los correos no coinciden.';
    if (!emailPattern.test(form.correoEmpresa.trim())) return 'El correo de contacto de la empresa no es válido.';
    if (form.contrasena.length < 6) return 'La contraseña debe tener al menos 6 caracteres.';
    if (form.contrasena !== form.confirmarContrasena) return 'Las contraseñas no coinciden.';
    return null;
  };

  const enviarRegistro = async (event: FormEvent) => {
    event.preventDefault();
    if (envioEnCurso.current || exito) return;

    const mensajeValidacion = validar();
    if (mensajeValidacion) {
      setError(mensajeValidacion);
      return;
    }

    const payload: RegistroProveedorPayload = {
      nombre: form.nombre.trim(),
      correo: form.correo.trim().toLowerCase(),
      contrasena: form.contrasena,
      nit: form.nit.trim(),
      razon_social: form.razonSocial.trim(),
      nombre_comercial: form.nombreComercial.trim(),
      tipo_proveedor: form.tipoProveedor,
      tipo_persona: form.tipoPersona,
      direccion: form.direccion.trim(),
      pais_id: Number(form.paisId),
      departamento_geo_id: Number(form.departamentoId),
      ciudad_id: Number(form.ciudadId),
      telefono: form.telefono.trim(),
      email: form.correoEmpresa.trim().toLowerCase(),
      banco_id: Number(form.bancoId),
      tipo_cuenta_id: Number(form.tipoCuentaId),
      numero_cuenta: form.numeroCuenta.trim(),
      regimen_tributario: form.regimenTributario,
    };

    envioEnCurso.current = true;
    setEnviando(true);
    setError('');
    try {
      await registroProveedorService.registrar(payload);
      setExito('Registro realizado correctamente. Ya puedes iniciar sesión con tu correo institucional.');
      redireccionExitosa.current = window.setTimeout(() => {
        navigate('/login', {
          replace: true,
          state: { successMessage: 'Tu registro como proveedor fue realizado correctamente. Ya puedes iniciar sesión.' },
        });
      }, 2500);
    } catch (respuesta: unknown) {
      const mensajeApi = typeof respuesta === 'object' && respuesta !== null && 'message' in respuesta
        ? (respuesta as { message?: unknown }).message
        : undefined;
      const mensaje = typeof mensajeApi === 'string'
        ? mensajeApi
        : respuesta instanceof Error
          ? respuesta.message
          : 'No fue posible completar el registro. Intenta nuevamente.';
      setError(mensaje);
    } finally {
      envioEnCurso.current = false;
      setEnviando(false);
    }
  };

  return {
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
    volverLogin: () => navigate('/login'),
  };
}
