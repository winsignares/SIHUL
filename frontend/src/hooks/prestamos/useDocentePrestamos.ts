import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { prestamoService, type PrestamoEspacio, type RecursoPrestamo } from '../../services/prestamos/prestamoAPI';
import { tipoActividadService, type TipoActividad } from '../../services/prestamos/tipoActividadAPI';
import { recursoService, type Recurso } from '../../services/recursos/recursoAPI';
import { sedeService } from '../../services/sedes/sedeAPI';
import { prestamosPublicAPI, type EspacioDisponibleAPI } from '../../services/prestamos/prestamosPublicAPI';
import type { Prestamo } from '../../models/index';
import type { Sede } from '../../models/institucional/sede.model';

// Helper function to map backend PrestamoEspacio to UI Prestamo model
const mapPrestamoEspacioToPrestamo = (prestamo: PrestamoEspacio): Prestamo => {
    return {
        id: prestamo.id?.toString() || '',
        solicitante: prestamo.usuario_nombre || '',
        email: prestamo.usuario_correo || '',
        telefono: prestamo.telefono || '',
        espacio: prestamo.espacio_nombre || '',
        espacio_id: prestamo.espacio_id,
        fecha: prestamo.fecha,
        horaInicio: prestamo.hora_inicio.substring(0, 5), // Remove seconds HH:MM:SS -> HH:MM
        horaFin: prestamo.hora_fin.substring(0, 5),
        motivo: prestamo.motivo || '',
        tipoEvento: prestamo.tipo_actividad_nombre || '',
        tipo_actividad_id: prestamo.tipo_actividad_id,
        asistentes: prestamo.asistentes || 0,
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
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [espaciosDisponibles, setEspaciosDisponibles] = useState<EspacioDisponibleAPI[]>([]);

    // Estado para recursos seleccionados (con cantidad)
    const [recursosSeleccionados, setRecursosSeleccionados] = useState<RecursoPrestamo[]>([]);

    // Estados para edición
    const [modoEdicion, setModoEdicion] = useState(false);
    const [prestamoEditando, setPrestamoEditando] = useState<Prestamo | null>(null);
    const [dialogPrestamoId, setDialogPrestamoId] = useState<string | null>(null);

    const [nuevaSolicitud, setNuevaSolicitud] = useState({
        solicitante: user?.nombre || '',
        email: user?.correo || '',
        telefono: '',
        sede_id: 0,
        espacio_id: 0,
        fecha: '',
        horaInicio: '',
        horaFin: '',
        motivo: '',
        tipo_actividad_id: 0,
        asistentes: ''
    });

    // Fetch initial data (tipos de actividad, recursos, sedes)
    const fetchInitialData = async () => {
        try {
            const [tiposResp, recursosResp, sedesResp] = await Promise.all([
                tipoActividadService.listarTiposActividad(),
                recursoService.listarRecursos(),
                sedeService.listarSedes()
            ]);

            setTiposActividad(tiposResp.tipos_actividad);
            setRecursosDisponibles(recursosResp.recursos);
            setSedes(sedesResp.sedes);
        } catch (err) {
            console.error('Error fetching initial data:', err);
            setError('Error al cargar datos iniciales');
        }
    };

    // Fetch espacios disponibles según sede, fecha y horario
    const fetchEspaciosDisponibles = async () => {
        const { sede_id, fecha, horaInicio, horaFin } = nuevaSolicitud;
        
        // Solo buscar si tenemos todos los datos necesarios
        if (!sede_id || !fecha || !horaInicio || !horaFin) {
            setEspaciosDisponibles([]);
            return;
        }

        try {
            const response = await prestamosPublicAPI.listarEspaciosDisponibles(
                fecha,
                `${horaInicio}:00`,
                `${horaFin}:00`,
                sede_id
            );
            setEspaciosDisponibles(response.espacios || []);
        } catch (err) {
            console.error('Error fetching espacios disponibles:', err);
            setEspaciosDisponibles([]);
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

    // Fetch espacios cuando cambian sede, fecha o horarios
    useEffect(() => {
        fetchEspaciosDisponibles();
    }, [nuevaSolicitud.sede_id, nuevaSolicitud.fecha, nuevaSolicitud.horaInicio, nuevaSolicitud.horaFin]);

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

        // Validar capacidad del espacio si se especificaron asistentes
        const asistentesNum = parseInt(nuevaSolicitud.asistentes) || 0;
        if (asistentesNum > 0) {
            const espacioSeleccionado = espaciosDisponibles.find(e => e.id === nuevaSolicitud.espacio_id);
            if (espacioSeleccionado && asistentesNum > espacioSeleccionado.capacidad) {
                setError(`El número de asistentes (${asistentesNum}) excede la capacidad del espacio (${espacioSeleccionado.capacidad})`);
                return;
            }
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
                asistentes: asistentesNum,
                telefono: nuevaSolicitud.telefono,
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
                sede_id: 0,
                espacio_id: 0,
                fecha: '',
                horaInicio: '',
                horaFin: '',
                motivo: '',
                tipo_actividad_id: 0,
                asistentes: ''
            });
            setRecursosSeleccionados([]);
            setEspaciosDisponibles([]);

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

    const iniciarEdicion = (prestamo: Prestamo) => {
        setModoEdicion(true);
        setPrestamoEditando({ ...prestamo });
        setDialogPrestamoId(prestamo.id);
    };

    const cancelarEdicion = () => {
        setModoEdicion(false);
        setPrestamoEditando(null);
        setDialogPrestamoId(null);
    };

    const guardarEdicion = async () => {
        if (!prestamoEditando) return;

        try {
            setLoading(true);
            setError(null);

            // Validar que tenemos los IDs necesarios
            if (!prestamoEditando.espacio_id || !prestamoEditando.tipo_actividad_id) {
                throw new Error('Faltan datos necesarios del préstamo');
            }

            // Llamar al servicio para actualizar el préstamo
            await prestamoService.actualizarPrestamo({
                id: parseInt(prestamoEditando.id),
                espacio_id: prestamoEditando.espacio_id,
                usuario_id: user?.id || null,
                administrador_id: null,
                tipo_actividad_id: prestamoEditando.tipo_actividad_id,
                fecha: prestamoEditando.fecha,
                hora_inicio: prestamoEditando.horaInicio + ':00',
                hora_fin: prestamoEditando.horaFin + ':00',
                motivo: prestamoEditando.motivo,
                asistentes: prestamoEditando.asistentes,
                telefono: prestamoEditando.telefono,
                estado: prestamoEditando.estado.charAt(0).toUpperCase() + prestamoEditando.estado.slice(1)
            });

            // Recargar datos
            await fetchPrestamos();

            setModoEdicion(false);
            setPrestamoEditando(null);
            setDialogPrestamoId(null);

            console.log('✅ Préstamo actualizado correctamente');
        } catch (err) {
            console.error('Error al actualizar préstamo:', err);
            setError('Error al actualizar el préstamo');
        } finally {
            setLoading(false);
        }
    };

    const eliminarPrestamo = async (id: string) => {
        try {
            setLoading(true);
            setError(null);

            await prestamoService.eliminarPrestamo(parseInt(id));
            
            // Recargar datos
            await fetchPrestamos();

            console.log('✅ Préstamo eliminado correctamente');
        } catch (err) {
            console.error('Error al eliminar préstamo:', err);
            setError('Error al eliminar el préstamo');
        } finally {
            setLoading(false);
        }
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
        sedes,
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
        refetch: fetchPrestamos,
        // Funciones de edición
        modoEdicion,
        prestamoEditando,
        setPrestamoEditando,
        dialogPrestamoId,
        setDialogPrestamoId,
        iniciarEdicion,
        cancelarEdicion,
        guardarEdicion,
        eliminarPrestamo
    };
}
