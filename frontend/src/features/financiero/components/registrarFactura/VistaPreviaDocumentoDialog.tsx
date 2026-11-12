import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../../components/ui/dialog';
import type { useRegistrarFactura } from '../../hooks/funcionario/useRegistrarFactura';

interface Props {
  hook: ReturnType<typeof useRegistrarFactura>;
}

/** Vista previa de un documento. */
export function VistaPreviaDocumentoDialog({ hook }: Props) {
  const {
    previewDocument,
    setPreviewDocument,
  } = hook;

  return (
  <Dialog
    open={Boolean(previewDocument)}
    onOpenChange={(open) => {
      if (!open && previewDocument?.url.startsWith('blob:')) {
        URL.revokeObjectURL(previewDocument.url);
      }
      if (!open) setPreviewDocument(null);
    }}
  >
    <DialogContent className="h-[96vh] w-[98vw] max-w-[98vw] p-5">
      <DialogHeader>
        <DialogTitle>{previewDocument?.name || 'Documento'}</DialogTitle>
        <DialogDescription>Vista previa del soporte seleccionado. El sistema consulta este documento directamente en la base de datos.</DialogDescription>
      </DialogHeader>
      {previewDocument && (
        <div className="h-[calc(96vh-100px)] overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
          <iframe
            src={previewDocument.url}
            title={previewDocument.name}
            className="h-full w-full"
          />
        </div>
      )}
    </DialogContent>
  </Dialog>
  );
}
