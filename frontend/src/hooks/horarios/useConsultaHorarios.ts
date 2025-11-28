import { useState } from 'react';
import type { HorarioConsulta } from '../../models/index';

export function useConsultaHorarios() {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDocente, setFilterDocente] = useState('todos');
    const [filterPrograma, setFilterPrograma] = useState('todos');
    const [filterFacultad, setFilterFacultad] = useState('todos');
    const [filterEspacio, setFilterEspacio] = useState('todos');

    const PERIODO_FIJO = '2025-1';

    const horarios: HorarioConsulta[] = [
        { id: '1', dia: 'Lunes', horaInicio: '07:00', horaFin: '09:00', asignatura: 'Programación I', docente: 'Dr. Juan Pérez', grupo: 'INSI-A', programa: 'Ingeniería de Sistemas', facultad: 'Ingeniería', espacio: 'Aula 101' },
        { id: '2', dia: 'Lunes', horaInicio: '09:00', horaFin: '11:00', asignatura: 'Cálculo I', docente: 'Dra. María López', grupo: 'INSI-A', programa: 'Ingeniería de Sistemas', facultad: 'Ingeniería', espacio: 'Aula 101' },
        { id: '3', dia: 'Martes', horaInicio: '07:00', horaFin: '09:00', asignatura: 'Bases de Datos', docente: 'Dr. Juan Pérez', grupo: 'INSI-B', programa: 'Ingeniería de Sistemas', facultad: 'Ingeniería', espacio: 'Lab 301' },
        { id: '4', dia: 'Miércoles', horaInicio: '14:00', horaFin: '16:00', asignatura: 'Gestión Empresarial', docente: 'Mg. Carlos Ruiz', grupo: 'ADEM-A', programa: 'Administración', facultad: 'Ciencias Económicas', espacio: 'Aula 205' },
        { id: '5', dia: 'Jueves', horaInicio: '09:00', horaFin: '11:00', asignatura: 'Contabilidad I', docente: 'Dra. Ana Torres', grupo: 'CONT-A', programa: 'Contaduría', facultad: 'Ciencias Económicas', espacio: 'Aula 110' },
        { id: '6', dia: 'Viernes', horaInicio: '14:00', horaFin: '16:00', asignatura: 'Derecho Civil', docente: 'Dr. Luis Ramírez', grupo: 'DERE-A', programa: 'Derecho', facultad: 'Derecho', espacio: 'Aula 302' }
    ];

    const docentes = ['todos', ...new Set(horarios.map(h => h.docente))];
    const programas = ['todos', ...new Set(horarios.map(h => h.programa))];
    const facultades = ['todos', ...new Set(horarios.map(h => h.facultad))];
    const espacios = ['todos', ...new Set(horarios.map(h => h.espacio))];

    const filteredHorarios = horarios.filter(h => {
        const matchesSearch = h.asignatura.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.docente.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.programa.toLowerCase().includes(searchTerm.toLowerCase()) ||
            h.espacio.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesDocente = filterDocente === 'todos' || h.docente === filterDocente;
        const matchesPrograma = filterPrograma === 'todos' || h.programa === filterPrograma;
        const matchesFacultad = filterFacultad === 'todos' || h.facultad === filterFacultad;
        const matchesEspacio = filterEspacio === 'todos' || h.espacio === filterEspacio;
        return matchesSearch && matchesDocente && matchesPrograma && matchesFacultad && matchesEspacio;
    });

    const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

    const clearFilters = () => {
        setSearchTerm('');
        setFilterDocente('todos');
        setFilterPrograma('todos');
        setFilterFacultad('todos');
        setFilterEspacio('todos');
    };

    return {
        searchTerm,
        setSearchTerm,
        filterDocente,
        setFilterDocente,
        filterPrograma,
        setFilterPrograma,
        filterFacultad,
        setFilterFacultad,
        filterEspacio,
        setFilterEspacio,
        PERIODO_FIJO,
        horarios,
        docentes,
        programas,
        facultades,
        espacios,
        filteredHorarios,
        dias,
        clearFilters
    };
}
