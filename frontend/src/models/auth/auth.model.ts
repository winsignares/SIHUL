/**
 * Payload para el login
 */
export interface LoginPayload {
    correo: string;
    password: string;
}

/**
 * Componente que el usuario puede acceder
 */
export interface Component {
    code: string;   // Código único del componente (ej: "CENTRO_HORARIOS")
    name: string;   // Nombre para mostrar (ej: "Centro de Horarios")
}

/**
 * Facultad asociada al usuario (solo para roles de planeación)
 */
export interface Faculty {
    id: number;
    nombre: string;
}

/**
 * Área asociada al usuario (solo para supervisores)
 */
export interface Area {
    id: number;
    tipo: string;      // Ej: "PISO", "LABORATORIO", "EDIFICIO"
    nombre: string;
}

/**
 * Rol del usuario
 */
export interface Role {
    codigo: string;    // Código del rol (ej: "ADMIN_PLANEACION", "SUPERVISOR_GENERAL")
    nombre: string;    // Nombre para mostrar (ej: "Administrador de Planeación")
}

/**
 * Usuario autenticado
 */
export interface User {
    id: number;
    nombre: string;
    correo: string;
}

/**
 * Respuesta del endpoint de login
 */
export interface LoginResponse {
    token: string;
    user: User;
    role: Role;
    components: Component[];
    faculties?: Faculty[];
    areas?: Area[];
}

/**
 * Estado de autenticación en el contexto
 */
export interface AuthState {
    token: string | null;
    user: User | null;
    role: Role | null;
    components: Component[];
    faculties?: Faculty[];
    areas?: Area[];
    isAuthenticated: boolean;
    isLoading: boolean;
}
