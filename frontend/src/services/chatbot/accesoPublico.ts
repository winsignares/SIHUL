import { apiClient } from '../../core/apiClient';

/**
 * Acceso público al chat: antes de preguntar, el navegador resuelve en segundo plano un desafío de
 * prueba de trabajo y el servidor entrega una sesión firmada de corta vigencia (cabecera X-Chatbot-Token).
 * La persona no ve nada: no hay captcha ni clics. Ver backend/chatbot/acceso_publico.py.
 *
 * SHA-256 propio (en vez de crypto.subtle) porque subtle solo existe en contextos seguros (HTTPS) y el
 * entorno de pruebas se sirve por http.
 */

const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);

const rotd = (x: number, n: number) => (x >>> n) | (x << (32 - n));

export function sha256(mensaje: Uint8Array): Uint8Array {
  const h = new Uint32Array([
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ]);
  const largo = mensaje.length;
  const total = (((largo + 9 + 63) >> 6) << 6);
  const datos = new Uint8Array(total);
  datos.set(mensaje);
  datos[largo] = 0x80;
  const vista = new DataView(datos.buffer);
  vista.setUint32(total - 8, Math.floor((largo * 8) / 0x100000000));
  vista.setUint32(total - 4, (largo * 8) >>> 0);

  const w = new Uint32Array(64);
  for (let bloque = 0; bloque < total; bloque += 64) {
    for (let i = 0; i < 16; i++) w[i] = vista.getUint32(bloque + i * 4);
    for (let i = 16; i < 64; i++) {
      const s0 = rotd(w[i - 15], 7) ^ rotd(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rotd(w[i - 2], 17) ^ rotd(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h[0], b = h[1], c = h[2], d = h[3], e = h[4], f = h[5], g = h[6], hh = h[7];
    for (let i = 0; i < 64; i++) {
      const S1 = rotd(e, 6) ^ rotd(e, 11) ^ rotd(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (hh + S1 + ch + K[i] + w[i]) | 0;
      const S0 = rotd(a, 2) ^ rotd(a, 13) ^ rotd(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) | 0;
      hh = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
    }
    h[0] = (h[0] + a) | 0; h[1] = (h[1] + b) | 0; h[2] = (h[2] + c) | 0; h[3] = (h[3] + d) | 0;
    h[4] = (h[4] + e) | 0; h[5] = (h[5] + f) | 0; h[6] = (h[6] + g) | 0; h[7] = (h[7] + hh) | 0;
  }
  const salida = new Uint8Array(32);
  const vs = new DataView(salida.buffer);
  for (let i = 0; i < 8; i++) vs.setUint32(i * 4, h[i]);
  return salida;
}

/** Bits en cero al comienzo del resumen. */
export function cerosIniciales(resumen: Uint8Array): number {
  let bits = 0;
  for (const byte of resumen) {
    if (byte === 0) { bits += 8; continue; }
    bits += Math.clz32(byte) - 24;
    break;
  }
  return bits;
}

/** Busca el contador que, junto al desafío, da un SHA-256 con `bits` ceros iniciales. */
export async function resolverDesafio(desafio: string, bits: number): Promise<string> {
  const codificador = new TextEncoder();
  const prefijo = codificador.encode(`${desafio}:`);
  let contador = 0;
  for (;;) {
    const hasta = contador + 3000;
    for (; contador < hasta; contador++) {
      const digitos = codificador.encode(String(contador));
      const entrada = new Uint8Array(prefijo.length + digitos.length);
      entrada.set(prefijo);
      entrada.set(digitos, prefijo.length);
      if (cerosIniciales(sha256(entrada)) >= bits) return String(contador);
    }
    // cede el hilo para que la página siga respondiendo mientras calcula
    await new Promise<void>((seguir) => setTimeout(seguir, 0));
  }
}

interface DesafioRespuesta { desafio: string; bits: number }
interface SesionRespuesta { token: string; vigencia: number; max_preguntas: number }

let sesionActual: { token: string; venceEn: number } | null = null;
let solicitudEnCurso: Promise<string> | null = null;

async function pedirSesion(): Promise<string> {
  const desafio = await apiClient.post<DesafioRespuesta>('/chatbot/public/desafio/', undefined, { requiresAuth: false });
  const solucion = await resolverDesafio(desafio.desafio, desafio.bits);
  const sesion = await apiClient.post<SesionRespuesta>(
    '/chatbot/public/sesion/',
    { desafio: desafio.desafio, solucion },
    { requiresAuth: false },
  );
  // Se renueva un minuto antes de que venza en el servidor.
  sesionActual = { token: sesion.token, venceEn: Date.now() + Math.max(sesion.vigencia - 60, 30) * 1000 };
  return sesion.token;
}

/** Sesión pública vigente; la pide (y resuelve el desafío) solo si no hay una o si se fuerza. */
export function obtenerTokenPublico(forzar = false): Promise<string> {
  if (!forzar && sesionActual && sesionActual.venceEn > Date.now()) {
    return Promise.resolve(sesionActual.token);
  }
  if (!solicitudEnCurso) {
    solicitudEnCurso = pedirSesion().finally(() => { solicitudEnCurso = null; });
  }
  return solicitudEnCurso;
}

export function olvidarTokenPublico(): void {
  sesionActual = null;
}
