export interface Espacio {
    id: string;
    nombre: string;
    tipo: string;
    capacidad: number;
    sede: string;
    edificio: string;
    estado: 'disponible' | 'ocupado' | 'mantenimiento';
    proximaClase?: string;
}
