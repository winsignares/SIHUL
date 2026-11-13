import { Eye, Paperclip } from 'lucide-react';
import { displayDate } from '../../../../../components/ui/field-placeholders';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../../components/ui/dialog';
import { resolveDocumentUrl } from '../../../hooks/proveedor/misFacturasUtils';
import type { useMisFacturas } from '../../../hooks/proveedor/useMisFacturas';

type Gestion = ReturnType<typeof useMisFacturas>;

/** Diálogo con los documentos de una factura. */
export function DialogoDocumentosFactura({ documentosOpen, setDocumentosOpen, documentosLoading, documentosError, selectedFacturaNumero, documentosProveedor }: Pick<Gestion, 'documentosOpen' | 'setDocumentosOpen' | 'documentosLoading' | 'documentosError' | 'selectedFacturaNumero' | 'documentosProveedor'>) {
  return (
    <Dialog open={documentosOpen} onOpenChange={setDocumentosOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Paperclip size={18} className="text-blue-600" />
            Documentacion del proveedor
          </DialogTitle>
          <DialogDescription>
            Soportes cargados por el proveedor para {selectedFacturaNumero}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {documentosLoading ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Cargando documentos del proveedor...
            </div>
          ) : documentosError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
              {documentosError}
            </div>
          ) : documentosProveedor.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              No hay documentos cargados por el proveedor para esta factura.
            </div>
          ) : (
            documentosProveedor.map((doc) => {
              const url = resolveDocumentUrl(doc);
              return (
                <div key={doc.id} className="rounded-lg border border-slate-200 bg-white px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-slate-800">{doc.tipo_documento}</p>
                      <p className="truncate text-sm text-slate-500">{doc.nombre_archivo}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {displayDate(doc.fecha_carga)}
                      </p>
                    </div>
                    {url ? (
                      <button
                        type="button"
                        onClick={() => window.open(url, '_blank', 'noopener,noreferrer')}
                        className="inline-flex items-center gap-1 rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Eye size={13} />
                        Ver documento
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">Sin enlace disponible</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
