import { apiClient } from '../../core/apiClient';

/**
 * Interfaz para el modelo de Horario
 */
export interface Horario {
    id?: number;
    grupo_id: number;
    asignatura_id: number;
    docente_id?: number | null;
    espacio_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes?: number | null;
}

/**
 * Payload para crear un horario
 */
export interface CreateHorarioPayload {
    grupo_id: number;
    asignatura_id: number;
    espacio_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    docente_id?: number | null;
    cantidad_estudiantes?: number | null;
    usuario_id?: number | null;
    estado?: HorarioEstado;
}

interface ListHorariosExtendidosOptions {
    includePending?: boolean;
}

type HorarioEstado = 'pendiente' | 'aprobado' | 'rechazado';

/**
 * Payload para actualizar un horario
 */
export interface UpdateHorarioPayload {
    id: number;
    grupo_id?: number;
    asignatura_id?: number;
    docente_id?: number | null;
    espacio_id?: number;
    dia_semana?: string;
    hora_inicio?: string;
    hora_fin?: string;
    cantidad_estudiantes?: number | null;
}

/**
 * Payload para eliminar un horario
 */
export interface DeleteHorarioPayload {
    id: number;
}

/**
 * Respuesta de la lista de horarios
 */
export interface ListHorariosResponse {
    horarios: Horario[];
}

/**
 * Interfaz para horarios extendidos con información de relaciones
 */
export interface HorarioExtendido {
    id: number;
    grupo_id: number;
    grupo_nombre: string;
    programa_id: number;
    programa_nombre: string;
    semestre: number;
    asignatura_id: number;
    asignatura_nombre: string;
    docente_id: number | null;
    docente_nombre: string;
    espacio_id: number | null;
    espacio_nombre: string;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes: number | null;
    estado?: HorarioEstado;
    es_solicitud?: boolean; // Para diferenciar solicitudes de horarios aprobados
}

interface HorarioApi {
    id?: number;
    grupo: number;
    asignatura: number;
    docente?: number | null;
    espacio: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes?: number | null;
    estado?: HorarioEstado;
}

/**
 * Respuesta de la lista de horarios extendidos
 */
export interface ListHorariosExtendidosResponse {
    horarios: HorarioExtendido[];
}

/**
 * Interfaz para horarios por período con información agregada
 */
export interface HorariosPorPeriodoResponse {
    periodo_id: number;
    periodo_nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
    activo: boolean;
    total_horarios: number;
    horarios: HorarioExtendido[];
}

const downloadHorariosBlob = async (endpoint: string, horarios: HorarioExtendido[]): Promise<Blob> => {
    return apiClient.postBlob(endpoint, { horarios });
};

/**
 * Interfaz para el modelo de HorarioFusionado
 */
export interface HorarioFusionado {
    id?: number;
    grupo1_id: number;
    grupo2_id: number;
    grupo3_id?: number | null;
    asignatura_id: number;
    docente_id?: number | null;
    espacio_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes?: number | null;
    comentario?: string;
}

interface HorarioFusionadoApi {
    id?: number;
    grupo1: number;
    grupo2: number;
    grupo3?: number | null;
    asignatura: number;
    docente?: number | null;
    espacio: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    cantidad_estudiantes?: number | null;
    comentario?: string;
}

const toFrontendHorario = (horario: HorarioApi): Horario => ({
    id: horario.id,
    grupo_id: horario.grupo,
    asignatura_id: horario.asignatura,
    docente_id: horario.docente,
    espacio_id: horario.espacio,
    dia_semana: horario.dia_semana,
    hora_inicio: horario.hora_inicio,
    hora_fin: horario.hora_fin,
    cantidad_estudiantes: horario.cantidad_estudiantes,
});

const toFrontendHorarioFusionado = (horarioFusionado: HorarioFusionadoApi): HorarioFusionado => ({
    id: horarioFusionado.id,
    grupo1_id: horarioFusionado.grupo1,
    grupo2_id: horarioFusionado.grupo2,
    grupo3_id: horarioFusionado.grupo3,
    asignatura_id: horarioFusionado.asignatura,
    docente_id: horarioFusionado.docente,
    espacio_id: horarioFusionado.espacio,
    dia_semana: horarioFusionado.dia_semana,
    hora_inicio: horarioFusionado.hora_inicio,
    hora_fin: horarioFusionado.hora_fin,
    cantidad_estudiantes: horarioFusionado.cantidad_estudiantes,
    comentario: horarioFusionado.comentario,
});

/**
 * Payload para crear un horario fusionado
 */
export interface CreateHorarioFusionadoPayload {
    grupo1_id: number;
    grupo2_id: number;
    grupo3_id?: number | null;
    asignatura_id: number;
    espacio_id: number;
    dia_semana: string;
    hora_inicio: string;
    hora_fin: string;
    docente_id?: number | null;
    cantidad_estudiantes?: number | null;
    comentario?: string;
}

/**
 * Payload para actualizar un horario fusionado
 */
export interface UpdateHorarioFusionadoPayload {
    id: number;
    grupo1_id?: number;
    grupo2_id?: number;
    grupo3_id?: number | null;
    asignatura_id?: number;
    docente_id?: number | null;
    espacio_id?: number;
    dia_semana?: string;
    hora_inicio?: string;
    hora_fin?: string;
    cantidad_estudiantes?: number | null;
    comentario?: string;
}

/**
 * Payload para eliminar un horario fusionado
 */
export interface DeleteHorarioFusionadoPayload {
    id: number;
}

/**
 * Respuesta de la lista de horarios fusionados
 */
export interface ListHorariosFusionadosResponse {
    horarios_fusionados: HorarioFusionado[];
}

/**
 * Servicio de horarios para comunicación con el backend
 */
export const horarioService = {
    /**
     * Crea un nuevo horario
     */
    create: async (payload: CreateHorarioPayload): Promise<{ message: string; id: number }> => {
        const created = await apiClient.post<HorarioApi>('/horarios/', {
            grupo: payload.grupo_id,
            asignatura: payload.asignatura_id,
            docente: payload.docente_id,
            espacio: payload.espacio_id,
            dia_semana: payload.dia_semana,
            hora_inicio: payload.hora_inicio,
            hora_fin: payload.hora_fin,
            cantidad_estudiantes: payload.cantidad_estudiantes,
            usuario_id: payload.usuario_id,
            estado: payload.estado,
        });
        return { message: 'Horario creado', id: created.id ?? 0 };
    },

    /**
     * Crea usando el flujo de APIView (admin crea horario directo, planeacion crea solicitud pendiente).
     */
    createConFlujoSolicitud: async (payload: CreateHorarioPayload): Promise<{ message: string; id: number }> => {
        return horarioService.create(payload);
    },

    /**
     * Actualiza un horario existente
     */
    update: async (payload: UpdateHorarioPayload): Promise<{ message: string; id: number }> => {
        const updated = await apiClient.patch<HorarioApi>(`/horarios/${payload.id}/`, {
            ...(payload.grupo_id !== undefined ? { grupo: payload.grupo_id } : {}),
            ...(payload.asignatura_id !== undefined ? { asignatura: payload.asignatura_id } : {}),
            ...(payload.docente_id !== undefined ? { docente: payload.docente_id } : {}),
            ...(payload.espacio_id !== undefined ? { espacio: payload.espacio_id } : {}),
            ...(payload.dia_semana !== undefined ? { dia_semana: payload.dia_semana } : {}),
            ...(payload.hora_inicio !== undefined ? { hora_inicio: payload.hora_inicio } : {}),
            ...(payload.hora_fin !== undefined ? { hora_fin: payload.hora_fin } : {}),
            ...(payload.cantidad_estudiantes !== undefined ? { cantidad_estudiantes: payload.cantidad_estudiantes } : {}),
        });
        return { message: 'Horario actualizado', id: updated.id ?? payload.id };
    },

    /**
     * Elimina un horario
     */
    delete: async (payload: DeleteHorarioPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/horarios/${payload.id}/`);
        return { message: 'Horario eliminado' };
    },

    /**
     * Obtiene un horario por ID
     */
    get: async (id: number): Promise<Horario> => {
        const horarioApi = await apiClient.get<HorarioApi>(`/horarios/${id}/`);
        return toFrontendHorario(horarioApi);
    },

    /**
     * Lista todos los horarios
     */
    list: async (): Promise<ListHorariosResponse> => {
        const horariosApi = await apiClient.get<HorarioApi[]>('/horarios/');
        const horarios = horariosApi.map(toFrontendHorario);
        return { horarios };
    },

    /**
     * Lista todos los horarios con información extendida
     */
    listExtendidos: async (options: ListHorariosExtendidosOptions = {}): Promise<ListHorariosExtendidosResponse> => {
        const query = options.includePending ? '?include_pending=1' : '';
        return apiClient.get<ListHorariosExtendidosResponse>(`/horarios/list/extendidos/${query}`, { requiresAuth: false });
    },

    /**
     * Obtiene el horario del docente autenticado
     */
    miHorario: async (usuarioId: number): Promise<ListHorariosExtendidosResponse> => {
        return apiClient.get<ListHorariosExtendidosResponse>(`/horarios/mi-horario/?usuario_id=${usuarioId}`);
    },

    /**
     * Obtiene el horario del estudiante autenticado
     */
    miHorarioEstudiante: async (usuarioId: number): Promise<ListHorariosExtendidosResponse> => {
        return apiClient.get<ListHorariosExtendidosResponse>(`/horarios/mi-horario-estudiante/?usuario_id=${usuarioId}`);
    },

    /**
     * Exporta horarios de programa a PDF.
     */
    exportarPdfPrograma: async (horarios: HorarioExtendido[]): Promise<Blob> => {
        return downloadHorariosBlob('/horarios/exportar-pdf/', horarios);
    },

    /**
     * Exporta horarios de docente a PDF.
     */
    exportarPdfDocente: async (horarios: HorarioExtendido[]): Promise<Blob> => {
        return downloadHorariosBlob('/horarios/exportar-pdf-docente/', horarios);
    },

    /**
     * Exporta horarios de programa a Excel.
     */
    exportarExcelPrograma: async (horarios: HorarioExtendido[]): Promise<Blob> => {
        return downloadHorariosBlob('/horarios/exportar-excel/', horarios);
    },

    /**
     * Exporta horarios de docente a Excel.
     */
    exportarExcelDocente: async (horarios: HorarioExtendido[]): Promise<Blob> => {
        return downloadHorariosBlob('/horarios/exportar-excel-docente/', horarios);
    },

    /**
     * Exporta horarios del usuario actual a PDF.
     */
    exportarPdfUsuario: async (usuarioId: number): Promise<Blob> => {
        return apiClient.getBlob(`/horarios/exportar-pdf-usuario/?usuario_id=${usuarioId}`);
    },

    /**
     * Exporta horarios del usuario actual a Excel.
     */
    exportarExcelUsuario: async (usuarioId: number): Promise<Blob> => {
        return apiClient.getBlob(`/horarios/exportar-excel-usuario/?usuario_id=${usuarioId}`);
    },

    /**
     * Obtiene todos los horarios asociados a un período académico específico
     * @param periodoId ID del período académico
     * @param estado Filtro opcional de estado (uno o varios)
     * @returns Horarios del período con información extendida
     */
    horariosPorPeriodo: async (
        periodoId: number,
        estado?: HorarioEstado | HorarioEstado[]
    ): Promise<HorariosPorPeriodoResponse> => {
        const params = new URLSearchParams();
        params.set('periodo_id', String(periodoId));

        if (estado) {
            if (Array.isArray(estado)) {
                estado.forEach((item) => params.append('estados[]', item));
            } else {
                params.set('estado', estado);
            }
        }

        const query = `?${params.toString()}`;
        return apiClient.get<HorariosPorPeriodoResponse>(`/horarios/por-periodo/${query}`, {
            suppressErrorLog: true,
        });
    }
};

/**
 * Servicio de horarios fusionados para comunicación con el backend
 */
export const horarioFusionadoService = {
    /**
     * Crea un nuevo horario fusionado
     */
    create: async (payload: CreateHorarioFusionadoPayload): Promise<{ message: string; id: number }> => {
        const created = await apiClient.post<HorarioFusionadoApi>('/horarios-fusionados/', {
            grupo1: payload.grupo1_id,
            grupo2: payload.grupo2_id,
            grupo3: payload.grupo3_id,
            asignatura: payload.asignatura_id,
            docente: payload.docente_id,
            espacio: payload.espacio_id,
            dia_semana: payload.dia_semana,
            hora_inicio: payload.hora_inicio,
            hora_fin: payload.hora_fin,
            cantidad_estudiantes: payload.cantidad_estudiantes,
            comentario: payload.comentario,
        });
        return { message: 'Horario fusionado creado', id: created.id ?? 0 };
    },

    /**
     * Actualiza un horario fusionado existente
     */
    update: async (payload: UpdateHorarioFusionadoPayload): Promise<{ message: string; id: number }> => {
        const updated = await apiClient.patch<HorarioFusionadoApi>(`/horarios-fusionados/${payload.id}/`, {
            ...(payload.grupo1_id !== undefined ? { grupo1: payload.grupo1_id } : {}),
            ...(payload.grupo2_id !== undefined ? { grupo2: payload.grupo2_id } : {}),
            ...(payload.grupo3_id !== undefined ? { grupo3: payload.grupo3_id } : {}),
            ...(payload.asignatura_id !== undefined ? { asignatura: payload.asignatura_id } : {}),
            ...(payload.docente_id !== undefined ? { docente: payload.docente_id } : {}),
            ...(payload.espacio_id !== undefined ? { espacio: payload.espacio_id } : {}),
            ...(payload.dia_semana !== undefined ? { dia_semana: payload.dia_semana } : {}),
            ...(payload.hora_inicio !== undefined ? { hora_inicio: payload.hora_inicio } : {}),
            ...(payload.hora_fin !== undefined ? { hora_fin: payload.hora_fin } : {}),
            ...(payload.cantidad_estudiantes !== undefined ? { cantidad_estudiantes: payload.cantidad_estudiantes } : {}),
            ...(payload.comentario !== undefined ? { comentario: payload.comentario } : {}),
        });
        return { message: 'Horario fusionado actualizado', id: updated.id ?? payload.id };
    },

    /**
     * Elimina un horario fusionado
     */
    delete: async (payload: DeleteHorarioFusionadoPayload): Promise<{ message: string }> => {
        await apiClient.delete(`/horarios-fusionados/${payload.id}/`);
        return { message: 'Horario fusionado eliminado' };
    },

    /**
     * Obtiene un horario fusionado por ID
     */
    get: async (id: number): Promise<HorarioFusionado> => {
        const horarioFusionadoApi = await apiClient.get<HorarioFusionadoApi>(`/horarios-fusionados/${id}/`);
        return toFrontendHorarioFusionado(horarioFusionadoApi);
    },

    /**
     * Lista todos los horarios fusionados
     */
    list: async (): Promise<ListHorariosFusionadosResponse> => {
        const horariosFusionadosApi = await apiClient.get<HorarioFusionadoApi[]>('/horarios-fusionados/');
        const horarios_fusionados = horariosFusionadosApi.map(toFrontendHorarioFusionado);
        return { horarios_fusionados };
    }
};
