import { useState } from 'react';
import type { Prestamo } from '../../models/prestamos/prestamo.model';

export function useDocentePrestamos() {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterEstado, setFilterEstado] = useState('todos');

    const [nuevaSolicitud, setNuevaSolicitud] = useState({
        solicitante: 'Roberto Sánchez Torres', // Pre-llenado con nombre del docente
        email: 'docente@unilibre.edu.co',
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
            solicitante: 'Roberto Sánchez Torres',
            email: 'docente@unilibre.edu.co',
            telefono: '+57 300 123 4567',
            espacio: 'Laboratorio 301',
            fecha: '2025-11-15',
            horaInicio: '14:00',
            horaFin: '16:00',
            motivo: 'Práctica de laboratorio adicional para estudiantes de Programación Avanzada',
            tipoEvento: 'Clase Adicional',
            asistentes: 25,
            recursosNecesarios: ['Proyector', 'Computadores'],
            estado: 'aprobado',
            fechaSolicitud: '2025-11-08 09:30',
            comentariosAdmin: 'Aprobado. El laboratorio estará disponible con todos los equipos listos.'
        },
        {
            id: '2',
            solicitante: 'Roberto Sánchez Torres',
            email: 'docente@unilibre.edu.co',
            telefono: '+57 300 123 4567',
            espacio: 'Auditorio Central',
            fecha: '2025-11-20',
            horaInicio: '18:00',
            horaFin: '20:00',
            motivo: 'Conferencia sobre Inteligencia Artificial y Machine Learning',
            tipoEvento: 'Conferencia',
            asistentes: 100,
            recursosNecesarios: ['Proyector', 'Micrófono', 'Sonido'],
            estado: 'pendiente',
            fechaSolicitud: '2025-11-08 10:15'
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
        'Sala de Conferencias',
        'Biblioteca - Sala Grupal'
    ];

    const tiposEvento = [
        'Clase Adicional',
        'Tutoría Grupal',
        'Conferencia',
        'Taller',
        'Reunión Académica',
        'Asesoría de Proyecto',
        'Examen Especial',
        'Evento Cultural',
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
        if (!nuevaSolicitud.espacio || !nuevaSolicitud.fecha || !nuevaSolicitud.horaInicio ||
            !nuevaSolicitud.horaFin || !nuevaSolicitud.motivo || !nuevaSolicitud.tipoEvento) {
            // Mostrar notificación: Por favor complete todos los campos obligatorios
            return;
        }

        setDialogOpen(false);
        setNuevaSolicitud({
            solicitante: 'Roberto Sánchez Torres',
            email: 'docente@unilibre.edu.co',
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
        // Mostrar notificación: Solicitud enviada exitosamente. Será revisada por un administrador.
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
        tiposEvento,
        recursosDisponibles,
        crearSolicitud,
        filteredPrestamos,
        estadisticas
    };
}
