import { useState, useMemo, useEffect } from 'react';
import { espacioPermitidoService, espacioService } from '../../services/espacios/espaciosAPI';
import { useAuth } from '../../context/AuthContext';

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

    // Cargar espacios permitidos y su estado
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                // Verificar que hay usuario autenticado
                if (!user?.id) {
                    console.error("No user ID found");
                    setLoading(false);
                    return;
                }

                // 2. Obtener espacios permitidos
                const response = await espacioPermitidoService.listByUsuario(user.id);
                const espaciosBase = response.espacios;

                // 3. Obtener estado actual para cada espacio
                const espaciosConEstado = await Promise.all(espaciosBase.map(async (e) => {
                    try {
                        const estadoData = await espacioService.getEstado(e.id!);
                        return {
                            id: e.id!.toString(),
                            nombre: e.nombre,
                            tipo: e.tipo_espacio?.nombre || 'Sin Tipo',
                            capacidad: e.capacidad,
                            sede: 'Sede Principal', // Ajustar si viene en el objeto
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
                            estado: 'disponible', // Fallback
                            proximaClase: 'Error cargando estado',
                            ubicacion: e.ubicacion
                        } as EspacioView;
                    }
                }));

                setEspacios(espaciosConEstado);

                // 4. Si estamos en vista cronograma, cargar horarios
                if (vistaActual === 'cronograma') {
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
                }

            } catch (error) {
                console.error("Error loading spaces", error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [vistaActual, user]); // Recargar si cambia la vista o el usuario

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
        horarios // Exportamos horarios para uso directo en el grid si es necesario
    };
} 