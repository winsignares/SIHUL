import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { useUser } from '../../context/UserContext';
import { useNotification } from '../../share/notificationBanner';
import type { HorarioAcademico, Asignatura, EspacioFisico, Docente, Grupo } from '../../models/index';

export interface HorarioExtendido extends HorarioAcademico {
    asignatura: string;
    docente: string;
    grupo: string;
    espacio: string;
}

export function useMiHorario() {
    const { user } = useUser() as unknown as { user: { rol: string; nombre: string; email: string; gruposAsignados?: string[] } };
    const { showNotification } = useNotification();
    const [horarios, setHorarios] = useState<HorarioExtendido[]>([]);
    const [asignaturas, setAsignaturas] = useState<Asignatura[]>([]);
    const [espacios, setEspacios] = useState<EspacioFisico[]>([]);
    const [docentes, setDocentes] = useState<Docente[]>([]);
    const [grupos, setGrupos] = useState<Grupo[]>([]);

    const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const esDocente = user?.rol === 'consultor-docente';
    const esEstudiante = user?.rol === 'consultor-estudiante';

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const todosHorarios = db.getHorarios();
        const todasAsignaturas = db.getAsignaturas();
        const todosEspacios = db.getEspacios();
        const todosDocentes = db.getDocentes();
        const todosGrupos = db.getGrupos();

        setAsignaturas(todasAsignaturas);
        setEspacios(todosEspacios);
        setDocentes(todosDocentes);
        setGrupos(todosGrupos);

        // Filtrar horarios según el rol del usuario
        let horariosFiltrados: HorarioAcademico[] = [];

        if (esDocente) {
            // Filtrar por docente
            const docenteUsuario = todosDocentes.find(d =>
                d.nombre.toLowerCase().includes(user?.nombre.toLowerCase() || '') ||
                d.email === user?.email
            );

            if (docenteUsuario) {
                horariosFiltrados = todosHorarios.filter(h =>
                    h.docenteId === docenteUsuario.id
                );
            }
        } else if (esEstudiante) {
            // Filtrar por grupo del estudiante
            // Asumir que el estudiante tiene asignado un grupo en user.gruposAsignados
            const gruposEstudiante = user?.gruposAsignados || [];

            if (gruposEstudiante.length > 0) {
                horariosFiltrados = todosHorarios.filter(h => {
                    const grupo = todosGrupos.find(g => g.id === h.grupoId);
                    return grupo && gruposEstudiante.includes(grupo.nombre || grupo.codigo);
                });
            }
        }

        // Enriquecer horarios con información adicional
        const horariosEnriquecidos: HorarioExtendido[] = horariosFiltrados.map(h => {
            const asignatura = todasAsignaturas.find(a => a.id === h.asignaturaId);
            const espacio = todosEspacios.find(e => e.id === h.espacioId);
            const docente = todosDocentes.find(d => d.id === h.docenteId);
            const grupo = todosGrupos.find(g => g.id === h.grupoId);

            return {
                ...h,
                asignatura: asignatura?.nombre || 'N/A',
                docente: docente?.nombre || 'N/A',
                grupo: grupo?.nombre || grupo?.codigo || 'N/A',
                espacio: espacio?.nombre || 'N/A'
            } as HorarioExtendido;
        });

        setHorarios(horariosEnriquecidos);
    };

    // Generar horas para el grid semanal
    const generarHoras = () => {
        const horas = [];
        for (let h = 6; h <= 21; h++) {
            horas.push(`${h.toString().padStart(2, '0')}:00`);
        }
        return horas;
    };

    // Obtener clase en una hora específica
    const obtenerClaseEnHora = (dia: string, hora: string) => {
        return horarios.find(h => {
            const diaMatch = h.diaSemana.toLowerCase() === dia.toLowerCase();
            const horaActual = parseInt(hora.split(':')[0]);
            const horaInicio = parseInt(h.horaInicio.split(':')[0]);
            const horaFin = parseInt(h.horaFin.split(':')[0]);
            return diaMatch && horaActual >= horaInicio && horaActual < horaFin;
        });
    };

    const handleDescargarPDF = () => {
        showNotification('Descargando horario en PDF...', 'success');
        // Aquí iría la lógica real de descarga PDF
    };

    const handleDescargarExcel = () => {
        showNotification('Descargando horario en Excel...', 'success');
        // Aquí iría la lógica real de descarga Excel
    };

    const horas = generarHoras();

    return {
        horarios,
        asignaturas,
        espacios,
        docentes,
        grupos,
        diasSemana,
        esDocente,
        esEstudiante,
        horas,
        obtenerClaseEnHora,
        handleDescargarPDF,
        handleDescargarExcel
    };
}
