import { useState, useEffect } from 'react';
import { db } from '../../services/database';
import { showNotification } from '../../context/ThemeContext';
import type { Sede } from '../../models';

export function useSedes() {
    const [searchTerm, setSearchTerm] = useState('');
    const [sedes, setSedes] = useState<Sede[]>([]);

    // Estados de modales
    const [showCreate, setShowCreate] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    // Estados de formulario
    const [sedeForm, setSedeForm] = useState({ nombre: '' });
    const [selectedSede, setSelectedSede] = useState<Sede | null>(null);

    // Cargar datos
    useEffect(() => {
        loadSedes();
    }, []);

    const loadSedes = () => {
        const data = db.getSedes();
        setSedes(data);
    };

    // Crear sede
    const handleCreate = () => {
        if (!sedeForm.nombre.trim()) {
            showNotification({ message: 'El nombre de la sede es obligatorio', type: 'error' });
            return;
        }

        db.createSede({
            codigo: `SEDE-${Date.now().toString().slice(-4)}`,
            nombre: sedeForm.nombre.trim(),
            activa: true,
            fechaCreacion: new Date().toISOString()
        });

        loadSedes();
        setSedeForm({ nombre: '' });
        setShowCreate(false);

        showNotification({ message: '✅ Sede registrada exitosamente', type: 'success' });
    };

    // Editar sede
    const handleEdit = () => {
        if (!selectedSede) return;

        if (!sedeForm.nombre.trim()) {
            showNotification({ message: 'El nombre de la sede es obligatorio', type: 'error' });
            return;
        }

        db.updateSede(selectedSede.id, {
            nombre: sedeForm.nombre.trim()
        });

        loadSedes();
        setShowEdit(false);
        setSelectedSede(null);
        setSedeForm({ nombre: '' });

        showNotification({ message: '✅ Sede actualizada correctamente', type: 'success' });
    };

    // Eliminar sede
    const handleDelete = () => {
        if (!selectedSede) return;

        db.deleteSede(selectedSede.id);

        loadSedes();
        setShowDelete(false);
        setSelectedSede(null);

        showNotification({ message: '✅ Sede eliminada correctamente', type: 'success' });
    };

    // Activar/Inactivar sede
    const toggleActiva = (sede: Sede) => {
        db.updateSede(sede.id, {
            activa: !sede.activa
        });
        loadSedes();

        showNotification({ message: sede.activa ? '✅ Sede inactivada correctamente' : '✅ Sede activada correctamente', type: 'success' });
    };

    const openEdit = (sede: Sede) => {
        setSelectedSede(sede);
        setSedeForm({ nombre: sede.nombre });
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
