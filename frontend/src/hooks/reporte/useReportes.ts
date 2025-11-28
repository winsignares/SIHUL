import { useState } from 'react';
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

const PERIODO_TRABAJO = '2025-1';

const datosOcupacion: DatoOcupacionJornada[] = [
    { jornada: 'Mañana (07:00 - 12:00)', ocupacion: 85, espacios: 45, color: 'bg-blue-600' },
    { jornada: 'Tarde (14:00 - 18:00)', ocupacion: 92, espacios: 38, color: 'bg-red-600' },
    { jornada: 'Noche (18:00 - 21:00)', ocupacion: 68, espacios: 22, color: 'bg-yellow-600' }
];

const espaciosMasUsados: EspacioMasUsado[] = [
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

const disponibilidadEspacios: DisponibilidadEspacio[] = [
    { nombre: 'Aula 101', tipo: 'Aula', horasDisponibles: 12, horasOcupadas: 38, porcentajeOcupacion: 76 },
    { nombre: 'Lab 301', tipo: 'Laboratorio', horasDisponibles: 20, horasOcupadas: 30, porcentajeOcupacion: 60 },
    { nombre: 'Auditorio Central', tipo: 'Auditorio', horasDisponibles: 35, horasOcupadas: 15, porcentajeOcupacion: 30 },
    { nombre: 'Aula 205', tipo: 'Aula', horasDisponibles: 18, horasOcupadas: 32, porcentajeOcupacion: 64 },
    { nombre: 'Lab 401', tipo: 'Laboratorio', horasDisponibles: 25, horasOcupadas: 25, porcentajeOcupacion: 50 }
];

const capacidadUtilizada: CapacidadUtilizada[] = [
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
    const [filtroDocente, setFiltroDocente] = useState('todos');
    const [filtroPrograma, setFiltroPrograma] = useState('todos');

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
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            // Encabezado
            doc.setFontSize(18);
            doc.text(`Reporte: ${reportesDisponibles.find(r => r.id === tipoReporte)?.nombre || ''}`, 20, 20);

            doc.setFontSize(12);
            doc.text(`Periodo: ${PERIODO_TRABAJO}`, 20, 30);
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
            } else if (tipoReporte === 'horarios-programa') {
                doc.setFontSize(14);
                doc.text('Horarios por Programa', 20, yPos);
                yPos += 10;

                doc.setFontSize(11);
                horariosPrograma.forEach((horario) => {
                    doc.text(`${horario.grupo}`, 25, yPos);
                    doc.text(`${horario.dia} ${horario.hora}`, 60, yPos);
                    doc.text(`${horario.asignatura}`, 110, yPos);
                    doc.text(`${horario.docente}`, 150, yPos);
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

            doc.save(`reporte-${tipoReporte}-${PERIODO_TRABAJO}.pdf`);
            // Mostrar notificación: Reporte PDF descargado exitosamente
        } catch (error) {
            console.error('Error al generar PDF:', error);
            // Mostrar notificación: Error al generar el PDF
        }
    };

    const exportarExcel = async () => {
        try {
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
            } else if (tipoReporte === 'horarios-programa') {
                const datos = horariosPrograma.map(h => ({
                    'Grupo': h.grupo,
                    'Día': h.dia,
                    'Hora': h.hora,
                    'Asignatura': h.asignatura,
                    'Docente': h.docente,
                    'Espacio': h.espacio
                }));
                const ws = XLSX.utils.json_to_sheet(datos);
                XLSX.utils.book_append_sheet(workbook, ws, 'Horarios Programa');
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

            XLSX.writeFile(workbook, `reporte-${tipoReporte}-${PERIODO_TRABAJO}.xlsx`);
            // Mostrar notificación: Reporte Excel descargado exitosamente
        } catch (error) {
            console.error('Error al generar Excel:', error);
            // Mostrar notificación: Error al generar el Excel
        }
    };

    return {
        PERIODO_TRABAJO,
        tipoReporte,
        setTipoReporte,
        filtroDocente,
        setFiltroDocente,
        filtroPrograma,
        setFiltroPrograma,
        datosOcupacion,
        espaciosMasUsados,
        horariosDocente,
        horariosPrograma,
        disponibilidadEspacios,
        capacidadUtilizada,
        reportesDisponibles,
        docentes,
        programas: programasFiltrados,
        exportarPDF,
        exportarExcel
    };
}
