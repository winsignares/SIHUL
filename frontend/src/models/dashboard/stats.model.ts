export interface EstadisticasDashboard {
    totalEstudiantes: number;
    totalEspacios: number;
    totalProgramas: number;
    totalHorarios: number;
    espaciosDisponibles: number;
    prestamoPendientes: number;
    ocupacionPromedio: number;
    tendencias: {
        estudiantes: number;
        espacios: number;
        programas: number;
    };
}
