import { AlertCircle, Hammer, Calendar } from 'lucide-react';
import { Button } from '../../share/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '../../hooks/useIsMobile';

export default function EnConstruccion() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Contenedor principal */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          
          {/* Ícono grande */}
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-100 dark:bg-yellow-950/30 rounded-full blur-lg"></div>
              <Hammer className="w-16 h-16 text-yellow-600 dark:text-yellow-500 relative" />
            </div>
          </div>

          {/* Título */}
          <h1 className="text-3xl font-bold text-center text-slate-900 dark:text-slate-100 mb-2">
            En Construcción
          </h1>

          {/* Subtítulo */}
          <p className="text-center text-slate-600 dark:text-slate-400 mb-6">
            Esta sección está siendo desarrollada y estará disponible pronto.
          </p>

          {/* Mensaje informativo */}
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                El equipo de desarrollo está trabajando en mejorar esta funcionalidad. Por favor, intenta más tarde.
              </p>
            </div>
          </div>

          {/* Información de lanzamiento */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-8">
            <div className="flex gap-3">
              <Calendar className="w-5 h-5 text-slate-600 dark:text-slate-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Próximo lanzamiento</p>
                <p className="text-sm text-slate-600 dark:text-slate-400">Disponible en futuras versiones del sistema</p>
              </div>
            </div>
          </div>

          {/* Botón de regreso */}
          <Button
            onClick={() => navigate(-1)}
            className="w-full h-10 bg-slate-900 hover:bg-slate-800 text-white rounded-lg"
          >
            Volver
          </Button>
        </div>

        {/* Decoración de fondo */}
        <div className="space-y-2">
          <div className="h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent rounded-full"></div>
          <p className="text-center text-xs text-slate-500 dark:text-slate-500">
            Gracias por tu paciencia mientras mejoramos tu experiencia
          </p>
        </div>
      </div>
    </div>
  );
}
