"""Nombres de seccional tal como los usa el servicio RAG y reglas de disponibilidad de los chatbots."""
import re
import unicodedata

FASTAPI_SEDES = {
    'nacional',
    'virtual',
    'el_socorro',
    'cali',
    'barranquilla',
    'bogota',
    'cucuta',
    'cartagena',
    'pereira',
}


def normalizar_sede(raw_value):
    """'El Socorro' -> 'el_socorro'. None si no es una seccional que conozca el RAG."""
    if not raw_value:
        return None

    normalized = unicodedata.normalize('NFKD', str(raw_value))
    normalized = normalized.encode('ascii', 'ignore').decode('ascii')
    normalized = normalized.strip().lower().replace(' ', '_')
    normalized = re.sub(r'[^a-z0-9_]+', '', normalized)
    normalized = re.sub(r'_+', '_', normalized)
    if normalized in FASTAPI_SEDES:
        return normalized
    return None


def ids_seccionales(sede_value):
    """Ids de las Seccional cuyo nombre normalizado es `sede_value` (normalmente una)."""
    from sedes.models import Seccional

    if not sede_value:
        return []
    return [s.id for s in Seccional.objects.all() if normalizar_sede(s.ciudad) == sede_value]


def agentes_visibles(queryset, sede_value):
    """Chatbots disponibles en una seccional: los de «todas» (sin seccionales) y los que la incluyen.

    Con `sede_value` vacío solo quedan los disponibles en todas las seccionales.
    """
    from django.db.models import Q

    if not sede_value:
        return queryset.filter(seccionales__isnull=True).distinct()
    return queryset.filter(Q(seccionales__isnull=True) | Q(seccionales__in=ids_seccionales(sede_value))).distinct()
