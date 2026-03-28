import { useCallback, useState } from 'react';

export function useErrorHandler() {
  const [error, setError] = useState<Error | null>(null);

  const handleError = useCallback((error: unknown) => {
    if (error instanceof Error) {
      setError(error);
      console.error('Error capturado:', error);
    } else {
      const newError = new Error(String(error));
      setError(newError);
      console.error('Error no tipado capturado:', error);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

export function useAsyncError() {
  const [, setError] = useState();
  
  return useCallback(
    (error: unknown) => {
      setError(() => {
        throw error;
      });
    },
    [setError],
  );
}
