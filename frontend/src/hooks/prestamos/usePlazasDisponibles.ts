import { useState, useEffect, useCallback } from 'react';
import { db } from '../../hooks/database';
import type { EspacioFisico, HorarioAcademico } from '../../models/academica';

export interface EspacioEnriquecido extends EspacioFisico {
    disponibilidad: string;
    grupoOcupante: {
        grupo: string;
        asignatura: string;
        horario: string;
    } | null;
}

export function usePlazasDisponibles() {
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [espaciosFiltrados, setEspaciosFiltrados] = useState<EspacioEnriquecido[]>([]);
    const [horarios, setHorarios] = useState<HorarioAcademico[]>([]);

    // Filtros
    const [busqueda, setBusqueda] = useState('');
    const [sedeSeleccionada, setSedeSeleccionada] = useState('todas');
    const [tipoSeleccionado, setTipoSeleccionado] = useState('todos');
    const [diaSeleccionado, setDiaSeleccionado] = useState('lunes');
    const [horaInicio, setHoraInicio] = useState('08:00');
    const [horaFin, setHoraFin] = useState('10:00');
    const [capacidadMinima, setCapacidadMinima] = useState('');

    const cargarDatos = () => {
        const espaciosDB = db.getEspacios();
        const horariosDB = db.getHorarios();
        setEspacios(espaciosDB);
        setHorarios(horariosDB);
    };

    // Cargar datos
    useEffect(() => {
        cargarDatos();
    }, []);

    // Verificar disponibilidad de un espacio en un horario específico
    const verificarDisponibilidad = useCallback((espacioId: string, dia: string, horaIni: string, horaFin: string) => {
        const horariosEspacio = horarios.filter(h =>
            h.espacioId === espacioId &&
            h.diaSemana === dia
        );

        if (horariosEspacio.length === 0) return 'disponible';

        // Verificar si hay conflicto de horarios
        const hayConflicto = horariosEspacio.some(h => {
            const horaInicioExistente = h.horaInicio;
            const horaFinExistente = h.horaFin;

            // Verificar solapamiento
            return (
                (horaIni >= horaInicioExistente && horaIni < horaFinExistente) ||
                (horaFin > horaInicioExistente && horaFin <= horaFinExistente) ||
                (horaIni <= horaInicioExistente && horaFin >= horaFinExistente)
            );
        });

        return hayConflicto ? 'ocupado' : 'disponible';
    }, [horarios]);

    // Obtener grupo ocupando el espacio en ese horario
    const obtenerGrupoOcupante = useCallback((espacioId: string, dia: string, horaIni: string, horaFin: string) => {
        const horario = horarios.find(h =>
            h.espacioId === espacioId &&
            h.diaSemana === dia &&
            (
                (horaIni >= h.horaInicio && horaIni < h.horaFin) ||
                (horaFin > h.horaInicio && horaFin <= h.horaFin) ||
                (horaIni <= h.horaInicio && horaFin >= h.horaFin)
            )
        );

        if (!horario) return null;

        const grupo = db.getGrupos().find(g => g.id === horario.grupoId);
        const asignatura = grupo ? db.getAsignaturas().find(a => a.id === grupo.asignaturaId) : null;

        return {
            grupo: grupo?.codigo || 'N/A',
            asignatura: asignatura?.nombre || 'N/A',
            horario: `${horario.horaInicio} - ${horario.horaFin}`
        };
    }, [horarios]);

    // Aplicar filtros
    useEffect(() => {
        let resultado = [...espacios];

        // Filtro por búsqueda
        if (busqueda) {
            resultado = resultado.filter(e =>
                e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
                e.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
                e.sede.toLowerCase().includes(busqueda.toLowerCase())
            );
        }

        // Filtro por sede
        if (sedeSeleccionada !== 'todas') {
            resultado = resultado.filter(e => e.sede === sedeSeleccionada);
        }

        // Filtro por tipo
        if (tipoSeleccionado !== 'todos') {
            resultado = resultado.filter(e => e.tipo === tipoSeleccionado);
        }

        // Filtro por capacidad mínima
        if (capacidadMinima) {
            resultado = resultado.filter(e => e.capacidad >= parseInt(capacidadMinima));
        }

        // Añadir información de disponibilidad
        const resultadoEnriquecido: EspacioEnriquecido[] = resultado.map(e => ({
            ...e,
            disponibilidad: verificarDisponibilidad(e.id, diaSeleccionado, horaInicio, horaFin),
            grupoOcupante: obtenerGrupoOcupante(e.id, diaSeleccionado, horaInicio, horaFin)
        }));

        setEspaciosFiltrados(resultadoEnriquecido);
    }, [busqueda, sedeSeleccionada, tipoSeleccionado, capacidadMinima, diaSeleccionado, horaInicio, horaFin, espacios, horarios, verificarDisponibilidad, obtenerGrupoOcupante]);

    // Obtener sedes únicas
    const sedes = Array.from(new Set(espacios.map(e => e.sede)));

    // Estadísticas
    const totalEspacios = espaciosFiltrados.length;
    const disponibles = espaciosFiltrados.filter(e => e.disponibilidad === 'disponible' && e.estado === 'Disponible').length;
    const ocupados = espaciosFiltrados.filter(e => e.disponibilidad === 'ocupado').length;
    const mantenimiento = espaciosFiltrados.filter(e => e.estado === 'Mantenimiento').length;

    const limpiarFiltros = () => {
        setBusqueda('');
        setSedeSeleccionada('todas');
        setTipoSeleccionado('todos');
        setDiaSeleccionado('lunes');
        setHoraInicio('08:00');
        setHoraFin('10:00');
        setCapacidadMinima('');
        // Mostrar notificación: Filtros limpiados
    };

    return {
        espaciosFiltrados,
        busqueda,
        setBusqueda,
        sedeSeleccionada,
        setSedeSeleccionada,
        tipoSeleccionado,
        setTipoSeleccionado,
        diaSeleccionado,
        setDiaSeleccionado,
        horaInicio,
        setHoraInicio,
        horaFin,
        setHoraFin,
        capacidadMinima,
        setCapacidadMinima,
        sedes,
        totalEspacios,
        disponibles,
        ocupados,
        mantenimiento,
        limpiarFiltros
    };
}
