import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de EspacioFisico
 */
export interface EspacioFisico {
    id?: number;
    nombre: string;
    sede_id: number;
    sede_seccional_id?: number | null;
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
    esta_abierto?: boolean;
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
    esta_abierto?: boolean;
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
    esta_abierto?: boolean;
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
        return apiClient.post<{ message: string; id: number }>('/espacios/', {
            nombre: payload.nombre,
            sede: payload.sede_id,
            tipo: payload.tipo_id,
            capacidad: payload.capacidad,
            descripcion: payload.descripcion,
            ubicacion: payload.ubicacion,
            esta_abierto: payload.esta_abierto,
            estado: payload.estado,
            recursos: payload.recursos,
        });
    },

    /**
     * Actualiza un espacio físico existente
     */
    update: async (payload: UpdateEspacioPayload): Promise<{ message: string; id: number }> => {
        const updated = await apiClient.put<EspacioFisico>(`/espacios/${payload.id}/`, {
            ...(payload.nombre !== undefined ? { nombre: payload.nombre } : {}),
            ...(payload.sede_id !== undefined ? { sede: payload.sede_id } : {}),
            ...(payload.tipo_id !== undefined ? { tipo: payload.tipo_id } : {}),
            ...(payload.capacidad !== undefined ? { capacidad: payload.capacidad } : {}),
            ...(payload.descripcion !== undefined ? { descripcion: payload.descripcion } : {}),
            ...(payload.ubicacion !== undefined ? { ubicacion: payload.ubicacion } : {}),
            ...(payload.esta_abierto !== undefined ? { esta_abierto: payload.esta_abierto } : {}),
            ...(payload.estado !== undefined ? { estado: payload.estado } : {}),
            ...(payload.recursos !== undefined ? { recursos: payload.recursos } : {}),
        });
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
    },

    /**
     * Cambia el estado de apertura/cierre fisico del espacio.
     * true = abierto, false = cerrado.
     * 
     * NOTA: Para cerrar (false), valida que no haya clase en curso.
     */
    cambiarApertura: async (espacioId: number, estaAbierto: boolean): Promise<EspacioFisico> => {
        if (estaAbierto === false) {
            return apiClient.post<EspacioFisico>(`/espacios/${espacioId}/cerrar/`, {});
        } else {
            return apiClient.post<EspacioFisico>(`/espacios/${espacioId}/abrir/`, {});
        }
    },

    abrirSalon: async (espacioId: number): Promise<EspacioFisico> => {
        return apiClient.post<EspacioFisico>(`/espacios/${espacioId}/abrir/`, {});
    },

    cerrarSalon: async (espacioId: number): Promise<EspacioFisico> => {
        return apiClient.post<EspacioFisico>(`/espacios/${espacioId}/cerrar/`, {});
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
        return apiClient.get('/espacios/horarios/all/', { requiresAuth: false });
    },

    /**
     * Obtiene todos los espacios DISPONIBLES con sus horarios aprobados.
     */
    getAllDisponiblesWithHorarios: async (): Promise<{
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
        return apiClient.get('/espacios/horarios/disponibles/all/', { requiresAuth: false });
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
    },

    /**
     * Obtiene espacios DISPONIBLES permitidos para supervisor con horarios aprobados.
     */
    getSupervisorDisponiblesHorarios: async (usuarioId: number): Promise<{
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
        return apiClient.get(`/espacios/horarios/disponibles/supervisor/${usuarioId}/`);
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
    esta_abierto?: boolean;
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
