import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de EspacioFisico
 */
export interface EspacioFisico {
    id?: number;
    nombre: string;
    sede_id: number;
    tipo_id: number;
    tipo_espacio?: {
        id: number;
        nombre: string;
        descripcion?: string;
    };
    capacidad: number;
    descripcion?: string;
    recursos?: { id: number; nombre: string; estado: string }[];
    ubicacion?: string | null;
    estado?: 'Disponible' | 'Mantenimiento' | 'No Disponible';
}

/**
 * Payload para crear un espacio físico
 */
export interface CreateEspacioPayload {
    nombre: string;
    sede_id: number;
    tipo_id: number;
    capacidad: number;
    descripcion?: string;
    recursos?: { id: number; estado: string }[];
    ubicacion?: string | null;
    estado?: 'Disponible' | 'Mantenimiento' | 'No Disponible';
}

/**
 * Payload para actualizar un espacio físico
 */
export interface UpdateEspacioPayload {
    id: number;
    nombre?: string;
    sede_id?: number;
    tipo_id?: number;
    capacidad?: number;
    descripcion?: string;
    recursos?: { id: number; estado: string }[];
    ubicacion?: string | null;
    estado?: 'Disponible' | 'Mantenimiento' | 'No Disponible';
}

/**
 * Payload para eliminar un espacio físico
 */
export interface DeleteEspacioPayload {
    id: number;
}

/**
 * Respuesta de la lista de espacios físicos
 */
export interface ListEspaciosResponse {
    espacios: EspacioFisico[];
}

/**
 * Interfaz para el modelo de TipoEspacio
 */
export interface TipoEspacio {
    id: number;
    nombre: string;
    descripcion?: string;
}

/**
 * Respuesta de la lista de tipos de espacios
 */
export interface ListTiposEspacioResponse {
    tipos_espacio: TipoEspacio[];
}

/**
 * Interfaz para el modelo de EspacioPermitido
 */
export interface EspacioPermitido {
    id?: number;
    espacio_id: number;
    espacio_tipo?: string;
    espacio_ubicacion?: string;
    usuario_id: number;
    usuario_nombre?: string;
    usuario_correo?: string;
}

/**
 * Payload para crear un EspacioPermitido
 */
export interface CreateEspacioPermitidoPayload {
    espacio_id: number;
    usuario_id: number;
}

/**
 * Payload para eliminar un EspacioPermitido
 */
export interface DeleteEspacioPermitidoPayload {
    id: number;
}

/**
 * Respuesta de la lista de espacios permitidos
 */
export interface ListEspaciosPermitidosResponse {
    espacios_permitidos: EspacioPermitido[];
}

/**
 * Respuesta de espacios por usuario
 */
export interface ListEspaciosByUsuarioResponse {
    espacios: EspacioFisico[];
}

/**
 * Servicio de espacios físicos para comunicación con el backend
 */
export const espacioService = {
    /**
     * Crea un nuevo espacio físico
     */
    create: async (payload: CreateEspacioPayload): Promise<{ message: string; id: number }> => {
        return apiClient.post<{ message: string; id: number }>('/espacios/', payload);
    },

    /**
     * Actualiza un espacio físico existente
     */
    update: async (payload: UpdateEspacioPayload): Promise<{ message: string; id: number }> => {
        const updated = await apiClient.put<EspacioFisico>(`/espacios/${payload.id}/`, payload);
        return { message: 'Espacio actualizado', id: updated.id ?? payload.id };
    },

    /**
     * Elimina un espacio físico
     */
    delete: async (payload: DeleteEspacioPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/espacios/${payload.id}/`);
        return { message: 'Espacio eliminado' };
    },

    /**
     * Obtiene un espacio físico por ID
     */
    get: async (id: number): Promise<EspacioFisico> => {
        return apiClient.get<EspacioFisico>(`/espacios/${id}/`);
    },

    /**
     * Lista todos los espacios físicos
     */
    list: async (): Promise<ListEspaciosResponse> => {
        const espacios = await apiClient.get<EspacioFisico[]>('/espacios/');
        return { espacios };
    },

    /**
     * Lista todos los tipos de espacios
     */
    listTipos: async (): Promise<ListTiposEspacioResponse> => {
        const tipos_espacio = await apiClient.get<TipoEspacio[]>('/tipos-espacio/');
        return { tipos_espacio };
    },

    /**
     * Obtiene el estado actual y próxima clase de un espacio
     */
    getEstado: async (espacioId: number): Promise<{
        estado: 'disponible' | 'ocupado' | 'mantenimiento';
        texto_estado: string;
        proxima_clase: {
            asignatura: string;
            docente: string;
            hora_inicio: string;
            hora_fin: string;
            grupo: string;
        } | null;
    }> => {
        return apiClient.get(`/espacios/${espacioId}/estado/`);
    },

    /**
     * Obtiene el horario semanal de un espacio
     */
    getHorario: async (espacioId: number): Promise<{
        horario: {
            dia: string;
            hora_inicio: number;
            hora_fin: number;
            materia: string;
            docente: string;
            grupo: string;
            estado: string;
        }[];
    }> => {
        return apiClient.get(`/espacios/${espacioId}/horario/`);
    },

    /**
     * Cambia el estado de un espacio físico
     * Usado para abrir/cerrar salones desde el supervisor
     */
    cambiarEstado: async (espacioId: number, nuevoEstado: 'Disponible' | 'No Disponible' | 'Mantenimiento'): Promise<{ message: string }> => {
        return apiClient.put<{ message: string }>(`/espacios/${espacioId}/estado/`, { estado: nuevoEstado });
    }
};

/**
 * Servicio de EspacioPermitido para comunicación con el backend
 */
export const espacioPermitidoService = {
    /**
     * Crea un nuevo EspacioPermitido
     */
    create: async (payload: CreateEspacioPermitidoPayload): Promise<{ message: string; id: number; espacio_id: number; usuario_id: number }> => {
        const created = await apiClient.post<EspacioPermitido>('/espacios-permitidos/', payload);
        return {
            message: 'Espacio permitido creado',
            id: created.id ?? 0,
            espacio_id: created.espacio_id,
            usuario_id: created.usuario_id,
        };
    },

    /**
     * Lista todos los EspaciosPermitidos
     */
    list: async (): Promise<ListEspaciosPermitidosResponse> => {
        const espacios_permitidos = await apiClient.get<EspacioPermitido[]>('/espacios-permitidos/');
        return { espacios_permitidos };
    },

    /**
     * Obtiene un EspacioPermitido por ID
     */
    get: async (id: number): Promise<EspacioPermitido> => {
        return apiClient.get<EspacioPermitido>(`/espacios-permitidos/${id}/`);
    },

    /**
     * Elimina un EspacioPermitido
     */
    delete: async (payload: DeleteEspacioPermitidoPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/espacios-permitidos/${payload.id}/`);
        return { message: 'Espacio permitido eliminado' };
    },

    /**
     * Lista todos los espacios permitidos para un usuario específico
     */
    listByUsuario: async (usuario_id: number): Promise<ListEspaciosByUsuarioResponse> => {
        return apiClient.get<ListEspaciosByUsuarioResponse>(`/espacios-permitidos/usuario/${usuario_id}/`);
    }
};
/**
 * Servicio para obtener espacios con horarios (bulk endpoints)
 */
export const espacioHorariosService = {
    /**
     * Obtiene todos los espacios con sus horarios aprobados (para acceso público)
     */
    getAllWithHorarios: async (): Promise<{
        espacios: (EspacioFisico & {
            horarios: {
                id: number;
                dia: string;
                hora_inicio: number;
                hora_fin: number;
                materia: string;
                docente: string;
                grupo: string;
            }[];
        })[];
    }> => {
        return apiClient.get('/espacios/horarios/all/');
    },

    /**
     * Obtiene espacios permitidos con horarios aprobados (para supervisor)
     */
    getSupervisorHorarios: async (usuarioId: number): Promise<{
        espacios: (EspacioFisico & {
            horarios: {
                id: number;
                dia: string;
                hora_inicio: number;
                hora_fin: number;
                materia: string;
                docente: string;
                grupo: string;
            }[];
        })[];
    }> => {
        return apiClient.get(`/espacios/horarios/supervisor/${usuarioId}/`);
    }
};
export interface HorarioEspacio {
    tipoUso: 'Clase' | 'Préstamo';
    asignatura?: string;
    docente?: string;
    tipoActividad?: string;
    solicitante?: string;
    horaInicio: string;
    horaFin: string;
    diaSemana?: string;
    fecha?: string;
    proximaAccion: 'apertura' | 'cierre';
    minutosRestantes: number;
    segundosRestantes: number;
    tiempoRestanteTotal: number;
}

/**
 * Interfaz para un espacio con sus horarios del día
 */
export interface EspacioConHorarios {
    idEspacio: number;
    nombreEspacio: string;
    sede: string;
    piso: string;
    estadoActual: string;
    horarios: HorarioEspacio[];
}

/**
 * Respuesta del endpoint de proximos apertura/cierre
 * Retorna espacios agrupados con sus horarios
 */
export interface ProximosAperturaCierreResponse {
    espacios: EspacioConHorarios[];
    horaActual: string;
    diaActual: string;
    fechaActual: string;
}

/**
 * Servicio para gestión de apertura y cierre de salones
 */
export const aperturaCierreService = {
    /**
     * Obtiene TODOS los salones con aperturas y cierres pendientes
     * para el usuario autenticado (Supervisor General)
     * Retorna lista unificada ordenada por urgencia (tiempo restante)
     */
    getProximos: async (): Promise<ProximosAperturaCierreResponse> => {
        // Obtener user_id del localStorage (AuthContext)
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.id;

        // Si hay userId, enviarlo como query param
        const endpoint = userId
            ? `/espacios/apertura-cierre/proximos/?user_id=${userId}`
            : '/espacios/apertura-cierre/proximos/';

        return apiClient.get<ProximosAperturaCierreResponse>(endpoint);
    }
};

/**
 * Alias para compatibilidad con imports
 */
export const espaciosAPI = espacioService;