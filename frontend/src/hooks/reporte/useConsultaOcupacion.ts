import { useState, useMemo, useEffect } from 'react';
import type { EspacioOcupacion } from '../../models';
import { sedeService, type Sede } from '../../services/sedes/sedeAPI';
import { espacioService } from '../../services/espacios/espaciosAPI';

const espaciosOcupacion: EspacioOcupacion[] = [
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
    }
];

export function useConsultaOcupacion() {
    const [periodo, setPeriodo] = useState('2025-1');
    const [tipoEspacio, setTipoEspacio] = useState<string>('todos');
    const [sedeId, setSedeId] = useState<string>('todas');
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [espaciosReales, setEspaciosReales] = useState<EspacioOcupacion[]>([]);
    const [cargando, setCargando] = useState(false);

    // Cargar sedes al montar el componente
    useEffect(() => {
        const cargarSedes = async () => {
            try {
                const response = await sedeService.listarSedes();
                setSedes(response.sedes);
            } catch (error) {
                console.error('Error al cargar sedes:', error);
            }
        };
        cargarSedes();
    }, []);

    // Cargar espacios cuando cambia la sede
    useEffect(() => {
        const cargarEspacios = async () => {
            setCargando(true);
            try {
                const response = await espacioService.list();
                // Filtrar por sede si se seleccionó una específica
                const espaciosFiltradosPorSede = sedeId === 'todas'
                    ? response.espacios
                    : response.espacios.filter(e => e.sede_id === parseInt(sedeId));

                // Convertir a formato EspacioOcupacion (datos simulados por ahora)
                const espaciosConOcupacion: EspacioOcupacion[] = espaciosFiltradosPorSede.map(espacio => ({
                    id: espacio.id?.toString() || '0',
                    nombre: espacio.nombre,
                    tipo: espacio.tipo_espacio?.nombre || 'Desconocido',
                    capacidad: espacio.capacidad,
                    // Por ahora usamos datos simulados para ocupación
                    horasOcupadas: Math.floor(Math.random() * 40) + 10,
                    horasDisponibles: 48,
                    porcentajeOcupacion: 0, // Se calculará después
                    edificio: espacio.ubicacion || 'N/A',
                    jornada: {
                        manana: Math.floor(Math.random() * 100),
                        tarde: Math.floor(Math.random() * 100),
                        noche: Math.floor(Math.random() * 100)
                    }
                }));

                // Calcular porcentaje de ocupación
                espaciosConOcupacion.forEach(e => {
                    e.porcentajeOcupacion = (e.horasOcupadas / e.horasDisponibles) * 100;
                });

                setEspaciosReales(espaciosConOcupacion);
            } catch (error) {
                console.error('Error al cargar espacios:', error);
                // Si falla, usar datos de muestra
                setEspaciosReales(espaciosOcupacion);
            } finally {
                setCargando(false);
            }
        };
        cargarEspacios();
    }, [sedeId]);

    const espaciosFiltrados = useMemo(() => {
        const espaciosParaFiltrar = espaciosReales.length > 0 ? espaciosReales : espaciosOcupacion;
        return tipoEspacio === 'todos'
            ? espaciosParaFiltrar
            : espaciosParaFiltrar.filter(e => e.tipo === tipoEspacio);
    }, [tipoEspacio, espaciosReales]);

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
            doc.text(`Periodo: ${periodo}`, 20, 30);
            doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 20, 37);

            doc.line(20, 42, 190, 42);

            doc.setFontSize(14);
            doc.text('Ocupación por Espacio', 20, 52);

            doc.setFontSize(10);
            let yPos = 62;
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

            doc.save(`ocupacion-semanal-${periodo}.pdf`);
            // Reporte generado exitosamente notificación
        } catch (error) {
            console.error('Error:', error);
            // Error al generar reporte notificación
        }
    };

    const getColorPorOcupacion = (porcentaje: number) => {
        if (porcentaje >= 85) return 'text-blue-600 bg-blue-100 border-blue-300 dark:text-blue-400 dark:bg-blue-950 dark:border-blue-700';
        if (porcentaje >= 70) return 'text-yellow-600 bg-yellow-100 border-yellow-300 dark:text-yellow-400 dark:bg-yellow-950 dark:border-yellow-700';
        if (porcentaje >= 50) return 'text-emerald-600 bg-emerald-100 border-emerald-300 dark:text-emerald-400 dark:bg-emerald-950 dark:border-emerald-700';
        return 'text-slate-600 bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700';
    };

    const getBarColor = (porcentaje: number) => {
        if (porcentaje >= 85) return 'bg-blue-600';
        if (porcentaje >= 70) return 'bg-yellow-600';
        if (porcentaje >= 50) return 'bg-emerald-600';
        return 'bg-slate-400';
    };

    return {
        periodo,
        setPeriodo,
        tipoEspacio,
        setTipoEspacio,
        sedeId,
        setSedeId,
        sedes,
        espaciosFiltrados,
        estadisticas,
        exportarReporte,
        getColorPorOcupacion,
        getBarColor,
        cargando
    };
}
