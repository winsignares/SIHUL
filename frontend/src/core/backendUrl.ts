const LOCALHOST_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(?:\/|$)/i;

function isBrowserOnLocalhost(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
}

export function resolveBackendBaseUrl(rawUrl?: string): string {
  const configuredUrl = (rawUrl || '').trim().replace(/\/+$/, '');

  if (configuredUrl && (!LOCALHOST_PATTERN.test(configuredUrl) || isBrowserOnLocalhost())) {
    return configuredUrl.replace(/\/api$/, '');
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  return '';
}

export function resolveApiBaseUrl(rawUrl?: string): string {
  const backendBaseUrl = resolveBackendBaseUrl(rawUrl);

  if (!backendBaseUrl) {
    return '/api';
  }

  return backendBaseUrl.endsWith('/api') ? backendBaseUrl : `${backendBaseUrl}/api`;
}
