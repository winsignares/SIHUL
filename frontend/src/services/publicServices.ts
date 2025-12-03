import { apiClient } from '../core/apiClient';

export const publicServices = {
  consultaHorario: async () => {
    try {
      const response = await apiClient.get('/public/consulta-horario');
      return response;
    } catch (error) {
      console.error('Error al obtener consulta de horario:', error);
      throw error;
    }
  },

  disponibilidadEspacios: async () => {
    try {
      const response = await apiClient.get('/public/disponibilidad-espacios');
      return response;
    } catch (error) {
      console.error('Error al obtener disponibilidad de espacios:', error);
      throw error;
    }
  },

  prestamo: async () => {
    try {
      const response = await apiClient.get('/public/prestamo');
      return response;
    } catch (error) {
      console.error('Error al obtener datos de préstamo:', error);
      throw error;
    }
  },

  asistenteVirtual: async () => {
    try {
      const response = await apiClient.get('/public/asistente-virtual');
      return response;
    } catch (error) {
      console.error('Error al obtener datos del asistente virtual:', error);
      throw error;
    }
  }
};
