import { Download, FileSpreadsheet, FileText, Paperclip } from 'lucide-react';
import type { AnexoChatbot } from '../../models/chatbot/chatbot';

export const formatearTamano = (bytes: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const estiloPorExtension = (extension: string) => {
    if (extension === 'xls' || extension === 'xlsx') {
        return { Icon: FileSpreadsheet, color: 'text-emerald-600 dark:text-emerald-400', etiqueta: 'Excel' };
    }
    if (extension === 'doc' || extension === 'docx') {
        return { Icon: FileText, color: 'text-blue-600 dark:text-blue-400', etiqueta: 'Word' };
    }
    return { Icon: FileText, color: 'text-red-600 dark:text-red-400', etiqueta: 'PDF' };
};

/**
 * Anexos (documentos de soporte) de una respuesta: cada uno es un enlace que descarga el
 * archivo real. El enlace lo firma el backend, así que no necesita sesión (sirve también
 * en el chat público).
 */
export function AnexosRespuesta({ anexos, titulo = 'Documentos de soporte', compacto = false }: {
    anexos?: AnexoChatbot[];
    titulo?: string;
    compacto?: boolean;
}) {
    if (!anexos?.length) return null;
    return (
        <div className={compacto ? 'mt-2 space-y-1' : 'mt-3 space-y-1.5 border-t border-slate-200 pt-2 dark:border-slate-700'}>
            {!compacto && (
                <p className="flex items-center gap-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                    <Paperclip className="h-3.5 w-3.5" />{titulo}
                </p>
            )}
            {anexos.map((anexo) => {
                const { Icon, color, etiqueta } = estiloPorExtension(anexo.extension);
                return (
                    <a
                        key={anexo.id}
                        href={anexo.url}
                        download={anexo.nombre}
                        rel="noopener noreferrer"
                        title={`Descargar ${anexo.nombre}`}
                        className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-700 transition-colors hover:border-red-300 hover:bg-red-50 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-700"
                    >
                        <Icon className={`h-4 w-4 flex-shrink-0 ${color}`} />
                        <span className="min-w-0 flex-1 truncate font-medium">{anexo.nombre}</span>
                        <span className="flex-shrink-0 text-[10px] text-slate-500 dark:text-slate-400">
                            {etiqueta}{anexo.tamano ? ` · ${formatearTamano(anexo.tamano)}` : ''}
                        </span>
                        <Download className="h-3.5 w-3.5 flex-shrink-0 text-red-700 dark:text-red-300" />
                    </a>
                );
            })}
        </div>
    );
}
