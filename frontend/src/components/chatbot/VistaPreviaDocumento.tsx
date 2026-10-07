import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../share/dialog';
import { chatbotAPI } from '../../services/chatbot/chatbotAPI';

export interface DocumentoAbierto {
    agenteId: number | string;
    archivo: string;
    pagina?: number;
}

/** Visor del PDF citado en una respuesta, abierto en la página citada. */
export function VistaPreviaDocumento({ documento, onCerrar }: { documento: DocumentoAbierto | null; onCerrar: () => void }) {
    const [url, setUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!documento) return;
        let activo = true;
        let objectUrl: string | null = null;
        setUrl(null);
        setError(null);
        chatbotAPI
            .obtenerArchivoDocumento(documento.agenteId, documento.archivo)
            .then((blob) => {
                if (!activo) return;
                objectUrl = URL.createObjectURL(blob);
                setUrl(objectUrl);
            })
            .catch(() => {
                if (activo) setError('No se pudo abrir el documento. Es posible que se haya cargado antes de poder previsualizarse; pide que lo vuelvan a subir.');
            });
        return () => {
            activo = false;
            if (objectUrl) URL.revokeObjectURL(objectUrl);
        };
    }, [documento?.agenteId, documento?.archivo]);

    const pagina = documento?.pagina && documento.pagina > 0 ? documento.pagina : 1;
    return (
        <Dialog open={!!documento} onOpenChange={(abierto) => !abierto && onCerrar()}>
            <DialogContent className="flex h-[92vh] w-[96vw] flex-col gap-3 sm:!max-w-[960px]">
                <DialogHeader>
                    <DialogTitle className="break-all pr-6 text-base">
                        {documento?.archivo}{documento?.pagina ? ` · p. ${documento.pagina}` : ''}
                    </DialogTitle>
                </DialogHeader>
                <div className="min-h-0 flex-1 overflow-hidden rounded-md border bg-slate-100">
                    {error ? (
                        <p className="p-6 text-sm text-slate-600">{error}</p>
                    ) : url ? (
                        // La página va en el fragmento; al cambiar de cita se remonta el visor (key)
                        <iframe key={`${url}-${pagina}`} title={documento?.archivo} src={`${url}#page=${pagina}`} className="h-full w-full" />
                    ) : (
                        <p className="p-6 text-sm text-slate-500">Cargando documento…</p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
