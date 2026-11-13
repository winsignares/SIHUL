"""Espacios disponibles para un horario."""
from ..models import EspacioFisico
from academico.horario.models import Horario
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from datetime import time
from ..api.filtros import _filtrar_espacios_por_sede_usuario


@csrf_exempt
def list_espacios_disponibles_por_horario(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Solo se permite GET"}, status=405)

    dia_semana = request.GET.get('dia_semana')
    hora_inicio_raw = request.GET.get('hora_inicio')
    hora_fin_raw = request.GET.get('hora_fin')
    horario_id = request.GET.get('horario_id')

    if not dia_semana or not hora_inicio_raw or not hora_fin_raw:
        return JsonResponse({"error": "dia_semana, hora_inicio y hora_fin son requeridos"}, status=400)

    try:
        hora_inicio = time.fromisoformat(hora_inicio_raw)
        hora_fin = time.fromisoformat(hora_fin_raw)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido"}, status=400)

    espacios_qs = EspacioFisico.objects.select_related('sede', 'tipo').filter(estado='Disponible')

    espacios_qs = _filtrar_espacios_por_sede_usuario(request, espacios_qs)

    horarios_conflicto = Horario.objects.filter(
        estado='aprobado',
        dia_semana__iexact=dia_semana,
        hora_inicio__lt=hora_fin,
        hora_fin__gt=hora_inicio,
    )

    if horario_id:
        try:
            horarios_conflicto = horarios_conflicto.exclude(id=int(horario_id))
        except (TypeError, ValueError):
            return JsonResponse({"error": "horario_id inválido"}, status=400)

    espacios_ocupados = horarios_conflicto.values_list('espacio_id', flat=True)
    espacios_disponibles = espacios_qs.exclude(id__in=espacios_ocupados)

    lst = []
    for espacio in espacios_disponibles:
        sede = espacio.sede
        seccional = sede.seccional if sede else None
        lst.append({
            "id": espacio.id,
            "nombre": espacio.nombre,
            "tipo": espacio.tipo.nombre if espacio.tipo else "Sin tipo",
            "capacidad": espacio.capacidad,
            "sede_id": sede.id if sede else None,
            "sede_nombre": sede.nombre if sede else "Sin sede",
            "sede_seccional_id": seccional.id if seccional else None,
            "sede_seccional_ciudad": seccional.ciudad if seccional else None,
            "ubicacion": espacio.ubicacion,
            "estado": espacio.estado,
            "esta_abierto": espacio.esta_abierto,
        })

    return JsonResponse({"espacios": lst}, status=200)
