/**
 * Seccional que eligió el visitante del portal público (sin sesión).
 *
 * Las consultas públicas (horarios, disponibilidad de espacios, préstamos) muestran solo los datos de esa
 * seccional: el cliente HTTP la envía en la cabecera `X-Seccional-Publica` y el backend la exige sin sesión.
 * Con sesión iniciada el backend la ignora y usa la seccional del usuario.
 */
export interface SeccionalPublica {
  id: number;
  ciudad: string;
}

const CLAVE = 'public_seccional';

export function obtenerSeccionalPublica(): SeccionalPublica | null {
  try {
    const valor = localStorage.getItem(CLAVE);
    if (!valor) return null;
    const seccional = JSON.parse(valor) as SeccionalPublica;
    return Number.isInteger(seccional?.id) ? seccional : null;
  } catch {
    return null;
  }
}

export function guardarSeccionalPublica(seccional: SeccionalPublica): void {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ id: seccional.id, ciudad: seccional.ciudad }));
  } catch {
    // Sin almacenamiento (modo privado estricto): el visitante tendrá que elegirla de nuevo
  }
}

export function olvidarSeccionalPublica(): void {
  try {
    localStorage.removeItem(CLAVE);
  } catch {
    // nada que borrar
  }
}
