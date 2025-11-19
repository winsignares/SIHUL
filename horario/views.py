from django.shortcuts import render
from .models import Horario, HorarioFusionado
from grupos.models import Grupo
from asignaturas.models import Asignatura
from usuarios.models import Usuario
from espacios.models import EspacioFisico
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt
import datetime

# ---------- Horario CRUD ----------
@csrf_exempt
def create_horario(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        grupo_id = data.get('grupo_id')
        asignatura_id = data.get('asignatura_id')
        espacio_id = data.get('espacio_id')
        dia_semana = data.get('dia_semana')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        docente_id = data.get('docente_id')
        cantidad = data.get('cantidad_estudiantes')
        if not grupo_id or not asignatura_id or not espacio_id or not dia_semana or not hora_inicio or not hora_fin:
            return JsonResponse({"error": "Faltan campos requeridos"}, status=400)
        grupo = Grupo.objects.get(id=grupo_id)
        asignatura = Asignatura.objects.get(id=asignatura_id)
        espacio = EspacioFisico.objects.get(id=espacio_id)
        docente = Usuario.objects.get(id=docente_id) if docente_id else None
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)
        h = Horario(grupo=grupo, asignatura=asignatura, docente=docente, espacio=espacio, dia_semana=dia_semana, hora_inicio=hi, hora_fin=hf, cantidad_estudiantes=(int(cantidad) if cantidad is not None else None))
        h.save()
        return JsonResponse({"message": "Horario creado", "id": h.id}, status=201)
    except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido o valor numérico incorrecto."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_horario(request):
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        h = Horario.objects.get(id=id)
        if 'grupo_id' in data:
            h.grupo = Grupo.objects.get(id=data.get('grupo_id'))
        if 'asignatura_id' in data:
            h.asignatura = Asignatura.objects.get(id=data.get('asignatura_id'))
        if 'docente_id' in data:
            h.docente = Usuario.objects.get(id=data.get('docente_id')) if data.get('docente_id') else None
        if 'espacio_id' in data:
            h.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'dia_semana' in data:
            h.dia_semana = data.get('dia_semana')
        if 'hora_inicio' in data:
            h.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
        if 'hora_fin' in data:
            h.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
        if 'cantidad_estudiantes' in data:
            h.cantidad_estudiantes = int(data.get('cantidad_estudiantes')) if data.get('cantidad_estudiantes') is not None else None
        h.save()
        return JsonResponse({"message": "Horario actualizado", "id": h.id}, status=200)
    except Horario.DoesNotExist:
        return JsonResponse({"error": "Horario no encontrado."}, status=404)
    except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido o valor numérico incorrecto."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_horario(request):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        h = Horario.objects.get(id=id)
        h.delete()
        return JsonResponse({"message": "Horario eliminado"}, status=200)
    except Horario.DoesNotExist:
        return JsonResponse({"error": "Horario no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
 
@csrf_exempt
def get_horario(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        h = Horario.objects.get(id=id)
        return JsonResponse({
            "id": h.id,
            "grupo_id": h.grupo.id,
            "asignatura_id": h.asignatura.id,
            "docente_id": (h.docente.id if h.docente else None),
            "espacio_id": h.espacio.id,
            "dia_semana": h.dia_semana,
            "hora_inicio": str(h.hora_inicio),
            "hora_fin": str(h.hora_fin),
            "cantidad_estudiantes": h.cantidad_estudiantes
        }, status=200)
    except Horario.DoesNotExist:
        return JsonResponse({"error": "Horario no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_horarios(request):
    if request.method == 'GET':
        items = Horario.objects.all()
        lst = [{
            "id": i.id,
            "grupo_id": i.grupo.id,
            "asignatura_id": i.asignatura.id,
            "docente_id": (i.docente.id if i.docente else None),
            "espacio_id": i.espacio.id,
            "dia_semana": i.dia_semana,
            "hora_inicio": str(i.hora_inicio),
            "hora_fin": str(i.hora_fin),
            "cantidad_estudiantes": i.cantidad_estudiantes
        } for i in items]
        return JsonResponse({"horarios": lst}, status=200)

# ---------- HorarioFusionado CRUD ----------
# ---------- Horario_Fusionado CRUD ----------
@csrf_exempt
def create_horario_fusionado(request):
    if request.method != 'POST':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        grupo1_id = data.get('grupo1_id')
        grupo2_id = data.get('grupo2_id')
        grupo3_id = data.get('grupo3_id')
        asignatura_id = data.get('asignatura_id')
        espacio_id = data.get('espacio_id')
        dia_semana = data.get('dia_semana')
        hora_inicio = data.get('hora_inicio')
        hora_fin = data.get('hora_fin')
        docente_id = data.get('docente_id')
        cantidad = data.get('cantidad_estudiantes')
        comentario = data.get('comentario')
        if not grupo1_id or not grupo2_id or not asignatura_id or not espacio_id or not dia_semana or not hora_inicio or not hora_fin:
            return JsonResponse({"error": "Faltan campos requeridos"}, status=400)
        grupo1 = Grupo.objects.get(id=grupo1_id)
        grupo2 = Grupo.objects.get(id=grupo2_id)
        grupo3 = Grupo.objects.get(id=grupo3_id) if grupo3_id else None
        asignatura = Asignatura.objects.get(id=asignatura_id)
        espacio = EspacioFisico.objects.get(id=espacio_id)
        docente = Usuario.objects.get(id=docente_id) if docente_id else None
        hi = datetime.time.fromisoformat(hora_inicio)
        hf = datetime.time.fromisoformat(hora_fin)
        hfus = HorarioFusionado(grupo1=grupo1, grupo2=grupo2, grupo3=grupo3, asignatura=asignatura, docente=docente, espacio=espacio, dia_semana=dia_semana, hora_inicio=hi, hora_fin=hf, cantidad_estudiantes=(int(cantidad) if cantidad is not None else None), comentario=comentario)
        hfus.save()
        return JsonResponse({"message": "Horario fusionado creado", "id": hfus.id}, status=201)
    except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido o valor numérico incorrecto."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def update_horario_fusionado(request):
    if request.method != 'PUT':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        h = HorarioFusionado.objects.get(id=id)
        if 'grupo1_id' in data:
            h.grupo1 = Grupo.objects.get(id=data.get('grupo1_id'))
        if 'grupo2_id' in data:
            h.grupo2 = Grupo.objects.get(id=data.get('grupo2_id'))
        if 'grupo3_id' in data:
            h.grupo3 = Grupo.objects.get(id=data.get('grupo3_id')) if data.get('grupo3_id') else None
        if 'asignatura_id' in data:
            h.asignatura = Asignatura.objects.get(id=data.get('asignatura_id'))
        if 'docente_id' in data:
            h.docente = Usuario.objects.get(id=data.get('docente_id')) if data.get('docente_id') else None
        if 'espacio_id' in data:
            h.espacio = EspacioFisico.objects.get(id=data.get('espacio_id'))
        if 'dia_semana' in data:
            h.dia_semana = data.get('dia_semana')
        if 'hora_inicio' in data:
            h.hora_inicio = datetime.time.fromisoformat(data.get('hora_inicio'))
        if 'hora_fin' in data:
            h.hora_fin = datetime.time.fromisoformat(data.get('hora_fin'))
        if 'cantidad_estudiantes' in data:
            h.cantidad_estudiantes = int(data.get('cantidad_estudiantes')) if data.get('cantidad_estudiantes') is not None else None
        if 'comentario' in data:
            h.comentario = data.get('comentario')
        h.save()
        return JsonResponse({"message": "Horario fusionado actualizado", "id": h.id}, status=200)
    except HorarioFusionado.DoesNotExist:
        return JsonResponse({"error": "Horario fusionado no encontrado."}, status=404)
    except (Grupo.DoesNotExist, Asignatura.DoesNotExist, EspacioFisico.DoesNotExist, Usuario.DoesNotExist):
        return JsonResponse({"error": "Relacionada no encontrada."}, status=404)
    except ValueError:
        return JsonResponse({"error": "Formato de hora inválido o valor numérico incorrecto."}, status=400)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def delete_horario_fusionado(request):
    if request.method != 'DELETE':
        return JsonResponse({"error": "Método no permitido"}, status=405)
    try:
        data = json.loads(request.body)
        id = data.get('id')
        if not id:
            return JsonResponse({"error": "ID es requerido"}, status=400)
        h = HorarioFusionado.objects.get(id=id)
        h.delete()
        return JsonResponse({"message": "Horario fusionado eliminado"}, status=200)
    except HorarioFusionado.DoesNotExist:
        return JsonResponse({"error": "Horario fusionado no encontrado."}, status=404)
    except json.JSONDecodeError:
        return JsonResponse({"error": "JSON inválido."}, status=400)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)
    
@csrf_exempt
def get_horario_fusionado(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        h = HorarioFusionado.objects.get(id=id)
        return JsonResponse({
            "id": h.id,
            "grupo1_id": h.grupo1.id,
            "grupo2_id": h.grupo2.id,
            "grupo3_id": (h.grupo3.id if h.grupo3 else None),
            "asignatura_id": h.asignatura.id,
            "docente_id": (h.docente.id if h.docente else None),
            "espacio_id": h.espacio.id,
            "dia_semana": h.dia_semana,
            "hora_inicio": str(h.hora_inicio),
            "hora_fin": str(h.hora_fin),
            "cantidad_estudiantes": h.cantidad_estudiantes,
            "comentario": h.comentario
        }, status=200)
    except HorarioFusionado.DoesNotExist:
        return JsonResponse({"error": "Horario fusionado no encontrado."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

def list_horarios_fusionados(request):
    if request.method == 'GET':
        items = HorarioFusionado.objects.all()
        lst = [{
            "id": i.id,
            "grupo1_id": i.grupo1.id,
            "grupo2_id": i.grupo2.id,
            "grupo3_id": (i.grupo3.id if i.grupo3 else None),
            "asignatura_id": i.asignatura.id,
            "docente_id": (i.docente.id if i.docente else None),
            "espacio_id": i.espacio.id,
            "dia_semana": i.dia_semana,
            "hora_inicio": str(i.hora_inicio),
            "hora_fin": str(i.hora_fin),
            "cantidad_estudiantes": i.cantidad_estudiantes,
            "comentario": i.comentario
        } for i in items]
        return JsonResponse({"horarios_fusionados": lst}, status=200)

