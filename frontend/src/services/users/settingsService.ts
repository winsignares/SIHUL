/**
 * Servicio para gestionar las configuraciones de usuario (ajustes)
 * Incluye notificaciones, preferencias de sistema, etc.
 */

// Interfaces para las configuraciones
export interface NotificationSettings {
  emailNuevaSolicitud: boolean;
  emailConflicto: boolean;
  emailMensaje: boolean;
  pushNuevaSolicitud: boolean;
  pushConflicto: boolean;
  pushMensaje: boolean;
  sonido: boolean;
}

export interface SystemSettings {
  idioma: string;
  zonaHoraria: string;
  formatoFecha: string;
  formatoHora: string;
}

export interface UserSettings {
  notificaciones: NotificationSettings;
  sistema: SystemSettings;
  theme?: 'light' | 'dark';
}

// Claves de localStorage
const STORAGE_KEYS = {
  NOTIFICATIONS: 'notificaciones_preferencias',
  SYSTEM: 'sistema_config',
  THEME: 'theme'
};

// Valores por defecto
const DEFAULT_NOTIFICATIONS: NotificationSettings = {
  emailNuevaSolicitud: true,
  emailConflicto: true,
  emailMensaje: false,
  pushNuevaSolicitud: true,
  pushConflicto: true,
  pushMensaje: true,
  sonido: true
};

const DEFAULT_SYSTEM: SystemSettings = {
  idioma: 'es',
  zonaHoraria: 'America/Bogota',
  formatoFecha: 'DD/MM/YYYY',
  formatoHora: '24h'
};

/**
 * Servicio para gestionar configuraciones de usuario
 */
export const settingsService = {
  /**
   * Obtiene las preferencias de notificaciones guardadas
   */
  getNotificationSettings(): NotificationSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error al cargar preferencias de notificaciones:', error);
    }
    return DEFAULT_NOTIFICATIONS;
  },

  /**
   * Guarda las preferencias de notificaciones
   */
  saveNotificationSettings(settings: NotificationSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(settings));
    } catch (error) {
      console.error('Error al guardar preferencias de notificaciones:', error);
      throw new Error('No se pudieron guardar las preferencias de notificaciones');
    }
  },

  /**
   * Obtiene la configuración del sistema
   */
  getSystemSettings(): SystemSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.SYSTEM);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error al cargar configuración del sistema:', error);
    }
    return DEFAULT_SYSTEM;
  },

  /**
   * Guarda la configuración del sistema
   */
  saveSystemSettings(settings: SystemSettings): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SYSTEM, JSON.stringify(settings));
    } catch (error) {
      console.error('Error al guardar configuración del sistema:', error);
      throw new Error('No se pudo guardar la configuración del sistema');
    }
  },

  /**
   * Obtiene todas las configuraciones del usuario
   */
  getAllSettings(): UserSettings {
    return {
      notificaciones: this.getNotificationSettings(),
      sistema: this.getSystemSettings(),
      theme: (localStorage.getItem(STORAGE_KEYS.THEME) as 'light' | 'dark') || 'light'
    };
  },

  /**
   * Guarda todas las configuraciones del usuario
   */
  saveAllSettings(settings: Partial<UserSettings>): void {
    if (settings.notificaciones) {
      this.saveNotificationSettings(settings.notificaciones);
    }
    if (settings.sistema) {
      this.saveSystemSettings(settings.sistema);
    }
    if (settings.theme) {
      localStorage.setItem(STORAGE_KEYS.THEME, settings.theme);
    }
  },

  /**
   * Resetea todas las configuraciones a los valores por defecto
   */
  resetToDefaults(): void {
    this.saveNotificationSettings(DEFAULT_NOTIFICATIONS);
    this.saveSystemSettings(DEFAULT_SYSTEM);
    localStorage.removeItem(STORAGE_KEYS.THEME);
  },

  /**
   * Limpia todas las configuraciones guardadas
   */
  clearAllSettings(): void {
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SYSTEM);
    localStorage.removeItem(STORAGE_KEYS.THEME);
  }
};
