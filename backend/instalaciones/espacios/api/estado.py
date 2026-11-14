from datetime import datetime, timedelta
import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..models import EspacioFisico
from academico.horario.models import Horario
from nucleo.auth_helpers import respuesta_sin_seccional as _missing_seccional_response
from .filtros import _usuario_puede_acceder_espacio, _usuario_sin_seccional, get_dia_semana_actual


@csrf_exempt
def get_estado_espacio(request, espacio_id=None):
    if espacio_id is None:
        return JsonResponse({'error': 'El espacio_id es requerido'}, status=400)

    if request.method == 'PUT':
        try:
            data = json.loads(request.body.decode('utf-8'))
            nuevo_estado = data.get('estado')

            estados_validos = ['Disponible', 'No Disponible', 'Mantenimiento']
            if nuevo_estado not in estados_validos:
                return JsonResponse({'error': f"Estado inválido. Debe ser uno de: {', '.join(estados_validos)}"}, status=400)

            if nuevo_estado == 'Disponible':
                ahora = datetime.now()
                hora_actual = ahora.time()
                hora_limite = (ahora + timedelta(hours=1)).time()
                dia_actual = get_dia_semana_actual()

                hay_clase_proxima_hora = Horario.objects.filter(
                    espacio_id=espacio_id,
                    dia_semana=dia_actual,
                    estado='aprobado',
                    hora_inicio__gte=hora_actual,
                    hora_inicio__lt=hora_limite,
                ).exists()

                if hay_clase_proxima_hora:
                    return JsonResponse(
                        {'error': 'No se puede cambiar a Disponible porque hay clases programadas en la próxima hora.'}, status=400
                    )

            espacio = EspacioFisico.objects.get(id=espacio_id)
            estado_anterior = espacio.estado
            espacio.estado = nuevo_estado
            espacio.save()

            return JsonResponse(
                {
                    'message': f"Estado del espacio '{espacio.nombre}' cambiado de '{estado_anterior}' a '{nuevo_estado}' correctamente",
                    'espacio_id': espacio.id,
                    'estado_anterior': estado_anterior,
                    'estado_nuevo': nuevo_estado,
                },
                status=200,
            )
        except EspacioFisico.DoesNotExist:
            return JsonResponse({'error': 'Espacio no encontrado'}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido en el body'}, status=400)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=500)

    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET o PUT'}, status=405)

    try:
        espacio = EspacioFisico.objects.get(id=espacio_id)

        if espacio.estado == 'Mantenimiento':
            return JsonResponse({'estado': 'mantenimiento', 'texto_estado': 'En Mantenimiento', 'proxima_clase': None}, status=200)

        ahora = datetime.now()
        hora_actual = ahora.time()
        dia_actual = get_dia_semana_actual()
        clases_hoy = Horario.objects.filter(espacio=espacio, dia_semana=dia_actual, estado='aprobado').select_related(
            'asignatura', 'docente', 'grupo'
        ).order_by('hora_inicio')

        estado_actual = 'disponible'
        texto_estado = 'Disponible'
        proxima_clase_data = None

        for clase in clases_hoy:
            if clase.hora_inicio <= hora_actual < clase.hora_fin:
                estado_actual = 'ocupado'
                texto_estado = 'Ocupado'
                proxima_clase_data = {
                    'asignatura': clase.asignatura.nombre,
                    'docente': clase.docente.nombre if clase.docente else 'Sin docente',
                    'hora_inicio': clase.hora_inicio.strftime('%H:%M'),
                    'hora_fin': clase.hora_fin.strftime('%H:%M'),
                    'grupo': clase.grupo.nombre,
                }
                break

            if clase.hora_inicio > hora_actual and proxima_clase_data is None:
                proxima_clase_data = {
                    'asignatura': clase.asignatura.nombre,
                    'docente': clase.docente.nombre if clase.docente else 'Sin docente',
                    'hora_inicio': clase.hora_inicio.strftime('%H:%M'),
                    'hora_fin': clase.hora_fin.strftime('%H:%M'),
                    'grupo': clase.grupo.nombre,
                }
                inicio_dt = datetime.combine(ahora.date(), clase.hora_inicio)
                if (inicio_dt - ahora).total_seconds() <= 3600:
                    texto_estado = f"Próxima clase a las {clase.hora_inicio.strftime('%H:%M')}"

        if estado_actual == 'disponible' and proxima_clase_data is None:
            texto_estado = 'Sin clases pendientes hoy'
        elif estado_actual == 'disponible' and proxima_clase_data:
            texto_estado = f"Próxima clase a las {proxima_clase_data['hora_inicio']}"

        return JsonResponse({'estado': estado_actual, 'texto_estado': texto_estado, 'proxima_clase': proxima_clase_data}, status=200)
    except EspacioFisico.DoesNotExist:
        return JsonResponse({'error': 'Espacio no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def get_horario_espacio(request, espacio_id=None):
    if request.method != 'GET':
        return JsonResponse({'error': 'Solo se permite GET'}, status=405)

    if espacio_id is None:
        return JsonResponse({'error': 'El espacio_id es requerido'}, status=400)

    try:
        if not EspacioFisico.objects.filter(id=espacio_id).exists():
            return JsonResponse({'error': 'Espacio no encontrado'}, status=404)

        if _usuario_sin_seccional(request):
            return _missing_seccional_response()

        if not _usuario_puede_acceder_espacio(request, espacio_id):
            return JsonResponse({'error': 'No tienes permiso para ver el horario de este espacio'}, status=403)

        horarios = Horario.objects.filter(espacio_id=espacio_id, estado='aprobado').select_related('asignatura', 'docente', 'grupo')
        lista_horarios = []
        for h in horarios:
            lista_horarios.append(
                {
                    'dia': h.dia_semana,
                    'hora_inicio': h.hora_inicio.hour,
                    'hora_fin': h.hora_fin.hour,
                    'materia': h.asignatura.nombre,
                    'docente': h.docente.nombre if h.docente else 'Sin docente',
                    'grupo': h.grupo.nombre,
                    'estado': 'ocupado',
                }
            )

        return JsonResponse({'horario': lista_horarios}, status=200)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def abrir_espacio(request, espacio_id=None):
    """Abre un espacio marcando esta_abierto en True."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Solo se permite POST'}, status=405)

    if espacio_id is None:
        return JsonResponse({'error': 'El espacio_id es requerido'}, status=400)

    try:
        if _usuario_sin_seccional(request):
            return _missing_seccional_response()

        if not _usuario_puede_acceder_espacio(request, espacio_id):
            return JsonResponse({'error': 'No tienes permiso para abrir este espacio'}, status=403)

        espacio = EspacioFisico.objects.get(id=espacio_id)
        espacio.esta_abierto = True
        espacio.save(update_fields=['esta_abierto'])

        return JsonResponse(
            {
                'message': f"Espacio '{espacio.nombre}' abierto correctamente",
                'espacio_id': espacio.id,
                'esta_abierto': espacio.esta_abierto,
            },
            status=200,
        )
    except EspacioFisico.DoesNotExist:
        return JsonResponse({'error': 'Espacio no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)


@csrf_exempt
def cerrar_espacio(request, espacio_id=None):
    """Cierra un espacio validando que no haya clase en curso."""
    if request.method != 'POST':
        return JsonResponse({'error': 'Solo se permite POST'}, status=405)

    if espacio_id is None:
        return JsonResponse({'error': 'El espacio_id es requerido'}, status=400)

    try:
        if _usuario_sin_seccional(request):
            return _missing_seccional_response()

        if not _usuario_puede_acceder_espacio(request, espacio_id):
            return JsonResponse({'error': 'No tienes permiso para cerrar este espacio'}, status=403)

        espacio = EspacioFisico.objects.get(id=espacio_id)

        ahora = datetime.now()
        hora_actual = ahora.time()
        dia_actual = get_dia_semana_actual()

        clase_en_curso = Horario.objects.filter(
            espacio_id=espacio_id,
            dia_semana=dia_actual,
            estado='aprobado',
            hora_inicio__lte=hora_actual,
            hora_fin__gt=hora_actual,
        ).exists()

        if clase_en_curso:
            return JsonResponse({'error': 'No se puede cerrar el espacio mientras hay una clase en curso'}, status=400)

        espacio.esta_abierto = False
        espacio.save(update_fields=['esta_abierto'])

        return JsonResponse(
            {
                'message': f"Espacio '{espacio.nombre}' cerrado correctamente",
                'espacio_id': espacio.id,
                'esta_abierto': espacio.esta_abierto,
            },
            status=200,
        )
    except EspacioFisico.DoesNotExist:
        return JsonResponse({'error': 'Espacio no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
