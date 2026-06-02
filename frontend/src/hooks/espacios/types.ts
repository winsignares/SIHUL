import type { PrestamoEspacio } from '../../services/prestamos/prestamoAPI';

export interface EspacioView {
  id: string;
  nombre: string;
  tipo: string;
  capacidad: number;
  sede: string;
  edificio: string;
  estado: 'disponible' | 'ocupado' | 'mantenimiento';
  estaAbierto: boolean;
  proximaClase?: string;
  ubicacion?: string;
}

export interface OcupacionView {
  id?: number;
  espacioId: string;
  dia: string;
  horaInicio: number;
  horaFin: number;
  materia: string;
  docente?: string;
  grupo?: string;
  estado: string;
  tipo?: 'horario' | 'prestamo';
  prestamo?: PrestamoEspacio;
}

export interface SeleccionRango {
  espacioId: string;
  dia: string;
  horaInicio: number;
  horaFin: number;
}

export interface ConflictoInfo {
  tipo: 'horario' | 'prestamo';
  materia: string;
  horaInicio: number;
  horaFin: number;
}

export interface NuevaSolicitudData {
  espacio_id: number;
  espacio_nombre: string;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  diaSemana: string;
  conflictos?: ConflictoInfo[];
}

export interface MensajeFiltroFecha {
  tipo: 'error' | 'info';
  texto: string;
}

export interface EncabezadoDiaCronograma {
  dia: string;
  fecha: string;
}
