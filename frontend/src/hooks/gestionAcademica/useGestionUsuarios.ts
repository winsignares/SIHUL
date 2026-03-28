import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNotification } from '../../share/notificationBanner';
import { apiClient } from '../../core/apiClient';
import { userService, rolService, type Usuario, type Rol } from '../../services/users/authService';
import { espacioService, type TipoEspacio } from '../../services/espacios/espaciosAPI';
import { getSessionCacheData, setSessionCacheData } from '../../core/sessionCache';

const GESTION_USUARIOS_CACHE_KEY = 'gestion-academica-usuarios';
const GESTION_ROLES_CACHE_KEY = 'gestion-academica-roles';
const GESTION_FACULTADES_CACHE_KEY = 'gestion-academica-facultades-usuarios';
const GESTION_ESPACIOS_CACHE_KEY = 'gestion-academica-espacios-usuarios';
const GESTION_SEDES_CACHE_KEY = 'gestion-academica-sedes-usuarios';
const GESTION_TIPOS_ESPACIO_CACHE_KEY = 'gestion-academica-tipos-espacio-usuarios';

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

    // Estados de validación para creación
    const [confirmarCorreo, setConfirmarCorreo] = useState('');
    const [confirmarPassword, setConfirmarPassword] = useState('');
    const [sedeSeleccionada, setSedeSeleccionada] = useState('');

    // Estados para datos dinámicos desde backend
    const [rolesDisponibles, setRolesDisponibles] = useState<Rol[]>([]);
    const [facultadesDisponibles, setFacultadesDisponibles] = useState<Array<{ id: number, nombre: string }>>([]);
    const [espaciosDisponibles, setEspaciosDisponibles] = useState<Array<{ id: number, nombre: string, tipo_id: number }>>([]);
    const [sedesDisponibles, setSedesDisponibles] = useState<Array<{ id: number, nombre: string }>>([]);

    // Estados para espacios permitidos (solo supervisor_general)
    const [espacioSeleccionado, setEspacioSeleccionado] = useState('');
    const [espaciosPermitidos, setEspaciosPermitidos] = useState<number[]>([]);
    const [espacioSeleccionadoEdit, setEspacioSeleccionadoEdit] = useState('');
    const [espaciosPermitidosEdit, setEspaciosPermitidosEdit] = useState<number[]>([]);

    // Estado para facultad seleccionada (solo planeacion_facultad)
    const [facultadSeleccionada, setFacultadSeleccionada] = useState<number | null>(null);
    const [facultadSeleccionadaEdit, setFacultadSeleccionadaEdit] = useState<number | null>(null);

    // Callbacks memorizados para actualizar campos del formulario
    const updateNuevoUsuarioField = useCallback((field: string, value: any) => {
        setNuevoUsuario(prev => ({ ...prev, [field]: value }));
    }, []);

    useEffect(() => {
        loadData();
    }, []);

    // Estados agregados para asignacion por tipo de espacio.
    // Se declaran despues de los hooks originales para mantener orden estable en Fast Refresh.
    const [tiposEspacioDisponibles, setTiposEspacioDisponibles] = useState<TipoEspacio[]>([]);
    const [modoAsignacionSupervisor, setModoAsignacionSupervisor] = useState<'individual' | 'tipo'>('individual');
    const [modoAsignacionSupervisorEdit, setModoAsignacionSupervisorEdit] = useState<'individual' | 'tipo'>('individual');
    const [tipoEspacioSeleccionado, setTipoEspacioSeleccionado] = useState('');
    const [tiposEspacioPermitidos, setTiposEspacioPermitidos] = useState<number[]>([]);
    const [asignarTodosEspaciosPorTipo, setAsignarTodosEspaciosPorTipo] = useState(false);
    const [tipoEspacioSeleccionadoEdit, setTipoEspacioSeleccionadoEdit] = useState('');
    const [tiposEspacioPermitidosEdit, setTiposEspacioPermitidosEdit] = useState<number[]>([]);
    const [asignarTodosEspaciosPorTipoEdit, setAsignarTodosEspaciosPorTipoEdit] = useState(false);

    const loadData = async ({ force = false }: { force?: boolean } = {}) => {
        await Promise.all([
            loadUsuarios({ force }),
            loadRoles({ force }),
            loadFacultades({ force }),
            loadEspacios({ force }),
            loadSedes({ force }),
            loadTiposEspacio({ force })
        ]);
    };

    // Cargar usuarios desde backend
    const loadUsuarios = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedUsuarios = force ? null : getSessionCacheData<Usuario[]>(GESTION_USUARIOS_CACHE_KEY, activeToken);

            if (cachedUsuarios) {
                setUsuarios(cachedUsuarios);
                return;
            }

            const response = await userService.listarUsuarios();
            setUsuarios(response.usuarios || []);
            setSessionCacheData(GESTION_USUARIOS_CACHE_KEY, activeToken, response.usuarios || []);
        } catch (error) {
            console.error('Error cargando usuarios:', error);
            showNotification('Error al cargar usuarios', 'error');
        }
    };

    // Cargar roles desde backend
    const loadRoles = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedRoles = force ? null : getSessionCacheData<Rol[]>(GESTION_ROLES_CACHE_KEY, activeToken);

            if (cachedRoles) {
                setRolesDisponibles(cachedRoles);
                return;
            }

            const response = await rolService.listarRoles();
            setRolesDisponibles(response.roles || []);
            setSessionCacheData(GESTION_ROLES_CACHE_KEY, activeToken, response.roles || []);
        } catch (error) {
            console.error('Error cargando roles:', error);
        }
    };

    // Cargar facultades desde backend
    const loadFacultades = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedFacultades = force
                ? null
                : getSessionCacheData<Array<{ id: number, nombre: string }>>(GESTION_FACULTADES_CACHE_KEY, activeToken);

            if (cachedFacultades) {
                setFacultadesDisponibles(cachedFacultades);
                return;
            }

            const response = await apiClient.get<{ facultades: Array<{ id: number, nombre: string }> }>('/facultades/list/');
            setFacultadesDisponibles(response.facultades || []);
            setSessionCacheData(GESTION_FACULTADES_CACHE_KEY, activeToken, response.facultades || []);
        } catch (error) {
            console.error('Error cargando facultades:', error);
        }
    };

    // Cargar espacios desde backend
    const loadEspacios = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedEspacios = force
                ? null
                : getSessionCacheData<Array<{ id: number, nombre: string, tipo_id: number }>>(GESTION_ESPACIOS_CACHE_KEY, activeToken);

            if (cachedEspacios) {
                setEspaciosDisponibles(cachedEspacios);
                return;
            }

            const response = await espacioService.list();
            const espacios = (response.espacios || []).map((espacio) => ({
                id: espacio.id as number,
                nombre: espacio.nombre,
                tipo_id: espacio.tipo_id
            }));
            setEspaciosDisponibles(espacios);
            setSessionCacheData(GESTION_ESPACIOS_CACHE_KEY, activeToken, espacios);
        } catch (error) {
            console.error('Error cargando espacios:', error);
        }
    };

    // Cargar tipos de espacio desde backend
    const loadTiposEspacio = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedTiposEspacio = force
                ? null
                : getSessionCacheData<TipoEspacio[]>(GESTION_TIPOS_ESPACIO_CACHE_KEY, activeToken);

            if (cachedTiposEspacio) {
                setTiposEspacioDisponibles(cachedTiposEspacio);
                return;
            }

            const response = await espacioService.listTipos();
            setTiposEspacioDisponibles(response.tipos_espacio || []);
            setSessionCacheData(GESTION_TIPOS_ESPACIO_CACHE_KEY, activeToken, response.tipos_espacio || []);
        } catch (error) {
            console.error('Error cargando tipos de espacio:', error);
        }
    };

    // Cargar sedes desde backend
    const loadSedes = async ({ force = false }: { force?: boolean } = {}) => {
        try {
            const activeToken = localStorage.getItem('auth_token');
            const cachedSedes = force
                ? null
                : getSessionCacheData<Array<{ id: number, nombre: string }>>(GESTION_SEDES_CACHE_KEY, activeToken);

            if (cachedSedes) {
                setSedesDisponibles(cachedSedes);
                return;
            }

            const response = await apiClient.get<{ sedes: Array<{ id: number, nombre: string }> }>('/sedes/list/');
            setSedesDisponibles(response.sedes || []);
            setSessionCacheData(GESTION_SEDES_CACHE_KEY, activeToken, response.sedes || []);
        } catch (error) {
            console.error('Error cargando sedes:', error);
        }
    };

    // Funciones para manejar espacios permitidos (Creación)
    const agregarEspacioPermitido = useCallback(() => {
        if (espacioSeleccionado && !espaciosPermitidos.includes(parseInt(espacioSeleccionado))) {
            setEspaciosPermitidos([...espaciosPermitidos, parseInt(espacioSeleccionado)]);
            setEspacioSeleccionado('');
        }
    }, [espacioSeleccionado, espaciosPermitidos]);

    const eliminarEspacioPermitido = useCallback((espacioId: number) => {
        setEspaciosPermitidos(espaciosPermitidos.filter(id => id !== espacioId));
    }, [espaciosPermitidos]);

    // Funciones para manejar tipos de espacio permitidos (Creacion)
    const agregarTipoEspacioPermitido = useCallback(() => {
        if (!tipoEspacioSeleccionado) return;

        if (tipoEspacioSeleccionado === 'todos') {
            setAsignarTodosEspaciosPorTipo(true);
            setTipoEspacioSeleccionado('');
            return;
        }

        const tipoId = parseInt(tipoEspacioSeleccionado, 10);
        if (!tiposEspacioPermitidos.includes(tipoId)) {
            setTiposEspacioPermitidos([...tiposEspacioPermitidos, tipoId]);
        }
        setTipoEspacioSeleccionado('');
    }, [tipoEspacioSeleccionado, tiposEspacioPermitidos]);

    const eliminarTipoEspacioPermitido = useCallback((tipoId: number) => {
        setTiposEspacioPermitidos(tiposEspacioPermitidos.filter(id => id !== tipoId));
    }, [tiposEspacioPermitidos]);

    // Funciones para manejar espacios permitidos (Edición)
    const agregarEspacioPermitidoEdit = useCallback(() => {
        if (espacioSeleccionadoEdit && !espaciosPermitidosEdit.includes(parseInt(espacioSeleccionadoEdit))) {
            setEspaciosPermitidosEdit([...espaciosPermitidosEdit, parseInt(espacioSeleccionadoEdit)]);
            setEspacioSeleccionadoEdit('');
        }
    }, [espacioSeleccionadoEdit, espaciosPermitidosEdit]);

    const eliminarEspacioPermitidoEdit = useCallback((espacioId: number) => {
        setEspaciosPermitidosEdit(espaciosPermitidosEdit.filter(id => id !== espacioId));
    }, [espaciosPermitidosEdit]);

    // Funciones para manejar tipos de espacio permitidos (Edicion)
    const agregarTipoEspacioPermitidoEdit = useCallback(() => {
        if (!tipoEspacioSeleccionadoEdit) return;

        if (tipoEspacioSeleccionadoEdit === 'todos') {
            setAsignarTodosEspaciosPorTipoEdit(true);
            setTipoEspacioSeleccionadoEdit('');
            return;
        }

        const tipoId = parseInt(tipoEspacioSeleccionadoEdit, 10);
        if (!tiposEspacioPermitidosEdit.includes(tipoId)) {
            setTiposEspacioPermitidosEdit([...tiposEspacioPermitidosEdit, tipoId]);
        }
        setTipoEspacioSeleccionadoEdit('');
    }, [tipoEspacioSeleccionadoEdit, tiposEspacioPermitidosEdit]);

    const eliminarTipoEspacioPermitidoEdit = useCallback((tipoId: number) => {
        setTiposEspacioPermitidosEdit(tiposEspacioPermitidosEdit.filter(id => id !== tipoId));
    }, [tiposEspacioPermitidosEdit]);

    const buildEspaciosPayloadPorTipo = useCallback((tiposIds: number[], asignarTodos: boolean) => {
        if (asignarTodos) {
            return espaciosDisponibles.map(e => e.id);
        }

        if (tiposIds.length === 0) {
            return [];
        }

        return espaciosDisponibles
            .filter(e => tiposIds.includes(e.tipo_id))
            .map(e => e.id);
    }, [espaciosDisponibles]);

    // Crear usuario
    const crearUsuario = async () => {
        // Validaciones
        if (!nuevoUsuario.nombre || !nuevoUsuario.correo || !nuevoUsuario.contrasena || !nuevoUsuario.rol_id) {
            showNotification('Por favor complete todos los campos obligatorios', 'error');
            return;
        }

        // Validar correos coinciden
        if (nuevoUsuario.correo !== confirmarCorreo) {
            showNotification('Los correos no coinciden', 'error');
            return;
        }

        // Validar contraseñas coinciden
        if (nuevoUsuario.contrasena !== confirmarPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }

        // Validar sede seleccionada
        if (!sedeSeleccionada) {
            showNotification('Por favor seleccione una sede', 'error');
            return;
        }

        try {
            // Si es supervisor_general, incluir espacios permitidos
            const rol = rolesDisponibles.find(r => r.id === nuevoUsuario.rol_id);
            let espaciosPayload: number[] = [];

            if (rol?.nombre === 'supervisor_general') {
                espaciosPayload = modoAsignacionSupervisor === 'individual'
                    ? espaciosPermitidos
                    : buildEspaciosPayloadPorTipo(tiposEspacioPermitidos, asignarTodosEspaciosPorTipo);
            }

            await userService.crearUsuario({
                nombre: nuevoUsuario.nombre,
                correo: nuevoUsuario.correo,
                contrasena: nuevoUsuario.contrasena,
                rol_id: nuevoUsuario.rol_id,
                facultad_id: facultadSeleccionada,
                activo: true,
                espacios_permitidos: espaciosPayload,
                sede_id: parseInt(sedeSeleccionada)
            });

            showNotification('Usuario creado exitosamente', 'success');
            setDialogOpen(false);
            resetNuevoUsuario();
            loadUsuarios({ force: true });
        } catch (error: any) {
            console.error('Error creando usuario:', error);
            showNotification(error.message || 'Error al crear usuario', 'error');
        }
    };

    // Actualizar usuario
    const actualizarUsuario = async () => {
        if (!editingUser?.id) {
            showNotification('No se pudo identificar el usuario a actualizar', 'error');
            return;
        }

        try {
            // Si es supervisor_general, incluir espacios permitidos
            const rolId = editingUser.rol_id || editingUser.rol?.id;
            const rol = rolesDisponibles.find(r => r.id === rolId);
            let espaciosPayload: number[] = [];

            if (rol?.nombre === 'supervisor_general') {
                espaciosPayload = modoAsignacionSupervisorEdit === 'individual'
                    ? espaciosPermitidosEdit
                    : buildEspaciosPayloadPorTipo(tiposEspacioPermitidosEdit, asignarTodosEspaciosPorTipoEdit);
            }

            await userService.actualizarUsuario({
                id: editingUser.id,
                nombre: editingUser.nombre,
                correo: editingUser.correo,
                contrasena: editingUser.contrasena,
                contrasena_hash: editingUser.contrasena_hash,
                rol_id: editingUser.rol_id,
                facultad_id: facultadSeleccionadaEdit,
                activo: editingUser.activo,
                espacios_permitidos: espaciosPayload
            });

            showNotification('Usuario actualizado exitosamente', 'success');
            setEditDialogOpen(false);
            resetEditStates();
            loadUsuarios({ force: true });
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

            await userService.actualizarUsuario({ id, activo: !usuario.activo });
            showNotification(`Usuario ${!usuario.activo ? 'activado' : 'desactivado'} exitosamente`, 'success');
            loadUsuarios({ force: true });
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
            loadUsuarios({ force: true });
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
                setModoAsignacionSupervisorEdit('individual');
                setTiposEspacioPermitidosEdit([]);
                setAsignarTodosEspaciosPorTipoEdit(false);
            } catch (error) {
                console.error('Error cargando espacios permitidos:', error);
                setEspaciosPermitidosEdit([]);
            }
        } else {
            setEspaciosPermitidosEdit([]);
            setTiposEspacioPermitidosEdit([]);
            setAsignarTodosEspaciosPorTipoEdit(false);
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
        setConfirmarCorreo('');
        setConfirmarPassword('');
        setSedeSeleccionada('');
        setEspaciosPermitidos([]);
        setModoAsignacionSupervisor('individual');
        setTipoEspacioSeleccionado('');
        setTiposEspacioPermitidos([]);
        setAsignarTodosEspaciosPorTipo(false);
        setFacultadSeleccionada(null);
    };

    const resetEditStates = () => {
        setEditingUser(null);
        setEspaciosPermitidosEdit([]);
        setModoAsignacionSupervisorEdit('individual');
        setTipoEspacioSeleccionadoEdit('');
        setTiposEspacioPermitidosEdit([]);
        setAsignarTodosEspaciosPorTipoEdit(false);
        setFacultadSeleccionadaEdit(null);
    };

    // Usuarios filtrados (memoizado para evitar recálculos innecesarios)
    const filteredUsuarios = useMemo(() => {
        return usuarios.filter(user => {
            const matchesSearch = user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.correo.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRol = filterRol === 'todos' || user.rol?.nombre === filterRol;
            return matchesSearch && matchesRol;
        });
    }, [usuarios, searchTerm, filterRol]);

    return {
        searchTerm, setSearchTerm,
        filterRol, setFilterRol,
        dialogOpen, setDialogOpen,
        editDialogOpen, setEditDialogOpen,
        deleteDialogOpen, setDeleteDialogOpen,
        userToDelete, setUserToDelete,
        editingUser, setEditingUser,
        nuevoUsuario, setNuevoUsuario,
        updateNuevoUsuarioField,
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
        sedesDisponibles,
        tiposEspacioDisponibles,
        espacioSeleccionado, setEspacioSeleccionado,
        espaciosPermitidos,
        modoAsignacionSupervisor, setModoAsignacionSupervisor,
        tipoEspacioSeleccionado, setTipoEspacioSeleccionado,
        tiposEspacioPermitidos,
        asignarTodosEspaciosPorTipo, setAsignarTodosEspaciosPorTipo,
        agregarTipoEspacioPermitido,
        eliminarTipoEspacioPermitido,
        espacioSeleccionadoEdit, setEspacioSeleccionadoEdit,
        espaciosPermitidosEdit,
        modoAsignacionSupervisorEdit, setModoAsignacionSupervisorEdit,
        tipoEspacioSeleccionadoEdit, setTipoEspacioSeleccionadoEdit,
        tiposEspacioPermitidosEdit,
        asignarTodosEspaciosPorTipoEdit, setAsignarTodosEspaciosPorTipoEdit,
        agregarTipoEspacioPermitidoEdit,
        eliminarTipoEspacioPermitidoEdit,
        facultadSeleccionada, setFacultadSeleccionada,
        facultadSeleccionadaEdit, setFacultadSeleccionadaEdit,
        agregarEspacioPermitido,
        eliminarEspacioPermitido,
        agregarEspacioPermitidoEdit,
        eliminarEspacioPermitidoEdit,
        // Campos de validación
        confirmarCorreo, setConfirmarCorreo,
        confirmarPassword, setConfirmarPassword,
        sedeSeleccionada, setSedeSeleccionada
    };
}
