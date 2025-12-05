import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { NotificacionUsuario, NotificacionBackend, FiltroTiempo, CategoriaNotificacion } from '../../models/users/notification.model';
import { 
    NOTIFICACIONES_IMPORTANTES
} from '../../models/users/notification.model';
import { useAuth } from '../../context/AuthContext';
import { useNotificacionesContext } from '../../context/NotificacionesContext';
import {
    obtenerMisNotificaciones,
    obtenerEstadisticas,
    marcarComoLeida,
    marcarTodasComoLeidas,
    eliminarNotificacion as eliminarNotificacionAPI,
} from '../../services/notificaciones/notificacionesAPI';

/**
 * Mapea una notificación del backend al formato del frontend
 */
const mapearNotificacion = (notif: NotificacionBackend): NotificacionUsuario => {
    // Extraer título y descripción del mensaje
    let titulo = '';
    let descripcion = notif.mensaje;

    // Para notificaciones de rechazo, extraer la primera línea como título
    if (notif.tipo_notificacion === 'solicitud_rechazada') {
        const lineas = notif.mensaje.split('\n');
        titulo = lineas[0].trim();
        // Mantener solo el contenido después del título (sin la primera línea)
        descripcion = lineas.slice(1).join('\n').trim();
    } else {
        // Para otras notificaciones, intentar dividir por ':'
        const partes = notif.mensaje.split(':');
        titulo = partes.length > 1 ? partes[0].trim() : obtenerTituloDefault(notif.tipo_notificacion);
        descripcion = partes.length > 1 ? partes.slice(1).join(':').trim() : notif.mensaje;
    }

    return {
        id: notif.id,
        tipo: notif.tipo_notificacion,
        titulo,
        descripcion,
        fecha: formatearFecha(notif.fecha_creacion),
        leida: notif.es_leida,
        prioridad: notif.prioridad,
    };
};

/**
 * Obtiene un título por defecto según el tipo de notificación
 */
const obtenerTituloDefault = (tipo: string): string => {
    const titulos: Record<string, string> = {
        'horario': 'Actualización de Horario',
        'prestamo': 'Solicitud de Préstamo',
        'espacio': 'Cambio en Espacios',
        'solicitud': 'Nueva Solicitud',
        'mensaje': 'Nuevo Mensaje',
        'alerta': 'Alerta del Sistema',
        'sistema': 'Notificación del Sistema',
        'exito': 'Operación Exitosa',
        'error': 'Error en Operación',
        'advertencia': 'Advertencia',
        'facultad': 'Actualización de Facultad',
        'solicitud_espacio': 'Nueva Solicitud de Espacio',
        'solicitud_aprobada': 'Solicitud Aprobada',
        'solicitud_rechazada': 'Solicitud Rechazada',
        'grupo': 'Nuevo Grupo Creado',
        'cambio_nombre': 'Cambio de Nombre',
        'cambio_contrasena': 'Cambio de Contraseña',
        'licencia': 'Aviso de Licencia',
        'periodo_academico': 'Período Académico',
        'profesor_sin_asignar': 'Profesor Sin Asignar',
        'grupo_sin_espacio': 'Grupo Sin Espacio',
    };
    return titulos[tipo] || 'Notificación';
};

/**
 * Formatea la fecha al formato deseado
 */
const formatearFecha = (fechaISO: string): string => {
    const fecha = new Date(fechaISO);
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    return `${año}-${mes}-${dia} ${hora}:${minuto}`;
};

export function useNotificaciones(onNotificacionesChange?: (count: number) => void) {
    const { user } = useAuth();
    const { actualizarContador } = useNotificacionesContext();
    const [notificaciones, setNotificaciones] = useState<NotificacionUsuario[]>([]);
    const [filterTab, setFilterTab] = useState<CategoriaNotificacion>('pendientes');
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        pendientes: 0,
        leidas: 0,
        eliminadas: 0,
    });

    // Estados para paginación y búsqueda
    const [paginaActual, setPaginaActual] = useState(1);
    const [totalPaginas, setTotalPaginas] = useState(1);
    const [totalNotificaciones, setTotalNotificaciones] = useState(0);
    const [limite] = useState(10); // Máximo 10 notificaciones por página
    const [busqueda, setBusqueda] = useState('');
    const [busquedaActiva, setBusquedaActiva] = useState(''); // Para aplicar búsqueda con delay
    
    // Estados para filtros (comboboxes)
    const [filtroTiempo, setFiltroTiempo] = useState<FiltroTiempo>('todo');
    const [filtroPrioridad, setFiltroPrioridad] = useState<'alta' | 'media' | 'baja' | 'todas'>('todas');

    /**
     * Carga las notificaciones desde el backend con paginación
     * Lógica simplificada para 3 pestañas: IMPORTANTES, PENDIENTES, LEIDAS
     */
    const cargarNotificaciones = useCallback(async (pagina: number = paginaActual) => {
        if (!user?.id) return;

        try {
            setIsLoading(true);
            
            // Determinar filtros según la pestaña activa
            let filtroLeidas: boolean | undefined = undefined;

            if (filterTab === 'pendientes') {
                // PENDIENTES: Todas las notificaciones NO LEÍDAS
                filtroLeidas = false;
            } else if (filterTab === 'leidas') {
                // LEIDAS: Solo notificaciones YA LEÍDAS
                filtroLeidas = true;
            }

            const response = await obtenerMisNotificaciones({
                id_usuario: user.id,
                pagina,
                limite,
                busqueda: busquedaActiva,
                prioridad: filtroPrioridad !== 'todas' ? filtroPrioridad : undefined,
                no_leidas: filtroLeidas === false ? true : (filtroLeidas === true ? false : undefined),
                filtroTiempo: filtroTiempo !== 'todo' ? filtroTiempo : undefined,
                categoria: filterTab,
            });

            // El backend ya hace el filtrado correcto, solo mapeamos
            let notifsMapeadas = response.notificaciones.map(mapearNotificacion);

            setNotificaciones(notifsMapeadas);
            
            // Actualizar información de paginación
            if (response.total !== undefined) {
                setTotalNotificaciones(response.total);
                setTotalPaginas(Math.ceil(response.total / limite));
            }
        } catch (error: any) {
            console.error('Error al cargar notificaciones:', error);
            toast.error('Error al cargar las notificaciones');
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, paginaActual, limite, busquedaActiva, filterTab, filtroTiempo, filtroPrioridad]);

    /**
     * Carga las estadísticas desde el backend
     */
    const cargarEstadisticas = useCallback(async () => {
        if (!user?.id) return;

        try {
            const estadisticas = await obtenerEstadisticas(user.id);
            setStats({
                total: estadisticas.total,
                pendientes: estadisticas.no_leidas,
                leidas: estadisticas.leidas,
                eliminadas: 0, // El backend no maneja eliminadas, se eliminan permanentemente
            });

            // Notificar cambios en el contador (callback prop)
            if (onNotificacionesChange) {
                onNotificacionesChange(estadisticas.no_leidas);
            }

            // Actualizar el contexto global
            actualizarContador();
        } catch (error: any) {
            console.error('Error al cargar estadísticas:', error);
        }
    }, [user?.id, onNotificacionesChange, actualizarContador]);

    /**
     * Efecto para manejar el debounce de búsqueda
     */
    useEffect(() => {
        const timer = setTimeout(() => {
            setBusquedaActiva(busqueda);
            setPaginaActual(1); // Resetear a la primera página al buscar
        }, 500); // 500ms de delay

        return () => clearTimeout(timer);
    }, [busqueda]);

    /**
     * Efecto para recargar cuando cambia la búsqueda activa o la página
     */
    useEffect(() => {
        cargarNotificaciones(paginaActual);
    }, [busquedaActiva, paginaActual, filterTab, filtroTiempo, filtroPrioridad]);

    /**
     * Carga inicial y polling de estadísticas
     */
    useEffect(() => {
        cargarEstadisticas();

        // Polling cada 30 segundos solo para estadísticas
        const interval = setInterval(() => {
            cargarEstadisticas();
        }, 30000);

        return () => clearInterval(interval);
    }, [cargarEstadisticas]);

    /**
     * Función para cambiar de página
     */
    const cambiarPagina = (nuevaPagina: number) => {
        if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
            setPaginaActual(nuevaPagina);
        }
    };

    /**
     * Función para cambiar de pestaña y resetear paginación
     */
    const cambiarTab = (nuevoTab: CategoriaNotificacion) => {
        setFilterTab(nuevoTab);
        setPaginaActual(1);
    };

    /**
     * Función para cambiar el filtro de tiempo
     */
    const cambiarFiltroTiempo = (nuevoFiltro: FiltroTiempo) => {
        setFiltroTiempo(nuevoFiltro);
        setPaginaActual(1);
    };

    /**
     * Función para cambiar el filtro de prioridad
     */
    const cambiarFiltroPrioridad = (nuevaPrioridad: 'alta' | 'media' | 'baja' | 'todas') => {
        setFiltroPrioridad(nuevaPrioridad);
        setPaginaActual(1);
    };

    /**
     * Marca una notificación como leída
     */
    const marcarComoLeidaLocal = async (id: number) => {
        try {
            await marcarComoLeida(id);
            
            // Actualizar estado local
            setNotificaciones(notificaciones.map(n =>
                n.id === id ? { ...n, leida: true } : n
            ));

            // Actualizar estadísticas y recargar
            await cargarEstadisticas();
            await cargarNotificaciones(paginaActual);
            
            toast.success('Notificación marcada como leída');
        } catch (error: any) {
            console.error('Error al marcar como leída:', error);
            toast.error('Error al marcar la notificación como leída');
        }
    };

    /**
     * Marca todas las notificaciones como leídas
     */
    const marcarTodasComoLeidasLocal = async () => {
        if (!user?.id) return;

        try {
            const result = await marcarTodasComoLeidas(user.id);
            
            // Actualizar estado local
            setNotificaciones(notificaciones.map(n => ({ ...n, leida: true })));

            // Actualizar estadísticas y recargar
            await cargarEstadisticas();
            await cargarNotificaciones(paginaActual);
            
            toast.success(`${result.cantidad} notificación(es) marcada(s) como leída(s)`);
        } catch (error: any) {
            console.error('Error al marcar todas como leídas:', error);
            toast.error('Error al marcar las notificaciones como leídas');
        }
    };

    /**
     * Elimina una notificación permanentemente
     */
    const eliminarNotificacion = async (id: number) => {
        try {
            await eliminarNotificacionAPI(id);
            
            // Actualizar estado local
            setNotificaciones(notificaciones.filter(n => n.id !== id));

            // Actualizar estadísticas y recargar
            await cargarEstadisticas();
            await cargarNotificaciones(paginaActual);
            
            toast.success('Notificación eliminada');
        } catch (error: any) {
            console.error('Error al eliminar notificación:', error);
            toast.error('Error al eliminar la notificación');
        }
    };

    /**
     * Las notificaciones ya vienen filtradas del backend según la pestaña activa
     * No necesitamos filtrado adicional en el frontend
     */
    const filteredNotificaciones = notificaciones;

    return {
        notificaciones,
        filterTab,
        setFilterTab: cambiarTab,
        marcarComoLeida: marcarComoLeidaLocal,
        marcarTodasComoLeidas: marcarTodasComoLeidasLocal,
        eliminarNotificacion,
        filteredNotificaciones,
        stats,
        isLoading,
        recargar: () => cargarNotificaciones(paginaActual),
        // Propiedades para paginación
        paginaActual,
        totalPaginas,
        totalNotificaciones,
        cambiarPagina,
        busqueda,
        setBusqueda,
        // Filtros (comboboxes)
        filtroTiempo,
        setFiltroTiempo: cambiarFiltroTiempo,
        filtroPrioridad,
        setFiltroPrioridad: cambiarFiltroPrioridad,
    };
}
