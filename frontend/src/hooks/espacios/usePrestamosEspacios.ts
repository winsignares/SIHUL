import { useState, useMemo } from 'react';
import type { PrestamoEspacio } from '../../models';
import { Clock, Check, X, TrendingUp } from 'lucide-react';

const initialPrestamos: PrestamoEspacio[] = [
    {
        id: '1',
        solicitante: 'María González',
        email: 'maria.gonzalez@universidad.edu',
        telefono: '+57 300 123 4567',
        espacio: 'Auditorio Central',
        fecha: '2025-10-28',
        horaInicio: '14:00',
        horaFin: '18:00',
        motivo: 'Conferencia sobre Inteligencia Artificial y Machine Learning para estudiantes de ingeniería',
        tipoEvento: 'Conferencia',
        asistentes: 150,
        recursosNecesarios: ['Proyector', 'Micrófono', 'Sonido'],
        estado: 'pendiente',
        fechaSolicitud: '2025-10-20 10:30'
    },
    {
        id: '2',
        solicitante: 'Carlos Ruiz',
        email: 'carlos.ruiz@universidad.edu',
        telefono: '+57 300 987 6543',
        espacio: 'Laboratorio 301',
        fecha: '2025-10-25',
        horaInicio: '18:00',
        horaFin: '20:00',
        motivo: 'Taller de Robótica para estudiantes de primer semestre',
        tipoEvento: 'Taller',
        asistentes: 20,
        recursosNecesarios: ['Computadores', 'Proyector'],
        estado: 'aprobado',
        fechaSolicitud: '2025-10-18 14:20',
        comentariosAdmin: 'Aprobado. Asegurar que el laboratorio esté preparado con los kits de robótica.'
    },
    {
        id: '3',
        solicitante: 'Ana Martínez',
        email: 'ana.martinez@universidad.edu',
        telefono: '+57 300 555 1234',
        espacio: 'Sala de Juntas 1',
        fecha: '2025-10-24',
        horaInicio: '09:00',
        horaFin: '12:00',
        motivo: 'Reunión de Comité de Investigación para revisión de proyectos',
        tipoEvento: 'Reunión',
        asistentes: 12,
        recursosNecesarios: ['Proyector', 'Videoconferencia'],
        estado: 'aprobado',
        fechaSolicitud: '2025-10-17 09:15',
        comentariosAdmin: 'Aprobado. Verificar configuración de videoconferencia.'
    },
    {
        id: '4',
        solicitante: 'Juan Pérez',
        email: 'juan.perez@universidad.edu',
        telefono: '+57 300 777 8888',
        espacio: 'Auditorio Central',
        fecha: '2025-10-26',
        horaInicio: '08:00',
        horaFin: '18:00',
        motivo: 'Simposio de Investigación con ponentes internacionales',
        tipoEvento: 'Simposio',
        asistentes: 250,
        recursosNecesarios: ['Proyector', 'Micrófono', 'Sonido', 'Grabación'],
        estado: 'rechazado',
        fechaSolicitud: '2025-10-19 16:45',
        comentariosAdmin: 'Rechazado. El espacio ya está reservado para exámenes finales ese día.'
    },
    {
        id: '5',
        solicitante: 'Laura Fernández',
        email: 'laura.fernandez@universidad.edu',
        telefono: '+57 300 444 5555',
        espacio: 'Cancha Deportiva 1',
        fecha: '2025-11-05',
        horaInicio: '15:00',
        horaFin: '18:00',
        motivo: 'Torneo Interuniversitario de Fútbol',
        tipoEvento: 'Evento Deportivo',
        asistentes: 100,
        recursosNecesarios: ['Sonido', 'Sillas Adicionales'],
        estado: 'pendiente',
        fechaSolicitud: '2025-10-22 11:00'
    }
];

export function usePrestamosEspacios() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [filterFechaHora, setFilterFechaHora] = useState('todos');
    const [verSolicitudDialog, setVerSolicitudDialog] = useState<string | null>(null);
    const [comentariosAccion, setComentariosAccion] = useState('');
    const [prestamos, setPrestamos] = useState<PrestamoEspacio[]>(initialPrestamos);

    const aprobarSolicitud = (id: string, comentarios: string) => {
        setPrestamos(prestamos.map(p =>
            p.id === id ? { ...p, estado: 'aprobado', comentariosAdmin: comentarios } : p
        ));
        setVerSolicitudDialog(null);
        setComentariosAccion('');
        // Mostrar notificación: ✅ Solicitud aprobada correctamente
    };

    const rechazarSolicitud = (id: string, comentarios: string) => {
        if (!comentarios.trim()) {
            // Mostrar notificación: Debe proporcionar un motivo de rechazo
            return;
        }
        setPrestamos(prestamos.map(p =>
            p.id === id ? { ...p, estado: 'rechazado', comentariosAdmin: comentarios } : p
        ));
        setVerSolicitudDialog(null);
        setComentariosAccion('');
        // Mostrar notificación: ✅ Solicitud rechazada correctamente
    };

    const filteredPrestamos = useMemo(() => {
        return prestamos.filter(p => {
            const matchesSearch = p.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.espacio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.tipoEvento.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;

            let matchesFechaHora = true;
            if (filterFechaHora !== 'todos') {
                const now = new Date();
                const prestamoFecha = new Date(p.fecha + ' ' + p.horaInicio);

                if (filterFechaHora === 'hoy') {
                    matchesFechaHora = prestamoFecha.toDateString() === now.toDateString();
                } else if (filterFechaHora === 'esta-semana') {
                    const inicioSemana = new Date(now);
                    inicioSemana.setDate(now.getDate() - now.getDay());
                    const finSemana = new Date(inicioSemana);
                    finSemana.setDate(inicioSemana.getDate() + 6);
                    matchesFechaHora = prestamoFecha >= inicioSemana && prestamoFecha <= finSemana;
                } else if (filterFechaHora === 'este-mes') {
                    matchesFechaHora = prestamoFecha.getMonth() === now.getMonth() && prestamoFecha.getFullYear() === now.getFullYear();
                } else if (filterFechaHora === 'proximos') {
                    matchesFechaHora = prestamoFecha >= now;
                } else if (filterFechaHora === 'pasados') {
                    matchesFechaHora = prestamoFecha < now;
                }
            }

            return matchesSearch && matchesEstado && matchesFechaHora;
        });
    }, [prestamos, searchTerm, filterEstado, filterFechaHora]);

    const statsData = useMemo(() => [
        {
            title: 'Pendientes',
            value: prestamos.filter(p => p.estado === 'pendiente').length,
            icon: Clock,
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'bg-yellow-50 dark:bg-yellow-950/20',
            textColor: 'text-yellow-600'
        },
        {
            title: 'Aprobadas',
            value: prestamos.filter(p => p.estado === 'aprobado').length,
            icon: Check,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50 dark:bg-green-950/20',
            textColor: 'text-green-600'
        },
        {
            title: 'Rechazadas',
            value: prestamos.filter(p => p.estado === 'rechazado').length,
            icon: X,
            color: 'from-red-500 to-rose-500',
            bgColor: 'bg-red-50 dark:bg-red-950/20',
            textColor: 'text-red-600'
        },
        {
            title: 'Total Solicitudes',
            value: prestamos.length,
            icon: TrendingUp,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50 dark:bg-blue-950/20',
            textColor: 'text-blue-600'
        }
    ], [prestamos]);

    return {
        searchTerm,
        setSearchTerm,
        filterEstado,
        setFilterEstado,
        filterFechaHora,
        setFilterFechaHora,
        verSolicitudDialog,
        setVerSolicitudDialog,
        comentariosAccion,
        setComentariosAccion,
        prestamos,
        filteredPrestamos,
        statsData,
        aprobarSolicitud,
        rechazarSolicitud
    };
}
