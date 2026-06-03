import { handleApiError } from './errorHandler.ts';

const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim().replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl
  ? (rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`)
  : '/api';

interface RequestConfig extends RequestInit {
  requiresAuth?: boolean;
  suppressErrorLog?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getHeaders(isFormData = false): Record<string, string> {
    const headers: Record<string, string> = {};

    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    // Agregar token de autenticación si existe
    const token = localStorage.getItem('auth_token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<T> {
    const { requiresAuth = true, suppressErrorLog = false, ...fetchConfig } = config;

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        credentials: 'include', // Incluir cookies de sesión
        headers: {
          ...this.getHeaders(fetchConfig.body instanceof FormData),
          ...(fetchConfig.headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        await handleApiError(response, { redirectOn401: requiresAuth });
      }

      // Si la respuesta es 204 No Content, retornar objeto vacío
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data as T;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      // Don't log expected errors:
      // - 409 Conflict validation scenarios
      // - 401 during optional session-hydration calls (requiresAuth = false)
      const isExpected401 = error?.status === 401 && !requiresAuth;
      if (!suppressErrorLog && error.status !== 409 && !isExpected401) {
        console.error('API Request Error:', error);
      }
      throw error;
    }
  }

  private async requestBlob(
    endpoint: string,
    config: RequestConfig = {}
  ): Promise<Blob> {
    const { requiresAuth = true, suppressErrorLog = false, ...fetchConfig } = config;

    const url = `${this.baseURL}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...fetchConfig,
        credentials: 'include',
        headers: {
          ...this.getHeaders(fetchConfig.body instanceof FormData),
          ...(fetchConfig.headers as Record<string, string>),
        },
      });

      if (!response.ok) {
        await handleApiError(response, { redirectOn401: requiresAuth });
      }

      return await response.blob();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      const isExpected401 = error?.status === 401 && !requiresAuth;
      if (!suppressErrorLog && error.status !== 409 && !isExpected401) {
        console.error('API Request Error:', error);
      }
      throw error;
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      cache: config?.cache ?? 'no-store',
      method: 'GET',
    });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async getBlob(
    endpoint: string,
    config?: RequestConfig
  ): Promise<Blob> {
    return this.requestBlob(endpoint, {
      ...config,
      method: 'GET',
    });
  }

  async postBlob(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<Blob> {
    return this.requestBlob(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async getBlob(endpoint: string, config?: RequestConfig): Promise<Blob> {
    return this.requestBlob(endpoint, {
      ...config,
      cache: config?.cache ?? 'no-store',
      method: 'GET',
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'DELETE',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async postFormData<T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
