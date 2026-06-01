export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

interface ErrorHandlingOptions {
  redirectOn401?: boolean;
}

function normalizeMessages(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => (typeof item === 'string' ? item : String(item ?? '')))
      .filter(Boolean);
  }
  if (typeof value === 'string') {
    return value ? [value] : [];
  }
  if (value == null) {
    return [];
  }
  return [String(value)];
}

function extractApiErrorInfo(errorData: unknown): {
  message?: string;
  errors?: Record<string, string[]>;
} {
  if (typeof errorData === 'string') {
    return { message: errorData };
  }

  if (Array.isArray(errorData)) {
    const messages = normalizeMessages(errorData);
    return { message: messages.join(' ') };
  }

  if (!errorData || typeof errorData !== 'object') {
    return {};
  }

  const data = errorData as Record<string, unknown>;
  const directMessage =
    (typeof data.message === 'string' && data.message) ||
    (typeof data.detail === 'string' && data.detail) ||
    (typeof data.error === 'string' && data.error);
  if (directMessage) {
    return { message: directMessage };
  }

  const normalizedErrors: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(data)) {
    const messages = normalizeMessages(value);
    if (messages.length > 0) {
      normalizedErrors[key] = messages;
    }
  }

  if (normalizedErrors.non_field_errors?.length) {
    return {
      message: normalizedErrors.non_field_errors.join(' '),
      errors: normalizedErrors,
    };
  }

  const firstField = Object.keys(normalizedErrors)[0];
  if (firstField && normalizedErrors[firstField]?.length) {
    return {
      message: `${firstField}: ${normalizedErrors[firstField].join(' ')}`,
      errors: normalizedErrors,
    };
  }

  return {};
}

export async function handleApiError(
  response: Response,
  options: ErrorHandlingOptions = {}
): Promise<never> {
  const { redirectOn401 = true } = options;
  let errorMessage = 'Error en la solicitud';
  let errors: Record<string, string[]> | undefined;

  try {
    const errorData = await response.json();
    const extracted = extractApiErrorInfo(errorData);
    if (extracted.message) {
      errorMessage = extracted.message;
    }
    errors = extracted.errors;
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
      if (!redirectOn401) {
        break;
      }
      // Limpiar sesión local y navegar al login sin recargar toda la página
      try {
        // Evitar dependencias circulares importando dinámicamente
        const { db } = await import('../services/database');
        db.cerrarSesion();
      } catch (e) {
        console.warn('No se pudo limpiar la sesión local:', e);
      }
      // Cambiar la URL con history API y disparar evento popstate para que React Router responda
      try {
        window.history.pushState({}, '', '/login');
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch (_e) {  // eslint-disable-line @typescript-eslint/no-unused-vars
        // Fallback: navegación tradicional si algo falla
        window.location.href = '/login';
      }
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
