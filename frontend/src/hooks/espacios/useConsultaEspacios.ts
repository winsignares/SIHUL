import { useState, useMemo, useEffect } from 'react';
import { espacioPermitidoService, espacioService } from '../../services/espacios/espaciosAPI';
import { useAuth } from '../../context/AuthContext';
import { getEspaciosFromCache, setEspaciosInCache, getCacheKey } from '../../services/cache/cacheService';

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
}

export function useConsultaEspacios() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('todos');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [vistaActual, setVistaActual] = useState<'tarjetas' | 'cronograma'>('tarjetas');

    const [espacios, setEspacios] = useState<EspacioView[]>([]);
    const [horarios, setHorarios] = useState<OcupacionView[]>([]);
    const [loading, setLoading] = useState(true);

    // Obtener usuario del contexto de autenticación
    const { user } = useAuth();

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

                // Obtener espacios según el rol del usuario
                let espaciosBase;
                
                // Acceso público sin autenticación
                if (!user?.id) {
                    // Si no hay usuario, listar todos los espacios (acceso público)
                    const response = await espacioService.list();
                    espaciosBase = response.espacios;
                }
                // Supervisor general: solo espacios permitidos
                else if (String(user.rol) === 'supervisor_general') {
                    const response = await espacioPermitidoService.listByUsuario(user.id);
                    espaciosBase = response.espacios;
                }
                // Otros roles autenticados: todos los espacios
                else {
                    const response = await espacioService.list();
                    espaciosBase = response.espacios;
                }

                // 3. Obtener estado actual para cada espacio
                const espaciosConEstado = await Promise.all(espaciosBase.map(async (e) => {
                    try {
                        const estadoData = await espacioService.getEstado(e.id!);
                        return {
                            id: e.id!.toString(),
                            nombre: e.nombre,
                            tipo: e.tipo_espacio?.nombre || 'Sin Tipo',
                            capacidad: e.capacidad,
                            sede: 'Sede Principal',
                            edificio: e.ubicacion || 'Sin Ubicación',
                            estado: estadoData.estado,
                            proximaClase: estadoData.texto_estado,
                            ubicacion: e.ubicacion
                        } as EspacioView;
                    } catch (error) {
                        console.error(`Error fetching status for space ${e.id}`, error);
                        return {
                            id: e.id!.toString(),
                            nombre: e.nombre,
                            tipo: e.tipo_espacio?.nombre || 'Sin Tipo',
                            capacidad: e.capacidad,
                            sede: 'Sede Principal',
                            edificio: e.ubicacion || 'Sin Ubicación',
                            estado: 'disponible',
                            proximaClase: 'Error cargando estado',
                            ubicacion: e.ubicacion
                        } as EspacioView;
                    }
                }));

                setEspacios(espaciosConEstado);

                // 4. Cargar horarios
                const allHorarios: OcupacionView[] = [];
                await Promise.all(espaciosBase.map(async (e) => {
                    try {
                        const horarioData = await espacioService.getHorario(e.id!);
                        horarioData.horario.forEach(h => {
                            allHorarios.push({
                                espacioId: e.id!.toString(),
                                dia: normalizarDia(h.dia),
                                horaInicio: h.hora_inicio,
                                horaFin: h.hora_fin,
                                materia: h.materia,
                                docente: h.docente,
                                grupo: h.grupo,
                                estado: h.estado || 'ocupado'
                            });
                        });
                    } catch (error) {
                        console.error(`Error fetching schedule for space ${e.id}`, error);
                    }
                }));
                
                setHorarios(allHorarios);

                // Guardar en caché
                setEspaciosInCache(cacheKey, espaciosConEstado, allHorarios);

            } catch (error) {
                console.error("Error loading spaces", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [user]); // Recargar si cambia el usuario

    const tiposEspacio = useMemo(() => [...new Set(espacios.map(e => e.tipo))], [espacios]);
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    // Horas de 6am a 10pm (22:00)
    const horas = Array.from({ length: 17 }, (_, i) => i + 6);

    const filteredEspacios = useMemo(() => {
        return espacios.filter(e => {
            const matchesSearch = e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (e.edificio && e.edificio.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesTipo = filterTipo === 'todos' || e.tipo === filterTipo;
            const matchesEstado = filterEstado === 'todos' || e.estado === filterEstado;
            return matchesSearch && matchesTipo && matchesEstado;
        });
    }, [espacios, searchTerm, filterTipo, filterEstado]);

    const estadisticas = useMemo(() => ({
        total: espacios.length,
        disponibles: espacios.filter(e => e.estado === 'disponible').length,
        ocupados: espacios.filter(e => e.estado === 'ocupado').length,
        mantenimiento: espacios.filter(e => e.estado === 'mantenimiento').length
    }), [espacios]);

    const getOcupacionPorHora = (espacioId: string, dia: string, hora: number) => {
        return horarios.find(h =>
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

    return {
        searchTerm,
        setSearchTerm,
        filterTipo,
        setFilterTipo,
        filterEstado,
        setFilterEstado,
        vistaActual,
        setVistaActual,
        tiposEspacio,
        diasSemana,
        horas,
        filteredEspacios,
        estadisticas,
        getOcupacionPorHora,
        getColorEstado,
        loading,
        horarios,
        calcularProximaClaseYEstado
    };
} 