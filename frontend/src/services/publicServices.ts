import { apiClient } from '../core/apiClient';

export const publicServices = {
  verifyRecaptcha: async (token: string) => {
    try {
      const response = await apiClient.post('/prestamos/public/recaptcha/', {
        recaptcha_token: token,
      });
      return response;
    } catch (error) {
      console.error('Error al validar reCAPTCHA público:', error);
      throw error;
    }
  },

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
