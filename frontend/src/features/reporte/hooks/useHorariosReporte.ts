import { useState, useEffect } from 'react';
import type { HorarioDocente, HorarioPrograma } from '../../../models';
import type { EstadoHorarioReporte } from '../services/reporteOcupacionAPI';
import { horarioService } from '../../horarios/services/horariosAPI';
import { programaService } from '../../gestionAcademica/services/programas/programaAPI';
import { userService } from '../../users/services/authService';
import type { useAuth } from '../../../context/AuthContext';
import { getSessionCacheData, setSessionCacheData } from '../../../core/sessionCache';
import { REPORTES_HORARIOS_CACHE_KEY, type Docente } from './reportesConstantes';
import { useActualizacionEnVivo } from '../../../hooks/useActualizacionEnVivo';

type Sesion = ReturnType<typeof useAuth>;

/** Horarios por programa y por docente, con los programas y docentes disponibles. */
export function useHorariosReporte({ estadoReporte, user, role }: {
    estadoReporte: EstadoHorarioReporte;
    user: Sesion['user'];
    role: Sesion['role'];
}) {
    // Alguien más cambió los datos del reporte: se vuelve a calcular.
    const [recarga, setRecarga] = useState(0);
    useActualizacionEnVivo(['horarios', 'horarios-fusionados', 'espacios', 'espacios-permitidos', 'tipos-espacio', 'periodos', 'sedes', 'prestamos-espacio'], () => setRecarga((n) => n + 1));

    const [horariosPrograma, setHorariosPrograma] = useState<HorarioPrograma[]>([]);
    const [programas, setProgramas] = useState<string[]>([]);
    const [horariosDocenteData, setHorariosDocenteData] = useState<HorarioDocente[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);

    const filtrarHorariosPorEstado = <T extends { estado?: string }>(horarios: T[]) => {
        if (estadoReporte === 'todos') return horarios;
        return horarios.filter(h => (h.estado || '').toLowerCase() === estadoReporte);
    };

    const cargarHorariosExtendidosReporte = async () => {
        const response = await horarioService.listExtendidos({ estado: estadoReporte });
        return filtrarHorariosPorEstado(response.horarios);
    };

    // Cargar horarios del backend cuando el componente monta
    useEffect(() => {
        const cargarHorarios = async () => {
            try {
                const activeToken = localStorage.getItem('auth_token');
                const userScope = `${role?.nombre || 'sin-rol'}-${user?.id || 'anonimo'}-${user?.facultad?.id || 'sin-facultad'}-${estadoReporte}`;
                const cacheKey = `${REPORTES_HORARIOS_CACHE_KEY}-${userScope}`;
                const cachedData = getSessionCacheData<{
                    horariosPrograma: HorarioPrograma[];
                    programas: string[];
                    horariosDocenteData: HorarioDocente[];
                    docentes: Docente[];
                }>(cacheKey, activeToken);

                if (cachedData) {
                    setHorariosPrograma(cachedData.horariosPrograma);
                    setProgramas(cachedData.programas);
                    setHorariosDocenteData(cachedData.horariosDocenteData);
                    setDocentes(cachedData.docentes);
                    return;
                }

                // Cargar horarios extendidos
                const horariosExtendidos = await cargarHorariosExtendidosReporte();

                // Cargar programas
                const programasResponse = await programaService.listarProgramas();
                const nombresProgramas = ['Todos', ...programasResponse.programas.map(p => p.nombre)];
                setProgramas(nombresProgramas);

                // Transformar horarios a formato HorarioPrograma
                const horariosTransformados: HorarioPrograma[] = horariosExtendidos.map(h => ({
                    grupo: h.grupo_nombre,
                    dia: h.dia_semana.charAt(0).toUpperCase() + h.dia_semana.slice(1).toLowerCase(),
                    hora: `${h.hora_inicio}-${h.hora_fin}`,
                    asignatura: h.asignatura_nombre,
                    docente: h.docente_nombre,
                    espacio: h.espacio_nombre,
                    programa: h.programa_nombre,
                    semestre: h.semestre
                }));

                setHorariosPrograma(horariosTransformados);

                // Transformar horarios a formato HorarioDocente
                const horariosDocenteTransformados: HorarioDocente[] = horariosExtendidos.map(h => ({
                    dia: h.dia_semana.charAt(0).toUpperCase() + h.dia_semana.slice(1).toLowerCase(),
                    hora: `${h.hora_inicio}-${h.hora_fin}`,
                    asignatura: h.asignatura_nombre,
                    grupo: h.grupo_nombre,
                    espacio: h.espacio_nombre,
                    docente: h.docente_nombre,
                    docente_id: h.docente_id ?? undefined,
                    facultad: h.programa_nombre // Usar nombre del programa como facultad por ahora
                }));

                setHorariosDocenteData(horariosDocenteTransformados);

                let docentesFinales: Docente[] = [];

                // Cargar docentes completos usando el servicio
                try {
                    const docentesResponse = await userService.listarDocentes();
                    const docentesList: Docente[] = [
                        { id: 'todos', nombre: 'Todos', correo: '' },
                        ...docentesResponse.usuarios
                            .filter((u): u is typeof u & { id: number } => u.id !== undefined)
                            .map((u) => ({
                                id: u.id,
                                nombre: u.nombre,
                                correo: u.correo
                            }))
                    ];
                    setDocentes(docentesList);
                    docentesFinales = docentesList;
                } catch (error) {
                    console.error('Error al cargar docentes:', error);
                    // Fallback: usar nombres únicos de horarios
                    const docentesUnicos: Docente[] = [
                        { id: 'todos', nombre: 'Todos', correo: '' },
                        ...Array.from(new Set(horariosExtendidos.map(h => h.docente_nombre).filter(Boolean))).map((nombre, idx) => ({
                            id: `docente-${idx}`,
                            nombre,
                            correo: ''
                        }))
                    ];
                    setDocentes(docentesUnicos);
                    docentesFinales = docentesUnicos;
                }

                if (docentesFinales.length === 0) {
                    docentesFinales = [{ id: 'todos', nombre: 'Todos', correo: '' }];
                    setDocentes(docentesFinales);
                }

                setSessionCacheData(cacheKey, activeToken, {
                    horariosPrograma: horariosTransformados,
                    programas: nombresProgramas,
                    horariosDocenteData: horariosDocenteTransformados,
                    docentes: docentesFinales
                });
            } catch (error) {
                console.error('Error al cargar horarios:', error);
            }
        };

        cargarHorarios();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estadoReporte, recarga]);

    return { horariosPrograma, programas, horariosDocenteData, docentes, cargarHorariosExtendidosReporte };
}
