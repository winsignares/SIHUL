import { useState, useEffect } from 'react';
import type { Prestamo } from '../../models/index';
import { prestamoService } from '../../services/prestamos/prestamoAPI';
import { espacioService } from '../../services/espacios/espaciosAPI';
import { showNotification } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

export function useConsultaPrestamos() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [loading, setLoading] = useState(false);
    const { user } = useAuth();

    const [nuevaSolicitud, setNuevaSolicitud] = useState({
        solicitante: '',
        email: '',
        telefono: '',
        espacio: '',
        fecha: '',
        horaInicio: '',
        horaFin: '',
        motivo: '',
        tipoEvento: '',
        asistentes: '',
        recursosNecesarios: [] as string[]
    });

    const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
    const [espaciosDisponibles, setEspaciosDisponibles] = useState<Array<{ id: number; nombre: string }>>([]);

    const tiposEvento = [
        'Conferencia',
        'Taller',
        'Reunión',
        'Simposio',
        'Evento Cultural',
        'Evento Deportivo',
        'Examen Especial',
        'Otro'
    ];

    const recursosDisponibles = [
        'Proyector',
        'Micrófono',
        'Sonido',
        'Computadores',
        'Videoconferencia',
        'Grabación',
        'Pizarra Digital',
        'Aire Acondicionado'
    ];

    // Cargar datos iniciales
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            
            // Cargar préstamos y espacios en paralelo
            const [prestamosResponse, espaciosResponse] = await Promise.all([
                prestamoService.listarPrestamos(),
                espacioService.list()
            ]);

            // Transformar préstamos al formato UI
            const prestamosUI: Prestamo[] = prestamosResponse.prestamos
                .filter(p => !user || p.usuario_id === user.id) // Filtrar por usuario actual si existe
                .map(p => ({
                    id: p.id?.toString() || '',
                    solicitante: p.usuario_nombre || 'Usuario Desconocido',
                    email: p.usuario_correo || '',
                    telefono: '',
                    espacio: p.espacio_nombre || `Espacio ${p.espacio_id}`,
                    fecha: p.fecha,
                    horaInicio: p.hora_inicio.substring(0, 5),
                    horaFin: p.hora_fin.substring(0, 5),
                    motivo: p.motivo || '',
                    tipoEvento: p.espacio_tipo || 'Evento',
                    asistentes: 0,
                    recursosNecesarios: [],
                    estado: p.estado.toLowerCase() as 'pendiente' | 'aprobado' | 'rechazado',
                    fechaSolicitud: p.fecha + ' ' + p.hora_inicio,
                    comentariosAdmin: ''
                }));

            setPrestamos(prestamosUI);
            
            // Mapear espacios disponibles
            setEspaciosDisponibles(
                espaciosResponse.espacios
                    .filter(e => e.estado === 'Disponible')
                    .map(e => ({ id: e.id!, nombre: e.nombre }))
            );
        } catch (error) {
            showNotification({
                message: `Error al cargar datos: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const crearSolicitud = async () => {
        if (!nuevaSolicitud.espacio || !nuevaSolicitud.fecha || 
            !nuevaSolicitud.horaInicio || !nuevaSolicitud.horaFin || !nuevaSolicitud.motivo) {
            showNotification({
                message: 'Por favor complete todos los campos obligatorios',
                type: 'error'
            });
            return;
        }

        try {
            setLoading(true);

            // Buscar el ID del espacio por nombre
            const espacioSeleccionado = espaciosDisponibles.find(e => e.nombre === nuevaSolicitud.espacio);
            
            if (!espacioSeleccionado) {
                showNotification({
                    message: 'Espacio no encontrado',
                    type: 'error'
                });
                return;
            }

            await prestamoService.crearPrestamo({
                espacio_id: espacioSeleccionado.id,
                usuario_id: user?.id || null,
                administrador_id: null,
                fecha: nuevaSolicitud.fecha,
                hora_inicio: nuevaSolicitud.horaInicio + ':00',
                hora_fin: nuevaSolicitud.horaFin + ':00',
                motivo: nuevaSolicitud.motivo,
                estado: 'Pendiente'
            });

            await loadData();
            setDialogOpen(false);
            setNuevaSolicitud({
                solicitante: '',
                email: '',
                telefono: '',
                espacio: '',
                fecha: '',
                horaInicio: '',
                horaFin: '',
                motivo: '',
                tipoEvento: '',
                asistentes: '',
                recursosNecesarios: []
            });

            showNotification({
                message: '✅ Solicitud creada exitosamente',
                type: 'success'
            });
        } catch (error) {
            showNotification({
                message: `Error al crear solicitud: ${error instanceof Error ? error.message : 'Error desconocido'}`,
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const filteredPrestamos = prestamos.filter(p => {
        const matchesSearch = p.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.espacio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tipoEvento.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
        return matchesSearch && matchesEstado;
    });

    const estadisticas = {
        total: prestamos.length,
        aprobados: prestamos.filter(p => p.estado === 'aprobado').length,
        pendientes: prestamos.filter(p => p.estado === 'pendiente').length
    };

    return {
        dialogOpen,
        setDialogOpen,
        searchTerm,
        setSearchTerm,
        filterEstado,
        setFilterEstado,
        nuevaSolicitud,
        setNuevaSolicitud,
        prestamos,
        espaciosDisponibles: espaciosDisponibles.map(e => e.nombre),
        tiposEvento,
        recursosDisponibles,
        crearSolicitud,
        filteredPrestamos,
        estadisticas,
        loading,
        reloadData: loadData
    };
}
