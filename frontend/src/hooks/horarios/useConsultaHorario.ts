import { useState, useEffect } from 'react';
import type { HorarioDocente, HorarioPrograma } from '../../models';
import { horarioService } from '../../services/horarios/horariosAPI';
import { programaService } from '../../services/programas/programaAPI';
import { periodoActivoService } from '../../services/periodos/periodoActivoAPI';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

export interface Docente {
    id: number | string;
    nombre: string;
    correo?: string;
}

const PERIODO_DEFAULT = '2025-2';
const CONSULTA_HORARIO_PERIODO_CACHE_KEY = 'horarios-consulta-periodo';
const CONSULTA_HORARIO_DATA_CACHE_KEY = 'horarios-consulta-data';

export function useConsultaHorario() {
    const [tipoConsulta, setTipoConsulta] = useState('horarios-programa');
    const [filtroDocente, setFiltroDocente] = useState('Todos');
    const [filtroPrograma, setFiltroPrograma] = useState('Todos');
    const [periodoActual, setPeriodoActual] = useState(PERIODO_DEFAULT);
    const [showHorarioModal, setShowHorarioModal] = useState(false);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
    const [horariosPrograma, setHorariosPrograma] = useState<HorarioPrograma[]>([]);
    const [programas, setProgramas] = useState<string[]>([]);
    const [horariosDocenteData, setHorariosDocenteData] = useState<HorarioDocente[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [docenteSeleccionado, setDocenteSeleccionado] = useState<string | null>(null);
    const [showHorarioDocenteModal, setShowHorarioDocenteModal] = useState(false);

    const cargarPeriodo = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedData = force
                ? null
                : getSessionCacheData<{ periodoActual: string }>(CONSULTA_HORARIO_PERIODO_CACHE_KEY, activeToken);

            if (cachedData?.periodoActual) {
                setPeriodoActual(cachedData.periodoActual);
                return;
            }

            const periodo = await periodoActivoService.getPeriodoActivo();
            if (periodo && periodo.nombre) {
                setPeriodoActual(periodo.nombre);
                setSessionCacheData(CONSULTA_HORARIO_PERIODO_CACHE_KEY, activeToken, {
                    periodoActual: periodo.nombre
                });
            }
        } catch (error) {
            console.error('Error al cargar período activo:', error);
        }
    };

    const cargarHorarios = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedData = force
                ? null
                : getSessionCacheData<{
                    horariosPrograma: HorarioPrograma[];
                    programas: string[];
                    horariosDocenteData: HorarioDocente[];
                    docentes: Docente[];
                }>(CONSULTA_HORARIO_DATA_CACHE_KEY, activeToken);

            if (cachedData) {
                setHorariosPrograma(cachedData.horariosPrograma);
                setProgramas(cachedData.programas);
                setHorariosDocenteData(cachedData.horariosDocenteData);
                setDocentes(cachedData.docentes);
                return;
            }

            // Cargar horarios extendidos
            const horariosResponse = await horarioService.listExtendidos();
            const horariosExtendidos = horariosResponse.horarios;

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
                docente_id: h.docente_id,
                facultad: h.programa_nombre
            }));

            setHorariosDocenteData(horariosDocenteTransformados);

            let docentesFinales: Docente[] = [];
            // Cargar docentes completos desde el endpoint
            try {
                const apiUrl = import.meta.env.VITE_API_URL;
                const docentesResponse = await fetch(`${apiUrl}/usuarios/list/`);
                if (docentesResponse.ok) {
                    const docentesData = await docentesResponse.json();
                    docentesFinales = [
                        { id: 'todos', nombre: 'Todos', correo: '' },
                        ...docentesData.usuarios.map((u: any) => ({
                            id: u.id,
                            nombre: u.nombre,
                            correo: u.correo
                        }))
                    ];
                    setDocentes(docentesFinales);
                }
            } catch (error) {
                console.error('Error al cargar docentes:', error);
                // Fallback: usar nombres únicos de horarios
                docentesFinales = [
                    { id: 'todos', nombre: 'Todos', correo: '' },
                    ...Array.from(new Set(horariosExtendidos.map(h => h.docente_nombre).filter(Boolean))).map((nombre, idx) => ({
                        id: `docente-${idx}`,
                        nombre,
                        correo: ''
                    }))
                ];
                setDocentes(docentesFinales);
            }

            if (docentesFinales.length === 0) {
                docentesFinales = [{ id: 'todos', nombre: 'Todos', correo: '' }];
                setDocentes(docentesFinales);
            }

            setSessionCacheData(CONSULTA_HORARIO_DATA_CACHE_KEY, activeToken, {
                horariosPrograma: horariosTransformados,
                programas: nombresProgramas,
                horariosDocenteData: horariosDocenteTransformados,
                docentes: docentesFinales
            });
        } catch (error) {
            console.error('Error al cargar horarios:', error);
        }
    };

    // Cargar período académico activo
    useEffect(() => {
        cargarPeriodo();
    }, []);

    // Cargar horarios del backend cuando el componente monta
    useEffect(() => {
        cargarHorarios();
    }, []);

    const exportarPDF = async () => {
        try {
            if (tipoConsulta === 'horarios-programa') {
                const apiUrl = import.meta.env.VITE_API_URL;
                
                const horariosResponse = await horarioService.listExtendidos();
                const todosLosHorarios = horariosResponse.horarios;
                
                const horariosAExportar = filtroPrograma === 'Todos' 
                    ? todosLosHorarios
                    : todosLosHorarios.filter(h => h.programa_nombre.toLowerCase() === filtroPrograma.toLowerCase());
                
                const response = await fetch(`${apiUrl}/horario/exportar-pdf/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        horarios: horariosAExportar
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al generar PDF');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `horarios_programa.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                return;
            }

            if (tipoConsulta === 'horarios-docente') {
                const apiUrl = import.meta.env.VITE_API_URL;
                
                const horariosResponse = await horarioService.listExtendidos();
                const todosLosHorarios = horariosResponse.horarios;
                
                const horariosAExportar = filtroDocente === 'Todos' 
                    ? todosLosHorarios
                    : todosLosHorarios.filter(h => h.docente_nombre === filtroDocente);
                
                const response = await fetch(`${apiUrl}/horario/exportar-pdf-docente/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        horarios: horariosAExportar
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al generar PDF');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `horarios_docente.pdf`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error al generar PDF:', error);
        }
    };

    const exportarExcel = async () => {
        try {
            if (tipoConsulta === 'horarios-programa') {
                const apiUrl = import.meta.env.VITE_API_URL;
                
                const horariosResponse = await horarioService.listExtendidos();
                const todosLosHorarios = horariosResponse.horarios;
                
                const horariosAExportar = filtroPrograma === 'Todos' 
                    ? todosLosHorarios
                    : todosLosHorarios.filter(h => h.programa_nombre.toLowerCase() === filtroPrograma.toLowerCase());
                
                const response = await fetch(`${apiUrl}/horario/exportar-excel/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        horarios: horariosAExportar
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al generar Excel');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `horarios_programa.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                
                return;
            }

            if (tipoConsulta === 'horarios-docente') {
                const apiUrl = import.meta.env.VITE_API_URL;
                
                const horariosResponse = await horarioService.listExtendidos();
                const todosLosHorarios = horariosResponse.horarios;
                
                const horariosAExportar = filtroDocente === 'Todos' 
                    ? todosLosHorarios
                    : todosLosHorarios.filter(h => h.docente_nombre === filtroDocente);
                
                const response = await fetch(`${apiUrl}/horario/exportar-excel-docente/`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        horarios: horariosAExportar
                    })
                });

                if (!response.ok) {
                    throw new Error('Error al generar Excel');
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `horarios_docente.xlsx`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }
        } catch (error) {
            console.error('Error al generar Excel:', error);
        }
    };

    const handleVerHorarioGrupo = (grupo: string) => {
        setGrupoSeleccionado(grupo);
        setShowHorarioModal(true);
    };

    const obtenerHorariosGrupo = (grupo: string) => {
        return horariosPrograma.filter(h => h.grupo === grupo);
    };

    const handleVerHorarioDocente = (docente: string) => {
        setDocenteSeleccionado(docente);
        setShowHorarioDocenteModal(true);
    };

    const obtenerHorariosDocente = (docente: string) => {
        return horariosDocenteData.filter(h => h.docente === docente);
    };

    return {
        periodoActual,
        tipoConsulta,
        setTipoConsulta,
        filtroDocente,
        setFiltroDocente,
        filtroPrograma,
        setFiltroPrograma,
        horariosDocente: horariosDocenteData,
        horariosPrograma,
        docentes,
        programas,
        exportarPDF,
        exportarExcel,
        showHorarioModal,
        setShowHorarioModal,
        grupoSeleccionado,
        setGrupoSeleccionado,
        handleVerHorarioGrupo,
        obtenerHorariosGrupo,
        docenteSeleccionado,
        setDocenteSeleccionado,
        showHorarioDocenteModal,
        setShowHorarioDocenteModal,
        handleVerHorarioDocente,
        obtenerHorariosDocente
    };
}
