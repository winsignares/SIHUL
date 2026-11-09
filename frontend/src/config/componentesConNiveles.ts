/**
 * Componentes en los que el permiso VER y EDITAR dan acceso distinto.
 *
 * En todos los demás, tener el componente (con VER o con EDITAR) da exactamente el mismo acceso, así que las
 * pantallas de permisos no muestran el selector y lo tratan como «Acceso». Si una pantalla nueva empieza a
 * distinguir VER de EDITAR (con `hasEditPermission` en el frontend o `user_can_edit_componente` en el backend),
 * su componente debe agregarse aquí.
 */
export const COMPONENTES_CON_NIVELES: readonly string[] = [
  'Préstamos de Espacios',
  'Disponibilidad de Espacios',
  'Gestión de Usuarios',
  'Centro Institucional',
  'Gestión de Chatbots',
  'Gestión de Documentación de Chatbots',
];

export function tieneNivelesDePermiso(nombreComponente: string | undefined | null): boolean {
  return !!nombreComponente && COMPONENTES_CON_NIVELES.includes(nombreComponente);
}
