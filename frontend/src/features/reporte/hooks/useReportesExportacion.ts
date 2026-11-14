import ExcelJS from 'exceljs';
import type { DatoOcupacionJornada, EspacioMasUsado, DisponibilidadEspacio, CapacidadUtilizada } from '../../../models';
import { reporteOcupacionService, type EstadoHorarioReporte } from '../services/reporteOcupacionAPI';
import { disponibilidadService } from '../services/disponibilidadAPI';
import { capacidadService } from '../services/capacidadAPI';
import { horarioService } from '../../horarios/services/horariosAPI';
import { descargarBlob } from '../../../components/ui/descargas';
import { horariosDocente, reportesDisponibles } from './reportesConstantes';

const descargarExcel = async (buffer: BlobPart, fileName: string) => {
    const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = fileName;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => URL.revokeObjectURL(url), 5000);
};

/** Exportación de los reportes a PDF y a Excel. */
export function useReportesExportacion({
    tipoReporte, estadoReporte, filtroDocente, filtroPrograma, periodoActual, datosOcupacion,
    espaciosMasUsados, disponibilidadEspacios, capacidadUtilizada, cargarHorariosExtendidosReporte,
}: {
    tipoReporte: string;
    estadoReporte: EstadoHorarioReporte;
    filtroDocente: string;
    filtroPrograma: string;
    periodoActual: string;
    datosOcupacion: DatoOcupacionJornada[];
    espaciosMasUsados: EspacioMasUsado[];
    disponibilidadEspacios: DisponibilidadEspacio[];
    capacidadUtilizada: CapacidadUtilizada[];
    cargarHorariosExtendidosReporte: () => Promise<Awaited<ReturnType<typeof horarioService.listExtendidos>>['horarios']>;
}) {
    const exportarPDF = async () => {
        try {
            // Reporte de ocupación (jornadas + espacios más usados) con diseño del backend
            if (tipoReporte === 'ocupacion') {

                const blob = await reporteOcupacionService.descargarPdf(estadoReporte);
                descargarBlob(blob, `reporte-ocupacion-${periodoActual}.pdf`);

                return;
            }

            // Reporte de disponibilidad (estilo backend)
            if (tipoReporte === 'disponibilidad') {

                const blob = await disponibilidadService.descargarPdf(estadoReporte);
                descargarBlob(blob, `reporte-disponibilidad-${periodoActual}.pdf`);

                return;
            }

            // Reporte de capacidad (estilo backend)
            if (tipoReporte === 'capacidad') {

                const blob = await capacidadService.descargarPdf(estadoReporte);
                descargarBlob(blob, `reporte-capacidad-${periodoActual}.pdf`);

                return;
            }

            // Si es horarios-programa, usar el endpoint del backend como en Centro de Horarios
            if (tipoReporte === 'horarios-programa') {
                
                // Cargar todos los horarios extendidos del backend
                const todosLosHorarios = await cargarHorariosExtendidosReporte();
                
                // Filtrar según el filtro de programa aplicado
                const horariosAExportar = filtroPrograma === 'Todos' 
                    ? todosLosHorarios
                    : todosLosHorarios.filter(h => h.programa_nombre.toLowerCase() === filtroPrograma.toLowerCase());
                
                const blob = await horarioService.exportarPdfPrograma(horariosAExportar, estadoReporte);
                descargarBlob(blob, `horarios_programa.pdf`);
                
                return;
            }

            // Si es horarios-docente, usar el endpoint del backend para docentes
            if (tipoReporte === 'horarios-docente') {
                
                // Cargar todos los horarios extendidos del backend
                const todosLosHorarios = await cargarHorariosExtendidosReporte();
                
                // Filtrar según el filtro de docente aplicado
                const horariosAExportar = filtroDocente === 'Todos' 
                    ? todosLosHorarios
                    : todosLosHorarios.filter(h => h.docente_nombre === filtroDocente);
                
                const blob = await horarioService.exportarPdfDocente(horariosAExportar, estadoReporte);
                descargarBlob(blob, `horarios_docente.pdf`);
                
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
                
                // Cargar todos los horarios extendidos del backend
                const todosLosHorarios = await cargarHorariosExtendidosReporte();
                
                // Filtrar según el filtro de programa aplicado
                const horariosAExportar = filtroPrograma === 'Todos' 
                    ? todosLosHorarios
                    : todosLosHorarios.filter(h => h.programa_nombre.toLowerCase() === filtroPrograma.toLowerCase());
                
                const blob = await horarioService.exportarExcelPrograma(horariosAExportar, estadoReporte);
                descargarBlob(blob, `horarios_programa.xlsx`);
                
                return;
            }

            // Si es horarios-docente, usar el endpoint del backend para docentes
            if (tipoReporte === 'horarios-docente') {
                
                try {
                    // Cargar todos los horarios extendidos del backend
                    const todosLosHorarios = await cargarHorariosExtendidosReporte();
                    
                    // Filtrar según el filtro de docente aplicado
                    const horariosAExportar = filtroDocente === 'Todos' 
                        ? todosLosHorarios
                        : todosLosHorarios.filter(h => h.docente_nombre === filtroDocente);
                    
                    console.log('Enviando horarios al endpoint:', horariosAExportar.length);
                    
                    const blob = await horarioService.exportarExcelDocente(horariosAExportar, estadoReporte);
                    console.log('Blob recibido:', blob.size, 'bytes');
                    
                    descargarBlob(blob, `horarios_docente.xlsx`);
                    
                    console.log('Excel descargado exitosamente');
                } catch (error) {
                    console.error('Error en exportarExcel (horarios-docente):', error);
                    throw error;
                }
                
                return;
            }

            // Para otros reportes, generar Excel localmente
            const workbook = new ExcelJS.Workbook();

            if (tipoReporte === 'ocupacion') {
                const datosJornada = datosOcupacion.map(d => ({
                    'Jornada': d.jornada,
                    'Ocupación (%)': d.ocupacion,
                    'Espacios': d.espacios
                }));
                const ws1 = workbook.addWorksheet('Ocupación por Jornada');
                ws1.columns = Object.keys(datosJornada[0] || {}).map((key) => ({ header: key, key, width: 24 }));
                datosJornada.forEach((row) => ws1.addRow(row));

                const datosEspacios = espaciosMasUsados.map((e, i) => ({
                    'Posición': i + 1,
                    'Espacio': e.espacio,
                    'Clases por Semana': e.usos,
                    'Ocupación (%)': e.ocupacion
                }));
                const ws2 = workbook.addWorksheet('Espacios Más Usados');
                ws2.columns = Object.keys(datosEspacios[0] || {}).map((key) => ({ header: key, key, width: 24 }));
                datosEspacios.forEach((row) => ws2.addRow(row));
            } else if (tipoReporte === 'horarios-docente') {
                const datos = horariosDocente.map(h => ({
                    'Día': h.dia,
                    'Hora': h.hora,
                    'Asignatura': h.asignatura,
                    'Grupo': h.grupo,
                    'Espacio': h.espacio
                }));
                const ws = workbook.addWorksheet('Horarios Docente');
                ws.columns = Object.keys(datos[0] || {}).map((key) => ({ header: key, key, width: 24 }));
                datos.forEach((row) => ws.addRow(row));
            } else if (tipoReporte === 'disponibilidad') {
                const datos = disponibilidadEspacios.map(e => ({
                    'Espacio': e.nombre,
                    'Tipo': e.tipo,
                    'Horas Disponibles': e.horasDisponibles,
                    'Horas Ocupadas': e.horasOcupadas,
                    'Porcentaje Ocupación': e.porcentajeOcupacion
                }));
                const ws = workbook.addWorksheet('Disponibilidad');
                ws.columns = Object.keys(datos[0] || {}).map((key) => ({ header: key, key, width: 24 }));
                datos.forEach((row) => ws.addRow(row));
            } else if (tipoReporte === 'capacidad') {
                const datos = capacidadUtilizada.map(c => ({
                    'Tipo de Espacio': c.tipo,
                    'Capacidad Total': c.capacidadTotal,
                    'Capacidad Usada': c.capacidadUsada,
                    'Porcentaje': c.porcentaje
                }));
                const ws = workbook.addWorksheet('Capacidad Utilizada');
                ws.columns = Object.keys(datos[0] || {}).map((key) => ({ header: key, key, width: 24 }));
                datos.forEach((row) => ws.addRow(row));
            }

            const buffer = await workbook.xlsx.writeBuffer();
            await descargarExcel(buffer as BlobPart, `reporte-${tipoReporte}-${periodoActual}.xlsx`);
        } catch (error) {
            console.error('Error al generar Excel:', error);
        }
    };


    return { exportarPDF, exportarExcel };
}
