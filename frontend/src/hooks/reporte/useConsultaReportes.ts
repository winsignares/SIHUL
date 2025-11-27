import { useState } from 'react';
import { DatoOcupacionJornada, EspacioMasUsado } from '../../models';

const datosOcupacion: DatoOcupacionJornada[] = [
    { jornada: 'Mañana (07:00 - 12:00)', ocupacion: 85, espacios: 45, color: 'bg-blue-600' },
    { jornada: 'Tarde (14:00 - 18:00)', ocupacion: 92, espacios: 38, color: 'bg-yellow-600' },
    { jornada: 'Noche (18:00 - 21:00)', ocupacion: 68, espacios: 22, color: 'bg-red-600' }
];

const espaciosMasUsados: EspacioMasUsado[] = [
    { espacio: 'Aula 101', usos: 28, ocupacion: 95 },
    { espacio: 'Laboratorio 301', usos: 24, ocupacion: 88 },
    { espacio: 'Aula 205', usos: 22, ocupacion: 82 },
    { espacio: 'Auditorio Central', usos: 18, ocupacion: 75 }
];

export function useConsultaReportes() {
    const [periodo, setPeriodo] = useState('2025-1');

    const exportarPDF = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Reporte de Ocupación de Espacios', 20, 20);

            doc.setFontSize(12);
            doc.text(`Periodo: ${periodo}`, 20, 30);
            doc.text(`Fecha de generación: ${new Date().toLocaleDateString()}`, 20, 37);

            doc.line(20, 42, 190, 42);

            doc.setFontSize(14);
            doc.text('Ocupación por Jornada', 20, 52);

            doc.setFontSize(11);
            let yPos = 62;
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

            yPos += 10;
            doc.setFontSize(14);
            doc.text('Estadísticas Generales', 20, yPos);
            yPos += 10;

            doc.setFontSize(11);
            doc.text('Total de Clases: 342', 25, yPos);
            yPos += 7;
            doc.text('Ocupación Promedio: 82% (Óptimo)', 25, yPos);
            yPos += 7;
            doc.text('Espacios Activos: 128', 25, yPos);
            yPos += 7;
            doc.text('Programas Activos: 18', 25, yPos);

            doc.setFontSize(9);
            doc.text('Sistema de Planeación y Gestión de Espacios Académicos', 20, 285);

            doc.save(`reporte-consulta-${periodo}.pdf`);
            // pdf generado exitosamente notificación
        } catch (error) {
            console.error('Error al generar PDF:', error);
            // error al generar pdf notificación
        }
    };

    const exportarExcel = async () => {
        try {
            const XLSX = await import('xlsx');

            const workbook = XLSX.utils.book_new();

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

            const estadisticas = [
                { 'Métrica': 'Total de Clases', 'Valor': 342 },
                { 'Métrica': 'Ocupación Promedio', 'Valor': '82%' },
                { 'Métrica': 'Espacios Activos', 'Valor': 128 },
                { 'Métrica': 'Programas Activos', 'Valor': 18 }
            ];
            const ws3 = XLSX.utils.json_to_sheet(estadisticas);
            XLSX.utils.book_append_sheet(workbook, ws3, 'Estadísticas');

            const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            const clasesSemanales = [68, 72, 65, 58, 45];
            const datosSemanales = diasSemana.map((dia, i) => ({
                'Día': dia,
                'Clases': clasesSemanales[i]
            }));
            const ws4 = XLSX.utils.json_to_sheet(datosSemanales);
            XLSX.utils.book_append_sheet(workbook, ws4, 'Distribución Semanal');

            XLSX.writeFile(workbook, `reporte-consulta-${periodo}.xlsx`);
            // reporte excel generado exitosamente notificación
        } catch (error) {
            console.error('Error al generar Excel:', error);
            // error al generar excel notificación
        }
    };

    return {
        periodo,
        setPeriodo,
        datosOcupacion,
        espaciosMasUsados,
        exportarPDF,
        exportarExcel
    };
}
