import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useCallback } from 'react';
import ReCAPTCHA from 'react-google-recaptcha';
import { publicServices } from '../services/publicServices';
import { useAuth } from '../context/AuthContext';
import { obtenerSeccionalPublica, olvidarSeccionalPublica } from '../core/seccionalPublica';
import { BarraSeccionalPublica, SeleccionSeccionalPublica } from '../components/public/SeleccionSeccionalPublica';
import AdminDashboard from '../layouts/AdminDashboard';

// Pantalla de verificación reCAPTCHA para acceso público directo por URL
function PublicCaptchaGate({ onVerified }: { onVerified: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY as string | undefined;

  const handleVerify = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError('');
    try {
      await publicServices.verifyRecaptcha(token);
      localStorage.setItem('public_access_verified', 'true');
      localStorage.setItem('auth_is_public', 'true');
      onVerified();
    } catch {
      setError('No se pudo validar reCAPTCHA. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  }, [token, onVerified]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100">
      <div className="bg-white rounded-2xl shadow-xl p-10 flex flex-col items-center gap-6 max-w-sm w-full">
        <h2 className="text-xl font-bold text-slate-800 text-center">Verificación de acceso público</h2>
        <p className="text-sm text-slate-600 text-center">Confirma que eres humano para continuar.</p>
        {siteKey ? (
          <ReCAPTCHA sitekey={siteKey} onChange={setToken} />
        ) : (
          <p className="text-xs text-red-600">reCAPTCHA no configurado.</p>
        )}
        {error && <p className="text-xs text-red-600">{error}</p>}
        <button
          onClick={handleVerify}
          disabled={!token || loading}
          className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Verificando...' : 'Continuar'}
        </button>
      </div>
    </div>
  );
}

const PUBLIC_ASISTENTE_VIRTUAL_PATH = '/public/asistente-virtual';

// True si el usuario llegó desde una página del dominio unilibre.edu.co (o subdominio)
function isReferrerUnilibre(): boolean {
  try {
    const host = new URL(document.referrer).hostname;
    return host === 'unilibre.edu.co' || host.endsWith('.unilibre.edu.co');
  } catch {
    return false; // sin referrer o inválido
  }
}

// Componente Layout para rutas públicas (sin componentes)
export function PublicLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [verified, setVerified] = useState(
    localStorage.getItem('public_access_verified') === 'true'
  );
  const [seccional, setSeccional] = useState(obtenerSeccionalPublica);

  const handlePublicLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  // Enlace directo desde la web de la universidad: solo asistentes virtuales omite el captcha
  const skipCaptcha =
    location.pathname.replace(/\/+$/, '') === PUBLIC_ASISTENTE_VIRTUAL_PATH && isReferrerUnilibre();

  if (!verified && !skipCaptcha) {
    return <PublicCaptchaGate onVerified={() => setVerified(true)} />;
  }

  // Sin sesión, las consultas muestran solo la seccional que elige el visitante (el asistente virtual no la necesita)
  const esAsistente = location.pathname.replace(/\/+$/, '') === PUBLIC_ASISTENTE_VIRTUAL_PATH;
  const pideSeccional = !isAuthenticated && !esAsistente;
  if (pideSeccional && !seccional) {
    return <SeleccionSeccionalPublica onElegida={setSeccional} />;
  }

  const cambiarSeccional = () => {
    olvidarSeccionalPublica();
    setSeccional(null);
  };

  return (
    <AdminDashboard onLogout={handlePublicLogout}>
      {pideSeccional && seccional && <BarraSeccionalPublica seccional={seccional} onCambiar={cambiarSeccional} />}
      <Outlet />
    </AdminDashboard>
  );
}
