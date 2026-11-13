from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import PrestamoEspacio, PrestamoEspacioPublico
from instalaciones.espacios.models import EspacioFisico
from academico.horario.models import Horario
from mysite.auth_helpers import (
    SECCIONAL_PUBLICA_REQUERIDA, get_user_seccional_id, ve_todas_las_seccionales,
    seccional_publica,
)
import datetime

# ========== ENDPOINTS PARA USUARIOS PÚBLICOS ==========


@csrf_exempt
def list_espacios_disponibles_publico(request):
    """
    Lista espacios disponibles para una fecha y hora específica
    Filtrado por sede (opcional)
    Optimizado: usa consultas batch en lugar de N+1
    """
    if request.method == 'GET':
        try:
            fecha = request.GET.get('fecha')
            hora_inicio = request.GET.get('hora_inicio')
            hora_fin = request.GET.get('hora_fin')
            sede_id = request.GET.get('sede_id')

            if not all([fecha, hora_inicio, hora_fin]):
                return JsonResponse({
                    "error": "fecha, hora_inicio y hora_fin son requeridos"
                }, status=400)

            # Parsear fecha y horas una sola vez
            f = datetime.date.fromisoformat(fecha)
            hi = datetime.time.fromisoformat(hora_inicio)
            hf = datetime.time.fromisoformat(hora_fin)

            # Obtener todos los espacios (opcionalmente filtrados por sede)
            espacios_query = EspacioFisico.objects.select_related('tipo', 'sede')
            # Sin sesión, solo los espacios de la seccional que eligió el visitante; con sesión, los de la suya
            usuario = getattr(request, 'user_obj', None)
            if usuario is None:
                seccional_id = seccional_publica(request)
                if not seccional_id:
                    return JsonResponse(SECCIONAL_PUBLICA_REQUERIDA, status=400)
                espacios_query = espacios_query.filter(sede__seccional_id=seccional_id)
            elif not ve_todas_las_seccionales(usuario):
                espacios_query = espacios_query.filter(sede__seccional_id=get_user_seccional_id(usuario))
            if sede_id:
                espacios_query = espacios_query.filter(sede_id=sede_id)

            # Obtener IDs de espacios para consultas batch
            espacios_ids = list(espacios_query.values_list('id', flat=True))

            if not espacios_ids:
                return JsonResponse({"espacios": [], "total": 0}, status=200)

            # === CONSULTAS BATCH - Todas las conflictos en 3 queries ===

            # 1. Préstamos autenticados conflictivos
            prestamos_conflictivos = set(
                PrestamoEspacio.objects.filter(
                    espacio_id__in=espacios_ids,
                    fecha=f,
                    estado__in=['Pendiente', 'Aprobado'],
                    hora_inicio__lt=hf,
                    hora_fin__gt=hi
                ).values_list('espacio_id', flat=True)
            )

            # 2. Préstamos públicos conflictivos
            prestamos_publicos_conflictivos = set(
                PrestamoEspacioPublico.objects.filter(
                    espacio_id__in=espacios_ids,
                    fecha=f,
                    estado__in=['Pendiente', 'Aprobado'],
                    hora_inicio__lt=hf,
                    hora_fin__gt=hi
                ).values_list('espacio_id', flat=True)
            )

            # 3. Horarios académicos conflictivos
            dias_semana = {
                0: 'Lunes', 1: 'Martes', 2: 'Miércoles', 3: 'Jueves',
                4: 'Viernes', 5: 'Sábado', 6: 'Domingo'
            }
            dia_nombre = dias_semana[f.weekday()]

            horarios_conflictivos = set(
                Horario.objects.filter(
                    espacio_id__in=espacios_ids,
                    dia_semana__iexact=dia_nombre,
                    estado__in=['pendiente', 'aprobado'],
                    hora_inicio__lt=hf,
                    hora_fin__gt=hi
                ).values_list('espacio_id', flat=True)
            )

            # Unir todos los espacios ocupados
            espacios_ocupados = prestamos_conflictivos | prestamos_publicos_conflictivos | horarios_conflictivos

            # Filtrar espacios disponibles
            espacios_disponibles = []
            for espacio in espacios_query:
                if espacio.id not in espacios_ocupados:
                    espacios_disponibles.append({
                        "id": espacio.id,
                        "nombre": espacio.nombre,
                        "capacidad": espacio.capacidad,
                        "tipo": espacio.tipo.nombre,
                        "sede": espacio.sede.nombre,
                        "sede_id": espacio.sede.id,
                        "ubicacion": espacio.ubicacion
                    })

            return JsonResponse({
                "espacios": espacios_disponibles,
                "total": len(espacios_disponibles)
            }, status=200)

        except ValueError as e:
            return JsonResponse({"error": f"Formato inválido: {str(e)}"}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
    else:
        return JsonResponse({"error": "Método no permitido"}, status=405)
