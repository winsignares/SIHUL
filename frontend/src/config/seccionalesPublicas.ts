/**
 * Seccionales con enlace público al asistente virtual: /asistente/<slug>.
 *
 * - `nombre` es el valor que entiende el servidor (el mismo del combo «Tu seccional» del acceso público).
 * - `volverUrl` es la página de la seccional en el sitio de la Universidad a la que lleva «Volver». Se fija aquí,
 *   nunca viaja en el enlace, para que la página no sirva para redirigir a sitios ajenos.
 */
export interface SeccionalPublica {
  slug: string;
  nombre: string;
  volverUrl: string;
}

const SITIO = 'https://www.unilibre.edu.co';

export const SECCIONALES_ENLACE_PUBLICO: SeccionalPublica[] = [
  { slug: 'barranquilla', nombre: 'Barranquilla', volverUrl: `${SITIO}/barranquilla` },
  { slug: 'bogota', nombre: 'Bogota', volverUrl: `${SITIO}/bogota` },
  { slug: 'cali', nombre: 'Cali', volverUrl: `${SITIO}/cali` },
  { slug: 'cartagena', nombre: 'Cartagena', volverUrl: `${SITIO}/cartagena` },
  { slug: 'cucuta', nombre: 'Cucuta', volverUrl: `${SITIO}/cucuta` },
  { slug: 'pereira', nombre: 'Pereira', volverUrl: `${SITIO}/pereira` },
  { slug: 'socorro', nombre: 'El Socorro', volverUrl: `${SITIO}/socorro` },
  { slug: 'virtual', nombre: 'Virtual', volverUrl: `${SITIO}/programas-virtuales/` },
];

export const buscarSeccionalPublica = (slug?: string): SeccionalPublica | undefined =>
  SECCIONALES_ENLACE_PUBLICO.find((s) => s.slug === (slug ?? '').toLowerCase());
