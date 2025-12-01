import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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
            toast.error(`Error al cargar sedes: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Crear sede
    const handleCreate = async () => {
        if (!sedeForm.nombre.trim()) {
            toast.error('El nombre de la sede es obligatorio');
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

            toast.success('Sede registrada exitosamente');
        } catch (error) {
            toast.error(`Error al crear sede: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        } finally {
            setLoading(false);
        }
    };

    // Editar sede
    const handleEdit = async () => {
        if (!selectedSede) return;

        if (!sedeForm.nombre.trim()) {
            toast.error('El nombre de la sede es obligatorio');
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

            toast.info('Sede actualizada correctamente');
        } catch (error) {
            toast.error(`Error al actualizar sede: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

            toast.error('Sede eliminada correctamente');
        } catch (error) {
            toast.error(`Error al eliminar sede: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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

            toast.warning(sede.activa ? 'Sede inactivada correctamente' : 'Sede activada correctamente');
        } catch (error) {
            toast.error(`Error al cambiar estado de sede: ${error instanceof Error ? error.message : 'Error desconocido'}`);
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
