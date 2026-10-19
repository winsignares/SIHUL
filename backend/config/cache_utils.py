from __future__ import annotations

from django.core.cache import cache
from rest_framework.response import Response

from .auth_helpers import is_superuser_effective

CATALOG_CACHE_TTL_SECONDS = 300


class CachedCatalogMixin:
    """Cachea la respuesta de `list()` para catálogos casi estáticos
    (sedes, facultades, programas, tipos de espacio, roles) que hoy se
    consultan una y otra vez desde muchos usuarios sin cambiar casi nunca.

    La clave incorpora el alcance real del queryset (según `SeccionalMixin`:
    todo, una seccional concreta, o global si el ViewSet no filtra por
    seccional) para no filtrar datos entre usuarios de distinta seccional.
    Se invalida por señal post_save/post_delete del modelo (ver signals.py).
    """

    cache_ttl_seconds = CATALOG_CACHE_TTL_SECONDS

    def get_cache_scope(self) -> str:
        user = self.get_current_user()
        if not user:
            return 'anon'
        if is_superuser_effective(user):
            return 'all'
        lookup = getattr(self, 'seccional_lookup', None)
        if not lookup:
            return 'global'
        seccional = self.get_user_seccional()
        return f"sec-{seccional.id}" if seccional else 'none'

    def get_cache_key(self) -> str:
        return f"catalog:{self.__class__.__name__}:{self.get_cache_scope()}"

    def list(self, request, *args, **kwargs):
        cache_key = self.get_cache_key()
        cached = cache.get(cache_key)
        if cached is not None:
            return Response(cached)

        response = super().list(request, *args, **kwargs)
        if response.status_code == 200:
            cache.set(cache_key, response.data, self.cache_ttl_seconds)
        return response


def invalidate_catalog_cache(viewset_class_name: str) -> None:
    """Borra el caché de un catálogo (todas las seccionales a la vez).

    `delete_pattern` solo existe en el backend de django-redis; en dev sin
    Redis (LocMemCache) no hay wildcard delete, así que se limpia toda la
    caché como fallback — aceptable porque en ese modo no hay múltiples
    workers ni carga real que proteger.
    """
    try:
        cache.delete_pattern(f"catalog:{viewset_class_name}:*")
    except AttributeError:
        cache.clear()
