import { facturasService } from '../services/financiero';
import { resolveBackendBaseUrl } from '../core/backendUrl';

// Descarga un blob directamente al sistema abriendo el explorador de archivos (sin nueva pestaña)
export function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

// Abre una URL en nueva pestaña usando window.open sincrónico + asignación posterior
// DEBE llamarse dentro del handler síncrono del click (no dentro de async/await)
export function openUrlInNewTab(fetchFn: () => Promise<Blob>, fileName?: string) {
  const win = window.open('', '_blank');
  fetchFn()
    .then((blob) => {
      const pdfBlob = blob.type ? blob : new Blob([blob], { type: 'application/pdf' });
      const url = URL.createObjectURL(pdfBlob);
      if (win) {
        win.location.replace(url);
      }
      window.setTimeout(() => URL.revokeObjectURL(url), 120_000);
    })
    .catch(() => {
      win?.close();
    });
}

// Ver todos los documentos consolidados en nueva pestaña
export function openDocumentosConsolidados(facturaId: number, scope?: string) {
  openUrlInNewTab(() =>
    facturasService.getDocumentosConsolidados(facturaId, { scope, descargar: false })
  );
}

// Descargar ZIP con todos los documentos — abre explorador de archivos
export function downloadExpedienteZip(facturaId: number, numeroFactura: string, scope?: string) {
  facturasService.getDocumentosHistorialZip(facturaId, { scope })
    .then((blob) => triggerBlobDownload(blob, `Expediente_${numeroFactura}.zip`))
    .catch(() => {});
}

// Descargar documento individual por URL — abre explorador de archivos
export function downloadDocumentoIndividual(url: string, nombre: string) {
  const backendBase = resolveBackendBaseUrl(import.meta.env.VITE_API_URL);
  const absoluteUrl = url.startsWith('http') ? url : `${backendBase}${url}`;
  fetch(absoluteUrl, { credentials: 'include' })
    .then((r) => r.blob())
    .then((blob) => triggerBlobDownload(blob, nombre))
    .catch(() => {});
}

// Descargar PDF consolidado al sistema (explorador de archivos) — sin abrir nueva pestaña
export function downloadDocumentosConsolidadosPdf(facturaId: number, numeroFactura: string, scope?: string) {
  facturasService.getDocumentosConsolidados(facturaId, { scope, descargar: true })
    .then((blob) => {
      const pdfBlob = blob.type ? blob : new Blob([blob], { type: 'application/pdf' });
      triggerBlobDownload(pdfBlob, `Documentos_${numeroFactura}.pdf`);
    })
    .catch(() => {});
}

// Mantener compatibilidad — abre PDF consolidado en nueva pestaña
export function downloadDocumentosConsolidados(facturaId: number, _numeroFactura: string, scope?: string) {
  openDocumentosConsolidados(facturaId, scope);
}
