import {
  CheckCircle2,
  Upload,
  Trash2,
} from 'lucide-react';
import { DOC_TYPE_DETAILS } from './auxiliares';
import type { useEnviarFactura } from '../../../hooks/financiero/proveedor/useEnviarFactura';

interface Props {
  hook: ReturnType<typeof useEnviarFactura>;
}

/** Paso 3 de Enviar Factura: documentos. */
export function PasoDocumentos({ hook }: Props) {
  const {
    docs,
    documentTypes,
    handleAddDoc,
    requestRemoveDoc,
    documentosPendientes,
    allDocumentsUploaded,
  } = hook;

  return (
  <div className="space-y-6">
    <h4 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
      <Upload size={20} className="text-orange-600" />
      Adjuntar Documentos
    </h4>
    <p className="text-slate-600 dark:text-slate-300 text-sm">
      Adjunta todos los soportes requeridos para continuar con la confirmación.
    </p>
    {!allDocumentsUploaded && (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300 space-y-2">
        <p className="font-semibold text-amber-900 dark:text-amber-200">
          Faltan documentos por adjuntar:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-amber-900/90 dark:text-amber-200">
          {documentosPendientes.map((doc) => (
            <li key={doc}>{doc}</li>
          ))}
        </ul>
        <p className="text-xs text-amber-900/80 dark:text-amber-200/90">
          Adjunta estos soportes para habilitar el envío final de tu factura.
        </p>
      </div>
    )}

    <div className="space-y-3">
      {documentTypes.map(type => {
        const uploaded = docs.find(d => d.type === type);
        const docMeta = DOC_TYPE_DETAILS[type];
        return (
          <div key={type} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-700 rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-800 dark:text-white">{docMeta?.label ?? type}</p>
              {docMeta?.helper && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{docMeta.helper}</p>
              )}
              {uploaded && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 max-w-xs space-y-1">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <CheckCircle2 size={16} className="flex-shrink-0 text-green-600 dark:text-green-400" />
                    <p className="truncate">
                      {uploaded.file?.name || uploaded.existingName || 'Documento cargado'}
                    </p>
                  </div>
                  {uploaded.existingUrl && (
                    <a
                      href={uploaded.existingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-orange-600 hover:text-orange-700 underline"
                    >
                      Ver documento actual
                    </a>
                  )}
                </div>
              )}
            </div>
            {uploaded ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => requestRemoveDoc(uploaded)}
                  className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-md border border-red-200 bg-red-50 text-red-600 transition-colors hover:border-red-300 hover:bg-red-100 hover:text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-900/50"
                  title="Eliminar documento"
                  aria-label={`Eliminar ${type}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ) : (
              <label className="cursor-pointer px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors">
                <Upload size={12} className="inline mr-1" />
                Adjuntar
                <input type="file" className="hidden" accept=".pdf" onChange={e => { void handleAddDoc(e, type); }} />
              </label>
            )}
          </div>
        );
      })}
    </div>
  </div>
  );
}
