"""Ayudas compartidas por las vistas del chat."""
from django.db.models import F
from django.db.models import Q
from django.http import JsonResponse
from ...models import Agente
from ...models import AnexoRespuesta
from ...models import PreguntaSugerida
from ...sedes import agentes_visibles
from ...sedes import ids_seccionales
from ...sedes import normalizar_sede as _normalize_sede_value


def _resolve_user_sede_value(usuario):
    seccional = getattr(usuario, 'seccional', None)
    if seccional and getattr(seccional, 'ciudad', None):
        return _normalize_sede_value(seccional.ciudad)

    sede = getattr(usuario, 'sede', None)
    if sede and getattr(sede, 'seccional', None) and getattr(sede.seccional, 'ciudad', None):
        return _normalize_sede_value(sede.seccional.ciudad)

    return None


def _anexos_de_respuesta(ids_anexos, agente, sede):
    """
    Anexos que el RAG indicó para la respuesta. Se vuelven a consultar aquí (no se confía
    en lo que diga el RAG): deben ser del mismo agente y sede y estar activos.
    """
    if not ids_anexos:
        return []
    return list(
        AnexoRespuesta.objects.filter(
            id__in=ids_anexos,
            pregunta_respuesta__agente=agente,
            pregunta_respuesta__sede=sede,
            pregunta_respuesta__activo=True,
        ).order_by('id')
    )


def _registrar_uso_pregunta_sugerida(pregunta_sugerida_id, agente):
    # UPDATE atómico: con "leer, sumar y guardar" dos usos simultáneos contaban uno
    if pregunta_sugerida_id:
        PreguntaSugerida.objects.filter(id=pregunta_sugerida_id, agente=agente).update(
            contador_uso=F('contador_uso') + 1
        )


def _agentes_activos_json(sede_value=None):
    """Agentes activos disponibles en una seccional (sin seccional: solo los de «todas»)."""
    agentes = agentes_visibles(Agente.objects.filter(activo=True), sede_value).prefetch_related('preguntas')
    ids = ids_seccionales(sede_value)
    lst = []
    for agente in agentes:
        preguntas = agente.preguntas.filter(activo=True).filter(
            Q(seccional__isnull=True) | Q(seccional_id__in=ids)
        ).order_by('-contador_uso', 'orden')[:5]
        lst.append({
            'id': agente.id,
            'nombre': agente.nombre,
            'subtitulo': agente.subtitulo,
            'descripcion': agente.descripcion,
            'icono': agente.icono,
            'color': agente.color,
            'bgGradient': agente.bg_gradient,
            'activo': agente.activo,
            'mensajeBienvenida': agente.mensaje_bienvenida,
            'preguntasRapidas': [p.pregunta for p in preguntas]
        })
    return JsonResponse({'agentes': lst}, status=200)
