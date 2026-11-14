import { BarChart3, User, Building, PieChart, TrendingUp } from 'lucide-react';
import type {
    DatoOcupacionJornada,
    EspacioMasUsado,
    HorarioDocente,
    DisponibilidadEspacio,
    CapacidadUtilizada,
    ReporteDisponible
} from '../../../models';
import type { EstadoHorarioReporte } from '../services/reporteOcupacionAPI';

export interface Docente {
    id: number | string;
    nombre: string;
    correo?: string;
}

export const REPORTES_HORARIOS_CACHE_KEY = 'reporte-reportes-horarios';
export const REPORTES_OCUPACION_CACHE_KEY = 'reporte-reportes-ocupacion';
export const REPORTES_DISPONIBILIDAD_CACHE_KEY = 'reporte-reportes-disponibilidad';
export const REPORTES_CAPACIDAD_CACHE_KEY = 'reporte-reportes-capacidad';

export const PERIODO_LOADING = 'Cargando...';
export const PERIODO_EMPTY = 'Sin periodo activo';

// Datos por defecto mientras se cargan los datos reales
export const datosOcupacionDefault: DatoOcupacionJornada[] = [
    { jornada: 'Mañana (07:00 - 12:00)', ocupacion: 85, espacios: 45, color: 'bg-blue-600' },
    { jornada: 'Tarde (14:00 - 18:00)', ocupacion: 92, espacios: 38, color: 'bg-red-600' },
    { jornada: 'Noche (18:00 - 21:00)', ocupacion: 68, espacios: 22, color: 'bg-yellow-600' }
];

export const espaciosMasUsadosDefault: EspacioMasUsado[] = [
    { espacio: 'Aula 101', usos: 28, ocupacion: 95 },
    { espacio: 'Laboratorio 301', usos: 24, ocupacion: 88 },
    { espacio: 'Aula 205', usos: 22, ocupacion: 82 },
    { espacio: 'Auditorio Central', usos: 18, ocupacion: 75 },
    { espacio: 'Aula 102', usos: 16, ocupacion: 70 }
];

export const horariosDocente: HorarioDocente[] = [
    { dia: 'Lunes', hora: '07:00-09:00', asignatura: 'Programación I', grupo: 'INSI-A', espacio: 'Aula 101', docente: 'Dr. Juan Pérez' },
    { dia: 'Martes', hora: '07:00-09:00', asignatura: 'Bases de Datos', grupo: 'INSI-B', espacio: 'Lab 301', docente: 'Dr. Juan Pérez' },
    { dia: 'Martes', hora: '14:00-16:00', asignatura: 'Estadística', grupo: 'ADEM-B', espacio: 'Aula 103', docente: 'Dr. Juan Pérez' },
    { dia: 'Jueves', hora: '07:00-09:00', asignatura: 'Programación I', grupo: 'INSI-C', espacio: 'Aula 102', docente: 'Dr. Juan Pérez' },
    { dia: 'Viernes', hora: '09:00-11:00', asignatura: 'Algoritmos', grupo: 'INSI-A', espacio: 'Lab 401', docente: 'Dr. Juan Pérez' }
];

export const disponibilidadEspaciosDefault: DisponibilidadEspacio[] = [
    { nombre: 'Aula 101', tipo: 'Aula', horasDisponibles: 12, horasOcupadas: 38, porcentajeOcupacion: 76 },
    { nombre: 'Lab 301', tipo: 'Laboratorio', horasDisponibles: 20, horasOcupadas: 30, porcentajeOcupacion: 60 },
    { nombre: 'Auditorio Central', tipo: 'Auditorio', horasDisponibles: 35, horasOcupadas: 15, porcentajeOcupacion: 30 },
    { nombre: 'Aula 205', tipo: 'Aula', horasDisponibles: 18, horasOcupadas: 32, porcentajeOcupacion: 64 },
    { nombre: 'Lab 401', tipo: 'Laboratorio', horasDisponibles: 25, horasOcupadas: 25, porcentajeOcupacion: 50 }
];

export const capacidadUtilizadaDefault: CapacidadUtilizada[] = [
    { tipo: 'Aulas Estándar', capacidadTotal: 1500, capacidadUsada: 1230, porcentaje: 82 },
    { tipo: 'Laboratorios', capacidadTotal: 600, capacidadUsada: 420, porcentaje: 70 },
    { tipo: 'Auditorios', capacidadTotal: 800, capacidadUsada: 320, porcentaje: 40 },
    { tipo: 'Salas de Juntas', capacidadTotal: 200, capacidadUsada: 150, porcentaje: 75 }
];

export const reportesDisponibles: ReporteDisponible[] = [
    { id: 'ocupacion', nombre: 'Ocupación de Espacios', icon: BarChart3, color: 'text-blue-600', descripcion: 'Análisis de ocupación por jornada (RF20-1)' },
    { id: 'horarios-docente', nombre: 'Horarios por Docente', icon: User, color: 'text-red-600', descripcion: 'Horarios asignados a cada docente (RF20-2)' },
    { id: 'horarios-programa', nombre: 'Horarios por Programa', icon: Building, color: 'text-yellow-600', descripcion: 'Horarios por programa y grupo (RF20-2)' },
    { id: 'disponibilidad', nombre: 'Disponibilidad General', icon: PieChart, color: 'text-green-600', descripcion: 'Disponibilidad de espacios físicos (RF20-3)' },
    { id: 'capacidad', nombre: 'Capacidad Utilizada', icon: TrendingUp, color: 'text-purple-600', descripcion: 'Análisis de capacidad instalada (RF20-4)' }
];

export const estadosReporte: { id: EstadoHorarioReporte; nombre: string }[] = [
    { id: 'aprobado', nombre: 'Aprobados' },
    { id: 'pendiente', nombre: 'Pendientes' },
    { id: 'todos', nombre: 'Todos' }
];
