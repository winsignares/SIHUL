import { useState } from 'react';
import type { Prestamo } from '../../models/index';

export function useConsultaPrestamos() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');

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

    const [prestamos] = useState<Prestamo[]>([
        {
            id: '1',
            solicitante: 'María González',
            email: 'maria.gonzalez@universidad.edu',
            telefono: '+57 300 123 4567',
            espacio: 'Auditorio Central',
            fecha: '2025-10-28',
            horaInicio: '14:00',
            horaFin: '18:00',
            motivo: 'Conferencia sobre Inteligencia Artificial',
            tipoEvento: 'Conferencia',
            asistentes: 150,
            recursosNecesarios: ['Proyector', 'Micrófono', 'Sonido'],
            estado: 'aprobado',
            fechaSolicitud: '2025-10-20 10:30',
            comentariosAdmin: 'Aprobado. El auditorio estará listo con todo el equipo necesario.'
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
            motivo: 'Taller de Robótica',
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
            fecha: '2025-11-05',
            horaInicio: '09:00',
            horaFin: '12:00',
            motivo: 'Reunión de Comité de Investigación',
            tipoEvento: 'Reunión',
            asistentes: 12,
            recursosNecesarios: ['Proyector', 'Videoconferencia'],
            estado: 'pendiente',
            fechaSolicitud: '2025-10-21 09:15'
        }
    ]);

    const espaciosDisponibles = [
        'Auditorio Central',
        'Laboratorio 301',
        'Laboratorio 401',
        'Sala de Juntas 1',
        'Sala de Juntas 2',
        'Aula 101',
        'Aula 205',
        'Cancha Deportiva 1'
    ];

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

    const crearSolicitud = () => {
        if (!nuevaSolicitud.solicitante || !nuevaSolicitud.email || !nuevaSolicitud.espacio ||
            !nuevaSolicitud.fecha || !nuevaSolicitud.horaInicio || !nuevaSolicitud.horaFin ||
            !nuevaSolicitud.motivo || !nuevaSolicitud.tipoEvento) {
            // Faltan campos obligatorios notificación
            return;
        }

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
        // Solicitud creada exitosamente notificación
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
        espaciosDisponibles,
        tiposEvento,
        recursosDisponibles,
        crearSolicitud,
        filteredPrestamos,
        estadisticas
    };
}
