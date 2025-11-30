import { useState, useEffect } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { apiClient } from '../../core/apiClient';
import { userService, rolService, type Usuario, type Rol } from '../../services/users/authService';

export function useGestionUsuarios() {
    const { notification, showNotification } = useNotification();

    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRol, setFilterRol] = useState('todos');

    // Estados de diálogos
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);

    // Estados para creación de usuario
    const [nuevoUsuario, setNuevoUsuario] = useState<Partial<Usuario>>({
        nombre: '',
        correo: '',
        contrasena: '',
        rol_id: null,
        activo: true
    });

    // Estados para datos dinámicos desde backend
    const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
    const [facultadesDisponibles, setFacultadesDisponibles] = useState<Array<{ id: number, nombre: string }>>([]);
    const [espaciosDisponibles, setEspaciosDisponibles] = useState<Array<{ id: number, nombre: string }>>([]);

    // Estados para espacios permitidos (solo supervisor_general)
    const [espacioSeleccionado, setEspacioSeleccionado] = useState('');
    const [espaciosPermitidos, setEspaciosPermitidos] = useState<number[]>([]);
    const [espacioSeleccionadoEdit, setEspacioSeleccionadoEdit] = useState('');
    const [espaciosPermitidosEdit, setEspaciosPermitidosEdit] = useState<number[]>([]);

    // Estado para facultad seleccionada (solo planeacion_facultad)
    const [facultadSeleccionada, setFacultadSeleccionada] = useState<number | null>(null);
    const [facultadSeleccionadaEdit, setFacultadSeleccionadaEdit] = useState<number | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await Promise.all([
            loadUsuarios(),
            loadRoles(),
            loadFacultades(),
            loadEspacios()
        ]);
    };

    // Cargar usuarios desde backend
    const loadUsuarios = async () => {
        try {
            const response = await userService.listarUsuarios();
            setUsuarios(response.usuarios || []);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            showNotification('Error al cargar usuarios', 'error');
        }
    };

    // Cargar roles desde backend
    const loadRoles = async () => {
        try {
            const response = await rolService.listarRoles();
            setRolesDisponibles(response.roles || []);
        } catch (error) {
            console.error('Error cargando roles:', error);
        }
    };

    // Cargar facultades desde backend
    const loadFacultades = async () => {
        try {
            const response = await apiClient.get<{ facultades: Array<{ id: number, nombre: string }> }>('/facultades/list/');
            setFacultadesDisponibles(response.facultades || []);
        } catch (error) {
            console.error('Error cargando facultades:', error);
        }
    };

    // Cargar espacios desde backend
    const loadEspacios = async () => {
        try {
            const response = await apiClient.get<{ espacios: Array<{ id: number, nombre: string }> }>('/espacios/list/');
            setEspaciosDisponibles(response.espacios || []);
        } catch (error) {
            console.error('Error cargando espacios:', error);
        }
    };

    // Funciones para manejar espacios permitidos (Creación)
    const agregarEspacioPermitido = () => {
        if (espacioSeleccionado && !espaciosPermitidos.includes(parseInt(espacioSeleccionado))) {
            setEspaciosPermitidos([...espaciosPermitidos, parseInt(espacioSeleccionado)]);
            setEspacioSeleccionado('');
        }
    };

    const eliminarEspacioPermitido = (espacioId: number) => {
        setEspaciosPermitidos(espaciosPermitidos.filter(id => id !== espacioId));
    };

    // Funciones para manejar espacios permitidos (Edición)
    const agregarEspacioPermitidoEdit = () => {
        if (espacioSeleccionadoEdit && !espaciosPermitidosEdit.includes(parseInt(espacioSeleccionadoEdit))) {
            setEspaciosPermitidosEdit([...espaciosPermitidosEdit, parseInt(espacioSeleccionadoEdit)]);
            setEspacioSeleccionadoEdit('');
        }
    };

    const eliminarEspacioPermitidoEdit = (espacioId: number) => {
        setEspaciosPermitidosEdit(espaciosPermitidosEdit.filter(id => id !== espacioId));
    };

    // Crear usuario
    const crearUsuario = async () => {
        if (!nuevoUsuario.nombre || !nuevoUsuario.correo || !nuevoUsuario.contrasena || !nuevoUsuario.rol_id) {
            showNotification('Por favor complete todos los campos obligatorios', 'error');
            return;
        }

        try {
            // Si es supervisor_general, incluir espacios permitidos
            const rol = rolesDisponibles.find(r => r.id === nuevoUsuario.rol_id);
            const espaciosPayload = (rol?.nombre === 'supervisor_general') ? espaciosPermitidos : [];

            await userService.crearUsuario({
                nombre: nuevoUsuario.nombre,
                correo: nuevoUsuario.correo,
                contrasena: nuevoUsuario.contrasena,
                rol_id: nuevoUsuario.rol_id,
                facultad_id: facultadSeleccionada,
                activo: true,
                espacios_permitidos: espaciosPayload
            });

            showNotification('Usuario creado exitosamente', 'success');
            setDialogOpen(false);
            resetNuevoUsuario();
            loadUsuarios();
        } catch (error: any) {
            console.error('Error creando usuario:', error);
            showNotification(error.message || 'Error al crear usuario', 'error');
        }
    };

    // Actualizar usuario
    const actualizarUsuario = async () => {
        if (!editingUser) return;

        try {
            // Si es supervisor_general, incluir espacios permitidos
            const rolId = editingUser.rol_id || editingUser.rol?.id;
            const rol = rolesDisponibles.find(r => r.id === rolId);
            const espaciosPayload = (rol?.nombre === 'supervisor_general') ? espaciosPermitidosEdit : [];

            await userService.actualizarUsuario({
                ...editingUser,
                facultad_id: facultadSeleccionadaEdit,
                espacios_permitidos: espaciosPayload
            });

            showNotification('Usuario actualizado exitosamente', 'success');
            setEditDialogOpen(false);
            resetEditStates();
            loadUsuarios();
        } catch (error: any) {
            console.error('Error actualizando usuario:', error);
            showNotification(error.message || 'Error al actualizar usuario', 'error');
        }
    };

    // Cambiar estado de usuario
    const cambiarEstadoUsuario = async (id: number) => {
        try {
            const usuario = usuarios.find(u => u.id === id);
            if (!usuario) return;

            await userService.actualizarUsuario({ ...usuario, activo: !usuario.activo });
            showNotification(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'} exitosamente`, 'success');
            loadUsuarios();
        } catch (error) {
            console.error('Error cambiando estado:', error);
            showNotification('Error al cambiar estado del usuario', 'error');
        }
    };

    // Eliminar usuario
    const confirmarEliminarUsuario = async () => {
        if (!userToDelete || !userToDelete.id) return;

        try {
            await userService.eliminarUsuario(userToDelete.id as number);
            showNotification('Usuario eliminado exitosamente', 'success');
            setDeleteDialogOpen(false);
            setUserToDelete(null);
            loadUsuarios();
        } catch (error) {
            console.error('Error eliminando usuario:', error);
            showNotification('Error al eliminar usuario', 'error');
        }
    };

    // Abrir edición
    const abrirEdicion = async (usuario: Usuario) => {
        // Resolver el rol completo usando rol_id si es necesario
        const rolId = usuario.rol_id || usuario.rol?.id;
        const rolNombre = usuario.rol?.nombre || rolesDisponibles.find(r => r.id === rolId)?.nombre;

        // Resolver facultad_id
        const facultadId = usuario.facultad_id || usuario.facultad?.id || null;

        const usuarioConDatosCompletos = {
            ...usuario,
            rol_id: rolId,
            facultad_id: facultadId,
            rol: usuario.rol || rolesDisponibles.find(r => r.id === rolId) // Asegurar que el objeto rol exista si es posible
        };

        setEditingUser(usuarioConDatosCompletos);
        setFacultadSeleccionadaEdit(facultadId);

        // Cargar espacios permitidos si es supervisor_general
        if (rolNombre === 'supervisor_general') {
            try {
                // Usar el endpoint correcto: /espacios/permitido/usuario/<id>/
                const response = await apiClient.get<{ espacios: any[] }>(`/espacios/permitido/usuario/${usuario.id}/`);
                // El endpoint retorna objetos de espacio completos con ID, nombre, etc.
                const espaciosIds = response.espacios.map(e => e.id);
                setEspaciosPermitidosEdit(espaciosIds);
            } catch (error) {
                console.error('Error cargando espacios permitidos:', error);
                setEspaciosPermitidosEdit([]);
            }
        } else {
            setEspaciosPermitidosEdit([]);
        }

        setEditDialogOpen(true);
    };

    // Reset estados
    const resetNuevoUsuario = () => {
        setNuevoUsuario({
            nombre: '',
            correo: '',
            contrasena: '',
            rol_id: null,
            activo: true
        });
        setEspaciosPermitidos([]);
        setFacultadSeleccionada(null);
    };

    const resetEditStates = () => {
        setEditingUser(null);
        setEspaciosPermitidosEdit([]);
        setFacultadSeleccionadaEdit(null);
    };

    // Usuarios filtrados
    const filteredUsuarios = usuarios.filter(user => {
        const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.correo.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRol = filterRol === 'todos' || user.rol?.nombre === filterRol;
        return matchesSearch && matchesRol;
    });

    return {
        searchTerm, setSearchTerm,
        filterRol, setFilterRol,
        dialogOpen, setDialogOpen,
        editDialogOpen, setEditDialogOpen,
        deleteDialogOpen, setDeleteDialogOpen,
        userToDelete, setUserToDelete,
        editingUser, setEditingUser,
        nuevoUsuario, setNuevoUsuario,
        crearUsuario,
        resetNuevoUsuario,
        actualizarUsuario,
        resetEditStates,
        abrirEdicion,
        cambiarEstadoUsuario,
        confirmarEliminarUsuario,
        filteredUsuarios,
        notification,
        // Datos dinámicos
        rolesDisponibles,
        facultadesDisponibles,
        espaciosDisponibles,
        espacioSeleccionado, setEspacioSeleccionado,
        espaciosPermitidos,
        espacioSeleccionadoEdit, setEspacioSeleccionadoEdit,
        espaciosPermitidosEdit,
        facultadSeleccionada, setFacultadSeleccionada,
        facultadSeleccionadaEdit, setFacultadSeleccionadaEdit,
        agregarEspacioPermitido,
        eliminarEspacioPermitido,
        agregarEspacioPermitidoEdit,
        eliminarEspacioPermitidoEdit
    };
}
