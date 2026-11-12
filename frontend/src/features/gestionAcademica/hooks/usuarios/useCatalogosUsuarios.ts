import { useState, useEffect } from 'react';
import { rolService, type Rol } from '../../../users/services/authService';
import { espacioService, type TipoEspacio } from '../../../espacios/services/espaciosAPI';
import { facultadService } from '../../services/facultades/facultadesAPI';
import { sedeService } from '../../../../services/sedes/sedeAPI';
import { seccionalService, type Seccional } from '../../../../services/seccionales/seccionalAPI';
import { clearSessionCache, getSessionCacheData, setSessionCacheData } from '../../../../core/sessionCache';
import {
    ACADEMIC_CATALOG_UPDATED_EVENT,
    ESPACIOS_UPDATED_EVENT,
    GESTION_ESPACIOS_CACHE_KEY,
    GESTION_FACULTADES_CACHE_KEY,
    GESTION_ROLES_CACHE_KEY,
    GESTION_SEDES_CACHE_KEY,
    GESTION_TIPOS_ESPACIO_CACHE_KEY,
    ROLES_UPDATED_EVENT,
    SEDES_UPDATED_EVENT,
    normalizeEspacioAsignable,
    type EspacioAsignable,
    type SedeAsignable,
} from './usuariosUtils';

/** Catálogos que usa la gestión de usuarios (roles, facultades, espacios, sedes, seccionales y tipos de espacio) y su recarga. */
export function useCatalogosUsuarios() {
    // Estados para datos dinámicos desde backend
    const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
    const [facultadesDisponibles, setFacultadesDisponibles] = useState<Array<{ id: number, nombre: string }>>([]);
    const [espaciosDisponibles, setEspaciosDisponibles] = useState<EspacioAsignable[]>([]);
    const [sedesDisponibles, setSedesDisponibles] = useState<SedeAsignable[]>([]);
    const [seccionalesDisponibles, setSeccionalesDisponibles] = useState<Seccional[]>([]);
    const [tiposEspacioDisponibles, setTiposEspacioDisponibles] = useState<TipoEspacio[]>([]);

    // Cargar roles desde backend
    const loadRoles = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedRoles = force ? null : getSessionCacheData<Rol[]>(GESTION_ROLES_CACHE_KEY, activeToken);

            if (cachedRoles) {
                setRolesDisponibles(cachedRoles);
            }

            const response = await rolService.listarRoles();
            setRolesDisponibles(response.roles || []);
            setSessionCacheData(GESTION_ROLES_CACHE_KEY, activeToken, response.roles || []);
        } catch (error) {
            console.error('Error cargando roles:', error);
        }
    };

    // Cargar facultades desde backend
    const loadFacultades = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedFacultades = force
                ? null
                : getSessionCacheData<Array<{ id: number, nombre: string }>>(GESTION_FACULTADES_CACHE_KEY, activeToken);

            if (cachedFacultades) {
                setFacultadesDisponibles(cachedFacultades);
            }

            const response = await facultadService.list();
            const facultades = (response.facultades || []).map((f) => ({
                id: f.id as number,
                nombre: f.nombre,
            }));
            setFacultadesDisponibles(facultades);
            setSessionCacheData(GESTION_FACULTADES_CACHE_KEY, activeToken, facultades);
        } catch (error) {
            console.error('Error cargando facultades:', error);
        }
    };

    // Cargar espacios desde backend
    const loadEspacios = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedEspacios = force
                ? null
                : getSessionCacheData<EspacioAsignable[]>(GESTION_ESPACIOS_CACHE_KEY, activeToken);

            if (cachedEspacios) {
                setEspaciosDisponibles(cachedEspacios);
            }

            const response = await espacioService.list();
            const espacios = (response.espacios || [])
                .map(normalizeEspacioAsignable)
                .filter((espacio): espacio is EspacioAsignable => espacio !== null);
            setEspaciosDisponibles(espacios);
            setSessionCacheData(GESTION_ESPACIOS_CACHE_KEY, activeToken, espacios);
        } catch (error) {
            console.error('Error cargando espacios:', error);
        }
    };

    // Cargar tipos de espacio desde backend
    const loadTiposEspacio = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedTiposEspacio = force
                ? null
                : getSessionCacheData<TipoEspacio[]>(GESTION_TIPOS_ESPACIO_CACHE_KEY, activeToken);

            if (cachedTiposEspacio) {
                setTiposEspacioDisponibles(cachedTiposEspacio);
            }

            const response = await espacioService.listTipos();
            setTiposEspacioDisponibles(response.tipos_espacio || []);
            setSessionCacheData(GESTION_TIPOS_ESPACIO_CACHE_KEY, activeToken, response.tipos_espacio || []);
        } catch (error) {
            console.error('Error cargando tipos de espacio:', error);
        }
    };

    // Cargar sedes desde backend
    const loadSedes = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedSedes = force
                ? null
                : getSessionCacheData<SedeAsignable[]>(GESTION_SEDES_CACHE_KEY, activeToken);

            if (cachedSedes) {
                setSedesDisponibles(cachedSedes);
            }

            const response = await sedeService.listarSedes();
            const sedes = (response.sedes || []).map((sede) => ({
                id: sede.id as number,
                nombre: sede.nombre,
                seccional_id: sede.seccional_id ?? null,
            }));
            setSedesDisponibles(sedes);
            setSessionCacheData(GESTION_SEDES_CACHE_KEY, activeToken, sedes);
        } catch (error) {
            console.error('Error cargando sedes:', error);
        }
    };

    // Seccionales que se pueden asignar: el administrador global ve todas; quien administra una seccional, solo la suya
    const loadSeccionales = async () => {
        try {
            setSeccionalesDisponibles(await seccionalService.listar());
        } catch (error) {
            console.error('Error cargando seccionales:', error);
        }
    };

    useEffect(() => {
        const reloadRolesParaUsuarios = () => {
            clearSessionCache(GESTION_ROLES_CACHE_KEY);
            void loadRoles({ force: true });
        };

        window.addEventListener(ROLES_UPDATED_EVENT, reloadRolesParaUsuarios);
        window.addEventListener('focus', reloadRolesParaUsuarios);

        return () => {
            window.removeEventListener(ROLES_UPDATED_EVENT, reloadRolesParaUsuarios);
            window.removeEventListener('focus', reloadRolesParaUsuarios);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const reloadEspaciosParaAsignacion = () => {
            clearSessionCache(GESTION_ESPACIOS_CACHE_KEY);
            clearSessionCache(GESTION_TIPOS_ESPACIO_CACHE_KEY);
            void Promise.all([
                loadEspacios({ force: true }),
                loadTiposEspacio({ force: true }),
            ]);
        };

        window.addEventListener(ESPACIOS_UPDATED_EVENT, reloadEspaciosParaAsignacion);
        window.addEventListener('focus', reloadEspaciosParaAsignacion);

        return () => {
            window.removeEventListener(ESPACIOS_UPDATED_EVENT, reloadEspaciosParaAsignacion);
            window.removeEventListener('focus', reloadEspaciosParaAsignacion);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const reloadSedesParaUsuarios = () => {
            clearSessionCache(GESTION_SEDES_CACHE_KEY);
            void loadSedes({ force: true });
        };

        window.addEventListener(SEDES_UPDATED_EVENT, reloadSedesParaUsuarios);

        return () => {
            window.removeEventListener(SEDES_UPDATED_EVENT, reloadSedesParaUsuarios);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const reloadFacultadesParaUsuarios = () => {
            clearSessionCache(GESTION_FACULTADES_CACHE_KEY);
            void loadFacultades({ force: true });
        };

        window.addEventListener(ACADEMIC_CATALOG_UPDATED_EVENT, reloadFacultadesParaUsuarios);

        return () => {
            window.removeEventListener(ACADEMIC_CATALOG_UPDATED_EVENT, reloadFacultadesParaUsuarios);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        rolesDisponibles,
        facultadesDisponibles,
        espaciosDisponibles, setEspaciosDisponibles,
        sedesDisponibles,
        seccionalesDisponibles,
        tiposEspacioDisponibles,
        loadRoles,
        loadFacultades,
        loadEspacios,
        loadSedes,
        loadSeccionales,
        loadTiposEspacio,
    };
}
