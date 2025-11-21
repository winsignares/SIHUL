import { apiClient } from '../../core/apiClient';
import { ENDPOINTS } from '../../core/endpoints';
import type {
  Reserva,
  CreateReservaDto,
  UpdateReservaDto,
  ReservasResponse,
  ReservaResponse,
} from '../../models/reserva';

export const reservasService = {
  async getAll(): Promise<Reserva[]> {
    const response = await apiClient.get<{ prestamos: any[] }>(ENDPOINTS.PRESTAMOS.LIST);
    return response.prestamos;
  },

  async getById(id: number): Promise<Reserva> {
    return await apiClient.get<Reserva>(ENDPOINTS.PRESTAMOS.GET(id));
  },

  async create(data: CreateReservaDto): Promise<Reserva> {
    const response = await apiClient.post<{ message: string; id: number }>(ENDPOINTS.PRESTAMOS.CREATE, data);
    return await this.getById(response.id);
  },

  async update(data: UpdateReservaDto): Promise<Reserva> {
    const response = await apiClient.put<{ message: string; id: number }>(ENDPOINTS.PRESTAMOS.UPDATE, data);
    return await this.getById(response.id);
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(ENDPOINTS.PRESTAMOS.DELETE, { id });
  },

  async aprobar(id: number): Promise<Reserva> {
    const updated = await this.update({ id, estado: 'Aprobado' as any });
    return updated;
  },

  async rechazar(id: number): Promise<Reserva> {
    const updated = await this.update({ id, estado: 'Rechazado' as any });
    return updated;
  },

  async cancelar(id: number): Promise<Reserva> {
    const updated = await this.update({ id, estado: 'Vencido' as any });
    return updated;
  },
};
