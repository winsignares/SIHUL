import { useState, useMemo, useEffect, useCallback } from 'react';
import { espacioPermitidoService, espacioService, espacioHorariosService } from '../../services/espacios/espaciosAPI';
import { useAuth } from '../../context/AuthContext';
import { getEspaciosFromCache, setEspaciosInCache, getCacheKey } from '../../services/cache/cacheService';
import { prestamoService } from '../../services/prestamos/prestamoAPI';
import type { PrestamoEspacio } from '../../services/prestamos/prestamoAPI';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

export interface EspacioView {
    id: string;
    nombre: string;
    tipo: string;
    capacidad: number;
    sede: string;
    edificio: string;
    estado: 'disponible' | 'ocupado' | 'mantenimiento';
    proximaClase?: string;
    ubicacion?: string;
}

export interface OcupacionView {
    espacioId: string;
    dia: string;
    horaInicio: number;
    horaFin: number;
    materia: string;
    docente?: string;
    grupo?: string;
    estado: string;
    tipo?: 'horario' | 'prestamo'; // Tipo de ocupación
    prestamo?: PrestamoEspacio; // Datos del préstamo si es tipo prestamo
}

export interface SeleccionRango {
    espacioId: string;
    dia: string;
    horaInicio: number;
    horaFin: number;
}

export interface NuevaSolicitudData {
    espacio_id: number;
    espacio_nombre: string;
    fecha: string;
    horaInicio: string;
    horaFin: string;
    diaSemana: string;
}

export function useConsultaEspacios() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('todos');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterSede, setFilterSede] = useState('todas');
    const [filterFecha, setFilterFecha] = useState<string>(''); // Filtro de fecha
    const [vistaActual, setVistaActual] = useState<'tarjetas' | 'cronograma'>('tarjetas');

    const [espacios, setEspacios] = useState<EspacioView[]>([]);
    const [horarios, setHorarios] = useState<OcupacionView[]>([]);
    const [prestamos, setPrestamos] = useState<PrestamoEspacio[]>([]); // Préstamos aprobados
    const [loading, setLoading] = useState(true);

    // Estados para selección drag-to-select (solo para supervisor)
    const [isDragging, setIsDragging] = useState(false);
    const [seleccionInicio, setSeleccionInicio] = useState<{espacioId: string, dia: string, hora: number} | null>(null);
    const [seleccionRango, setSeleccionRango] = useState<SeleccionRango | null>(null);
    const [dialogSolicitudOpen, setDialogSolicitudOpen] = useState(false);
    const [nuevaSolicitudData, setNuevaSolicitudData] = useState<NuevaSolicitudData | null>(null);

    // Estado para espacio seleccionado en vista individual
    const [espacioSeleccionado, setEspacioSeleccionado] = useState<EspacioView | null>(null);

    // Obtener usuario del contexto de autenticación
    const { user } = useAuth();

    // Verificar si es supervisor
    const esSupervisor = user?.rol?.nombre === 'supervisor_general';

    // Función para normalizar días
    const normalizarDia = (dia: string): string => {
        const diaLower = dia.toLowerCase().trim();
        const mapeo: { [key: string]: string } = {
            'lunes': 'Lunes',
            'monday': 'Lunes',
            'martes': 'Martes',
            'tuesday': 'Martes',
            'miércoles': 'Miércoles',
            'wednesday': 'Miércoles',
            'jueves': 'Jueves',
            'thursday': 'Jueves',
            'viernes': 'Viernes',
            'friday': 'Viernes',
            'sábado': 'Sábado',
            'saturday': 'Sábado',
            'domingo': 'Domingo',
            'sunday': 'Domingo'
        };
        return mapeo[diaLower] || dia;
    };

    // Función para obtener el nombre del día actual en español
    const getDiaDeSemana = (): string => {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return dias[new Date().getDay()];
    };

    // Función para calcular próxima clase y estado
    const calcularProximaClaseYEstado = (espacioId: string): { proximaClase: string; estado: 'disponible' | 'ocupado' | 'mantenimiento' } => {
        const hoy = getDiaDeSemana();
        const ahora = new Date();
        const horaActual = ahora.getHours();
        
        // Obtener todas las clases de hoy para este espacio
        const clasesHoy = horarios.filter(h => 
            h.espacioId === espacioId && h.dia === hoy
        ).sort((a, b) => a.horaInicio - b.horaInicio);

        // Si no hay clases hoy
        if (clasesHoy.length === 0) {
            return {
                proximaClase: 'Sin clases pendientes hoy',
                estado: 'disponible'
            };
        }

        // Buscar la próxima clase
        const proximaClase = clasesHoy.find(c => c.horaFin > horaActual);

        if (!proximaClase) {
            // No hay más clases hoy
            return {
                proximaClase: 'Sin clases pendientes hoy',
                estado: 'disponible'
            };
        }

        // Calcular tiempo hasta la próxima clase
        const tiempoHasta = proximaClase.horaInicio - horaActual;

        // Determinar estado basado en tiempo disponible
        let estado: 'disponible' | 'ocupado' | 'mantenimiento' = 'disponible';
        if (tiempoHasta < 1) {
            // Menos de 1 hora: no disponible
            estado = 'ocupado';
        } else if (tiempoHasta <= 2) {
            // Entre 1 y 2 horas: ocupado
            estado = 'ocupado';
        } else {
            // Más de 2 horas: disponible
            estado = 'disponible';
        }

        return {
            proximaClase: `${proximaClase.materia} - ${proximaClase.horaInicio}:00`,
            estado
        };
    };

    // Cargar espacios y su estado
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Obtener clave de caché según el usuario
                const cacheKey = getCacheKey(user);
                
                // Intentar obtener del caché primero
                const cachedData = getEspaciosFromCache(cacheKey);
                if (cachedData) {
                    setEspacios(cachedData.espacios);
                    setHorarios(cachedData.horarios);
                    setLoading(false);
                    return;
                }

                // Usar los nuevos endpoints bulk para obtener espacios con horarios
                let espaciosConHorarios;
                
                // Supervisor general: solo espacios permitidos
                if (user?.id && String(user.rol) === 'supervisor_general') {
                    const response = await espacioHorariosService.getSupervisorHorarios(user.id);
                    espaciosConHorarios = response.espacios;
                }
                // Acceso público o cualquier otro rol: todos los espacios
                else {
                    const response = await espacioHorariosService.getAllWithHorarios();
                    espaciosConHorarios = response.espacios;
                }

                // Procesar espacios y horarios
                const allHorarios: OcupacionView[] = [];
                const espaciosView: EspacioView[] = [];

                espaciosConHorarios.forEach(espacio => {
                    // Agregar horarios
                    espacio.horarios.forEach(h => {
                        allHorarios.push({
                            espacioId: espacio.id!.toString(),
                            dia: normalizarDia(h.dia),
                            horaInicio: h.hora_inicio,
                            horaFin: h.hora_fin,
                            materia: h.materia,
                            docente: h.docente,
                            grupo: h.grupo,
                            estado: 'ocupado'
                        });
                    });

                    // Calcular estado basado en horarios
                    const { proximaClase, estado } = calcularProximaClaseYEstadoPrevio(
                        espacio.id!.toString(),
                        allHorarios
                    );

                    // Crear vista de espacio
                    espaciosView.push({
                        id: espacio.id!.toString(),
                        nombre: espacio.nombre,
                        tipo: espacio.tipo || 'Sin Tipo',
                        capacidad: espacio.capacidad,
                        sede: espacio.sede || 'Sede Principal',
                        edificio: espacio.ubicacion || 'Sin Ubicación',
                        estado: estado,
                        proximaClase: proximaClase,
                        ubicacion: espacio.ubicacion
                    });
                });

                setEspacios(espaciosView);
                setHorarios(allHorarios);

                // Guardar en caché
                setEspaciosInCache(cacheKey, espaciosView, allHorarios);

            } catch (error) {
                console.error("Error loading spaces", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]); // Recargar si cambia el usuario

    // Cargar préstamos aprobados cuando cambia la fecha
    useEffect(() => {
        const loadPrestamos = async () => {
            if (!filterFecha) {
                setPrestamos([]);
                return;
            }

            try {
                const { prestamos: todosLosPrestamos } = await prestamoService.listarPrestamos();
                
                // Filtrar solo préstamos aprobados de la fecha seleccionada
                const prestamosAprobadosFecha = todosLosPrestamos.filter(p => 
                    p.estado === 'Aprobado' && p.fecha === filterFecha
                );
                
                setPrestamos(prestamosAprobadosFecha);
            } catch (error) {
                console.error("Error loading prestamos:", error);
                setPrestamos([]);
            }
        };

        loadPrestamos();
    }, [filterFecha]);

    // Función auxiliar para convertir fecha a día de la semana
    const getFechaDiaSemana = (fecha: string): string => {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const date = new Date(fecha + 'T00:00:00'); // Agregar tiempo para evitar problemas de zona horaria
        return dias[date.getDay()];
    };

    // Función auxiliar para convertir hora HH:MM:SS a número
    const horaANumero = (hora: string): number => {
        const partes = hora.split(':');
        return parseInt(partes[0]);
    };

    // Función auxiliar para calcular próxima clase durante la carga inicial
    const calcularProximaClaseYEstadoPrevio = (
        espacioId: string, 
        todosHorarios: OcupacionView[]
    ): { proximaClase: string; estado: 'disponible' | 'ocupado' | 'mantenimiento' } => {
        const hoy = getDiaDeSemana();
        const ahora = new Date();
        const horaActual = ahora.getHours();
        
        const clasesHoy = todosHorarios.filter(h => 
            h.espacioId === espacioId && h.dia === hoy
        ).sort((a, b) => a.horaInicio - b.horaInicio);

        if (clasesHoy.length === 0) {
            return {
                proximaClase: 'Sin clases pendientes hoy',
                estado: 'disponible'
            };
        }

        const proximaClase = clasesHoy.find(c => c.horaFin > horaActual);

        if (!proximaClase) {
            return {
                proximaClase: 'Sin clases pendientes hoy',
                estado: 'disponible'
            };
        }

        const tiempoHasta = proximaClase.horaInicio - horaActual;
        let estado: 'disponible' | 'ocupado' | 'mantenimiento' = 'disponible';
        
        if (tiempoHasta < 1) {
            estado = 'ocupado';
        } else if (tiempoHasta <= 2) {
            estado = 'ocupado';
        } else {
            estado = 'disponible';
        }

        return {
            proximaClase: `${proximaClase.materia} - ${proximaClase.horaInicio}:00`,
            estado
        };
    };

    const tiposEspacio = useMemo(() => [...new Set(espacios.map(e => e.tipo))], [espacios]);
    const sedes = useMemo(() => [...new Set(espacios.map(e => e.sede))], [espacios]);
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    // Horas de 6am a 10pm (22:00)
    const horas = Array.from({ length: 17 }, (_, i) => i + 6);

    const filteredEspacios = useMemo(() => {
        return espacios.filter(e => {
            const matchesSearch = e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.edificio && e.edificio.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesTipo = filterTipo === 'todos' || e.tipo === filterTipo;
            const matchesEstado = filterEstado === 'todos' || e.estado === filterEstado;
            const matchesSede = filterSede === 'todas' || e.sede === filterSede;
            return matchesSearch && matchesTipo && matchesEstado && matchesSede;
        });
    }, [espacios, searchTerm, filterTipo, filterEstado, filterSede]);

    const estadisticas = useMemo(() => ({
        total: espacios.length,
        disponibles: espacios.filter(e => e.estado === 'disponible').length,
        ocupados: espacios.filter(e => e.estado === 'ocupado').length,
        mantenimiento: espacios.filter(e => e.estado === 'mantenimiento').length
    }), [espacios]);

    // Combinar horarios con préstamos si hay fecha seleccionada
    const horariosConPrestamos = useMemo(() => {
        if (!filterFecha || prestamos.length === 0) {
            return horarios;
        }

        const diaSemana = getFechaDiaSemana(filterFecha);
        const prestamosComoOcupacion: OcupacionView[] = prestamos.map(p => ({
            espacioId: p.espacio_id.toString(),
            dia: diaSemana,
            horaInicio: horaANumero(p.hora_inicio),
            horaFin: horaANumero(p.hora_fin),
            materia: p.tipo_actividad_nombre || 'Préstamo',
            docente: p.usuario_nombre || p.solicitante_publico_nombre,
            grupo: p.motivo,
            estado: 'prestamo',
            tipo: 'prestamo',
            prestamo: p
        }));

        // Combinar horarios y préstamos
        return [...horarios, ...prestamosComoOcupacion];
    }, [horarios, prestamos, filterFecha]);

    const getOcupacionPorHora = (espacioId: string, dia: string, hora: number) => {
        return horariosConPrestamos.find(h =>
            h.espacioId === espacioId &&
            h.dia === dia &&
            hora >= h.horaInicio &&
            hora < h.horaFin
        );
    };

    const getColorEstado = (estado: 'ocupado' | 'mantenimiento' | 'disponible') => {
        switch (estado) {
            case 'ocupado':
                return 'bg-blue-500 hover:bg-blue-600';
            case 'mantenimiento':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'disponible':
                return 'bg-green-500 hover:bg-green-600';
            default:
                return 'bg-slate-200';
        }
    };

    const exportarCronogramaPDF = (espaciosToExport?: EspacioView[]) => {
        const doc = new jsPDF('l', 'mm', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        const diasNombres = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const horasIntervalos = Array.from({ length: 15 }, (_, i) => i + 6); // 6:00 a 20:00
        
        const espaciosAExportar = espaciosToExport || filteredEspacios;
        
        espaciosAExportar.forEach((espacio, espacioIndex) => {
            if (espacioIndex > 0) doc.addPage();
            
            // Título del espacio
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`${espacio.nombre} - ${espacio.tipo}`, pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Capacidad: ${espacio.capacidad} | Sede: ${espacio.sede} | Edificio: ${espacio.edificio}`, pageWidth / 2, 22, { align: 'center' });
            
            // Construir cuadrícula
            const cellWidth = (pageWidth - 30) / 7; // 1 columna hora + 6 días
            const cellHeight = (pageHeight - 40) / (horasIntervalos.length + 1);
            const startX = 15;
            const startY = 30;
            
            // Dibujar encabezado (días)
            doc.setFillColor(139, 0, 0);
            doc.rect(startX, startY, cellWidth, cellHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Hora', startX + cellWidth / 2, startY + cellHeight / 2 + 2, { align: 'center' });
            
            diasNombres.forEach((dia, idx) => {
                doc.setFillColor(139, 0, 0);
                doc.rect(startX + cellWidth * (idx + 1), startY, cellWidth, cellHeight, 'F');
                doc.setTextColor(255, 255, 255);
                doc.text(dia, startX + cellWidth * (idx + 1) + cellWidth / 2, startY + cellHeight / 2 + 2, { align: 'center' });
            });
            
            // Dibujar filas de horas
            horasIntervalos.forEach((hora, horaIdx) => {
                const y = startY + cellHeight * (horaIdx + 1);
                
                // Columna de hora
                doc.setFillColor(243, 244, 246);
                doc.rect(startX, y, cellWidth, cellHeight, 'FD');
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.text(`${hora}:00-${hora + 1}:00`, startX + cellWidth / 2, y + cellHeight / 2 + 1, { align: 'center' });
                
                // Celdas de días
                diasNombres.forEach((dia, diaIdx) => {
                    const x = startX + cellWidth * (diaIdx + 1);
                    
                    // Buscar horario para esta hora y día
                    const horarioEnCelda = horarios.find(h =>
                        h.espacioId === espacio.id &&
                        h.dia === dia &&
                        hora >= h.horaInicio &&
                        hora < h.horaFin
                    );
                    
                    if (horarioEnCelda) {
                        // Celda ocupada
                        doc.setFillColor(219, 234, 254);
                        doc.rect(x, y, cellWidth, cellHeight, 'FD');
                        doc.setTextColor(0, 0, 0);
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(6);
                        
                        const materia = horarioEnCelda.materia || '';
                        const docente = horarioEnCelda.docente ? horarioEnCelda.docente.toUpperCase() : '';
                        const grupo = horarioEnCelda.grupo || '';
                        
                        let textY = y + 4;
                        if (materia) {
                            doc.text(materia, x + cellWidth / 2, textY, { align: 'center', maxWidth: cellWidth - 2 });
                            textY += 3;
                        }
                        if (docente) {
                            doc.text(docente, x + cellWidth / 2, textY, { align: 'center', maxWidth: cellWidth - 2 });
                            textY += 3;
                        }
                        if (grupo) {
                            doc.text(grupo, x + cellWidth / 2, textY, { align: 'center', maxWidth: cellWidth - 2 });
                        }
                    } else {
                        // Celda vacía
                        doc.rect(x, y, cellWidth, cellHeight, 'D');
                    }
                });
            });
        });
        
        const nombreArchivo = `cronograma_espacios_${new Date().getTime()}.pdf`;
        doc.save(nombreArchivo);
    };

    const exportarCronogramaExcel = (espaciosToExport?: EspacioView[]) => {
        const wb = XLSX.utils.book_new();
        
        const diasNombres = ['Hora', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const horasIntervalos = Array.from({ length: 15 }, (_, i) => `${i + 6}:00-${i + 7}:00`); // 6:00 a 20:00
        
        const espaciosAExportar = espaciosToExport || filteredEspacios;
        
        espaciosAExportar.forEach((espacio, espacioIdx) => {
            // Crear matriz de datos para este espacio
            const data: any[][] = [];
            
            // Encabezado con días
            data.push(diasNombres);
            
            // Filas de horas
            horasIntervalos.forEach((intervalo, horaIdx) => {
                const hora = horaIdx + 6;
                const row = [intervalo];
                
                // Para cada día
                diasNombres.slice(1).forEach(dia => {
                    // Buscar horario para esta hora y día
                    const horarioEnCelda = horarios.find(h =>
                        h.espacioId === espacio.id &&
                        h.dia === dia &&
                        hora >= h.horaInicio &&
                        hora < h.horaFin
                    );
                    
                    if (horarioEnCelda) {
                        const materia = horarioEnCelda.materia || '';
                        const docente = horarioEnCelda.docente ? horarioEnCelda.docente.toUpperCase() : '';
                        const grupo = horarioEnCelda.grupo || '';
                        
                        let cellText = materia;
                        if (docente) cellText += ` / ${docente}`;
                        if (grupo) cellText += `\n${grupo}`;
                        
                        row.push(cellText);
                    } else {
                        row.push('');
                    }
                });
                
                data.push(row);
            });
            
            // Crear hoja
            const ws = XLSX.utils.aoa_to_sheet(data);
            
            // Aplicar estilos y anchos
            ws['!cols'] = [
                { wch: 14 }, // Columna Hora
                { wch: 25 }, // Lunes
                { wch: 25 }, // Martes
                { wch: 25 }, // Miércoles
                { wch: 25 }, // Jueves
                { wch: 25 }, // Viernes
                { wch: 25 }  // Sábado
            ];
            
            // Ajustar alto de filas
            const rowHeights = Array(data.length).fill({ hpt: 60 });
            rowHeights[0] = { hpt: 30 }; // Header más pequeño
            ws['!rows'] = rowHeights;
            
            // Nombre de hoja (máximo 31 caracteres)
            const sheetName = `${espacio.nombre} - ${espacio.tipo}`.substring(0, 31);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        });
        
        // Guardar archivo
        const nombreArchivo = `cronograma_espacios_${new Date().getTime()}.xlsx`;
        XLSX.writeFile(wb, nombreArchivo);
    };

    // Funciones para drag-to-select (solo supervisor)
    const iniciarSeleccion = useCallback((espacioId: string, dia: string, hora: number) => {
        if (!esSupervisor) return;
        
        const ocupado = getOcupacionPorHora(espacioId, dia, hora);
        if (ocupado) return; // No permitir seleccionar horarios ocupados

        setIsDragging(true);
        setSeleccionInicio({ espacioId, dia, hora });
        setSeleccionRango({ espacioId, dia, horaInicio: hora, horaFin: hora + 1 });
    }, [esSupervisor]);

    const actualizarSeleccion = useCallback((espacioId: string, dia: string, hora: number) => {
        if (!isDragging || !seleccionInicio) return;
        
        // Solo permitir selección en el mismo espacio y día
        if (espacioId !== seleccionInicio.espacioId || dia !== seleccionInicio.dia) return;

        const horaInicio = Math.min(seleccionInicio.hora, hora);
        const horaFin = Math.max(seleccionInicio.hora, hora) + 1;

        setSeleccionRango({ espacioId, dia, horaInicio, horaFin });
    }, [isDragging, seleccionInicio]);

    const finalizarSeleccion = useCallback(() => {
        if (!isDragging || !seleccionRango) {
            setIsDragging(false);
            setSeleccionInicio(null);
            setSeleccionRango(null);
            return;
        }

        // Preparar datos para la nueva solicitud
        const espacio = espacios.find(e => e.id === seleccionRango.espacioId);
        if (espacio) {
            // Calcular fecha del próximo día seleccionado
            const diasMap: { [key: string]: number } = {
                'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
            };
            const hoy = new Date();
            const diaSemana = diasMap[seleccionRango.dia] || 1;
            const diasHasta = (diaSemana - hoy.getDay() + 7) % 7;
            const fecha = new Date(hoy);
            fecha.setDate(hoy.getDate() + (diasHasta === 0 ? 7 : diasHasta));

            setNuevaSolicitudData({
                espacio_id: parseInt(espacio.id),
                espacio_nombre: espacio.nombre,
                fecha: fecha.toISOString().split('T')[0],
                horaInicio: `${seleccionRango.horaInicio.toString().padStart(2, '0')}:00`,
                horaFin: `${seleccionRango.horaFin.toString().padStart(2, '0')}:00`,
                diaSemana: seleccionRango.dia
            });
            setDialogSolicitudOpen(true);
        }

        setIsDragging(false);
        setSeleccionInicio(null);
        setSeleccionRango(null);
    }, [isDragging, seleccionRango, espacios]);

    const cancelarSeleccion = useCallback(() => {
        setIsDragging(false);
        setSeleccionInicio(null);
        setSeleccionRango(null);
    }, []);

    const limpiarFiltros = useCallback(() => {
        setSearchTerm('');
        setFilterTipo('todos');
        setFilterEstado('todos');
        setFilterSede('todas');
        setFilterFecha('');
    }, []);

    const verCronogramaIndividual = useCallback((espacio: EspacioView) => {
        setEspacioSeleccionado(espacio);
        setVistaActual('cronograma');
    }, []);

    const volverALista = useCallback(() => {
        setEspacioSeleccionado(null);
        setVistaActual('tarjetas');
    }, []);

    return {
        searchTerm,
        setSearchTerm,
        filterTipo,
        setFilterTipo,
        filterEstado,
        setFilterEstado,
        filterSede,
        setFilterSede,
        filterFecha,
        setFilterFecha,
        vistaActual,
        setVistaActual,
        tiposEspacio,
        sedes,
        diasSemana,
        horas,
        filteredEspacios,
        estadisticas,
        getOcupacionPorHora,
        getColorEstado,
        loading,
        horarios: horariosConPrestamos,
        prestamos,
        calcularProximaClaseYEstado,
        exportarCronogramaPDF,
        exportarCronogramaExcel,
        // Drag-to-select (supervisor)
        isDragging,
        seleccionRango,
        iniciarSeleccion,
        actualizarSeleccion,
        finalizarSeleccion,
        cancelarSeleccion,
        esSupervisor,
        // Modal solicitud
        dialogSolicitudOpen,
        setDialogSolicitudOpen,
        nuevaSolicitudData,
        setNuevaSolicitudData,
        // Vista individual
        espacioSeleccionado,
        verCronogramaIndividual,
        volverALista,
        // Filtros
        limpiarFiltros
    };
}
