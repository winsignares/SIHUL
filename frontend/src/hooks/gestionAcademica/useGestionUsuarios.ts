import { useState, useEffect } from 'react';
import { db } from '../../hooks/database';
import { useNotification } from '../../share/notificationBanner';
import type { Usuario, PermisoComponente } from '../../models/academica';

export const componentesDelSistema = [
    { id: 'dashboard', nombre: 'Dashboard', categoria: 'Principal' },
    { id: 'facultades', nombre: 'Facultades y Programas', categoria: 'Gestión Académica' },
    { id: 'asignaturas', nombre: 'Asignaturas', categoria: 'Gestión Académica' },
    { id: 'grupos', nombre: 'Grupos', categoria: 'Gestión Académica' },
    { id: 'fusion', nombre: 'Fusión de Grupos', categoria: 'Gestión Académica' },
    { id: 'espacios', nombre: 'Espacios Físicos', categoria: 'Gestión Académica' },
    { id: 'horarios', nombre: 'Horarios Académicos', categoria: 'Gestión Académica' },
    { id: 'visualizacion', nombre: 'Visualización de Horarios', categoria: 'Gestión Académica' },
    { id: 'periodos', nombre: 'Períodos Académicos', categoria: 'Gestión Académica' },
    { id: 'prestamos', nombre: 'Préstamos de Espacios', categoria: 'Gestión Académica' },
    { id: 'ocupacion', nombre: 'Ocupación Semanal', categoria: 'Reportes' },
    { id: 'reportes', nombre: 'Reportes Generales', categoria: 'Reportes' },
    { id: 'notificaciones', nombre: 'Notificaciones', categoria: 'Comunicación' },
    { id: 'mensajeria', nombre: 'Mensajería', categoria: 'Comunicación' },
    { id: 'chat', nombre: 'Chat Interno', categoria: 'Comunicación' },
    { id: 'recursos', nombre: 'Gestión de Recursos', categoria: 'Recursos' },
    { id: 'usuarios', nombre: 'Gestión de Usuarios', categoria: 'Administración' },
    { id: 'ajustes', nombre: 'Ajustes', categoria: 'Configuración' }
];

export const programasDisponibles = [
    'Ingeniería de Sistemas',
    'Medicina',
    'Derecho',
    'Salud',
    'Administración',
    'Contaduría',
    'Psicología',
    'Arquitectura'
];

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
        email: '',
        password: '',
        rol: 'consultor',
        permisos: [],
        programasRestringidos: [],
        accesoTodosProgramas: false
    });

    // Estados para agregación dinámica de componentes (Creación)
    const [componenteSeleccionado, setComponenteSeleccionado] = useState('');
    const [permisoSeleccionado, setPermisoSeleccionado] = useState<'ver' | 'editar'>('ver');
    const [mostrandoComponentes, setMostrandoComponentes] = useState(true);
    const [componenteEnEdicion, setComponenteEnEdicion] = useState<PermisoComponente | null>(null);

    // Estados para agregación dinámica de programas (Creación)
    const [programaSeleccionado, setProgramaSeleccionado] = useState('');
    const [mostrandoProgramas, setMostrandoProgramas] = useState(true);
    const [accesoTodosProgramas, setAccesoTodosProgramas] = useState(false);

    // Estados para agregación dinámica de componentes (Edición)
    const [componenteSeleccionadoEdit, setComponenteSeleccionadoEdit] = useState('');
    const [permisoSeleccionadoEdit, setPermisoSeleccionadoEdit] = useState<'ver' | 'editar'>('ver');
    const [mostrandoComponentesEdit, setMostrandoComponentesEdit] = useState(true);
    const [componenteEnEdicionEdit, setComponenteEnEdicionEdit] = useState<PermisoComponente | null>(null);

    // Estados para agregación dinámica de programas (Edición)
    const [programaSeleccionadoEdit, setProgramaSeleccionadoEdit] = useState('');
    const [mostrandoProgramasEdit, setMostrandoProgramasEdit] = useState(true);
    const [accesoTodosProgramasEdit, setAccesoTodosProgramasEdit] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = () => {
        const users = db.getUsuarios();
        if (users.length === 0) {
            // Seed initial users if empty
            const initialUsers: Usuario[] = [
                {
                    id: '1',
                    nombre: 'María González',
                    email: 'admin@unilibre.edu.co',
                    password: 'admin123',
                    rol: 'admin',
                    activo: true,
                    fechaCreacion: '2024-01-15',
                    ultimoAcceso: '2025-11-01 14:30',
                    permisos: componentesDelSistema.map(c => ({
                        componenteId: c.id,
                        permiso: 'editar' as const
                    })),
                    programasRestringidos: [],
                    accesoTodosProgramas: true
                },
                {
                    id: '2',
                    nombre: 'Roberto Medina',
                    email: 'autorizado@unilibre.edu.co',
                    password: 'auto123',
                    rol: 'autorizado',
                    activo: true,
                    fechaCreacion: '2024-03-20',
                    ultimoAcceso: '2025-11-01 10:15',
                    permisos: [
                        { componenteId: 'dashboard', permiso: 'ver' },
                        { componenteId: 'horarios', permiso: 'editar' },
                        { componenteId: 'visualizacion', permiso: 'ver' },
                        { componenteId: 'prestamos', permiso: 'editar' },
                        { componenteId: 'ocupacion', permiso: 'ver' },
                        { componenteId: 'reportes', permiso: 'ver' }
                    ],
                    programasRestringidos: ['Ingeniería de Sistemas', 'Derecho'],
                    accesoTodosProgramas: false
                },
                {
                    id: '3',
                    nombre: 'Carlos Ramírez',
                    email: 'consultor@unilibre.edu.co',
                    password: 'consultor123',
                    rol: 'consultor',
                    activo: true,
                    fechaCreacion: '2024-05-10',
                    ultimoAcceso: '2025-10-31 16:45',
                    permisos: [
                        { componenteId: 'dashboard', permiso: 'ver' },
                        { componenteId: 'facultades', permiso: 'ver' },
                        { componenteId: 'grupos', permiso: 'ver' },
                        { componenteId: 'espacios', permiso: 'ver' },
                        { componenteId: 'horarios', permiso: 'ver' },
                        { componenteId: 'ocupacion', permiso: 'ver' },
                        { componenteId: 'reportes', permiso: 'ver' }
                    ],
                    programasRestringidos: [],
                    accesoTodosProgramas: true
                }
            ];
            initialUsers.forEach(u => db.createUsuario(u));
            setUsuarios(initialUsers);
        } else {
            setUsuarios(users);
        }
    };

    const cargarPermisosPorRol = (rol: Usuario['rol']) => {
        let permisos: PermisoComponente[] = [];
        let accesoTotal = false;

        if (rol === 'admin') {
            permisos = componentesDelSistema.map(c => ({
                componenteId: c.id,
                permiso: 'editar' as const
            }));
            accesoTotal = true;
        } else if (rol === 'autorizado') {
            const componentesAutorizado = ['dashboard', 'horarios', 'visualizacion', 'prestamos', 'ocupacion', 'reportes'];
            permisos = componentesDelSistema
                .filter(c => componentesAutorizado.includes(c.id))
                .map(c => ({
                    componenteId: c.id,
                    permiso: c.id === 'horarios' || c.id === 'prestamos' ? 'editar' as const : 'ver' as const
                }));
            accesoTotal = false;
        } else if (rol === 'consultor') {
            const componentesConsultor = ['dashboard', 'facultades', 'grupos', 'espacios', 'horarios', 'ocupacion', 'reportes'];
            permisos = componentesDelSistema
                .filter(c => componentesConsultor.includes(c.id))
                .map(c => ({
                    componenteId: c.id,
                    permiso: 'ver' as const
                }));
            accesoTotal = true;
        } else if (rol === 'consultor_estudiante') {
            const componentesEstudiante = ['dashboard', 'horarios'];
            permisos = componentesDelSistema
                .filter(c => componentesEstudiante.includes(c.id))
                .map(c => ({
                    componenteId: c.id,
                    permiso: 'ver' as const
                }));
            accesoTotal = false;
        } else if (rol === 'consultor_docente') {
            const componentesDocente = ['dashboard', 'horarios'];
            permisos = componentesDelSistema
                .filter(c => componentesDocente.includes(c.id))
                .map(c => ({
                    componenteId: c.id,
                    permiso: c.id === 'horarios' ? 'editar' as const : 'ver' as const
                }));
            accesoTotal = false;
        }

        setNuevoUsuario({ ...nuevoUsuario, rol, permisos });
        setAccesoTodosProgramas(accesoTotal);
    };

    // Funciones para creación
    const agregarComponente = () => {
        if (!componenteSeleccionado) {
            showNotification('Seleccione un componente', 'error');
            return;
        }

        if (nuevoUsuario.permisos?.find(p => p.componenteId === componenteSeleccionado)) {
            showNotification('Este componente ya está agregado', 'error');
            return;
        }

        setNuevoUsuario({
            ...nuevoUsuario,
            permisos: [...(nuevoUsuario.permisos || []), {
                componenteId: componenteSeleccionado,
                permiso: permisoSeleccionado
            }]
        });

        setComponenteSeleccionado('');
        setPermisoSeleccionado('ver');
        showNotification('Componente agregado', 'success');
    };

    const eliminarComponente = (componenteId: string) => {
        setNuevoUsuario({
            ...nuevoUsuario,
            permisos: nuevoUsuario.permisos?.filter(p => p.componenteId !== componenteId) || []
        });
        setMostrandoComponentes(true);
    };

    const iniciarEdicionComponente = (permiso: PermisoComponente) => {
        setComponenteEnEdicion({ ...permiso });
        setComponenteSeleccionado(permiso.componenteId);
        setPermisoSeleccionado(permiso.permiso);
    };

    const guardarEdicionComponente = () => {
        if (!componenteEnEdicion) return;

        setNuevoUsuario({
            ...nuevoUsuario,
            permisos: nuevoUsuario.permisos?.map(p =>
                p.componenteId === componenteEnEdicion.componenteId
                    ? { ...p, permiso: permisoSeleccionado }
                    : p
            ) || []
        });

        setComponenteEnEdicion(null);
        setComponenteSeleccionado('');
        setPermisoSeleccionado('ver');
        showNotification('Permiso actualizado', 'success');
    };

    const cancelarEdicionComponente = () => {
        setComponenteEnEdicion(null);
        setComponenteSeleccionado('');
        setPermisoSeleccionado('ver');
    };

    const agregarPrograma = () => {
        if (!programaSeleccionado) {
            showNotification('Seleccione un programa', 'error');
            return;
        }

        if (nuevoUsuario.programasRestringidos?.includes(programaSeleccionado)) {
            showNotification('Este programa ya está agregado', 'error');
            return;
        }

        setNuevoUsuario({
            ...nuevoUsuario,
            programasRestringidos: [...(nuevoUsuario.programasRestringidos || []), programaSeleccionado]
        });

        setProgramaSeleccionado('');
        showNotification('Programa agregado', 'success');
    };

    const eliminarPrograma = (programa: string) => {
        setNuevoUsuario({
            ...nuevoUsuario,
            programasRestringidos: nuevoUsuario.programasRestringidos?.filter(p => p !== programa) || []
        });
        setMostrandoProgramas(true);
    };

    // Funciones para edición
    const agregarComponenteEdit = () => {
        if (!componenteSeleccionadoEdit || !editingUser) {
            showNotification('Seleccione un componente', 'error');
            return;
        }

        if (editingUser.permisos.find(p => p.componenteId === componenteSeleccionadoEdit)) {
            showNotification('Este componente ya está agregado', 'error');
            return;
        }

        setEditingUser({
            ...editingUser,
            permisos: [...editingUser.permisos, {
                componenteId: componenteSeleccionadoEdit,
                permiso: permisoSeleccionadoEdit
            }]
        });

        setComponenteSeleccionadoEdit('');
        setPermisoSeleccionadoEdit('ver');
        showNotification('Componente agregado', 'success');
    };

    const eliminarComponenteEdit = (componenteId: string) => {
        if (!editingUser) return;
        setEditingUser({
            ...editingUser,
            permisos: editingUser.permisos.filter(p => p.componenteId !== componenteId)
        });
        setMostrandoComponentesEdit(true);
    };

    const iniciarEdicionComponenteEdit = (permiso: PermisoComponente) => {
        setComponenteEnEdicionEdit({ ...permiso });
        setComponenteSeleccionadoEdit(permiso.componenteId);
        setPermisoSeleccionadoEdit(permiso.permiso);
    };

    const guardarEdicionComponenteEdit = () => {
        if (!componenteEnEdicionEdit || !editingUser) return;

        setEditingUser({
            ...editingUser,
            permisos: editingUser.permisos.map(p =>
                p.componenteId === componenteEnEdicionEdit.componenteId
                    ? { ...p, permiso: permisoSeleccionadoEdit }
                    : p
            )
        });

        setComponenteEnEdicionEdit(null);
        setComponenteSeleccionadoEdit('');
        setPermisoSeleccionadoEdit('ver');
        showNotification('Permiso actualizado', 'success');
    };

    const cancelarEdicionComponenteEdit = () => {
        setComponenteEnEdicionEdit(null);
        setComponenteSeleccionadoEdit('');
        setPermisoSeleccionadoEdit('ver');
    };

    const agregarProgramaEdit = () => {
        if (!programaSeleccionadoEdit || !editingUser) {
            showNotification('Seleccione un programa', 'error');
            return;
        }

        if (editingUser.programasRestringidos.includes(programaSeleccionadoEdit)) {
            showNotification('Este programa ya está agregado', 'error');
            return;
        }

        setEditingUser({
            ...editingUser,
            programasRestringidos: [...editingUser.programasRestringidos, programaSeleccionadoEdit]
        });

        setProgramaSeleccionadoEdit('');
        showNotification('Programa agregado', 'success');
    };

    const eliminarProgramaEdit = (programa: string) => {
        if (!editingUser) return;
        setEditingUser({
            ...editingUser,
            programasRestringidos: editingUser.programasRestringidos.filter(p => p !== programa)
        });
        setMostrandoProgramasEdit(true);
    };

    const crearUsuario = () => {
        if (!nuevoUsuario.nombre || !nuevoUsuario.email || !nuevoUsuario.password) {
            showNotification('Complete todos los campos obligatorios', 'error');
            return;
        }

        if (!nuevoUsuario.email.endsWith('@unilibre.edu.co')) {
            showNotification('El email debe tener el formato @unilibre.edu.co', 'error');
            return;
        }

        if (usuarios.find(u => u.email === nuevoUsuario.email)) {
            showNotification('Ya existe un usuario con ese email', 'error');
            return;
        }

        const usuario: Omit<Usuario, 'id'> = {
            nombre: nuevoUsuario.nombre,
            email: nuevoUsuario.email,
            password: nuevoUsuario.password,
            rol: nuevoUsuario.rol as any,
            activo: true,
            fechaCreacion: new Date().toISOString().split('T')[0],
            permisos: nuevoUsuario.permisos || [],
            programasRestringidos: nuevoUsuario.programasRestringidos || [],
            accesoTodosProgramas: accesoTodosProgramas
        };

        db.createUsuario(usuario);
        loadData();
        resetNuevoUsuario();
        setDialogOpen(false);
        showNotification('Usuario creado exitosamente', 'success');
    };

    const resetNuevoUsuario = () => {
        setNuevoUsuario({
            nombre: '',
            email: '',
            password: '',
            rol: 'consultor',
            permisos: [],
            programasRestringidos: [],
            accesoTodosProgramas: false
        });
        setComponenteSeleccionado('');
        setPermisoSeleccionado('ver');
        setMostrandoComponentes(true);
        setComponenteEnEdicion(null);
        setProgramaSeleccionado('');
        setMostrandoProgramas(true);
        setAccesoTodosProgramas(false);
    };

    const actualizarUsuario = () => {
        if (!editingUser) return;

        db.updateUsuario(editingUser.id, {
            ...editingUser,
            accesoTodosProgramas: accesoTodosProgramasEdit
        });

        loadData();
        setEditingUser(null);
        setEditDialogOpen(false);
        resetEditStates();
        showNotification('Usuario actualizado exitosamente', 'success');
    };

    const resetEditStates = () => {
        setComponenteSeleccionadoEdit('');
        setPermisoSeleccionadoEdit('ver');
        setMostrandoComponentesEdit(true);
        setComponenteEnEdicionEdit(null);
        setProgramaSeleccionadoEdit('');
        setMostrandoProgramasEdit(true);
        setAccesoTodosProgramasEdit(false);
    };

    const abrirEdicion = (usuario: Usuario) => {
        setEditingUser({ ...usuario });
        setAccesoTodosProgramasEdit(usuario.accesoTodosProgramas || false);
        setEditDialogOpen(true);
    };

    const cambiarEstadoUsuario = (usuarioId: string) => {
        const usuario = usuarios.find(u => u.id === usuarioId);
        if (usuario) {
            const nuevoEstado = !usuario.activo;
            db.updateUsuario(usuarioId, { activo: nuevoEstado });
            loadData();
            showNotification(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'}`, 'success');
        }
    };

    const confirmarEliminarUsuario = () => {
        if (!userToDelete) return;
        db.deleteUsuario(userToDelete.id);
        loadData();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
        showNotification('Usuario eliminado exitosamente', 'success');
    };

    const filteredUsuarios = usuarios.filter(u => {
        const matchesSearch = u.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRol = filterRol === 'todos' || u.rol === filterRol;
        return matchesSearch && matchesRol;
    });

    return {
        usuarios,
        searchTerm, setSearchTerm,
        filterRol, setFilterRol,
        dialogOpen, setDialogOpen,
        editDialogOpen, setEditDialogOpen,
        deleteDialogOpen, setDeleteDialogOpen,
        userToDelete, setUserToDelete,
        editingUser, setEditingUser,
        nuevoUsuario, setNuevoUsuario,
        componenteSeleccionado, setComponenteSeleccionado,
        permisoSeleccionado, setPermisoSeleccionado,
        mostrandoComponentes, setMostrandoComponentes,
        componenteEnEdicion, setComponenteEnEdicion,
        programaSeleccionado, setProgramaSeleccionado,
        mostrandoProgramas, setMostrandoProgramas,
        accesoTodosProgramas, setAccesoTodosProgramas,
        componenteSeleccionadoEdit, setComponenteSeleccionadoEdit,
        permisoSeleccionadoEdit, setPermisoSeleccionadoEdit,
        mostrandoComponentesEdit, setMostrandoComponentesEdit,
        componenteEnEdicionEdit, setComponenteEnEdicionEdit,
        programaSeleccionadoEdit, setProgramaSeleccionadoEdit,
        mostrandoProgramasEdit, setMostrandoProgramasEdit,
        accesoTodosProgramasEdit, setAccesoTodosProgramasEdit,
        cargarPermisosPorRol,
        agregarComponente,
        eliminarComponente,
        iniciarEdicionComponente,
        guardarEdicionComponente,
        cancelarEdicionComponente,
        agregarPrograma,
        eliminarPrograma,
        agregarComponenteEdit,
        eliminarComponenteEdit,
        iniciarEdicionComponenteEdit,
        guardarEdicionComponenteEdit,
        cancelarEdicionComponenteEdit,
        agregarProgramaEdit,
        eliminarProgramaEdit,
        crearUsuario,
        resetNuevoUsuario,
        actualizarUsuario,
        resetEditStates,
        abrirEdicion,
        cambiarEstadoUsuario,
        confirmarEliminarUsuario,
        filteredUsuarios,
        notification
    };
}
