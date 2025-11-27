import { useState, useEffect } from 'react';
import type { NotificacionUsuario } from '../../models/users/notification.model';

export function useNotificaciones(onNotificacionesChange?: (count: number) => void) {
    const [notificaciones, setNotificaciones] = useState<NotificacionUsuario[]>([
        {
            id: '1',
            tipo: 'solicitud',
            titulo: 'Solicitud de cambio de aula',
            descripcion: 'El docente Juan Pérez solicita cambio del Aula 101 al Aula 205 para el horario del martes 14:00-16:00',
            fecha: '2025-10-22 10:30',
            leida: false,
            eliminada: false,
            prioridad: 'alta'
        },
        {
            id: '2',
            tipo: 'alerta',
            titulo: 'Conflicto de horario detectado',
            descripcion: 'Se detectó un conflicto en el Laboratorio 301 para el día miércoles entre las 08:00 y 10:00',
            fecha: '2025-10-22 09:15',
            leida: false,
            eliminada: false,
            prioridad: 'alta'
        },
        {
            id: '3',
            tipo: 'mensaje',
            titulo: 'Mensaje de María González',
            descripcion: 'Hola, necesito confirmar la disponibilidad del Auditorio Central para el evento del próximo mes',
            fecha: '2025-10-22 08:45',
            leida: false,
            eliminada: false,
            prioridad: 'media'
        },
        {
            id: '4',
            tipo: 'exito',
            titulo: 'Horario guardado exitosamente',
            descripcion: 'El horario del grupo 1A ha sido guardado correctamente en el sistema',
            fecha: '2025-10-21 18:00',
            leida: false,
            eliminada: false,
            prioridad: 'baja'
        },
        {
            id: '5',
            tipo: 'advertencia',
            titulo: 'Mantenimiento programado',
            descripcion: 'El Laboratorio 401 estará en mantenimiento del 25 al 27 de octubre',
            fecha: '2025-10-21 16:20',
            leida: true,
            eliminada: false,
            prioridad: 'media'
        },
        {
            id: '6',
            tipo: 'error',
            titulo: 'Error al procesar solicitud',
            descripcion: 'No se pudo procesar la solicitud de préstamo del Auditorio debido a un conflicto de horarios',
            fecha: '2025-10-21 14:00',
            leida: true,
            eliminada: false,
            prioridad: 'alta'
        },
        {
            id: '7',
            tipo: 'sistema',
            titulo: 'Actualización del sistema completada',
            descripcion: 'La actualización v2.3.1 se instaló correctamente. Revisa las nuevas funcionalidades en la sección de ayuda.',
            fecha: '2025-10-21 11:30',
            leida: true,
            eliminada: false,
            prioridad: 'baja'
        },
        {
            id: '8',
            tipo: 'exito',
            titulo: 'Reporte mensual generado',
            descripcion: 'El reporte de ocupación de octubre está disponible para descarga',
            fecha: '2025-10-21 09:00',
            leida: true,
            eliminada: false,
            prioridad: 'baja'
        }
    ]);

    const [filterTab, setFilterTab] = useState('todas');

    useEffect(() => {
        const noLeidasCount = notificaciones.filter(n => !n.leida && !n.eliminada).length;
        if (onNotificacionesChange) {
            onNotificacionesChange(noLeidasCount);
        }
    }, [notificaciones, onNotificacionesChange]);

    const marcarComoLeida = (id: string) => {
        setNotificaciones(notificaciones.map(n =>
            n.id === id ? { ...n, leida: true } : n
        ));
    };

    const marcarTodasComoLeidas = () => {
        setNotificaciones(notificaciones.map(n =>
            n.eliminada ? n : { ...n, leida: true }
        ));
    };

    const eliminarNotificacion = (id: string) => {
        setNotificaciones(notificaciones.map(n =>
            n.id === id ? { ...n, eliminada: true } : n
        ));
    };

    const restaurarNotificacion = (id: string) => {
        setNotificaciones(notificaciones.map(n =>
            n.id === id ? { ...n, eliminada: false } : n
        ));
    };

    const eliminarPermanentemente = (id: string) => {
        setNotificaciones(notificaciones.filter(n => n.id !== id));
    };

    const filteredNotificaciones = notificaciones.filter(n => {
        if (filterTab === 'todas') return !n.eliminada;
        if (filterTab === 'pendientes') return !n.leida && !n.eliminada;
        if (filterTab === 'leidas') return n.leida && !n.eliminada;
        if (filterTab === 'eliminadas') return n.eliminada;
        return n.tipo === filterTab && !n.eliminada;
    });

    const stats = {
        total: notificaciones.filter(n => !n.eliminada).length,
        pendientes: notificaciones.filter(n => !n.leida && !n.eliminada).length,
        leidas: notificaciones.filter(n => n.leida && !n.eliminada).length,
        eliminadas: notificaciones.filter(n => n.eliminada).length
    };

    return {
        notificaciones,
        filterTab,
        setFilterTab,
        marcarComoLeida,
        marcarTodasComoLeidas,
        eliminarNotificacion,
        restaurarNotificacion,
        eliminarPermanentemente,
        filteredNotificaciones,
        stats
    };
}
