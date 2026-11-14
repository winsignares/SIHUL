import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLogin } from './useLogin';
import { useIsMobile } from '../../../hooks/useIsMobile';
import { publicServices } from '../../../services/publicServices';

/** Estado y acciones de la página de inicio de sesión. */
export function useLoginPagina() {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [publicRecaptchaToken, setPublicRecaptchaToken] = useState<string | null>(null);
  const [publicAccessError, setPublicAccessError] = useState('');
  const [isVerifyingPublicAccess, setIsVerifyingPublicAccess] = useState(false);
  const publicRecaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;
  const {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isHovered,
    setIsHovered,
    isLoading,
    isLockedOut,
    remainingSeconds,
    handleSubmit,
    handlePublicAccess,
    handleMicrosoftLogin
  } = useLogin();

  const handlePublicAccessClick = async () => {
    if (!publicRecaptchaToken) {
      setPublicAccessError('Debe completar la verificación reCAPTCHA para el acceso público.');
      return;
    }
    setPublicAccessError('');
    setIsVerifyingPublicAccess(true);
    try {
      await publicServices.verifyRecaptcha(publicRecaptchaToken);
      localStorage.setItem('public_access_verified', 'true');
      handlePublicAccess();
    } catch (error) {
      setPublicAccessError('No se pudo validar reCAPTCHA. Intenta nuevamente.');
    } finally {
      setIsVerifyingPublicAccess(false);
    }
  };

  const handlePublicRecaptchaChange = (token: string | null) => {
    setPublicRecaptchaToken(token);
    if (token) {
      setPublicAccessError('');
    }
  };

  const handleEmailInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.preventDefault();
    const target = e.target as HTMLInputElement;
    if (!target.value) {
      target.setCustomValidity('Por favor ingresa tu correo institucional');
    } else if (!target.validity.valid) {
      target.setCustomValidity('Ingresa un correo válido');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.setCustomValidity('');
    setEmail(e.target.value);
  };

  const handlePasswordInvalid = (e: React.InvalidEvent<HTMLInputElement>) => {
    e.preventDefault();
    const target = e.target as HTMLInputElement;
    target.setCustomValidity('Por favor ingresa tu contraseña');
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const target = e.target as HTMLInputElement;
    target.setCustomValidity('');
    setPassword(e.target.value);
  };


  return {
    isMobile,
    navigate,
    showPassword,
    setShowPassword,
    publicRecaptchaToken,
    setPublicRecaptchaToken,
    publicAccessError,
    setPublicAccessError,
    isVerifyingPublicAccess,
    setIsVerifyingPublicAccess,
    publicRecaptchaSiteKey,
    email,
    setEmail,
    password,
    setPassword,
    error,
    isHovered,
    setIsHovered,
    isLoading,
    isLockedOut,
    remainingSeconds,
    handleSubmit,
    handlePublicAccess,
    handleMicrosoftLogin,
    handlePublicAccessClick,
    handlePublicRecaptchaChange,
    handleEmailInvalid,
    handleEmailChange,
    handlePasswordInvalid,
    handlePasswordChange,
  };
}
