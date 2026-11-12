function formatFechaLocalYYYYMMDD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Rango Lunes-Domingo (7 dias) de la semana que contiene `fechaISO`.
 * El cronograma siempre muestra las 7 columnas Lunes..Domingo de esa
 * semana (ver encabezadosDiasCronograma en useConsultaEspaciosFiltros), asi
 * que los datos que se piden al backend y el filtro en cliente deben cubrir
 * la semana completa, sin importar que dia exacto eligio el usuario como
 * "Desde" del filtro (p. ej. si elige un jueves, el lunes-miercoles de esa
 * misma semana deben seguir viendose en el cronograma).
 */
export function getRangoSemanaCompleta(fechaISO: string): { desde: string; hasta: string } {
  const referencia = new Date(fechaISO + 'T12:00:00');
  const diaSemana = referencia.getDay();
  const diasHastaLunes = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(referencia);
  lunes.setDate(referencia.getDate() + diasHastaLunes);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  return {
    desde: formatFechaLocalYYYYMMDD(lunes),
    hasta: formatFechaLocalYYYYMMDD(domingo)
  };
}

/** Domingo (fin de la semana Lunes-Domingo) de la semana que contiene `fecha`. */
export function getFinDeSemana(fecha: Date): Date {
  const diaSemana = fecha.getDay();
  const diasHastaDomingo = diaSemana === 0 ? 0 : 7 - diaSemana;
  const resultado = new Date(fecha);
  resultado.setDate(resultado.getDate() + diasHastaDomingo);
  return resultado;
}
