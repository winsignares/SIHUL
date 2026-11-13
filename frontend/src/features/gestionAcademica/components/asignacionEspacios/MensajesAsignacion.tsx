import { Alert, AlertDescription, AlertTitle } from '../../../../components/ui/alert';
import type { useAsignacionEspaciosSeccionalPagina } from '../../hooks/useAsignacionEspaciosSeccionalPagina';

type Gestion = ReturnType<typeof useAsignacionEspaciosSeccionalPagina>;

/** Mensajes de error y de éxito. */
export function MensajesAsignacion({ error, successMessage }: Pick<Gestion, 'error' | 'successMessage'>) {
  return (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert>
          <AlertTitle>Operación exitosa</AlertTitle>
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      )}
    </>
  );
}
