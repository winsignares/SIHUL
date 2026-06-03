import React from 'react';

/**
 * Optimización: Componentes de lista con React.memo para evitar re-renders innecesarios
 * Se usan en mapeos de arrays para prevenir que cada ítem se re-renderice cuando el padre cambia
 */

// HOC para envolver items de listas con React.memo
export const withListMemo = <P extends object>(
  Component: React.FC<P>,
  displayName?: string
): React.FC<P> => {
  const MemoizedComponent = React.memo(Component, (prevProps, nextProps) => {
    // Retorna true si los props son iguales (NO re-renderizar)
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });

  MemoizedComponent.displayName = displayName || `ListMemo(${Component.displayName || Component.name})`;
  return MemoizedComponent;
};

/**
 * Hook para optimizar callbacks en listas
 * Evita crear nuevas funciones en cada render
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useListCallback = <T extends (...args: any[]) => any>(
  callback: T,
  dependencies: React.DependencyList
): T => {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return React.useCallback(callback, dependencies) as T;
};
