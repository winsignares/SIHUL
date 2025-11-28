import { useState, useMemo } from 'react';
import type { EspacioOcupacion } from '../../models';

const PERIODO_TRABAJO = '2025-1';

const initialEspaciosOcupacion: EspacioOcupacion[] = [
    {
        id: '1',
        nombre: 'Aula 101',
        tipo: 'Aula',
        capacidad: 40,
        horasOcupadas: 38,
        horasDisponibles: 48,
        porcentajeOcupacion: 79.2,
        edificio: 'A',
        jornada: { manana: 85, tarde: 90, noche: 62 }
    },
    {
        id: '2',
        nombre: 'Laboratorio 301',
        tipo: 'Laboratorio',
        capacidad: 25,
        horasOcupadas: 44,
        horasDisponibles: 48,
        porcentajeOcupacion: 91.7,
        edificio: 'C',
        jornada: { manana: 95, tarde: 100, noche: 80 }
    },
    {
        id: '3',
        nombre: 'Auditorio Central',
        tipo: 'Auditorio',
        capacidad: 200,
        horasOcupadas: 18,
        horasDisponibles: 48,
        porcentajeOcupacion: 37.5,
        edificio: 'B',
        jornada: { manana: 45, tarde: 40, noche: 25 }
    },
    {
        id: '4',
        nombre: 'Aula 205',
        tipo: 'Aula',
        capacidad: 35,
        horasOcupadas: 42,
        horasDisponibles: 48,
        porcentajeOcupacion: 87.5,
        edificio: 'A',
        jornada: { manana: 90, tarde: 95, noche: 75 }
    },
    {
        id: '5',
        nombre: 'Sala de Juntas 1',
        tipo: 'Sala',
        capacidad: 15,
        horasOcupadas: 12,
        horasDisponibles: 48,
        porcentajeOcupacion: 25.0,
        edificio: 'D',
        jornada: { manana: 30, tarde: 25, noche: 15 }
    },
    {
        id: '6',
        nombre: 'Laboratorio 302',
        tipo: 'Laboratorio',
        capacidad: 30,
        horasOcupadas: 40,
        horasDisponibles: 48,
        porcentajeOcupacion: 83.3,
        edificio: 'C',
        jornada: { manana: 88, tarde: 90, noche: 70 }
    },
    {
        id: '7',
        nombre: 'Aula 102',
        tipo: 'Aula',
        capacidad: 40,
        horasOcupadas: 36,
        horasDisponibles: 48,
        porcentajeOcupacion: 75.0,
        edificio: 'A',
        jornada: { manana: 80, tarde: 85, noche: 55 }
    },
    {
        id: '8',
        nombre: 'Cancha Deportiva 1',
        tipo: 'Cancha',
        capacidad: 50,
        horasOcupadas: 15,
        horasDisponibles: 48,
        porcentajeOcupacion: 31.3,
        edificio: 'Zona Deportiva',
        jornada: { manana: 40, tarde: 35, noche: 15 }
    }
];

export function useOcupacionSemanal() {
    const [tipoEspacio, setTipoEspacio] = useState<string>('todos');
    const [calculando, setCalculando] = useState(false);
    const [ultimaActualizacion, setUltimaActualizacion] = useState(new Date());
    const [espaciosOcupacion] = useState<EspacioOcupacion[]>(initialEspaciosOcupacion);

    const recalcularOcupacion = () => {
        setCalculando(true);

        // Simulación de cálculo (en producción esto vendría del backend)
        setTimeout(() => {
            // Aquí se recalcularían los porcentajes basados en horarios reales

            // ocupacion recalculada exitosamente notificación
            setUltimaActualizacion(new Date());
            setCalculando(false);
        }, 1500);
    };

    const espaciosFiltrados = useMemo(() => {
        return tipoEspacio === 'todos'
            ? espaciosOcupacion
            : espaciosOcupacion.filter(e => e.tipo === tipoEspacio);
    }, [tipoEspacio, espaciosOcupacion]);

    const estadisticas = useMemo(() => {
        const promedioOcupacion = espaciosFiltrados.length > 0
            ? espaciosFiltrados.reduce((acc, e) => acc + e.porcentajeOcupacion, 0) / espaciosFiltrados.length
            : 0;
        const totalHorasOcupadas = espaciosFiltrados.reduce((acc, e) => acc + e.horasOcupadas, 0);
        const totalHorasDisponibles = espaciosFiltrados.reduce((acc, e) => acc + e.horasDisponibles, 0);
        const espaciosSobreocupados = espaciosFiltrados.filter(e => e.porcentajeOcupacion > 85).length;
        const espaciosSubutilizados = espaciosFiltrados.filter(e => e.porcentajeOcupacion < 50).length;

        return {
            promedioOcupacion,
            totalHorasOcupadas,
            totalHorasDisponibles,
            espaciosSobreocupados,
            espaciosSubutilizados
        };
    }, [espaciosFiltrados]);

    const exportarReporte = async () => {
        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF();

            doc.setFontSize(18);
            doc.text('Reporte de Ocupación Semanal', 20, 20);

            doc.setFontSize(12);
            doc.text(`Periodo: ${PERIODO_TRABAJO}`, 20, 30);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 37);
            doc.text(`Tipo de Espacio: ${tipoEspacio === 'todos' ? 'Todos' : tipoEspacio}`, 20, 44);

            doc.line(20, 48, 190, 48);

            doc.setFontSize(14);
            doc.text('Ocupación por Espacio', 20, 58);

            doc.setFontSize(10);
            let yPos = 68;
            espaciosFiltrados.forEach((espacio) => {
                if (yPos > 270) {
                    doc.addPage();
                    yPos = 20;
                }
                doc.text(`${espacio.nombre}`, 25, yPos);
                doc.text(`${espacio.porcentajeOcupacion.toFixed(1)}%`, 100, yPos);
                doc.text(`${espacio.horasOcupadas}/${espacio.horasDisponibles}h`, 150, yPos);
                yPos += 7;
            });

            doc.save(`ocupacion-semanal-${PERIODO_TRABAJO}.pdf`);
            // Reporte generado exitosamente notificación
        } catch (error) {
            console.error('Error:', error);
            // Error al generar reporte notificación
        }
    };

    const getColorPorOcupacion = (porcentaje: number) => {
        if (porcentaje >= 85) return 'text-red-600 bg-red-100 border-red-300';
        if (porcentaje >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-300';
        if (porcentaje >= 50) return 'text-green-600 bg-green-100 border-green-300';
        return 'text-slate-600 bg-slate-100 border-slate-300';
    };

    const getBarColor = (porcentaje: number) => {
        if (porcentaje >= 85) return 'bg-red-600';
        if (porcentaje >= 70) return 'bg-yellow-600';
        if (porcentaje >= 50) return 'bg-green-600';
        return 'bg-slate-400';
    };

    return {
        PERIODO_TRABAJO,
        tipoEspacio,
        setTipoEspacio,
        calculando,
        ultimaActualizacion,
        espaciosFiltrados,
        estadisticas,
        recalcularOcupacion,
        exportarReporte,
        getColorPorOcupacion,
        getBarColor
    };
}
