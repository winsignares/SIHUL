import { useState, useEffect } from 'react';
import { db } from '../../hooks/database';
import type { EspacioFisico } from '../../hooks/models';
import { Badge } from '../../share/badge';
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
    const [searchTerm, setSearchTerm] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<string>('all');
    const [filtroTipo, setFiltroTipo] = useState<string>('all');
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [espacioSeleccionado, setEspacioSeleccionado] = useState<EspacioFisico | null>(null);

    useEffect(() => {
        loadEspacios();
    }, []);

    const loadEspacios = () => {
        setEspacios(db.getEspacios());
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
            espacio.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            espacio.codigo.toLowerCase().includes(searchTerm.toLowerCase());

        const matchEstado = filtroEstado === 'all' || espacio.estado === filtroEstado;
        const matchTipo = filtroTipo === 'all' || espacio.tipo === filtroTipo;

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
                return { component: CheckCircle2, props: { className: "w-5 h-5 text-green-600" } };
            case 'Mantenimiento':
                return { component: AlertTriangle, props: { className: "w-5 h-5 text-yellow-600" } };
            case 'Perdido':
                return { component: XCircle, props: { className: "w-5 h-5 text-orange-600" } };
            case 'No Disponible':
                return { component: XCircle, props: { className: "w-5 h-5 text-red-600" } };
            default:
                return null;
        }
    };

    // Función para obtener el badge de estado de recurso
    const getEstadoRecursoBadge = (estado: string) => {
        switch (estado) {
            case 'Disponible':
                return { className: "bg-green-600", label: "Disponible" };
            case 'Mantenimiento':
                return { className: "bg-yellow-600", label: "Mantenimiento" };
            case 'Perdido':
                return { className: "bg-orange-600", label: "Perdido" };
            case 'No Disponible':
                return { className: "bg-red-600", label: "No Disponible" };
            default:
                return { className: "bg-slate-600", label: "Desconocido" };
        }
    };

    // Función para obtener recursos con estado (genera estados aleatorios si no existen)
    const getRecursosConEstado = (espacio: EspacioFisico) => {
        if (espacio.recursosConEstado && espacio.recursosConEstado.length > 0) {
            return espacio.recursosConEstado;
        }

        // Si no hay recursosConEstado, generarlos desde recursos de forma DETERMINÍSTICA
        return espacio.recursos.map((recurso, index) => {
            // Crear un hash simple basado en el ID del espacio y el nombre del recurso
            const seed = espacio.id.charCodeAt(0) + recurso.charCodeAt(0) + index;
            const normalized = (seed % 100) / 100;

            let estado: 'Disponible' | 'Mantenimiento' | 'Perdido' | 'No Disponible';

            if (normalized < 0.7) estado = 'Disponible';
            else if (normalized < 0.85) estado = 'Mantenimiento';
            else if (normalized < 0.95) estado = 'No Disponible';
            else estado = 'Perdido';

            return { nombre: recurso, estado };
        });
    };

    const verDetalles = (espacio: EspacioFisico) => {
        setEspacioSeleccionado(espacio);
        setShowDetallesModal(true);
    };

    return {
        espacios,
        searchTerm, setSearchTerm,
        filtroEstado, setFiltroEstado,
        filtroTipo, setFiltroTipo,
        showDetallesModal, setShowDetallesModal,
        espacioSeleccionado, setEspacioSeleccionado,
        loadEspacios,
        getRecursoIcon,
        espaciosFiltrados,
        estadisticas,
        getEstadoIcon,
        getEstadoRecursoBadge,
        getRecursosConEstado,
        verDetalles
    };
}
