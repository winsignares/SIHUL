import { useState, useEffect, useRef } from 'react';
import { userService, authService, type Usuario, type ChangePasswordPayload } from '../../services/users/authService';
import { espacioPermitidoService } from '../../services/espacios/espaciosAPI';
import { isSpaceSupervisorRole } from '../../context/spaceSupervisorRole';
import { toast } from 'sonner';

interface EspacioPermitido {
    id: number;
    nombre: string;
    tipo: string;
    ubicacion?: string;
    sede_nombre?: string;
}

export function useAjustes() {
    // Obtener usuario del localStorage
    const [usuario, setUsuario] = useState<Usuario | null>(() => {
        const storedUser = localStorage.getItem('auth_user');
        return storedUser ? JSON.parse(storedUser) : null;
    });

    // Estados de espacios permitidos
    const [espaciosPermitidos, setEspaciosPermitidos] = useState<EspacioPermitido[]>([]);

    // Estados de edición
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Estados de modales
    const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);

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

    // Estado del formulario de perfil
    const [perfil, setPerfil] = useState({
        nombre: usuario?.nombre || '',
        correo: usuario?.correo || '',
        rol_id: usuario?.rol_id || usuario?.rol?.id || null,
        facultad_id: usuario?.facultad_id || usuario?.facultad?.id || null,
        activo: usuario?.activo ?? true
    });

    const [perfilOriginal, setPerfilOriginal] = useState({ ...perfil });
    const profileErrorNotifiedRef = useRef(false);

    // Cargar perfil del usuario al montar
    useEffect(() => {
        const fetchProfile = async () => {
            let usuarioBase: Usuario | null = usuario;

            if (!usuarioBase?.id) {
                try {
                    const sessionUser = await authService.getAuthenticatedUser({ suppressErrorLog: true });
                    usuarioBase = {
                        id: sessionUser.id,
                        nombre: sessionUser.nombre,
                        correo: sessionUser.correo,
                        activo: true,
                        rol: sessionUser.rol ?? undefined,
                        rol_id: sessionUser.rol?.id ?? null,
                        facultad: sessionUser.facultad,
                        facultad_id: sessionUser.facultad?.id ?? null,
                        sede: sessionUser.sede,
                    };
                } catch {
                    usuarioBase = usuario;
                }
            }

            if (!usuarioBase?.id) {
                return;
            }

            try {
                // Obtener datos del usuario
                const userData = await userService.obtenerUsuario(usuarioBase.id);

                // Construir usuario completo manteniendo los datos del rol y facultad del localStorage
                const fullUserData: Usuario = {
                    ...usuarioBase,
                    ...userData,
                    rol: userData.rol || usuarioBase.rol,
                    facultad: userData.facultad ?? usuarioBase.facultad
                };

                setUsuario(fullUserData);

                const newPerfil = {
                    nombre: fullUserData.nombre,
                    correo: fullUserData.correo,
                    rol_id: fullUserData.rol_id || fullUserData.rol?.id || null,
                    facultad_id: fullUserData.facultad_id || fullUserData.facultad?.id || null,
                    activo: fullUserData.activo
                };

                setPerfil(newPerfil);
                setPerfilOriginal(newPerfil);

                // Actualizar localStorage
                localStorage.setItem('auth_user', JSON.stringify(fullUserData));

                // Si el rol supervisa espacios, cargar espacios permitidos.
                if (isSpaceSupervisorRole(fullUserData.rol)) {
                    try {
                        const espaciosResponse = await espacioPermitidoService.listByUsuario(fullUserData.id!);
                        // Map to EspacioPermitido interface
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        const espaciosMapped: EspacioPermitido[] = (espaciosResponse.espacios || []).map((e: any) => ({
                            id: e.id,
                            nombre: e.nombre || e.tipo || 'Espacio',
                            tipo: e.tipo_espacio?.nombre || e.tipo || 'No especificado',
                            ubicacion: e.ubicacion,
                            sede_nombre: e.sede?.nombre
                        }));
                        setEspaciosPermitidos(espaciosMapped);
                    } catch (error) {
                        console.error('Error cargando espacios permitidos:', error);
                        setEspaciosPermitidos([]);
                    }
                }
            } catch {
                if (usuarioBase) {
                    setUsuario(usuarioBase);
                    const fallbackPerfil = {
                        nombre: usuarioBase.nombre || '',
                        correo: usuarioBase.correo || '',
                        rol_id: usuarioBase.rol_id || usuarioBase.rol?.id || null,
                        facultad_id: usuarioBase.facultad_id || usuarioBase.facultad?.id || null,
                        activo: usuarioBase.activo ?? true,
                    };
                    setPerfil(fallbackPerfil);
                    setPerfilOriginal(fallbackPerfil);
                    return;
                }

                if (!profileErrorNotifiedRef.current) {
                    profileErrorNotifiedRef.current = true;
                    toast.error('Error al cargar la información del perfil');
                }
            }
        };

        fetchProfile();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Solo ejecutar al montar - usuario se obtiene del contexto

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
            };
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            setUsuario(updatedUser);

            setPerfilOriginal({ ...perfil });
            setIsEditingProfile(false);
            toast.success('✅ Perfil actualizado correctamente');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            console.error('Error al cambiar contraseña:', error);
            setPasswordError(error.message || 'Error al cambiar la contraseña');
        } finally {
            setIsSaving(false);
        }
    };

    // Determinar permisos según rol
    const canEditEmail = usuario?.rol?.nombre === 'admin';
    const canEditRol = usuario?.rol?.nombre === 'admin';
    const isSupervisorGeneral = isSpaceSupervisorRole(usuario?.rol);

    return {
        usuario,
        espaciosPermitidos,
        isEditingProfile,
        isSaving,
        showChangePasswordModal,
        setShowChangePasswordModal,
        passwordData,
        setPasswordData,
        showPasswords,
        setShowPasswords,
        passwordError,
        setPasswordError,
        perfil,
        setPerfil,
        canEditEmail,
        canEditRol,
        isSupervisorGeneral,
        handleEditProfile,
        handleCancelEditProfile,
        guardarPerfil,
        handleChangePassword,
    };
}
