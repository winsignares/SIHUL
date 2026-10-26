import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import AsistentesVirtuales from './AsistentesVirtuales';
import { obtenerTokenPublico } from '../../services/chatbot/accesoPublico';
import { SECCIONALES_ENLACE_PUBLICO, buscarSeccionalPublica } from '../../config/seccionalesPublicas';

const estaEnMarco = (): boolean => {
  try {
    return window.self !== window.top;
  } catch {
    return true; // el navegador impide mirar la página de arriba: es un marco de otro sitio
  }
};

/**
 * Enlace público de una seccional (/asistente/<seccional>): solo el asistente virtual, sin menú de la
 * aplicación, sin inicio de sesión y con la seccional ya elegida. Es la misma pantalla del módulo de
 * Asistentes Virtuales en acceso público.
 */
export default function AsistentePublicoEmbebido() {
  const { seccional } = useParams();
  const info = buscarSeccionalPublica(seccional);

  // Deja lista la sesión pública mientras la persona lee, para que su primera pregunta no espere.
  useEffect(() => {
    if (info) obtenerTokenPublico().catch(() => { /* se reintenta al enviar la primera pregunta */ });
  }, [info]);

  useEffect(() => {
    document.title = info ? `Asistente virtual · Universidad Libre ${info.nombre}` : 'Asistente virtual · Universidad Libre';
  }, [info]);

  if (!info) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <h1 className="text-xl font-bold text-slate-800">Elige tu seccional</h1>
        <div className="flex flex-wrap justify-center gap-2">
          {SECCIONALES_ENLACE_PUBLICO.map((s) => (
            <a key={s.slug} href={`/asistente/${s.slug}`} className="rounded-full border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50">
              {s.nombre}
            </a>
          ))}
        </div>
      </div>
    );
  }

  const enMarco = estaEnMarco();

  return (
    <div className="flex h-[100dvh] flex-col bg-slate-50">
      <header className="flex items-center justify-between gap-3 bg-gradient-to-r from-red-600 to-rose-600 px-3 py-2 text-white shadow-md">
        {enMarco ? (
          <span className="text-sm font-semibold">Asistente virtual</span>
        ) : (
          <a
            href={info.volverUrl}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Universidad Libre
          </a>
        )}
        <span className="hidden text-sm sm:inline">Seccional {info.nombre}</span>
        <span className="rounded bg-white/90 px-1.5 py-0.5 text-xs font-bold text-red-700" title="Las respuestas las genera una inteligencia artificial">
          IA
        </span>
      </header>

      <main className="flex min-h-0 flex-1">
        <AsistentesVirtuales modoEmbebido seccionalFija={info.nombre} />
      </main>

      <footer className="border-t border-slate-200 bg-white px-3 py-1.5 text-center text-[11px] leading-snug text-slate-500">
        Las respuestas las genera una inteligencia artificial y pueden contener errores. No compartas datos personales.
        Tu conversación no se guarda en nuestros servidores.
      </footer>
    </div>
  );
}
