import { useEffect, useState } from 'react';
import { apiClient } from '../../core/apiClient';
import { guardarSeccionalPublica, type SeccionalPublica } from '../../core/seccionalPublica';

type RespuestaSeccionales = SeccionalPublica[] | { results: SeccionalPublica[] };

/** Pantalla del portal público para elegir la seccional cuyos horarios y espacios se consultan. */
export function SeleccionSeccionalPublica({ onElegida }: { onElegida: (seccional: SeccionalPublica) => void }) {
  const [seccionales, setSeccionales] = useState<SeccionalPublica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    apiClient
      .get<RespuestaSeccionales>('/seccionales/', { requiresAuth: false })
      .then((datos) => {
        if (!activo) return;
        const lista = Array.isArray(datos) ? datos : datos.results;
        setSeccionales([...lista].sort((a, b) => a.ciudad.localeCompare(b.ciudad, 'es')));
      })
      .catch(() => activo && setError('No se pudieron cargar las seccionales. Intenta de nuevo.'))
      .finally(() => activo && setCargando(false));
    return () => {
      activo = false;
    };
  }, []);

  const elegir = (seccional: SeccionalPublica) => {
    guardarSeccionalPublica(seccional);
    onElegida(seccional);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 flex flex-col gap-5 max-w-md w-full">
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-800">Elige tu seccional</h2>
          <p className="text-sm text-slate-600 mt-1">Verás los horarios, espacios y préstamos de esa seccional.</p>
        </div>
        {cargando && <p className="text-sm text-slate-500 text-center">Cargando seccionales...</p>}
        {error && <p className="text-sm text-red-600 text-center">{error}</p>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {seccionales.map((seccional) => (
            <button
              key={seccional.id}
              type="button"
              onClick={() => elegir(seccional)}
              className="py-2.5 px-4 rounded-lg border border-slate-200 text-slate-800 font-medium hover:border-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
            >
              {seccional.ciudad}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Franja que indica la seccional consultada y permite cambiarla. */
export function BarraSeccionalPublica({ seccional, onCambiar }: { seccional: SeccionalPublica; onCambiar: () => void }) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-2 px-4 pt-3 text-sm text-slate-600">
      <span>
        Consultando la seccional <strong className="text-slate-800">{seccional.ciudad}</strong>
      </span>
      <button type="button" onClick={onCambiar} className="text-red-600 hover:text-red-700 font-semibold underline-offset-2 hover:underline">
        Cambiar
      </button>
    </div>
  );
}
