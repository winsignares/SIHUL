export interface RecursoAudiovisual {
    id: string;
    codigo: string;
    nombre: string;
    tipo: 'proyector' | 'camara' | 'microfono' | 'computador' | 'tableta' | 'otro';
    marca?: string;
    modelo?: string;
    serial?: string;
    estado: 'disponible' | 'prestado' | 'mantenimiento' | 'dañado';
    ubicacion?: string;
    fechaAdquisicion?: string;
    fechaCreacion: string;
}

export interface PrestamoRecurso {
    id: string;
    recursoId: string;
    solicitante: string;
    emailSolicitante: string;
    motivo: string;
    fechaInicio: string;
    fechaFin: string;
    horaInicio: string;
    horaFin: string;
    estado: 'pendiente' | 'aprobado' | 'rechazado' | 'devuelto';
    aprobadoPor?: string;
    observaciones?: string;
    fechaSolicitud: string;
    fechaRespuesta?: string;
}
