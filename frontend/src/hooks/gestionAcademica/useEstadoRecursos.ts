import { useState, useEffect } from 'react';
import { espacioService, espacioPermitidoService, type EspacioFisico } from '../../services/espacios/espaciosAPI';
import type { Sede } from '../../services/sedes/sedeAPI';
import { sedeService } from '../../services/sedes/sedeAPI';
import {
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Monitor,
    Wifi,
    Volume2,
    Projector,
    AirVent,
    Lightbulb
} from 'lucide-react';

export function useEstadoRecursos() {
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('all');
    const [filtroTipo, setFiltroTipo] = useState<string>('all');
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [espacioSeleccionado, setEspacioSeleccionado] = useState<EspacioFisico | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Obtener usuario actual
            const userStr = localStorage.getItem('user');
            const user = userStr ? JSON.parse(userStr) : null;
            const userId = user?.id;
            const userRole = user?.rol_id; // Asumiendo que el rol está aquí

            let espaciosPromise;

            // Si es Supervisor (rol_id 2, por ejemplo, o verificar lógica de roles)
            // TODO: Verificar ID correcto del rol Supervisor. Asumimos que si no es admin, filtramos.
            // O mejor, intentamos listar permitidos si existe el usuario.

            if (userId) {
                // Intentamos obtener permitidos primero. Si devuelve vacío y es admin, quizás quiera ver todos.
                // Pero para seguridad, si es la vista de Supervisor, debería usar permitidos.
                // Asumiremos que esta vista se usa en contexto de Supervisor si el usuario no es Admin.

                // Para este caso, vamos a usar una lógica simple:
                // Si hay usuario, traemos sus permitidos. Si es admin, el backend de permitidos podría devolver todos o manejamos la lógica aquí.
                // Pero dado el requerimiento "Supervisor General -> Disponibilidad de Espacios",
                // y que "Estado de Recursos" se adapta para él:

                espaciosPromise = espacioPermitidoService.listByUsuario(userId)
                    .then(res => res.espacios)
                    .catch(() => espacioService.list().then(res => res.espacios)); // Fallback a todos si falla (ej. es admin sin permitidos definidos)
            } else {
                espaciosPromise = espacioService.list().then(res => res.espacios);
            }

            const [espaciosData, sedesRes] = await Promise.all([
                espaciosPromise,
                sedeService.listarSedes()
            ]);

            const sedesData = (sedesRes as any).sedes || (Array.isArray(sedesRes) ? sedesRes : []);

            setEspacios(espaciosData || []);
            setSedes(sedesData);
        } catch (error) {
            console.error('Error loading data:', error);
            setEspacios([]);
        } finally {
            setLoading(false);
        }
    };

    // Iconos para recursos
    const getRecursoIcon = (recurso: string) => {
        const recursoLower = recurso.toLowerCase();
        if (recursoLower.includes('computador') || recursoLower.includes('pc')) {
            return { component: Monitor, props: { className: "w-4 h-4" } };
        }
        if (recursoLower.includes('proyector')) {
            return { component: Projector, props: { className: "w-4 h-4" } };
        }
        if (recursoLower.includes('wifi') || recursoLower.includes('internet')) {
            return { component: Wifi, props: { className: "w-4 h-4" } };
        }
        if (recursoLower.includes('audio') || recursoLower.includes('sonido')) {
            return { component: Volume2, props: { className: "w-4 h-4" } };
        }
        if (recursoLower.includes('aire') || recursoLower.includes('clima')) {
            return { component: AirVent, props: { className: "w-4 h-4" } };
        }
        return { component: Lightbulb, props: { className: "w-4 h-4" } };
    };

    // Filtrar espacios
    const espaciosFiltrados = espacios.filter(espacio => {
        const matchSearch =
            (espacio.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (espacio.tipo_espacio?.nombre?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        const matchEstado = filtroEstado === 'all' || espacio.estado === filtroEstado;
        const matchTipo = filtroTipo === 'all' || espacio.tipo_espacio?.nombre === filtroTipo;

        return matchSearch && matchEstado && matchTipo;
    });

    // Estadísticas
    const estadisticas = {
        total: espacios.length,
        disponibles: espacios.filter(e => e.estado === 'Disponible').length,
        mantenimiento: espacios.filter(e => e.estado === 'Mantenimiento').length,
        noDisponibles: espacios.filter(e => e.estado === 'No Disponible').length
    };

    // Icono de estado
    const getEstadoIcon = (estado: string) => {
        switch (estado) {
            case 'Disponible':
            case 'disponible':
                return { component: CheckCircle2, props: { className: "w-5 h-5 text-green-600" } };
            case 'Mantenimiento':
            case 'mantenimiento':
                return { component: AlertTriangle, props: { className: "w-5 h-5 text-yellow-600" } };
            case 'Perdido':
            case 'perdido':
                return { component: XCircle, props: { className: "w-5 h-5 text-orange-600" } };
            case 'No Disponible':
            case 'no disponible':
            case 'no_disponible':
                return { component: XCircle, props: { className: "w-5 h-5 text-red-600" } };
            default:
                return null;
        }
    };

    // Función para obtener el badge de estado de recurso
    const getEstadoRecursoBadge = (estado: string) => {
        const estadoLower = estado.toLowerCase();
        switch (estadoLower) {
            case 'disponible':
                return { className: "bg-green-600", label: "Disponible" };
            case 'mantenimiento':
            case 'en mantenimiento':
                return { className: "bg-yellow-600", label: "Mantenimiento" };
            case 'perdido':
                return { className: "bg-orange-600", label: "Perdido" };
            case 'no disponible':
            case 'no_disponible':
                return { className: "bg-red-600", label: "No Disponible" };
            default:
                return { className: "bg-slate-600", label: "Desconocido" };
        }
    };

    // Función para obtener recursos con estado desde el backend
    const getRecursosConEstado = (espacio: EspacioFisico) => {
        // El backend ya retorna los recursos con su estado
        if (espacio.recursos && espacio.recursos.length > 0) {
            return espacio.recursos.map(r => ({
                nombre: r.nombre,
                estado: r.estado
            }));
        }
        return [];
    };

    const verDetalles = (espacio: EspacioFisico) => {
        setEspacioSeleccionado(espacio);
        setShowDetallesModal(true);
    };

    // Get sede name helper
    const getSedeNombre = (sedeId: number) => {
        const sede = sedes.find(s => s.id === sedeId);
        return sede?.nombre || 'Sede desconocida';
    };

    // Get all unique tipos from espacios
    const tiposDisponibles = Array.from(
        new Set(espacios.map(e => e.tipo_espacio?.nombre).filter(Boolean))
    ) as string[];

    return {
        espacios,
        searchTerm, setSearchTerm,
        filtroEstado, setFiltroEstado,
        filtroTipo, setFiltroTipo,
        showDetallesModal, setShowDetallesModal,
        espacioSeleccionado, setEspacioSeleccionado,
        loadData,
        getRecursoIcon,
        espaciosFiltrados,
        estadisticas,
        getEstadoIcon,
        getEstadoRecursoBadge,
        getRecursosConEstado,
        verDetalles,
        getSedeNombre,
        tiposDisponibles,
        loading
    };
}
