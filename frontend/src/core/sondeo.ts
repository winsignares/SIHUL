// Consultas periódicas que solo trabajan mientras la pestaña se ve (y hay red). Una pestaña abierta todo el día en segundo
// plano no debe seguir consultando al servidor; al volver a verla se actualiza de inmediato si ya tocaba.

const hayPestanaVisible = () => typeof document === 'undefined' || document.visibilityState === 'visible';
const hayRed = () => typeof navigator === 'undefined' || navigator.onLine !== false;

/**
 * Ejecuta `tarea` cada `intervaloMs` solo con la pestaña visible. Si pasó el intervalo mientras estaba oculta, la
 * ejecuta al volver. No lanza una ejecución nueva mientras la anterior sigue en curso. Devuelve la función que la detiene.
 */
export function iniciarSondeoVisible(tarea: () => unknown, intervaloMs: number): () => void {
  let ultimaEjecucion = Date.now();
  let enCurso = false;

  const ejecutar = async () => {
    if (enCurso) return;
    enCurso = true;
    ultimaEjecucion = Date.now();
    try {
      await tarea();
    } catch {
      // cada tarea maneja sus propios errores; el sondeo sigue con el siguiente turno
    } finally {
      enCurso = false;
    }
  };

  const alTocar = () => {
    if (hayPestanaVisible() && hayRed()) void ejecutar();
  };

  const temporizador = window.setInterval(alTocar, intervaloMs);

  const alVolverALaPestana = () => {
    if (hayPestanaVisible() && hayRed() && Date.now() - ultimaEjecucion >= intervaloMs) void ejecutar();
  };
  document.addEventListener('visibilitychange', alVolverALaPestana);
  window.addEventListener('online', alVolverALaPestana);

  return () => {
    window.clearInterval(temporizador);
    document.removeEventListener('visibilitychange', alVolverALaPestana);
    window.removeEventListener('online', alVolverALaPestana);
  };
}
