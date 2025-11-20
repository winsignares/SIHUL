from django.shortcuts import render
from .models import Facultad
from django.http import JsonResponse
import json
from django.views.decorators.csrf import csrf_exempt

# ---------- Facultad CRUD ----------
@csrf_exempt
def create_facultad(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            nombre = data.get('nombre')
            activa = data.get('activa', True)
            if not nombre:
                return JsonResponse({"error": "El nombre es requerido"}, status=400)
            f = Facultad(nombre=nombre, activa=bool(activa))
            f.save()
            return JsonResponse({"message": "Facultad creada", "id": f.id}, status=201)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def update_facultad(request):
    if request.method == 'PUT':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            f = Facultad.objects.get(id=id)
            f.nombre = data.get('nombre', f.nombre)
            if 'activa' in data:
                f.activa = bool(data.get('activa'))
            f.save()
            return JsonResponse({"message": "Facultad actualizada", "id": f.id}, status=200)
        except Facultad.DoesNotExist:
            return JsonResponse({"error": "Facultad no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def delete_facultad(request):
    if request.method == 'DELETE':
        try:
            data = json.loads(request.body)
            id = data.get('id')
            if not id:
                return JsonResponse({"error": "ID es requerido"}, status=400)
            f = Facultad.objects.get(id=id)
            f.delete()
            return JsonResponse({"message": "Facultad eliminada"}, status=200)
        except Facultad.DoesNotExist:
            return JsonResponse({"error": "Facultad no encontrada."}, status=404)
        except json.JSONDecodeError:
            return JsonResponse({"error": "JSON inválido."}, status=400)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def get_facultad(request, id=None):
    if id is None:
        return JsonResponse({"error": "El ID es requerido en la URL"}, status=400)
    try:
        f = Facultad.objects.get(id=id)
        return JsonResponse({"id": f.id, "nombre": f.nombre, "activa": f.activa}, status=200)
    except Facultad.DoesNotExist:
        return JsonResponse({"error": "Facultad no encontrada."}, status=404)
    except Exception as e:
        return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def list_facultades(request):
    if request.method == 'GET':
        items = Facultad.objects.all()
        lst = [{"id": i.id, "nombre": i.nombre, "activa": i.activa} for i in items]
        return JsonResponse({"facultades": lst}, status=200)
