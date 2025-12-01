import { useState, useEffect } from 'react';
import { showNotification } from '../../context/ThemeContext';
import { sedeService } from '../../services/sedes/sedeAPI';
import type { Sede } from '../../services/sedes/sedeAPI';

export function useSedes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sedes, setSedes] = useState<Sede[]>([]);
    const [loading, setLoading] = useState(false);

    // Estados de modales
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    // Estados de formulario
    const [sedeForm, setSedeForm] = useState({ nombre: '', direccion: '', ciudad: '' });
    const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

    // Cargar datos
    useEffect(() => {
        loadSedes();
    }, []);

    const loadSedes = async () => {
        try {
            setLoading(true);
            const response = await sedeService.listarSedes();
            setSedes(response.sedes);
        } catch (error) {
            showNotification({ 
                message: `Error al cargar sedes: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Crear sede
    const handleCreate = async () => {
        if (!sedeForm.nombre.trim()) {
            showNotification({ message: 'El nombre de la sede es obligatorio', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            await sedeService.crearSede({
                nombre: sedeForm.nombre.trim(),
                direccion: sedeForm.direccion.trim() || undefined,
                ciudad: sedeForm.ciudad.trim() || undefined,
                activa: true
            });

            await loadSedes();
            setSedeForm({ nombre: '', direccion: '', ciudad: '' });
            setShowCreate(false);

            showNotification({ message: '✅ Sede registrada exitosamente', type: 'success' });
        } catch (error) {
            showNotification({ 
                message: `Error al crear sede: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Editar sede
    const handleEdit = async () => {
        if (!selectedSede) return;

        if (!sedeForm.nombre.trim()) {
            showNotification({ message: 'El nombre de la sede es obligatorio', type: 'error' });
            return;
        }

        try {
            setLoading(true);
            await sedeService.actualizarSede({
                id: selectedSede.id,
                nombre: sedeForm.nombre.trim(),
                direccion: sedeForm.direccion.trim() || undefined,
                ciudad: sedeForm.ciudad.trim() || undefined,
                activa: selectedSede.activa
            });

            await loadSedes();
            setShowEdit(false);
            setSelectedSede(null);
            setSedeForm({ nombre: '', direccion: '', ciudad: '' });

            showNotification({ message: '✅ Sede actualizada correctamente', type: 'success' });
        } catch (error) {
            showNotification({ 
                message: `Error al actualizar sede: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Eliminar sede
    const handleDelete = async () => {
        if (!selectedSede || !selectedSede.id) return;

        try {
            setLoading(true);
            await sedeService.eliminarSede(selectedSede.id);

            await loadSedes();
            setShowDelete(false);
            setSelectedSede(null);

            showNotification({ message: '✅ Sede eliminada correctamente', type: 'success' });
        } catch (error) {
            showNotification({ 
                message: `Error al eliminar sede: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    // Activar/Inactivar sede
    const toggleActiva = async (sede: Sede) => {
        if (!sede.id) return;

        try {
            setLoading(true);
            await sedeService.actualizarSede({
                ...sede,
                activa: !sede.activa
            });
            
            await loadSedes();

            showNotification({ message: sede.activa ? '✅ Sede inactivada correctamente' : '✅ Sede activada correctamente', type: 'success' });
        } catch (error) {
            showNotification({ 
                message: `Error al cambiar estado de sede: ${error instanceof Error ? error.message : 'Error desconocido'}`, 
                type: 'error' 
            });
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (sede: Sede) => {
        setSelectedSede(sede);
        setSedeForm({ 
            nombre: sede.nombre,
            direccion: sede.direccion || '',
            ciudad: sede.ciudad || ''
        });
        setShowEdit(true);
    };

    const openDelete = (sede: Sede) => {
        setSelectedSede(sede);
        setShowDelete(true);
    };

    // Filtros
    const filteredSedes = sedes.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return {
        searchTerm, setSearchTerm,
        sedes,
        loading,
        showCreate, setShowCreate,
        showEdit, setShowEdit,
        showDelete, setShowDelete,
        sedeForm, setSedeForm,
        selectedSede, setSelectedSede,
        handleCreate,
        handleEdit,
        handleDelete,
        toggleActiva,
        openEdit,
        openDelete,
        filteredSedes
    };
}
