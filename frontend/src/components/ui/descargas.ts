/**
 * Descarga un archivo (PDF, Excel, ZIP) recibido como blob, con el nombre indicado.
 * El enlace temporal se libera un minuto después para no cortar la descarga.
 */
export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
