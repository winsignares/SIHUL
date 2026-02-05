import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { userService } from '../../services/users/authService';

export interface RegisterFormData {
  nombreCompleto: string;
  correo: string;
  confirmarCorreo: string;
  password: string;
  confirmarPassword: string;
}

export function useRegister() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isHovered, setIsHovered] = useState(false);

  // Estados del formulario
  const [formData, setFormData] = useState<RegisterFormData>({
    nombreCompleto: '',
    correo: '',
    confirmarCorreo: '',
    password: '',
    confirmarPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar error al escribir
    if (error) setError('');
  };

  const validateForm = (): boolean => {
    // Validar nombre completo
    if (!formData.nombreCompleto.trim()) {
      setError('El nombre completo es requerido');
      return false;
    }

    if (formData.nombreCompleto.trim().length < 3) {
      setError('El nombre debe tener al menos 3 caracteres');
      return false;
    }

    // Validar correo
    if (!formData.correo.trim()) {
      setError('El correo es requerido');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.correo)) {
      setError('El correo no es válido');
      return false;
    }

    // Validar confirmación de correo
    if (formData.correo !== formData.confirmarCorreo) {
      setError('Los correos no coinciden');
      return false;
    }

    // Validar contraseña
    if (!formData.password) {
      setError('La contraseña es requerida');
      return false;
    }

    if (formData.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return false;
    }

    // Validar confirmación de contraseña
    if (formData.password !== formData.confirmarPassword) {
      setError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Crear usuario con solo los campos básicos
      await userService.crearUsuario({
        nombre: formData.nombreCompleto.trim(),
        correo: formData.correo.toLowerCase().trim(),
        contrasena: formData.password,
        activo: true,
        rol_id: null, // Sin rol, será asignado por administrador
        facultad_id: null, // Sin facultad
        espacios_permitidos: [] // Sin espacios permitidos
      });

      // Redirigir al login con mensaje de éxito
      navigate('/login', {
        state: {
          successMessage: 'Registro exitoso. Tu cuenta será activada por el administrador. Por favor, espera la confirmación.'
        }
      });
    } catch (err: any) {
      console.error('Error al registrar:', err);
      
      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else if (err.response?.data?.correo) {
        setError('Este correo ya está registrado');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error al registrar. Por favor, intenta de nuevo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nombreCompleto: '',
      correo: '',
      confirmarCorreo: '',
      password: '',
      confirmarPassword: '',
    });
    setError('');
  };

  return {
    formData,
    isLoading,
    error,
    isHovered,
    setIsHovered,
    handleChange,
    handleSubmit,
    resetForm,
    navigate
  };
}
