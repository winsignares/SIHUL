// Base URL del backend Django
const API_BASE = '';

export const ENDPOINTS = {
  // ========== Autenticación y Usuarios ==========
  USUARIOS: {
    CREATE: '/usuarios/',
    UPDATE: '/usuarios/update/',
    DELETE: '/usuarios/delete/',
    GET: (id: number) => `/usuarios/${id}/`,
    LIST: '/usuarios/list/',
    LOGIN: '/usuarios/login/',
    LOGOUT: '/usuarios/logout/',
    CHANGE_PASSWORD: '/usuarios/change-password/',
  },

  // ========== Roles ==========
  ROLES: {
    CREATE: '/usuarios/roles/',
    UPDATE: '/usuarios/roles/update/',
    DELETE: '/usuarios/roles/delete/',
    GET: (id: number) => `/usuarios/roles/${id}/`,
    LIST: '/usuarios/roles/list/',
  },

  // ========== Sedes ==========
  SEDES: {
    CREATE: '/sedes/',
    UPDATE: '/sedes/update/',
    DELETE: '/sedes/delete/',
    GET: (id: number) => `/sedes/${id}/`,
    LIST: '/sedes/list/',
    ESPACIOS: (sedeId: number) => `/sedes/${sedeId}/espacios/`,
  },

  // ========== Facultades ==========
  FACULTADES: {
    CREATE: '/facultades/',
    UPDATE: '/facultades/update/',
    DELETE: '/facultades/delete/',
    GET: (id: number) => `/facultades/${id}/`,
    LIST: '/facultades/list/',
    PROGRAMAS: (facultadId: number) => `/facultades/${facultadId}/programas/`,
  },

  // ========== Programas ==========
  PROGRAMAS: {
    CREATE: '/programas/',
    UPDATE: '/programas/update/',
    DELETE: '/programas/delete/',
    GET: (id: number) => `/programas/${id}/`,
    LIST: '/programas/list/',
    GRUPOS: (programaId: number) => `/programas/${programaId}/grupos/`,
  },

  // ========== Períodos Académicos ==========
  PERIODOS: {
    CREATE: '/periodos/',
    UPDATE: '/periodos/update/',
    DELETE: '/periodos/delete/',
    GET: (id: number) => `/periodos/${id}/`,
    LIST: '/periodos/list/',
  },

  // ========== Grupos ==========
  GRUPOS: {
    CREATE: '/grupos/',
    UPDATE: '/grupos/update/',
    DELETE: '/grupos/delete/',
    GET: (id: number) => `/grupos/${id}/`,
    LIST: '/grupos/list/',
  },

  // ========== Asignaturas ==========
  ASIGNATURAS: {
    CREATE: '/asignaturas/',
    UPDATE: '/asignaturas/update/',
    DELETE: '/asignaturas/delete/',
    GET: (id: number) => `/asignaturas/${id}/`,
    LIST: '/asignaturas/list/',
  },

  // ========== Espacios Físicos ==========
  ESPACIOS: {
    CREATE: '/espacios/',
    UPDATE: '/espacios/update/',
    DELETE: '/espacios/delete/',
    GET: (id: number) => `/espacios/${id}/`,
    LIST: '/espacios/list/',
    RECURSOS: (espacioId: number) => `/espacios/${espacioId}/recursos/`,
    OCUPACION: '/espacios/ocupacion/',
    VALIDAR_DISPONIBILIDAD: '/espacios/validar-disponibilidad/',
  },

  // ========== Recursos ==========
  RECURSOS: {
    CREATE: '/recursos/',
    UPDATE: '/recursos/update/',
    DELETE: '/recursos/delete/',
    GET: (id: number) => `/recursos/${id}/`,
    LIST: '/recursos/list/',
  },

  // ========== Espacio-Recurso ==========
  ESPACIO_RECURSO: {
    CREATE: '/recursos/espacio-recurso/',
    UPDATE: '/recursos/espacio-recurso/update/',
    DELETE: '/recursos/espacio-recurso/delete/',
    GET: (espacioId: number, recursoId: number) => `/recursos/espacio-recurso/${espacioId}/${recursoId}/`,
    LIST: '/recursos/espacio-recurso/list/',
  },

  // ========== Préstamos de Espacios ==========
  PRESTAMOS: {
    CREATE: '/prestamos/',
    UPDATE: '/prestamos/update/',
    DELETE: '/prestamos/delete/',
    GET: (id: number) => `/prestamos/${id}/`,
    LIST: '/prestamos/list/',
  },

  // ========== Horarios ==========
  HORARIOS: {
    CREATE: '/horario/',
    UPDATE: '/horario/update/',
    DELETE: '/horario/delete/',
    GET: (id: number) => `/horario/${id}/`,
    LIST: '/horario/list/',
    BY_DOCENTE: (docenteId: number) => `/horario/docente/${docenteId}/`,
    BY_ESTUDIANTE: (estudianteId: number) => `/horario/estudiante/${estudianteId}/`,
    BY_GRUPO: (grupoId: number) => `/horario/grupo/${grupoId}/`,
    BY_ESPACIO: (espacioId: number) => `/horario/espacio/${espacioId}/`,
  },

  // ========== Horarios Fusionados ==========
  HORARIOS_FUSIONADOS: {
    CREATE: '/horario/fusionado/',
    UPDATE: '/horario/fusionado/update/',
    DELETE: '/horario/fusionado/delete/',
    GET: (id: number) => `/horario/fusionado/${id}/`,
    LIST: '/horario/fusionado/list/',
  },

  // Alias para compatibilidad con código existente
  AUTH: {
    LOGIN: '/usuarios/login/',
    LOGOUT: '/usuarios/logout/',
    ME: '/usuarios/me/',
  },

  // Alias para reservas (préstamos)
  RESERVAS: {
    ROOT: '/prestamos/',
    BY_ID: (id: number) => `/prestamos/${id}/`,
    BY_USUARIO: (usuarioId: number) => `/prestamos/usuario/${usuarioId}/`,
    BY_ESPACIO: (espacioId: number) => `/prestamos/espacio/${espacioId}/`,
  },

  // ========== Dashboard y Estadísticas ==========
  DASHBOARD: {
    ESTADISTICAS: '/dashboard/estadisticas/',
  },

  // ========== Notificaciones ==========
  NOTIFICACIONES: {
    BY_USUARIO: (usuarioId: number) => `/usuarios/${usuarioId}/notificaciones/`,
    MARCAR_LEIDA: (notificacionId: number) => `/notificaciones/${notificacionId}/marcar-leida/`,
  },

  // ========== Reportes ==========
  REPORTES: {
    OCUPACION_ESPACIOS: '/reportes/ocupacion-espacios/',
  },

  // ========== Búsqueda ==========
  BUSQUEDA: {
    GLOBAL: '/buscar/',
  },
};

