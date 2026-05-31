"""
CSRF Protection Middleware y Decoradores
Protege contra ataques CSRF sin romper JSON API
"""
from django.middleware.csrf import CsrfViewMiddleware, get_token
from django.views.decorators.csrf import csrf_protect, ensure_csrf_cookie
from django.http import JsonResponse
from django.utils.decorators import decorator_from_middleware_with_args
from functools import wraps
import logging

logger = logging.getLogger(__name__)


class JSONCsrfMiddleware(CsrfViewMiddleware):
    """
    Middleware CSRF mejorado que:
    1. Valida tokens CSRF en headers para JSON APIs
    2. Mantiene compatibilidad con SessionAuthentication
    3. Permite requests sin token solo para GET/HEAD/OPTIONS/TRACE
    4. Requiere token CSRF para POST/PUT/DELETE/PATCH
    5. Exempta endpoints públicos como login, logout
    """
    
    # Endpoints exemptados de CSRF (públicos/sin autenticación)
    CSRF_EXEMPT_PATHS = {
        '/api/usuarios/login/',
        '/usuarios/login/',
        '/api/usuarios/logout/',
        '/usuarios/logout/',
        '/api/auth/logout/',
        '/auth/logout/',
        '/api/usuarios/session-auth-state/',
        '/usuarios/session-auth-state/',
        '/api/usuarios/change-password/',
        '/usuarios/change-password/',
        '/api/csrf-token/',
        '/api/prestamos/public/recaptcha/',  # Public reCAPTCHA validation
    }
    
    def process_view(self, request, view_func, view_args, view_kwargs):
        # Exemtar endpoints públicos
        if request.path in self.CSRF_EXEMPT_PATHS:
            return None
        
        # GET, HEAD, OPTIONS, TRACE son seguros (no modifican estado)
        if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
            return None
        
        # Para POST/PUT/DELETE/PATCH, validar token CSRF
        if request.method in ('POST', 'PUT', 'DELETE', 'PATCH'):
            # Obtener token del header X-CSRFToken (estándar para JSON APIs)
            csrf_header = request.META.get('HTTP_X_CSRFTOKEN') or \
                          request.META.get('HTTP_X_CSRF_TOKEN')

            # Exigir header siempre para métodos que modifican estado
            if not csrf_header:
                logger.warning(
                    f"CSRF token missing for {request.method} {request.path} from {self._get_client_ip(request)}"
                )
                return JsonResponse(
                    {"error": "CSRF token missing. Include X-CSRFToken header."},
                    status=403
                )

            # Continuar con la validación estándar de Django
            return super().process_view(request, view_func, view_args, view_kwargs)
        
        return None
    
    @staticmethod
    def _get_client_ip(request):
        forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if forwarded_for:
            return forwarded_for.split(',')[0].strip()
        return request.META.get('REMOTE_ADDR', 'unknown')


def csrf_protect_json(view_func):
    """
    Decorador que protege vistas JSON contra CSRF.
    
    Uso:
        @csrf_protect_json
        def create_usuario(request):
            ...
    
    Requiere que el cliente envíe:
    - Header: X-CSRFToken: <token>
    - O Cookie: csrftoken=<token>
    
    El token se obtiene del endpoint /api/csrf-token/
    """
    @wraps(view_func)
    def wrapped(request, *args, **kwargs):
        # GET, HEAD, OPTIONS, TRACE son seguros
        if request.method in ('GET', 'HEAD', 'OPTIONS', 'TRACE'):
            return view_func(request, *args, **kwargs)
        
        # Para POST/PUT/DELETE/PATCH, validar CSRF
        if request.method in ('POST', 'PUT', 'DELETE', 'PATCH'):
            csrf_token = request.META.get('HTTP_X_CSRFTOKEN') or \
                        request.META.get('HTTP_X_CSRF_TOKEN') or \
                        request.COOKIES.get('csrftoken')
            
            if not csrf_token:
                logger.warning(
                    f"CSRF token missing for {request.method} {request.path}"
                )
                return JsonResponse(
                    {"error": "CSRF token missing. Include X-CSRFToken header."},
                    status=403
                )
            
            # Validar token usando Django's CSRF validation
            from django.middleware.csrf import CsrfViewMiddleware
            middleware = CsrfViewMiddleware(lambda r: None)
            request.META['CSRF_COOKIE'] = csrf_token
            
            try:
                middleware.process_view(request, view_func, args, kwargs)
            except Exception as e:
                logger.warning(f"CSRF validation failed: {str(e)}")
                return JsonResponse(
                    {"error": "CSRF token invalid or expired."},
                    status=403
                )
        
        return view_func(request, *args, **kwargs)
    
    return wrapped


def get_csrf_token_view(request):
    """
    Endpoint que devuelve el token CSRF.
    
    GET /api/csrf-token/ -> {"csrfToken": "..."}
    
    El cliente debe:
    1. Hacer GET a este endpoint
    2. Guardar el token
    3. Enviarlo en header X-CSRFToken en requests POST/PUT/DELETE
    """
    if request.method != 'GET':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    
    token = get_token(request)
    return JsonResponse({"csrfToken": token}, status=200)
