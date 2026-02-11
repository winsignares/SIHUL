export interface PermisoComponente {
    componenteId: string;
    permiso: 'ver' | 'editar';
}

export interface Usuario {
    id: string;
    nombre: string;
    email: string;
    password: string; // En producción esto estaría hasheado
    rol: 'admin' | 'planeacion_facultad' | 'autorizado' | 'consultor' | 'estudiante' | 'docente' | 'supervisor_general';
    permisos: PermisoComponente[];
    programasRestringidos: string[]; // IDs de programas
    accesoTodosProgramas?: boolean; // Nuevo campo opcional
    gruposAsignados?: string[]; // Códigos de grupos (INSI-A, DERE-B, etc.) - Solo para estudiantes
    activo: boolean;
    fechaCreacion: string;
    ultimoAcceso?: string;
    sede?: string; // Sede universitaria del usuario
}

export interface Docente {
    id: string;
    nombre: string;
    email: string;
    telefono?: string;
    especialidad?: string;
}
