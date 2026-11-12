import type { Facultad as FacultadAPI } from '../../services/facultades/facultadesAPI';
import type { Asignatura, AsignaturaPrograma } from '../../services/asignaturas/asignaturaAPI';

export const FACULTADES_CACHE_KEY = 'gestion-academica-facultades';
export const PROGRAMAS_CACHE_KEY = 'gestion-academica-programas';
export const ASIGNATURAS_CACHE_KEY = 'gestion-academica-asignaturas-list';
export const ASIGNATURAS_PROGRAMA_CACHE_KEY = 'gestion-academica-asignaturas-programa';
export const GESTION_USUARIOS_FACULTADES_CACHE_KEY = 'gestion-academica-facultades-usuarios';
export const ASIGNATURAS_STANDALONE_CACHE_KEY = 'gestion-academica-asignaturas';
export const ACADEMIC_CATALOG_UPDATED_EVENT = 'academic-catalog-updated';

// Mapear tipos de API a modelo del frontend
export type Facultad = FacultadAPI;

// Interfaz adaptada para Programa del frontend (con camelCase)
export interface Programa {
    id?: number;
    nombre: string;
    facultadId: number | null; // Puede ser null si no tiene facultad asignada
    semestres: number;
    activo: boolean;
}

export const enrichAsignaturasPrograma = (
    items: AsignaturaPrograma[],
    asignaturasCatalogo: Asignatura[]
): AsignaturaPrograma[] => {
    const asignaturasPorId = new Map(asignaturasCatalogo.map((asignatura) => [asignatura.id, asignatura]));

    return items.map((item) => {
        const asignatura = asignaturasPorId.get(item.asignatura_id);

        return {
            ...item,
            asignatura_codigo: asignatura?.codigo,
            asignatura_nombre: asignatura?.nombre,
            creditos: asignatura?.creditos,
            horas: asignatura?.horas,
        };
    });
};
