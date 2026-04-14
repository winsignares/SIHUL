// ============================================
// MODELOS DE DATOS DEL SISTEMA
// ============================================

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string; // En producción esto estaría hasheado
  rol: 'admin' | 'autorizado' | 'consultor' | 'consultor-estudiante' | 'consultor-docente' | 'supervisor-salones' | 'funcionario' | 'contabilidad' | 'tesoreria' | 'auditoria' | 'direccion-financiera' | 'rectoria';
  permisos: PermisoComponente[];
  programasRestringidos: string[]; // IDs de programas
  gruposAsignados?: string[]; // Códigos de grupos (INSI-A, DERE-B, etc.) - Solo para estudiantes
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

export interface PermisoComponente {
  componenteId: string;
  permiso: 'ver' | 'editar';
}

export interface Facultad {
  id: string;
  codigo: string;
  nombre: string;
  decano?: string;
  telefono?: string;
  email?: string;
  activa: boolean;
  fechaCreacion: string;
}

export interface Programa {
  id: string;
  codigo: string;
  nombre: string;
  facultadId: string;
  director?: string;
  modalidad: 'presencial' | 'virtual' | 'distancia';
  nivel: 'pregrado' | 'posgrado' | 'tecnico' | 'tecnologico';
  creditos?: number;
  duracion?: string;
  semestres: number; // Número de semestres del programa
  activo: boolean;
  fechaCreacion: string;
}

export interface PeriodoAcademico {
  id: string;
  codigo: string;
  nombre: string;
  fechaInicio: string;
  fechaFin: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface Asignatura {
  id: string;
  codigo: string;
  nombre: string;
  programaId: string;
  creditos: number;
  horasSemana: number;
  semestre: number;
  tipo: 'teorica' | 'practica' | 'teorico-practica';
  recursosRequeridos?: RecursoRequerido[]; // Recursos que necesita la asignatura
  activa: boolean;
  fechaCreacion: string;
}

export interface RecursoRequerido {
  tipo: string; // 'computador', 'proyector', 'software', 'laboratorio', etc.
  cantidad: number;
  especificaciones?: string; // Detalles específicos del recurso
}

export interface Grupo {
  id: string;
  codigo: string;
  asignaturaId: string;
  programaId: string;
  periodoId: string;
  docente?: string;
  cantidadEstudiantes: number;
  modalidad: 'presencial' | 'virtual' | 'hibrida';
  activo: boolean;
  fechaCreacion: string;
}

export interface RecursoConEstado {
  nombre: string;
  estado: 'Disponible' | 'Mantenimiento' | 'Perdido' | 'No Disponible';
}

export interface EspacioFisico {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'aula' | 'laboratorio' | 'auditorio' | 'sala' | 'otro';
  sede: string;
  piso?: string;
  capacidad: number;
  recursos: string[]; // Lista de recursos disponibles (para compatibilidad)
  recursosConEstado?: RecursoConEstado[]; // Lista de recursos con su estado individual
  descripcion?: string; // Descripción opcional del espacio
  estado: 'Disponible' | 'Mantenimiento' | 'No Disponible';
  fechaCreacion: string;
}

export interface EquipamientoEspacio {
  item: string;
  cantidad: number;
  estado: 'bueno' | 'regular' | 'malo';
}

export interface HorarioAcademico {
  id: string;
  grupoId: string;
  espacioId: string;
  periodoId: string;
  diaSemana: 'lunes' | 'martes' | 'miercoles' | 'jueves' | 'viernes' | 'sabado';
  horaInicio: string;
  horaFin: string;
  activo: boolean;
  fechaCreacion: string;
}

export interface PrestamoEspacio {
  id: string;
  espacioId: string;
  solicitante: string;
  emailSolicitante: string;
  programaId: string;
  motivo: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  aprobadoPor?: string;
  observaciones?: string;
  fechaSolicitud: string;
  fechaRespuesta?: string;
}

export interface RecursoAudiovisual {
  id: string;
  codigo: string;
  nombre: string;
  tipo: 'proyector' | 'camara' | 'microfono' | 'computador' | 'tableta' | 'otro';
  marca?: string;
  modelo?: string;
  serial?: string;
  estado: 'disponible' | 'prestado' | 'mantenimiento' | 'dañado';
  ubicacion?: string;
  fechaAdquisicion?: string;
  fechaCreacion: string;
}

export interface PrestamoRecurso {
  id: string;
  recursoId: string;
  solicitante: string;
  emailSolicitante: string;
  motivo: string;
  fechaInicio: string;
  fechaFin: string;
  horaInicio: string;
  horaFin: string;
  estado: 'pendiente' | 'aprobado' | 'rechazado' | 'devuelto';
  aprobadoPor?: string;
  observaciones?: string;
  fechaSolicitud: string;
  fechaRespuesta?: string;
}

export interface Notificacion {
  id: string;
  usuarioId: string;
  tipo: 'info' | 'advertencia' | 'error' | 'exito';
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
  accion?: {
    texto: string;
    url: string;
  };
}

export interface MensajeChat {
  id: string;
  remitenteId: string;
  destinatarioId: string;
  mensaje: string;
  leido: boolean;
  fecha: string;
}

// Tipos para estadísticas
export interface EstadisticasDashboard {
  totalEstudiantes: number;
  totalEspacios: number;
  totalProgramas: number;
  totalHorarios: number;
  espaciosDisponibles: number;
  prestamoPendientes: number;
  ocupacionPromedio: number;
  tendencias: {
    estudiantes: number;
    espacios: number;
    programas: number;
  };
}

// ============================================
// MODELOS DE CUENTAS POR PAGAR
// ============================================

export interface CuentaPorPagar {
  id: string;
  numeroFactura: string;
  fechaFactura: string;
  proveedor: string;
  valorTotal: number;
  areaSolicitante: string;
  tipoDocumento: string;
  archivosAdjuntos: ArchivoAdjunto[];
  observacionesIniciales?: string;
  estado: 'Recibida' | 'Radicada' | 'Causada' | 'Devuelta' | 'Alistada' | 'Aprobada Auditoría' | 'Rechazada Auditoría' | 'Cargada' | 'Autorizada para Pago' | 'Rechazada Presidencia' | 'Pagada' | 'Excepción';
  numeroRadicado?: string;
  fechaRadicacion?: string;
  cuentaContable?: string;
  fechaCausacion?: string;
  comprobanteEgreso?: string;
  fechaAlistamiento?: string;
  fechaAprobacionAuditoria?: string;
  fechaCargue?: string;
  fechaAutorizacion?: string;
  fechaPago?: string;
  numeroTransaccion?: string;
  medioPago?: string;
  trazabilidad: TrazabilidadCuenta[];
  fechaRecepcion: string;
  funcionarioRecepcion: string;
  diasTranscurridos?: number;
}

export interface ArchivoAdjunto {
  id: string;
  nombre: string;
  tipo: string;
  url: string;
  fechaCarga: string;
  cargadoPor: string;
}

export interface TrazabilidadCuenta {
  id: string;
  usuario: string;
  rol: string;
  accion: string;
  fecha: string;
  estadoAnterior: string;
  estadoNuevo: string;
  observaciones?: string;
  dependencia: string;
}

export interface Proveedor {
  id: string;
  nit: string;
  razonSocial: string;
  nombreComercial?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  ciudad?: string;
  activo: boolean;
  fechaCreacion: string;
}