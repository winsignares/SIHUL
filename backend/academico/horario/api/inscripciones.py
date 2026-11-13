import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from identidad.usuarios.models import Usuario
from ..models import Horario, HorarioEstudiante



@csrf_exempt
def inscribir_estudiante(request):
    if request.method != 'POST':
        return JsonResponse({'error': 'Método no permitido'}, status=405)

    try:
        data = json.loads(request.body)
        usuario_id = data.get('usuario_id')
        horario_id = data.get('horario_id')

        if not usuario_id or not horario_id:
            return JsonResponse({'error': 'usuario_id y horario_id son requeridos'}, status=400)

        estudiante = Usuario.objects.get(id=usuario_id)
        horario = Horario.objects.get(id=horario_id)
        _, created = HorarioEstudiante.objects.get_or_create(estudiante=estudiante, horario=horario)

        if created:
            return JsonResponse({'message': 'Estudiante inscrito correctamente'}, status=201)
        return JsonResponse({'message': 'El estudiante ya estaba inscrito'}, status=200)

    except Usuario.DoesNotExist:
        return JsonResponse({'error': 'Estudiante no encontrado'}, status=404)
    except Horario.DoesNotExist:
        return JsonResponse({'error': 'Horario no encontrado'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)
