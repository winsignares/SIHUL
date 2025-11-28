import { useState, useMemo } from 'react';
import type { Espacio, HorarioOcupacion } from '../../models';

const espacios: Espacio[] = [
    { id: '1', nombre: 'Aula 101', tipo: 'Aula', capacidad: 40, sede: 'Sede Principal', edificio: 'A', estado: 'disponible', proximaClase: 'Hoy 14:00' },
    { id: '2', nombre: 'Laboratorio 301', tipo: 'Laboratorio', capacidad: 25, sede: 'Sede Principal', edificio: 'C', estado: 'ocupado', proximaClase: 'Hasta 11:00' },
    { id: '3', nombre: 'Auditorio Central', tipo: 'Auditorio', capacidad: 200, sede: 'Sede Principal', edificio: 'B', estado: 'disponible', proximaClase: 'Mañana 09:00' },
    { id: '4', nombre: 'Aula 205', tipo: 'Aula', capacidad: 35, sede: 'Sede Principal', edificio: 'A', estado: 'disponible' },
    { id: '5', nombre: 'Sala de Juntas 1', tipo: 'Sala', capacidad: 15, sede: 'Sede Norte', edificio: 'D', estado: 'disponible', proximaClase: 'Hoy 16:00' },
    { id: '6', nombre: 'Aula 102', tipo: 'Aula', capacidad: 40, sede: 'Sede Principal', edificio: 'A', estado: 'disponible', proximaClase: 'Hoy 15:00' },
    { id: '7', nombre: 'Laboratorio 302', tipo: 'Laboratorio', capacidad: 30, sede: 'Sede Principal', edificio: 'C', estado: 'disponible' },
    { id: '8', nombre: 'Cubículo 101', tipo: 'Cubículo', capacidad: 8, sede: 'Sede Principal', edificio: 'D', estado: 'disponible' },
    { id: '9', nombre: 'Aula 303', tipo: 'Aula', capacidad: 45, sede: 'Sede Principal', edificio: 'A', estado: 'mantenimiento' }
];

const horariosSemanales: HorarioOcupacion[] = [
    // Aula 101
    { espacioId: '1', dia: 'Lunes', horaInicio: 8, horaFin: 10, materia: 'Cálculo I', estado: 'ocupado' },
    { espacioId: '1', dia: 'Lunes', horaInicio: 14, horaFin: 16, materia: 'Álgebra', estado: 'ocupado' },
    { espacioId: '1', dia: 'Martes', horaInicio: 10, horaFin: 12, materia: 'Física I', estado: 'ocupado' },
    { espacioId: '1', dia: 'Miércoles', horaInicio: 8, horaFin: 10, materia: 'Cálculo I', estado: 'ocupado' },
    { espacioId: '1', dia: 'Jueves', horaInicio: 14, horaFin: 16, materia: 'Química', estado: 'ocupado' },
    { espacioId: '1', dia: 'Viernes', horaInicio: 8, horaFin: 12, materia: 'Seminario', estado: 'ocupado' },

    // Laboratorio 301
    { espacioId: '2', dia: 'Lunes', horaInicio: 8, horaFin: 12, materia: 'Lab. Programación', estado: 'ocupado' },
    { espacioId: '2', dia: 'Lunes', horaInicio: 14, horaFin: 18, materia: 'Lab. Redes', estado: 'ocupado' },
    { espacioId: '2', dia: 'Martes', horaInicio: 8, horaFin: 12, materia: 'Lab. BD', estado: 'ocupado' },
    { espacioId: '2', dia: 'Martes', horaInicio: 14, horaFin: 16, materia: 'Lab. IA', estado: 'ocupado' },
    { espacioId: '2', dia: 'Miércoles', horaInicio: 10, horaFin: 14, materia: 'Lab. Web', estado: 'ocupado' },
    { espacioId: '2', dia: 'Jueves', horaInicio: 8, horaFin: 12, materia: 'Lab. Móvil', estado: 'ocupado' },
    { espacioId: '2', dia: 'Viernes', horaInicio: 14, horaFin: 16, materia: 'Mantenimiento', estado: 'mantenimiento' },

    // Auditorio Central
    { espacioId: '3', dia: 'Lunes', horaInicio: 10, horaFin: 12, materia: 'Conferencia', estado: 'ocupado' },
    { espacioId: '3', dia: 'Miércoles', horaInicio: 14, horaFin: 16, materia: 'Seminario', estado: 'ocupado' },
    { espacioId: '3', dia: 'Viernes', horaInicio: 9, horaFin: 11, materia: 'Evento', estado: 'ocupado' },

    // Aula 205
    { espacioId: '4', dia: 'Lunes', horaInicio: 10, horaFin: 12, materia: 'Economía', estado: 'ocupado' },
    { espacioId: '4', dia: 'Martes', horaInicio: 8, horaFin: 10, materia: 'Administración', estado: 'ocupado' },
    { espacioId: '4', dia: 'Martes', horaInicio: 14, horaFin: 16, materia: 'Finanzas', estado: 'ocupado' },
    { espacioId: '4', dia: 'Miércoles', horaInicio: 16, horaFin: 18, materia: 'Marketing', estado: 'ocupado' },
    { espacioId: '4', dia: 'Jueves', horaInicio: 10, horaFin: 12, materia: 'Contabilidad', estado: 'ocupado' },

    // Sala de Juntas 1
    { espacioId: '5', dia: 'Martes', horaInicio: 10, horaFin: 11, materia: 'Reunión Decanatura', estado: 'ocupado' },
    { espacioId: '5', dia: 'Jueves', horaInicio: 14, horaFin: 15, materia: 'Comité Curricular', estado: 'ocupado' },

    // Laboratorio 302
    { espacioId: '7', dia: 'Lunes', horaInicio: 10, horaFin: 12, materia: 'Lab. Química', estado: 'ocupado' },
    { espacioId: '7', dia: 'Martes', horaInicio: 14, horaFin: 16, materia: 'Lab. Física', estado: 'ocupado' },
    { espacioId: '7', dia: 'Miércoles', horaInicio: 8, horaFin: 10, materia: 'Lab. Biología', estado: 'ocupado' },
    { espacioId: '7', dia: 'Jueves', horaInicio: 16, horaFin: 18, materia: 'Lab. Materiales', estado: 'ocupado' },

    // Aula 303 - Mantenimiento
    { espacioId: '9', dia: 'Lunes', horaInicio: 7, horaFin: 18, materia: 'Mantenimiento Programado', estado: 'mantenimiento' },
    { espacioId: '9', dia: 'Martes', horaInicio: 7, horaFin: 18, materia: 'Mantenimiento Programado', estado: 'mantenimiento' },
    { espacioId: '9', dia: 'Miércoles', horaInicio: 7, horaFin: 18, materia: 'Mantenimiento Programado', estado: 'mantenimiento' }
];

export function useConsultaEspacios() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTipo, setFilterTipo] = useState('todos');
    const [filterEstado, setFilterEstado] = useState('todos');
    const [vistaActual, setVistaActual] = useState<'tarjetas' | 'cronograma'>('tarjetas');

    const tiposEspacio = useMemo(() => [...new Set(espacios.map(e => e.tipo))], []);
    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
    const horas = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];

    const filteredEspacios = useMemo(() => {
        return espacios.filter(e => {
            const matchesSearch = e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.edificio.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesTipo = filterTipo === 'todos' || e.tipo === filterTipo;
            const matchesEstado = filterEstado === 'todos' || e.estado === filterEstado;
            return matchesSearch && matchesTipo && matchesEstado;
        });
    }, [searchTerm, filterTipo, filterEstado]);

    const estadisticas = useMemo(() => ({
        total: espacios.length,
        disponibles: espacios.filter(e => e.estado === 'disponible').length,
        ocupados: espacios.filter(e => e.estado === 'ocupado').length,
        mantenimiento: espacios.filter(e => e.estado === 'mantenimiento').length
    }), []);

    const getOcupacionPorHora = (espacioId: string, dia: string, hora: number) => {
        return horariosSemanales.find(h =>
            h.espacioId === espacioId &&
            h.dia === dia &&
            hora >= h.horaInicio &&
            hora < h.horaFin
        );
    };

    const getColorEstado = (estado: 'ocupado' | 'mantenimiento' | 'disponible') => {
        switch (estado) {
            case 'ocupado':
                return 'bg-blue-500 hover:bg-blue-600';
            case 'mantenimiento':
                return 'bg-yellow-500 hover:bg-yellow-600';
            case 'disponible':
                return 'bg-green-500 hover:bg-green-600';
            default:
                return 'bg-slate-200';
        }
    };

    return {
        searchTerm,
        setSearchTerm,
        filterTipo,
        setFilterTipo,
        filterEstado,
        setFilterEstado,
        vistaActual,
        setVistaActual,
        tiposEspacio,
        diasSemana,
        horas,
        filteredEspacios,
        estadisticas,
        getOcupacionPorHora,
        getColorEstado
    };
}
