// ============================================
// MODELOS DE DATOS DEL SISTEMA
// ============================================

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  password: string; // En producción esto estaría hasheado
  rol: 'admin' | 'autorizado' | 'consultor' | 'consultor_estudiante' | 'consultor_docente' | 'supervisor_general';
  permisos: PermisoComponente[];
  programasRestringidos: string[]; // IDs de programas
  accesoTodosProgramas?: boolean; // Nuevo campo opcional
  gruposAsignados?: string[]; // Códigos de grupos (INSI-A, DERE-B, etc.) - Solo para estudiantes
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
}

export interface PermisoComponente {
  componenteId: string;
  permiso: 'ver' | 'editar';
}

export interface Sede {
  id: string;
  codigo: string;
  nombre: string;
  activa: boolean;
  fechaCreacion: string;
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
  emailContacto?: string;
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
  nombre: string; // Nombre del grupo (ej: Grupo A, Grupo B)
  asignaturaId: string;
  programaId: string;
  periodoId: string;
  semestre: number; // Semestre al que pertenece el grupo
  docente?: string;
  cantidadEstudiantes: number;
  modalidad: 'presencial' | 'virtual' | 'hibrida';
  activo: boolean;
  fechaCreacion: string;
}

export interface HorarioAcademico {
  id: string;
  asignaturaId?: string;
  docenteId?: string;
  grupoId?: string;
  espacioId?: string;
  diaSemana: string;
  horaInicio: string;
  horaFin: string;
}

export interface Docente {
  id: string;
  nombre: string;
  email: string;
  telefono?: string;
  especialidad?: string;
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