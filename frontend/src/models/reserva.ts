export interface Reserva {
  id: number;
  usuario_id: number;
  espacio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string;
  estado: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  observaciones?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreateReservaDto {
  espacio_id: number;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  motivo: string;
}

export interface UpdateReservaDto {
  id: number;
  espacio_id?: number;
  fecha?: string;
  hora_inicio?: string;
  hora_fin?: string;
  motivo?: string;
  estado?: 'pendiente' | 'aprobada' | 'rechazada' | 'cancelada';
  observaciones?: string;
}

export interface ReservasResponse {
  reservas: Reserva[];
  total: number;
}

export interface ReservaResponse {
  reserva: Reserva;
}
