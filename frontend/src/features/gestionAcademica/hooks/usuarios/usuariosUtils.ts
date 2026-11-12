import type { EspacioFisico } from '../../../espacios/services/espaciosAPI';

// El servidor entrega los usuarios en bloques de 100; la tabla los muestra de PAGE_SIZE en PAGE_SIZE
export const USUARIOS_POR_BLOQUE = 100;
export const BUSQUEDA_ESPERA_MS = 300;
export const GESTION_ROLES_CACHE_KEY = 'gestion-academica-roles-v3';
export const GESTION_FACULTADES_CACHE_KEY = 'gestion-academica-facultades-usuarios';
export const GESTION_ESPACIOS_CACHE_KEY = 'gestion-academica-espacios-usuarios-v4';
export const GESTION_SEDES_CACHE_KEY = 'gestion-academica-sedes-usuarios-v2';
export const GESTION_TIPOS_ESPACIO_CACHE_KEY = 'gestion-academica-tipos-espacio-usuarios';
export const ESPACIOS_UPDATED_EVENT = 'espacios-updated';
export const SEDES_UPDATED_EVENT = 'sedes-updated';
export const ACADEMIC_CATALOG_UPDATED_EVENT = 'academic-catalog-updated';
export const ROLES_UPDATED_EVENT = 'roles-updated';

export type EspacioAsignable = {
    id: number;
    nombre: string;
    tipo_id: number;
    sede_id: number;
    sede_seccional_id: number | null;
};

export type SedeAsignable = {
    id: number;
    nombre: string;
    seccional_id: number | null;
};

export const getRelationId = (value: unknown): number | null => {
    if (typeof value === 'number') return value;
    if (value && typeof value === 'object' && 'id' in value) {
        const id = (value as { id?: unknown }).id;
        return typeof id === 'number' ? id : null;
    }
    return null;
};

export const normalizeEspacioAsignable = (espacio: EspacioFisico): EspacioAsignable | null => {
    const tipoId = espacio.tipo_id ?? espacio.tipo_espacio?.id ?? getRelationId(espacio.tipo);
    const sedeId = espacio.sede_id ?? getRelationId(espacio.sede);

    if (!espacio.id || !tipoId || !sedeId) {
        return null;
    }

    return {
        id: espacio.id,
        nombre: espacio.nombre,
        tipo_id: tipoId,
        sede_id: sedeId,
        sede_seccional_id: espacio.sede_seccional_id ?? null,
    };
};

// Lo elegido en un selector pero sin pulsar «+» también se asigna al guardar: antes se perdía en
// silencio y parecía que la asignación no se guardaba.
export const resolverSeleccionPendiente = (
    tipos: number[], todos: boolean, tipoPendiente: string, espacios: number[], espacioPendiente: string,
) => {
    let tiposFinal = tipos;
    let todosFinal = todos;
    if (tipoPendiente === 'todos') {
        todosFinal = true;
    } else if (tipoPendiente) {
        const tipoId = parseInt(tipoPendiente, 10);
        if (!Number.isNaN(tipoId) && !tiposFinal.includes(tipoId)) tiposFinal = [...tiposFinal, tipoId];
    }
    let espaciosFinal = espacios;
    if (espacioPendiente) {
        const espacioId = parseInt(espacioPendiente, 10);
        if (!Number.isNaN(espacioId) && !espaciosFinal.includes(espacioId)) espaciosFinal = [...espaciosFinal, espacioId];
    }
    return { tiposFinal, todosFinal, espaciosFinal };
};
