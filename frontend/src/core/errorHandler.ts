import { tokenManager } from './tokenManager';

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

export async function handleApiError(response: Response): Promise<never> {
  let errorMessage = 'Error en la solicitud';
  let errors: Record<string, string[]> | undefined;

  try {
    const errorData = await response.json();
    errorMessage = errorData.message || errorData.detail || errorMessage;
    errors = errorData.errors;
  } catch {
    // Si no hay JSON, usar mensaje por defecto
  }

  const apiError: ApiError = {
    message: errorMessage,
    status: response.status,
    errors,
  };

  // Manejo específico por código de estado
  switch (response.status) {
    case 401:
      tokenManager.clearToken();
      window.location.href = '/login';
      break;
    case 403:
      apiError.message = 'No tienes permisos para realizar esta acción';
      break;
    case 404:
      apiError.message = 'Recurso no encontrado';
      break;
    case 422:
      apiError.message = 'Datos de validación incorrectos';
      break;
    case 500:
      apiError.message = 'Error interno del servidor';
      break;
  }

  throw apiError;
}

export function formatValidationErrors(
  errors?: Record<string, string[]>
): string {
  if (!errors) return '';
  
  return Object.entries(errors)
    .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
    .join('\n');
}
