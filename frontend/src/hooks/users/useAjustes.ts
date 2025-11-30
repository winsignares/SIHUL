import { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { authService, userService, type Usuario, type ChangePasswordPayload } from '../../services/users/authService';
import { settingsService, type NotificationSettings, type SystemSettings } from '../../services/users/settingsService';
import { toast } from 'sonner';

export function useAjustes() {
    const { theme, toggleTheme } = useTheme();
    
    // Obtener usuario del localStorage
    const [usuario, setUsuario] = useState<Usuario | null>(() => {
        const storedUser = localStorage.getItem('auth_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Estados de edición
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingSystem, setIsEditingSystem] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Estados de modales
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
    const [showSaveNotificationsModal, setShowSaveNotificationsModal] = useState(false);
    const [showSaveSystemModal, setShowSaveSystemModal] = useState(false);

    // Estados de contraseña
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });
    const [passwordError, setPasswordError] = useState('');

    const [perfil, setPerfil] = useState({
        nombre: usuario?.nombre || '',
        correo: usuario?.correo || '',
        rol_id: usuario?.rol_id || usuario?.rol?.id || null,
        facultad_id: usuario?.facultad_id || usuario?.facultad?.id || null,
        activo: usuario?.activo ?? true
    });

    const [perfilOriginal, setPerfilOriginal] = useState({ ...perfil });

    // Cargar perfil del usuario al montar
    useEffect(() => {
        if (usuario) {
            const newPerfil = {
                nombre: usuario.nombre,
                correo: usuario.correo,
                // Extraer IDs de los objetos si existen, o usar los IDs directos
                rol_id: usuario.rol_id || usuario.rol?.id || null,
                facultad_id: usuario.facultad_id || usuario.facultad?.id || null,
                activo: usuario.activo
            };
            setPerfil(newPerfil);
            setPerfilOriginal(newPerfil);
        }
    }, [usuario]);

    const [notificaciones, setNotificaciones] = useState<NotificationSettings>(
        settingsService.getNotificationSettings()
    );

    const [sistema, setSistema] = useState<SystemSettings>(
        settingsService.getSystemSettings()
    );

    const [sistemaOriginal, setSistemaOriginal] = useState<SystemSettings>({ ...sistema });

    const handleEditProfile = () => {
        setIsEditingProfile(true);
    };

    const handleCancelEditProfile = () => {
        setPerfil({ ...perfilOriginal });
        setIsEditingProfile(false);
    };

    const guardarPerfil = async () => {
        if (!usuario?.id) {
            toast.error('No se pudo identificar el usuario');
            return;
        }

        setIsSaving(true);
        try {
            await userService.actualizarUsuario({
                id: usuario.id,
                nombre: perfil.nombre,
                correo: perfil.correo,
                rol_id: perfil.rol_id,
                facultad_id: perfil.facultad_id,
                activo: perfil.activo
            });

            // Actualizar localStorage manteniendo la estructura de objetos completos
            const updatedUser = { 
                ...usuario, 
                nombre: perfil.nombre,
                correo: perfil.correo,
                activo: perfil.activo
                // Mantenemos usuario.rol y usuario.facultad como objetos completos
            };
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            setUsuario(updatedUser);
            
            setPerfilOriginal({ ...perfil });
            setIsEditingProfile(false);
            toast.success('✅ Perfil actualizado correctamente');
        } catch (error: any) {
            console.error('Error al actualizar perfil:', error);
            toast.error(error.message || 'Error al actualizar el perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async () => {
        setPasswordError('');

        // Validaciones
        if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
            setPasswordError('Todos los campos son obligatorios');
            return;
        }

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setPasswordError('Las contraseñas nuevas no coinciden');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            setPasswordError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (!usuario?.correo) {
            setPasswordError('Usuario no encontrado');
            return;
        }

        setIsSaving(true);
        try {
            const payload: ChangePasswordPayload = {
                correo: usuario.correo,
                old_contrasena: passwordData.currentPassword,
                new_contrasena: passwordData.newPassword
            };

            await authService.changePassword(payload);
            
            toast.success('✅ Contraseña actualizada correctamente');
            setShowChangePasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } catch (error: any) {
            console.error('Error al cambiar contraseña:', error);
            setPasswordError(error.message || 'Error al cambiar la contraseña');
        } finally {
            setIsSaving(false);
        }
    };

    const handleNotificationChange = (key: string, value: boolean) => {
        setNotificaciones(prev => ({ ...prev, [key]: value }));
        toast.info(value ? '🔔 Notificación activada' : '🔕 Notificación desactivada');
    };

    const confirmarGuardarNotificaciones = () => {
        try {
            settingsService.saveNotificationSettings(notificaciones);
            setShowSaveNotificationsModal(false);
            toast.success('✅ Preferencias de notificaciones guardadas');
        } catch (error) {
            toast.error('Error al guardar preferencias de notificaciones');
        }
    };

    const handleEditSystem = () => {
        setIsEditingSystem(true);
    };

    const handleCancelEditSystem = () => {
        setSistema({ ...sistemaOriginal });
        setIsEditingSystem(false);
    };

    const confirmarGuardarSistema = () => {
        try {
            settingsService.saveSystemSettings(sistema);
            setSistemaOriginal({ ...sistema });
            setIsEditingSystem(false);
            setShowSaveSystemModal(false);
            toast.success('✅ Configuración del sistema actualizada');
        } catch (error) {
            toast.error('Error al guardar configuración del sistema');
        }
    };

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        if (theme !== newTheme) {
            toggleTheme();
            toast.success(`🎨 Tema cambiado a modo ${newTheme === 'light' ? 'claro' : 'oscuro'}`);
        }
    };

    // Cargar preferencias guardadas al montar
    useEffect(() => {
        const savedNotificaciones = settingsService.getNotificationSettings();
        setNotificaciones(savedNotificaciones);

        const savedSistema = settingsService.getSystemSettings();
        setSistema(savedSistema);
        setSistemaOriginal(savedSistema);
    }, []);

    // Determinar permisos según rol
    // Nota: El rol 'admin' es el nombre real en la BD según seed_roles.py
    const canEditEmail = usuario?.rol?.nombre === 'admin';
    const canEditRol = usuario?.rol?.nombre === 'admin';

    return {
        theme,
        usuario,
        isEditingProfile,
        isEditingSystem,
        isSaving,
        showChangePasswordModal,
        setShowChangePasswordModal,
        showSaveNotificationsModal,
        setShowSaveNotificationsModal,
        showSaveSystemModal,
        setShowSaveSystemModal,
        passwordData,
        setPasswordData,
        showPasswords,
        setShowPasswords,
        passwordError,
        setPasswordError,
        perfil,
        setPerfil,
        notificaciones,
        sistema,
        setSistema,
        canEditEmail,
        canEditRol,
        handleEditProfile,
        handleCancelEditProfile,
        guardarPerfil,
        handleChangePassword,
        handleNotificationChange,
        confirmarGuardarNotificaciones,
        handleEditSystem,
        handleCancelEditSystem,
        confirmarGuardarSistema,
        handleThemeChange
    };
}
