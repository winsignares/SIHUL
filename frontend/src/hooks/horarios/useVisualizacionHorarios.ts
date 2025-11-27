import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import type { Facultad, Programa, Asignatura, EspacioFisico } from '../../models';
import type { HorarioCompleto, AsignaturaHorario } from '../../models/horarios/visualizacion.model';

export function useVisualizacionHorarios() {
    const [facultades, setFacultades] = useState<Facultad[]>([]);
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [horarios, setHorarios] = useState<HorarioCompleto[]>([]);

    const [facultadSeleccionada, setFacultadSeleccionada] = useState<string>('');
    const [programaSeleccionado, setProgramaSeleccionado] = useState<string>('');
    const [semestreSeleccionado, setSemestreSeleccionado] = useState<string>('');
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<string>('');
    const [docenteFiltro, setDocenteFiltro] = useState<string>('');
    const [espacioFiltro, setEspacioFiltro] = useState<string>('');
    const [tipoVista, setTipoVista] = useState<'grupo' | 'docente' | 'espacio'>('grupo');

    const [horarioVisualizado, setHorarioVisualizado] = useState<HorarioCompleto | null>(null);

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const horasDelDia = [
        '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
        '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00',
        '20:00', '21:00', '22:00'
    ];

    const PERIODO_ACTUAL = '2025-1';

    useEffect(() => {
        loadData();

        // Escuchar cambios en localStorage para actualizar automáticamente
        const handleStorageChange = () => {
            loadData();
        };

        window.addEventListener('storage', handleStorageChange);

        // También escuchar eventos personalizados para cambios en la misma pestaña
        window.addEventListener('horariosUpdated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('horariosUpdated', handleStorageChange);
        };
    }, []);

    const loadData = () => {
        setFacultades(db.getFacultades());
        setProgramas(db.getProgramas());
        setAsignaturas(db.getAsignaturas());
        setEspacios(db.getEspacios());

        // Cargar horarios desde localStorage (mismo lugar que HorariosAcademicos)
        const stored = localStorage.getItem('horariosCompletos');
        if (stored) {
            const horariosData = JSON.parse(stored);
            setHorarios(horariosData);
            console.log('Horarios cargados:', horariosData);
        } else {
            console.log('No hay horarios en localStorage');
        }
    };

    // Filtrar programas por facultad seleccionada
    const programasFiltrados = programas.filter(p =>
        p.facultadId === facultadSeleccionada
    );

    // Obtener el programa actual para saber cuántos semestres tiene
    const programaActual = programas.find(p => p.id === programaSeleccionado);
    const semestresDisponibles = programaActual ? Array.from({ length: programaActual.semestres }, (_, i) => i + 1) : [];

    // Generar grupos dinámicamente basados en el semestre seleccionado
    const generarGruposPorSemestre = (semestre: string): string[] => {
        if (!semestre) return [];

        console.log('Filtrando grupos con:', {
            facultadSeleccionada,
            programaSeleccionado,
            semestre,
            totalHorarios: horarios.length
        });

        // Buscar todos los horarios que coincidan con los filtros actuales
        const gruposExistentes = horarios
            .filter(h => {
                const match = h.facultadId === facultadSeleccionada &&
                    h.programaId === programaSeleccionado &&
                    h.semestre === Number(semestre);

                if (match) {
                    console.log('Horario encontrado:', h);
                }

                return match;
            })
            .map(h => h.grupoNombre);

        console.log('Grupos disponibles:', gruposExistentes);

        return gruposExistentes;
    };

    const gruposDisponibles = generarGruposPorSemestre(semestreSeleccionado);

    const visualizarHorario = () => {
        if (!facultadSeleccionada || !programaSeleccionado || !semestreSeleccionado || !grupoSeleccionado) {
            return;
        }

        // Buscar el horario exacto que coincida con los filtros
        const horario = horarios.find(h =>
            h.facultadId === facultadSeleccionada &&
            h.programaId === programaSeleccionado &&
            h.semestre === Number(semestreSeleccionado) &&
            h.grupoNombre === grupoSeleccionado
        );

        setHorarioVisualizado(horario || null);
    };

    const obtenerAsignaturasEnCelda = (dia: string, hora: string) => {
        if (!horarioVisualizado) return [];

        return horarioVisualizado.asignaturas.filter(asig => {
            if (asig.dia !== dia) return false;

            const horaInicioNum = parseInt(asig.horaInicio.replace(':', ''));
            const horaFinNum = parseInt(asig.horaFin.replace(':', ''));
            const horaCeldaNum = parseInt(hora.replace(':', ''));

            return horaCeldaNum >= horaInicioNum && horaCeldaNum < horaFinNum;
        });
    };

    const calcularFilasSpan = (asignatura: AsignaturaHorario) => {
        const horaInicio = parseInt(asignatura.horaInicio.replace(':', ''));
        const horaFin = parseInt(asignatura.horaFin.replace(':', ''));
        const duracion = (horaFin - horaInicio) / 100;
        return duracion;
    };

    const facultadNombre = facultades.find(f => f.id === facultadSeleccionada)?.nombre || '';
    const programaNombre = programas.find(p => p.id === programaSeleccionado)?.nombre || '';

    return {
        facultades,
        programas,
        asignaturas,
        espacios,
        horarios,
        facultadSeleccionada,
        setFacultadSeleccionada,
        programaSeleccionado,
        setProgramaSeleccionado,
        semestreSeleccionado,
        setSemestreSeleccionado,
        grupoSeleccionado,
        setGrupoSeleccionado,
        docenteFiltro,
        setDocenteFiltro,
        espacioFiltro,
        setEspacioFiltro,
        tipoVista,
        setTipoVista,
        horarioVisualizado,
        setHorarioVisualizado,
        dias,
        horasDelDia,
        PERIODO_ACTUAL,
        loadData,
        programasFiltrados,
        semestresDisponibles,
        gruposDisponibles,
        visualizarHorario,
        obtenerAsignaturasEnCelda,
        calcularFilasSpan,
        facultadNombre,
        programaNombre
    };
}
