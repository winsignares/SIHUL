"""Base de las vistas de un solo endpoint que antes eran funciones con `@csrf_exempt`.

Reproduce lo que hacían esas funciones:
- no exige autenticación DRF: cada vista valida el acceso con sus propios ayudantes;
- `request.user` es el usuario de la petición Django (como en una vista de función);
- un método no permitido responde 405 con `{"error": "Solo se permite GET"}`;
- no rechaza por cabecera `Accept` (se devuelve JSON o archivos directamente).
"""
from django.http import JsonResponse
from rest_framework.authentication import BaseAuthentication
from rest_framework.views import APIView


class UsuarioDeLaPeticion(BaseAuthentication):
    """Entrega a DRF el usuario que ya resolvió Django, sin cambiarlo."""

    def authenticate(self, request):
        usuario = getattr(request._request, 'user', None)
        if usuario is not None and getattr(usuario, 'is_authenticated', False):
            return (usuario, None)
        return None


class VistaJson(APIView):
    authentication_classes = [UsuarioDeLaPeticion]
    permission_classes = []

    def perform_content_negotiation(self, request, force=False):
        renderer = self.get_renderers()[0]
        return renderer, renderer.media_type

    def http_method_not_allowed(self, request, *args, **kwargs):
        permitidos = sorted(m.upper() for m in self.allowed_methods if m.upper() not in ('OPTIONS', 'HEAD'))
        return JsonResponse({'error': f"Solo se permite {' o '.join(permitidos)}"}, status=405)
