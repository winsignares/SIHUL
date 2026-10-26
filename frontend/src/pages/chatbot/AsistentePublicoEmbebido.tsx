import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, MapPin } from 'lucide-react';
import AsistentesVirtuales from './AsistentesVirtuales';
import { obtenerTokenPublico } from '../../services/chatbot/accesoPublico';
import {
  SECCIONALES_ENLACE_PUBLICO,
  SECCIONAL_PREDETERMINADA,
  buscarSeccionalPublica,
} from '../../config/seccionalesPublicas';

const CLAVE_SECCIONAL_ELEGIDA = 'sihul_asistente_seccional';

const leerSeccionalElegida = (): string | null => {
  try {
    return localStorage.getItem(CLAVE_SECCIONAL_ELEGIDA);
  } catch {
    return null;
  }
};

const guardarSeccionalElegida = (slug: string) => {
  try {
    localStorage.setItem(CLAVE_SECCIONAL_ELEGIDA, slug);
  } catch {
    /* sin almacenamiento: simplemente no se recuerda */
  }
};

const estaEnMarco = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // el navegador impide mirar la página de arriba: es un marco de otro sitio
  }
};

/**
 * Enlace público del asistente virtual: /asistente (abre en «Nacional», o en la última seccional que la persona
 * eligió) y /asistente/<seccional> (abre con esa seccional ya elegida). En ambos casos la persona puede cambiar de
 * seccional desde la barra superior, sin salir de la página. Solo el asistente: sin menú de la aplicación y sin
 * inicio de sesión. Es la misma pantalla del módulo de Asistentes Virtuales en acceso público.
 */
export default function AsistentePublicoEmbebido() {
  const { seccional } = useParams();
  const navigate = useNavigate();
  const [aviso, setAviso] = useState('');

  const info = seccional === undefined
    ? (buscarSeccionalPublica(leerSeccionalElegida()) ?? buscarSeccionalPublica(SECCIONAL_PREDETERMINADA))
    : buscarSeccionalPublica(seccional);

  // Deja lista la sesión pública mientras la persona lee, para que su primera pregunta no espere.
  useEffect(() => {
    if (info) obtenerTokenPublico().catch(() => { /* se reintenta al enviar la primera pregunta */ });
  }, [info]);

  useEffect(() => {
    document.title = info ? `Asistente virtual · Universidad Libre ${info.etiqueta}` : 'Asistente virtual · Universidad Libre';
  }, [info]);

  useEffect(() => {
    if (!aviso) return undefined;
    const temporizador = window.setTimeout(() => setAviso(''), 5000);
    return () => window.clearTimeout(temporizador);
  }, [aviso]);

  if (!info) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-xl font-bold text-slate-800">Elige tu seccional</h1>
        <div className="flex flex-wrap justify-center gap-2">
          {SECCIONALES_ENLACE_PUBLICO.map((s) => (
            <a key={s.slug} href={`/asistente/${s.slug}`} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              {s.etiqueta}
            </a>
          ))}
        </div>
      </div>
    );
  }

  const cambiarSeccional = (slug: string) => {
    const nueva = buscarSeccionalPublica(slug);
    if (!nueva || nueva.slug === info.slug) return;
    guardarSeccionalElegida(nueva.slug);
    setAviso(`Ahora consultas con la información de ${nueva.etiqueta}. Cada seccional tiene su propia conversación.`);
    // replace: el botón «Atrás» del navegador sigue llevando a la página de la Universidad, no a la seccional anterior
    navigate(`/asistente/${nueva.slug}`, { replace: true });
  };

  const enMarco = estaEnMarco();

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50">
      <header className="flex items-center justify-between gap-2 bg-gradient-to-r from-red-600 to-rose-600 px-3 py-2 text-white shadow-md">
        {enMarco ? (
          <span className="text-sm font-semibold">Asistente virtual</span>
        ) : (
          <a
            href={info.volverUrl}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>
              Volver<span className="hidden sm:inline">{' a Universidad Libre'}</span>
            </span>
          </a>
        )}

        <label className="ml-auto flex min-w-0 items-center gap-1.5 text-sm">
          <MapPin className="h-4 w-4 shrink-0 text-yellow-300" aria-hidden="true" />
          <span className="hidden sm:inline">Seccional</span>
          <select
            value={info.slug}
            onChange={(e) => cambiarSeccional(e.target.value)}
            aria-label="Elige tu seccional"
            className="min-w-0 max-w-[10.5rem] cursor-pointer rounded-full border border-white/40 bg-white px-3 py-1.5 text-sm font-semibold text-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            {SECCIONALES_ENLACE_PUBLICO.map((s) => (
              <option key={s.slug} value={s.slug} className="text-slate-900">
                {s.etiqueta}
              </option>
            ))}
          </select>
        </label>

        <span className="shrink-0 rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold text-red-700" title="Las respuestas las genera una inteligencia artificial">
          IA
        </span>
      </header>

      {aviso && (
        <div role="status" className="bg-amber-50 px-3 py-1.5 text-center text-xs text-amber-800">
          {aviso}
        </div>
      )}

      <main className="flex min-h-0 flex-1">
        {/* key: al cambiar de seccional se monta de nuevo, con la conversación de esa seccional */}
        <AsistentesVirtuales key={info.slug} modoEmbebido seccionalFija={info.nombre} seccionalEtiqueta={info.etiqueta} />
      </main>

      <footer className="border-t border-slate-200 bg-white px-3 py-1.5 text-center text-[11px] leading-snug text-slate-500">
        Las respuestas las genera una inteligencia artificial y pueden contener errores. No compartas datos personales.
        Tu conversación no se guarda en nuestros servidores.
      </footer>
    </div>
  );
}
