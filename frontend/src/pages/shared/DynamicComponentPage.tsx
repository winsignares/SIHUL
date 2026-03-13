import { Wrench, Shield } from 'lucide-react';
import { useMemo } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../share/button';
import { toComponentSlug } from '../../config/componentRoutes';

export default function DynamicComponentPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { components } = useAuth();

  const component = useMemo(() => {
    if (!slug) {
      return null;
    }

    return components.find(c => toComponentSlug(c.nombre) === slug) || null;
  }, [components, slug]);

  if (!slug || !component) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
        <div className="flex items-center justify-center mb-5">
          <div className="w-16 h-16 rounded-2xl bg-amber-100 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-amber-700" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-center text-slate-900 mb-2">{component.nombre}</h1>
        <p className="text-center text-slate-600 mb-6">
          Este componente fue asignado dinamicamente a tu rol y ya esta visible en el menu.
        </p>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 mb-6">
          <div className="flex items-center gap-2 text-slate-700 text-sm">
            <Shield className="w-4 h-4" />
            <span>Permiso actual: {component.permiso}</span>
          </div>
          <p className="text-sm text-slate-600 mt-2">
            Puedes conectar esta ruta a una pantalla funcional cuando el modulo este implementado.
          </p>
        </div>

        <Button onClick={() => navigate(-1)} className="w-full bg-slate-900 hover:bg-slate-800 text-white">
          Volver
        </Button>
      </div>
    </div>
  );
}
