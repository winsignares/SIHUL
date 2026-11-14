import { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import type { EstadoHorarioReporte } from '../services/reporteOcupacionAPI';
import { estadosReporte, reportesDisponibles } from './reportesConstantes';
import { usePeriodoReporte } from './usePeriodoReporte';
import { useHorariosReporte } from './useHorariosReporte';
import { useOcupacionReporte } from './useOcupacionReporte';
import { useDisponibilidadReporte } from './useDisponibilidadReporte';
import { useCapacidadReporte } from './useCapacidadReporte';
import { useReportesExportacion } from './useReportesExportacion';

export type { Docente } from './reportesConstantes';

export function useReportes() {
    const { user, role } = useAuth();
    const [tipoReporte, setTipoReporte] = useState('ocupacion');
    const [estadoReporte, setEstadoReporte] = useState<EstadoHorarioReporte>('aprobado');
    const [filtroDocente, setFiltroDocente] = useState('Todos');
    const [filtroPrograma, setFiltroPrograma] = useState('Todos');
    const [showHorarioModal, setShowHorarioModal] = useState(false);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
    const [docenteSeleccionado, setDocenteSeleccionado] = useState<string | null>(null);
    const [showHorarioDocenteModal, setShowHorarioDocenteModal] = useState(false);

    const { periodoActual } = usePeriodoReporte();

    const { horariosPrograma, programas, horariosDocenteData, docentes, cargarHorariosExtendidosReporte } = useHorariosReporte({
        estadoReporte, user, role,
    });

    const { datosOcupacion, espaciosMasUsados, cargandoOcupacion, errorOcupacion } = useOcupacionReporte(estadoReporte);

    const { disponibilidadEspacios, cargandoDisponibilidad, errorDisponibilidad } = useDisponibilidadReporte(estadoReporte);

    const { capacidadUtilizada, cargandoCapacidad, errorCapacidad } = useCapacidadReporte(estadoReporte);

    // Filtrar programas según facultad del usuario
    let programasFiltrados = programas;
    if (role?.nombre === 'planeacion_facultad' && user?.facultad) {
        const nombreFacultad = user.facultad.nombre.toLowerCase();
        programasFiltrados = programas.filter(p => {
            if (p === 'Todos') return false; // No permitir 'Todos' si está restringido
            // Lógica simple de mapeo por nombre para demo
            if (nombreFacultad.includes('ingeniería')) return p.includes('Ingeniería');
            if (nombreFacultad.includes('económicas') || nombreFacultad.includes('economicas')) return p.includes('Administración') || p.includes('Contaduría');
            return true;
        });
        // Si no hay coincidencias (por nombres hardcoded), mostrar todos o ninguno
        if (programasFiltrados.length === 0) programasFiltrados = programas.filter(p => p !== 'Todos');
    }


    const { exportarPDF, exportarExcel } = useReportesExportacion({
        tipoReporte, estadoReporte, filtroDocente, filtroPrograma, periodoActual, datosOcupacion,
        espaciosMasUsados, disponibilidadEspacios, capacidadUtilizada, cargarHorariosExtendidosReporte,
    });

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
        tipoReporte,
        setTipoReporte,
        estadoReporte,
        setEstadoReporte,
        estadosReporte,
        filtroDocente,
        setFiltroDocente,
        filtroPrograma,
        setFiltroPrograma,
        datosOcupacion,
        espaciosMasUsados,
        horariosDocente: horariosDocenteData,
        horariosPrograma,
        disponibilidadEspacios,
        capacidadUtilizada,
        reportesDisponibles,
        docentes,
        programas: programasFiltrados,
        exportarPDF,
        exportarExcel,
        cargandoOcupacion,
        errorOcupacion,
        cargandoDisponibilidad,
        errorDisponibilidad,
        cargandoCapacidad,
        errorCapacidad,
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
