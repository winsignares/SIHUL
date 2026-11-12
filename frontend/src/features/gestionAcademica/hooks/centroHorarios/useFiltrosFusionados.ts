import { useState } from 'react';
import type { Grupo } from '../../services/grupos/gruposAPI';
import type { Programa } from '../../services/programas/programaAPI';
import type { PeriodoAcademico } from '../../services/periodos/periodoAPI';
import type { EspacioFisico } from '../../../espacios/services/espaciosAPI';
import type { Docente, HorarioFusionadoExtendido } from './centroHorariosTypes';

interface Opciones {
    horariosFusionados: HorarioFusionadoExtendido[];
    grupos: Grupo[];
    programas: Programa[];
    docentes: Docente[];
    espacios: EspacioFisico[];
    periodos: PeriodoAcademico[];
}

/** Filtros y listas derivadas de la pestaña de horarios fusionados. */
export function useFiltrosFusionados({ horariosFusionados, grupos, programas, docentes, espacios, periodos }: Opciones) {
    const [filtroFusionadoFacultad, setFiltroFusionadoFacultad] = useState<string>('all');
    const [filtroFusionadoPrograma, setFiltroFusionadoPrograma] = useState<string>('all');
    const [filtroFusionadoGrupo, setFiltroFusionadoGrupo] = useState<string>('all');
    const [filtroFusionadoSemestre, setFiltroFusionadoSemestre] = useState<string>('all');
    const [filtroFusionadoDia, setFiltroFusionadoDia] = useState<string>('all');
    const [filtroFusionadoAsignatura, setFiltroFusionadoAsignatura] = useState<string>('all');
    const [filtroFusionadoDocente, setFiltroFusionadoDocente] = useState<string>('all');
    const [filtroFusionadoEspacio, setFiltroFusionadoEspacio] = useState<string>('all');
    const [filtroFusionadoPeriodo, setFiltroFusionadoPeriodo] = useState<string>('all');

    const getFusionadoGrupos = (hf: HorarioFusionadoExtendido): Grupo[] => {
        const ids = [hf.grupo1_id, hf.grupo2_id, hf.grupo3_id].filter((id): id is number => id != null);
        return ids
            .map(id => grupos.find(g => g.id === id))
            .filter((grupo): grupo is Grupo => grupo !== undefined);
    };

    const fusionadoMatchesFacultad = (hf: HorarioFusionadoExtendido, facultadId: string): boolean => {
        if (facultadId === 'all') return true;
        return getFusionadoGrupos(hf).some(grupo => {
            const programa = programas.find(p => p.id === grupo.programa_id);
            return programa?.facultad_id?.toString() === facultadId;
        });
    };

    const fusionadoMatchesPrograma = (hf: HorarioFusionadoExtendido, programaId: string): boolean => {
        if (programaId === 'all') return true;
        return getFusionadoGrupos(hf).some(grupo => grupo.programa_id?.toString() === programaId);
    };

    // Listas únicas para filtros de horarios fusionados
    const gruposFusionadosUnicos = [...new Set(horariosFusionados.flatMap(h => [
        h.grupo1_nombre,
        h.grupo2_nombre,
        h.grupo3_nombre
    ]).filter((nombre): nombre is string => Boolean(nombre)))].sort();
    const semestresFusionadosUnicos = [...new Set(horariosFusionados.flatMap(h => getFusionadoGrupos(h).map(g => g.semestre)).filter(Boolean))].sort((a, b) => a - b);
    const programasFusionadosFiltrados = programas.filter(p =>
        filtroFusionadoFacultad === 'all' || p.facultad_id?.toString() === filtroFusionadoFacultad
    );
    const diasFusionadosUnicos = [...new Set(horariosFusionados.map(h => h.dia_semana))].sort();
    const asignaturasFusionadasUnicas = [...new Set(horariosFusionados.map(h => h.asignatura_nombre))].sort();
    const docentesFusionadosDisponibles = docentes.filter(docente => horariosFusionados.some(h => h.docente_id === docente.id));
    const espaciosFusionadosDisponibles = espacios.filter(espacio => horariosFusionados.some(h => h.espacio_id === espacio.id));
    const periodosFusionadosDisponibles = periodos
        .filter(periodo => periodo.id !== undefined && horariosFusionados.some(h => h.periodo_id === periodo.id))
        .sort((a, b) => a.nombre.localeCompare(b.nombre, undefined, { numeric: true }));

    // Filtrar horarios fusionados
    const horariosFusionadosFiltrados = horariosFusionados.filter(hf => {
        const gruposDelFusionado = getFusionadoGrupos(hf);
        const matchFacultad = fusionadoMatchesFacultad(hf, filtroFusionadoFacultad);
        const matchPrograma = fusionadoMatchesPrograma(hf, filtroFusionadoPrograma);
        const matchGrupo = filtroFusionadoGrupo === 'all'
            || [hf.grupo1_nombre, hf.grupo2_nombre, hf.grupo3_nombre].includes(filtroFusionadoGrupo);
        const matchSemestre = filtroFusionadoSemestre === 'all'
            || gruposDelFusionado.some(grupo => grupo.semestre?.toString() === filtroFusionadoSemestre);
        const matchDia = filtroFusionadoDia === 'all' || hf.dia_semana.toLowerCase() === filtroFusionadoDia.toLowerCase();
        const matchAsignatura = filtroFusionadoAsignatura === 'all' || hf.asignatura_nombre === filtroFusionadoAsignatura;
        const matchDocente = filtroFusionadoDocente === 'all'
            || (filtroFusionadoDocente === 'sin-asignar' ? hf.docente_id == null : hf.docente_id?.toString() === filtroFusionadoDocente);
        const matchEspacio = filtroFusionadoEspacio === 'all'
            || (filtroFusionadoEspacio === 'sin-espacio' ? hf.espacio_id == null : hf.espacio_id?.toString() === filtroFusionadoEspacio);
        const matchPeriodo = filtroFusionadoPeriodo === 'all' || hf.periodo_id?.toString() === filtroFusionadoPeriodo;

        return matchFacultad && matchPrograma && matchGrupo && matchSemestre && matchDia && matchAsignatura && matchDocente && matchEspacio && matchPeriodo;
    });

    const limpiarFiltrosFusionados = () => {
        setFiltroFusionadoFacultad('all');
        setFiltroFusionadoPrograma('all');
        setFiltroFusionadoGrupo('all');
        setFiltroFusionadoSemestre('all');
        setFiltroFusionadoDia('all');
        setFiltroFusionadoAsignatura('all');
        setFiltroFusionadoDocente('all');
        setFiltroFusionadoEspacio('all');
        setFiltroFusionadoPeriodo('all');
    };

    return {
        filtroFusionadoFacultad, setFiltroFusionadoFacultad,
        filtroFusionadoPrograma, setFiltroFusionadoPrograma,
        filtroFusionadoGrupo, setFiltroFusionadoGrupo,
        filtroFusionadoSemestre, setFiltroFusionadoSemestre,
        filtroFusionadoDia, setFiltroFusionadoDia,
        filtroFusionadoAsignatura, setFiltroFusionadoAsignatura,
        filtroFusionadoDocente, setFiltroFusionadoDocente,
        filtroFusionadoEspacio, setFiltroFusionadoEspacio,
        filtroFusionadoPeriodo, setFiltroFusionadoPeriodo,
        gruposFusionadosUnicos,
        semestresFusionadosUnicos,
        programasFusionadosFiltrados,
        diasFusionadosUnicos,
        asignaturasFusionadasUnicas,
        docentesFusionadosDisponibles,
        espaciosFusionadosDisponibles,
        periodosFusionadosDisponibles,
        horariosFusionadosFiltrados,
        limpiarFiltrosFusionados,
    };
}
