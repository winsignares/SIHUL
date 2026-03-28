import { useState, useMemo, useEffect, useCallback } from 'react';
import { espacioService, espacioHorariosService } from '../../services/espacios/espaciosAPI';
import { useAuth } from '../../context/AuthContext';
import { prestamoService } from '../../services/prestamos/prestamoAPI';
import { prestamosPublicAPI } from '../../services/prestamos/prestamosPublicAPI';
import type { PrestamoEspacio } from '../../services/prestamos/prestamoAPI';
import { getPageNumbers, getPageSlice, getTotalPages, normalizePage, PAGE_SIZE_DEFAULT } from '../gestionAcademica/paginacion';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const CONSULTA_ESPACIOS_CACHE_KEY = 'espacios-consulta-espacios';

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

export interface MensajeFiltroFecha {
    tipo: 'error' | 'info';
    texto: string;
}

export interface EncabezadoDiaCronograma {
    dia: string;
    fecha: string;
}

export function useConsultaEspacios() {
    const PAGE_SIZE = PAGE_SIZE_DEFAULT;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('todos');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterSede, setFilterSede] = useState('todas');
    const [filterFechaInicio, setFilterFechaInicio] = useState<string>('');
    const [filterFechaFin, setFilterFechaFin] = useState<string>('');
    const [mensajeFiltroFecha, setMensajeFiltroFecha] = useState<MensajeFiltroFecha | null>(null);
    const [vistaActual, setVistaActual] = useState<'tarjetas' | 'cronograma'>('tarjetas');
    const [currentPage, setCurrentPage] = useState(1);

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

    // Verificar si puede crear solicitudes de préstamo (cualquier usuario autenticado)
    const puedeCrearSolicitudes = !!user;

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

    const loadData = useCallback(async ({ force = false }: { force?: boolean } = {}) => {
        setLoading(true);
        try {
            const activeToken = localStorage.getItem('auth_token');
            const userScope = `${String(user?.rol ?? 'publico')}-${user?.id ?? 'anonimo'}-${user?.facultad?.id ?? 'sin-facultad'}`;
            const cacheKey = `${CONSULTA_ESPACIOS_CACHE_KEY}-${userScope}`;
            const cachedData = force
                ? null
                : getSessionCacheData<{ espacios: EspacioView[]; horarios: OcupacionView[] }>(cacheKey, activeToken);

            if (cachedData) {
                setEspacios(cachedData.espacios);
                setHorarios(cachedData.horarios);
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
            setSessionCacheData(cacheKey, activeToken, {
                espacios: espaciosView,
                horarios: allHorarios
            });
        } catch (error) {
            console.error('Error loading spaces', error);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // Cargar espacios y su estado
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Función para obtener la fecha actual en hora de Colombia (UTC-5)
    const getFechaColombia = (): Date => {
        const ahora = new Date();
        // Colombia está en UTC-5
        const utc = ahora.getTime() + (ahora.getTimezoneOffset() * 60000);
        const colombiaTime = new Date(utc + (3600000 * -5));
        return colombiaTime;
    };

    // Establecer fechas predeterminadas si no hay ninguna seleccionada
    useEffect(() => {
        if (!filterFechaInicio) {
            const hoy = getFechaColombia();
            hoy.setHours(0, 0, 0, 0);
            
            // Si es domingo, no establecer fechas predeterminadas
            if (hoy.getDay() === 0) {
                return;
            }
            
            const fechaInicioStr = hoy.toISOString().split('T')[0];
            
            // Calcular el sábado de la semana actual
            const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
            const diasHastaSabado = 6 - diaSemana; // Días hasta sábado
            const sabado = new Date(hoy);
            sabado.setDate(hoy.getDate() + diasHastaSabado);
            const fechaFinStr = sabado.toISOString().split('T')[0];
            
            setFilterFechaInicio(fechaInicioStr);
            setFilterFechaFin(fechaFinStr);
        }
    }, []); // Solo ejecutar al montar el componente

    // Funciones auxiliares para manejo de fechas
    const getProximoSabado = (fecha: Date): Date => {
        const dia = fecha.getDay();
        const diasHastaSabado = 6 - dia; // Sábado = 6
        const resultado = new Date(fecha);
        resultado.setDate(fecha.getDate() + diasHastaSabado);
        return resultado;
    };

    const esDomingo = (fechaStr: string): boolean => {
        const fecha = new Date(fechaStr + 'T00:00:00');
        return fecha.getDay() === 0;
    };

    // Manejar cambio de fecha inicio
    const handleFechaInicioChange = (fecha: string) => {
        if (!fecha) {
            setFilterFechaInicio('');
            setFilterFechaFin('');
            setMensajeFiltroFecha(null);
            return;
        }

        if (esDomingo(fecha)) {
            setMensajeFiltroFecha({
                tipo: 'error',
                texto: 'No se permite seleccionar domingo como fecha de inicio. Elige tu día actual o un día futuro.'
            });
            return;
        }

        const fechaInicio = new Date(fecha + 'T00:00:00');
        const hoy = getFechaColombia();
        hoy.setHours(0, 0, 0, 0);

        if (fechaInicio < hoy) {
            setMensajeFiltroFecha({
                tipo: 'error',
                texto: 'La fecha de inicio ya pasó. Debes seleccionar tu día actual o una fecha futura.'
            });
            return;
        }

        setFilterFechaInicio(fecha);
        // Calcular el sábado de la semana seleccionada (no solo de la semana actual)
        const diaSemana = fechaInicio.getDay(); // 0=domingo, 1=lunes, ..., 6=sábado
        const diasHastaSabado = 6 - diaSemana; // Días hasta sábado
        const sabado = new Date(fechaInicio);
        sabado.setDate(fechaInicio.getDate() + diasHastaSabado);
        setFilterFechaFin(sabado.toISOString().split('T')[0]);
        setMensajeFiltroFecha({
            tipo: 'info',
            texto: 'Rango actualizado. Puedes ajustar la fecha fin si necesitas un día posterior dentro del rango permitido.'
        });
    };

    // Manejar cambio de fecha fin
    const handleFechaFinChange = (fecha: string) => {
        if (!fecha) {
            setFilterFechaFin('');
            setMensajeFiltroFecha(null);
            return;
        }

        if (!filterFechaInicio) {
            setMensajeFiltroFecha({
                tipo: 'error',
                texto: 'Primero selecciona la fecha de inicio. Luego podrás elegir la fecha fin.'
            });
            return;
        }

        if (esDomingo(fecha)) {
            setMensajeFiltroFecha({
                tipo: 'error',
                texto: 'No se permite seleccionar domingo como fecha fin. Elige el día actual o un día futuro válido.'
            });
            return;
        }

        const fechaFin = new Date(fecha + 'T00:00:00');
        const fechaInicio = filterFechaInicio ? new Date(filterFechaInicio + 'T00:00:00') : null;
        const hoy = getFechaColombia();
        hoy.setHours(0, 0, 0, 0);

        if (fechaFin < hoy) {
            setMensajeFiltroFecha({
                tipo: 'error',
                texto: 'La fecha fin no puede estar en el pasado. Selecciona el día actual o una fecha futura.'
            });
            return;
        }

        if (fechaInicio && fechaFin < fechaInicio) {
            setMensajeFiltroFecha({
                tipo: 'error',
                texto: 'La fecha fin no puede ser menor que la fecha de inicio. Ajusta el rango para continuar.'
            });
            return;
        }

        setFilterFechaFin(fecha);
        setMensajeFiltroFecha({
            tipo: 'info',
            texto: 'Fecha fin actualizada correctamente.'
        });
    };

    // Cargar préstamos aprobados cuando cambian las fechas
    useEffect(() => {
        const loadPrestamos = async () => {
            if (!filterFechaInicio) {
                setPrestamos([]);
                return;
            }

            try {
                const [prestamosAuthResponse, prestamosPublicosResponse] = await Promise.all([
                    prestamoService.listarPrestamos(),
                    prestamosPublicAPI.listarPrestamosPublicos()
                ]);

                const todosLosPrestamos: PrestamoEspacio[] = [
                    ...(prestamosAuthResponse.prestamos || []),
                    ...((prestamosPublicosResponse.prestamos || []) as unknown as PrestamoEspacio[])
                ];
                
                // Filtrar préstamos aprobados y pendientes entre las fechas seleccionadas
                const prestamosFiltrados = todosLosPrestamos.filter(p => 
                    (p.estado === 'Aprobado' || p.estado === 'Pendiente') && 
                    p.fecha >= filterFechaInicio &&
                    p.fecha <= (filterFechaFin || filterFechaInicio)
                );
                
                setPrestamos(prestamosFiltrados);
            } catch (error) {
                console.error("Error loading prestamos:", error);
                setPrestamos([]);
            }
        };

        loadPrestamos();
    }, [filterFechaInicio, filterFechaFin]);

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

    const formatearFechaEncabezado = (fecha: Date): string => {
        const partes = new Intl.DateTimeFormat('es-CO', {
            timeZone: 'America/Bogota',
            day: 'numeric',
            month: 'long'
        }).formatToParts(fecha);

        const dia = partes.find(p => p.type === 'day')?.value ?? '';
        const mesRaw = partes.find(p => p.type === 'month')?.value ?? '';
        const mes = mesRaw ? mesRaw.charAt(0).toUpperCase() + mesRaw.slice(1) : '';

        return `${dia} ${mes}`.trim();
    };

    const encabezadosDiasCronograma = useMemo<EncabezadoDiaCronograma[]>(() => {
        const referencia = filterFechaInicio
            ? new Date(filterFechaInicio + 'T12:00:00')
            : getFechaColombia();

        referencia.setHours(12, 0, 0, 0);

        const diaSemana = referencia.getDay();
        const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
        const lunes = new Date(referencia);
        lunes.setDate(referencia.getDate() + diasHastaLunes);

        return diasSemana.map((dia, index) => {
            const fechaDia = new Date(lunes);
            fechaDia.setDate(lunes.getDate() + index);

            return {
                dia,
                fecha: formatearFechaEncabezado(fechaDia)
            };
        });
    }, [diasSemana, filterFechaInicio]);

    const getFechaColombiaISO = (): string => {
        return new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Bogota',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        }).format(new Date());
    };

    const getIndiceDiaColombia = (): number => {
        const diaSemana = new Intl.DateTimeFormat('es-CO', {
            timeZone: 'America/Bogota',
            weekday: 'long'
        }).format(new Date()).toLowerCase();

        const mapaDias: { [key: string]: number } = {
            lunes: 0,
            martes: 1,
            miercoles: 2,
            'miércoles': 2,
            jueves: 3,
            viernes: 4,
            sabado: 5,
            'sábado': 5
        };

        return mapaDias[diaSemana] ?? -1;
    };

    const getHoraColombia = (): number => {
        const hora = new Intl.DateTimeFormat('en-US', {
            timeZone: 'America/Bogota',
            hour: '2-digit',
            hour12: false
        }).format(new Date());

        return parseInt(hora, 10);
    };

    const isDiaBloqueado = (dia: string): boolean => {
        const hoyColombia = getFechaColombiaISO();
        const indiceDiaActual = getIndiceDiaColombia();
        const semanaActual = !filterFechaInicio || filterFechaInicio === hoyColombia;

        if (!semanaActual || indiceDiaActual < 0) return false;

        const indiceDia = diasSemana.indexOf(dia);
        return indiceDia !== -1 && indiceDia < indiceDiaActual;
    };

    const isCeldaBloqueada = (dia: string, hora: number): boolean => {
        if (isDiaBloqueado(dia)) return true;

        const hoyColombia = getFechaColombiaISO();
        const indiceDiaActual = getIndiceDiaColombia();
        const horaActualColombia = getHoraColombia();
        const semanaActual = !filterFechaInicio || filterFechaInicio === hoyColombia;

        if (!semanaActual || indiceDiaActual < 0) return false;

        const indiceDia = diasSemana.indexOf(dia);
        return indiceDia === indiceDiaActual && hora < horaActualColombia;
    };

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

    const totalFilteredEspacios = filteredEspacios.length;
    const totalPages = getTotalPages(totalFilteredEspacios, PAGE_SIZE);
    const pageNumbers = useMemo(() => getPageNumbers(totalPages), [totalPages]);

    const paginatedEspacios = useMemo(() => {
        return getPageSlice(filteredEspacios, currentPage, PAGE_SIZE);
    }, [filteredEspacios, currentPage, PAGE_SIZE]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filterTipo, filterEstado, filterSede]);

    useEffect(() => {
        setCurrentPage((prev) => normalizePage(prev, totalPages));
    }, [totalPages]);

    const goToPage = (page: number) => {
        setCurrentPage(normalizePage(page, totalPages));
    };

    const goToNextPage = () => {
        goToPage(currentPage + 1);
    };

    const goToPrevPage = () => {
        goToPage(currentPage - 1);
    };

    const estadisticas = useMemo(() => ({
        total: espacios.length,
        disponibles: espacios.filter(e => e.estado === 'disponible').length,
        ocupados: espacios.filter(e => e.estado === 'ocupado').length,
        mantenimiento: espacios.filter(e => e.estado === 'mantenimiento').length
    }), [espacios]);

    // Combinar horarios con préstamos si hay fechas seleccionadas
    const horariosConPrestamos = useMemo(() => {
        if (!filterFechaInicio || prestamos.length === 0) {
            return horarios;
        }

        const prestamosComoOcupacion: OcupacionView[] = prestamos.map(p => {
            const diaSemana = getFechaDiaSemana(p.fecha);
            return {
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
            };
        });

        return [...horarios, ...prestamosComoOcupacion];
    }, [horarios, prestamos, filterFechaInicio]);

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
        
        // Función auxiliar para calcular líneas de texto
        const getTextLines = (text: string, maxWidth: number, fontSize: number): string[] => {
            doc.setFontSize(fontSize);
            return doc.splitTextToSize(text, maxWidth);
        };
        
        espaciosAExportar.forEach((espacio, espacioIndex) => {
            if (espacioIndex > 0) doc.addPage();
            
            // Título del espacio
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text(`${espacio.nombre} - ${espacio.tipo}`, pageWidth / 2, 15, { align: 'center' });
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Capacidad: ${espacio.capacidad} | Sede: ${espacio.sede} | Edificio: ${espacio.edificio}`, pageWidth / 2, 22, { align: 'center' });
            
            // Dimensiones base
            const cellWidth = (pageWidth - 30) / 7; // 1 columna hora + 6 días
            const startX = 15;
            const startY = 30;
            const headerHeight = 8;
            const minEmptyCellHeight = 4; // Altura mínima para celdas vacías
            const contentCellHeight = 12; // Altura base para celdas con contenido
            
            // Dibujar encabezado (días)
            doc.setFillColor(30, 41, 59); // slate-800
            doc.rect(startX, startY, cellWidth, headerHeight, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text('Hora', startX + cellWidth / 2, startY + headerHeight / 2 + 2, { align: 'center' });
            
            diasNombres.forEach((dia, idx) => {
                doc.setFillColor(30, 41, 59); // slate-800
                doc.rect(startX + cellWidth * (idx + 1), startY, cellWidth, headerHeight, 'F');
                doc.setTextColor(255, 255, 255);
                doc.text(dia, startX + cellWidth * (idx + 1) + cellWidth / 2, startY + headerHeight / 2 + 2, { align: 'center' });
            });
            
            // Primera pasada: calcular alturas de celdas para cada fila de hora
            const rowHeights: number[] = [];
            const pageAvailableHeight = pageHeight - startY - headerHeight - 10; // Espacio disponible
            
            horasIntervalos.forEach((hora) => {
                let hasContent = false;
                let maxLines = 0;
                
                diasNombres.forEach((dia) => {
                    const horarioEnCelda = horariosConPrestamos.find(h =>
                        h.espacioId === espacio.id &&
                        h.dia === dia &&
                        hora >= h.horaInicio &&
                        hora < h.horaFin
                    );
                    
                    if (horarioEnCelda) {
                        hasContent = true;
                        const isPrestamo = horarioEnCelda.tipo === 'prestamo';
                        let lines = 0;
                        
                        // Contar líneas para etiqueta de préstamo
                        if (isPrestamo) lines += 1;
                        
                        // Contar líneas para materia
                        if (horarioEnCelda.materia) {
                            const materiaLines = getTextLines(horarioEnCelda.materia, cellWidth - 4, 5);
                            lines += materiaLines.length;
                        }
                        
                        // Contar líneas para docente
                        if (horarioEnCelda.docente) {
                            const docenteLines = getTextLines(horarioEnCelda.docente.toUpperCase(), cellWidth - 4, 5);
                            lines += docenteLines.length;
                        }
                        
                        // Contar líneas para grupo
                        if (horarioEnCelda.grupo) {
                            const grupoLines = getTextLines(horarioEnCelda.grupo, cellWidth - 4, 5);
                            lines += grupoLines.length;
                        }
                        
                        maxLines = Math.max(maxLines, lines);
                    }
                });
                
                // Si la fila tiene contenido, calcular altura según líneas. Si está vacía, altura mínima
                if (hasContent) {
                    const calculatedHeight = Math.max(contentCellHeight, maxLines * 2.5 + 3);
                    rowHeights.push(calculatedHeight);
                } else {
                    rowHeights.push(minEmptyCellHeight);
                }
            });
            
            // Calcular altura total y ajustar si excede la página
            const totalHeight = rowHeights.reduce((sum, h) => sum + h, 0);
            if (totalHeight > pageAvailableHeight) {
                // Factor de escala para comprimir proporcionalmente
                const scaleFactor = pageAvailableHeight / totalHeight;
                for (let i = 0; i < rowHeights.length; i++) {
                    // Las celdas vacías ya son pequeñas, solo comprimir las que tienen contenido
                    if (rowHeights[i] > minEmptyCellHeight) {
                        rowHeights[i] = Math.max(minEmptyCellHeight, rowHeights[i] * scaleFactor);
                    }
                }
            }
            
            // Segunda pasada: dibujar filas con alturas calculadas
            let currentY = startY + headerHeight;
            
            horasIntervalos.forEach((hora, horaIdx) => {
                const cellHeight = rowHeights[horaIdx];
                
                // Columna de hora
                doc.setFillColor(243, 244, 246);
                doc.rect(startX, currentY, cellWidth, cellHeight, 'FD');
                doc.setTextColor(0, 0, 0);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.text(`${hora}:00-${hora + 1}:00`, startX + cellWidth / 2, currentY + cellHeight / 2 + 1, { align: 'center' });
                
                // Celdas de días
                diasNombres.forEach((dia, diaIdx) => {
                    const x = startX + cellWidth * (diaIdx + 1);
                    
                    const horarioEnCelda = horariosConPrestamos.find(h =>
                        h.espacioId === espacio.id &&
                        h.dia === dia &&
                        hora >= h.horaInicio &&
                        hora < h.horaFin
                    );
                    
                    if (horarioEnCelda) {
                        const isPrestamo = horarioEnCelda.tipo === 'prestamo';
                        const isPrestamoPendiente = isPrestamo && horarioEnCelda.prestamo?.estado === 'Pendiente';
                        const isPrestamoAprobado = isPrestamo && horarioEnCelda.prestamo?.estado === 'Aprobado';
                        const isOcupado = horarioEnCelda.estado === 'ocupado';
                        const isMantenimiento = horarioEnCelda.estado === 'mantenimiento';
                        
                        // Colores según tipo
                        if (isPrestamoPendiente) {
                            doc.setFillColor(253, 224, 71); // yellow-300
                            doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                            doc.setTextColor(15, 23, 42); // slate-900
                        } else if (isPrestamoAprobado) {
                            doc.setFillColor(34, 197, 94); // green-500
                            doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                            doc.setTextColor(255, 255, 255);
                        } else if (isOcupado) {
                            doc.setFillColor(239, 68, 68); // red-500
                            doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                            doc.setTextColor(255, 255, 255);
                        } else if (isMantenimiento) {
                            doc.setFillColor(234, 179, 8); // yellow-600
                            doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                            doc.setTextColor(255, 255, 255);
                        } else {
                            doc.setFillColor(219, 234, 254);
                            doc.rect(x, currentY, cellWidth, cellHeight, 'FD');
                            doc.setTextColor(0, 0, 0);
                        }
                        
                        // Dibujar texto ajustado
                        let textY = currentY + 2.5;
                        const maxTextWidth = cellWidth - 4;
                        
                        // Etiqueta de estado para préstamos
                        if (isPrestamo) {
                            const estadoLabel = isPrestamoPendiente ? 'PENDIENTE' : 'APROBADO';
                            doc.setFont('helvetica', 'bold');
                            doc.setFontSize(5);
                            doc.text(estadoLabel, x + cellWidth / 2, textY, { align: 'center' });
                            textY += 2.2;
                        }
                        
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(5);
                        
                        const materia = horarioEnCelda.materia || '';
                        const docente = horarioEnCelda.docente ? horarioEnCelda.docente.toUpperCase() : '';
                        const grupo = horarioEnCelda.grupo || '';
                        
                        if (materia) {
                            const lines = getTextLines(materia, maxTextWidth, 5);
                            lines.forEach((line: string) => {
                                if (textY < currentY + cellHeight - 1) {
                                    doc.text(line, x + cellWidth / 2, textY, { align: 'center' });
                                    textY += 2.2;
                                }
                            });
                        }
                        
                        if (docente) {
                            const lines = getTextLines(docente, maxTextWidth, 5);
                            lines.forEach((line: string) => {
                                if (textY < currentY + cellHeight - 1) {
                                    doc.text(line, x + cellWidth / 2, textY, { align: 'center' });
                                    textY += 2.2;
                                }
                            });
                        }
                        
                        if (grupo) {
                            const lines = getTextLines(grupo, maxTextWidth, 5);
                            lines.forEach((line: string) => {
                                if (textY < currentY + cellHeight - 1) {
                                    doc.text(line, x + cellWidth / 2, textY, { align: 'center' });
                                    textY += 2.2;
                                }
                            });
                        }
                    } else {
                        // Celda vacía
                        doc.rect(x, currentY, cellWidth, cellHeight, 'D');
                    }
                });
                
                currentY += cellHeight;
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
                    // Buscar horario para esta hora y día - usar horariosConPrestamos
                    const horarioEnCelda = horariosConPrestamos.find(h =>
                        h.espacioId === espacio.id &&
                        h.dia === dia &&
                        hora >= h.horaInicio &&
                        hora < h.horaFin
                    );
                    
                    if (horarioEnCelda) {
                        const isPrestamo = horarioEnCelda.tipo === 'prestamo';
                        const isPrestamoPendiente = isPrestamo && horarioEnCelda.prestamo?.estado === 'Pendiente';
                        const isPrestamoAprobado = isPrestamo && horarioEnCelda.prestamo?.estado === 'Aprobado';
                        
                        const materia = horarioEnCelda.materia || '';
                        const docente = horarioEnCelda.docente ? horarioEnCelda.docente.toUpperCase() : '';
                        const grupo = horarioEnCelda.grupo || '';
                        
                        let cellText = '';
                        
                        // Agregar etiqueta de estado para préstamos
                        if (isPrestamo) {
                            cellText = `[${isPrestamoPendiente ? 'PENDIENTE' : 'APROBADO'}] `;
                        }
                        
                        cellText += materia;
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

    // Funciones para drag-to-select (cualquier usuario autenticado)
    const iniciarSeleccion = useCallback((espacioId: string, dia: string, hora: number) => {
        if (!puedeCrearSolicitudes) return;
        
        const ocupado = getOcupacionPorHora(espacioId, dia, hora);
        if (ocupado) return; // No permitir seleccionar horarios ocupados

        setIsDragging(true);
        setSeleccionInicio({ espacioId, dia, hora });
        setSeleccionRango({ espacioId, dia, horaInicio: hora, horaFin: hora + 1 });
    }, [puedeCrearSolicitudes]);

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
            let fechaBase: Date;
            
            // Si hay fechas seleccionadas, usar la fecha inicio como base
            if (filterFechaInicio) {
                fechaBase = new Date(filterFechaInicio + 'T00:00:00');
            } else {
                // Si no hay filtro, usar la fecha de hoy
                const hoyColombia = getFechaColombia().toISOString().split('T')[0];
                fechaBase = new Date(hoyColombia + 'T00:00:00');
            }

            // Calcular la fecha exacta según el día seleccionado en el horario
            const diasMap: { [key: string]: number } = {
                'Lunes': 1, 'Martes': 2, 'Miércoles': 3, 'Jueves': 4, 'Viernes': 5, 'Sábado': 6
            };
            const diaSeleccionado = diasMap[seleccionRango.dia];
            const diaBase = fechaBase.getDay(); // 0 = domingo, 1 = lunes, etc.
            const hoyColombia = getFechaColombia();
            hoyColombia.setHours(0, 0, 0, 0);
            const horaActualColombia = getFechaColombia().getHours();
            const fechaBaseNormalizada = new Date(fechaBase);
            fechaBaseNormalizada.setHours(0, 0, 0, 0);
            
            // Calcular diferencia de días para llegar al día seleccionado
            let diferenciaDias = diaSeleccionado - diaBase;

            // Si la base es hoy, no permitir seleccionar días anteriores de la semana actual.
            if (fechaBaseNormalizada.getTime() === hoyColombia.getTime() && diferenciaDias < 0) {
                setIsDragging(false);
                setSeleccionInicio(null);
                setSeleccionRango(null);
                return;
            }

            // Si la base es hoy y se selecciona hoy, bloquear horas anteriores a la actual.
            if (
                fechaBaseNormalizada.getTime() === hoyColombia.getTime() &&
                diferenciaDias === 0 &&
                seleccionRango.horaInicio < horaActualColombia
            ) {
                setIsDragging(false);
                setSeleccionInicio(null);
                setSeleccionRango(null);
                return;
            }

            if (diferenciaDias < 0) {
                diferenciaDias += 7; // Ir a la próxima semana si el día ya pasó
            }
            
            const fecha = new Date(fechaBase);
            fecha.setDate(fechaBase.getDate() + diferenciaDias);
            fecha.setHours(0, 0, 0, 0);

            // Evitar solicitudes en fechas anteriores al día actual.
            if (fecha < hoyColombia) {
                setIsDragging(false);
                setSeleccionInicio(null);
                setSeleccionRango(null);
                return;
            }

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
    }, [isDragging, seleccionRango, espacios, filterFechaInicio]);

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
        setFilterFechaInicio('');
        setFilterFechaFin('');
        setMensajeFiltroFecha(null);
    }, []);

    const verCronogramaIndividual = useCallback((espacio: EspacioView) => {
        setEspacioSeleccionado(espacio);
        setVistaActual('cronograma');
    }, []);

    const volverALista = useCallback(() => {
        setEspacioSeleccionado(null);
        setVistaActual('tarjetas');
    }, []);

    // Función para recargar datos limpiando el caché
    const recargarDatos = useCallback(async () => {
        await loadData({ force: true });
    }, [loadData]);

    return {
        searchTerm,
        setSearchTerm,
        filterTipo,
        setFilterTipo,
        filterEstado,
        setFilterEstado,
        filterSede,
        setFilterSede,
        filterFechaInicio,
        filterFechaFin,
        mensajeFiltroFecha,
        handleFechaInicioChange,
        handleFechaFinChange,
        vistaActual,
        setVistaActual,
        tiposEspacio,
        sedes,
        diasSemana,
        encabezadosDiasCronograma,
        horas,
        isDiaBloqueado,
        isCeldaBloqueada,
        filteredEspacios,
        paginatedEspacios,
        totalFilteredEspacios,
        currentPage,
        totalPages,
        pageNumbers,
        pageSize: PAGE_SIZE,
        goToPage,
        goToNextPage,
        goToPrevPage,
        estadisticas,
        getOcupacionPorHora,
        getColorEstado,
        loading,
        horarios: horariosConPrestamos,
        prestamos,
        calcularProximaClaseYEstado,
        exportarCronogramaPDF,
        exportarCronogramaExcel,
        // Drag-to-select (cualquier usuario autenticado)
        isDragging,
        seleccionRango,
        iniciarSeleccion,
        actualizarSeleccion,
        finalizarSeleccion,
        cancelarSeleccion,
        puedeCrearSolicitudes,
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
        limpiarFiltros,
        // Recarga
        recargarDatos
    };
}
