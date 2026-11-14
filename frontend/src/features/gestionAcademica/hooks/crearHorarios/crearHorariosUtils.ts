import type { Grupo } from '../../services/grupos/gruposAPI';

export const CREAR_HORARIOS_CACHE_KEY = 'gestion-academica-crear-horarios';
export const ACADEMIC_CATALOG_UPDATED_EVENT = 'academic-catalog-updated';
export const ESPACIOS_UPDATED_EVENT = 'espacios-updated';
export const HORARIOS_UPDATED_EVENT = 'horariosUpdated';

export interface GrupoConInfo extends Grupo {
    programa_nombre?: string;
    facultad_id?: number;
}

export interface CrearHorariosHookProps {
    onHorarioCreado?: () => void;
}

export const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }

    if (error && typeof error === 'object') {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === 'string' && maybeMessage.trim()) {
            return maybeMessage;
        }
    }

    return 'Error desconocido';
};
