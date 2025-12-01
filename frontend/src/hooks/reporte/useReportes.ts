import { useState, useEffect } from 'react';
import { BarChart3, User, Building, PieChart, TrendingUp } from 'lucide-react';
import type {
    DatoOcupacionJornada,
    EspacioMasUsado,
    HorarioDocente,
    HorarioPrograma,
    DisponibilidadEspacio,
    CapacidadUtilizada,
    ReporteDisponible
} from '../../models';
import { reporteOcupacionService } from '../../services/reporte/reporteOcupacionAPI';
import { disponibilidadService } from '../../services/reporte/disponibilidadAPI';
import { capacidadService } from '../../services/reporte/capacidadAPI';
import { horarioService } from '../../services/horarios/horariosAPI';
import { programaService } from '../../services/programas/programaAPI';
import { periodoActivoService } from '../../services/periodos/periodoActivoAPI';

const PERIODO_DEFAULT = '2025-1';

// Datos por defecto mientras se cargan los datos reales
const datosOcupacionDefault: DatoOcupacionJornada[] = [
    { jornada: 'Mañana (07:00 - 12:00)', ocupacion: 85, espacios: 45, color: 'bg-blue-600' },
    { jornada: 'Tarde (14:00 - 18:00)', ocupacion: 92, espacios: 38, color: 'bg-red-600' },
    { jornada: 'Noche (18:00 - 21:00)', ocupacion: 68, espacios: 22, color: 'bg-yellow-600' }
];

const espaciosMasUsadosDefault: EspacioMasUsado[] = [
    { espacio: 'Aula 101', usos: 28, ocupacion: 95 },
    { espacio: 'Laboratorio 301', usos: 24, ocupacion: 88 },
    { espacio: 'Aula 205', usos: 22, ocupacion: 82 },
    { espacio: 'Auditorio Central', usos: 18, ocupacion: 75 },
    { espacio: 'Aula 102', usos: 16, ocupacion: 70 }
];

const horariosDocente: HorarioDocente[] = [
    { dia: 'Lunes', hora: '07:00-09:00', asignatura: 'Programación I', grupo: 'INSI-A', espacio: 'Aula 101', docente: 'Dr. Juan Pérez' },
    { dia: 'Martes', hora: '07:00-09:00', asignatura: 'Bases de Datos', grupo: 'INSI-B', espacio: 'Lab 301', docente: 'Dr. Juan Pérez' },
    { dia: 'Martes', hora: '14:00-16:00', asignatura: 'Estadística', grupo: 'ADEM-B', espacio: 'Aula 103', docente: 'Dr. Juan Pérez' },
    { dia: 'Jueves', hora: '07:00-09:00', asignatura: 'Programación I', grupo: 'INSI-C', espacio: 'Aula 102', docente: 'Dr. Juan Pérez' },
    { dia: 'Viernes', hora: '09:00-11:00', asignatura: 'Algoritmos', grupo: 'INSI-A', espacio: 'Lab 401', docente: 'Dr. Juan Pérez' }
];

const horariosPrograma: HorarioPrograma[] = [
    { grupo: 'INSI-A', dia: 'Lunes', hora: '07:00-09:00', asignatura: 'Programación I', docente: 'Dr. Juan Pérez', espacio: 'Aula 101' },
    { grupo: 'INSI-A', dia: 'Lunes', hora: '09:00-11:00', asignatura: 'Cálculo I', docente: 'Dra. María López', espacio: 'Aula 101' },
    { grupo: 'INSI-A', dia: 'Miércoles', hora: '14:00-16:00', asignatura: 'Física I', docente: 'Dr. Pedro González', espacio: 'Lab 201' },
    { grupo: 'INSI-B', dia: 'Martes', hora: '07:00-09:00', asignatura: 'Bases de Datos', docente: 'Dr. Juan Pérez', espacio: 'Lab 301' },
    { grupo: 'INSI-B', dia: 'Jueves', hora: '09:00-11:00', asignatura: 'Estructuras de Datos', docente: 'Ing. Ana Martínez', espacio: 'Aula 205' }
];

const disponibilidadEspaciosDefault: DisponibilidadEspacio[] = [
    { nombre: 'Aula 101', tipo: 'Aula', horasDisponibles: 12, horasOcupadas: 38, porcentajeOcupacion: 76 },
    { nombre: 'Lab 301', tipo: 'Laboratorio', horasDisponibles: 20, horasOcupadas: 30, porcentajeOcupacion: 60 },
    { nombre: 'Auditorio Central', tipo: 'Auditorio', horasDisponibles: 35, horasOcupadas: 15, porcentajeOcupacion: 30 },
    { nombre: 'Aula 205', tipo: 'Aula', horasDisponibles: 18, horasOcupadas: 32, porcentajeOcupacion: 64 },
    { nombre: 'Lab 401', tipo: 'Laboratorio', horasDisponibles: 25, horasOcupadas: 25, porcentajeOcupacion: 50 }
];

const capacidadUtilizadaDefault: CapacidadUtilizada[] = [
    { tipo: 'Aulas Estándar', capacidadTotal: 1500, capacidadUsada: 1230, porcentaje: 82 },
    { tipo: 'Laboratorios', capacidadTotal: 600, capacidadUsada: 420, porcentaje: 70 },
    { tipo: 'Auditorios', capacidadTotal: 800, capacidadUsada: 320, porcentaje: 40 },
    { tipo: 'Salas de Juntas', capacidadTotal: 200, capacidadUsada: 150, porcentaje: 75 }
];

const reportesDisponibles: ReporteDisponible[] = [
    { id: 'ocupacion', nombre: 'Ocupación de Espacios', icon: BarChart3, color: 'text-blue-600', descripcion: 'Análisis de ocupación por jornada (RF20-1)' },
    { id: 'horarios-docente', nombre: 'Horarios por Docente', icon: User, color: 'text-red-600', descripcion: 'Horarios asignados a cada docente (RF20-2)' },
    { id: 'horarios-programa', nombre: 'Horarios por Programa', icon: Building, color: 'text-yellow-600', descripcion: 'Horarios por programa y grupo (RF20-2)' },
    { id: 'disponibilidad', nombre: 'Disponibilidad General', icon: PieChart, color: 'text-green-600', descripcion: 'Disponibilidad de espacios físicos (RF20-3)' },
    { id: 'capacidad', nombre: 'Capacidad Utilizada', icon: TrendingUp, color: 'text-purple-600', descripcion: 'Análisis de capacidad instalada (RF20-4)' }
];

const docentes = ['Todos', 'Dr. Juan Pérez', 'Dra. María López', 'Mg. Carlos Ruiz', 'Ing. Ana Martínez', 'Dr. Pedro González'];
const programas = ['Todos', 'Ingeniería de Sistemas', 'Administración de Empresas', 'Ingeniería Industrial', 'Contaduría Pública'];

import { useAuth } from '../../context/AuthContext';

export function useReportes() {
    const { user, role } = useAuth();
    const [tipoReporte, setTipoReporte] = useState('ocupacion');
    const [filtroDocente, setFiltroDocente] = useState('Todos');
    const [filtroPrograma, setFiltroPrograma] = useState('Todos');
    const [periodoActual, setPeriodoActual] = useState(PERIODO_DEFAULT);
    const [datosOcupacion, setDatosOcupacion] = useState<DatoOcupacionJornada[]>(datosOcupacionDefault);
    const [espaciosMasUsados, setEspaciosMasUsados] = useState<EspacioMasUsado[]>(espaciosMasUsadosDefault);
    const [cargandoOcupacion, setCargandoOcupacion] = useState(false);
    const [errorOcupacion, setErrorOcupacion] = useState<string | null>(null);
    const [disponibilidadEspacios, setDisponibilidadEspacios] = useState<DisponibilidadEspacio[]>(disponibilidadEspaciosDefault);
    const [cargandoDisponibilidad, setCargandoDisponibilidad] = useState(false);
    const [errorDisponibilidad, setErrorDisponibilidad] = useState<string | null>(null);
    const [capacidadUtilizada, setCapacidadUtilizada] = useState<CapacidadUtilizada[]>(capacidadUtilizadaDefault);
    const [cargandoCapacidad, setCargandoCapacidad] = useState(false);
    const [errorCapacidad, setErrorCapacidad] = useState<string | null>(null);
    const [showHorarioModal, setShowHorarioModal] = useState(false);
    const [grupoSeleccionado, setGrupoSeleccionado] = useState<string | null>(null);
    const [horariosPrograma, setHorariosPrograma] = useState<HorarioPrograma[]>([]);
    const [programas, setProgramas] = useState<string[]>([]);
    const [horariosDocenteData, setHorariosDocenteData] = useState<HorarioDocente[]>([]);
    const [docentes, setDocentes] = useState<string[]>([]);
    const [docenteSeleccionado, setDocenteSeleccionado] = useState<string | null>(null);
    const [showHorarioDocenteModal, setShowHorarioDocenteModal] = useState(false);

    // Cargar período académico activo
    useEffect(() => {
        const cargarPeriodo = async () => {
            try {
                const periodo = await periodoActivoService.getPeriodoActivo();
                if (periodo && periodo.nombre) {
                    setPeriodoActual(periodo.nombre);
                }
            } catch (error) {
                console.error('Error al cargar período activo:', error);
                // Mantener período default en caso de error
            }
        };

        cargarPeriodo();
    }, []);

    // Cargar horarios del backend cuando el componente monta
    useEffect(() => {
        const cargarHorarios = async () => {
            try {
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
                    facultad: h.programa_nombre // Usar nombre del programa como facultad por ahora
                }));

                setHorariosDocenteData(horariosDocenteTransformados);

                // Obtener lista única de docentes
                const docentesUnicos = ['Todos', ...new Set(horariosExtendidos.map(h => h.docente_nombre).filter(Boolean))];
                setDocentes(docentesUnicos);
            } catch (error) {
                console.error('Error al cargar horarios:', error);
            }
        };

        cargarHorarios();
    }, []);

    // Cargar datos de ocupación cuando el componente monta
    useEffect(() => {
        const cargarOcupacionReporte = async () => {
            setCargandoOcupacion(true);
            setErrorOcupacion(null);
            try {
                const response = await reporteOcupacionService.getOcupacionReporte(0);
                
                // Mapear datos con colores
                const datosConColor = response.ocupacion_por_jornada.map((dato, index) => ({
                    ...dato,
                    color: index === 0 ? 'bg-blue-600' : index === 1 ? 'bg-red-600' : 'bg-yellow-600'
                }));
                
                setDatosOcupacion(datosConColor);
                setEspaciosMasUsados(response.espacios_mas_usados);
            } catch (error) {
                console.error('Error al cargar datos de ocupación:', error);
                setErrorOcupacion('Error al cargar los datos de ocupación');
                // Mantener datos por defecto en caso de error
            } finally {
                setCargandoOcupacion(false);
            }
        };

        cargarOcupacionReporte();
    }, []);

    // Cargar datos de disponibilidad cuando el componente monta
    useEffect(() => {
        const cargarDisponibilidadReporte = async () => {
            setCargandoDisponibilidad(true);
            setErrorDisponibilidad(null);
            try {
                const response = await disponibilidadService.getDisponibilidad(0);
                setDisponibilidadEspacios(response.disponibilidad);
            } catch (error) {
                console.error('Error al cargar datos de disponibilidad:', error);
                setErrorDisponibilidad('Error al cargar los datos de disponibilidad');
            } finally {
                setCargandoDisponibilidad(false);
            }
        };

        cargarDisponibilidadReporte();
    }, []);

    // Cargar datos de capacidad cuando el componente monta
    useEffect(() => {
        const cargarCapacidadReporte = async () => {
            setCargandoCapacidad(true);
            setErrorCapacidad(null);
            try {
                const response = await capacidadService.getCapacidad(0);
                setCapacidadUtilizada(response.capacidad);
            } catch (error) {
                console.error('Error al cargar datos de capacidad:', error);
                setErrorCapacidad('Error al cargar los datos de capacidad');
            } finally {
                setCargandoCapacidad(false);
            }
        };

        cargarCapacidadReporte();
    }, []);

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

    const exportarPDF = async () => {
        try {
            // Si es horarios-programa, usar el endpoint del backend como en Centro de Horarios
            if (tipoReporte === 'horarios-programa') {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                
                // Cargar todos los horarios extendidos del backend
                const horariosResponse = await horarioService.listExtendidos();
                const todosLosHorarios = horariosResponse.horarios;
                
                // Filtrar según el filtro de programa aplicado
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

            // Si es horarios-docente, usar el endpoint del backend para docentes
            if (tipoReporte === 'horarios-docente') {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                
                // Cargar todos los horarios extendidos del backend
                const horariosResponse = await horarioService.listExtendidos();
                const todosLosHorarios = horariosResponse.horarios;
                
                // Filtrar según el filtro de docente aplicado
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
                
                return;
            }

            // Para otros reportes, generar PDF localmente
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Encabezado
            doc.setFontSize(18);
            doc.text(`Reporte: ${reportesDisponibles.find(r => r.id === tipoReporte)?.nombre || ''}`, 20, 20);

            doc.setFontSize(12);
            doc.text(`Periodo: ${periodoActual}`, 20, 30);
            doc.text(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')}`, 20, 37);

            doc.line(20, 42, 190, 42);

            let yPos = 52;

            // Contenido según tipo de reporte
            if (tipoReporte === 'ocupacion') {
                doc.setFontSize(14);
                doc.text('Ocupación por Jornada', 20, yPos);
                yPos += 10;

                doc.setFontSize(11);
                datosOcupacion.forEach((dato) => {
                    doc.text(`${dato.jornada}`, 25, yPos);
                    doc.text(`Ocupación: ${dato.ocupacion}%`, 100, yPos);
                    doc.text(`Espacios: ${dato.espacios}`, 150, yPos);
                    yPos += 8;
                });

                yPos += 10;
                doc.setFontSize(14);
                doc.text('Espacios Más Utilizados', 20, yPos);
                yPos += 10;

                doc.setFontSize(11);
                espaciosMasUsados.forEach((espacio, index) => {
                    doc.text(`${index + 1}. ${espacio.espacio}`, 25, yPos);
                    doc.text(`${espacio.usos} clases/semana`, 100, yPos);
                    doc.text(`${espacio.ocupacion}%`, 160, yPos);
                    yPos += 8;
                });
            } else if (tipoReporte === 'horarios-docente') {
                doc.setFontSize(14);
                doc.text('Horarios por Docente', 20, yPos);
                yPos += 10;

                doc.setFontSize(11);
                horariosDocente.forEach((horario) => {
                    doc.text(`${horario.dia} ${horario.hora}`, 25, yPos);
                    doc.text(`${horario.asignatura}`, 80, yPos);
                    doc.text(`${horario.grupo}`, 130, yPos);
                    doc.text(`${horario.espacio}`, 160, yPos);
                    yPos += 8;
                    if (yPos > 270) {
                        doc.addPage();
                        yPos = 20;
                    }
                });
            } else if (tipoReporte === 'disponibilidad') {
                doc.setFontSize(14);
                doc.text('Disponibilidad General de Espacios', 20, yPos);
                yPos += 10;

                doc.setFontSize(11);
                disponibilidadEspacios.forEach((espacio) => {
                    doc.text(`${espacio.nombre}`, 25, yPos);
                    doc.text(`Disponible: ${espacio.horasDisponibles}h`, 100, yPos);
                    doc.text(`Ocupado: ${espacio.horasOcupadas}h`, 150, yPos);
                    yPos += 8;
                });
            } else if (tipoReporte === 'capacidad') {
                doc.setFontSize(14);
                doc.text('Capacidad Utilizada', 20, yPos);
                yPos += 10;

                doc.setFontSize(11);
                capacidadUtilizada.forEach((dato) => {
                    doc.text(`${dato.tipo}`, 25, yPos);
                    doc.text(`Capacidad: ${dato.capacidadTotal}`, 80, yPos);
                    doc.text(`Utilizada: ${dato.capacidadUsada}`, 120, yPos);
                    doc.text(`${dato.porcentaje}%`, 160, yPos);
                    yPos += 8;
                });
            }

            // Pie de página
            doc.setFontSize(9);
            doc.text('Sistema de Planeación y Gestión de Espacios Académicos Universitarios', 20, 285);

            doc.save(`reporte-${tipoReporte}-${periodoActual}.pdf`);
        } catch (error) {
            console.error('Error al generar PDF:', error);
        }
    };

    const exportarExcel = async () => {
        try {
            // Si es horarios-programa, usar el endpoint del backend como en Centro de Horarios
            if (tipoReporte === 'horarios-programa') {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                
                // Cargar todos los horarios extendidos del backend
                const horariosResponse = await horarioService.listExtendidos();
                const todosLosHorarios = horariosResponse.horarios;
                
                // Filtrar según el filtro de programa aplicado
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

            // Si es horarios-docente, usar el endpoint del backend para docentes
            if (tipoReporte === 'horarios-docente') {
                const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
                
                try {
                    // Cargar todos los horarios extendidos del backend
                    const horariosResponse = await horarioService.listExtendidos();
                    const todosLosHorarios = horariosResponse.horarios;
                    
                    // Filtrar según el filtro de docente aplicado
                    const horariosAExportar = filtroDocente === 'Todos' 
                        ? todosLosHorarios
                        : todosLosHorarios.filter(h => h.docente_nombre === filtroDocente);
                    
                    console.log('Enviando horarios al endpoint:', horariosAExportar.length);
                    
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
                        const errorText = await response.text();
                        console.error('Error response:', errorText);
                        throw new Error(`Error al generar Excel: ${response.status}`);
                    }

                    const blob = await response.blob();
                    console.log('Blob recibido:', blob.size, 'bytes');
                    
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `horarios_docente.xlsx`;
                    document.body.appendChild(a);
                    a.click();
                    window.URL.revokeObjectURL(url);
                    document.body.removeChild(a);
                    
                    console.log('Excel descargado exitosamente');
                } catch (error) {
                    console.error('Error en exportarExcel (horarios-docente):', error);
                    throw error;
                }
                
                return;
            }

            // Para otros reportes, generar Excel localmente
            const XLSX = await import('xlsx');
            const workbook = XLSX.utils.book_new();

            if (tipoReporte === 'ocupacion') {
                const datosJornada = datosOcupacion.map(d => ({
                    'Jornada': d.jornada,
                    'Ocupación (%)': d.ocupacion,
                    'Espacios': d.espacios
                }));
                const ws1 = XLSX.utils.json_to_sheet(datosJornada);
                XLSX.utils.book_append_sheet(workbook, ws1, 'Ocupación por Jornada');

                const datosEspacios = espaciosMasUsados.map((e, i) => ({
                    'Posición': i + 1,
                    'Espacio': e.espacio,
                    'Clases por Semana': e.usos,
                    'Ocupación (%)': e.ocupacion
                }));
                const ws2 = XLSX.utils.json_to_sheet(datosEspacios);
                XLSX.utils.book_append_sheet(workbook, ws2, 'Espacios Más Usados');
            } else if (tipoReporte === 'horarios-docente') {
                const datos = horariosDocente.map(h => ({
                    'Día': h.dia,
                    'Hora': h.hora,
                    'Asignatura': h.asignatura,
                    'Grupo': h.grupo,
                    'Espacio': h.espacio
                }));
                const ws = XLSX.utils.json_to_sheet(datos);
                XLSX.utils.book_append_sheet(workbook, ws, 'Horarios Docente');
            } else if (tipoReporte === 'disponibilidad') {
                const datos = disponibilidadEspacios.map(e => ({
                    'Espacio': e.nombre,
                    'Tipo': e.tipo,
                    'Horas Disponibles': e.horasDisponibles,
                    'Horas Ocupadas': e.horasOcupadas,
                    'Porcentaje Ocupación': e.porcentajeOcupacion
                }));
                const ws = XLSX.utils.json_to_sheet(datos);
                XLSX.utils.book_append_sheet(workbook, ws, 'Disponibilidad');
            } else if (tipoReporte === 'capacidad') {
                const datos = capacidadUtilizada.map(c => ({
                    'Tipo de Espacio': c.tipo,
                    'Capacidad Total': c.capacidadTotal,
                    'Capacidad Usada': c.capacidadUsada,
                    'Porcentaje': c.porcentaje
                }));
                const ws = XLSX.utils.json_to_sheet(datos);
                XLSX.utils.book_append_sheet(workbook, ws, 'Capacidad Utilizada');
            }

            XLSX.writeFile(workbook, `reporte-${tipoReporte}-${periodoActual}.xlsx`);
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
        tipoReporte,
        setTipoReporte,
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
