/**
 * Seccionales del enlace público al asistente virtual: /asistente (y /asistente/<slug> con una ya elegida).
 *
 * - `nombre` es el valor que entiende el servidor (el mismo del combo «Tu seccional» del acceso público).
 * - `etiqueta` es el nombre para mostrar en pantalla (con tildes).
 * - `volverUrl` es la página en el sitio de la Universidad a la que lleva «Volver». Se fija aquí, nunca viaja en
 *   el enlace, para que la página no sirva para redirigir a sitios ajenos.
 */
export interface SeccionalPublica {
  slug: string;
  nombre: string;
  etiqueta: string;
  volverUrl: string;
}

const SITIO = 'https://www.unilibre.edu.co';

/** Seccional con la que abre el enlace sin seccional: los asistentes disponibles para todas. */
export const SECCIONAL_PREDETERMINADA = 'nacional';

export const SECCIONALES_ENLACE_PUBLICO: SeccionalPublica[] = [
  { slug: 'nacional', nombre: 'Nacional', etiqueta: 'Nacional', volverUrl: `${SITIO}/` },
  { slug: 'barranquilla', nombre: 'Barranquilla', etiqueta: 'Barranquilla', volverUrl: `${SITIO}/barranquilla` },
  { slug: 'bogota', nombre: 'Bogota', etiqueta: 'Bogotá', volverUrl: `${SITIO}/bogota` },
  { slug: 'cali', nombre: 'Cali', etiqueta: 'Cali', volverUrl: `${SITIO}/cali` },
  { slug: 'cartagena', nombre: 'Cartagena', etiqueta: 'Cartagena', volverUrl: `${SITIO}/cartagena` },
  { slug: 'cucuta', nombre: 'Cucuta', etiqueta: 'Cúcuta', volverUrl: `${SITIO}/cucuta` },
  { slug: 'pereira', nombre: 'Pereira', etiqueta: 'Pereira', volverUrl: `${SITIO}/pereira` },
  { slug: 'socorro', nombre: 'El Socorro', etiqueta: 'El Socorro', volverUrl: `${SITIO}/socorro` },
  { slug: 'virtual', nombre: 'Virtual', etiqueta: 'Virtual', volverUrl: `${SITIO}/programas-virtuales/` },
];

export const buscarSeccionalPublica = (slug?: string | null): SeccionalPublica | undefined =>
  SECCIONALES_ENLACE_PUBLICO.find((s) => s.slug === (slug ?? '').toLowerCase());
