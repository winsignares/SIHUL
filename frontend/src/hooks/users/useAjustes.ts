import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useUser } from '../../context/UserContext';
import { AuthService } from '../../services/auth';

export function useAjustes() {
    const { theme, toggleTheme } = useTheme();
    const { usuario } = useUser();

    // Estados de edición
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isEditingSystem, setIsEditingSystem] = useState(false);

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
        nombre: usuario?.nombre || 'Administrador Principal',
        email: usuario?.email || 'admin@unilibre.edu.co',
        telefono: '+57 300 123 4567',
        cargo: 'Administrador de Planeación'
    });

    const [perfilOriginal, setPerfilOriginal] = useState({ ...perfil });

    const [notificaciones, setNotificaciones] = useState({
        emailNuevaSolicitud: true,
        emailConflicto: true,
        emailMensaje: false,
        pushNuevaSolicitud: true,
        pushConflicto: true,
        pushMensaje: true,
        sonido: true
    });

    const [sistema, setSistema] = useState({
        idioma: 'es',
        zonaHoraria: 'America/Bogota',
        formatoFecha: 'DD/MM/YYYY',
        formatoHora: '24h'
    });

    const [sistemaOriginal, setSistemaOriginal] = useState({ ...sistema });

    // Determinar si el usuario puede editar ciertos campos según su rol
    const canEditEmail = usuario?.rol === 'admin';
    const canEditCargo = usuario?.rol === 'admin';

    const handleEditProfile = () => {
        setIsEditingProfile(true);
    };

    const handleCancelEditProfile = () => {
        setPerfil({ ...perfilOriginal });
        setIsEditingProfile(false);
    };

    const guardarPerfil = () => {
        setPerfilOriginal({ ...perfil });
        setIsEditingProfile(false);
        // Mostrar notificación: ✅ Perfil actualizado correctamente
    };

    const handleChangePassword = () => {
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

        if (!usuario) {
            setPasswordError('Usuario no encontrado');
            return;
        }

        // Intentar cambiar contraseña
        const result = AuthService.changePassword(
            usuario.id,
            passwordData.currentPassword,
            passwordData.newPassword
        );

        if (result.success) {
            // Mostrar notificación: ✅ Contraseña actualizada correctamente
            setShowChangePasswordModal(false);
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            });
        } else {
            setPasswordError(result.error || 'Error al cambiar contraseña');
        }
    };

    const handleNotificationChange = (key: string, value: boolean) => {
        setNotificaciones(prev => ({ ...prev, [key]: value }));
        // Mostrar notificación: [value ? 'Activado' : 'Desactivado']
    };

    const confirmarGuardarNotificaciones = () => {
        setShowSaveNotificationsModal(false);
        // Mostrar notificación: ✅ Preferencias de notificaciones guardadas
    };

    const handleEditSystem = () => {
        setIsEditingSystem(true);
    };

    const handleCancelEditSystem = () => {
        setSistema({ ...sistemaOriginal });
        setIsEditingSystem(false);
    };

    const confirmarGuardarSistema = () => {
        setSistemaOriginal({ ...sistema });
        setIsEditingSystem(false);
        setShowSaveSystemModal(false);
        // Mostrar notificación: ✅ Configuración del sistema actualizada
    };

    const handleThemeChange = (newTheme: 'light' | 'dark') => {
        if (theme !== newTheme) {
            toggleTheme();
            // Mostrar notificación: Tema cambiado a modo [newTheme === 'light' ? 'claro' : 'oscuro']
        }
    };

    return {
        theme,
        usuario,
        isEditingProfile,
        isEditingSystem,
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
        canEditCargo,
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
