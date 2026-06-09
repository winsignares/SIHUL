import { facturasService } from '../services/financiero';

const buildObjectUrl = async (facturaId: number, scope?: string, descargar = false) => {
  const blob = await facturasService.getDocumentosConsolidados(facturaId, { scope, descargar });
  return URL.createObjectURL(blob);
};

export async function openDocumentosConsolidados(facturaId: number, scope?: string) {
  const url = await buildObjectUrl(facturaId, scope, false);
  window.open(url, '_blank', 'noopener,noreferrer');
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function downloadDocumentosConsolidados(
  facturaId: number,
  numeroFactura: string,
  scope?: string
) {
  const url = await buildObjectUrl(facturaId, scope, true);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Documentos_${numeroFactura}_${scope || 'general'}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
