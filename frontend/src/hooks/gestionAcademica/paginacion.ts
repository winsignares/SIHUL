export const PAGE_SIZE_DEFAULT = 10;

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

export const getPageNumbers = (totalPages: number): number[] => {
  const safeTotal = Math.max(1, totalPages);
  return Array.from({ length: safeTotal }, (_, index) => index + 1);
};