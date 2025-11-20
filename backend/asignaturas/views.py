from django.shortcuts import render
from .models import Asignatura
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Asignatura CRUD ----------
@csrf_exempt
def create_asignatura(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            codigo = data.get('codigo')
            creditos = data.get('creditos')
            if not nombre or not codigo or creditos is None:
                return JsonResponse({"error": "nombre, codigo y creditos son requeridos"}, status=400)
            a = Asignatura(nombre=nombre, codigo=codigo, creditos=int(creditos))
            a.save()
            return JsonResponse({"message": "Asignatura creada", "id": a.id}, status=201)
        except ValueError:
            return JsonResponse({"error": "creditos debe ser un entero"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_asignatura(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            a = Asignatura.objects.get(id=id)
            if 'nombre' in data:
                a.nombre = data.get('nombre')
            if 'codigo' in data:
                a.codigo = data.get('codigo')
            if 'creditos' in data:
                a.creditos = int(data.get('creditos'))
            a.save()
            return JsonResponse({"message": "Asignatura actualizada", "id": a.id}, status=200)
        except Asignatura.DoesNotExist:
            return JsonResponse({"error": "Asignatura no encontrada."}, status=404)
        except ValueError:
            return JsonResponse({"error": "creditos debe ser un entero"}, status=400)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_asignatura(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            a = Asignatura.objects.get(id=id)
            a.delete()
            return JsonResponse({"message": "Asignatura eliminada"}, status=200)
        except Asignatura.DoesNotExist:
            return JsonResponse({"error": "Asignatura no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_asignatura(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        a = Asignatura.objects.get(id=id)
        return JsonResponse({"id": a.id, "nombre": a.nombre, "codigo": a.codigo, "creditos": a.creditos}, status=200)
    except Asignatura.DoesNotExist:
        return JsonResponse({"error": "Asignatura no encontrada."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_asignaturas(request):
    if request.method == 'GET':
        items = Asignatura.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "codigo": i.codigo, "creditos": i.creditos} for i in items]
        return JsonResponse({"asignaturas": lst}, status=200)
