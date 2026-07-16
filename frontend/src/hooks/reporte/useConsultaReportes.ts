import { useState, useCallback, useEffect } from 'react';
import ExcelJS from 'exceljs';
import type { DatoOcupacionJornada, EspacioMasUsado } from '../../models';
import { toast } from 'sonner';
import { periodoActivoService } from '../../services/periodos/periodoActivoAPI';

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
    const [periodo, setPeriodo] = useState('Cargando...');
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        const cargarPeriodo = async () => {
            try {
                const periodoActivo = await periodoActivoService.getPeriodoActivo();
                setPeriodo(periodoActivo?.nombre || 'Sin periodo activo');
            } catch (error) {
                console.error('Error al cargar período activo:', error);
                setPeriodo('Sin periodo activo');
            }
        };

        cargarPeriodo();
    }, []);

    const exportarPDF = useCallback(async () => {
        if (isExporting) return;
        
        setIsExporting(true);
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
            toast.success('PDF generado exitosamente');
        } catch (error) {
            console.error('Error al generar PDF:', error);
            toast.error('Error al generar el PDF');
        } finally {
            setIsExporting(false);
        }
    }, [periodo, isExporting]);

    const exportarExcel = useCallback(async () => {
        if (isExporting) return;
        
        setIsExporting(true);
        try {
            const workbook = new ExcelJS.Workbook();

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

            const estadisticas = [
                { 'Métrica': 'Total de Clases', 'Valor': 342 },
                { 'Métrica': 'Ocupación Promedio', 'Valor': '82%' },
                { 'Métrica': 'Espacios Activos', 'Valor': 128 },
                { 'Métrica': 'Programas Activos', 'Valor': 18 }
            ];
            const ws3 = workbook.addWorksheet('Estadísticas');
            ws3.columns = Object.keys(estadisticas[0] || {}).map((key) => ({ header: key, key, width: 24 }));
            estadisticas.forEach((row) => ws3.addRow(row));

            const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
            const clasesSemanales = [68, 72, 65, 58, 45];
            const datosSemanales = diasSemana.map((dia, i) => ({
                'Día': dia,
                'Clases': clasesSemanales[i]
            }));
            const ws4 = workbook.addWorksheet('Distribución Semanal');
            ws4.columns = Object.keys(datosSemanales[0] || {}).map((key) => ({ header: key, key, width: 24 }));
            datosSemanales.forEach((row) => ws4.addRow(row));

            const buffer = await workbook.xlsx.writeBuffer();
            await descargarExcel(buffer as BlobPart, `reporte-consulta-${periodo}.xlsx`);
            toast.success('Excel generado exitosamente');
        } catch (error) {
            console.error('Error al generar Excel:', error);
            toast.error('Error al generar el Excel');
        } finally {
            setIsExporting(false);
        }
    }, [periodo, isExporting]);

    return {
        periodo,
        setPeriodo,
        datosOcupacion,
        espaciosMasUsados,
        exportarPDF,
        exportarExcel,
        isExporting
    };
}
