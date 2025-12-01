import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { prestamoService, type PrestamoEspacio, type RecursoPrestamo } from '../../services/prestamos/prestamoAPI';
import { tipoActividadService, type TipoActividad } from '../../services/prestamos/tipoActividadAPI';
import { recursoService, type Recurso } from '../../services/recursos/recursoAPI';
import { espacioService } from '../../services/espacios/espaciosAPI';
import type { Prestamo } from '../../models/index';

// Helper function to map backend PrestamoEspacio to UI Prestamo model
const mapPrestamoEspacioToPrestamo = (prestamo: PrestamoEspacio): Prestamo => {
    return {
        id: prestamo.id?.toString() || '',
        solicitante: prestamo.usuario_nombre || '',
        email: prestamo.usuario_correo || '',
        telefono: '', // No disponible en modelo backend
        espacio: prestamo.espacio_nombre || '',
        fecha: prestamo.fecha,
        horaInicio: prestamo.hora_inicio.substring(0, 5), // Remove seconds HH:MM:SS -> HH:MM
        horaFin: prestamo.hora_fin.substring(0, 5),
        motivo: prestamo.motivo || '',
        tipoEvento: prestamo.tipo_actividad_nombre || '',
        asistentes: 0, // No disponible en modelo backend
        recursosNecesarios: prestamo.recursos?.map(r => r.recurso_nombre || '') || [],
        estado: prestamo.estado.toLowerCase() as 'pendiente' | 'aprobado' | 'rechazado',
        fechaSolicitud: '', // No disponible en modelo backend
        comentariosAdmin: ''
    };
};

export function useDocentePrestamos() {
    const { user } = useAuth();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [prestamos, setPrestamos] = useState<Prestamo[]>([]);

    // Estado para datos dinámicos de la API
    const [tiposActividad, setTiposActividad] = useState<TipoActividad[]>([]);
    const [recursosDisponibles, setRecursosDisponibles] = useState<Recurso[]>([]);
    const [espaciosDisponibles, setEspaciosDisponibles] = useState<any[]>([]);

    // Estado para recursos seleccionados (con cantidad)
    const [recursosSeleccionados, setRecursosSeleccionados] = useState<RecursoPrestamo[]>([]);

    const [nuevaSolicitud, setNuevaSolicitud] = useState({
        solicitante: user?.nombre || '',
        email: user?.correo || '',
        telefono: '',
        espacio_id: 0, // Changed from espacio string to ID
        fecha: '',
        horaInicio: '',
        horaFin: '',
        motivo: '',
        tipo_actividad_id: 0, // Changed from tipoEvento string to ID
        asistentes: ''
    });

    // Fetch initial data (tipos de actividad, recursos, espacios)
    const fetchInitialData = async () => {
        try {
            const [tiposResp, recursosResp, espaciosResp] = await Promise.all([
                tipoActividadService.listarTiposActividad(),
                recursoService.listarRecursos(),
                espacioService.list()
            ]);

            setTiposActividad(tiposResp.tipos_actividad);
            setRecursosDisponibles(recursosResp.recursos);
            setEspaciosDisponibles(espaciosResp.espacios);
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('Error al cargar datos iniciales');
        }
    };

    // Fetch prestamos when component mounts or user changes
    const fetchPrestamos = async () => {
        if (!user?.id) return;

        setLoading(true);
        setError(null);

        try {
            const response = await prestamoService.listarPrestamosPorUsuario(user.id);
            const mappedPrestamos = response.prestamos.map(mapPrestamoEspacioToPrestamo);
            setPrestamos(mappedPrestamos);
        } catch (err) {
            console.error('Error fetching prestamos:', err);
            setError('Error al cargar los préstamos');
        } finally {
            setLoading(false);
        }
    };

    // Load initial data and prestamos on mount
    useEffect(() => {
        fetchInitialData();
    }, []);

    useEffect(() => {
        if (tiposActividad.length > 0) {
            fetchPrestamos();
        }
    }, [user?.id, tiposActividad]);

    // Funciones para manejar recursos dinámicamente
    const agregarRecurso = (recurso_id: number, cantidad: number = 1) => {
        const recursoExistente = recursosSeleccionados.find(r => r.recurso_id === recurso_id);

        if (recursoExistente) {
            // Si ya existe, actualizar cantidad
            setRecursosSeleccionados(prev =>
                prev.map(r => r.recurso_id === recurso_id ? { ...r, cantidad } : r)
            );
        } else {
            // Si no existe, agregar nuevo
            const recurso = recursosDisponibles.find(r => r.id === recurso_id);
            setRecursosSeleccionados(prev => [
                ...prev,
                {
                    recurso_id,
                    recurso_nombre: recurso?.nombre,
                    cantidad
                }
            ]);
        }
    };

    const eliminarRecurso = (recurso_id: number) => {
        setRecursosSeleccionados(prev => prev.filter(r => r.recurso_id !== recurso_id));
    };

    const actualizarCantidadRecurso = (recurso_id: number, cantidad: number) => {
        if (cantidad <= 0) {
            eliminarRecurso(recurso_id);
        } else {
            setRecursosSeleccionados(prev =>
                prev.map(r => r.recurso_id === recurso_id ? { ...r, cantidad } : r)
            );
        }
    };

    const crearSolicitud = async () => {
        if (!nuevaSolicitud.espacio_id || !nuevaSolicitud.fecha || !nuevaSolicitud.horaInicio ||
            !nuevaSolicitud.horaFin || !nuevaSolicitud.motivo || !nuevaSolicitud.tipo_actividad_id) {
            setError('Por favor complete todos los campos obligatorios');
            return;
        }

        if (!user?.id) {
            setError('Usuario no autenticado');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await prestamoService.crearPrestamo({
                espacio_id: nuevaSolicitud.espacio_id,
                usuario_id: user.id,
                administrador_id: null,
                tipo_actividad_id: nuevaSolicitud.tipo_actividad_id,
                fecha: nuevaSolicitud.fecha,
                hora_inicio: `${nuevaSolicitud.horaInicio}:00`, // Add seconds
                hora_fin: `${nuevaSolicitud.horaFin}:00`,
                motivo: nuevaSolicitud.motivo,
                estado: 'Pendiente',
                recursos: recursosSeleccionados.map(r => ({
                    recurso_id: r.recurso_id,
                    cantidad: r.cantidad
                }))
            });

            // Reset form
            setNuevaSolicitud({
                solicitante: user?.nombre || '',
                email: user?.correo || '',
                telefono: '',
                espacio_id: 0,
                fecha: '',
                horaInicio: '',
                horaFin: '',
                motivo: '',
                tipo_actividad_id: 0,
                asistentes: ''
            });
            setRecursosSeleccionados([]);

            setDialogOpen(false);

            // Refresh prestamos list
            await fetchPrestamos();

            // TODO: Show success notification
            console.log('Solicitud enviada exitosamente');
        } catch (err: any) {
            // Handle availability conflict errors
            if (err.message?.includes('reservado') || err.message?.includes('disponible') || err.status === 409) {
                // No console error for validation issues
                setError(err.message);
            } else {
                console.error('Error creating prestamo:', err);
                setError('Error al crear la solicitud de préstamo');
            }
        } finally {
            setLoading(false);
        }
    };

    const filteredPrestamos = prestamos.filter(p => {
        const matchesSearch = p.espacio.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.tipoEvento.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.motivo.toLowerCase().includes(searchTerm.toLowerCase());
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
        espaciosDisponibles,
        tiposActividad,
        recursosDisponibles,
        recursosSeleccionados,
        agregarRecurso,
        eliminarRecurso,
        actualizarCantidadRecurso,
        crearSolicitud,
        filteredPrestamos,
        estadisticas,
        loading,
        error,
        refetch: fetchPrestamos
    };
}
