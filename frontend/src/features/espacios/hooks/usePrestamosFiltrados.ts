import { useMemo } from 'react';
import type { PrestamoEspacioUI as PrestamoEspacio } from '../../../models';
import { Clock, Check, X, TrendingUp } from 'lucide-react';

/** Préstamos que cumplen los filtros y los totales por estado. */
export function usePrestamosFiltrados({ prestamos, searchTerm, filterEstado, filterFechaHora, filterFechaEspecifica, filterPeriodo }: {
    prestamos: PrestamoEspacio[];
    searchTerm: string;
    filterEstado: string;
    filterFechaHora: string;
    filterFechaEspecifica: string;
    filterPeriodo: string;
}) {
    const filteredPrestamos = useMemo(() => {
        return prestamos.filter(p => {
            const matchesSearch = p.solicitante.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.espacio.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.tipoEvento.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesEstado = filterEstado === 'todos' || p.estado === filterEstado;
            const matchesPeriodo = filterPeriodo === 'todos' || String(p.periodo_id ?? '') === filterPeriodo;

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
                } else if (filterFechaHora === 'fecha-especifica') {
                    matchesFechaHora = !filterFechaEspecifica || p.fecha === filterFechaEspecifica;
                }
            }

            return matchesSearch && matchesEstado && matchesFechaHora && matchesPeriodo;
        });
    }, [prestamos, searchTerm, filterEstado, filterFechaHora, filterFechaEspecifica, filterPeriodo]);

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

    return { filteredPrestamos, statsData };
}
