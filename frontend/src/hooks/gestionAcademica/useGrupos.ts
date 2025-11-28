import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { useTheme } from '../../context/ThemeContext';
import type { Programa } from '../../models';

export interface GrupoAcademico {
    id: string;
    codigo: string;
    programaId: string;
    semestre: number;
    activo: boolean;
    fechaCreacion: string;
}

export function useGrupos() {
    const [searchTerm, setSearchTerm] = useState('');
    const [programas, setProgramas] = useState<Programa[]>([]);
    const [grupos, setGrupos] = useState<GrupoAcademico[]>([]);
    const [selectedProgramaFilter, setSelectedProgramaFilter] = useState<string>('all');
    const [selectedSemestreFilter, setSelectedSemestreFilter] = useState<string>('all');

    // Estados de modales
    const [showCreateGrupo, setShowCreateGrupo] = useState(false);
    const [showEditGrupo, setShowEditGrupo] = useState(false);
    const [showDeleteGrupo, setShowDeleteGrupo] = useState(false);
    const [showEstudiantes, setShowEstudiantes] = useState(false);

    // Estados de formularios
    const [grupoForm, setGrupoForm] = useState({
        codigo: '',
        programaId: '',
        semestre: ''
    });

    // Estados de selección
    const [selectedGrupo, setSelectedGrupo] = useState<GrupoAcademico | null>(null);
    const [estudiantesDelGrupo, setEstudiantesDelGrupo] = useState<any[]>([]);
    const { showNotification } = useTheme();

    // Cargar datos
    useEffect(() => {
        loadProgramas();
        loadGrupos();
    }, []);

    const loadProgramas = () => {
        const data = db.getProgramas();
        setProgramas(data);
    };

    const loadGrupos = () => {
        const data = localStorage.getItem('db_grupos_academicos');
        if (data) {
            setGrupos(JSON.parse(data));
        }
    };

    const saveGrupos = (newGrupos: GrupoAcademico[]) => {
        localStorage.setItem('db_grupos_academicos', JSON.stringify(newGrupos));
        setGrupos(newGrupos);
    };

    // ==================== HANDLERS ====================

    const handleCreateGrupo = () => {
        if (!grupoForm.codigo.trim()) {
            showNotification({ message: 'El nombre del grupo es obligatorio', type: 'error' });
            return;
        }
        if (!grupoForm.programaId) {
            showNotification({ message: 'Debe seleccionar un programa', type: 'error' });
            return;
        }
        if (!grupoForm.semestre || Number(grupoForm.semestre) < 1) {
            showNotification({ message: 'Debe especificar el semestre (mínimo 1)', type: 'error' });
            return;
        }

        const existe = grupos.some(g => g.codigo.toLowerCase() === grupoForm.codigo.trim().toLowerCase());
        if (existe) {
            showNotification({ message: 'Ya existe un grupo con este nombre', type: 'error' });
            return;
        }

        const newGrupo: GrupoAcademico = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            codigo: grupoForm.codigo.trim().toUpperCase(),
            programaId: grupoForm.programaId,
            semestre: Number(grupoForm.semestre),
            activo: true,
            fechaCreacion: new Date().toISOString()
        };

        const newGrupos = [...grupos, newGrupo];
        saveGrupos(newGrupos);

        showNotification({ message: 'Grupo creado exitosamente', type: 'success' });
        setShowCreateGrupo(false);
        setGrupoForm({ codigo: '', programaId: '', semestre: '' });
    };

    const openEditGrupo = (grupo: GrupoAcademico) => {
        setSelectedGrupo(grupo);
        setGrupoForm({
            codigo: grupo.codigo,
            programaId: grupo.programaId,
            semestre: grupo.semestre?.toString() || ''
        });
        setShowEditGrupo(true);
    };

    const handleEditGrupo = () => {
        if (!selectedGrupo) return;

        if (!grupoForm.codigo.trim()) {
            showNotification({ message: 'El nombre del grupo es obligatorio', type: 'error' });
            return;
        }
        if (!grupoForm.programaId) {
            showNotification({ message: 'Debe seleccionar un programa', type: 'error' });
            return;
        }
        if (!grupoForm.semestre || Number(grupoForm.semestre) < 1) {
            showNotification({ message: 'Debe especificar el semestre (mínimo 1)', type: 'error' });
            return;
        }

        const existe = grupos.some(g =>
            g.id !== selectedGrupo.id &&
            g.codigo.toLowerCase() === grupoForm.codigo.trim().toLowerCase()
        );
        if (existe) {
            showNotification({ message: 'Ya existe un grupo con este nombre', type: 'error' });
            return;
        }

        const updatedGrupos = grupos.map(g =>
            g.id === selectedGrupo.id
                ? { ...g, codigo: grupoForm.codigo.trim().toUpperCase(), programaId: grupoForm.programaId, semestre: Number(grupoForm.semestre) }
                : g
        );
        saveGrupos(updatedGrupos);

        showNotification({ message: 'Grupo actualizado exitosamente', type: 'success' });
        setShowEditGrupo(false);
        setSelectedGrupo(null);
        setGrupoForm({ codigo: '', programaId: '', semestre: '' });
    };

    const openDeleteGrupo = (grupo: GrupoAcademico) => {
        setSelectedGrupo(grupo);
        setShowDeleteGrupo(true);
    };

    const handleDeleteGrupo = () => {
        if (!selectedGrupo) return;

        const newGrupos = grupos.filter(g => g.id !== selectedGrupo.id);
        saveGrupos(newGrupos);

        showNotification({ message: 'Grupo eliminado exitosamente', type: 'success' });
        setShowDeleteGrupo(false);
        setSelectedGrupo(null);
    };

    const toggleGrupoActivo = (grupo: GrupoAcademico) => {
        const updatedGrupos = grupos.map(g =>
            g.id === grupo.id ? { ...g, activo: !g.activo } : g
        );
        saveGrupos(updatedGrupos);
        showNotification({ message: grupo.activo ? '✅ Grupo inactivado correctamente' : '✅ Grupo activado correctamente', type: 'success' });
    };

    const openVerEstudiantes = (grupo: GrupoAcademico) => {
        setSelectedGrupo(grupo);

        const usuarios = db.getUsuarios();
        const estudiantesConGrupo = usuarios.filter(u =>
            (u.rol === 'consultor_estudiante' || u.rol === 'consultor') &&
            (u as any).gruposAsignados?.includes(grupo.codigo)
        );

        setEstudiantesDelGrupo(estudiantesConGrupo);
        setShowEstudiantes(true);
    };

    // ==================== FILTROS ====================

    const getProgramaNombre = (programaId: string): string => {
        const programa = programas.find(p => p.id === programaId);
        return programa ? programa.nombre : 'Desconocido';
    };

    const filteredGrupos = grupos.filter(grupo => {
        const matchesSearch = grupo.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            getProgramaNombre(grupo.programaId).toLowerCase().includes(searchTerm.toLowerCase());
        const matchesPrograma = selectedProgramaFilter === 'all' || grupo.programaId === selectedProgramaFilter;
        const matchesSemestre = selectedSemestreFilter === 'all' || grupo.semestre?.toString() === selectedSemestreFilter;
        return matchesSearch && matchesPrograma && matchesSemestre;
    });

    const getEstudiantesCount = (codigo: string): number => {
        const usuarios = db.getUsuarios();
        return usuarios.filter(u =>
            (u.rol === 'consultor_estudiante' || u.rol === 'consultor') &&
            (u as any).gruposAsignados?.includes(codigo)
        ).length;
    };

    const semestresDisponibles = Array.from(new Set(grupos.map(g => g.semestre).filter(s => s !== undefined))).sort((a, b) => a - b);

    return {
        searchTerm, setSearchTerm,
        programas,
        grupos,
        selectedProgramaFilter, setSelectedProgramaFilter,
        selectedSemestreFilter, setSelectedSemestreFilter,
        showCreateGrupo, setShowCreateGrupo,
        showEditGrupo, setShowEditGrupo,
        showDeleteGrupo, setShowDeleteGrupo,
        showEstudiantes, setShowEstudiantes,
        grupoForm, setGrupoForm,
        selectedGrupo, setSelectedGrupo,
        estudiantesDelGrupo, setEstudiantesDelGrupo,
        handleCreateGrupo,
        openEditGrupo,
        handleEditGrupo,
        openDeleteGrupo,
        handleDeleteGrupo,
        toggleGrupoActivo,
        openVerEstudiantes,
        getProgramaNombre,
        filteredGrupos,
        getEstudiantesCount,
        semestresDisponibles
    };
}
