export interface EspacioOcupacion {
    id: string;
    nombre: string;
    tipo: string;
    capacidad: number;
    horasOcupadas: number;
    horasDisponibles: number;
    porcentajeOcupacion: number;
    edificio: string;
    jornada: {
        manana: number;
        tarde: number;
        noche: number;
    };
}
