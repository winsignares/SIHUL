export const PAGE_SIZE_DEFAULT = 10;

/** Cantidad máxima de botones de página visibles a la vez (1–10, 11–20, …). */
export const PAGE_NUMBERS_WINDOW_SIZE = 10;

export const getTotalPages = (totalItems: number, pageSize: number): number => {
  return Math.max(1, Math.ceil(totalItems / pageSize));
};

export const getPageSlice = <T>(items: T[], currentPage: number, pageSize: number): T[] => {
  const start = (currentPage - 1) * pageSize;
  const end = start + pageSize;
  return items.slice(start, end);
};

export const normalizePage = (page: number, totalPages: number): number => {
  if (page < 1) return 1;
  if (page > totalPages) return totalPages;
  return page;
};

export const getPageWindowStart = (
  currentPage: number,
  totalPages: number,
  windowSize: number = PAGE_NUMBERS_WINDOW_SIZE
): number => {
  const safeTotal = Math.max(1, totalPages);
  const page = normalizePage(currentPage, safeTotal);
  return Math.floor((page - 1) / windowSize) * windowSize + 1;
};

/**
 * Números de página visibles en el bloque actual (como máximo `windowSize`, p. ej. 1–10).
 */
export const getPageNumbers = (
  totalPages: number,
  currentPage: number,
  windowSize: number = PAGE_NUMBERS_WINDOW_SIZE
): number[] => {
  const safeTotal = Math.max(1, totalPages);
  const start = getPageWindowStart(currentPage, safeTotal, windowSize);
  const end = Math.min(start + windowSize - 1, safeTotal);
  return Array.from({ length: end - start + 1 }, (_, index) => start + index);
};

/** Ir a la última página del bloque anterior para mostrar el intervalo anterior de números. */
export const getTargetPageForPrevWindow = (
  currentPage: number,
  totalPages: number,
  windowSize: number = PAGE_NUMBERS_WINDOW_SIZE
): number | null => {
  const start = getPageWindowStart(currentPage, totalPages, windowSize);
  if (start <= 1) return null;
  return start - 1;
};

/** Ir a la primera página del bloque siguiente para mostrar el intervalo siguiente de números. */
export const getTargetPageForNextWindow = (
  currentPage: number,
  totalPages: number,
  windowSize: number = PAGE_NUMBERS_WINDOW_SIZE
): number | null => {
  const safeTotal = Math.max(1, totalPages);
  const start = getPageWindowStart(currentPage, safeTotal, windowSize);
  const end = Math.min(start + windowSize - 1, safeTotal);
  if (end >= safeTotal) return null;
  return end + 1;
};

export const hasPrevPageWindow = (
  currentPage: number,
  totalPages: number,
  windowSize: number = PAGE_NUMBERS_WINDOW_SIZE
): boolean => getTargetPageForPrevWindow(currentPage, totalPages, windowSize) !== null;

export const hasNextPageWindow = (
  currentPage: number,
  totalPages: number,
  windowSize: number = PAGE_NUMBERS_WINDOW_SIZE
): boolean => getTargetPageForNextWindow(currentPage, totalPages, windowSize) !== null;
