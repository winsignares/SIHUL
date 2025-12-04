/**
 * Payload para el login
 */
export interface LoginPayload {
    correo: string;
    contrasena: string;
}

/**
 * Componente que el usuario puede acceder
 */
export interface Component {
    id: number;
    nombre: string;
    descripcion: string;
    permiso: string;
}

/**
 * Sede del usuario
 */
export interface Sede {
    id: number;
    nombre: string;
    ciudad: string;
    direccion?: string;
}

/**
 * Facultad asociada al usuario (solo para roles de planeación)
 */
export interface Faculty {
    id: number;
    nombre: string;
}

/**
 * Espacio permitido para el usuario (solo para supervisores)
 */
export interface AllowedSpace {
    id: number;
    tipo: string;
    capacidad: number;
    ubicacion: string;
    disponible: boolean;
    sede_id: number;
    sede_nombre: string;
}

/**
 * Rol del usuario
 */
export interface Role {
    id: number;
    nombre: string;
    descripcion: string;
}

/**
 * Usuario autenticado
 */
export interface User {
    id: number;
    nombre: string;
    correo: string;
    rol: Role | null;
    facultad: Faculty | null;
    sede: Sede | null;
}

/**
 * Respuesta del endpoint de login
 */
export interface LoginResponse extends User {
    message: string;
    token: string;
    componentes: Component[];
    espacios_permitidos: AllowedSpace[];
}

/**
 * Estado de autenticación en el contexto
 */
export interface AuthState {
    token: string | null;
    user: User | null;
    role: Role | null;
    components: Component[];
    faculties?: Faculty[]; // Mantener por compatibilidad si se usa en otro lado, aunque backend no lo manda en login (manda 'facultad' singular en user)
    areas?: AllowedSpace[]; // Mapear espacios_permitidos a areas
    isAuthenticated: boolean;
    isLoading: boolean;
}
