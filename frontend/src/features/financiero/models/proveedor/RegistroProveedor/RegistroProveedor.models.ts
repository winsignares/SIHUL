import type {
  BancoCatalogo,
  CiudadCatalogo,
  DepartamentoGeograficoCatalogo,
  PaisCatalogo,
  TipoCuentaCatalogo,
} from '../../core.models';

export type RegistroProveedorForm = {
  nombre: string;
  correo: string;
  confirmarCorreo: string;
  contrasena: string;
  confirmarContrasena: string;
  nit: string;
  razonSocial: string;
  nombreComercial: string;
  tipoProveedor: 'Bienes' | 'Servicios';
  tipoPersona: 'Jurídica' | 'Natural';
  direccion: string;
  paisId: string;
  departamentoId: string;
  ciudadId: string;
  telefono: string;
  correoEmpresa: string;
  bancoId: string;
  tipoCuentaId: string;
  numeroCuenta: string;
  regimenTributario: string;
};

export type RegistroProveedorCatalogos = {
  paises: PaisCatalogo[];
  departamentos: DepartamentoGeograficoCatalogo[];
  ciudades: CiudadCatalogo[];
  bancos: BancoCatalogo[];
  tiposCuenta: TipoCuentaCatalogo[];
};

export type RegistroProveedorPayload = {
  nombre: string;
  correo: string;
  contrasena: string;
  nit: string;
  razon_social: string;
  nombre_comercial: string;
  tipo_proveedor: 'Bienes' | 'Servicios';
  tipo_persona: 'Jurídica' | 'Natural';
  direccion: string;
  pais_id: number;
  departamento_geo_id: number;
  ciudad_id: number;
  telefono: string;
  email: string;
  banco_id: number;
  tipo_cuenta_id: number;
  numero_cuenta: string;
  regimen_tributario: string;
};
